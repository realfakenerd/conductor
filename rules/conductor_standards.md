---
trigger: model_decision
description: Invariant operational standards, tool validation, relative path integrity, and sequential interaction protocols for all Conductor skills.
---

# Conductor Operational Standards

These invariant standards govern agent behavior during any Conductor skill execution.

## 1. Operational Invariants
- **Precise Execution**: Do not skip steps. Do not make assumptions about project state; always verify via terminal or engine commands.
- **Tool Validation**: Validate the success of every tool call. If a command fails, review the error, attempt to self-correct once, or halt and request guidance.
- **Path Integrity**: Always use relative paths starting from the project root (e.g., `conductor/product.md`, `conductor/tracks/`).
- **Project Root Constraint**: Treat the current working directory as the project root. All Conductor artifacts must reside within `conductor/` in the current project root.
- **Strategic Transparency**: Before creating or modifying core infrastructure, explain the strategic "Why" behind the scaffolding to guide the user.

## 2. Interaction Protocol & Question Modalities
- **Native Modal First**: Whenever `ask_question` is available, render all user decisions, menus, and confirmations as native interactive GUI modals. Fall back to structured numbered text menus only in pure CLI environments.
- **Structured Choices**: Provide context-aware single-choice or multiple-choice options for decisions. Format options as the user's direct response.
- **Recommended Options**: Prefix the preferred choice with `(Recommended)` and provide a brief rationale.
- **Sequential Execution**: In text-only interactions, ask questions strictly one at a time and await the user's response before proceeding.

## 3. Handshake & Context Verification
- Before beginning track planning, implementation, or review, verify that `conductor/index.md` exists and all linked context documents (`product.md`, `tech-stack.md`, `workflow.md`) are present on disk.
