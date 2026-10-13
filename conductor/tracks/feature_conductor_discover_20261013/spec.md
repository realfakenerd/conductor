# Specification: Add conductor-discover Skill for Codebase Feature Exploration and Ideation

## 1. Overview
Introduce `conductor-discover` (`skills/conductor-discover/SKILL.md`), a new first-party skill in the Conductor suite. It complements `conductor-improve` (which addresses past architectural debt) by providing forward-looking exploration of new capabilities, workflows, and developer ergonomy opportunities grounded in the codebase.

## 2. Functional Requirements
1. **Handshake Verification**:
   - Executes `bun run conductor verify`. Validates repository context and links before scanning.
2. **Multi-Lens Repository Scan**:
   - *Vision & Objectives*: Inspects `conductor/product.md` and `conductor/product-guidelines.md` for core missions and gaps.
   - *Track History & Roadmap*: Analyzes `conductor/tracks.md` and completed track designs to extrapolate natural follow-ups.
   - *Tech Stack Leverage*: Audits `conductor/tech-stack.md` and codebase dependencies (Bun runtime features, MCP SDK, git notes).
   - *Ecosystem & Neighbor Gaps*: Surfaces developer ergonomics, tool integrations, or workflow automations.
3. **Structured Candidate Formulation**:
   - Synthesizes 2–4 high-impact feature candidates.
   - Each candidate includes: Title, Summary, Opportunity/Problem, Value Proposition, Implementation Seams, and Value-Effort placement (Quick Win, Major Bet, Tactical Fill).
4. **Visual HTML Report**:
   - Generates standalone HTML report in OS temp directory (`<tmpdir>/feature-discovery-<timestamp>.html`).
   - Styled with Tailwind CSS CDN, includes Mermaid visual diagrams (Architecture / Flow), and interactive Value-Effort matrix.
   - Automatically launches report in default browser (`xdg-open`, `open`, `start`).
5. **Interactive GUI Selection (`ask_question`)**:
   - Presents candidate options to user with recommended option prefixed with `(Recommended)`.
   - Supports user direction and refinement.
6. **Automated Track Scaffolding**:
   - Seamlessly transitions selected feature candidate into `conductor-new-track` workflow, pre-populating description, spec, and plan outlines.

## 3. Non-Functional Requirements & Invariants
- **Zero Python Invariant**: Pure Markdown skill + TypeScript/Bun test validation.
- **Terse Communication Invariant**: Terse like smart caveman, technical terms exact, drop fluff.
- **Path Integrity & Tool Standards**: Complies with `rules/conductor_standards.md` and `rules/conductor_antigravity.md`.

## 4. Acceptance Criteria
- `skills/conductor-discover/SKILL.md` exists with valid YAML frontmatter.
- `skills/conductor-discover/assets/HTML-REPORT.md` template exists and renders correctly.
- `assets/catalog.md` updated with `conductor-discover` 1st-party skill.
- `tests/skills.test.ts` includes `conductor-discover` in expected skills and passes 100%.
- Handshake verification (`bun run conductor verify`) remains 100% valid.
