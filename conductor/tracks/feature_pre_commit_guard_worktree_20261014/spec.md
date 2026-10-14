# Specification: Add Git Pre-Commit Verification Guard and Isolated Worktree Sandbox

## 1. Overview
Introduce native tooling within the Conductor CLI and TypeScript Engine Core to:
1. Prevent broken repository handshakes, syntax errors, or uncommitted task drift from entering Git history via an ultra-fast, zero-overhead Bun pre-commit hook (`conductor guard install` / `conductor guard check`).
2. Provide an isolated Git worktree runner (`conductor worktree create <track_id>` / `conductor worktree remove <track_id>`) enabling concurrent agent execution on isolated branches without dirtying the main working tree.

## 2. Functional Requirements
1. **Pre-Commit Guard Subcommands**:
   - `conductor guard install`: Safely creates or appends to `.git/hooks/pre-commit` executing `bun run conductor guard check`.
   - `conductor guard uninstall`: Removes Conductor pre-commit hook invocation without disturbing unrelated hooks.
   - `conductor guard check`: Runs fast handshake audit (`bun run conductor verify`) and pre-commit checks. Rejects commit with non-zero exit code and clear diagnostic message if handshake or integrity fails.
2. **Worktree Management Subcommands**:
   - `conductor worktree create <track_id>`: Creates a git branch `track/<track_id>` and scaffolds an isolated worktree under `.conductor/worktrees/<track_id>`, setting up symlinks or necessary files.
   - `conductor worktree list`: Lists currently active Conductor worktrees and their associated tracks.
   - `conductor worktree remove <track_id>`: Safely removes the worktree and cleans up git worktree metadata.
3. **Engine Core Extensions**:
   - Implement `src/core/guard.ts` encapsulating pre-commit hook installation and verification check logic.
   - Implement `src/core/worktree.ts` encapsulating git worktree CLI invocations and directory isolation.
4. **MCP Tools Integration**:
   - Expose `conductor_guard_check`, `conductor_worktree_create`, `conductor_worktree_list`, and `conductor_worktree_remove` as native MCP tools.

## 3. Non-Functional Requirements & Invariants
- **Zero Python Invariant**: Strictly TypeScript under Bun runtime.
- **Fast Execution**: `conductor guard check` must execute in < 100ms.
- **Terse Caveman Invariant**: Concise status outputs, no unnecessary conversational filler.

## 4. Acceptance Criteria
- `bun run conductor guard check` passes cleanly on valid repository.
- `bun run conductor guard install` successfully creates executable hook.
- Worktree lifecycle (`create` -> `list` -> `remove`) operates without git state corruption.
- Unit and integration tests in `tests/guard_worktree.test.ts` pass with 100% success under `bun test`.
- Handshake verification (`bun run conductor verify`) remains valid.
