#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join } from "node:path";
import { TrackRepository } from "../core/track_repository.ts";
import { PlanDocument } from "../core/plan_document.ts";
import { IntegrityAuditor } from "../core/integrity_auditor.ts";
import { determineResumption } from "../core/resume.ts";
import { attachGitNote, attachPhaseCheckpointNote } from "../core/git_notes.ts";
import { installPreCommitGuard, uninstallPreCommitGuard, checkPreCommitGuard } from "../core/guard.ts";
import { createTrackWorktree, listTrackWorktrees, removeTrackWorktree } from "../core/worktree.ts";

function getProjectStatus(rootDir: string = ".", trackId?: string | null) {
  const repo = new TrackRepository(rootDir);
  const tracks = repo.listTracks();
  const totalTracks = tracks.length;
  const completedTracks = tracks.filter((t) => t.status === "complete").length;
  const inProgressTracks = tracks.filter((t) => t.status === "in_progress").length;
  const pendingTracks = tracks.filter((t) => t.status === "new" || t.status === "pending").length;

  let activeTarget = null;
  if (trackId) {
    activeTarget = tracks.find((t) => t.track_id === trackId) || null;
  } else if (inProgressTracks > 0) {
    activeTarget = tracks.find((t) => t.status === "in_progress") || null;
  } else if (pendingTracks > 0) {
    activeTarget = tracks.find((t) => t.status === "new" || t.status === "pending") || null;
  }

  let activeSummary = null;
  if (activeTarget) {
    const tid = activeTarget.track_id;
    const planFile = join(rootDir, "conductor", "tracks", tid, "plan.md");
    if (existsSync(planFile)) {
      const planDoc = PlanDocument.fromFile(planFile);
      const planData = planDoc.summary();
      activeSummary = {
        track_id: tid,
        title: activeTarget.title,
        status: activeTarget.status,
        current_phase: planData.current_phase,
        current_task: planData.current_task,
        next_pending_task: planData.next_pending_task,
        total_tasks: planData.total_tasks,
        completed_tasks: planData.completed_tasks,
        in_progress_tasks: planData.in_progress_tasks,
        pending_tasks: planData.pending_tasks,
        progress_percent: planData.progress_percent,
      };
    }
  }

  return {
    timestamp: new Date().toISOString(),
    tracks: {
      total: totalTracks,
      complete: completedTracks,
      in_progress: inProgressTracks,
      pending: pendingTracks,
    },
    active_track: activeSummary,
  };
}

export function parseArgs(args: string[]) {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

export async function runCli(argv: string[]) {
  const { flags, positional } = parseArgs(argv);
  const rootDir = (flags["root-dir"] as string) || ".";
  const jsonMode = Boolean(flags["json"]);
  const command = positional[0];

  if (!command) {
    console.log("Usage: conductor <command> [options]");
    console.log("Commands: resume, verify, status, list, track, note");
    process.exit(0);
  }

  if (command === "resume") {
    const res = determineResumption(rootDir);
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (command === "verify") {
    const fast = Boolean(flags["fast"]);
    const auditor = new IntegrityAuditor(rootDir);
    const res = auditor.audit(fast);
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (command === "list") {
    const repo = new TrackRepository(rootDir);
    const tracks = repo.listTracks();
    if (jsonMode) {
      console.log(JSON.stringify(tracks, null, 2));
    } else {
      if (tracks.length === 0) {
        console.log("No registered tracks found.");
      } else {
        console.log("Registered Tracks:");
        for (const t of tracks) {
          const marker = t.status === "complete" ? "[x]" : t.status === "in_progress" ? "[~]" : "[ ]";
          console.log(`- ${marker} ${t.track_id}: ${t.title} (${t.status})`);
        }
      }
    }
    return;
  }

  if (command === "status") {
    const trackId = (flags["track"] as string) || null;
    const verbose = Boolean(flags["verbose"]);
    const status = getProjectStatus(rootDir, trackId);

    if (jsonMode) {
      console.log(JSON.stringify(status, null, 2));
    } else if (verbose) {
      const t = status.tracks;
      console.log(`Project Status Overview (${status.timestamp})`);
      console.log(`Tracks: ${t.total} total (${t.complete} complete, ${t.in_progress} in_progress, ${t.pending} pending)`);
      const at = status.active_track;
      if (at) {
        console.log(`\nActive Track: ${at.track_id} - ${at.title} [${at.status}]`);
        console.log(`Progress: ${at.completed_tasks}/${at.total_tasks} tasks complete (${at.progress_percent}%)`);
        if (at.current_task) console.log(`Current Task: ${at.current_task} (Phase: ${at.current_phase})`);
        if (at.next_pending_task) console.log(`Next Pending: ${at.next_pending_task}`);
      } else {
        console.log("\nNo active track.");
      }
    } else {
      const t = status.tracks;
      const at = status.active_track;
      let activeStr = "none";
      if (at) {
        activeStr = `${at.track_id} [${at.completed_tasks}/${at.total_tasks}]`;
        if (at.current_task) activeStr += ` -> Task: ${at.current_task}`;
      }
      console.log(`conductor: ${t.complete}/${t.total} tracks complete | active: ${activeStr}`);
    }
    return;
  }

  if (command === "track") {
    const sub = positional[1];
    const repo = new TrackRepository(rootDir);

    if (sub === "init") {
      const trackId = positional[2];
      const type = (flags["type"] as string) || "feature";
      const desc = (flags["description"] as string) || "New Track";
      const res = repo.initTrack(trackId, type, desc);
      console.log(JSON.stringify(res, null, 2));
      return;
    }

    if (sub === "start") {
      const trackId = positional[2];
      const res = repo.startTrack(trackId);
      console.log(JSON.stringify(res, null, 2));
      return;
    }

    if (sub === "reset") {
      const trackId = positional[2];
      const res = repo.resetTrack(trackId);
      console.log(JSON.stringify(res, null, 2));
      return;
    }

    if (sub === "complete") {
      const trackId = positional[2];
      const res = repo.completeTrack(trackId);
      console.log(JSON.stringify(res, null, 2));
      return;
    }

    if (sub === "resolve") {
      const query = (flags["query"] as string) || null;
      const res = repo.resolveTrack(query);
      if (jsonMode) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        if (res.status === "matched" && res.track) {
          console.log(`Matched Track: ${res.track.track_id} - ${res.track.title} [${res.track.status}]`);
        } else if (res.status === "ambiguous") {
          console.log("Ambiguous matches found:");
          for (const c of res.candidates) {
            console.log(`- ${c.track_id}: ${c.title} [${c.status}]`);
          }
        } else if (res.status === "not_found") {
          console.log(`No track matching query '${query}' found.`);
        } else if (res.status === "all_complete") {
          console.log("All registered tracks are complete.");
        } else {
          console.log("No registered tracks available.");
        }
      }
      return;
    }

    if (sub === "advance") {
      const trackId = positional[2];
      const task = flags["task"] as string;
      const status = flags["status"] as "pending" | "in_progress" | "done" | "complete";
      const sha = (flags["sha"] as string) || null;

      const planPath = join(rootDir, "conductor", "tracks", trackId, "plan.md");
      const doc = PlanDocument.fromFile(planPath);
      const updated = doc.advance(task, status, sha);
      doc.save();

      console.log(
        JSON.stringify(
          {
            track_id: trackId,
            task_name: task,
            status,
            updated,
          },
          null,
          2
        )
      );
      return;
    }

    if (sub === "finish") {
      const trackId = positional[2];
      const task = flags["task"] as string;
      const sha = flags["sha"] as string;
      const summary = flags["summary"] as string;
      const files = (flags["files"] as string) || null;

      const noteOk = attachGitNote(sha, task, summary, files, rootDir);
      const planPath = join(rootDir, "conductor", "tracks", trackId, "plan.md");
      const doc = PlanDocument.fromFile(planPath);
      const updated = doc.advance(task, "done", sha);
      doc.save();

      console.log(
        JSON.stringify(
          {
            track_id: trackId,
            task_name: task,
            sha,
            status: "done",
            note_attached: noteOk,
            updated,
          },
          null,
          2
        )
      );
      return;
    }

    if (sub === "checkpoint") {
      const trackId = positional[2];
      const phase = flags["phase"] as string;
      const sha = flags["sha"] as string;
      const report = (flags["report"] as string) || null;
      const summary = (flags["summary"] as string) || null;

      const noteOk = attachPhaseCheckpointNote(sha, phase, report, summary, rootDir);
      const planPath = join(rootDir, "conductor", "tracks", trackId, "plan.md");
      const doc = PlanDocument.fromFile(planPath);
      const updated = doc.checkpoint(phase, sha);
      doc.save();

      console.log(
        JSON.stringify(
          {
            track_id: trackId,
            phase,
            sha,
            status: "checkpointed",
            note_attached: noteOk,
            updated,
          },
          null,
          2
        )
      );
      return;
    }
  }

  if (command === "note") {
    const sha = positional[1];
    const task = flags["task"] as string;
    const summary = flags["summary"] as string;
    const files = (flags["files"] as string) || null;
    const ok = attachGitNote(sha, task, summary, files, rootDir);
    console.log(JSON.stringify({ success: ok }));
    return;
  }

  if (command === "guard") {
    const sub = positional[1];
    if (sub === "install") {
      const result = installPreCommitGuard(rootDir);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (sub === "uninstall") {
      const result = uninstallPreCommitGuard(rootDir);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (sub === "check") {
      const result = checkPreCommitGuard(rootDir);
      console.log(JSON.stringify(result, null, 2));
      if (!result.valid) {
        process.exit(1);
      }
      return;
    }
    console.error(`Unknown guard subcommand: ${sub}. Supported: install, uninstall, check`);
    process.exit(1);
  }

  if (command === "worktree") {
    const sub = positional[1];
    if (sub === "create") {
      const trackId = positional[2] || (flags["track"] as string);
      if (!trackId) {
        console.error("Missing track_id for worktree create");
        process.exit(1);
      }
      const result = createTrackWorktree(rootDir, trackId);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (sub === "list") {
      const result = listTrackWorktrees(rootDir);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (sub === "remove") {
      const trackId = positional[2] || (flags["track"] as string);
      if (!trackId) {
        console.error("Missing track_id for worktree remove");
        process.exit(1);
      }
      const result = removeTrackWorktree(rootDir, trackId);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.error(`Unknown worktree subcommand: ${sub}. Supported: create, list, remove`);
    process.exit(1);
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

if (import.meta.main) {
  runCli(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
