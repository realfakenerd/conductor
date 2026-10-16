import { describe, expect, it } from "bun:test";
import { PlanDocument } from "../src/core/plan_document.ts";

describe("PlanDocument Unit Tests", () => {
  it("should parse plan structure, phases, and tasks", () => {
    const raw = [
      "# Implementation Plan: Sample",
      "",
      "## Phase 1: Core",
      "- [ ] Task: Task One",
      "- [~] Task: Task Two",
      "- [x] Task: Task Three [abcdef1]",
    ].join("\n");

    const doc = new PlanDocument(raw);
    const summary = doc.summary();

    expect(summary.phases).toEqual(["Core"]);
    expect(summary.total_tasks).toBe(3);
    expect(summary.completed_tasks).toBe(1);
    expect(summary.in_progress_tasks).toBe(1);
    expect(summary.pending_tasks).toBe(1);
    expect(summary.current_task).toBe("Task Two");
    expect(summary.next_pending_task).toBe("Task One");
  });

  it("should extract and preserve [skills: ...] metadata markers on tasks", () => {
    const raw = [
      "# Implementation Plan: Skills",
      "",
      "## Phase 1: Core",
      "- [ ] Task: Implement auth [skills: firebase-auth, tdd]",
      "- [ ] Task: Optimize database [skill: postgres-optimization]",
    ].join("\n");

    const doc = new PlanDocument(raw);
    const summary = doc.summary();

    expect(summary.tasks[0].task).toBe("Implement auth");
    expect(summary.tasks[0].skills).toEqual(["firebase-auth", "tdd"]);

    expect(summary.tasks[1].task).toBe("Optimize database");
    expect(summary.tasks[1].skills).toEqual(["postgres-optimization"]);

    // Advance task and confirm preservation
    doc.advance("Implement auth", "in_progress");
    expect(doc.rawContent).toContain("- [~] Task: Implement auth [skills: firebase-auth, tdd]");

    doc.advance("Implement auth", "done", "1234567890ab");
    expect(doc.rawContent).toContain("- [x] Task: Implement auth [1234567] [skills: firebase-auth, tdd]");
  });

  it("should handle phase checkpoints and mark checkpoint tasks complete", () => {
    const raw = [
      "# Implementation Plan: Checkpoints",
      "",
      "## Phase 1: Setup",
      "- [x] Task: Initialize [1111111]",
      "- [ ] Task: Phase 1 Verification & Checkpoint (Refer to workflow.md)",
    ].join("\n");

    const doc = new PlanDocument(raw);
    doc.checkpoint("Phase 1: Setup", "abcdef123456");

    expect(doc.rawContent).toContain("## Phase 1: Setup [checkpoint: abcdef1]");
    expect(doc.rawContent).toContain("- [x] Task: Phase 1 Verification & Checkpoint (Refer to workflow.md) [abcdef1]");
  });
});
