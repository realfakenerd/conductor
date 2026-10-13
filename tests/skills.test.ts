import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Skills and Manifests Integrity", () => {
  const root = process.cwd();
  const skillsDir = join(root, "skills");

  it("should have valid SKILL.md frontmatter for all conductor skills", () => {
    const skills = readdirSync(skillsDir);
    expect(skills.length).toBeGreaterThan(0);

    for (const skill of skills) {
      const skillPath = join(skillsDir, skill, "SKILL.md");
      expect(existsSync(skillPath)).toBe(true);

      const content = readFileSync(skillPath, "utf-8");
      expect(content.startsWith("---")).toBe(true);
      expect(content).toContain(`name: ${skill}`);
      expect(content).toContain("description:");
    }
  });

  it("should have valid plugin.json with MCP server declaration", () => {
    const pluginPath = join(root, "plugin.json");
    expect(existsSync(pluginPath)).toBe(true);

    const plugin = JSON.parse(readFileSync(pluginPath, "utf-8"));
    expect(plugin.name).toBe("conductor");
    expect(plugin.mcpServers).toBeDefined();
    expect(plugin.mcpServers.conductor).toBeDefined();
    expect(plugin.mcpServers.conductor.command).toBe("bun");
  });

  it("should enforce zero python files across repository", () => {
    function findPyFiles(dir: string): string[] {
      const results: string[] = [];
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".venv") {
          continue;
        }
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...findPyFiles(fullPath));
        } else if (entry.name.endsWith(".py")) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const pyFiles = findPyFiles(root);
    expect(pyFiles).toEqual([]);
  });
});
