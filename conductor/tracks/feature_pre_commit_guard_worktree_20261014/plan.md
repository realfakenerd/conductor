# Implementation Plan: Add Git Pre-Commit Verification Guard and Isolated Worktree Sandbox

## Phase 1: Engine Core & TDD Test Suite (Red Phase)
- [x] Task: Create `tests/guard_worktree.test.ts` asserting guard installation, verification rejection/acceptance, and worktree creation/removal.
- [x] Task: Implement `src/core/guard.ts` for pre-commit hook installation, removal, and audit check.
- [x] Task: Implement `src/core/worktree.ts` for git worktree lifecycle operations.
- [ ] Task: Run `bun test` to confirm test suite transitions from Red to Green.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: CLI Commands & MCP Tools Exposure
- [ ] Task: Wire `guard` (`install`, `uninstall`, `check`) and `worktree` (`create`, `list`, `remove`) into `src/cli/index.ts`.
- [ ] Task: Expose `conductor_guard_check`, `conductor_worktree_create`, `conductor_worktree_list`, and `conductor_worktree_remove` in `src/mcp/index.ts`.
- [ ] Task: Update MCP tests and verify all test suites pass.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)






