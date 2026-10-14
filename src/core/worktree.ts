import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { EngineError } from "./types.ts";

export interface TrackWorktreeInfo {
  track_id: string;
  branch: string;
  worktree_path: string;
}

export interface RemoveWorktreeResult {
  track_id: string;
  removed: boolean;
}

export function getWorktreeBaseDir(rootDir: string = "."): string {
  return join(rootDir, ".conductor", "worktrees");
}

export function createTrackWorktree(rootDir: string = ".", trackId: string): TrackWorktreeInfo {
  if (!trackId || !/^[a-zA-Z0-9_-]+$/.test(trackId)) {
    throw new EngineError(`Invalid track_id: '${trackId}'`);
  }

  const baseDir = getWorktreeBaseDir(rootDir);
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true });
  }

  const worktreePath = join(baseDir, trackId);
  const branchName = `track/${trackId}`;

  if (existsSync(worktreePath)) {
    throw new EngineError(`Worktree path '${worktreePath}' already exists`);
  }

  try {
    execSync(`git worktree add -B "${branchName}" "${worktreePath}"`, {
      cwd: rootDir,
      stdio: "pipe",
    });
  } catch (err: any) {
    throw new EngineError(`Failed to create git worktree: ${err?.stderr?.toString() || err?.message}`);
  }

  return {
    track_id: trackId,
    branch: branchName,
    worktree_path: worktreePath,
  };
}

export function listTrackWorktrees(rootDir: string = "."): TrackWorktreeInfo[] {
  let output = "";
  try {
    output = execSync("git worktree list --porcelain", {
      cwd: rootDir,
      stdio: "pipe",
      encoding: "utf-8",
    });
  } catch {
    return [];
  }

  const baseDir = getWorktreeBaseDir(rootDir);
  const results: TrackWorktreeInfo[] = [];

  const blocks = output.split("\n\n");
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    let currentPath = "";
    let currentBranch = "";

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        currentPath = line.substring(9).trim();
      } else if (line.startsWith("branch ")) {
        currentBranch = line.substring(7).replace(/^refs\/heads\//, "").trim();
      }
    }

    if (currentPath.includes(baseDir) || currentBranch.startsWith("track/")) {
      const parts = currentPath.split("/");
      const trackId = parts[parts.length - 1];
      results.push({
        track_id: trackId,
        branch: currentBranch || `track/${trackId}`,
        worktree_path: currentPath,
      });
    }
  }

  return results;
}

export function removeTrackWorktree(rootDir: string = ".", trackId: string): RemoveWorktreeResult {
  const baseDir = getWorktreeBaseDir(rootDir);
  const worktreePath = join(baseDir, trackId);

  try {
    execSync(`git worktree remove --force "${worktreePath}"`, {
      cwd: rootDir,
      stdio: "pipe",
    });
  } catch {
    // If git worktree command failed, remove directory directly and prune
    if (existsSync(worktreePath)) {
      rmSync(worktreePath, { recursive: true, force: true });
    }
    try {
      execSync("git worktree prune", { cwd: rootDir, stdio: "pipe" });
    } catch {
      // Ignore prune errors
    }
  }

  return {
    track_id: trackId,
    removed: true,
  };
}
