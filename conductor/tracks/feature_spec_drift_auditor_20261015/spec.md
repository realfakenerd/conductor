# Specification: Automated Spec & Implementation Drift Auditor

## 1. Overview
Conductor ensures disciplined Spec-Driven Development, but currently lacks an automated mechanism to verify that files modified during track execution match the planned files and scope defined in `plan.md` and `spec.md`. Unplanned file changes or scope creep can occur undetected. This track introduces an automated drift auditor (`conductor audit drift` and `conductor review audit-drift`) that inspects git commits, compares modified file paths against planned files, calculates a drift score, and surfaces deviations before track completion.

## 2. Architecture & Seams
1. **Drift Auditor Seam (`src/core/drift_auditor.ts` or `src/core/review_auditor.ts`)**:
   - `DriftAuditor` class:
     - Extracts modified files from git commits associated with the track (or git diff between base branch and current HEAD).
     - Extracts planned files and declared seams from `plan.md` and `spec.md`.
     - Detects unplanned file modifications, deleted files, and untracked changes.
     - Computes a drift score (0% = perfect adherence, >0% = scope deviation).
2. **Review Auditor Integration (`src/core/review_auditor.ts`)**:
   - Incorporate drift auditing into `ReviewAuditor.auditReview()` to flag scope creep as a review warning or error.
3. **CLI Subcommand (`src/cli/index.ts`)**:
   - `conductor audit drift [--track <id>] [--json]`
   - `conductor review verify` checks drift status.
4. **MCP Tool Integration (`src/mcp/index.ts`)**:
   - Expose `conductor_audit_drift` tool for agent use.
5. **Testing Suite (`tests/drift_auditor.test.ts`)**:
   - Unit tests verifying drift calculation with clean, drifted, and scope-creep git diff scenarios.

## 3. Acceptance Criteria
- `conductor audit drift --track <id>` accurately parses planned file paths from `plan.md`.
- Flag any modified files in git commits that were not planned.
- Integration with `conductor review verify` ensures tracks with unacceptable drift cannot be completed without explicit acknowledgement.
- All unit and CLI tests pass via `bun test`.
