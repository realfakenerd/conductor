# Specification: Deepen Conductor Engine with State Machine and Query Seam

## Overview
Deepen `scripts/conductor_engine.py` to establish a bidirectional state engine with a unified Query & Inspection Seam and a complete Track Lifecycle State Machine. Align caller skills (`conductor-status`, `conductor-implement`, `conductor-review`, `conductor-revert`) to delegate state inspection, progress math, and lifecycle mutations to the engine, while standardizing rule adapter usage across all skills.

## Functional Requirements
1. **Engine Query & Inspection Seam (`scripts/conductor_engine.py`)**:
   - `list_tracks(root_dir=".")`: Returns structured list of registered tracks with status, id, description, and workspace path.
   - `get_project_status(root_dir=".", track_id=None)`: Returns aggregate project metrics (total tracks, completed, in-progress, pending, progress percentage), active track details, active phase/task, and next pending action.
   - CLI subcommands:
     - `status [--track TRACK_ID] [--json]`: Human-readable summary or JSON payload of project/track status.
     - `list [--json]`: Human-readable table or JSON list of registered tracks.
2. **Symmetrical Track Lifecycle State Machine (`scripts/conductor_engine.py`)**:
   - `start_track(track_id, root_dir=".")`: Transitions track status to `[~]` (in progress) in both `tracks.md` and `metadata.json`. CLI: `track start <track_id>`.
   - `reset_track(track_id, root_dir=".")`: Transitions track status back to `[ ]` (pending) in `tracks.md` and `metadata.json`. CLI: `track reset <track_id>`.
   - Support task resetting in `advance_task` (status `pending` / `[ ]`).
3. **Skill Harmonization**:
   - Refactor `skills/conductor-status/SKILL.md` to consume `conductor_engine status` and remove duplicate regex parsing instructions.
   - Refactor `skills/conductor-implement/SKILL.md` to use `conductor_engine track start <track_id>` instead of manual file editing.
   - Refactor `skills/conductor-review/SKILL.md` and `skills/conductor-revert/SKILL.md` to use `conductor_engine status` / `list` for scope and candidate discovery.
   - Harmonize `conductor-status`, `conductor-review`, and `conductor-revert` preambles to link directly to `rules/conductor_standards.md` and verify handshake via `conductor_engine verify`.
4. **Resumption Backward Compatibility & Test Suite**:
   - Retain `skills/conductor-setup/scripts/resume.py` as forwarder.
   - Comprehensive unit test suite in `tests/test_conductor_engine.py` covering query parsing, percentage calculations, status transitions, and edge cases.

## Acceptance Criteria
- `python3 scripts/conductor_engine.py list` and `python3 scripts/conductor_engine.py status` produce valid human-readable and JSON output.
- `python3 scripts/conductor_engine.py track start <track_id>` updates both `tracks.md` (`[~]`) and `metadata.json` (`in_progress`).
- `python3 scripts/conductor_engine.py track reset <track_id>` reverts status to pending (`[ ]`).
- `tests/test_conductor_engine.py` includes offline unit tests for all new query and lifecycle features with 100% pass rate.
- All 7 Conductor skills in `skills/*/SKILL.md` link to `rules/conductor_standards.md` and run `conductor_engine.py verify`.
- `python3 scripts/conductor_engine.py verify` passes.
