# Specification: Add Native Model Context Protocol (MCP) Resources and Prompt Templates

## 1. Overview
Extend the Conductor MCP stdio server (`src/mcp/index.ts`) beyond Tools to implement full MCP specification support:
1. **MCP Resources**: Provide deterministic URIs for direct context reading (`resources/list`, `resources/read`) without tool invocation token overhead:
   - `conductor://tracks`: JSON list of all registered tracks, statuses, and metadata.
   - `conductor://active-track`: Real-time summary and progress metrics of the currently active track.
   - `conductor://handshake`: Full contents of root index handshake (`conductor/index.md`) and project definition.
   - `conductor://context`: The domain model and glossary (`CONTEXT.md`).
2. **MCP Prompt Templates**: Provide structured prompts (`prompts/list`, `prompts/get`) for host AI agents:
   - `conductor_track_start`: Prompt template guiding an agent through track initialization or resumption.
   - `conductor_task_implement`: Prompt template enforcing TDD (Red-Green-Refactor) and commit rules.

## 2. Functional Requirements
1. **MCP Server Capabilities Declaration**:
   - Declare `resources: {}` and `prompts: {}` in server capabilities upon initialization.
2. **Resource Endpoints**:
   - Handle `ListResourcesRequestSchema` returning the 4 canonical URIs with MIME types (`application/json`, `text/markdown`).
   - Handle `ReadResourceRequestSchema` resolving `conductor://` URIs dynamically using `TrackRepository`, `PlanDocument`, and filesystem reads.
3. **Prompt Endpoints**:
   - Handle `ListPromptsRequestSchema` returning available prompt templates with description and arguments.
   - Handle `GetPromptRequestSchema` generating formatted role-based messages for host agents.
4. **CLI Integration**:
   - Expose `conductor resource <uri>` to allow terminal users, scripts, and tests to read resources directly.

## 3. Non-Functional Requirements & Invariants
- **Zero Python Invariant**: Strictly TypeScript under Bun runtime.
- **Fast Execution**: Resource reads must resolve in < 10ms.
- **Spec Adherence**: Compliant with `@modelcontextprotocol/sdk` schemas.

## 4. Acceptance Criteria
- `ListResourcesRequestSchema` lists all 4 resources.
- `ReadResourceRequestSchema` accurately returns contents for all 4 URIs.
- `ListPromptsRequestSchema` and `GetPromptRequestSchema` return valid prompt messages.
- Test suite in `tests/mcp_resources_prompts.test.ts` passes 100% under `bun test`.
- Handshake verification (`bun run conductor verify`) remains 100% valid.
