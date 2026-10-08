# Implementation Plan: Deepen Conductor Engine with State Machine and Query Seam

## Phase 1: Engine Query Seam & Lifecycle State Machine (TDD Red -> Green) [checkpoint: eae8d66]
- [x] Task: Write failing unit tests for engine status, list, track start, and track reset [a95707b]
    - [ ] Add unit tests in `tests/test_conductor_engine.py` for `list_tracks`, `get_project_status`, `start_track`, and `reset_track`
    - [ ] Run pytest suite and confirm test failures (Red Phase)
- [x] Task: Implement query seam and track lifecycle transitions in `conductor_engine.py` [eae8d66]
    - [ ] Add `list_tracks`, `parse_plan`, and `get_project_status` functions with CLI subcommands `status` and `list`
    - [ ] Implement `start_track` (`track start`) and `reset_track` (`track reset`) updating `tracks.md` and `metadata.json`
    - [ ] Run pytest suite and confirm all tests pass (Green Phase)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [eae8d66]

## Phase 2: Skill Harmonization & Standards Rule Delegation
- [~] Task: Refactor remaining skills to delegate to `conductor_standards.md` and use engine verify
    - [ ] Update `skills/conductor-status/SKILL.md` to reference rule adapter and consume `conductor_engine status`
    - [ ] Update `skills/conductor-implement/SKILL.md` to use `conductor_engine track start`
    - [ ] Update `skills/conductor-review/SKILL.md` and `skills/conductor-revert/SKILL.md` to reference rule adapter and query engine
- [ ] Task: Verify skill frontmatter and manifest validation test suite
    - [ ] Run `pytest tests/test_skills.py` and ensure all assertions pass
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [eae8d66]

## Phase 3: Project Verification & Handshake Checkpoint
- [ ] Task: Execute full test suite and verify Conductor handshake
    - [ ] Run `uv run pytest` across all test suites
    - [ ] Run `python3 scripts/conductor_engine.py verify`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [eae8d66]
