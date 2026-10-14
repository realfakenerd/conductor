# Specification: Enforce Conductor Subagent Delegation Across Standards and Skills

## 1. Overview
Codify mandatory subagent delegation across Conductor operational rules and skill definitions. When executing in agentic environments supporting subagents (such as Antigravity and Claude Code), orchestrator agents must delegate planning, coding, reviewing, and exploration tasks to their specialized subagents (`conductor-planner`, `conductor-worker`, `conductor-reviewer`, `conductor-explorer`) to prevent context pollution, eliminate self-review bias, and isolate file mutations in dedicated worktree sandboxes.

## 2. Invariants & Rules
1. **Rule Codification (`rules/conductor_standards.md`)**:
   - Add Section 5: **Subagent Scope & Delegation Invariant**:
     - Check if `invoke_subagent` is available.
     - When available, MUST delegate:
       - Spec & Plan authoring -> `conductor-planner`
       - TDD task execution -> `conductor-worker` (using `conductor_worktree_create` sandbox)
       - Code review & verification -> `conductor-reviewer`
       - Discovery & architecture scans -> `conductor-explorer`
     - Fall back to inline execution strictly when `invoke_subagent` is absent.

2. **Skill Handoff Directives**:
   - `skills/conductor-implement/SKILL.md`: Update task execution loop to invoke `conductor-worker` for each task.
   - `skills/conductor-review/SKILL.md`: Update review protocol to dispatch to `conductor-reviewer`.
   - `skills/conductor-new-track/SKILL.md`: Update planning protocol to dispatch to `conductor-planner`.
   - `skills/conductor-discover/SKILL.md`: Update exploration step to dispatch to `conductor-explorer`.
   - `skills/conductor-improve/SKILL.md`: Update diagnostic scan to dispatch to `conductor-explorer`.

3. **Automated Verification**:
   - `tests/skills.test.ts` asserts that `conductor_standards.md` contains the subagent delegation invariant and that skills reference their corresponding subagents.

## 3. Acceptance Criteria
- `rules/conductor_standards.md` explicitly contains Section 5 with mandatory subagent delegation protocol.
- All 5 relevant skills reference their respective subagent delegation steps.
- Unit tests in `tests/skills.test.ts` assert subagent delegation invariants across rules and skills.
- `bun test` passes 100% green.
- `bun run conductor verify` remains valid.
