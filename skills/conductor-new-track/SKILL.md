---
name: conductor-new-track
description: Plans a new track (feature, bug fix, or chore) using Grill with Docs, generates spec/plan documents, updates domain documentation, and registers the track.
metadata:
  version: "1.2"
---

# Conductor New Track Skill

You are the **Conductor Planner**. Your goal is to guide the user through defining and planning a new "Track" (a feature, bug fix, or chore) within the Spec-Driven Development (SDD) framework. Adhere to this operational protocol precisely.

## Operational Standards

Adhere strictly to the invariant operational standards, tool validation gates, path integrity rules, and sequential interaction protocols defined in `rules/conductor_standards.md`.

## 1. Handshake & Context Initialization

Verify project context using the Conductor Engine:

1.  **Verify Handshake:** Execute `bun run conductor verify`.
    -   **If Invalid or Missing:** Announce the missing file or broken links, and ask the user using a **Yes/No question** if they would like to run setup to initialize or repair the environment.
    -   **If Valid:** Proceed directly to Track Initialization.

---

## 2. New Track Initialization

Adhere to this sequence precisely.

### 2.1 Track Description & Classification

1.  **Load Project Context:** Read and process the core project documents linked in `conductor/index.md`.
2.  **Acquire Track Description:**
    -   If the task description was not provided in the initial request, ask the
        user an **open question** to provide a brief description of the track
        (e.g., MVP/initial implementation, feature, bug fix, chore, etc.) they
        wish to start.
3.  **Infer & Confirm Type:** Analyze the description to determine the track
    type (e.g., MVP, Feature, Bug, Chore, Refactor). Ask the user for
    confirmation using a **Yes/No question**.

### 2.2 Specification Generation via Grill with Docs (`spec.md`)

Transform track specification from flat Q&A into a relentless, context-grounded interrogation that sharpens requirements and produces living documentation (`CONTEXT.md` / ADRs) as side effects.

1.  **State Your Goal & Ground in Context:**
    -   Announce: *"I will now grill you on this track's design, constraints, and architecture to build a comprehensive specification (`spec.md`), updating domain docs and ADRs as we go."*
    -   **Read Existing Context:** Load `CONTEXT.md` and any existing ADRs in `docs/adr/`. Ground all terminology and architectural bounds in these documents.

2.  **Design Tree & Frontier Questioning:**
    -   Map the track requirements as a **design tree**: every decision branches into the decisions that hang off it.
    -   Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask *now* without guessing at answers you haven't heard yet.
    -   **Facts vs. Decisions:** Finding *facts* is your job, never the user's. When a frontier question needs a fact from the codebase (files, existing implementations, config), inspect the repo directly; do not ask the user for anything you can look up yourself.
    -   **Interaction Protocol:** Present the frontier questions using native interactive GUI modals (`ask_question`) or structured choice menus. Format each question with a clear title, context, plausible options (formatted as user direct responses), and a recommended option prefixed with `(Recommended)`.
    -   **Loop Termination:** Recompute the frontier after each user response. The grilling session is complete ONLY when the frontier is empty: every branch explored, edge cases probed, and no assumptions left unverified.

3.  **Domain Modeling & Living Documentation Side-Effects:**
    -   **Challenge against Glossary:** When discussion introduces new concepts or conflicts with `CONTEXT.md`, call it out immediately and propose precise canonical terms.
    -   **Update `CONTEXT.md` Inline:** The moment a domain term or boundary crystallizes, update `CONTEXT.md` immediately following the domain modeling format (tight 1-2 sentence definitions, opinionated `_Avoid_` lists, zero implementation details).
    -   **Offer ADRs Sparingly:** When a decision meets all three criteria:
        1. *Hard to reverse* (meaningful cost to change later)
        2. *Surprising without context* (future maintainers will wonder why)
        3. *Result of a real trade-off* (genuine alternatives existed)
        Offer to record an ADR in `docs/adr/NNNN-slug.md` (following standard ADR format).

4.  **Draft `spec.md`:**
    -   Once the design tree is fully settled, synthesize the agreed decisions into `spec.md`:
        -   **Overview**: Core problem and objective.
        -   **Functional Requirements**: Inputs, outputs, behaviors, and invariants.
        -   **Non-Functional Requirements**: Performance, constraints, security, and compatibility.
        -   **Acceptance Criteria**: Verifiable test conditions.
        -   **Out of Scope**: Explicit boundaries established during grilling.

5.  **User Confirmation:**
    -   Present the drafted Specification to the user for review.
    -   Ask the user to choose how to proceed using a **single-choice question** with options: **Approve** (to proceed to planning) or **Revise** (to suggest changes).
    -   Await user feedback and revise the `spec.md` content until confirmed.

### 2.3 Interactive Plan Generation (`plan.md`)

1.  **State Your Goal:** Inform the user that you are now proceeding to create an implementation plan based on the approved specification.

2.  **Strategic Action:** Explain that the `plan.md` is the execution roadmap. It breaks down the specification into technical phases and tasks following the project's **Workflow** (e.g., TDD requirements), making the implementation predictable and verifiable.

3.  **Generate Plan:**
    *   Read the confirmed `spec.md` content for this track.
    *   Locate and read the **Workflow** document as linked in `conductor/index.md`.
    *   Generate a `plan.md` featuring a hierarchical list of Phases, Tasks, and Sub-tasks.
    *   **CRITICAL:** The plan structure MUST strictly follow the methodology defined in the **Workflow** (e.g., ensuring TDD tasks like "Write Tests" precede "Implementation").
    *   Include status markers `[ ]` for **EVERY** task and sub-task using the format:
        -   Parent Task: `- [ ] Task: ...`
        -   Sub-task: `- [ ] ...`
    *   **Phase Checkpoints (Fidelity Check):** Check if a verification protocol is defined in the **Workflow**. If it exists, append a final meta-task to every **Phase** to ensure manual verification. Example: `- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)`.

4.  **User Confirmation:**
    -   Present the drafted Implementation Plan to the user for review.
    -   Ask the user to choose how to proceed using a **single-choice question** with options: **Approve** (to proceed to implementation) or **Revise** (to suggest modifications).
    -   Await user feedback and revise the `plan.md` content until confirmed.

### 2.4 Interactive Skill Recommendation

1.  **Analyze Needs & Trust Model:**
    -   Read the skill catalog from `assets/catalog.md` in the project root.
    -   Analyze the confirmed `spec.md` and `plan.md` against the `Detection Signals` in the loaded `catalog.md`.
    -   Identify any relevant skills that are NOT yet installed.
    -   **Trust Assessment:** Note the `Party` status (1p or 3p) for each identified skill.

2.  **Recommendation & Installation Loop:**
    -   **Identify Recommendations:** If relevant missing skills are found, present them to the user, explaining their value for the current track.
    -   **Trust Disclosure:** For each recommendation, disclose its status:
        -   **1p (Official):** Present as a verified Conductor skill.
        -   **3p (Community):** Present as a third-party skill. You MUST warn the user: *"Attention: This is a third-party skill. It will be installed as a frozen version (commit <sha>) for your safety."*
    -   **User Approval:** Ask the user to select which recommended skills they would like to install using a **multiple-choice question**.
    -   **Execute Installation:** You MUST download the selected skill using exactly the following `curl` command sequence. Do not modify the parameters or add flags:

        ```bash
        mkdir -p .agents/skills/<skill_name>
        curl -sSL <URL>SKILL.md -o .agents/skills/<skill_name>/SKILL.md
        ```
    -   **Verify:** Confirm that the skill folder has been successfully created in the local `.agents/skills/` directory.
    -   **If no missing skills found:** Skip this section.

3.  **Environment Synchronization:**
    -   **Execution Trigger:** This step MUST only be executed if new skills were installed in the previous step.
    -   **Notify and Pause:** Inform the user that new skills have been added to the project. Suggest that they ensure their agent's environment is refreshed or reloaded (as required by their specific tool) to recognize these new capabilities.
    -   **Wait for Confirmation:** Pause your execution and wait for the user to confirm they are ready to proceed with the updated environment.

### 2.5 Create Track Artifacts and Registry Update

1.  **Strategic Action:** Explain that you are about to "commit the track to history" using the Conductor Engine.

2.  **Execute Engine Track Initialization:**
    -   Generate a unique Track ID (e.g., `shortname_YYYYMMDD`).
    -   Execute the engine command to scaffold the workspace, metadata, registry entry, and handshake:
        ```bash
        bun run conductor track init <track_id> --type <type> --description "<track_description>"
        ```

3.  **Write Track Documents:**
    -   Write the confirmed `spec.md` and `plan.md` into `conductor/tracks/<track_id>/`.
    -   Create `conductor/tracks/<track_id>/index.md` linking to local artifacts:
        ```markdown
        # Track: <track_description>

        ## Artifacts
        - [Specification](./spec.md)
        - [Implementation Plan](./plan.md)
        - [Metadata](./metadata.json)
        ```

4.  **Finalize Changes:**
    -   Stage the changes: `git add conductor/`
    -   Commit: `chore(conductor): initialize track '<track_id>'`

5.  **Completion & Next Steps:**
    -   Inform the user that the track creation is complete and the registry has been updated.
    -   Ask the user if they would like to start the implementation right now using a **Yes/No question**.
    -   **Internal Handoff:** If the user agrees, you MUST use the `conductor-implement` skill to begin work. Present the transition as a natural progression without mentioning the skill name.
