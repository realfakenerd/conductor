# 0001: Hybrid Deterministic State Engine and Skill Architecture

## Status
Accepted

## Context
Conductor was originally designed as a set of prompt-based agent skills where the host LLM performed all state mutations directly: auditing directory progression, regex-modifying markdown checklists in `tracks.md` and `plan.md`, formatting git commits, attaching git notes, and calculating relative path links.

As the number of skills grew to six (`conductor-setup`, `conductor-new-track`, `conductor-implement`, `conductor-review`, `conductor-status`, `conductor-revert`), this design created architectural friction:
- **Shallowness**: Each skill prompt leaked low-level regex patterns, file formats, and shell commands into the model context.
- **Hallucination Risk**: LLM-driven edits occasionally produced invalid markdown checkbox states or malformed git notes.
- **Zero Locality**: Any change to metadata schemas or checklist conventions required simultaneous prompt updates across six skills.
- **Testability Friction**: Prompt-based state mutations could not be tested offline with deterministic unit tests.

## Decision
We adopt a hybrid architecture:
1. **Deterministic Conductor Engine (`scripts/conductor_engine.py`)**: A deep Python module with a minimal CLI and library interface handling all state mutations, track scaffolding, plan status transitions (`[ ]` -> `[~]` -> `[x]`), git notes attachments, and handshake verifications.
2. **Lean Skills**: Agent skills retain natural language orchestration, reasoning, user interview dialogs, and code implementation, but delegate state manipulation to `conductor_engine.py`.
3. **Global Standards Rule Adapter (`rules/conductor_standards.md`)**: Invariant operational standards and sequential interaction protocols are extracted from skill preambles into a reusable plugin rule.
4. **Single Catalog Seam (`assets/catalog.md`)**: Skill recommendations query a single root catalog, eliminating asset duplication and URL drift.

## Consequences
### Positive
- **High Depth & Leverage**: State logic lives behind a tiny subcommand interface (`resume`, `track init`, `track advance`, `note add`, `verify`).
- **100% Deterministic Testing**: All state operations are covered by fast offline pytest suites without live LLM calls.
- **High Locality**: Schema and format changes happen in one Python file.
- **Prompt Token Savings**: Deletes over 250 lines of duplicate prompt preambles and regex instructions from agent context.

### Negative / Trade-offs
- Requires Python 3 runtime on the host machine (which is already a prerequisite for Conductor's `resume.py` and the developer environment).
