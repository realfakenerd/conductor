import { existsSync, readFileSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { IntegrityAuditor } from "./integrity_auditor.ts";

const HOOK_SIGNATURE = "# --- conductor guard ---";
const HOOK_SCRIPT = `
${HOOK_SIGNATURE}
bun run conductor guard check || exit 1
# --- end conductor guard ---
`;

export interface GuardInstallResult {
  installed: boolean;
  already_installed?: boolean;
  hook_path: string;
}

export interface GuardUninstallResult {
  uninstalled: boolean;
  hook_path: string;
}

export interface GuardCheckResult {
  valid: boolean;
  message: string;
  errors?: string[];
}

export function installPreCommitGuard(rootDir: string = "."): GuardInstallResult {
  const hooksDir = join(rootDir, ".git", "hooks");
  const hookPath = join(hooksDir, "pre-commit");

  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true });
  }

  let content = "";
  if (existsSync(hookPath)) {
    content = readFileSync(hookPath, "utf-8");
    if (content.includes(HOOK_SIGNATURE)) {
      return { installed: true, already_installed: true, hook_path: hookPath };
    }
  } else {
    content = "#!/bin/sh\n";
  }

  const updatedContent = content.trimEnd() + "\n" + HOOK_SCRIPT;
  writeFileSync(hookPath, updatedContent, { mode: 0o755 });
  try {
    chmodSync(hookPath, 0o755);
  } catch {
    // Ignore chmod errors on systems where unsupported
  }

  return { installed: true, hook_path: hookPath };
}

export function uninstallPreCommitGuard(rootDir: string = "."): GuardUninstallResult {
  const hookPath = join(rootDir, ".git", "hooks", "pre-commit");
  if (!existsSync(hookPath)) {
    return { uninstalled: true, hook_path: hookPath };
  }

  const content = readFileSync(hookPath, "utf-8");
  if (!content.includes(HOOK_SIGNATURE)) {
    return { uninstalled: true, hook_path: hookPath };
  }

  const regex = new RegExp(`\\n?${HOOK_SIGNATURE}[\\s\\S]*?# --- end conductor guard ---\\n?`, "g");
  const cleaned = content.replace(regex, "\n").trim();

  if (cleaned === "#!/bin/sh" || cleaned === "") {
    writeFileSync(hookPath, "");
  } else {
    writeFileSync(hookPath, cleaned + "\n", { mode: 0o755 });
  }

  return { uninstalled: true, hook_path: hookPath };
}

export function checkPreCommitGuard(rootDir: string = "."): GuardCheckResult {
  const auditor = new IntegrityAuditor(rootDir);
  const audit = auditor.audit();

  const errors: string[] = [];
  if (audit.missing_links.length > 0) {
    errors.push(`Missing handshake index links: ${audit.missing_links.join(", ")}`);
  }
  if (audit.broken_tracks.length > 0) {
    errors.push(`Broken tracks without workspaces: ${audit.broken_tracks.join(", ")}`);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message: "Pre-commit guard audit failed.",
      errors,
    };
  }

  return {
    valid: true,
    message: "Pre-commit guard audit passed. Integrity verified.",
  };
}
