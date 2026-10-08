# Technology Stack: Conductor

## Plugin & Agent Core
- **Plugin Manifests**: `plugin.json` (Antigravity), `.claude-plugin/marketplace.json` (Claude Code)
- **Agent Skill Format**: Markdown (`SKILL.md`) with YAML frontmatter conforming to Agent Skills specification
- **Agent Rule Engine**: Markdown context rules (`rules/*.md`)

## Scripting & Automation
- **Runtime**: Python 3 (standard library preferred for zero-dependency execution)
- **Shell**: Bash / POSIX-compliant shell commands

## Tooling & Host Environments
- **Supported Hosts**: Antigravity CLI & IDE (`agy`), Claude Code
- **Version Control**: Git (atomic commits, semantic prefixes)
- **Validation**: Python compilation (`py_compile`), Markdown formatting, `pytest` / `unittest` test suite
