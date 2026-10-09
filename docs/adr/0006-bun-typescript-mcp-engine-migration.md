# ADR 0006: Complete Migration to Bun, TypeScript, and Native Model Context Protocol (Zero Python)

## Status
Accepted

## Context
Conductor was originally implemented with Python scripts (`scripts/conductor_engine.py`, `scripts/resume.py`) and pytest. While reliable and functional, this architecture introduced operational friction:
1. **Subprocess & Execution Latency**: Calling `python3 scripts/conductor_engine.py` incurs 150-250ms startup latency per command, plus token consumption from CLI command formatting and bash output handling.
2. **Missing Native Agent Integration**: Modern agent hosts (Antigravity, Claude Desktop, Cursor, JetBrains) support the Model Context Protocol (MCP) as first-class citizens, allowing agents to call typed tools directly with structured inputs and JSON payloads.
3. **Runtime Preference**: The development environment strictly prefers Bun over Node.js and Bun over Python. Bun provides instant startup (~10ms), native TypeScript execution, built-in fast test runners (`bun test`), and binary compilation capabilities.

## Decision
Execute a complete rewrite and architectural migration:
1. **TypeScript Engine Core (`src/core/`)**:
   - Rewrite `TrackRepository`, `PlanDocument`, `IntegrityAuditor`, and resumption audits in modern TypeScript using Bun APIs.
   - 100% test coverage using `bun test`.
2. **Dual-Entry Architecture (`src/cli/` & `src/mcp/`)**:
   - `src/cli/index.ts`: Executable CLI compatible with all existing commands (`bun run conductor <command>`).
   - `src/mcp/index.ts`: Native stdio Model Context Protocol server implementing `@modelcontextprotocol/sdk` and `zod`.
   - Expose all engine operations as native MCP tools: `conductor_verify`, `conductor_status`, `conductor_list`, `conductor_resume`, `conductor_track_resolve`, `conductor_track_start`, `conductor_track_reset`, `conductor_track_advance`, `conductor_track_finish`, `conductor_track_checkpoint`, `conductor_track_complete`.
3. **Complete Python Deletion (Zero Python Invariant)**:
   - Remove `scripts/conductor_engine.py`, `scripts/resume.py`.
   - Remove `tests/*.py`, `pyproject.toml`, `uv.lock`, `.venv`, and `.pytest_cache`.
4. **Skills Modernization**:
   - Update `skills/*/SKILL.md` to instruct agents to call native Conductor MCP tools directly, falling back to `bun run conductor ...` in CLI environments.
   - Configure MCP server declaration in `plugin.json`.

## Consequences
- **Positive**: Direct typed JSON tool calling reduces prompt token overhead and eliminates shell parsing errors.
- **Positive**: Sub-15ms startup execution under Bun.
- **Positive**: Zero Python footprint in the repository.
- **Positive**: Full type safety with Zod schemas and TypeScript interfaces.
