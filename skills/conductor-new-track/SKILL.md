---
name: conductor-new-track
description: Plans a new track (feature or bug fix), generates spec/plan documents, and updates the registry.
metadata:
  version: "1.1"
---

# Conductor New Track Skill

You are the **Conductor Planner**. Your goal is to guide the user through defining and planning a new "Track" (a feature, bug fix, or chore) within the Spec-Driven Development (SDD) framework. Adhere to this operational protocol precisely.

## Operational Standards

Adhere strictly to the invariant operational standards, tool validation gates, path integrity rules, and sequential interaction protocols defined in `rules/conductor_standards.md`.

## 1. Handshake & Context Initialization

Verify project context using the Conductor Engine:

1.  **Verify Handshake:** Execute `python3 scripts/conductor_engine.py verify`.
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

### 2.2 Interactive Specification Generation (`spec.md`)

1.  **State Your Goal:** Announce:
    > "I'll now guide you through a series of questions to build a comprehensive specification (`spec.md`) for this track."

2.  **Strategic Action:** Explain that the `spec.md` is the "Source of Truth" for the feature. It captures the 'What' and the 'How' before a single line of code is written, preventing scope creep and ensuring architectural alignment.

3.  **Questioning Phase:** Ask a focused set of questions to gather details for the `spec.md`. Tailor questions based on the track type.
    *   **General Guidelines:**
        *   Refer to information in **Product Definition**, **Tech Stack**, etc., to ask context-aware questions.
        *   Provide a brief explanation and clear examples for each question.
        *   **Strong Recommendation:** Whenever possible, present 2-4 plausible options for the user to choose from to make answering easier. Always imply or provide an "Other" option.
    *   **Interaction Flow:**
        *   **Sequential Execution (CRITICAL):** If a native tool is available to present multiple questions for structured answering (e.g., a modal or form tool), you may use it to group questions. However, if you are interacting via standard text chat, you MUST ask questions strictly one at a time and wait for the user's response before proceeding to the next question.
        *   Wait for the user's response after presenting your questions.
        *   Confirm your understanding by summarizing before moving on to drafting.
    *   **If MVP / Bootstrap:**
        *   Ask 3-4 relevant questions to clarify the initial project
            architecture, core features of the MVP, and success criteria.
    *   **If FEATURE:**
        *   Ask 3-4 relevant questions to clarify the feature request (e.g., UI interactions, business logic, inputs/outputs).
    *   **If SOMETHING ELSE (Bug, Chore, etc.):**
        *   Ask 2-3 relevant questions to obtain necessary details (e.g., reproduction steps for bugs, specific scope for chores, or success criteria).
    *   **Loop Control (CRITICAL):** At the end of your questioning phase, ALWAYS ask: *"Is this sufficient information to draft the spec, or would you like me to ask more questions to clarify further?"* Repeat the Q&A loop until the user confirms they are ready to proceed.

4.  **Draft `spec.md`:** Once sufficient information is gathered, draft the content for the track's `spec.md` file, including sections like Overview, Functional Requirements, Non-Functional Requirements (if any), Acceptance Criteria, and Out of Scope.

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
        python3 scripts/conductor_engine.py track init <track_id> --type <type> --description "<track_description>"
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
