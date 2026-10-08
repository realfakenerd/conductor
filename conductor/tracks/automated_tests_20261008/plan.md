# Implementation Plan: Automated Test Suite for Conductor

## Phase 1: Test Runner & Resume Script Verification [checkpoint: 96560e5]
- [x] Task: Configure Pytest Environment [dcc5fa9]
  - [x] Create `pyproject.toml` with pytest configuration
  - [x] Verify test discovery operates cleanly
- [x] Task: TDD Tests for resume.py (Red Phase) [3fcc5f5]
  - [x] Write unit tests in `tests/test_resume.py` for greenfield, partial setup, and complete setup states
  - [x] Verify tests run and fail as expected if conditions are unmet
- [x] Task: Implement & Refactor Resume Script Support (Green Phase) [96560e5]
  - [x] Ensure `resume.py` cleanly handles isolated paths or test fixtures
  - [x] Run test suite and confirm all tests pass
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [96560e5]

## Phase 2: Agent Skill & Manifest Validation Suite
- [x] Task: Write Skill Manifest Validation Tests (Red Phase) [78ebc91]
  - [x] Write `tests/test_skills.py` validating YAML frontmatter for all `skills/*/SKILL.md`
  - [x] Write tests validating `plugin.json` and `.claude-plugin/marketplace.json` schema
  - [x] Run tests and verify assertions
- [x] Task: Validate & Pass Skill Validation Tests (Green Phase) [2ae6b7c]
  - [x] Fix any detected formatting or frontmatter discrepancies
  - [x] Verify all skill tests pass
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
