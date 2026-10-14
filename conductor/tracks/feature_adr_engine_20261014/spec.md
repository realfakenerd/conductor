# Specification: First-Class Architecture Decision Records (ADR) Engine

## 1. Overview
Elevate Architecture Decision Records (ADRs) to first-class citizens within Conductor. Architectural decisions made during track planning, feature discovery, and codebase deepening must be preserved as living documentation in `conductor/adrs/`. Introduce an `AdrRepository` engine seam, CLI subcommands, native MCP tools, and bidirectional link validation inside `IntegrityAuditor`.

## 2. Architecture & Seams
1. **ADR Storage & Template (`conductor/adrs/`)**:
   - Files named sequentially: `conductor/adrs/0001-<slug>.md`.
   - Adheres to MADR (Markdown Architecture Decision Records) specification:
     - Context and Problem Statement
     - Decision Drivers
     - Considered Options
     - Decision Outcome & Consequences
     - Linked Conductor Tracks
   - Index document: `conductor/adrs/index.md` linked in root handshake (`conductor/index.md`).
2. **Engine Core (`src/core/adr_repository.ts`)**:
   - `AdrRepository` class managing ADR file lifecycles:
     - `listAdrs(): AdrEntry[]`
     - `initAdr(title: string, options?: { status?: string, context?: string }): AdrEntry`
     - `linkAdr(adrNumber: number, trackId: string): boolean`
3. **Integrity Auditor Integration (`src/core/integrity_auditor.ts`)**:
   - Validates all ADR files in `conductor/adrs/` are listed in `conductor/adrs/index.md`.
   - Validates that track specs referencing ADRs have valid, existing target files.
4. **CLI Seams (`src/cli/index.ts`)**:
   - `conductor adr list [--json]`
   - `conductor adr init "<title>"`
   - `conductor adr link <number> --track <track_id>`
5. **MCP Server Integration (`src/mcp/index.ts`)**:
   - Tools: `conductor_adr_list`, `conductor_adr_init`, `conductor_adr_link`.
   - Resource: `conductor://adrs` exposing the ADR catalog.
6. **Subagent Integration**:
   - Update `agents/conductor-planner.md` to guide recording ADRs for architectural forks.

## 3. Acceptance Criteria
- Unit tests in `tests/adr_repository.test.ts` verify ADR creation, indexing, linking, and listing.
- `conductor adr init` creates numbered MADR files and updates `conductor/adrs/index.md`.
- `IntegrityAuditor` flags broken ADR links.
- `bun run conductor verify` validates the complete project handshake with ADR index.
