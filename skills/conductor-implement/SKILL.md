---
name: conductor-implement
description: Executes the tasks defined in the specified track's plan. Use this to start or continue working on a feature, bug fix, or chore.
metadata:
  version: "1.0"
---

# Conductor Implement Skill

You are the **Conductor Implementer**. Your goal is to execute the tasks defined in the specified track's plan following the Spec-Driven Development (SDD) framework. This document is your operational protocol: adhere to it precisely and sequentially.

## Operational Standards

Adhere strictly to the invariant operational standards, tool validation gates, path integrity rules, and sequential interaction protocols defined in `rules/conductor_standards.md`.

## 1. Handshake & Context Initialization

Verify project context using the Conductor Engine:

1.  **Verify Handshake:** Execute `python3 scripts/conductor_engine.py verify`.
    -   **If Invalid or Missing:** Announce the missing file or broken links, and ask the user using a **Yes/No question** if they would like to run setup to initialize or repair the environment.
    -   **If Valid:** Proceed directly to Track Selection.

---

## 2. Track Selection

Adhere to this sequence to identify and select the track to be implemented.

1.  **Check for User Input:** First, check if the user provided a track name in their request.

2.  **Locate and Parse Tracks Registry:**
    -   Locate the **Tracks Registry** (Default: `conductor/tracks.md`).
    -   Read and parse the registry to identify all tracks, their status (`[ ]`, `[~]`, `[x]`), and their folder links.
    -   **CRITICAL:** If the registry is empty or missing, announce that no tracks are available to implement and HALT.

3.  **Select Track:**
    -   **If a track name was provided:**
        -   Search for a match in the parsed registry.
        -   **If a unique match is found:** Ask the user for confirmation using a **Yes/No question** to proceed with implementation of that specific track.
        -   **If no match or ambiguous:** Ask the user to clarify by asking an **open question** for them to provide the exact name, or presenting a **multiple-choice** list of available incomplete tracks to select from.
    -   **If no track name was provided:**
        -   **Identify Next Track:** Find the first incomplete track in the registry.
        -   **If found:** Propose this track to the user and ask for confirmation using a **Yes/No question** to proceed.
        -   **If not found:** Announce that all tracks are complete and HALT.

---

## 3. Track Implementation

Adhere to this sequence to execute the selected track.

1.  **Announce Action:** Announce which track you are beginning to implement.

2.  **Update Status to 'In Progress':**
    -   Before beginning any work, update the status of the selected track to `[~]` in the **Tracks Registry** file.
    -   Stage the file and commit: `chore(conductor): Mark track '<track_description>' as in progress`.

3.  **Load Track Context:**
    -   Identify the track folder from the tracks file to get the `<track_id>`.
    -   Resolve and read the **Specification** and **Implementation Plan** for the selected track (Check the track's `index.md` for links, or use default paths).
    -   Resolve and read the **Workflow** document (Check `conductor/index.md` for the link, or use default path).
    -   If you fail to read any of these files, halt and inform the user.
    -   Check for installed skills in `.agents/skills/` and `~/.agents/extensions/conductor/skills/`.
    -   If relevant skills are found, activate them and prioritize their guidelines.

4.  **Execute Tasks and Update Track Plan:**
    -   Loop through each task in the track's **Implementation Plan** one by one.
    -   **Start Task:** Execute the engine to advance the task to in-progress:
        ```bash
        python3 scripts/conductor_engine.py track advance <track_id> --task "<task_name>" --status in_progress
        ```
        Stage `plan.md` and commit: `conductor(plan): Mark task '<task_name>' as in progress`.
    -   **Implement & Test:** Follow the **Workflow** file (Red-Green-Refactor TDD).
    -   **Commit Code:** Commit implementation changes and obtain the `<commit_sha>`.
    -   **Attach Git Note:** Execute the engine to attach the verification note:
        ```bash
        python3 scripts/conductor_engine.py note <commit_sha> --task "<task_name>" --summary "<summary>" --files "<files>"
        ```
    -   **Complete Task in Plan:** Execute the engine to record the SHA and mark complete:
        ```bash
        python3 scripts/conductor_engine.py track advance <track_id> --task "<task_name>" --status done --sha <commit_sha>
        ```
        Stage `plan.md` and commit: `conductor(plan): Mark task '<task_name>' as complete`.

5.  **Finalize Track:**
    -   After all tasks are completed, execute the engine to mark the track complete:
        ```bash
        python3 scripts/conductor_engine.py track complete <track_id>
        ```
    -   Stage registry and metadata: `git add conductor/tracks.md conductor/tracks/<track_id>/metadata.json`
    -   Commit: `chore(conductor): Mark track '<track_description>' as complete`.
    -   Announce that the track is fully complete.

---

## 4. Synchronize Project Documentation

Adhere to this sequence to update project-level documentation based on the completed track.

1.  **Execution Trigger:** This protocol MUST only be executed when a track has reached a completed status (`[x]`) in the tracks file.

2.  **Announce Synchronization:** Announce that you are now synchronizing the project-level documentation with the completed track's specifications.

3.  **Load Track Specification:** Read the track's **Specification**.

4.  **Load Project Documents:**
    -   Locate and read:
        -   **Product Definition**
        -   **Tech Stack**
        -   **Product Guidelines**

5.  **Analyze and Update:**
    a. **Analyze Specification:** Carefully analyze the **Specification** to identify any new features, changes in functionality, or updates to the technology stack.
    b. **Update Product Definition:**
        i. **Condition for Update:** Determine if the completed feature or bug fix significantly impacts the description of the product itself.
        ii. **Propose and Confirm Changes:** If an update is needed: Present the proposed updates (ideally in a diff format) to the user and ask for approval using a **Yes/No question**.
        iii. **Action:** Only after receiving explicit user confirmation, perform the file edits to update the **Product Definition** file.
    c. **Update Tech Stack:**
        i. **Condition for Update:** Determine if significant changes in the technology stack are detected as a result of the completed track.
        ii. **Propose and Confirm Changes:** If an update is needed: Present the proposed updates (ideally in a diff format) to the user and ask for approval using a **Yes/No question**.
        iii. **Action:** Only after receiving explicit user confirmation, perform the file edits to update the **Tech Stack** file.
    d. **Update Product Guidelines (Strictly Controlled):**
        i. **CRITICAL WARNING:** This file defines the core identity and communication style of the product. It should be modified with extreme caution and ONLY in cases of significant strategic shifts, such as a product rebrand or a fundamental change in user engagement philosophy.
        ii. **Condition for Update:** You may ONLY propose an update to this file if the track's **Specification** explicitly describes a change that directly impacts branding, voice, tone, or other core product guidelines.
        iii. **Propose and Confirm Changes:** If the conditions are met: Present the proposed changes (ideally in a diff format) to the user and ask for approval using a **Yes/No question**, including a clear warning about the sensitivity of the file.
        iv. **Action:** Only after receiving explicit user confirmation, perform the file edits.

6.  **Final Report:** Announce the completion of the synchronization process and provide a summary of the actions taken.
    -   If any files were changed (**Product Definition**, **Tech Stack**, or **Product Guidelines**), stage them and commit them with a message like: `docs(conductor): Synchronize docs for track '<track_description>'`.

---

## 5. Completion and Handoff

Once the track is marked as complete and project documentation is synchronized, announce the final state.

1.  **Summary:** Present a summary of the implementation (e.g., tasks completed, documentation updated).
2.  **Proactive Suggestion:** Ask the user if they would like to perform a formal code review of the completed track right now using a **Yes/No question**.
3.  **Internal Handoff:**
    -   If the user agrees, you MUST use the `conductor-review` skill to begin the review process for the recently completed track.
    -   If the user declines, inform them they can run a review later by using the `conductor-review` skill directly.
