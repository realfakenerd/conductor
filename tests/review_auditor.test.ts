import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { ReviewAuditor, type ReviewAuditResult } from "../src/core/review_auditor.ts";
import { attachGitNote } from "../src/core/git_notes.ts";

describe("ReviewAuditor Core Seam", () => {
  let tempRepo: string;

  beforeEach(() => {
    tempRepo = mkdtempSync(join(tmpdir(), "conductor-review-test-"));
    execSync("git init -b main", { cwd: tempRepo });
    execSync('git config user.name "Conductor Test"', { cwd: tempRepo });
    execSync('git config user.email "test@conductor.local"', { cwd: tempRepo });
    execSync('git commit --allow-empty -m "Initial commit"', { cwd: tempRepo });

    // Scaffold minimal conductor directory
    mkdirSync(join(tempRepo, "conductor"), { recursive: true });
    writeFileSync(
      join(tempRepo, "conductor", "index.md"),
      "# Handshake\n- [Tracks](./tracks.md)\n- [Product](./product.md)\n"
    );
    writeFileSync(join(tempRepo, "conductor", "product.md"), "# Product\n");
    writeFileSync(
      join(tempRepo, "conductor", "tracks.md"),
      `# Tracks Registry\n\n---
- [~] **Track: Test Track**
  *Link: [./tracks/test_track_20261014/index.md](./tracks/test_track_20261014/index.md)*
`
    );

    const trackDir = join(tempRepo, "conductor", "tracks", "test_track_20261014");
    mkdirSync(trackDir, { recursive: true });
    writeFileSync(
      join(trackDir, "metadata.json"),
      JSON.stringify({ track_id: "test_track_20261014", title: "Test Track", status: "in_progress" }, null, 2)
    );
  });

  afterEach(() => {
    rmSync(tempRepo, { recursive: true, force: true });
  });

  it("should fail validation if completed tasks lack commit SHAs or notes", () => {
    const trackDir = join(tempRepo, "conductor", "tracks", "test_track_20261014");
    writeFileSync(
      join(trackDir, "plan.md"),
      `# Plan: Test Track\n\n## Phase 1: Core\n- [x] Task: Implement feature without sha\n`
    );

    const auditor = new ReviewAuditor(tempRepo);
    const result = auditor.audit("test_track_20261014", { skipTests: true });

    expect(result.valid).toBe(false);
    expect(result.plan_compliance.missing_shas.length).toBeGreaterThan(0);
    expect(result.plan_compliance.completed_tasks).toBe(1);
  });

  it("should pass validation when tasks have valid SHAs, git notes, and tests pass", () => {
    // Make a commit in git
    writeFileSync(join(tempRepo, "src.txt"), "hello world\n");
    execSync("git add src.txt", { cwd: tempRepo });
    execSync('git commit -m "feat: add feature"', { cwd: tempRepo });
    const sha = execSync("git rev-parse HEAD", { cwd: tempRepo }).toString().trim();

    // Attach verification note
    attachGitNote(sha, "Task 1", "Feature implemented successfully", "src.txt", tempRepo);

    const trackDir = join(tempRepo, "conductor", "tracks", "test_track_20261014");
    writeFileSync(
      join(trackDir, "plan.md"),
      `# Plan: Test Track\n\n## Phase 1: Core\n- [x] Task: Implement feature [${sha.slice(0, 7)}]\n`
    );

    const auditor = new ReviewAuditor(tempRepo);
    const result = auditor.audit("test_track_20261014", {
      testCommand: "true", // simulated passing test
    });

    expect(result.valid).toBe(true);
    expect(result.plan_compliance.completed_tasks).toBe(1);
    expect(result.plan_compliance.missing_shas.length).toBe(0);
    expect(result.plan_compliance.missing_notes.length).toBe(0);
    expect(result.test_suite.passed).toBe(true);
    expect(result.diff_summary.files_changed).toContain("src.txt");
  });

  it("should flag test suite failures properly", () => {
    const trackDir = join(tempRepo, "conductor", "tracks", "test_track_20261014");
    writeFileSync(
      join(trackDir, "plan.md"),
      `# Plan: Test Track\n\n## Phase 1: Core\n- [ ] Task: Pending task\n`
    );

    const auditor = new ReviewAuditor(tempRepo);
    const result = auditor.audit("test_track_20261014", {
      testCommand: "false", // simulated failing test
    });

    expect(result.valid).toBe(false);
    expect(result.test_suite.passed).toBe(false);
  });
});
