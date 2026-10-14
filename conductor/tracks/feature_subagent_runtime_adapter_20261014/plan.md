# Implementation Plan: Cross-Host Subagent Runtime Adapter

## Phase 1: AgentAdapter Engine Core (TDD Red-Green) [checkpoint: 37adff4]
- [x] Task: Create `tests/agent_adapter.test.ts` asserting agent markdown parsing, capability mapping, and host compilation. [6b46640]
- [x] Task: Implement `AgentAdapter` in `src/core/agent_adapter.ts` supporting Antigravity and Claude Code targets. [6e40a66]
- [x] Task: Run `bun test tests/agent_adapter.test.ts` to confirm Green phase. [553269c]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [37adff4]

## Phase 2: CLI, Integrity Auditor & Agent Definitions Alignment
- [x] Task: Extend `IntegrityAuditor` in `src/core/integrity_auditor.ts` to validate subagent configurations in `agents/`. [e6f743f]
- [x] Task: Add `agent` subcommand (`list`, `sync`) to `src/cli/index.ts`. [69449ea]
- [x] Task: Update `agents/*.md` definitions to specify canonical capabilities with host-compliant defaults. [a4eacc2]
- [ ] Task: Add integration tests in `tests/cli.test.ts`.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: MCP Server Integration, Handshake Verification & Final Sync
- [ ] Task: Expose `conductor_agent_list` and `conductor_agent_sync` tools and `conductor://agents` resource in `src/mcp/index.ts`.
- [ ] Task: Execute `bun run conductor agent sync` and verify generated manifests.
- [ ] Task: Run full test suite and confirm handshake integrity (`bun run conductor verify`).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)













