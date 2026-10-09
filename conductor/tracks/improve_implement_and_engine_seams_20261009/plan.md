# Implementation Plan: Deepen Conductor Implement and Engine Seams

## Phase 1: Track Resolution Seam (TDD Red -> Green) [checkpoint: f0d39b8]
- [x] Task: Write failing unit tests for track resolve seam [e800141]
    - [ ] Add unit tests in `tests/test_conductor_engine.py` for exact match, substring match, ambiguous match, and first incomplete fallback
    - [ ] Run pytest suite and confirm test failures (Red Phase)
- [x] Task: Implement track resolve seam in TrackRepository and CLI [0aaf4de]
    - [ ] Implement `TrackRepository.resolve_track(query=None)`
    - [ ] Add `track resolve` CLI subcommand with `--query` and `--json` options
    - [ ] Run pytest suite and confirm Phase 1 tests pass (Green Phase)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [f0d39b8]

## Phase 2: Atomic Task Finish Seam (TDD Red -> Green)
- [x] Task: Write failing unit tests for track finish seam [a8a7637]
    - [ ] Add unit tests in `tests/test_conductor_engine.py` verifying git note attachment and plan advance coordination
    - [ ] Run pytest suite and confirm test failures (Red Phase)
- [x] Task: Implement track finish seam in conductor_engine.py [78238ef]
    - [ ] Implement `finish_task(track_id, task, sha, summary, files=None, root_dir=".")`
    - [ ] Wire `track finish` CLI subcommand with `--task`, `--sha`, `--summary`, and optional `--files`
    - [ ] Run pytest suite and confirm Phase 2 tests pass (Green Phase)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Phase Checkpoint Seam in PlanDocument & Engine (TDD Red -> Green)
- [ ] Task: Write failing unit tests for PlanDocument.checkpoint and track checkpoint CLI
    - [ ] Add unit tests for phase header regex matching, SHA appending, and verification git note creation
    - [ ] Run pytest suite and confirm test failures (Red Phase)
- [ ] Task: Implement PlanDocument.checkpoint and track checkpoint subcommand
    - [ ] Implement `PlanDocument.checkpoint(phase_name, sha)`
    - [ ] Implement `checkpoint_phase(track_id, phase, sha, report_file=None, summary=None, root_dir=".")`
    - [ ] Wire `track checkpoint` CLI subcommand
    - [ ] Run pytest suite and confirm Phase 3 tests pass (Green Phase)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Skill Modernization & Handshake Verification
- [ ] Task: Refactor skills/conductor-implement/SKILL.md to consume new seams
    - [ ] Update track selection protocol to use `track resolve`
    - [ ] Update task loop to use `track finish`
    - [ ] Add explicit phase completion step using `track checkpoint`
    - [ ] Run full test suite `uv run pytest` and `python3 scripts/conductor_engine.py verify`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
