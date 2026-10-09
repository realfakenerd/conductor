# Specification: Deepen Conductor Implement and Engine Seams

## Overview
Deepen `scripts/conductor_engine.py` to establish high-leverage workflow seams for Phase Checkpointing, Atomic Task Finish, and Track Resolution. Refactor `skills/conductor-implement/SKILL.md` to consume these seams, removing prompt ceremony, preventing client-side regex manipulation, and ensuring atomic state synchronization.

## Functional Requirements
1. **Track Resolution Seam (`track resolve`)**:
   - `conductor_engine.py track resolve [--query <text>] [--json]`
   - If `--query` is provided: exact match or unambiguous case-insensitive substring match. Returns matched track or list of candidates if ambiguous.
   - If `--query` is not provided: returns the first incomplete track (`in_progress` or `new/pending`).
2. **Atomic Task Finish Seam (`track finish`)**:
   - `conductor_engine.py track finish <track_id> --task <task_name> --sha <sha> --summary <summary> [--files <files>]`
   - Attaches git note to `<sha>` with task summary and files.
   - Atomically advances `<task_name>` in `plan.md` to `[x]` with `[<sha_short>]`.
3. **Phase Checkpoint Seam (`track checkpoint`)**:
   - `conductor_engine.py track checkpoint <track_id> --phase <phase_name> --sha <sha> [--report <path>] [--summary <summary>]`
   - Updates the phase header in `plan.md` using `PlanDocument.checkpoint(phase_name, sha)` to format as `## Phase N: <name> [checkpoint: <sha_short>]`.
   - Attaches phase verification git note to `<sha>`.
4. **Skills Modernization (`skills/conductor-implement/SKILL.md`)**:
   - Modernize Track Selection to use `conductor_engine.py track resolve`.
   - Modernize Task Loop to use `conductor_engine.py track finish`.
   - Add explicit Phase Completion step in the task loop invoking `conductor_engine.py track checkpoint`.

## Architecture Before / After
- **Before**: `conductor-implement` coordinates 2 CLI engine calls per task, relies on prompt instructions to splice `[checkpoint: <sha>]` into markdown headers, and performs fuzzy JSON scanning for tracks.
- **After**: Unified engine seams encapsulate git note creation, AST heading mutations, and query resolution behind clean, deterministic CLI commands.

## Acceptance Criteria
- [ ] `PlanDocument.checkpoint(phase_name, sha)` correctly identifies and updates phase headers with `[checkpoint: <sha>]` while preserving rest of document.
- [ ] `conductor_engine.py track resolve` correctly resolves tracks by query or finds next incomplete track.
- [ ] `conductor_engine.py track finish` atomically attaches git note and advances task in `plan.md`.
- [ ] `conductor_engine.py track checkpoint` attaches git note and writes checkpoint to `plan.md`.
- [ ] Comprehensive test suite in `tests/test_conductor_engine.py` covering all new seams.
- [ ] `skills/conductor-implement/SKILL.md` updated and validated with all tests passing.
