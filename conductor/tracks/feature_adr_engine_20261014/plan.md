# Implementation Plan: First-Class Architecture Decision Records (ADR) Engine

## Phase 1: AdrRepository Engine Core (TDD Red-Green)
- [ ] Task: Create `tests/adr_repository.test.ts` asserting ADR creation, sequential numbering, index updates, and listing.
- [ ] Task: Implement `AdrRepository` in `src/core/adr_repository.ts` with MADR scaffolding.
- [ ] Task: Run `bun test tests/adr_repository.test.ts` to confirm Green phase.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Integrity Auditor & CLI Integration
- [ ] Task: Extend `IntegrityAuditor` in `src/core/integrity_auditor.ts` to audit `conductor/adrs/index.md` and ADR track links.
- [ ] Task: Add `adr` subcommand to `src/cli/index.ts` supporting `list`, `init`, and `link`.
- [ ] Task: Add integration tests in `tests/cli.test.ts` and `tests/engine_core.test.ts`.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: MCP Tools & Resources, Agent Wiring & Handshake
- [ ] Task: Add `conductor_adr_list`, `conductor_adr_init`, and `conductor_adr_link` tools plus `conductor://adrs` resource in `src/mcp/index.ts`.
- [ ] Task: Link `conductor/adrs/index.md` in `conductor/index.md`.
- [ ] Task: Update `agents/conductor-planner.md` to reference ADR workflows.
- [ ] Task: Run full test suite and confirm handshake integrity (`bun run conductor verify`).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
