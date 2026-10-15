# Implementation Plan: Interactive Visual Track Dashboard & HTML Report Generator

## Phase 1: DashboardGenerator Core Engine (TDD Red-Green)
- [ ] Task: Create `tests/dashboard.test.ts` asserting HTML generation, track status rendering, and ADR linkage.
- [ ] Task: Implement `DashboardGenerator` in `src/core/dashboard.ts`.
- [ ] Task: Run `bun test tests/dashboard.test.ts` to confirm Green phase.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: CLI Subcommand & Status Integration
- [ ] Task: Add `conductor dashboard` and `conductor status --html` in `src/cli/index.ts`.
- [ ] Task: Add integration tests in `tests/cli.test.ts`.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: MCP Server Tool & Verification Handshake
- [ ] Task: Register `conductor_dashboard` tool in `src/mcp/index.ts`.
- [ ] Task: Update `skills/conductor-status/SKILL.md` to reference HTML dashboard capability.
- [ ] Task: Run `bun test` and `bun run conductor verify` to confirm project integrity.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
