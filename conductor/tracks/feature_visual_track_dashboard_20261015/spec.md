# Specification: Interactive Visual Track Dashboard & HTML Report Generator

## 1. Overview
Conductor provides robust CLI status commands (`conductor status`) and visual HTML discovery/refactor reports (`conductor-discover`, `conductor-improve`). However, daily project management and multi-agent coordination lack an interactive visual dashboard. This track adds `conductor dashboard` (and `conductor status --html`), which generates a self-contained, interactive HTML dashboard visualizing registered tracks, phase progress bars, ADR links, git verification notes, and active task state.

## 2. Architecture & Seams
1. **Dashboard Generator (`src/core/dashboard.ts`)**:
   - `DashboardGenerator` class:
     - Aggregates data from `TrackRepository` (status, phases, tasks, completion rates).
     - Aggregates ADR linkage from `AdrRepository`.
     - Ingests git notes and verification checkpoints from `src/core/git_notes.ts`.
     - Compiles a modern, responsive HTML page with Tailwind CSS and Mermaid diagrams.
2. **CLI Seam (`src/cli/index.ts`)**:
   - Add `conductor dashboard [--out <path>] [--open]`:
     - Generates dashboard to `<tmpdir>/conductor-dashboard-<timestamp>.html` (or specified path).
     - Launches in default browser via `xdg-open` / `open` when `--open` is provided.
   - Add `--html` flag to `conductor status`.
3. **MCP Tool Integration (`src/mcp/index.ts`)**:
   - Add `conductor_dashboard` tool returning HTML path or markdown summary.
4. **Testing Suite (`tests/dashboard.test.ts`)**:
   - Unit tests verifying HTML generation, track data rendering, and ADR link embedding.

## 3. Acceptance Criteria
- `conductor dashboard` generates a valid standalone HTML document containing all registered tracks.
- Dashboard visualizes active track progress, phase completion bars, and linked ADRs.
- Supports `--open` to view in browser automatically.
- All unit and CLI tests pass via `bun test`.
