# Specification: Migrate Conductor Engine to Bun, TypeScript, and Native MCP (Zero Python)

## Overview
Perform a complete architectural rewrite of the Conductor Engine from Python into Bun and TypeScript. Provide a native Model Context Protocol (MCP) stdio server (`@modelcontextprotocol/sdk`) exposing all engine operations as typed agent tools, alongside a dual-entry CLI runner under Bun. Completely eliminate all Python files and toolchains (`scripts/*.py`, `tests/*.py`, `pyproject.toml`, `uv.lock`, `.venv`) in favor of pure Bun and TypeScript.

## Functional Requirements
1. **TypeScript Engine Core (`src/core/`)**:
   - `TrackRepository`: Encapsulates atomic dual-writes across `conductor/tracks.md` and `metadata.json` with rollback. Supports `listTracks`, `getTrack`, `initTrack`, `startTrack`, `resetTrack`, `completeTrack`, and `resolveTrack`.
   - `PlanDocument`: AST-based representation of `plan.md` parsing phases, tasks, status markers, and metrics. Supports non-destructive mutations via `advance(taskName, status, sha)` and `checkpoint(phaseName, sha)`.
   - `IntegrityAuditor`: Audits handshake links in `index.md`, track workspace integrity, and reconciles git commit SHAs to detect ghost commits.
   - `determineResumption`: Audits project setup progress and determines the next unblocked setup step.
   - `GitNotesAdapter`: Attaches and reads formatted verification git notes.

2. **Native MCP Server (`src/mcp/index.ts`)**:
   - Uses `@modelcontextprotocol/sdk` and `zod` over stdio transport.
   - Registers all Conductor operations as native MCP tools:
     - `conductor_status`: Get project and active track progress metrics.
     - `conductor_verify`: Audit handshake links, track parity, and git commits.
     - `conductor_list`: List all registered tracks with metadata.
     - `conductor_resume`: Audit setup checklist and return next unblocked step.
     - `conductor_track_init`: Scaffold track workspace, metadata, and registry entry.
     - `conductor_track_resolve`: Resolve track by query or get next incomplete track.
     - `conductor_track_start`: Transition track to `in_progress`.
     - `conductor_track_reset`: Reset track back to `pending`.
     - `conductor_track_advance`: Advance task in `plan.md` to `pending`, `in_progress`, or `done`.
     - `conductor_track_finish`: Atomically attach git note and advance task to `done` with commit SHA.
     - `conductor_track_checkpoint`: Record `[checkpoint: <sha>]` on phase header, attach verification note, and mark checkpoint task complete.
     - `conductor_track_complete`: Mark track complete.

3. **CLI Runner (`src/cli/index.ts`)**:
   - Provides CLI commands for shell execution, CI runners, and git hooks (`bun run conductor <command>`).

4. **Zero Python Invariant**:
   - Delete `scripts/conductor_engine.py`, `scripts/resume.py`.
   - Delete `tests/test_conductor_engine.py`, `tests/test_resume.py`, `tests/test_skills.py`.
   - Delete `pyproject.toml`, `uv.lock`, `.venv`, and `.pytest_cache`.
   - Setup `package.json`, `tsconfig.json`, and Bun dependency graph (`@modelcontextprotocol/sdk`, `zod`).

5. **Skills & Host Integration**:
   - Update `plugin.json` to declare the MCP server.
   - Update `skills/*/SKILL.md` to instruct agents to invoke native Conductor MCP tools first, falling back to `bun run conductor ...` in CLI environments.
   - Update `conductor/tech-stack.md` and `conductor/workflow.md` to reflect Bun and TypeScript.

## Acceptance Criteria
- [ ] Comprehensive unit test suite in `tests/*.test.ts` passing via `bun test` with 100% feature parity.
- [ ] Native MCP server boots over stdio and responds to MCP tool calls via JSON-RPC.
- [ ] CLI runner passes all verification and lifecycle commands (`bun run conductor verify`).
- [ ] Zero `.py` files remain in the codebase (`git grep "\.py"` returns 0 results).
- [ ] All 7 conductor skills updated with MCP tool call instructions.
- [ ] Handshake integrity verified clean.
