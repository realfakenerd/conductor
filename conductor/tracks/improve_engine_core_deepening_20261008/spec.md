# Specification: Deepen Engine Core with TrackRepository, PlanDocument, and IntegrityAuditor

## Overview
Deepen `scripts/conductor_engine.py` by consolidating internal state mutations, plan markdown processing, and workspace verification into three cohesive domain modules: `TrackRepository`, `PlanDocument`, and `IntegrityAuditor`. Preserve single-file zero-dependency execution while introducing transactional consistency, non-destructive plan AST manipulations, and deep workspace/git audit capabilities.

## Functional Requirements
1. **`TrackRepository` Core Deepening**:
   - Encapsulate all track persistence (`metadata.json` and `conductor/tracks.md`) inside `TrackRepository`.
   - Provide atomic dual-write operations (`init`, `start`, `complete`, `reset`, `list`) with rollback on write failures.
   - Enforce fail-fast behavior with structured `EngineError` when attempting invalid state transitions or targeting nonexistent tracks.
   - Ensure backward-compatible module-level functions (`init_track`, `start_track`, `complete_track`, `reset_track`, `list_tracks`) delegate directly to `TrackRepository`.

2. **`PlanDocument` Model & AST Mutation**:
   - Provide structured parsing of `plan.md` into an abstract representation of phases, tasks, subtasks, markers (`[ ]`, `[~]`, `[x]`), and commit SHAs.
   - Implement `advance(task_name, status, sha)` that updates task and subtask status without destroying surrounding markdown comments, whitespace, or phase structures.
   - Provide query metrics: total tasks, completed, in-progress, pending, active phase, active task, next pending task, progress percentage.
   - Backward-compatible module-level functions `advance_task` and `parse_plan` delegate directly to `PlanDocument`.

3. **`IntegrityAuditor` Deep Verification Seam**:
   - Extend `verify_handshake` / `verify` CLI command:
     - Check `conductor/index.md` markdown links.
     - Check track workspace parity: every track in `tracks.md` has a directory, `metadata.json`, and valid `index.md`.
     - Check git commit SHA integrity: any commit SHA recorded in `plan.md` tasks (`[x] Task: ... [sha]`) actually exists in the local git repository (flags ghost commits).
   - Support `--fast` flag on `verify` to perform link-only checks when rapid verification is required.

4. **CLI & Engine Backward Compatibility**:
   - Keep all CLI subcommands (`verify`, `resume`, `status`, `list`, `track`, `note`) functional with identical or enhanced flags.
   - Maintain compatibility with `skills/conductor-setup/scripts/resume.py`.

## Acceptance Criteria
- `TrackRepository`: All track lifecycle operations (`init`, `start`, `complete`, `reset`, `list`) operate through `TrackRepository` with atomic dual-writes and rollback on failure.
- `PlanDocument`: Correctly parses phases, tasks, subtasks, and markers; non-destructively mutates tasks while preserving plan formatting.
- `IntegrityAuditor`: Default `verify` checks index links, track workspaces, and plan commit SHAs; passes with current repo state; flags invalid SHAs or broken tracks if injected in tests; `--fast` skips deep checks.
- Test Suite: Unit tests in `tests/test_conductor_engine.py` cover `TrackRepository`, `PlanDocument`, and `IntegrityAuditor` including failure/rollback conditions with 100% pass rate.
- Full suite passes: `uv run pytest` exits 0.
