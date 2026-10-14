# Implementation Plan: Enforce Conductor Subagent Delegation Across Standards and Skills

## Phase 1: Rule & Tests Codification (TDD Red-Green)
- [ ] Task: Add assertions in `tests/skills.test.ts` verifying subagent delegation rules in `rules/conductor_standards.md` and skills.
- [ ] Task: Update `rules/conductor_standards.md` to add Section 5 Subagent Scope & Delegation Invariant.
- [ ] Task: Run `bun test tests/skills.test.ts` to confirm Green phase.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Skill Definitions Update
- [ ] Task: Update `skills/conductor-implement/SKILL.md` to mandate `conductor-worker` delegation.
- [ ] Task: Update `skills/conductor-review/SKILL.md` to mandate `conductor-reviewer` delegation.
- [ ] Task: Update `skills/conductor-new-track/SKILL.md` to mandate `conductor-planner` delegation.
- [ ] Task: Update `skills/conductor-discover/SKILL.md` and `skills/conductor-improve/SKILL.md` to mandate `conductor-explorer` delegation.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Integration Audit & Verification
- [ ] Task: Run full test suite and confirm 100% pass under `bun test`.
- [ ] Task: Confirm handshake integrity with `bun run conductor verify`.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
