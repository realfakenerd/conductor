# Technology Stack: Conductor

## Plugin & Agent Core
- **Plugin Manifests**: `plugin.json` (Antigravity), `.claude-plugin/marketplace.json` (Claude Code)
- **Agent Skill Format**: Markdown (`SKILL.md`) with YAML frontmatter conforming to Agent Skills specification
- **Agent Rule Engine**: Markdown context rules (`rules/*.md`)

## Scripting & Automation
- **Runtime**: Bun 1.x (native TypeScript execution, sub-15ms startup)
- **Language**: TypeScript (strict mode, zero build step required under Bun)
- **Protocol**: Model Context Protocol (MCP) over stdio (`@modelcontextprotocol/sdk`, Zod schemas)

## Tooling & Host Environments
- **Supported Hosts**: Antigravity CLI & IDE (`agy`), Claude Code, Cursor, JetBrains
- **Version Control**: Git (atomic commits, semantic prefixes, Git Notes verification)
- **Validation**: `bun test`, TypeScript compiler check (`bun --bun tsc --noEmit`), Markdown formatting
