# Specification: Dynamic Skill Discovery, Curated Project Catalog, and Just-In-Time Subagent Injection

## Overview
Large agent skill collections cause context bloat and prompt dilution when injected globally into orchestrators or subagents. This track implements an automated skill discovery engine (`SkillScanner`), a dual-layer project catalog (`SkillRepository` managing `conductor/skills.json` and `conductor/skills/index.md`), and plan-bound Just-In-Time (JIT) skill injection into isolated subagent execution sandboxes (`conductor-worker`).

## Functional Requirements

### 1. SkillScanner (Discovery & Detection)
- Inspect project manifests (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, etc.) and `conductor/tech-stack.md`.
- Search across hybrid source roots:
  - Local host environments (`~/.gemini/config/skills/`, `~/.claude/skills/`, `.agents/skills/`, `skills/`).
  - Remote/Curated registry (1p official and 3p community catalog).
- Match and rank skills based on detection signals:
  - Exact/regex dependencies (e.g., `svelte`, `firebase`, `esp-hal`).
  - Tech stack keywords and file glob patterns (e.g., `*.svelte`, `*.rs`, `routes/**`).
- Return ranked recommendations with relevance scores, matching signals, and trust status.

### 2. Dual-Layer Project Skill Catalog (SkillRepository)
- Persist project-specific skills in `conductor/skills.json` (machine-readable):
  - Skill name, version, source, party (1p vs 3p), commit SHA, description, triggers, and target tools.
- Render human/agent-readable markdown catalog in `conductor/skills/index.md` linking installed capabilities and trigger conditions.
- Update root handshake in `conductor/index.md` linking `[Project Skills](./skills/index.md)`.
- Support atomic CRUD operations on the catalog without data loss or markdown corruption.

### 3. Tiered Trust & Security Boundary
- 1p skills (verified local/official) installable with confirmation.
- 3p skills require explicit security disclosure warning and must pin to immutable Git commit SHAs.
- Prevent unvetted arbitrary command injection by isolating installed skill files in `.agents/skills/<name>/SKILL.md`.

### 4. Plan-Bound JIT Skill Injection
- Extend `PlanDocument` model to parse and serialize `[skills: skill-a, skill-b]` metadata markers on individual tasks.
- In `AgentAdapter`, dynamically resolve and compile assigned skill instructions into the subagent prompt/context only when launching `conductor-worker` for that specific task.
- Zero-leakage: tasks without skill markers run with standard lean subagent manifests.

### 5. Engine CLI & Native MCP Tools
- CLI Subcommands:
  - `bun run conductor skill discover [--json]`: Scans workspace and outputs ranked candidate skills.
  - `bun run conductor skill list [--json]`: Lists currently registered project skills.
  - `bun run conductor skill install <name> [--sha <commit>]`: Registers and downloads a skill into the project catalog.
  - `bun run conductor skill inject <name> --task "<task>"`: Compiles JIT prompt payload for worker execution.
- MCP Tools:
  - `conductor_skill_discover`: Returns JSON recommendations for the workspace.
  - `conductor_skill_list`: Returns registered project skills.
  - `conductor_skill_install`: Installs and registers a target skill.

## Non-Functional Requirements
- **Runtime**: Strict TypeScript/Bun runtime; zero Python files.
- **Performance**: Discovery scanning completes in < 500ms on typical repositories.
- **Safety**: Safe handling of missing manifests, malformed skill frontmatters, and disconnected networks.

## Acceptance Criteria
- Unit tests cover `SkillScanner` detection across JS, Rust, and Python manifest samples.
- Unit tests cover `SkillRepository` dual-layer read/write consistency.
- Unit tests verify `PlanDocument` parsing and serialization of `[skills: ...]` tags.
- CLI subcommands and MCP tool declarations validate cleanly and return status code 0.
- `bun run conductor verify` succeeds with project skills linked in the handshake.
