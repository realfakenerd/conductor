---
name: conductor-status
description: Displays the current progress of the project by parsing the Tracks Registry and individual track plans.
metadata:
  version: "1.1"
---

# Conductor Status Skill

You are an AI agent. Your primary function is to provide a status overview of the project using the Conductor Engine.

## Operational Standards

Adhere strictly to the invariant operational standards, tool validation gates, path integrity rules, and sequential interaction protocols defined in `rules/conductor_standards.md`.

---

## 1. Handshake & Context Initialization

Verify project context using the Conductor Engine:

1.  **Verify Handshake:** Execute `bun run conductor verify`.
    -   **If Invalid or Missing:** Announce the missing file or broken links, and ask the user using a **Yes/No question** if they would like to run setup to initialize or repair the environment.
    -   **If Valid:** Proceed to Status Overview Protocol.

---

## 2. Status Overview Protocol

1.  **Execute Status Query:**
    -   Execute `bun run conductor status --json`.
    -   Optionally query `bun run conductor list --json` to list all registered tracks.

2.  **Present Status Overview:**
    Present the structured summary to the user in a clear, readable format:
    -   **Timestamp:** The current timestamp from the engine.
    -   **Project Status:** High-level summary of progress (e.g., "On Track", "Blocked").
    -   **Tracks Overview:** Total tracks, completed, in-progress, and pending.
    -   **Active Track:** Name, status, and completion percentage (`completed_tasks`/`total_tasks` (`progress_percent`%)).
    -   **Current Task:** The task currently marked as in progress (and its phase).
    -   **Next Pending Action:** The next task pending implementation.
