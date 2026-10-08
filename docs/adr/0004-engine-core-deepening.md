# 0004: Engine Core Deepening with TrackRepository, PlanDocument, and IntegrityAuditor

## Status
Accepted

## Context
Following ADR-0002, `scripts/conductor_engine.py` established a query seam and lifecycle state machine. However, architectural friction remains across three internal domains:
1. **Scattered Dual-Write State**: `init_track`, `start_track`, `complete_track`, and `reset_track` duplicate markdown regex replacements and JSON file mutations across four procedures. Failure in one write risks state drift between `tracks.md` and `metadata.json`.
2. **Asymmetric Plan Handling**: Task advancement (`advance_task`) uses raw line-matching and string replacement that drops surrounding line formatting and subtasks, while `parse_plan` uses a separate regex pass.
3. **Shallow Verification**: `verify_handshake` only checks hyperlink presence in `conductor/index.md`, while skills (`conductor-review`, `conductor-revert`) independently invoke raw git commands and heuristic commit regexes to verify work.

## Decision
We deepen `scripts/conductor_engine.py` by consolidating internal engine mechanics into three deep modules within the single-file engine architecture:
1. **`TrackRepository`**:
   - Encapsulates transactional state mutations across `conductor/tracks.md` and `metadata.json`.
   - Enforces fail-fast validation, structured exceptions (`EngineError`), and atomic rollback on write failures.
2. **`PlanDocument` Model**:
   - Parses `plan.md` into an abstract syntax tree representing phases, tasks, subtasks, and checkpoint markers.
   - Provides clean mutations (`advance(task_name, status, sha)`) preserving exact document formatting.
3. **`IntegrityAuditor`**:
   - Deepens verification: verifies index links, track directory workspace parity, and validates commit SHAs against git history.
   - Exposes `verify` command with deep checks by default and an optional `--fast` flag for link-only checks.

## Consequences
### Positive
- **Locality**: Dual-write synchronization, markdown plan parsing, and git integrity checks are isolated in deep domain classes.
- **Robustness**: Eliminates silent state drift between `tracks.md` and `metadata.json` with transactional rollback.
- **Leverage**: Skills and CLI commands interact with high-capability interfaces without leaking file layout or git heuristics.
- **Zero-Dependency**: Preserves single-file portability of `scripts/conductor_engine.py`.

### Negative / Trade-offs
- Expands unit test requirements to cover rollback edge cases and plan document parsing variations.
