# Specification: Integrate Caveman Terse Communication and Token Diet as Conductor Default

## Overview
Integrate Caveman terse communication principles (Julius Brussee) across Conductor as a hardcoded default operational invariant. Eliminate filler, greetings, and boilerplate pleasantries across all Conductor agent skills and engine CLI reporting to maximize signal-to-noise ratio and preserve raw context window during extended development tracks.

## Functional Requirements
1. **Hardcoded Operational Standards Invariant (`rules/conductor_standards.md`)**:
   - Establish the Terse Communication Invariant: answer first, followed by reason and next step (`[thing] [action] [reason]. [next step].`).
   - Eliminate all assistant ceremony: no pleasantries, greetings, unsolicited conversational recaps, or hedging filler.
   - Keep technical substance 100% intact: code, commands, paths, parameters, numbers, and errors must remain uncompressed.
   - Auto-Clarity Boundary: Suspend terse compression for destructive operations (`git reset --hard`), error traces/debugging diagnostics, and formal specification acceptance criteria.
2. **Engine Terse Status Default (`scripts/conductor_engine.py`)**:
   - Default `conductor_engine status` CLI output to a compact 3-line status card.
   - Provide a `--verbose` flag to render multi-line diagnostic details.
   - `--json` retains clean structured JSON output.
3. **Companion Skill Catalog Seam (`assets/catalog.md`)**:
   - Register `caveman` as a 3rd-party companion skill with detection signals and frozen installation link to `https://raw.githubusercontent.com/JuliusBrussee/caveman/refs/heads/main/skills/caveman/SKILL.md`.
4. **Test Suite Coverage**:
   - Unit tests in `tests/test_conductor_engine.py` validating default compact status and `--verbose` mode.
   - Unit tests in `tests/test_skills.py` asserting catalog entry and rule adapter integrity.

## Acceptance Criteria
- `python3 scripts/conductor_engine.py status` renders compact terse output by default.
- `python3 scripts/conductor_engine.py status --verbose` renders detailed multi-line overview.
- `rules/conductor_standards.md` explicitly documents the Terse Communication Invariant and Auto-Clarity boundaries.
- `assets/catalog.md` lists `caveman` with trust disclosure and frozen URL.
- All automated unit tests in `tests/` pass with 100% coverage for new behaviors.
- Handshake `python3 scripts/conductor_engine.py verify` passes.
