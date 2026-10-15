# Implementation Plan: Consolidate getProjectStatus into TrackRepository

## Phase 1: Engine Core Deepening (TDD Red-Green) [checkpoint: fe64962]
- [x] Task: Add unit test in `tests/engine_core.test.ts` asserting `TrackRepository.getStatus()` behavior and active track resolution. [da3a8ad]
- [x] Task: Define `ProjectStatus` interfaces in `src/core/types.ts` and implement `getStatus()` on `TrackRepository`. [1c81e17]
- [x] Task: Run `bun test tests/engine_core.test.ts` to confirm Green phase. [ca33e51]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [fe64962]

## Phase 2: Callers Refactoring & Duplication Removal
- [x] Task: Refactor `src/cli/index.ts` to use `repo.getStatus()` and remove local `getProjectStatus`. [b3b892c]
- [x] Task: Refactor `src/mcp/index.ts` to use `repo.getStatus()` and remove local `getProjectStatus`. [a6f16f0]
- [~] Task: Refactor `src/core/mcp_resources.ts` active-track resolver to use `repo.getStatus()`.
- [ ] Task: Run integration tests (`tests/cli.test.ts`, `tests/mcp_server.test.ts`, `tests/mcp_resources_prompts.test.ts`).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Handshake Integrity & Final Verification
- [ ] Task: Run full test suite (`bun test`) and verify 100% pass rate.
- [ ] Task: Confirm handshake integrity (`bun run conductor verify`).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)












