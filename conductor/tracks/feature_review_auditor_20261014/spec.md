# Specification: Deterministic Review Auditor Seam (conductor review verify)

## 1. Overview
Introduce a deterministic verification subsystem and engine seam (`ReviewAuditor`) to Conductor. Instead of relying purely on subjective, prompt-level LLM inspection of code diffs and plan checkboxes, the Review Auditor programmatically validates track plan compliance, commit SHA existence, verification Git Notes attachments, test suite passing status, and diff boundary constraints.

## 2. Architecture & Seams
1. **Engine Core (`src/core/review_auditor.ts`)**:
   - `ReviewAuditor` class accepting `rootDir` and target `trackId`.
   - Inspects `plan.md` tasks and verifies:
     - All completed tasks (`[x]`) have associated commit SHAs.
     - Commits exist in git history.
     - Verification Git Notes are attached to each commit (or checkpoint).
     - Runs configured test runner (e.g. `bun test`) and captures stdout/stderr and exit code.
     - Validates diff scope (excluding `conductor/` context artifacts from polluting source diff).
   - Returns structured `ReviewAuditResult`:
     ```ts
     interface ReviewAuditResult {
       valid: boolean;
       track_id: string;
       plan_compliance: {
         total_tasks: number;
         completed_tasks: number;
         pending_tasks: number;
         missing_shas: string[];
         missing_notes: string[];
       };
       test_suite: {
         passed: boolean;
         command: string;
         output: string;
       };
       diff_summary: {
         files_changed: string[];
         insertions: number;
         deletions: number;
       };
     }
     ```
2. **CLI Seam (`src/cli/index.ts`)**:
   - `conductor review [check|verify] [--track <track_id>] [--json]`
   - Exits 0 on clean pass; exits 1 on audit failure.
3. **MCP Server Seam (`src/mcp/index.ts`)**:
   - Tool `conductor_review_verify`: `{ trackId?: string }` returning typed JSON result.
4. **Skill & Subagent Integration**:
   - Update `skills/conductor-review/SKILL.md` to run `conductor review verify` as step 2.1 before LLM code analysis.
   - Equip `agents/conductor-reviewer.md` with `conductor_review_verify` tool.

## 3. Acceptance Criteria
- Unit tests in `tests/review_auditor.test.ts` verify complete, partial, and failing review scenarios.
- `conductor review verify --json` returns typed JSON schema and exits 0 on valid tracks.
- `src/mcp/index.ts` exposes `conductor_review_verify`.
- Handshake verification (`bun run conductor verify`) remains 100% valid.
