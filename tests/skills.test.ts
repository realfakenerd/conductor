import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Skills and Manifests Integrity", () => {
  const root = process.cwd();
  const skillsDir = join(root, "skills");

  it("should have valid SKILL.md frontmatter for all conductor skills", () => {
    const skills = readdirSync(skillsDir).filter((name) => !name.endsWith("-workspace") && !name.startsWith("."));
    expect(skills.length).toBeGreaterThan(0);
    expect(skills).toContain("conductor-discover");

    for (const skill of skills) {
      const skillPath = join(skillsDir, skill, "SKILL.md");
      expect(existsSync(skillPath)).toBe(true);

      const content = readFileSync(skillPath, "utf-8");
      expect(content.startsWith("---")).toBe(true);
      expect(content).toContain(`name: ${skill}`);
      expect(content).toContain("description:");
    }
  }, 30000);

  it("should have valid agent markdown files in agents/", () => {
    const agentsDir = join(root, "agents");
    expect(existsSync(agentsDir)).toBe(true);

    const expectedAgents = [
      "conductor-planner.md",
      "conductor-worker.md",
      "conductor-reviewer.md",
      "conductor-explorer.md",
    ];

    const actualAgents = readdirSync(agentsDir);
    for (const agentFile of expectedAgents) {
      expect(actualAgents).toContain(agentFile);
      const content = readFileSync(join(agentsDir, agentFile), "utf-8");
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain("# ");
    }
  });

  it("should have valid plugin.json and mcp_config.json with MCP server declaration", () => {
    const pluginPath = join(root, "plugin.json");
    expect(existsSync(pluginPath)).toBe(true);

    const plugin = JSON.parse(readFileSync(pluginPath, "utf-8"));
    expect(plugin.name).toBe("conductor");

    const mcpConfigPath = join(root, "mcp_config.json");
    expect(existsSync(mcpConfigPath)).toBe(true);

    const mcpConfig = JSON.parse(readFileSync(mcpConfigPath, "utf-8"));
    expect(mcpConfig.mcpServers).toBeDefined();
    expect(mcpConfig.mcpServers.conductor).toBeDefined();
    expect(mcpConfig.mcpServers.conductor.args).toContain("${PLUGIN_ROOT}/src/mcp/index.ts");
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

  it("should enforce subagent delegation invariants in conductor_standards.md and skills", () => {
    const standardsPath = join(root, "rules", "conductor_standards.md");
    expect(existsSync(standardsPath)).toBe(true);
    const standards = readFileSync(standardsPath, "utf-8");
    expect(standards).toContain("Subagent Scope & Delegation Invariant");
    expect(standards).toContain("conductor-worker");
    expect(standards).toContain("conductor-reviewer");
    expect(standards).toContain("conductor-planner");
    expect(standards).toContain("conductor-explorer");

    // Check that skill files mandate subagent delegation
    const implementSkill = readFileSync(join(root, "skills", "conductor-implement", "SKILL.md"), "utf-8");
    expect(implementSkill).toContain("conductor-worker");

    const reviewSkill = readFileSync(join(root, "skills", "conductor-review", "SKILL.md"), "utf-8");
    expect(reviewSkill).toContain("conductor-reviewer");

    const newTrackSkill = readFileSync(join(root, "skills", "conductor-new-track", "SKILL.md"), "utf-8");
    expect(newTrackSkill).toContain("conductor-planner");

    const discoverSkill = readFileSync(join(root, "skills", "conductor-discover", "SKILL.md"), "utf-8");
    expect(discoverSkill).toContain("conductor-explorer");
  });
});
