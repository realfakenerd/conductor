# Implementation Plan: Automated Test Suite for Conductor

## Phase 1: Test Runner & Resume Script Verification
- [ ] Task: Configure Pytest Environment
  - [ ] Create `pyproject.toml` with pytest configuration
  - [ ] Verify test discovery operates cleanly
- [ ] Task: TDD Tests for resume.py (Red Phase)
  - [ ] Write unit tests in `tests/test_resume.py` for greenfield, partial setup, and complete setup states
  - [ ] Verify tests run and fail as expected if conditions are unmet
- [ ] Task: Implement & Refactor Resume Script Support (Green Phase)
  - [ ] Ensure `resume.py` cleanly handles isolated paths or test fixtures
  - [ ] Run test suite and confirm all tests pass
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Agent Skill & Manifest Validation Suite
- [ ] Task: Write Skill Manifest Validation Tests (Red Phase)
  - [ ] Write `tests/test_skills.py` validating YAML frontmatter for all `skills/*/SKILL.md`
  - [ ] Write tests validating `plugin.json` and `.claude-plugin/marketplace.json` schema
  - [ ] Run tests and verify assertions
- [ ] Task: Validate & Pass Skill Validation Tests (Green Phase)
  - [ ] Fix any detected formatting or frontmatter discrepancies
  - [ ] Verify all skill tests pass
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
