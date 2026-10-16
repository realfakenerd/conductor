# Implementation Plan: Dynamic Skill Discovery, Curated Project Catalog, and Just-In-Time Subagent Injection

## Phase 1: Core Skill Discovery, Catalog & Scanning (TDD)
- [x] Task: Unit tests for SkillScanner (dependency detection, glob matching, local & remote sources) [c7a9b38]
  - [ ] Write tests in `tests/skill_scanner.test.ts` for manifest parsing (`package.json`, `Cargo.toml`, `pyproject.toml`)
  - [ ] Write tests for local skills search and relevance scoring against keywords and globs
  - [ ] Verify tests fail (Red Phase)
- [x] Task: Implement SkillScanner in src/core/skill_scanner.ts [44253f8]
  - [ ] Implement manifest detection logic for npm, cargo, python, and go projects
  - [ ] Implement skill discovery scanner reading local host dirs and catalog assets
  - [ ] Verify `tests/skill_scanner.test.ts` passes (Green Phase)
- [ ] Task: Unit tests for SkillRepository (dual-layer conductor/skills.json & conductor/skills/index.md)
  - [ ] Write tests in `tests/skill_repository.test.ts` for reading, writing, and syncing dual-layer files
  - [ ] Write tests for trust level enforcement (1p vs 3p SHA pinning)
  - [ ] Verify tests fail (Red Phase)
- [ ] Task: Implement SkillRepository in src/core/skill_repository.ts
  - [ ] Implement atomic read/write synchronization between `conductor/skills.json` and `conductor/skills/index.md`
  - [ ] Implement registration, listing, and handshake verification
  - [ ] Verify `tests/skill_repository.test.ts` passes (Green Phase)
- [ ] Task: Phase 1 Verification & Checkpoint (Refer to workflow.md)

## Phase 2: JIT Injection, Plan Tagging & Engine Seams (TDD)
- [ ] Task: Extend PlanDocument to parse and serialize [skills: ...] task markers
  - [ ] Write unit tests in `tests/plan_document.test.ts` for `[skills: ...]` metadata extraction and preservation
  - [ ] Update `src/core/plan_document.ts` to support skill annotations on tasks
  - [ ] Verify all plan document tests pass
- [ ] Task: Implement JIT skill prompt compiler in src/core/agent_adapter.ts
  - [ ] Write unit tests in `tests/agent_adapter.test.ts` for task-bound skill prompt injection
  - [ ] Update `AgentAdapter` to load target `SKILL.md` content into worker prompt when requested
  - [ ] Verify agent adapter tests pass
- [ ] Task: Add CLI subcommands (conductor skill discover, list, install, inject) in src/cli/index.ts
  - [ ] Implement `skill` CLI commands with JSON output support
  - [ ] Add tests in `tests/cli.test.ts` covering skill subcommands
  - [ ] Verify CLI tests pass
- [ ] Task: Expose MCP tools (conductor_skill_discover, conductor_skill_list, conductor_skill_install) in src/mcp/index.ts
  - [ ] Add MCP tool definitions and handlers in `src/mcp/index.ts`
  - [ ] Add tests in `tests/mcp.test.ts` for skill MCP tools
  - [ ] Verify MCP tests pass
- [ ] Task: Phase 2 Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Integration, Skills Update & Full Verification
- [ ] Task: Update conductor-setup, conductor-new-track, and conductor-implement to use SkillRepository
  - [ ] Update skill recommendation sections in skills to reference `conductor skill discover` and `SkillRepository`
  - [ ] Update `conductor/workflow.md` to document plan-bound `[skills: ...]` tagging
- [ ] Task: Run full test suite (bun test) across all tests
  - [ ] Execute `bun test` and ensure zero failures
- [ ] Task: Execute bun run conductor verify for complete handshake integrity
  - [ ] Verify `conductor verify` validates the updated workspace and handshake
- [ ] Task: Phase 3 Verification & Checkpoint (Refer to workflow.md)




