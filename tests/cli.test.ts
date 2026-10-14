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

    // 8. ADR init, list, link
    const adrInitRes = spawnSync(
      "bun",
      ["run", cliPath, "adr", "init", "Test Architecture Decision", "--status", "accepted", "--root-dir", root],
      { encoding: "utf-8" }
    );
    expect(adrInitRes.status).toBe(0);
    const adrData = JSON.parse(adrInitRes.stdout);
    expect(adrData.number).toBe(1);

    const adrLinkRes = spawnSync(
      "bun",
      ["run", cliPath, "adr", "link", "1", "--track", "t_cli", "--root-dir", root],
      { encoding: "utf-8" }
    );
    expect(adrLinkRes.status).toBe(0);

    const adrListRes = spawnSync(
      "bun",
      ["run", cliPath, "adr", "list", "--root-dir", root, "--json"],
      { encoding: "utf-8" }
    );
    expect(adrListRes.status).toBe(0);
    const adrList = JSON.parse(adrListRes.stdout);
    expect(adrList.length).toBe(1);
    expect(adrList[0].linked_tracks).toContain("t_cli");

    // 9. Agent list, sync, validate
    mkdirSync(join(root, "agents"), { recursive: true });
    writeFileSync(
      join(root, "agents", "mock-agent.md"),
      `---\nname: mock-agent\ndescription: Mock Agent\ncapabilities:\n  - read\n  - write\n---\nPrompt\n`
    );

    const agentListRes = spawnSync(
      "bun",
      ["run", cliPath, "agent", "list", "--root-dir", root, "--json"],
      { encoding: "utf-8" }
    );
    expect(agentListRes.status).toBe(0);
    const agentList = JSON.parse(agentListRes.stdout);
    expect(agentList.length).toBe(1);
    expect(agentList[0].name).toBe("mock-agent");

    const agentSyncRes = spawnSync(
      "bun",
      ["run", cliPath, "agent", "sync", "--host", "antigravity", "--root-dir", root],
      { encoding: "utf-8" }
    );
    expect(agentSyncRes.status).toBe(0);
    const agentSync = JSON.parse(agentSyncRes.stdout);
    expect(agentSync.synced.length).toBe(1);
    expect(agentSync.synced[0].tools).toContain("view_file");

    const agentValRes = spawnSync(
      "bun",
      ["run", cliPath, "agent", "validate", "--root-dir", root],
      { encoding: "utf-8" }
    );
    expect(agentValRes.status).toBe(0);
    expect(JSON.parse(agentValRes.stdout).valid).toBe(true);
  });
});
