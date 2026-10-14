# Specification: Add Conductor Subagents (Worker, Planner, Reviewer, Explorer)

## 1. Overview
Introduce specialized autonomous subagents to Conductor (`agents/*.md`), providing isolated execution contexts for planning, test-driven implementation, code review, and architectural exploration. This quarantines heavy file reading and test execution logs, prevents self-review bias, and enables parallel multi-track workflows in isolated Git worktrees.

## 2. Agent Definitions & Roles
1. **`conductor-planner`** (`agents/conductor-planner.md`):
   - **Role**: Spec & Design Architect.
   - **Capabilities**: Read-only + MCP state tools.
   - **Responsibilities**: Interrogates requirements via Grill with Docs, updates living documentation (`CONTEXT.md` / ADRs), scaffolds new tracks, and writes `spec.md` and `plan.md`.
2. **`conductor-worker`** (`agents/conductor-worker.md`):
   - **Role**: TDD Implementation Runner.
   - **Capabilities**: Read/Write + Shell execution (`bun test`, git) + MCP finish tools.
   - **Responsibilities**: Takes a single task from `plan.md`, runs the Red-Green-Refactor loop in an isolated worktree sandbox, commits code, and calls `conductor_track_finish`. Returns a terse receipt to the orchestrator.
3. **`conductor-reviewer`** (`agents/conductor-reviewer.md`):
   - **Role**: Principal Quality & Standards Auditor.
   - **Capabilities**: Read-only + Git diff inspection.
   - **Responsibilities**: Evaluates completed phases and tracks against `spec.md` acceptance criteria, code styleguides, and zero-python invariants. Reports structured findings.
4. **`conductor-explorer`** (`agents/conductor-explorer.md`):
   - **Role**: Multi-Lens Discovery Scout.
   - **Capabilities**: Read-only + HTML report generator.
   - **Responsibilities**: Surveys commit hotspots, module depth, and missing feature opportunities for `conductor-improve` and `conductor-discover`.

## 3. Integration & Packaging
- Placed in `agents/` adhering to Antigravity plugin structure.
- `agy plugin install .` must recognize and register: `✔ agents : 4 processed`.
- Automated tests in `tests/skills.test.ts` updated to validate agent markdown frontmatter and role definitions.
- Registered in `assets/catalog.md` and `conductor/product.md`.

## 4. Acceptance Criteria
- All 4 agent markdown files exist in `agents/` with valid headers and system prompts.
- `bun test` verifies all agent files pass integrity and frontmatter checks.
- `agy plugin install .` successfully processes 4 agents.
- Handshake verification (`bun run conductor verify`) remains 100% valid.
