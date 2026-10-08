# Specification: Automated Test Suite for Conductor

## Overview
Establish a robust, automated test suite for Conductor using `pytest` to validate both Python automation scripts (such as `resume.py`) and agent skill specifications (`SKILL.md` frontmatter, file hierarchy, and markdown structural integrity).

## Functional Requirements
1. **Python Script Testing (`tests/test_resume.py`)**:
   - Unit tests for `resume.py` logic under various workspace states:
     - Greenfield (no conductor directory, uninitialized).
     - Partial setup (missing one or more required artifacts: `product.md`, `tech-stack.md`, `workflow.md`, etc.).
     - Completed setup (all checklist items satisfied, `setup_complete: true`).
2. **Skill Specification & Manifest Validation (`tests/test_skills.py`)**:
   - Ensure all `skills/*/SKILL.md` files have valid YAML frontmatter containing `name` and `description`.
   - Validate that each skill directory contains valid assets or scripts referenced by the skill.
   - Validate plugin manifests (`plugin.json`, `.claude-plugin/marketplace.json`) for valid JSON schema/syntax.
3. **Test Runner & Configuration**:
   - Configure pytest via `pyproject.toml` or `pytest.ini` for clean, isolated test runs.
   - Support standard execution via `pytest` or `python -m pytest`.

## Non-Functional Requirements
- Zero external runtime dependencies outside pytest and PyYAML for test execution.
- Fast execution (<5 seconds total run time).
- CI-friendly non-interactive execution.

## Acceptance Criteria
- [ ] Running `pytest` discovers and passes all tests for `resume.py` and skill markdown files.
- [ ] Edge cases in `resume.py` (missing folders, corrupted files) are covered.
- [ ] All 6 conductor skills (`conductor-setup`, `conductor-new-track`, `conductor-implement`, `conductor-review`, `conductor-status`, `conductor-revert`) pass manifest validation.

## Out of Scope
- End-to-end LLM agent conversational testing against live LLM APIs.
