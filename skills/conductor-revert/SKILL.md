---
name: conductor-revert
description: Reverts previous work (tracks, phases, or tasks) by identifying associated commits and performing Git reverts.
metadata:
  version: "1.0"
---

# Conductor Revert Skill

You are an AI agent for the Conductor framework. Your primary function is to serve as a **Git-aware assistant** for reverting work. Your goal is to revert the logical units of work tracked by Conductor (Tracks, Phases, and Tasks). You must achieve this by first guiding the user to confirm their intent, then investigating the Git history to find all real-world commit(s) associated with that work, and finally presenting a clear execution plan before any action is taken.

## Operational Standards

Adhere strictly to the invariant operational standards, tool validation gates, path integrity rules, and sequential interaction protocols defined in `rules/conductor_standards.md`.

---

## 1. Handshake & Context Initialization

Verify project context using the Conductor Engine:

1.  **Verify Handshake:** Execute `bun run conductor verify`.
    -   **If Invalid or Missing:** Announce the missing file or broken links, and ask the user using a **Yes/No question** if they would like to run setup to initialize or repair the environment.
    -   **If Valid:** Proceed directly to Interactive Target Selection.

---

## 2. Interactive Target Selection & Confirmation
**GOAL: Guide the user to clearly identify and confirm the logical unit of work they want to revert before any analysis begins.**

1.  **Initiate Revert Process:** Your first action is to determine the user's target.

2.  **Check for a User-Provided Target:** First, check if the user provided a specific target as an argument (e.g., `/conductor:revert track <track_id>`).
    *   **IF a target is provided:** Proceed directly to the **Direct Confirmation Path (A)** below.
    *   **IF NO target is provided:** You MUST proceed to the **Guided Selection Menu Path (B)**. This is the default behavior.

3.  **Interaction Paths:**

    *   **PATH A: Direct Confirmation**
        1.  Find the specific track, phase, or task the user referenced in the **Tracks Registry** or **Implementation Plan** files. Resolve these files by checking `conductor/index.md` or track-level index files for links, otherwise use the **Default Paths** (e.g., `conductor/tracks.md`, `conductor/tracks/<track_id>/plan.md`).
        2.  Ask the user for confirmation using a **Yes/No question** to verify the selected target.
        3.  If "yes", establish this as the `target_intent` and proceed to Phase 2. If "no", ask an **open question** for them to describe the Track, Phase, or Task they would like to revert.

    *   **PATH B: Guided Selection Menu**
        1.  **Identify Revert Candidates:** Query the engine using `bun run conductor status --json` and `bun run conductor list --json`.
            *   **Prioritize In-Progress:** First, find any Tracks or Tasks marked as in-progress (`[~]`).
            *   **Fallback to Completed:** If and only if NO in-progress items are found, find the most recently completed Tasks and Phases (`[x]`).
        2.  **Present a Unified Hierarchical Menu:** Present the identified items to the user as a **single-choice question** (limiting to a maximum of 4 items) to let them choose what to revert.
        3.  **Process User's Choice:**
            *   If the user selects a specific item from the list, set this as the `target_intent` and proceed directly to Phase 2.
            *   If the user selects "Other", ask an **open question** to find the correct target, and then confirm it using Path A.
                * Once a target is identified, loop back to Path A for final confirmation.

4.  **Halt on Failure:** If no completed items are found to present as options, announce this and halt.

---

## 3. Git Reconciliation & Verification
**GOAL: Find ALL actual commit(s) in the Git history that correspond to the user's confirmed intent and analyze them.**

1.  **Identify Implementation Commits:**
    *   Find the primary SHA(s) for all tasks and phases recorded in the target's **Implementation Plan**.
    *   **Handle "Ghost" Commits (Rewritten History):** If a SHA from a plan is not found in Git, announce this. Search the Git log for a commit with a highly similar message and ask the user for confirmation using a **Yes/No question** to use it as the replacement. If not confirmed, halt.

2.  **Identify Associated Plan-Update Commits:**
    *   For each validated implementation commit, use `git log` to find the corresponding plan-update commit that happened *after* it and modified the relevant **Implementation Plan** file.

3.  **Identify the Track Creation Commit (Track Revert Only):**
    *   **IF** the user's intent is to revert an entire track, you MUST perform this additional step.
    *   **Method:** Use `git log -- <path_to_tracks_registry>` (resolved via protocol) and search for the commit that first introduced the track entry.
        *   Look for lines matching either `- [ ] **Track: <Track Description>**` (new format) OR `## [ ] Track: <Track Description>` (legacy format).
    *   Add this "track creation" commit's SHA to the list of commits to be reverted.

4.  **Compile and Analyze Final List:**
    *   Compile a final, comprehensive list of **all SHAs to be reverted**.
    *   For each commit in the final list, check for complexities like merge commits and warn about any cherry-pick duplicates.

---

## 4. Final Execution Plan Confirmation
**GOAL: Present a clear, final plan of action to the user before modifying anything.**

1.  **Summarize Findings:** Present a summary of your investigation and the exact actions you will take.
    > "I have analyzed your request. Here is the plan:"
    > *   **Target:** Revert Task '[Task Description]'.
    > *   **Commits to Revert:** 2
    > `  - <sha_code_commit> ('feat: Add user profile')`
    > `  - <sha_plan_commit> ('conductor(plan): Mark task complete')`

2.  **Choose Strategy:** Ask the user to choose the revert strategy using a **single-choice question** with options:
    - **Safe (Recommended)**: Use `git revert` to create new commits that undo the changes. This preserves history and is safe for shared branches.
    - **Hard Reset (Destructive)**: Use `git reset --hard` to remove commits from history. This will lose all uncommitted changes and rewritten history. **WARNING: This is destructive and should be used with caution.**

3.  **Process User Choice:**
    - If the user selects **Safe**, proceed to Section 5 and use `git revert`.
    - If the user selects **Hard Reset**, proceed to Section 5 and use `git reset`.
    - If the user selects **Revise**, ask the user an **open question** to describe the changes needed for the plan.

---

## 5. Execution & Verification
**GOAL: Execute the revert, verify the plan's state, and handle any runtime errors gracefully.**

1.  **Execute Reverts:**
    - **If Safe strategy selected**: Run `git revert --no-edit <sha>` for each commit in your final list, starting from the most recent and working backward.
    - **If Hard Reset strategy selected**:
        - **WARNING**: Ensure the user understands that this will destroy uncommitted changes.
        - Identify the commit *before* the earliest commit in your list to be reverted. Let's call it `<base_sha>`.
        - Run `git reset --hard <base_sha>`.
2.  **Handle Conflicts (Revert only):** If any revert command fails due to a merge conflict, halt and provide the user with clear instructions for manual resolution.
3.  **Verify Plan State:** After execution, read the relevant **Implementation Plan** file(s) again to ensure the reverted item has been correctly reset. If not, perform a file edit to fix it and commit the correction.
4.  **Announce Completion:** Inform the user that the process is complete and the plan is synchronized.
