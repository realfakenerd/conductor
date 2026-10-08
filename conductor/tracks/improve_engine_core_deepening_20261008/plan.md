# Implementation Plan: Deepen Engine Core with TrackRepository, PlanDocument, and IntegrityAuditor

## Phase 1: TrackRepository Deepening (TDD Red -> Green)
- [x] Task: Write failing unit tests for TrackRepository atomic operations and rollbacks [afd488f]
    - [ ] Add unit tests in `tests/test_conductor_engine.py` for `TrackRepository` lifecycle mutations, rollback on write error, and typed `EngineError`
    - [ ] Run pytest suite and confirm test failures (Red Phase)
- [x] Task: Implement TrackRepository with atomic dual-writes and error handling in `conductor_engine.py` [8df204e]
    - [ ] Define `EngineError` exception class
    - [ ] Implement `TrackRepository` class handling `tracks.md` and `metadata.json` synchronization with transactional rollback
    - [ ] Wire existing module functions (`init_track`, `start_track`, `complete_track`, `reset_track`, `list_tracks`) to `TrackRepository`
    - [ ] Run pytest suite and confirm all Phase 1 tests pass (Green Phase)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [1d34953]

## Phase 2: PlanDocument Model & AST Mutation (TDD Red -> Green)
- [x] Task: Write failing unit tests for PlanDocument AST parsing and formatting preservation [5b5cf3d]
    - [ ] Add unit tests in `tests/test_conductor_engine.py` verifying parsing of phases, tasks, subtasks, non-destructive status mutation, and metrics calculation
    - [ ] Run pytest suite and confirm test failures (Red Phase)
- [ ] Task: Implement PlanDocument class and wire advance_task and parse_plan
    - [ ] Implement `PlanDocument` class with AST node models and clean `advance(task_name, status, sha)` mutation
    - [ ] Wire `advance_task` and `parse_plan` to delegate to `PlanDocument`
    - [ ] Run pytest suite and confirm all Phase 2 tests pass (Green Phase)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [1d34953]

## Phase 3: IntegrityAuditor Deep Verification Seam (TDD Red -> Green)
- [ ] Task: Write failing unit tests for IntegrityAuditor deep checks and ghost commit detection
    - [ ] Add unit tests in `tests/test_conductor_engine.py` for workspace parity, ghost commit detection, and `--fast` link-only flag
    - [ ] Run pytest suite and confirm test failures (Red Phase)
- [ ] Task: Implement IntegrityAuditor and update verify subcommand
    - [ ] Implement `IntegrityAuditor` class performing index links, track workspace integrity, and git commit SHA validation
    - [ ] Update `verify_handshake` and CLI `verify` parser with default deep checks and `--fast` option
    - [ ] Run pytest suite and confirm all Phase 3 tests pass (Green Phase)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [1d34953]

## Phase 4: Full Suite Integration & Handshake Checkpoint
- [ ] Task: Execute full test suite and verify Conductor handshake
    - [ ] Run `uv run pytest` across all test suites
    - [ ] Run `python3 scripts/conductor_engine.py verify`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [1d34953]
