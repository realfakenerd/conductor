import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TrackRepository } from "./track_repository.ts";
import { PlanDocument } from "./plan_document.ts";
import { EngineError } from "./types.ts";

export interface McpResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface ResolvedResource {
  uri: string;
  mimeType: string;
  text: string;
}

export interface McpPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface McpPromptDefinition {
  name: string;
  description: string;
  arguments?: McpPromptArgument[];
}

export interface McpPromptMessage {
  role: "user" | "assistant";
  content: {
    type: "text";
    text: string;
  };
}

export interface McpPromptResult {
  description?: string;
  messages: McpPromptMessage[];
}

export function listMcpResources(): McpResourceDefinition[] {
  return [
    {
      uri: "conductor://tracks",
      name: "Conductor Tracks Registry",
      description: "JSON array of all registered tracks, metadata, and status",
      mimeType: "application/json",
    },
    {
      uri: "conductor://active-track",
      name: "Active Track Summary",
      description: "JSON object describing current in-progress track and plan metrics",
      mimeType: "application/json",
    },
    {
      uri: "conductor://handshake",
      name: "Handshake Single Source of Truth",
      description: "Markdown contents of conductor/index.md and product definition",
      mimeType: "text/markdown",
    },
    {
      uri: "conductor://context",
      name: "Domain Modeling and Glossary",
      description: "Markdown contents of CONTEXT.md defining canonical domain terms",
      mimeType: "text/markdown",
    },
    {
      uri: "conductor://adrs",
      name: "Architecture Decision Records (ADRs)",
      description: "Markdown contents of conductor/adrs/index.md or ADR catalog",
      mimeType: "text/markdown",
    },
  ];
}

export function resolveMcpResource(uri: string, rootDir: string = "."): ResolvedResource {
  if (uri === "conductor://tracks") {
    const repo = new TrackRepository(rootDir);
    const tracks = repo.listTracks();
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(tracks, null, 2),
    };
  }

  if (uri === "conductor://active-track") {
    const repo = new TrackRepository(rootDir);
    const tracks = repo.listTracks();
    const active = tracks.find((t) => t.status === "in_progress") || tracks.find((t) => t.status === "new" || t.status === "pending") || null;

    let details: any = { active_track: null };
    if (active) {
      const planFile = join(rootDir, "conductor", "tracks", active.track_id, "plan.md");
      let planSummary = null;
      if (existsSync(planFile)) {
        const planDoc = PlanDocument.fromFile(planFile);
        planSummary = planDoc.summary();
      }
      details = {
        active_track: {
          ...active,
          plan: planSummary,
        },
      };
    }

    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(details, null, 2),
    };
  }

  if (uri === "conductor://handshake") {
    const indexPath = join(rootDir, "conductor", "index.md");
    if (!existsSync(indexPath)) {
      throw new EngineError(`Missing handshake file at '${indexPath}'`);
    }
    const text = readFileSync(indexPath, "utf-8");
    return {
      uri,
      mimeType: "text/markdown",
      text,
    };
  }

  if (uri === "conductor://context") {
    const contextPath = join(rootDir, "CONTEXT.md");
    let text = "";
    if (existsSync(contextPath)) {
      text = readFileSync(contextPath, "utf-8");
    } else {
      text = "# Domain Context\nNo CONTEXT.md found in workspace root.";
    }
    return {
      uri,
      mimeType: "text/markdown",
      text,
    };
  }

  if (uri === "conductor://adrs") {
    const indexPath = join(rootDir, "conductor", "adrs", "index.md");
    let text = "";
    if (existsSync(indexPath)) {
      text = readFileSync(indexPath, "utf-8");
    } else {
      text = "# Architecture Decision Records (ADRs)\nNo ADRs recorded yet.";
    }
    return {
      uri,
      mimeType: "text/markdown",
      text,
    };
  }

  throw new EngineError(`Unknown Conductor resource URI: '${uri}'`);
}

export function listMcpPrompts(): McpPromptDefinition[] {
  return [
    {
      name: "conductor_track_start",
      description: "Instructs agent to begin or resume work on a Conductor track",
      arguments: [
        { name: "track_id", description: "ID of the track", required: true },
        { name: "title", description: "Title or short description of track", required: false },
      ],
    },
    {
      name: "conductor_task_implement",
      description: "Instructs agent to execute a task strictly following TDD (Red-Green-Refactor)",
      arguments: [
        { name: "track_id", description: "ID of the track", required: true },
        { name: "task", description: "Exact task name from plan.md", required: true },
      ],
    },
  ];
}

export function getMcpPrompt(name: string, args: Record<string, any> = {}): McpPromptResult {
  if (name === "conductor_track_start") {
    const trackId = args.track_id || "unspecified";
    const title = args.title || trackId;
    return {
      description: `Start or resume track ${trackId}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are implementing Conductor track '${trackId}' (${title}). Verify handshake, load specification and plan, and begin executing tasks sequentially according to conductor/workflow.md.`,
          },
        },
      ],
    };
  }

  if (name === "conductor_task_implement") {
    const trackId = args.track_id || "unspecified";
    const task = args.task || "unspecified task";
    return {
      description: `Implement task '${task}' in track '${trackId}'`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Execute task: "${task}" for track '${trackId}'. Follow strict TDD: 1) Write failing test (Red), 2) Implement minimal code to pass (Green), 3) Refactor, 4) Commit and finish task via Conductor engine.`,
          },
        },
      ],
    };
  }

  throw new EngineError(`Unknown Conductor prompt: '${name}'`);
}
