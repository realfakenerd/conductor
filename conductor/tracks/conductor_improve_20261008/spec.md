# Specification: Integrate `conductor-improve` Skill

## Overview
Integrate Matt Pocock's `improve-codebase-architecture` into Conductor as a first-class skill: `conductor-improve`.
This skill bridges proactive architectural discovery (hotspot scanning, shallow module identification, deletion tests) with Conductor's Spec-Driven Development execution engine, producing interactive HTML reports and auto-scaffolding refactoring tracks.

## Functional Requirements
1. **Skill Definition (`skills/conductor-improve/SKILL.md`)**:
   - Provide command `/conductor:conductor-improve`.
   - Phase 1: Explore codebase hot spots (`git log`), read living domain context (`CONTEXT.md` / `GLOSSARY.md`, ADRs), spawn subagent to spot shallow modules, leaky seams, and untested abstractions.
   - Phase 2: Render a standalone, self-contained HTML visual report (`<tmpdir>/architecture-review-<timestamp>.html`) with Tailwind and Mermaid before/after cards, opened via system browser/viewer (`xdg-open`).
   - Phase 3: Prompt user candidate selection using native interactive GUI modal (`ask_question`).
   - Phase 4: Grill candidate with living docs (updates `CONTEXT.md` and `docs/adr/` inline).
   - Phase 5: Handoff to `scripts/conductor_engine.py track init` or `conductor-new-track` to scaffold a refactor track.
2. **HTML Report Template Asset (`skills/conductor-improve/assets/HTML-REPORT.md`)**:
   - Provide the self-contained HTML template scaffold with Tailwind CDN, Mermaid CDN, and card layouts for candidates.
3. **Skill Catalog Registration (`assets/catalog.md`)**:
   - Register `conductor-improve` with detection signals, description, and trust classification.
4. **Automated Test Coverage**:
   - Unit tests in `tests/test_skills.py` asserting that `conductor-improve` skill, assets, and catalog entries conform to Conductor standards and relative path rules.

## Non-Functional Requirements
- **Terse Agent Context**: Follow ADR-0001; keep prompts lean, delegating state scaffolding to the engine.
- **Safety**: HTML written strictly to OS temp directory, never polluting the workspace.
- **Deterministic**: Tests run offline without requiring external network access.

## Acceptance Criteria
- `skills/conductor-improve/SKILL.md` exists and satisfies Conductor skill metadata and standards.
- `skills/conductor-improve/assets/HTML-REPORT.md` exists and contains the HTML report scaffold.
- `assets/catalog.md` lists `conductor-improve`.
- `tests/test_skills.py` passes all unit tests for the new skill.
- Handshake `python3 scripts/conductor_engine.py verify` passes.

## Out of Scope
- Direct code mutations during the architecture exploration phase (edits must happen only after a track is created).
- Network dependencies for report generation (all scripts/styles loaded self-contained or via CDN in temp file).
