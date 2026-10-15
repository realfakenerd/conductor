# Implementation Plan: Automated Spec & Implementation Drift Auditor

## Phase 1: DriftAuditor Core Engine (TDD Red-Green)
- [ ] Task: Create `tests/drift_auditor.test.ts` asserting planned file extraction, git diff parsing, and drift scoring.
- [ ] Task: Implement `DriftAuditor` in `src/core/drift_auditor.ts`.
- [ ] Task: Run `bun test tests/drift_auditor.test.ts` to confirm Green phase.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: ReviewAuditor & CLI Integration
- [ ] Task: Integrate `DriftAuditor` into `ReviewAuditor` in `src/core/review_auditor.ts`.
- [ ] Task: Add `audit drift` command to `src/cli/index.ts`.
- [ ] Task: Add integration tests in `tests/cli.test.ts`.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: MCP Server Tool & Verification Handshake
- [ ] Task: Register `conductor_audit_drift` tool in `src/mcp/index.ts`.
- [ ] Task: Run `bun test` and `bun run conductor verify` to confirm project integrity.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
