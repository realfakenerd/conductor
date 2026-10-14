# Product Definition: Conductor

## Vision
Conductor transforms AI coding assistants into disciplined, spec-driven engineering partners. By enforcing Spec-Driven Development (SDD), Conductor ensures every modification, feature, or bug fix follows a clear lifecycle: Context -> Spec & Plan -> Implement -> Review.

## Target Audience & Users
- Developers using AI coding assistants (Antigravity CLI/IDE, Claude Code).
- Teams seeking predictable, reproducible agentic coding behavior and persistent project awareness.

## Core Features
1. **Spec-Driven Lifecycle**:
   - `conductor-setup`: Scaffolds project context, guidelines, tech stack, and workflow.
   - `conductor-new-track`: Defines structured specs and actionable task plans for features and bugs.
   - `conductor-implement`: Executes plan tasks step-by-step with strict TDD and git commit checkpoints.
   - `conductor-review`: Conducts verification against specs and architectural standards using deterministic review auditing (`conductor review check`).
   - `conductor-status`: Inspects active tracks, phases, and task progress.
   - `conductor-revert`: Intelligently rolls back units of work (tracks, phases, tasks).
   - `conductor-improve`: Diagnoses architectural friction, generates visual HTML reports, and scaffolds refactor tracks.
   - `conductor-discover`: Explores multi-lens codebase seams, formulates high-impact feature opportunities, and scaffolds feature tracks.
2. **Autonomous Subagents (`agents/*.md`)**:
   - `conductor-planner`: Spec & Design Architect (Grill with Docs, ADRs, spec and plan generation).
   - `conductor-worker`: TDD Implementation Runner (Red-Green-Refactor execution in isolated worktrees).
   - `conductor-reviewer`: Principal Auditor (objective multi-axis review against specs and standards).
   - `conductor-explorer`: Multi-Lens Discovery Scout (seam mapping, HTML reports, value-effort matrices).
3. **Adaptive User Experience (View Layer)**:
   - Native GUI interactive modal prompts (`ask_question`) in visual IDE environments.
   - Clean, numbered textual CLI fallback in terminal consoles.
4. **Cross-Agent Plugin Compatibility**:
   - Seamless installation and operation across Antigravity and Claude Code ecosystems.

## Success Metrics
- Zero-drift spec adherence across automated code generations.
- Consistent TDD test coverage and verifiable implementation phases.
- Minimal manual intervention needed for context alignment.
