import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface AgentDefinition {
  name: string;
  description: string;
  capabilities: string[];
  tools?: string[];
  systemPrompt: string;
  filePath: string;
}

export interface CompiledAgentManifest {
  host: "antigravity" | "claude";
  name: string;
  description: string;
  tools: string[];
  systemPrompt: string;
}

export interface SyncResult {
  host: "antigravity" | "claude" | "all";
  targetDir: string;
  synced: CompiledAgentManifest[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const KNOWN_CAPABILITIES = new Set([
  "read",
  "write",
  "shell",
  "mcp",
  "ask",
  "subagents",
]);

const ANTIGRAVITY_TOOL_MAP: Record<string, string[]> = {
  read: ["view_file"],
  write: ["write_to_file", "replace_file_content"],
  shell: ["run_command"],
  mcp: ["call_mcp_tool"],
  ask: ["ask_question"],
  subagents: ["invoke_subagent", "define_subagent"],
};

const CLAUDE_TOOL_MAP: Record<string, string[]> = {
  read: ["View", "Glob", "Grep"],
  write: ["Edit"],
  shell: ["Bash"],
  mcp: ["mcp"],
  ask: ["ask"],
  subagents: ["subagent"],
};

export interface CompileOptions {
  availableTools?: string[];
  unsupportedTools?: string[];
  excludeMcpTool?: boolean;
}

export class AgentAdapter {
  private rootDir: string;
  private defaultAgentsDir: string;

  constructor(rootDir: string = ".", agentsDir?: string) {
    this.rootDir = rootDir;
    this.defaultAgentsDir = agentsDir || join(this.rootDir, "agents");
  }

  public listAgents(customDir?: string): AgentDefinition[] {
    const agentsDir = customDir || this.defaultAgentsDir;
    if (!existsSync(agentsDir)) {
      return [];
    }

    const files = readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
    const agents: AgentDefinition[] = [];

    for (const file of files) {
      const fullPath = join(agentsDir, file);
      const parsed = this.parseAgentFile(fullPath);
      if (parsed) {
        agents.push(parsed);
      }
    }

    return agents;
  }

  public parseAgentFile(filePath: string): AgentDefinition | null {
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, "utf-8");
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

    if (!frontmatterMatch) {
      return null;
    }

    const rawYaml = frontmatterMatch[1];
    const systemPrompt = frontmatterMatch[2];

    const nameMatch = rawYaml.match(/^name:\s*(.+)$/m);
    const descMatch = rawYaml.match(/^description:\s*(.+)$/m);

    const name = nameMatch ? nameMatch[1].trim() : "";
    const description = descMatch ? descMatch[1].trim() : "";

    const capabilities: string[] = [];
    const tools: string[] = [];

    // Parse capabilities or tools block
    const capBlockMatch = rawYaml.match(/(?:capabilities|tools):\s*\n((?:\s*-\s*.+\n?)+)/);
    if (capBlockMatch) {
      const lines = capBlockMatch[1].split("\n");
      for (const line of lines) {
        const itemMatch = line.match(/^\s*-\s*(.+)$/);
        if (itemMatch) {
          const item = itemMatch[1].trim();
          capabilities.push(item);
          tools.push(item);
        }
      }
    }

    return {
      name,
      description,
      capabilities,
      tools,
      systemPrompt,
      filePath,
    };
  }

  public compileForHost(
    agent: AgentDefinition,
    host: "antigravity" | "claude",
    options?: CompileOptions
  ): CompiledAgentManifest {
    const toolSet = new Set<string>();
    const map = host === "antigravity" ? ANTIGRAVITY_TOOL_MAP : CLAUDE_TOOL_MAP;

    for (const cap of agent.capabilities) {
      if (map[cap]) {
        for (const t of map[cap]) {
          toolSet.add(t);
        }
      } else {
        toolSet.add(cap);
      }
    }

    if (options?.excludeMcpTool) {
      toolSet.delete("call_mcp_tool");
    }

    if (options?.unsupportedTools && options.unsupportedTools.length > 0) {
      const unsupported = new Set(options.unsupportedTools);
      for (const t of Array.from(toolSet)) {
        if (unsupported.has(t)) {
          toolSet.delete(t);
        }
      }
    }

    let finalTools = Array.from(toolSet);
    if (options?.availableTools && options.availableTools.length > 0) {
      const available = new Set(options.availableTools);
      finalTools = finalTools.filter((t) => available.has(t));
    }

    return {
      host,
      name: agent.name,
      description: agent.description,
      tools: finalTools,
      systemPrompt: agent.systemPrompt,
    };
  }

  public compileWithSkills(
    agent: AgentDefinition,
    host: "antigravity" | "claude",
    skillNames: string[],
    options?: CompileOptions,
    skillRepo?: any
  ): CompiledAgentManifest {
    const baseManifest = this.compileForHost(agent, host, options);
    if (!skillNames || skillNames.length === 0) {
      return baseManifest;
    }

    const injectedSections: string[] = [];

    for (const skillName of skillNames) {
      let content: string | null = null;
      if (skillRepo && typeof skillRepo.getSkillContent === "function") {
        content = skillRepo.getSkillContent(skillName);
      }
      if (!content) {
        const localPath1 = join(this.rootDir, ".agents", "skills", skillName, "SKILL.md");
        const localPath2 = join(this.rootDir, "skills", skillName, "SKILL.md");
        if (existsSync(localPath1)) {
          content = readFileSync(localPath1, "utf-8");
        } else if (existsSync(localPath2)) {
          content = readFileSync(localPath2, "utf-8");
        }
      }

      if (content) {
        injectedSections.push(`## Skill: ${skillName}\n${content.trim()}`);
      }
    }

    if (injectedSections.length > 0) {
      baseManifest.systemPrompt = `${baseManifest.systemPrompt.trimEnd()}\n\n# Injected Task Skills\n\n${injectedSections.join("\n\n")}\n`;
    }

    return baseManifest;
  }


  public syncAgents(options?: {
    host?: "antigravity" | "claude" | "all";
    targetDir?: string;
    compileOptions?: CompileOptions;
  }): SyncResult {
    const host = options?.host || "antigravity";
    const targetDir = options?.targetDir || join(this.rootDir, "agents");
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const agents = this.listAgents();
    const synced: CompiledAgentManifest[] = [];

    for (const agent of agents) {
      const targetHost = host === "all" ? "antigravity" : host;
      const compiled = this.compileForHost(agent, targetHost, options?.compileOptions);
      synced.push(compiled);

      const toolsYaml = compiled.tools.map((t) => `  - ${t}`).join("\n");
      const content = `---
name: ${compiled.name}
description: ${compiled.description}
tools:
${toolsYaml}
---

${compiled.systemPrompt.trim()}
`;
      writeFileSync(join(targetDir, `${compiled.name}.md`), content, "utf-8");
    }

    return {
      host,
      targetDir,
      synced,
    };
  }

  public validateAgents(customDir?: string): ValidationResult {
    const agents = this.listAgents(customDir);
    const errors: string[] = [];

    for (const agent of agents) {
      if (!agent.name) {
        errors.push(`Agent at ${agent.filePath} missing required name.`);
      }
      if (!agent.description) {
        errors.push(`Agent '${agent.name || agent.filePath}' missing required description.`);
      }
      for (const cap of agent.capabilities) {
        // Valid if known capability or already mapped host tool
        const isKnownCap = KNOWN_CAPABILITIES.has(cap);
        const isAntigravityTool = Object.values(ANTIGRAVITY_TOOL_MAP).flat().includes(cap);
        const isClaudeTool = Object.values(CLAUDE_TOOL_MAP).flat().includes(cap);

        if (!isKnownCap && !isAntigravityTool && !isClaudeTool) {
          errors.push(
            `Agent '${agent.name}' contains unknown capability or unsupported tool: '${cap}'`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
