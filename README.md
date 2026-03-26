# coding-agents-toolings

Skills and toolings for AI coding agents. Install spec-driven development skills into any git repo, compatible with Claude Code and other AI agents.

## Quick Start

```bash
npx coding-agents-toolings init
```

This installs three skills and sets up your repo:

```
.agents/skills/
  spec-create/SKILL.md     # Create a spec + task breakdown
  spec-update/SKILL.md     # Update spec before session end
  spec-complete/SKILL.md   # Archive completed spec

.claude/skills -> ../.agents/skills   # Symlink for Claude Code discovery

.gitignore                 # agent-specs/ added (local working state)
```

## Skills

### `/spec-create`

Creates a structured spec and task breakdown for a new development task.

Produces two files in `agent-specs/active/<task-name>/`:

- **`<task-name>-plan.md`** — Overview, requirements, acceptance criteria, design, decisions, dependencies, key files
- **`<task-name>-tasks.md`** — Phased checklist with effort estimates (S/M/L/XL), per-task acceptance criteria, dependency tracking, and a handoff section

### `/spec-update`

Updates an existing spec before context compaction or session end. Captures what git doesn't record:

- Appends decisions and newly touched files to the plan
- Adds timestamped session notes (append-only log)
- Marks tasks done/blocked, adds newly discovered tasks
- Updates the handoff section with current focus, next step, and open questions

### `/spec-complete`

Marks a task as done and archives it:

- Verifies all tasks and acceptance criteria are met
- Writes a completion summary with outcome and lessons learned
- Moves the task from `agent-specs/active/` to `agent-specs/completed/`

## Options

```
npx coding-agents-toolings init [options]

--force       Overwrite existing files without prompting
--dry-run     Show what would happen without writing anything
--no-symlink  Only write to .agents/skills/, skip .claude/skills symlink
```

## How It Works

Skills are installed to `.agents/skills/` with a symlink from `.claude/skills/` for Claude Code discovery. Specs are written to `agent-specs/` which is automatically added to `.gitignore` since they are local working state, not committed artifacts.

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
    completed/             # Archived tasks
```

## Requirements

- Node.js >= 18
- Must be run inside a git repository

## License

MIT
