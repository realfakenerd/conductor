# Implementation Plan: Migrate Conductor Engine to Bun, TypeScript, and Native MCP (Zero Python)

## Phase 1: Bun Project Setup & Core Types [checkpoint: f2249b0] (TDD Red -> Green)
- [x] Task: Initialize package.json, tsconfig.json, and install Bun dependencies [53512d4]
    - [ ] Create `package.json` with `@modelcontextprotocol/sdk` and `zod`
    - [ ] Configure `tsconfig.json` for Bun and TypeScript strict mode
    - [ ] Run `bun install` and verify environment
- [x] Task: Write failing unit tests for TypeScript Engine Core (Red Phase) [efb789e]
    - [ ] Create `tests/engine_core.test.ts` covering TrackRepository, PlanDocument AST, IntegrityAuditor, and git notes
    - [ ] Run `bun test` and confirm expected test failures
- [x] Task: Implement TypeScript Engine Core in `src/core/` (Green Phase) [02c6279]
    - [ ] Implement `src/core/track_repository.ts` with atomic dual-writes and rollback
    - [ ] Implement `src/core/plan_document.ts` with AST mutation, `advance`, `checkpoint`, and metrics
    - [ ] Implement `src/core/integrity_auditor.ts` and `src/core/git_notes.ts`
    - [ ] Run `bun test` and confirm all Phase 1 tests pass
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [f2249b0]

## Phase 2: Dual-Entry CLI Runner in TypeScript [checkpoint: 31b021d] (TDD Red -> Green)
- [x] Task: Write failing unit tests for Bun CLI runner (Red Phase) [b7e257c]
    - [ ] Create `tests/cli.test.ts` verifying all CLI commands (`verify`, `status`, `list`, `resume`, `track init/start/advance/finish/checkpoint/complete/resolve`)
    - [ ] Run `bun test tests/cli.test.ts` and confirm test failures
- [x] Task: Implement `src/cli/index.ts` and wire package.json binary (Green Phase) [60192e5]
    - [ ] Implement command parser in `src/cli/index.ts`
    - [ ] Add `"bin": { "conductor": "./src/cli/index.ts" }` and script shortcuts in `package.json`
    - [ ] Run `bun test tests/cli.test.ts` and confirm all tests pass
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [31b021d]

## Phase 3: Native Model Context Protocol (MCP) Server (TDD Red -> Green)
- [x] Task: Write failing unit tests for Conductor MCP Server (Red Phase) [62531f4]
    - [ ] Create `tests/mcp_server.test.ts` testing in-memory MCP Client/Server tool listing and tool calls
    - [ ] Run `bun test tests/mcp_server.test.ts` and confirm test failures
- [~] Task: Implement `src/mcp/index.ts` with @modelcontextprotocol/sdk (Green Phase)
    - [ ] Implement MCP Server with Zod schemas for all 12 Conductor tools
    - [ ] Add stdio transport bootstrap
    - [ ] Register MCP server in `plugin.json`
    - [ ] Run `bun test tests/mcp_server.test.ts` and confirm all tests pass
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Zero Python Elimination & Skill Modernization
- [ ] Task: Delete all Python scripts, tests, virtualenv, and configurations
    - [ ] Remove `scripts/conductor_engine.py`, `scripts/resume.py`
    - [ ] Remove `tests/*.py`, `pyproject.toml`, `uv.lock`, `.venv`, and `.pytest_cache`
    - [ ] Verify zero `.py` files remain in repository
- [ ] Task: Modernize all skills and project documentation
    - [ ] Update `skills/*/SKILL.md` to instruct agents to call native Conductor MCP tools first (with Bun CLI fallback)
    - [ ] Update `conductor/tech-stack.md` and `conductor/workflow.md` to Bun and TypeScript
    - [ ] Run `bun test` and `bun run src/cli/index.ts verify` to ensure clean handshake
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)





