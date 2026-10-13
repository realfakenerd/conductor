# TypeScript Style Guide Summary

This document summarizes key rules and best practices for TypeScript in Conductor.

## 1. Language Rules

- **Strict Mode:** Always enable `"strict": true` in `tsconfig.json`.
- **No Implicit Any:** Never use bare `any`. Prefer explicit types, `unknown`, or generic type parameters.
- **Imports:** Use standard ES module imports (`import { ... } from "..."`). Under Bun, explicit `.ts` extensions are supported.
- **Async/Await:** Use `async`/`await` instead of raw Promise chains.
- **Immutability:** Prefer `readonly` arrays/properties and `const` declarations.

## 2. Style Rules

- **Indentation:** 2 spaces per indentation level.
- **Quotes:** Double quotes (`"`) for strings, backticks for template literals.
- **Naming:**
  - `camelCase` for functions, methods, and variables.
  - `PascalCase` for classes, interfaces, types, and enums.
  - `UPPER_SNAKE_CASE` for global module constants.
- **Error Handling:** Use custom error classes extending `Error` (e.g. `EngineError`). Avoid throwing raw strings.
- **Schemas:** Use `zod` for validating external inputs, CLI flags, and MCP tool payloads.
