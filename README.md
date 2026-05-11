# coding-agents-toolings

Skills and toolings for AI coding agents. Install spec-driven development skills into any git repo, with optional repo-local Codex and Claude hook wiring.

## Quick Start

```bash
npx coding-agents-toolings init
```

This installs five skills and sets up your repo:

```
.agents/skills/
  spec-create/SKILL.md     # Create a spec + task breakdown
  spec-update/SKILL.md     # Update spec before session end
  spec-complete/SKILL.md   # Archive completed spec
  spec-handoff/SKILL.md    # Generate a handoff summary for teammates
  ide-mcp/SKILL.md         # Prefer JetBrains IDE MCP tools for code work when available

.claude/skills -> ../.agents/skills   # Compatibility symlink for Claude Code and similar agent setups

.gitignore                 # agent-specs/ added (local working state)
```

If you also want repo-local hooks for Codex and Claude, run:

```bash
npx coding-agents-toolings init --hook
```

That additionally writes:

```
.codex/config.toml                    # Repo-local Codex hook config + codex_hooks feature flag
.codex/hooks/ide-mcp-context.mjs      # Hook script for Codex

.claude/settings.json                 # Repo-local Claude hook config
.claude/hooks/ide-mcp-context.mjs     # Hook script for Claude
```

## Skills

### `/spec-create`

Creates a structured spec and task breakdown for a new development task.

Produces a compact working set in `agent-specs/active/<task-name>/`:

- **`<task-name>-plan.md`** — Concise landing page with requirements, acceptance criteria, design, decisions, risks, and a cumulative multi-codebase map
- **`<task-name>-tasks.md`** — Phased checklist with effort estimates (S/M/L/XL), per-task acceptance criteria, dependency tracking, and a handoff section
- **`history/`** — Archived session notes kept outside the main plan so the active spec stays readable

### `/spec-update`

Updates an existing spec before context compaction or session end. Captures what git doesn't record:

- Rewrites the active plan/tasks in place so they stay concise and current
- Maintains the plan's Codebase Map with in-scope repos, paths, links, and re-entry commands
- Writes a new timestamped note under `history/` for audit detail and failed attempts
- Marks tasks done/blocked, adds newly discovered tasks
- Updates the handoff section with current focus, next step, primary repos/paths, and open questions

### `/spec-complete`

Marks a task as done and archives it:

- Verifies all tasks and acceptance criteria are met
- Writes a completion summary with outcome and lessons learned
- Moves the task from `agent-specs/active/` to `agent-specs/completed/`
- Preserves `history/` and handoff files for later audits

### `/spec-handoff`

Generates a standalone handoff summary for sharing with teammates in Slack, PRs, or tickets:

- Auto-runs `spec-update` first to ensure docs are current
- Reads the spec, tasks, and git history to produce a prose summary
- Uses the Codebase Map as the durable source of repos/paths/links and only reads `history/` when extra context is needed
- Outputs to the conversation **and** saves to `agent-specs/active/<task-name>/<task-name>-handoff.md`
- Supports format variants via `--format` flag: `default`, `pr`, `slack`, `ticket`

### `ide-mcp`

Helps coding sessions prefer connected JetBrains IDE MCP servers such as IntelliJ IDEA, WebStorm, PyCharm, GoLand, Rider, PhpStorm, RubyMine, RustRover, CLion, DataGrip, or DataSpell when the prompt is clearly about source code work.

- Uses the shared repo-local skill as the portable behavior contract
- Can optionally add repo-local Codex and Claude hooks when you run `init --hook`
- When hooks are enabled, adds extra Codex guardrails so a code-oriented turn keeps leaning on JetBrains MCP after the first successful IDE lookup instead of drifting immediately into broad shell search
- Nudges the agent toward IDE-aware symbol lookup, navigation, usages, inspections, and refactors
- Falls back to normal repo exploration with `rg`, file reads, and build/test commands when no IDE MCP server is connected
- Does **not** provision MCP connections itself; it relies on the user's existing Codex, Claude, or JetBrains setup

## Options

```
npx coding-agents-toolings init [options]

--force       Overwrite existing files without prompting
--dry-run     Show what would happen without writing anything
--no-symlink  Only write to .agents/skills/, skip .claude/skills symlink
--hook        Also install repo-local Codex and Claude hook setup
```

## How It Works

Skills are installed to `.agents/skills/` with a compatibility symlink from `.claude/skills/` for Claude Code and related agent environments. The `ide-mcp` skill is the shared, portable behavior layer. Hook installation is opt-in: when you run `init --hook`, both Codex and Claude get a repo-local `UserPromptSubmit` nudge, and Codex also gets repo-local tool-time guardrails so broad shell search is less likely to replace JetBrains MCP navigation too early in a code-oriented turn.

This package does not write user-global client config such as `~/.codex/config.toml` or `~/.claude.json`, and it does not try to generate JetBrains MCP connection details. It only installs repo-local skills and repo-local hook/config files.

Specs are written to `agent-specs/` which is automatically added to `.gitignore` since they are local working state, not committed artifacts.

### Directory Structure

```
your-repo/
  .agents/skills/          # Skill definitions (committed)
  .claude/skills           # Symlink -> ../.agents/skills (committed)
  agent-specs/             # Local specs (gitignored)
    active/                # In-progress tasks
      my-feature/
        my-feature-plan.md
        my-feature-tasks.md
        my-feature-handoff.md
        history/
          2026-04-30-0945.md
    completed/             # Archived tasks
```

With `init --hook`, the repo also gets:

```
your-repo/
  .claude/settings.json    # Repo-local Claude hook config (committed)
  .claude/hooks/           # Hook scripts for Claude (committed)
  .codex/config.toml       # Repo-local Codex config + hooks (committed)
  .codex/hooks/            # Hook scripts for Codex (committed)
```

## Requirements

- Node.js >= 18
- Must be run inside a git repository

## License

MIT
