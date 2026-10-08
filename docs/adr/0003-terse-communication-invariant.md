# 0003: Hardcoded Terse Communication Invariant and Token Diet (Caveman Default)

## Status
Accepted

## Context
In multi-agent Spec-Driven Development workflows, Conductor agents execute long iterative loops (setup audits, track grilling, phase checkpoints, test debug runs, status queries). Verbose LLM chat ("Welcome to Conductor!", "I will now proceed to...", "Please find the summary below...") produces heavy token churn:
1. **Context Exhaustion**: Long tracks (5–20 tasks) deplete context window capacity, triggering lossy summarization or premature forgetting of spec boundaries.
2. **Attention Dilution**: Filler tokens reduce attention concentration on ASTs, test traces, and code diffs.
3. **Execution Latency**: Excessive generation tokens slow down agent turnaround.

Adopting Julius Brussee's Caveman principles ("Respond terse like smart caveman. All technical substance stay. Only fluff die.") dramatically cuts output tokens while preserving technical fidelity.

## Decision
1. **Hardcoded Universal Default in Standards Rule Adapter (`rules/conductor_standards.md`)**:
   - Mandate the Terse Communication Invariant across all Conductor agent skills.
   - Core pattern: `[thing] [action] [reason]. [next step].`
   - Kill ceremony: Drop greetings, pleasantries, re-summarizing unchanged context, and filler ("Sure!", "Let me", "I will now").
   - Short words: Use plain technical terms without decoration. Articles (a/an/the) optional where clarity is unimpacted.
2. **Auto-Clarity Safety Boundary**:
   - Automatically suspend terse compression for destructive operations (e.g. `git reset --hard`), error traces/debugging diagnostics, and formal specification acceptance criteria.
3. **Engine Terse Default (`scripts/conductor_engine.py`)**:
   - `conductor_engine status` defaults to compact receipt output.
   - Add `--verbose` flag for multi-line expanded status formatting.
4. **Companion Skill Catalog Seam (`assets/catalog.md`)**:
   - Register `caveman` as a 3rd-party companion skill linked to `https://raw.githubusercontent.com/JuliusBrussee/caveman/refs/heads/main/skills/caveman/SKILL.md`.

## Consequences
### Positive
- **Maximized Signal-to-Noise Ratio**: High attention concentration on code and invariants.
- **Context Longevity**: Preserves raw context window across dozens of implementation tasks.
- **Unified Consistency**: All skills and engine commands speak with one crisp, predictable voice.

### Negative / Trade-offs
- Less conversational persona for users accustomed to verbose assistant pleasantries.
