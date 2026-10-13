import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { EngineError, type PlanSummary, type TaskSummary } from "./types.ts";

export class PlanDocument {
  public rawContent: string;
  public filePath: string | null;
  public lines: string[];

  constructor(content: string, filePath: string | null = null) {
    this.rawContent = content;
    this.filePath = filePath;
    this.lines = content.split("\n");
  }

  static fromFile(path: string): PlanDocument {
    if (!existsSync(path)) {
      throw new Error(`Plan file not found: ${path}`);
    }
    return new PlanDocument(readFileSync(path, "utf-8"), path);
  }

  summary(): PlanSummary {
    const phases: string[] = [];
    const tasks: TaskSummary[] = [];
    let currentPhaseName: string | null = null;

    const phaseRegex = /^##\s+(?:Phase\s+\d+:?\s*)?(.*?)(?:\s*\[.*\])?$/;
    const taskRegex = /^-\s*\[([ x~])\]\s*Task:\s*(.*?)(?:\s*\[[a-f0-9]+\])?$/;

    for (const line of this.lines) {
      const lineStr = line.trim();
      const phaseM = phaseRegex.exec(lineStr);
      if (phaseM) {
        currentPhaseName = phaseM[1].trim();
        phases.push(currentPhaseName);
        continue;
      }

      const taskM = taskRegex.exec(lineStr);
      if (taskM) {
        const marker = taskM[1];
        const taskDesc = taskM[2].trim();
        const status = marker === "x" ? "complete" : marker === "~" ? "in_progress" : "pending";
        tasks.push({
          phase: currentPhaseName,
          task: taskDesc,
          status,
        });
      }
    }

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "complete").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;

    const currentTask = tasks.find((t) => t.status === "in_progress")?.task || null;
    const currentPhase = tasks.find((t) => t.status === "in_progress")?.phase || null;
    const nextPending = tasks.find((t) => t.status === "pending")?.task || null;

    const percent = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0.0;

    return {
      phases,
      tasks,
      total_tasks: total,
      completed_tasks: completed,
      in_progress_tasks: inProgress,
      pending_tasks: pending,
      current_phase: currentPhase,
      current_task: currentTask,
      next_pending_task: nextPending,
      progress_percent: percent,
    };
  }

  advance(taskName: string, status: "pending" | "in_progress" | "done" | "complete", sha?: string | null): boolean {
    const markerMap: Record<string, string> = {
      pending: "[ ]",
      in_progress: "[~]",
      done: "[x]",
      complete: "[x]",
    };
    const targetMarker = markerMap[status] || "[~]";

    const escapedName = taskName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const taskRegex = new RegExp(`^(\\s*-\\s*)\\[[ x~]\\](\\s*Task:\\s*${escapedName})(?:\\s*\\[[a-f0-9]+\\])?(.*)$`);
    let updated = false;
    const newLines: string[] = [];

    for (const line of this.lines) {
      const m = taskRegex.exec(line);
      if (m) {
        const indentPrefix = m[1];
        const taskPart = m[2];
        const trailing = m[3] || "";
        const shaPart = targetMarker === "[x]" && sha ? ` [${sha.slice(0, 7)}]` : "";
        newLines.push(`${indentPrefix}${targetMarker}${taskPart}${shaPart}${trailing}`);
        updated = true;
      } else {
        newLines.push(line);
      }
    }

    if (!updated) {
      throw new EngineError(`Task '${taskName}' not found in plan`);
    }

    this.lines = newLines;
    this.rawContent = this.lines.join("\n");
    return true;
  }

  checkpoint(phaseName: string, sha: string): boolean {
    const shaShort = sha.slice(0, 7);
    const cleanPhase = phaseName.trim();
    const escapedPhase = cleanPhase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const headerRegex = new RegExp(`^(##\\s+(?:Phase\\s+\\d+:?\\s*)?${escapedPhase})(?:\\s*\\[checkpoint:\\s*[a-f0-9]+\\])?(.*)$`, "i");

    let simpleRegex: RegExp | null = null;
    const phaseNumM = /^Phase\s+\d+/i.exec(cleanPhase);
    if (phaseNumM) {
      simpleRegex = new RegExp(`^(##\\s+${phaseNumM[0]}.*?)(?:\\s*\\[checkpoint:\\s*[a-f0-9]+\\])?(.*)$`, "i");
    }

    let updatedHeader = false;
    const newLines: string[] = [];
    let inTargetPhase = false;

    const checkpointTaskRegex = /^(\s*-\s*)\[[ x~]\](\s*Task:\s*Phase Verification & Checkpoint(?: \(.*?\))?)(?:\s*\[[a-f0-9]+\])?(.*)$/i;

    for (const line of this.lines) {
      let m = headerRegex.exec(line);
      if (!m && simpleRegex && !updatedHeader) {
        m = simpleRegex.exec(line);
      }

      if (m) {
        const baseHeader = m[1].trimEnd();
        const trailing = m[2] || "";
        newLines.push(`${baseHeader} [checkpoint: ${shaShort}]${trailing}`);
        updatedHeader = true;
        inTargetPhase = true;
        continue;
      }

      if (line.startsWith("## ") && inTargetPhase) {
        inTargetPhase = false;
      }

      if (inTargetPhase) {
        const chkM = checkpointTaskRegex.exec(line);
        if (chkM) {
          const indent = chkM[1];
          const taskBody = chkM[2];
          const trail = chkM[3] || "";
          newLines.push(`${indent}[x]${taskBody} [${shaShort}]${trail}`);
          continue;
        }
      }

      newLines.push(line);
    }

    if (!updatedHeader) {
      throw new EngineError(`Phase '${phaseName}' not found in plan`);
    }

    this.lines = newLines;
    this.rawContent = this.lines.join("\n");
    return true;
  }

  save(filePath?: string) {
    const target = filePath || this.filePath;
    if (!target) {
      throw new EngineError("Cannot save PlanDocument: no target path specified");
    }
    writeFileSync(target, this.lines.join("\n") + "\n", "utf-8");
  }
}
