# Track: Migrate Conductor Engine to Bun, TypeScript, and Native MCP (Zero Python)

## Artifacts
- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

## Overview
Full architectural migration replacing Python engine scripts with a modular TypeScript core running on Bun, providing both a native stdio Model Context Protocol (MCP) server for direct agent tool calling and a fast CLI runner, with 100% deletion of Python files.
