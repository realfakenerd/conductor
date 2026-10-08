# 0002: Deterministic State Machine and Query Seam for Conductor Engine

## Status
Accepted

## Context
Following ADR-0001, `scripts/conductor_engine.py` was introduced as a deterministic state engine. While write mutations (`track init`, `track advance`, `track complete`, `note add`) were centralized in the engine:
1. **Asymmetric Lifecycle**: Starting a track (`[ ]` -> `[~]`) still required caller skills (`conductor-implement`) to edit `tracks.md` manually with regexes or file rewrites. Resetting/reverting tasks or tracks had no engine interface.
2. **Missing Query Seam**: Skills (`conductor-status`, `conductor-implement`, `conductor-review`, `conductor-revert`) each duplicated markdown parsing and regex logic to inspect `tracks.md` and `plan.md`, extract in-progress tasks, and calculate completion percentages. This created hallucination risk and high interface friction.
3. **Incomplete Standards Migration**: `conductor-status`, `conductor-review`, and `conductor-revert` retained duplicated operational standards rather than delegating to `rules/conductor_standards.md`.

## Decision
We expand `scripts/conductor_engine.py` into a fully bidirectional, deep state engine:
1. **Query & Inspection Seam**:
   - Provide `get_project_status(root_dir)` and `list_tracks(root_dir)` in the engine.
   - Expose CLI subcommands:
     - `status`: Outputs aggregate completion metrics, active phase/task, and next pending action (human-readable or `--json`).
     - `list`: Outputs structured table or JSON list of all registered tracks.
2. **Symmetrical Track Lifecycle**:
   - Provide `track start <track_id>`: Deterministically transitions track status from `[ ]` to `[~]` in `tracks.md` and `metadata.json`.
   - Provide `track reset <track_id>`: Deterministically resets track status from `[~]` or `[x]` to `[ ]`.
   - Enhance `track advance`: Allow resetting tasks back to `pending`.
3. **Skill Harmonization**:
   - Refactor `conductor-status`, `conductor-implement`, `conductor-review`, and `conductor-revert` to consume engine query and lifecycle subcommands.
   - Delegate operational standards across all skills to `rules/conductor_standards.md`.
4. **Resumption Backward Compatibility**:
   - Maintain `skills/conductor-setup/scripts/resume.py` as a lightweight backward-compatible forwarder, while directing all canonical unit tests and skills to `conductor_engine.py`.

## Consequences
### Positive
- **High Locality**: Markdown checklist format changes and calculations live strictly in `conductor_engine.py`.
- **Zero Prompt Parsing**: Skills drop complex regex instructions and progress math, eliminating model hallucination.
- **High Leverage**: One query and lifecycle interface serves all 7 Conductor skills.
- **100% Deterministic Test Coverage**: All query calculations, state transitions, and edge cases are verified offline via pytest.

### Negative / Trade-offs
- Expands the responsibilities of `conductor_engine.py`, requiring robust test coverage across diverse plan markdown formats.
