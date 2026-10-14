# Implementation Plan: Enforce Conductor Subagent Delegation Across Standards and Skills

## Phase 1: Rule & Tests Codification (TDD Red-Green) [checkpoint: 654b5dd]
- [x] Task: Add assertions in `tests/skills.test.ts` verifying subagent delegation rules in `rules/conductor_standards.md` and skills. [654b5dd]
- [x] Task: Update `rules/conductor_standards.md` to add Section 5 Subagent Scope & Delegation Invariant. [654b5dd]
- [x] Task: Run `bun test tests/skills.test.ts` to confirm Green phase. [654b5dd]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [654b5dd]

## Phase 2: Skill Definitions Update [checkpoint: 654b5dd]
- [x] Task: Update `skills/conductor-implement/SKILL.md` to mandate `conductor-worker` delegation. [654b5dd]
- [x] Task: Update `skills/conductor-review/SKILL.md` to mandate `conductor-reviewer` delegation. [654b5dd]
- [x] Task: Update `skills/conductor-new-track/SKILL.md` to mandate `conductor-planner` delegation. [654b5dd]
- [x] Task: Update `skills/conductor-discover/SKILL.md` and `skills/conductor-improve/SKILL.md` to mandate `conductor-explorer` delegation. [654b5dd]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [654b5dd]

## Phase 3: Integration Audit & Verification [checkpoint: 654b5dd]
- [x] Task: Run full test suite and confirm 100% pass under `bun test`. [654b5dd]
- [x] Task: Confirm handshake integrity with `bun run conductor verify`. [654b5dd]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [654b5dd]













