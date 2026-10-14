import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AdrRepository } from "../src/core/adr_repository.ts";

describe("AdrRepository Core Seam", () => {
  let tempRepo: string;

  beforeEach(() => {
    tempRepo = mkdtempSync(join(tmpdir(), "conductor-adr-test-"));
    mkdirSync(join(tempRepo, "conductor"), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempRepo, { recursive: true, force: true });
  });

  it("should initialize index and scaffold sequentially numbered MADR files", () => {
    const repo = new AdrRepository(tempRepo);
    expect(repo.listAdrs().length).toBe(0);

    const adr1 = repo.initAdr("Adopt TypeScript and Bun Core", {
      status: "accepted",
      context: "Need faster startup and single unified runtime.",
      trackId: "track_001",
    });

    expect(adr1.number).toBe(1);
    expect(adr1.file).toBe("conductor/adrs/0001-adopt-typescript-and-bun-core.md");
    expect(existsSync(join(tempRepo, adr1.file))).toBe(true);

    const content = readFileSync(join(tempRepo, adr1.file), "utf-8");
    expect(content).toContain("# ADR 0001: Adopt TypeScript and Bun Core");
    expect(content).toContain("## Status\naccepted");
    expect(content).toContain("track_001");

    // Index file must exist and list ADR 0001
    const indexPath = join(tempRepo, "conductor", "adrs", "index.md");
    expect(existsSync(indexPath)).toBe(true);
    const indexContent = readFileSync(indexPath, "utf-8");
    expect(indexContent).toContain("Adopt TypeScript and Bun Core");
    expect(indexContent).toContain("0001");

    // Create second ADR
    const adr2 = repo.initAdr("Deterministic Review Auditor Seam", {
      status: "proposed",
    });
    expect(adr2.number).toBe(2);
    expect(adr2.file).toBe("conductor/adrs/0002-deterministic-review-auditor-seam.md");

    const list = repo.listAdrs();
    expect(list.length).toBe(2);
    expect(list[0].title).toBe("Adopt TypeScript and Bun Core");
    expect(list[1].title).toBe("Deterministic Review Auditor Seam");
  });

  it("should link a track to an existing ADR", () => {
    const repo = new AdrRepository(tempRepo);
    const adr = repo.initAdr("Use SQLite Storage", { status: "accepted" });

    const linked = repo.linkAdr(1, "track_sqlite_migration");
    expect(linked).toBe(true);

    const content = readFileSync(join(tempRepo, adr.file), "utf-8");
    expect(content).toContain("track_sqlite_migration");

    const updatedList = repo.listAdrs();
    expect(updatedList[0].linked_tracks).toContain("track_sqlite_migration");
  });
});
