# Implementation Plan: Integrate Caveman Terse Communication and Token Diet as Conductor Default

## Phase 1: Engine Terse Status & CLI Modes (TDD Red -> Green)
- [~] Task: Write failing unit tests for default compact status and --verbose flag
    - [ ] Add tests in `tests/test_conductor_engine.py` for default terse status formatting and `--verbose` output
    - [ ] Run pytest suite and confirm test failures (Red Phase)
- [ ] Task: Implement compact status default and --verbose flag in `scripts/conductor_engine.py`
    - [ ] Update `conductor_engine.py` `status` parser to add `--verbose` and default human-readable output to compact receipt
    - [ ] Run pytest suite and confirm tests pass (Green Phase)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Standards Rule Adapter & Catalog Registration
- [ ] Task: Update `rules/conductor_standards.md` with Terse Communication Invariant
    - [ ] Add Section 4 specifying answer-first pattern, ceremony elimination, and Auto-Clarity safety boundaries
- [ ] Task: Register `caveman` companion skill in `assets/catalog.md`
    - [ ] Add 3rd-party skill entry for `caveman` with frozen URL and detection signals
- [ ] Task: Add test coverage for standards rule and catalog in `tests/test_skills.py`
    - [ ] Assert `conductor_standards.md` contains Terse Invariant and `assets/catalog.md` includes `caveman`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Project Verification & Handshake Checkpoint
- [ ] Task: Execute full test suite and verify Conductor handshake
    - [ ] Run `uv run pytest` across all test suites
    - [ ] Run `python3 scripts/conductor_engine.py verify`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
