import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { listMcpResources, resolveMcpResource, listMcpPrompts, getMcpPrompt } from "../core/mcp_resources.ts";
import { TrackRepository } from "../core/track_repository.ts";
import { PlanDocument } from "../core/plan_document.ts";
import { IntegrityAuditor } from "../core/integrity_auditor.ts";
import { determineResumption } from "../core/resume.ts";
import { attachGitNote, attachPhaseCheckpointNote } from "../core/git_notes.ts";
import { checkPreCommitGuard, installPreCommitGuard, uninstallPreCommitGuard } from "../core/guard.ts";
import { createTrackWorktree, listTrackWorktrees, removeTrackWorktree } from "../core/worktree.ts";
import { ReviewAuditor } from "../core/review_auditor.ts";
import { AdrRepository } from "../core/adr_repository.ts";
import { existsSync } from "node:fs";
import { join } from "node:path";

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

export function createConductorMcpServer(defaultRootDir: string = ".") {
  const server = new Server(
    {
      name: "conductor",
      version: "1.2.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "conductor_verify",
          description: "Audit conductor handshake links, track parity, and git commit reconciliation",
          inputSchema: {
            type: "object",
            properties: {
              fast: { type: "boolean", description: "Skip deep git commit checks" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
          },
        },
        {
          name: "conductor_status",
          description: "Get project status overview, progress metrics, and active track state",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Optional specific track ID" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
          },
        },
        {
          name: "conductor_list",
          description: "List all registered tracks with statuses and metadata",
          inputSchema: {
            type: "object",
            properties: {
              root_dir: { type: "string", description: "Root workspace directory" },
            },
          },
        },
        {
          name: "conductor_resume",
          description: "Audit setup resumption checklist and determine the next unblocked setup step",
          inputSchema: {
            type: "object",
            properties: {
              root_dir: { type: "string", description: "Root workspace directory" },
            },
          },
        },
        {
          name: "conductor_track_init",
          description: "Initialize a new track workspace, metadata.json, and register in tracks.md",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Unique track identifier" },
              type: { type: "string", description: "Track type (feature, bug, chore, refactor, mvp)" },
              description: { type: "string", description: "Track description" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["track_id", "type", "description"],
          },
        },
        {
          name: "conductor_track_start",
          description: "Transition a track to in_progress in tracks.md and metadata.json",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Track identifier" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["track_id"],
          },
        },
        {
          name: "conductor_track_reset",
          description: "Reset a track back to pending in tracks.md and metadata.json",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Track identifier" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["track_id"],
          },
        },
        {
          name: "conductor_track_complete",
          description: "Mark a track complete in tracks.md and metadata.json",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Track identifier" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["track_id"],
          },
        },
        {
          name: "conductor_track_resolve",
          description: "Deterministically resolve track by query substring or get next incomplete track",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Track name or query substring" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
          },
        },
        {
          name: "conductor_track_advance",
          description: "Advance a task status in plan.md to pending, in_progress, or done",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Track identifier" },
              task: { type: "string", description: "Task name" },
              status: { type: "string", enum: ["pending", "in_progress", "done", "complete"], description: "New status" },
              sha: { type: "string", description: "Commit SHA if done" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["track_id", "task", "status"],
          },
        },
        {
          name: "conductor_track_finish",
          description: "Atomically attach verification git note and advance task in plan.md to done with SHA",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Track identifier" },
              task: { type: "string", description: "Task name" },
              sha: { type: "string", description: "Commit SHA" },
              summary: { type: "string", description: "Task summary for git note" },
              files: { type: "string", description: "Modified files" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["track_id", "task", "sha", "summary"],
          },
        },
        {
          name: "conductor_track_checkpoint",
          description: "Record phase verification checkpoint in plan.md and attach verification git note",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Track identifier" },
              phase: { type: "string", description: "Phase name" },
              sha: { type: "string", description: "Commit SHA" },
              report: { type: "string", description: "Path to verification report markdown file" },
              summary: { type: "string", description: "Verification summary text" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["track_id", "phase", "sha"],
          },
        },
        {
          name: "conductor_guard_check",
          description: "Audit repository handshake integrity and pre-commit status",
          inputSchema: {
            type: "object",
            properties: {
              root_dir: { type: "string", description: "Root workspace directory" },
            },
          },
        },
        {
          name: "conductor_worktree_create",
          description: "Create an isolated git worktree sandbox on a dedicated track branch",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Track identifier" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["track_id"],
          },
        },
        {
          name: "conductor_worktree_list",
          description: "List all active Conductor track worktrees",
          inputSchema: {
            type: "object",
            properties: {
              root_dir: { type: "string", description: "Root workspace directory" },
            },
          },
        },
        {
          name: "conductor_worktree_remove",
          description: "Safely remove an isolated track worktree and clean up git worktree metadata",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Track identifier" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["track_id"],
          },
        },
        {
          name: "conductor_review_verify",
          description: "Audit track plan compliance, commit git notes parity, test execution, and diff boundaries",
          inputSchema: {
            type: "object",
            properties: {
              track_id: { type: "string", description: "Target track identifier (optional, defaults to active track)" },
              skip_tests: { type: "boolean", description: "Skip test suite execution" },
              test_command: { type: "string", description: "Custom test runner command" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
          },
        },
        {
          name: "conductor_adr_list",
          description: "List all Architecture Decision Records (ADRs) with statuses and linked tracks",
          inputSchema: {
            type: "object",
            properties: {
              root_dir: { type: "string", description: "Root workspace directory" },
            },
          },
        },
        {
          name: "conductor_adr_init",
          description: "Initialize and scaffold a new numbered MADR architecture decision record",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "ADR Title" },
              status: { type: "string", description: "Status (proposed, accepted, rejected, superseded)" },
              context: { type: "string", description: "Context and problem statement" },
              track_id: { type: "string", description: "Associated Conductor track ID" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["title"],
          },
        },
        {
          name: "conductor_adr_link",
          description: "Link a Conductor track to an existing Architecture Decision Record",
          inputSchema: {
            type: "object",
            properties: {
              adr_number: { type: "number", description: "ADR number (e.g. 1)" },
              track_id: { type: "string", description: "Track identifier to link" },
              root_dir: { type: "string", description: "Root workspace directory" },
            },
            required: ["adr_number", "track_id"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args || {}) as Record<string, any>;
    const rootDir = (a.root_dir as string) || defaultRootDir;

    try {
      if (name === "conductor_verify") {
        const auditor = new IntegrityAuditor(rootDir);
        const res = auditor.audit(Boolean(a.fast));
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_status") {
        const status = getProjectStatus(rootDir, (a.track_id as string) || null);
        return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
      }

      if (name === "conductor_list") {
        const repo = new TrackRepository(rootDir);
        const tracks = repo.listTracks();
        return { content: [{ type: "text", text: JSON.stringify(tracks, null, 2) }] };
      }

      if (name === "conductor_resume") {
        const res = determineResumption(rootDir);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_track_init") {
        const repo = new TrackRepository(rootDir);
        const res = repo.initTrack(a.track_id, a.type, a.description);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_track_start") {
        const repo = new TrackRepository(rootDir);
        const res = repo.startTrack(a.track_id);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_track_reset") {
        const repo = new TrackRepository(rootDir);
        const res = repo.resetTrack(a.track_id);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_track_complete") {
        const repo = new TrackRepository(rootDir);
        const res = repo.completeTrack(a.track_id);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_track_resolve") {
        const repo = new TrackRepository(rootDir);
        const res = repo.resolveTrack(a.query || null);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_track_advance") {
        const planPath = join(rootDir, "conductor", "tracks", a.track_id, "plan.md");
        const doc = PlanDocument.fromFile(planPath);
        const updated = doc.advance(a.task, a.status, a.sha || null);
        doc.save();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { track_id: a.track_id, task_name: a.task, status: a.status, updated },
                null,
                2
              ),
            },
          ],
        };
      }

      if (name === "conductor_track_finish") {
        const noteOk = attachGitNote(a.sha, a.task, a.summary, a.files || null, rootDir);
        const planPath = join(rootDir, "conductor", "tracks", a.track_id, "plan.md");
        const doc = PlanDocument.fromFile(planPath);
        const updated = doc.advance(a.task, "done", a.sha);
        doc.save();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  track_id: a.track_id,
                  task_name: a.task,
                  sha: a.sha,
                  status: "done",
                  note_attached: noteOk,
                  updated,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (name === "conductor_track_checkpoint") {
        const noteOk = attachPhaseCheckpointNote(a.sha, a.phase, a.report || null, a.summary || null, rootDir);
        const planPath = join(rootDir, "conductor", "tracks", a.track_id, "plan.md");
        const doc = PlanDocument.fromFile(planPath);
        const updated = doc.checkpoint(a.phase, a.sha);
        doc.save();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  track_id: a.track_id,
                  phase: a.phase,
                  sha: a.sha,
                  status: "checkpointed",
                  note_attached: noteOk,
                  updated,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (name === "conductor_guard_check") {
        const res = checkPreCommitGuard(rootDir);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_worktree_create") {
        const res = createTrackWorktree(rootDir, a.track_id);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_worktree_list") {
        const res = listTrackWorktrees(rootDir);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_worktree_remove") {
        const res = removeTrackWorktree(rootDir, a.track_id);
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_review_verify") {
        const auditor = new ReviewAuditor(rootDir);
        const res = auditor.audit(a.track_id || null, {
          skipTests: Boolean(a.skip_tests),
          testCommand: a.test_command || undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_adr_list") {
        const repo = new AdrRepository(rootDir);
        const res = repo.listAdrs();
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_adr_init") {
        const repo = new AdrRepository(rootDir);
        const res = repo.initAdr(a.title, {
          status: a.status,
          context: a.context,
          trackId: a.track_id,
        });
        return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
      }

      if (name === "conductor_adr_link") {
        const repo = new AdrRepository(rootDir);
        const res = repo.linkAdr(Number(a.adr_number), a.track_id);
        return { content: [{ type: "text", text: JSON.stringify({ adr_number: a.adr_number, track_id: a.track_id, linked: res }, null, 2) }] };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: String(err?.message || err) }],
      };
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: listMcpResources(),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const resolved = resolveMcpResource(uri, defaultRootDir);
    return {
      contents: [
        {
          uri: resolved.uri,
          mimeType: resolved.mimeType,
          text: resolved.text,
        },
      ],
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: listMcpPrompts(),
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const res = getMcpPrompt(name, args || {});
    return {
      description: res.description,
      messages: res.messages,
    };
  });

  return server;
}

export async function runMcpStdio(rootDir: string = ".") {
  const server = createConductorMcpServer(rootDir);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.main) {
  runMcpStdio().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
