import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { installPreCommitGuard, uninstallPreCommitGuard, checkPreCommitGuard } from "../src/core/guard.ts";
import { createTrackWorktree, listTrackWorktrees, removeTrackWorktree } from "../src/core/worktree.ts";

describe("Pre-Commit Guard and Isolated Worktree Sandbox", () => {
  let tempRepo: string;

  beforeEach(() => {
    tempRepo = mkdtempSync(join(tmpdir(), "conductor-guard-test-"));
    execSync("git init -b main", { cwd: tempRepo });
    execSync('git config user.name "Conductor Test"', { cwd: tempRepo });
    execSync('git config user.email "test@conductor.local"', { cwd: tempRepo });
    execSync('git commit --allow-empty -m "Initial commit"', { cwd: tempRepo });
  });

  afterEach(() => {
    rmSync(tempRepo, { recursive: true, force: true });
  });

  describe("Pre-Commit Guard", () => {
    it("should install, check, and uninstall git pre-commit hook", () => {
      const hookPath = join(tempRepo, ".git", "hooks", "pre-commit");

      // 1. Install
      const installResult = installPreCommitGuard(tempRepo);
      expect(installResult.installed).toBe(true);
      expect(existsSync(hookPath)).toBe(true);
      const hookContent = readFileSync(hookPath, "utf-8");
      expect(hookContent).toContain("conductor guard check");

      // Idempotent install
      const reinstall = installPreCommitGuard(tempRepo);
      expect(reinstall.already_installed).toBe(true);

      // 2. Check
      const checkResult = checkPreCommitGuard(tempRepo);
      expect(checkResult.valid).toBeDefined();

      // 3. Uninstall
      const uninstallResult = uninstallPreCommitGuard(tempRepo);
      expect(uninstallResult.uninstalled).toBe(true);
      if (existsSync(hookPath)) {
        const remaining = readFileSync(hookPath, "utf-8");
        expect(remaining).not.toContain("conductor guard check");
      }
    });
  });

  describe("Isolated Worktree Sandbox", () => {
    it("should create, list, and remove an isolated worktree for a track", () => {
      const trackId = "test_feature_20261014";

      // 1. Create
      const created = createTrackWorktree(tempRepo, trackId);
      expect(created.track_id).toBe(trackId);
      expect(created.branch).toBe(`track/${trackId}`);
      expect(existsSync(created.worktree_path)).toBe(true);

      // 2. List
      const worktrees = listTrackWorktrees(tempRepo);
      expect(worktrees.length).toBeGreaterThan(0);
      const found = worktrees.find((w) => w.track_id === trackId);
      expect(found).toBeDefined();
      expect(found?.branch).toBe(`track/${trackId}`);

      // 3. Remove
      const removed = removeTrackWorktree(tempRepo, trackId);
      expect(removed.removed).toBe(true);
      expect(existsSync(created.worktree_path)).toBe(false);

      const afterRemove = listTrackWorktrees(tempRepo);
      expect(afterRemove.find((w) => w.track_id === trackId)).toBeUndefined();
    });
  });
});
