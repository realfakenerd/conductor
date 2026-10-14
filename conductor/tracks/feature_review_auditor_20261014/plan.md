# Implementation Plan: Deterministic Review Auditor Seam (conductor review verify)

## Phase 1: ReviewAuditor Engine Core (TDD Red-Green) [checkpoint: b57ef8b]
- [x] Task: Create `tests/review_auditor.test.ts` defining assertions for plan compliance, git notes checks, and test runner execution. [b57ef8b]
- [x] Task: Implement `ReviewAuditor` in `src/core/review_auditor.ts`. [b57ef8b]
- [x] Task: Run `bun test tests/review_auditor.test.ts` to confirm Green phase. [b57ef8b]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [b57ef8b]

## Phase 2: CLI & MCP Integration [checkpoint: 1c290b7]
- [x] Task: Add `review` subcommand to `src/cli/index.ts` supporting `--track`, `--json`, and proper exit codes. [1c290b7]
- [x] Task: Add `conductor_review_verify` native tool to `src/mcp/index.ts`. [1c290b7]
- [x] Task: Add integration tests in `tests/cli.test.ts` and `tests/mcp_server.test.ts`. [1c290b7]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [1c290b7]

## Phase 3: Skill & Agent Wiring, Context & Audit [checkpoint: 96ecd85]
- [x] Task: Update `skills/conductor-review/SKILL.md` and `agents/conductor-reviewer.md` with programmatic review verification protocol. [96ecd85]
- [x] Task: Update `conductor/product.md` and `CONTEXT.md` to document the Review Auditor seam. [96ecd85]
- [x] Task: Run full test suite and confirm handshake integrity (`bun run conductor verify`). [96ecd85]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [96ecd85]














