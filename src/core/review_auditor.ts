import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TrackRepository } from "./track_repository.ts";
import { PlanDocument } from "./plan_document.ts";
import { EngineError } from "./types.ts";

export interface ReviewAuditResult {
  valid: boolean;
  track_id: string;
  plan_compliance: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    missing_shas: string[];
    missing_notes: string[];
  };
  test_suite: {
    passed: boolean;
    command: string;
    output: string;
  };
  diff_summary: {
    files_changed: string[];
    insertions: number;
    deletions: number;
  };
}

export interface ReviewAuditOptions {
  skipTests?: boolean;
  testCommand?: string;
}

export class ReviewAuditor {
  private rootDir: string;

  constructor(rootDir: string = ".") {
    this.rootDir = rootDir;
  }

  audit(trackId?: string | null, options: ReviewAuditOptions = {}): ReviewAuditResult {
    const repo = new TrackRepository(this.rootDir);
    let targetTrackId = trackId;

    if (!targetTrackId) {
      const tracks = repo.listTracks();
      const active = tracks.find((t) => t.status === "in_progress") || tracks.find((t) => t.status === "new" || t.status === "pending");
      if (!active) {
        throw new EngineError("No active track found to audit.");
      }
      targetTrackId = active.track_id;
    }

    const planPath = join(this.rootDir, "conductor", "tracks", targetTrackId, "plan.md");
    if (!existsSync(planPath)) {
      throw new EngineError(`Plan file not found for track ${targetTrackId}: ${planPath}`);
    }

    const planDoc = PlanDocument.fromFile(planPath);
    const planSummary = planDoc.summary();

    const missingShas: string[] = [];
    const missingNotes: string[] = [];
    const validShas: string[] = [];

    // Parse each completed task from raw lines to extract sha
    const completedTaskRegex = /^-\s*\[x\]\s*Task:\s*(.*?)(?:\s*\[([a-f0-9]{7,40})\])?\s*$/;

    for (const line of planDoc.lines) {
      const trimmed = line.trim();
      const m = completedTaskRegex.exec(trimmed);
      if (m) {
        const taskName = m[1].trim();
        const sha = m[2];

        if (!sha) {
          missingShas.push(`Task: '${taskName}' has no recorded commit SHA`);
        } else {
          // Check if commit exists in git
          const commitCheck = spawnSync("git", ["cat-file", "-e", `${sha}^{commit}`], {
            cwd: this.rootDir,
          });
          if (commitCheck.status !== 0) {
            missingShas.push(`Task: '${taskName}' recorded non-existent commit SHA: ${sha}`);
          } else {
            validShas.push(sha);
            // Check git notes
            const notesCheck = spawnSync("git", ["notes", "show", sha], {
              cwd: this.rootDir,
            });
            if (notesCheck.status !== 0) {
              missingNotes.push(`Task: '${taskName}' [${sha.slice(0, 7)}] has no attached git note`);
            }
          }
        }
      }
    }

    // Diff summary
    const diffSummary = {
      files_changed: [] as string[],
      insertions: 0,
      deletions: 0,
    };

    if (validShas.length > 0) {
      const firstSha = validShas[0];
      const lastSha = validShas[validShas.length - 1];
      
      let baseRevision = `${firstSha}~1`;
      // Check if firstSha has a parent
      const parentCheck = spawnSync("git", ["rev-parse", "--verify", `${firstSha}~1`], {
        cwd: this.rootDir,
      });
      if (parentCheck.status !== 0) {
        // Root commit, compare against empty tree
        const emptyTree = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
        baseRevision = emptyTree;
      }

      const diffProc = spawnSync("git", ["diff", "--numstat", `${baseRevision}..${lastSha}`, "--", ".", ":!conductor"], {
        cwd: this.rootDir,
        encoding: "utf-8",
      });

      if (diffProc.status === 0 && diffProc.stdout) {
        for (const line of diffProc.stdout.trim().split("\n")) {
          const parts = line.split("\t");
          if (parts.length >= 3) {
            const ins = parseInt(parts[0], 10) || 0;
            const del = parseInt(parts[1], 10) || 0;
            const file = parts[2].trim();
            if (file) {
              diffSummary.files_changed.push(file);
              diffSummary.insertions += ins;
              diffSummary.deletions += del;
            }
          }
        }
      }
    }

    // Test runner execution
    let testPassed = true;
    let testCommand = options.testCommand || "bun test";
    let testOutput = "";

    if (options.skipTests) {
      testCommand = "skipped";
      testOutput = "Test execution skipped via options";
    } else {
      const testProc = spawnSync(testCommand, {
        cwd: this.rootDir,
        shell: true,
        encoding: "utf-8",
      });
      testPassed = testProc.status === 0;
      testOutput = (testProc.stdout || "") + (testProc.stderr || "");
    }

    const isValid = missingShas.length === 0 && missingNotes.length === 0 && testPassed;

    return {
      valid: isValid,
      track_id: targetTrackId,
      plan_compliance: {
        total_tasks: planSummary.total_tasks,
        completed_tasks: planSummary.completed_tasks,
        pending_tasks: planSummary.pending_tasks,
        missing_shas: missingShas,
        missing_notes: missingNotes,
      },
      test_suite: {
        passed: testPassed,
        command: testCommand,
        output: testOutput.slice(0, 2000),
      },
      diff_summary: diffSummary,
    };
  }
}
