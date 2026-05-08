export const IDE_MCP_SKILL = `---
name: ide-mcp
description: Prefer connected JetBrains IDE MCP servers such as WebStorm or IntelliJ IDEA for code search, symbol navigation, refactors, and project-aware analysis before falling back to shell exploration
---

# ide-mcp - Prefer JetBrains IDE MCP for Code Work

Use this skill when the task touches source code and the current agent session may have JetBrains IDE MCP servers connected, especially \`webstorm\` or \`idea\`.

## Goal

Prefer IDE-aware MCP tools for project navigation and refactors without making them a hard dependency. The skill should help both Codex and Claude-compatible sessions take advantage of the user's existing IDE MCP setup when it is present.

## Workflow

1. Check whether the current session exposes JetBrains IDE MCP servers such as \`webstorm\` or \`idea\`.
2. If one is available, prefer it for project-aware work:
   - symbol lookup and navigation
   - go-to-definition, implementations, and usages
   - project-wide search with IDE context
   - rename, move, and refactor flows
   - IDE inspections and code-aware analysis
3. Use normal repo tools alongside MCP when they are the better fit:
   - \`rg\` and targeted file reads for quick text search
   - local build, test, and lint commands for verification
   - git history or diff inspection as usual
4. Do not assume one transport or endpoint shape. Detect the available MCP server by alias and capabilities at runtime.
5. If both \`webstorm\` and \`idea\` are present, use whichever is connected to the right project and exposes the needed tools.
6. If no JetBrains IDE MCP server is available, say so briefly and continue with the normal repo workflow instead of blocking the task.

## Good Fits

- "Find where this symbol is used"
- "Rename this API across the repo"
- "Refactor this class safely"
- "Navigate from this call site to its definition"
- "Inspect the project structure before editing"

## Fallback

When IDE MCP is unavailable or does not expose the needed operation:

- explore with \`rg --files\`, \`rg\`, and focused file reads
- make changes with the repo's normal edit workflow
- run focused build, test, or lint commands to verify the result

This skill is a preference layer, not a provisioning step. It assumes the user's MCP client or JetBrains IDE integration is already configured outside this repo.
`;
