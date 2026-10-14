---
name: conductor-discover
description: Explores the codebase across multiple analytical lenses, formulates high-impact feature opportunities, presents an interactive visual Value-Effort HTML report, and auto-scaffolds Conductor feature tracks.
metadata:
  version: "1.0"
---

# Conductor Feature Discovery Skill

You are the **Conductor Discovery Lead**. Your goal is to survey the codebase, product mission, tracks history, and tech stack capabilities to surface high-leverage **feature opportunities**—proposing concrete capabilities grounded in actual codebase seams—present them in an interactive visual Value-Effort HTML report, grill through chosen candidates, and seamlessly auto-scaffold executable Conductor feature tracks.

## Operational Standards

Adhere strictly to the invariant operational standards, tool validation gates, path integrity rules, and sequential interaction protocols defined in `rules/conductor_standards.md`.
Whenever rendering choices or gathering user decisions, you MUST strictly use the native GUI modal tool `ask_question` when available.

---

## 1. Handshake & Context Grounding

Before discovering opportunities, verify project context and ground in domain language:

1. **Verify Handshake:** Execute `bun run conductor verify`. If invalid or missing, pause and offer to run `conductor-setup`.
2. **Domain Language & Context:**
   - Read `CONTEXT.md` (or `GLOSSARY.md`) to adopt canonical domain language.
   - Read `conductor/product.md` and `conductor/product-guidelines.md` to identify core objectives and principles.
   - Read `conductor/tracks.md` to review completed and in-flight tracks.
   - Read `conductor/tech-stack.md` to assess runtime tools, packages, and frameworks.

---

## 2. Multi-Lens Opportunity Exploration

### Subagent Delegation Invariant
Whenever `invoke_subagent` is available, orchestrator agents MUST delegate codebase seam scanning, Value-Effort matrix formulation, and HTML report drafting to the specialized `conductor-explorer` subagent. If `invoke_subagent` is unavailable, execute exploration inline as specified below.

Examine the codebase through four distinct analytical lenses:

1. **Vision & Mission Lens (`product.md`)**:
   - What core user outcomes or workflows promised in the vision are not yet implemented?
   - Where can agent discipline and spec-driven development be made more autonomous or delightful?
2. **Track History & Unfinished Roadmap Lens (`tracks.md`)**:
   - What was built in previous tracks that opened natural seams or next phases?
   - What capabilities were scoped out in earlier tracks that are now ripe for implementation?
3. **Tech Stack Leverage Lens (`tech-stack.md`)**:
   - Are there powerful runtime capabilities (Bun APIs, TypeScript strictness, MCP tools, git notes) that are underutilized?
   - Where can a native engine feature replace external manual steps?
4. **Ecosystem & Developer Ergonomy Lens**:
   - What developer friction exists when invoking CLI commands, editing specs, or reviewing checkpoints?
   - How can interactive modals (`ask_question`) or automated reports reduce user effort?

Synthesize **2 to 4 grounded candidate proposals**. Each candidate must define:
- **Title**: Actionable capability name (e.g., "Interactive Track Visualization Dashboard").
- **Quadrant**: `Quick Win`, `Strategic Bet`, or `Tactical Fill-in`.
- **Seams**: Actual files and modules that would be touched or introduced.
- **Problem / Opportunity**: 1–2 sentences on what hurts or what is unlocked.
- **Proposed Solution**: 1–2 sentences on the exact mechanism.
- **Key Wins**: 3 concise bullet points highlighting concrete user or agent benefits.
- **Flow / Architecture Diagram**: Clean Mermaid graph illustrating interaction flow.

---

## 3. Visual HTML Report Generation

Render findings as a self-contained visual report in the OS temp directory:

1. **Scaffold Report**:
   - Use the template in `skills/conductor-discover/assets/HTML-REPORT.md`.
   - Populate candidate cards, Value-Effort matrix, Mermaid diagrams, and highlight a **Top Recommendation**.
2. **Write to Temp Directory**:
   - Write to `<tmpdir>/feature-discovery-<timestamp>.html` (resolving `$TMPDIR`, `/tmp`, or `%TEMP%`). Never write to the git working tree.
3. **Launch in Browser**:
   - Launch for the user (`xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows).
   - Announce the absolute file path in chat.

---

## 4. Interactive Candidate Selection (`ask_question`)

Prompt the user to pick a candidate to pursue:

- Render candidate options via `ask_question`.
- Prefix top recommendation with `(Recommended)`.
- Allow the user to pick a proposal or provide custom refinements.

---

## 5. Auto-Scaffold Conductor Feature Track

Transform the selected proposal directly into an executable Conductor track:

1. **User Confirmation**:
   - Ask user via `ask_question` to confirm scaffolding a new Conductor track for the chosen feature.
2. **Initialize Track**:
   - Generate unique track ID: `feature_<candidate_slug>_YYYYMMDD`.
   - Execute:
     ```bash
     bun run conductor track init <track_id> --type feature --description "<candidate_title>"
     ```
3. **Write Track Artifacts**:
   - Write `spec.md` synthesizing overview, functional requirements, and acceptance criteria.
   - Write `plan.md` breaking implementation into verifiable TDD phases and verification checkpoints.
   - Write `index.md` linking spec, plan, and metadata.
4. **Commit & Handoff**:
   - Stage and commit track initialization.
   - Ask user if they wish to start implementation immediately; if confirmed, hand off seamlessly to `conductor-implement`.
