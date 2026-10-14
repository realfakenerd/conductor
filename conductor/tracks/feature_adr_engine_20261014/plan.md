# Implementation Plan: First-Class Architecture Decision Records (ADR) Engine

## Phase 1: AdrRepository Engine Core (TDD Red-Green) [checkpoint: b966468]
- [x] Task: Create `tests/adr_repository.test.ts` asserting ADR creation, sequential numbering, index updates, and listing. [b966468]
- [x] Task: Implement `AdrRepository` in `src/core/adr_repository.ts` with MADR scaffolding. [b966468]
- [x] Task: Run `bun test tests/adr_repository.test.ts` to confirm Green phase. [b966468]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [b966468]

## Phase 2: Integrity Auditor & CLI Integration [checkpoint: 61e66bd]
- [x] Task: Extend `IntegrityAuditor` in `src/core/integrity_auditor.ts` to audit `conductor/adrs/index.md` and ADR track links. [61e66bd]
- [x] Task: Add `adr` subcommand to `src/cli/index.ts` supporting `list`, `init`, and `link`. [61e66bd]
- [x] Task: Add integration tests in `tests/cli.test.ts` and `tests/engine_core.test.ts`. [61e66bd]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [61e66bd]

## Phase 3: MCP Tools & Resources, Agent Wiring & Handshake [checkpoint: ce2e289]
- [x] Task: Add `conductor_adr_list`, `conductor_adr_init`, and `conductor_adr_link` tools plus `conductor://adrs` resource in `src/mcp/index.ts`. [ce2e289]
- [x] Task: Link `conductor/adrs/index.md` in `conductor/index.md`. [ce2e289]
- [x] Task: Update `agents/conductor-planner.md` to reference ADR workflows. [ce2e289]
- [x] Task: Run full test suite and confirm handshake integrity (`bun run conductor verify`). [ce2e289]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [ce2e289]















