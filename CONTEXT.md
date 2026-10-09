# Domain Context: Conductor

## Glossary

### Conductor Engine
The centralized execution module (`scripts/conductor_engine.py`) responsible for deterministic state operations: auditing setup resumption, scaffolding tracks, advancing task checkboxes (`[ ]` -> `[~]` -> `[x]`), attaching git notes, and validating handshake integrity.

### Track
A bounded, trackable unit of software work (feature, bug fix, chore, or MVP bootstrap) composed of a specification (`spec.md`), an actionable implementation plan (`plan.md`), metadata (`metadata.json`), and an index handshake (`index.md`).

### Handshake (Index)
The root context document (`conductor/index.md`) that serves as the single source of truth for the project. Maps product definition, guidelines, tech stack, workflow, style guides, and tracks registry.

### Standards Rule Adapter
A global plugin rule (`rules/conductor_standards.md`) establishing invariant operational constraints for AI agents: tool output validation, path integrity, non-interactive execution, and sequential dialog protocols.

### Skill Catalog
A canonical registry (`assets/catalog.md`) enumerating curated 1st-party and 3rd-party agent capabilities with detection signals, security trust disclosures, and frozen installation URLs.

### Phase & Task Lifecycle
A strict progression within a track's plan following Test-Driven Development (TDD): Red Phase (failing tests) -> Green Phase (passing implementation) -> Refactor -> Commit & Git Note -> Phase Verification Checkpoint.

### Architecture Discovery
A proactive diagnostic process (`conductor-improve`) that surveys commit hotspots and module boundaries to surface architectural friction, shallow abstractions, and leaky seams before code is written.
_Avoid_: "Code audit", "linter pass", "tech debt ticket".

### Deepening Opportunity
A structural refactoring candidate that consolidates scattered wrappers or shallow interfaces into a deep module with high testability, strong locality, and narrow interface surface area.
_Avoid_: "Clean code refactor", "file cleanup", "re-architecting".

### Query & Inspection Seam
A deterministic engine interface (`status`, `list`) exposing aggregate project progress, active track details, and task metrics, eliminating caller-side markdown parsing and regex heuristics.

### Track Lifecycle State Machine
The closed set of deterministic state transitions (`init` -> `start` -> `complete` -> `reset`) governing track progression across `tracks.md` and `metadata.json` without direct caller file mutation.

### Terse Communication Invariant
The operational invariant enforcing maximum signal-to-noise communication across all Conductor agent skills: answer first, eliminate pleasantries and boilerplate ceremony, compress progress reporting, while strictly preserving technical accuracy, code integrity, and destructive safety warnings.
_Avoid_: "Chatty persona", "pleasantries", "filler intros".

### Track Repository
The encapsulated data store within Conductor Engine responsible for atomic synchronization between human-readable markdown (`tracks.md`) and machine metadata (`metadata.json`).
_Avoid_: "Tracks helper", "registry writer".

### Plan Document Model
The deterministic document parser and mutator representing track implementation plans (`plan.md`) as an abstract syntax tree, preserving phase hierarchy, checkpoints, and task markers without lossy string splicing.
_Avoid_: "Regex task replacer", "plan script".

### Integrity Auditor
The verification subsystem that cross-validates workspace structure, handshake links, track metadata parity, and git commit SHA existence across recorded task plans.
_Avoid_: "Handshake checker", "link validator".

### Phase Checkpoint Seam
The deterministic engine operation (`track checkpoint`) that encapsulates phase verification report validation, git note creation, and abstract syntax tree mutation of `[checkpoint: <sha>]` headers in `plan.md`.
_Avoid_: "Heading splicer", "manual note adder".

### Task Finish Seam
The composite engine operation (`track finish`) that atomically attaches a verification git note to the commit and advances the task AST to `[x]` with commit SHA in `plan.md`.
_Avoid_: "Multi-step task completion", "manual note script".

### Conductor MCP Server
The high-performance Model Context Protocol JSON-RPC server powered by Bun and TypeScript implementing `@modelcontextprotocol/sdk` over stdio, providing typed native agent tools for all Conductor state operations.
_Avoid_: "Plugin API", "backend script", "web server".

### TypeScript Engine Core
The modular TypeScript engine (`src/core/`) providing deterministic AST mutation, git notes integration, workspace audit, and track repository lifecycle under Bun, completely replacing Python execution scripts.
_Avoid_: "Node backend", "Python engine", "CLI script".

