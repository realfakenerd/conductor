---
name: conductor-update
description: Migrates and updates existing Conductor workspaces initialized with older Conductor versions to the latest standards. Use whenever the user asks to update conductor files, upgrade conductor workspace, migrate workspace from an older version, refresh conductor workflow or styleguides, or synchronize conductor rules and index handshake.
metadata:
  version: "1.0"
---

# Conductor Workspace Update Skill

You are the **Conductor Architect**. Your goal is to migrate and modernize an existing project workspace that was initialized with an older version of Conductor to the latest standards, ensuring zero data loss and preserving user customizations.

## Operational Standards

Adhere strictly to the invariant operational standards, tool validation gates, path integrity rules, and sequential interaction protocols defined in `rules/conductor_standards.md`.

## 1. Workspace Audit & Version Detection

Before making any changes, inspect the project directory to evaluate its current Conductor configuration and Git state.

### 1.1 Git Hygiene Check
Execute `git status --porcelain`.
- If uncommitted changes exist outside `conductor/`, warn the user:
  *"WARNING: You have uncommitted working directory changes outside conductor/. Please commit or stash them before proceeding with the workspace update."*
- Request confirmation to proceed using a **Yes/No question** via `ask_question`.

### 1.2 Handshake & Integrity Baseline
1. Verify `conductor/index.md` exists.
   - If missing: Inform the user that the workspace is not yet initialized with Conductor. Recommend running `conductor-setup` instead and **HALT**.
2. Run integrity verification:
   `bun run conductor verify` (or MCP tool `conductor_verify`).
   Record missing links, broken tracks, or ghost commits as the pre-update baseline.

### 1.3 Scan Installed Artifacts
Inspect existing artifacts in the workspace:
- **Workflow (`conductor/workflow.md`)**: Check for current architectural sections:
  - Phase Checkpoints and Git Notes (`conductor note`)
  - Subagent Scope & Delegation Invariants (`conductor-worker`, `conductor-planner`, `conductor-reviewer`)
  - Worktree Isolation (`conductor worktree`)
  - Pre-Commit Guard (`conductor guard`)
  - ADR Linkage and Architectural Invariants
- **Index Handshake (`conductor/index.md`)**:
  - Verify whether ADRs (`conductor/adrs/`) or Capabilities (`.agents/skills/`) are linked.
- **Code Style Guides (`conductor/code_styleguides/`)**:
  - Compare files against library in `skills/conductor-setup/assets/code_styleguides/`.
- **Local Agent Rules**:
  - Check whether `rules/conductor_standards.md` or `rules/conductor_antigravity.md` exist and need synchronization.
- **Tracks Registry (`conductor/tracks.md`) & Tracks (`conductor/tracks/`)**:
  - Check tracks schema and status parsing via `bun run conductor list --json`.

---

## 2. Interactive Migration Plan

Based on the audit, construct a structured migration plan and present it to the user.

### 2.1 Present Discrepancies
Provide a clear breakdown of detected updates:
1. **Workflow Updates**: New standards, verification loops, or subagent invariants available in the latest template.
2. **Index Structure**: Missing sections (such as ADR index or Agent Capabilities).
3. **Style Guides**: Outdated or newly available style guides matching the project's tech stack.
4. **Agent Rules**: Updates to Conductor standards and modal dialog rules.

### 2.2 Confirmation & Mode Selection
Prompt the user using `ask_question`:
- **(Recommended) Full Update**: Update workflow, refresh index, sync styleguides, and update agent rules with intelligent merge.
- **Selective Update**: Allow user to pick individual components via a multiple-choice question.
- **Cancel**: Abort migration without modifying any files.

---

## 3. Intelligent Three-Way Merge & Migration Execution

Execute the update preserving user customizations and adhering to relative path integrity.

### 3.1 Workflow Modernization (`conductor/workflow.md`)
1. Read existing `conductor/workflow.md`.
2. Read the latest template from `skills/conductor-setup/assets/workflow.md`.
3. Detect custom project settings (e.g., custom test coverage targets, bespoke commit conventions, special tool constraints) in the existing workflow.
4. Merge updates:
   - Preserve project-specific guidelines, team conventions, and customized parameters.
   - Inject updated standard sections (such as Subagent Delegation Invariants, Git Notes, and Pre-commit Guards).
5. Write merged content to `conductor/workflow.md`.

### 3.2 Index Handshake Refresh (`conductor/index.md`)
1. Ensure `conductor/index.md` contains valid links to:
   - `[Product Definition](./product.md)`
   - `[Product Guidelines](./product-guidelines.md)`
   - `[Tech Stack](./tech-stack.md)`
   - `[Workflow](./workflow.md)`
   - `[Code Style Guides](./code_styleguides/)`
2. If `conductor/adrs/` exists or ADRs are in use, ensure `[Architecture Decision Records](./adrs/)` is indexed.
3. If `.agents/skills/` exists, ensure `[Agent Skills](../.agents/skills/)` is indexed under `## Capabilities`.
4. Preserve any additional custom links previously added by the user.

### 3.3 Style Guide Synchronization
1. For each style guide in `conductor/code_styleguides/`, check if an updated version exists in `skills/conductor-setup/assets/code_styleguides/`.
2. If custom additions were made to the local style guide, append them to the updated guide.
3. If new languages exist in `conductor/tech-stack.md` without corresponding style guides, offer to copy them.

### 3.4 Agent Rules Synchronization
If the workspace maintains local agent rules in `rules/`:
- Sync `rules/conductor_standards.md` with the latest operational standards.
- Sync `rules/conductor_antigravity.md` with modal prompt invariants.

---

## 4. Verification & Validation Gate

After applying updates, you MUST validate the workspace integrity:

1. **Integrity Audit**:
   Run `bun run conductor verify`.
   - Ensure `valid: true` and `missing_links: []`.
   - If any missing links are reported, resolve them immediately.
2. **Status Check**:
   Run `bun run conductor status --json`.
   - Ensure the track repository and active track parse cleanly without schema errors.
3. **Resumption Check**:
   Run `bun run conductor resume`.
   - Ensure `setup_complete: true`.

---

## 5. Commit & Completion

1. **Git Commit**:
   Stage updated files in `conductor/` and `rules/`.
   Create an atomic commit:
   ```bash
   git commit -m "conductor(update): Migrate workspace to latest Conductor standards"
   ```
2. **Completion Report**:
   Present a concise summary:
   - Summary of updated components (workflow, index, style guides, rules).
   - Confirmation of passed integrity checks.
   - Highlight newly unlocked capabilities (e.g., ADR tracking, subagent delegation, worktree isolation).
