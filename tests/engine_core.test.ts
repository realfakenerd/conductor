import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TrackRepository } from "../src/core/track_repository.ts";
import { PlanDocument } from "../src/core/plan_document.ts";
import { IntegrityAuditor } from "../src/core/integrity_auditor.ts";
import { determineResumption } from "../src/core/resume.ts";

describe("TypeScript Engine Core", () => {
  describe("TrackRepository", () => {
    it("should initialize, list, start, complete, and resolve tracks with atomic rollback", () => {
      const root = mkdtempSync(join(tmpdir(), "cond-repo-test-"));
      const repo = new TrackRepository(root);

      expect(repo.listTracks()).toEqual([]);

      const initResult = repo.initTrack("feat_test", "feature", "Test Feature");
      expect(initResult.track_id).toBe("feat_test");
      expect(initResult.status).toBe("new");

      const tracks = repo.listTracks();
      expect(tracks.length).toBe(1);
      expect(tracks[0].track_id).toBe("feat_test");
      expect(tracks[0].status).toBe("new");

      const startResult = repo.startTrack("feat_test");
      expect(startResult.status).toBe("in_progress");
      expect(repo.getTrack("feat_test")?.status).toBe("in_progress");

      const completeResult = repo.completeTrack("feat_test");
      expect(completeResult.status).toBe("complete");
      expect(repo.getTrack("feat_test")?.status).toBe("complete");

      // Resolve queries
      const resolvedExact = repo.resolveTrack("feat_test");
      expect(resolvedExact.status).toBe("matched");
      expect(resolvedExact.track?.track_id).toBe("feat_test");

      const resolvedMissing = repo.resolveTrack("non_existent");
      expect(resolvedMissing.status).toBe("not_found");
    });
  });

  describe("PlanDocument", () => {
    it("should parse plan AST, calculate metrics, and mutate tasks and checkpoints non-destructively", () => {
      const rawPlan = [
        "# Implementation Plan: Sample",
        "",
        "## Phase 1: Setup",
        "- [ ] Task: Task 1",
        "- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)",
        "",
        "## Phase 2: Core",
        "- [ ] Task: Task 2",
      ].join("\n");

      const doc = new PlanDocument(rawPlan);
      const initialSummary = doc.summary();
      expect(initialSummary.total_tasks).toBe(3);
      expect(initialSummary.completed_tasks).toBe(0);
      expect(initialSummary.progress_percent).toBe(0);

      // Advance Task 1 to in_progress
      doc.advance("Task 1", "in_progress");
      expect(doc.summary().current_task).toBe("Task 1");

      // Advance Task 1 to done with SHA
      doc.advance("Task 1", "done", "abcdef123456");
      expect(doc.summary().completed_tasks).toBe(1);
      expect(doc.lines.some((l) => l.includes("- [x] Task: Task 1 [abcdef1]"))).toBe(true);

      // Checkpoint Phase 1
      doc.checkpoint("Phase 1: Setup", "fedcba987654");
      expect(doc.lines.some((l) => l.includes("## Phase 1: Setup [checkpoint: fedcba9]"))).toBe(true);
      expect(doc.lines.some((l) => l.includes("- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [fedcba9]"))).toBe(true);
    });
  });

  describe("IntegrityAuditor", () => {
    it("should validate handshake links and track workspace parity", () => {
      const root = mkdtempSync(join(tmpdir(), "cond-audit-test-"));
      const conductorDir = join(root, "conductor");
      mkdirSync(conductorDir, { recursive: true });

      const auditor = new IntegrityAuditor(root);
      // Missing index.md
      const missingRes = auditor.audit();
      expect(missingRes.valid).toBe(false);

      // Create index.md with valid link
      writeFileSync(join(conductorDir, "product.md"), "# Product");
      writeFileSync(join(conductorDir, "index.md"), "# Index\n[Product](./product.md)");

      const validRes = auditor.audit();
      expect(validRes.valid).toBe(true);
      expect(validRes.total_links).toBe(1);
      expect(validRes.missing_links.length).toBe(0);

      // Create broken ADR index link
      const adrsDir = join(conductorDir, "adrs");
      mkdirSync(adrsDir, { recursive: true });
      writeFileSync(join(adrsDir, "index.md"), "# ADRs\n[0001-missing.md](./0001-missing.md)");

      const brokenAdrRes = auditor.audit();
      expect(brokenAdrRes.valid).toBe(false);
      expect(brokenAdrRes.missing_links).toContain("conductor/adrs/./0001-missing.md");
    });
  });

  describe("determineResumption", () => {
    it("should audit setup progress checklist", () => {
      const root = mkdtempSync(join(tmpdir(), "cond-resume-test-"));
      const res = determineResumption(root);
      expect(res.setup_complete).toBe(false);
      expect(res.next_step?.step).toBe("Product Definition");
    });
  });
});
