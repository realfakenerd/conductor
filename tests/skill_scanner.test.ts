import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SkillScanner } from "../src/core/skill_scanner";

describe("SkillScanner (Discovery & Detection)", () => {
  it("should inspect project manifests and detect ecosystems and dependencies", () => {
    const root = mkdtempSync(join(tmpdir(), "cond-scan-test-"));

    // 1. Setup npm package.json
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({
        name: "test-app",
        dependencies: {
          svelte: "^5.0.0",
          firebase: "^10.0.0",
        },
        devDependencies: {
          typescript: "^5.0.0",
        },
      })
    );

    // 2. Setup Cargo.toml
    writeFileSync(
      join(root, "Cargo.toml"),
      `[package]\nname = "my-crate"\nversion = "0.1.0"\n\n[dependencies]\nesp-hal = "0.22"\n`
    );

    const scanner = new SkillScanner();
    const profile = scanner.inspectProject(root);

    expect(profile.ecosystems).toContain("npm");
    expect(profile.ecosystems).toContain("cargo");
    expect(profile.dependencies).toContain("svelte");
    expect(profile.dependencies).toContain("firebase");
    expect(profile.dependencies).toContain("typescript");
    expect(profile.dependencies).toContain("esp-hal");
  });

  it("should discover and rank candidate skills matching project signals", () => {
    const root = mkdtempSync(join(tmpdir(), "cond-scan-test-"));
    const skillsDir = mkdtempSync(join(tmpdir(), "cond-skills-test-"));

    // Create project files
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ dependencies: { svelte: "^5.0.0" } })
    );
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src", "App.svelte"), "<script></script><h1>Hello</h1>");

    // Create a local skill
    const svelteSkillDir = join(skillsDir, "svelte5-best-practices");
    mkdirSync(svelteSkillDir, { recursive: true });
    writeFileSync(
      join(svelteSkillDir, "SKILL.md"),
      `---
name: svelte5-best-practices
description: Best practices for Svelte 5 runes and components.
metadata:
  dependencies: ["svelte"]
  globs: ["**/*.svelte"]
  keywords: ["svelte", "runes"]
---
# Svelte 5 Best Practices
Guidance for modern Svelte.
`
    );

    // Create an unrelated local skill
    const pySkillDir = join(skillsDir, "python-django");
    mkdirSync(pySkillDir, { recursive: true });
    writeFileSync(
      join(pySkillDir, "SKILL.md"),
      `---
name: python-django
description: Django guidelines.
metadata:
  dependencies: ["django"]
  globs: ["**/*.py"]
---
# Django
`
    );

    const scanner = new SkillScanner();
    const candidates = scanner.scan(root, { localRoots: [skillsDir] });

    expect(candidates.length).toBeGreaterThan(0);
    const top = candidates[0];
    expect(top.name).toBe("svelte5-best-practices");
    expect(top.matchedSignals.length).toBeGreaterThan(0);
    expect(top.score).toBeGreaterThan(0);
    expect(candidates.some((c) => c.name === "python-django")).toBe(false);
  });
});
