# Specification: Subagent Dynamic Capability Negotiation & Self-Healing Adapter

## 1. Overview
Conductor enforces mandatory subagent delegation for planning, worker implementation, review, and discovery (`rules/conductor_standards.md`). However, static tool mapping in `AgentAdapter` maps the `mcp` capability to `call_mcp_tool`, which causes subagent executor construction to fail in environments (such as Antigravity/Jetski) where eager MCP tools are directly registered or `call_mcp_tool` is not recognized by the host runner. This track introduces dynamic capability probing, schema sanitization, and structured fallback handling to ensure subagent delegation is resilient across hosts.

## 2. Architecture & Seams
1. **Agent Adapter Core (`src/core/agent_adapter.ts`)**:
   - Update `ANTIGRAVITY_TOOL_MAP` to remove invalid `call_mcp_tool` dependency or make MCP tool bindings optional and dynamically resolvable.
   - Introduce capability negotiation logic in `compileManifest`: allow passing available host tools to filter out non-existent tool names.
   - Add graceful validation logic in `validateAgents()` to warn or sanitize unsupported tools per target host.
2. **Subagent Definitions (`agents/*.md`)**:
   - Review and align capabilities in `conductor-worker.md`, `conductor-planner.md`, `conductor-reviewer.md`, and `conductor-explorer.md`.
3. **CLI Integration (`src/cli/index.ts`)**:
   - Support `--host` and `--filter-tools` options in `conductor agent sync` and `conductor agent validate`.
4. **Testing Suite (`tests/agent_adapter.test.ts`)**:
   - Unit tests covering capability compilation, tool filtering, and host-specific manifest compilation.

## 3. Acceptance Criteria
- `compileManifest("antigravity", ...)` produces a valid tool array that does not reference non-existent host tools.
- `conductor agent validate` checks agent definitions and confirms valid mappings for Antigravity and Claude Code.
- Orchestrators receive clean validation feedback and reliable subagent execution.
- All tests pass via `bun test tests/agent_adapter.test.ts`.
