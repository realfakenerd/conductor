# ADR 0005: Phase Checkpoint, Task Finish, and Track Resolution Seams

## Status
Accepted

## Context
Conductor skills such as `conductor-implement` and `conductor-review` interact with `scripts/conductor_engine.py` to drive task execution according to `workflow.md`.
While `conductor_engine.py` provides deterministic track lifecycle transitions (`init`, `start`, `reset`, `complete`) and task advancement (`track advance`), three friction points remained:

1. **Phase Checkpointing Leakage**: Concluding a phase requires reading previous checkpoints, finding modified files, drafting a verification report, attaching a git note to the target commit, and regex-splicing `[checkpoint: <sha>]` into the markdown heading in `plan.md`. This was handled entirely by caller prompts.
2. **Fragmented Task Finish Protocol**: Completing a single task required two distinct engine calls (`conductor_engine.py note <sha> ...` followed by `conductor_engine.py track advance <track_id> --task ... --status done --sha <sha>`), creating unnecessary round-trips and risk of mismatched state.
3. **Client-side Track Resolution**: Skills duplicated heuristics to match a user-supplied track name or locate the first incomplete track from `conductor_engine.py list --json`.

## Decision
Deepen `scripts/conductor_engine.py` and `PlanDocument`:
1. **Phase Checkpoint Seam (`track checkpoint`)**:
   - Add `PlanDocument.checkpoint(phase_name, sha)` to mutate phase headers preserving formatting.
   - Add CLI `conductor_engine.py track checkpoint <track_id> --phase <phase_name> --sha <sha> [--report <path> | --summary <text>]`.
   - Engine attaches the verification git note and updates `plan.md`.
2. **Task Finish Seam (`track finish`)**:
   - Add CLI `conductor_engine.py track finish <track_id> --task <task_name> --sha <sha> --summary <text> [--files <files>]`.
   - Engine atomically attaches the git note to the commit and advances the task in `plan.md` to done with `<sha>`.
3. **Track Resolution Seam (`track resolve`)**:
   - Add CLI `conductor_engine.py track resolve [--query <text>] [--json]`.
   - Returns the exact matched track, ambiguous matches, or the first incomplete track.
4. **Refactor `skills/conductor-implement/SKILL.md`**:
   - Align operational steps with the new deepened seams.

## Consequences
- **Positive**: `conductor-implement` shrinks prompt ceremony, eliminates header regex splicing hallucinations, and guarantees atomic task completion.
- **Positive**: High locality—all AST plan mutations and git note creations remain inside `conductor_engine.py`.
- **Neutral**: Existing subcommands (`track advance`, `note`, `list`) remain preserved for backward compatibility and fine-grained scripting.
