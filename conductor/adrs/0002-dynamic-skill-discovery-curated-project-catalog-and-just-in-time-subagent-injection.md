# ADR 0002: Dynamic Skill Discovery, Curated Project Catalog, and Just-In-Time Subagent Injection

## Status
accepted

## Date
2026-10-16

## Context and Problem Statement
Large skill collections consume substantial token context and cause prompt dilution when loaded globally. We need dynamic discovery of skills tailored to the project, a dual-layer curated catalog in conductor/skills/, and Just-In-Time injection of skill instructions into subagents on a per-task basis.

## Decision Drivers
- Token context efficiency and eliminating prompt dilution in orchestrators and subagents
- Autonomous capability expansion tailored to real project dependencies and AST
- Tiered security trust model for 1p vs 3p skills with immutable Git SHA pinning
- Zero-leakage execution: subagents only receive skills relevant to their assigned task

## Considered Options
1. **Option 1: Global Skill Pre-loading**: Copy all discovered skills into `.agents/skills/` and expose them to all agents unconditionally.
2. **Option 2: Static Catalog with Manual Curl**: Maintain a fixed `assets/catalog.md` and require human intervention to find and download skills.
3. **Option 3 (Chosen): Dynamic Discovery, Project Catalog, and Plan-Bound JIT Injection**:
   - `SkillScanner` inspects project manifests (`package.json`, `Cargo.toml`, etc.), tech stack, and file ASTs.
   - Discovered skills are curated into a dual-layer project catalog: machine-readable `conductor/skills.json` and human/agent-readable `conductor/skills/index.md` linked in `conductor/index.md`.
   - `conductor-planner` binds relevant skills to individual tasks in `plan.md` using `[skills: <name>]` markers.
   - When `conductor-worker` is invoked, `AgentAdapter` JIT-injects only the assigned `SKILL.md` into the worker's isolated context.

## Decision Outcome
Adopted Option 3. This guarantees maximum token efficiency, maintains strict task sandboxing, and prevents untrusted skill prompts from polluting unrelated tasks.

## Positive Consequences
- Subagent contexts remain small and hyper-focused.
- Projects maintain an auditable, versioned catalog of authorized capabilities in `conductor/skills/`.
- 3p skills are gated behind security disclosures and pinned commit SHAs.

## Negative Consequences / Tradeoffs
- Planner and worker runners require an extra resolution step to load skills at task execution time.
- Requires maintenance of detection heuristics (dependency names, glob signals) across tech ecosystems.

## Linked Tracks
- auto_skill_discovery_and_jit_injection_20261016

