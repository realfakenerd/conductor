import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SkillRepository } from "../src/core/skill_repository";

describe("SkillRepository (Dual-Layer Project Catalog)", () => {
  it("should initialize catalog files and register a skill atomically", () => {
    const root = mkdtempSync(join(tmpdir(), "cond-repo-test-"));
    const conductorDir = join(root, "conductor");
    mkdirSync(conductorDir, { recursive: true });
    writeFileSync(join(conductorDir, "index.md"), "# Index\n");

    const repo = new SkillRepository(root);
    expect(repo.list().length).toBe(0);

    // Register a 1p skill
    const skillPath = join(root, ".agents", "skills", "test-skill", "SKILL.md");
    mkdirSync(join(root, ".agents", "skills", "test-skill"), { recursive: true });
    writeFileSync(skillPath, "# Test Skill\nInstructions");

    const registered = repo.register({
      name: "test-skill",
      description: "Test skill description",
      source: "local",
      party: "1p",
      path: skillPath,
      triggers: ["*.ts"],
    });

    expect(registered.name).toBe("test-skill");
    expect(registered.dateAdded).toBeDefined();

    // Verify machine metadata
    const jsonPath = join(conductorDir, "skills.json");
    expect(existsSync(jsonPath)).toBe(true);
    const stored = JSON.parse(readFileSync(jsonPath, "utf-8"));
    expect(stored.skills.length).toBe(1);
    expect(stored.skills[0].name).toBe("test-skill");

    // Verify human markdown catalog
    const mdPath = join(conductorDir, "skills", "index.md");
    expect(existsSync(mdPath)).toBe(true);
    const mdContent = readFileSync(mdPath, "utf-8");
    expect(mdContent).toContain("test-skill");
    expect(mdContent).toContain("1p");

    // Verify handshake in index.md
    const indexContent = readFileSync(join(conductorDir, "index.md"), "utf-8");
    expect(indexContent).toContain("[Project Skills](./skills/index.md)");
  });

  it("should enforce SHA requirement for 3p skills", () => {
    const root = mkdtempSync(join(tmpdir(), "cond-repo-test-"));
    mkdirSync(join(root, "conductor"), { recursive: true });

    const repo = new SkillRepository(root);
    expect(() => {
      repo.register({
        name: "unverified-3p",
        description: "Bad 3p",
        source: "remote",
        party: "3p",
        path: "some/path",
      });
    }).toThrow(/commit SHA/i);
  });
});
