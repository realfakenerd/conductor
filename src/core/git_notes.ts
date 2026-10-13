import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

export function attachGitNote(
  commitSha: string,
  taskName: string,
  summary: string,
  files?: string | null,
  rootDir: string = "."
): boolean {
  let noteContent = `Task: ${taskName}\nSummary: ${summary}`;
  if (files) {
    noteContent += `\nFiles: ${files}`;
  }

  const res = spawnSync("git", ["notes", "add", "-f", "-m", noteContent, commitSha], {
    cwd: rootDir,
    encoding: "utf-8",
  });
  return res.status === 0;
}

export function attachPhaseCheckpointNote(
  commitSha: string,
  phaseName: string,
  reportFile?: string | null,
  summary?: string | null,
  rootDir: string = "."
): boolean {
  let noteBody = `Phase Checkpoint: ${phaseName}`;
  if (reportFile && existsSync(reportFile)) {
    noteBody += `\n\n${readFileSync(reportFile, "utf-8")}`;
  } else if (summary) {
    noteBody += `\n\nVerification Summary:\n${summary}`;
  }

  const res = spawnSync("git", ["notes", "add", "-f", "-m", noteBody, commitSha], {
    cwd: rootDir,
    encoding: "utf-8",
  });
  return res.status === 0;
}
