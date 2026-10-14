# Implementation Plan: Add Native Model Context Protocol (MCP) Resources and Prompt Templates

## Phase 1: Test Suite & Core Resource Resolver (TDD Red Phase)
- [ ] Task: Create `tests/mcp_resources_prompts.test.ts` asserting resource list, resource read, and prompt schemas via InMemoryTransport.
- [ ] Task: Implement `src/core/mcp_resources.ts` resolving `conductor://` URIs and generating prompt templates.
- [ ] Task: Run `bun test` to confirm test suite transitions from Red to Green.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Server Integration & CLI Resource Reader
- [ ] Task: Register `resources` and `prompts` request handlers in `src/mcp/index.ts`.
- [ ] Task: Wire `resource` subcommand into `src/cli/index.ts` for direct CLI resource inspection.
- [ ] Task: Run full test suite and confirm all tests pass under `bun test`.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
