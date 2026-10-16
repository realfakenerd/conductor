import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AgentAdapter, type AgentDefinition } from "../src/core/agent_adapter.ts";

describe("AgentAdapter Core", () => {
  const testDir = join(process.cwd(), "tmp_test_agents_" + Date.now());

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, "agents"), { recursive: true });

    // Create sample agent markdown
    const workerMd = `---
name: sample-worker
description: Sample TDD worker agent
capabilities:
  - read
  - write
  - shell
  - mcp
---

# Sample Worker Prompt
You are a worker.
`;
    writeFileSync(join(testDir, "agents", "sample-worker.md"), workerMd);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("parses agent definitions from agents directory", () => {
    const adapter = new AgentAdapter(testDir);
    const agents = adapter.listAgents();

    expect(agents.length).toBe(1);
    expect(agents[0].name).toBe("sample-worker");
    expect(agents[0].description).toBe("Sample TDD worker agent");
    expect(agents[0].capabilities).toEqual(["read", "write", "shell", "mcp"]);
    expect(agents[0].systemPrompt.trim()).toBe("# Sample Worker Prompt\nYou are a worker.");
  });

  it("compiles agent manifest for Antigravity host with native tools", () => {
    const adapter = new AgentAdapter(testDir);
    const agents = adapter.listAgents();
    const compiled = adapter.compileForHost(agents[0], "antigravity");

    expect(compiled.host).toBe("antigravity");
    expect(compiled.name).toBe("sample-worker");
    expect(compiled.tools).toContain("view_file");
    expect(compiled.tools).toContain("write_to_file");
    expect(compiled.tools).toContain("replace_file_content");
    expect(compiled.tools).toContain("run_command");
    expect(compiled.tools).toContain("call_mcp_tool");
    expect(compiled.tools).not.toContain("read");
    expect(compiled.tools).not.toContain("shell");
  });

  it("compiles agent manifest for Claude Code host with native tools", () => {
    const adapter = new AgentAdapter(testDir);
    const agents = adapter.listAgents();
    const compiled = adapter.compileForHost(agents[0], "claude");

    expect(compiled.host).toBe("claude");
    expect(compiled.name).toBe("sample-worker");
    expect(compiled.tools).toContain("Bash");
    expect(compiled.tools).toContain("View");
    expect(compiled.tools).toContain("Edit");
  });

  it("syncs compiled agents to target directory", () => {
    const adapter = new AgentAdapter(testDir);
    const syncDir = join(testDir, "compiled_agents");
    const result = adapter.syncAgents({ host: "antigravity", targetDir: syncDir });

    expect(result.synced.length).toBe(1);
    expect(result.synced[0].name).toBe("sample-worker");
    expect(result.targetDir).toBe(syncDir);

    // Verify written file
    const adapterRead = new AgentAdapter(testDir, syncDir);
    const syncedAgents = adapterRead.listAgents(syncDir);
    expect(syncedAgents.length).toBe(1);
    expect(syncedAgents[0].tools).toContain("view_file");
  });

  it("validates agent definitions and reports unknown capabilities", () => {
    const invalidMd = `---
name: invalid-agent
description: Has unknown capability
capabilities:
  - teleportation
---

Prompt
`;
    writeFileSync(join(testDir, "agents", "invalid-agent.md"), invalidMd);

    const adapter = new AgentAdapter(testDir);
    const validation = adapter.validateAgents();

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors[0]).toContain("teleportation");
  });

  it("filters out unsupported tools when availableTools filter is specified", () => {
    const adapter = new AgentAdapter(testDir);
    const agents = adapter.listAgents();
    const compiled = adapter.compileForHost(agents[0], "antigravity", {
      availableTools: ["view_file", "run_command"],
    });

    expect(compiled.tools).toEqual(["view_file", "run_command"]);
    expect(compiled.tools).not.toContain("call_mcp_tool");
    expect(compiled.tools).not.toContain("write_to_file");
  });

  it("filters out explicitly unsupported tools", () => {
    const adapter = new AgentAdapter(testDir);
    const agents = adapter.listAgents();
    const compiled = adapter.compileForHost(agents[0], "antigravity", {
      unsupportedTools: ["call_mcp_tool"],
    });

    expect(compiled.tools).not.toContain("call_mcp_tool");
    expect(compiled.tools).toContain("view_file");
    expect(compiled.tools).toContain("run_command");
  });

  it("allows omitting call_mcp_tool by default when excludeMcpTool is enabled", () => {
    const adapter = new AgentAdapter(testDir);
    const agents = adapter.listAgents();
    const compiled = adapter.compileForHost(agents[0], "antigravity", {
      excludeMcpTool: true,
    });

    expect(compiled.tools).not.toContain("call_mcp_tool");
  });

  it("compiles agent with JIT task-bound skill injection", () => {
    // Setup a skill in testDir
    const skillDir = join(testDir, ".agents", "skills", "test-tdd");
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "SKILL.md"), "# Test TDD Skill\nFollow strict Red-Green-Refactor.");

    const adapter = new AgentAdapter(testDir);
    const agents = adapter.listAgents();
    const compiled = adapter.compileWithSkills(agents[0], "antigravity", ["test-tdd"]);

    expect(compiled.systemPrompt).toContain("# Sample Worker Prompt");
    expect(compiled.systemPrompt).toContain("# Injected Task Skills");
    expect(compiled.systemPrompt).toContain("## Skill: test-tdd");
    expect(compiled.systemPrompt).toContain("Follow strict Red-Green-Refactor.");
  });
});


