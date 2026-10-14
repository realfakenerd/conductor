import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

describe("Bun CLI Runner", () => {
  const cliPath = join(process.cwd(), "src/cli/index.ts");

  it("should run verify, resume, track lifecycle and resolve subcommands via CLI", () => {
    const root = mkdtempSync(join(tmpdir(), "cond-cli-test-"));
    const conductorDir = join(root, "conductor");
    mkdirSync(conductorDir, { recursive: true });

    // 1. Verify before index.md -> invalid
    const verifyBefore = spawnSync("bun", ["run", cliPath, "verify", "--root-dir", root], {
      encoding: "utf-8",
    });
    expect(verifyBefore.status).toBe(0);
    const verifyData = JSON.parse(verifyBefore.stdout);
    expect(verifyData.valid).toBe(false);

    // 2. Setup minimal index.md
    writeFileSync(join(conductorDir, "product.md"), "# Product");
    writeFileSync(join(conductorDir, "index.md"), "# Index\n[Product](./product.md)");

    const verifyAfter = spawnSync("bun", ["run", cliPath, "verify", "--root-dir", root], {
      encoding: "utf-8",
    });
    expect(verifyAfter.status).toBe(0);
    expect(JSON.parse(verifyAfter.stdout).valid).toBe(true);

    // 3. Track init
    const initRes = spawnSync(
      "bun",
      ["run", cliPath, "track", "init", "t_cli", "--type", "feature", "--description", "CLI Test Track", "--root-dir", root],
      { encoding: "utf-8" }
    );
    expect(initRes.status).toBe(0);
    expect(JSON.parse(initRes.stdout).track_id).toBe("t_cli");

    // 4. Track resolve
    const resolveRes = spawnSync("bun", ["run", cliPath, "track", "resolve", "--query", "cli", "--root-dir", root, "--json"], {
      encoding: "utf-8",
    });
    expect(resolveRes.status).toBe(0);
    const resolveData = JSON.parse(resolveRes.stdout);
    expect(resolveData.status).toBe("matched");
    expect(resolveData.track.track_id).toBe("t_cli");

    // 5. Track start
    const startRes = spawnSync("bun", ["run", cliPath, "track", "start", "t_cli", "--root-dir", root], {
      encoding: "utf-8",
    });
    expect(startRes.status).toBe(0);
    expect(JSON.parse(startRes.stdout).status).toBe("in_progress");

    // 6. Track status
    const statusRes = spawnSync("bun", ["run", cliPath, "status", "--root-dir", root, "--json"], {
      encoding: "utf-8",
    });
    expect(statusRes.status).toBe(0);
    expect(JSON.parse(statusRes.stdout).tracks.in_progress).toBe(1);

    // 7. Review check
    writeFileSync(join(conductorDir, "tracks", "t_cli", "plan.md"), "# Plan\n- [ ] Task: Task 1\n");
    const reviewRes = spawnSync(
      "bun",
      ["run", cliPath, "review", "check", "--track", "t_cli", "--skip-tests", "--root-dir", root, "--json"],
      { encoding: "utf-8" }
    );
    expect(reviewRes.status).toBe(0);
    const reviewData = JSON.parse(reviewRes.stdout);
    expect(reviewData.valid).toBe(true);
    expect(reviewData.track_id).toBe("t_cli");
  });
});
