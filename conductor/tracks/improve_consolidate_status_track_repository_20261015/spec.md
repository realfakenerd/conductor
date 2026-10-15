# Specification: Consolidate getProjectStatus into TrackRepository

## 1. Overview
Currently, the 50-line `getProjectStatus` function is duplicated verbatim between `src/cli/index.ts` and `src/mcp/index.ts`, while `src/core/mcp_resources.ts` also independently replicates active track resolution and plan document loading.

This refactor track deepens `TrackRepository` by introducing `getStatus(trackId?: string | null): ProjectStatus`. The repository encapsulates all track metrics calculation, active track selection, and plan AST parsing, eliminating copy-pasted caller plumbing and consolidating project telemetry into a single testable query interface.

## 2. Architecture & Seams
1. **Engine Core (`src/core/track_repository.ts`, `src/core/types.ts`)**:
   - Introduce typed interfaces in `src/core/types.ts`:
     - `ProjectTrackCounts`: `{ total: number, complete: number, in_progress: number, pending: number }`
     - `ActiveTrackSummary`: `{ track_id: string, title: string, status: TrackStatus, current_phase: string | null, current_task: string | null, next_pending_task: string | null, total_tasks: number, completed_tasks: number, in_progress_tasks: number, pending_tasks: number, progress_percent: number }`
     - `ProjectStatus`: `{ timestamp: string, tracks: ProjectTrackCounts, active_track: ActiveTrackSummary | null }`
   - Implement `TrackRepository.getStatus(trackId?: string | null): ProjectStatus`.
2. **Callers Refactoring**:
   - `src/cli/index.ts`: Remove duplicated `getProjectStatus`, invoke `repo.getStatus()`.
   - `src/mcp/index.ts`: Remove duplicated `getProjectStatus`, invoke `repo.getStatus()`.
   - `src/core/mcp_resources.ts`: Update `conductor://active-track` resource resolver to use `repo.getStatus()`.

## 3. Acceptance Criteria
- Unit tests in `tests/engine_core.test.ts` verify `TrackRepository.getStatus()` returns accurate counts and active track summaries.
- Duplicated `getProjectStatus` functions deleted from `src/cli/index.ts` and `src/mcp/index.ts`.
- All CLI and MCP tests pass unchanged (`tests/cli.test.ts`, `tests/mcp_server.test.ts`, `tests/mcp_resources_prompts.test.ts`).
- Full test suite passes and `bun run conductor verify` reports clean handshake.
