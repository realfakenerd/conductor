# Implementation Plan: Integrate Caveman Terse Communication and Token Diet as Conductor Default

## Phase 1: Engine Terse Status & CLI Modes (TDD Red -> Green) [checkpoint: 967e9d3]
- [x] Task: Write failing unit tests for default compact status and --verbose flag [94d5e27]
    - [ ] Add tests in `tests/test_conductor_engine.py` for default terse status formatting and `--verbose` output
    - [ ] Run pytest suite and confirm test failures (Red Phase)
- [x] Task: Implement compact status default and --verbose flag in `scripts/conductor_engine.py` [967e9d3]
    - [ ] Update `conductor_engine.py` `status` parser to add `--verbose` and default human-readable output to compact receipt
    - [ ] Run pytest suite and confirm tests pass (Green Phase)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [0f42403]

## Phase 2: Standards Rule Adapter & Catalog Registration [checkpoint: 5bc423e]
- [x] Task: Update `rules/conductor_standards.md` with Terse Communication Invariant [5bc423e]
    - [ ] Add Section 4 specifying answer-first pattern, ceremony elimination, and Auto-Clarity safety boundaries
- [x] Task: Register `caveman` companion skill in `assets/catalog.md` [5bc423e]
    - [ ] Add 3rd-party skill entry for `caveman` with frozen URL and detection signals
- [x] Task: Add test coverage for standards rule and catalog in `tests/test_skills.py` [5bc423e]
    - [ ] Assert `conductor_standards.md` contains Terse Invariant and `assets/catalog.md` includes `caveman`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [0f42403]

## Phase 3: Project Verification & Handshake Checkpoint [checkpoint: 0f42403]
- [x] Task: Execute full test suite and verify Conductor handshake [0f42403]
    - [ ] Run `uv run pytest` across all test suites
    - [ ] Run `python3 scripts/conductor_engine.py verify`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [0f42403]
