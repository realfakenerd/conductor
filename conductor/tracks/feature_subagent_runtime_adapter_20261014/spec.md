# Specification: Cross-Host Subagent Runtime Adapter

## 1. Overview
Autonomous subagents (`conductor-worker`, `conductor-planner`, `conductor-reviewer`, `conductor-explorer`) provide isolated execution environments for Conductor workflows. However, subagent manifests currently declare generic tool names (`read`, `shell`, `mcp`) that are rejected by host execution environments (e.g., Antigravity's tool registry expects native tools such as `view_file`, `run_command`, `call_mcp_tool`).

This track introduces a deterministic subagent runtime adapter (`AgentAdapter`) in the Conductor core engine, CLI commands (`conductor agent sync`, `conductor agent list`), manifest compiler for Antigravity and Claude Code runtimes, and subagent validation within `IntegrityAuditor`.

## 2. Architecture & Seams
1. **Engine Core (`src/core/agent_adapter.ts`)**:
   - `AgentAdapter` class:
     - `listAgents(): AgentDefinition[]`
     - `compileForHost(agent: AgentDefinition, host: "antigravity" | "claude"): CompiledAgentManifest`
     - `syncAgents(options?: { host?: "antigravity" | "claude" | "all", targetDir?: string }): SyncResult`
   - Maps abstract tool permissions to host-native tools:
     - Antigravity: `view_file`, `replace_file_content`, `write_to_file`, `run_command`, `call_mcp_tool`, `ask_question`
     - Claude Code: `bash`, `view`, `edit`, `glob`, `grep`
2. **Canonical Agent Definitions (`agents/*.md`)**:
   - Update `conductor-worker.md`, `conductor-planner.md`, `conductor-reviewer.md`, and `conductor-explorer.md` with explicit tool capability maps.
3. **CLI Integration (`src/cli/index.ts`)**:
   - `conductor agent list [--json]`
   - `conductor agent sync [--host <antigravity|claude|all>]`
4. **Integrity Auditor Integration (`src/core/integrity_auditor.ts`)**:
   - Audits that all subagent markdown files in `agents/` are valid, well-formed, and map cleanly to host tool definitions.
5. **MCP Server Integration (`src/mcp/index.ts`)**:
   - Expose `conductor_agent_list` and `conductor_agent_sync` tools.
   - Resource: `conductor://agents` returning active agent manifests.

## 3. Acceptance Criteria
- Unit tests in `tests/agent_adapter.test.ts` pass, proving correct parsing, tool resolution, and manifest compilation for both Antigravity and Claude Code.
- `conductor agent list` outputs structured agent metadata.
- `conductor agent sync` writes compliant agent manifests without crashing host tool registries.
- `IntegrityAuditor` flags invalid or unregistered agent tools.
- `bun run conductor verify` validates the complete project context and subagent health.
