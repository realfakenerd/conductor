# Implementation Plan: Integrate `conductor-improve` Skill

## Phase 1: Test Suite & Skill Specification (TDD Red -> Green)
- [ ] Task: Write failing unit tests for `conductor-improve` skill and assets
    - [ ] Add tests in `tests/test_skills.py` verifying `conductor-improve/SKILL.md` exists, has metadata, links to `conductor_standards.md`, and validates asset presence
    - [ ] Run test suite and confirm failure (Red Phase)
- [ ] Task: Implement HTML report template asset
    - [ ] Create `skills/conductor-improve/assets/HTML-REPORT.md` with Tailwind CDN, Mermaid CDN, and card layout
- [ ] Task: Implement `conductor-improve` skill definition
    - [ ] Create `skills/conductor-improve/SKILL.md` with exploration, report generation, modal selection (`ask_question`), Grill with Docs, and track handoff
    - [ ] Run test suite and verify tests pass (Green Phase)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Catalog Registration & Domain Context
- [ ] Task: Register `conductor-improve` in catalog
    - [ ] Add `conductor-improve` entry to `assets/catalog.md` with description, signals, and 1p status
- [ ] Task: Update domain context and documentation
    - [ ] Update `CONTEXT.md` with Architecture Discovery and Deepening definitions
    - [ ] Update `README.md` to document `/conductor:conductor-improve`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
