export const SPEC_UPDATE_SKILL = `---
name: spec-update
description: Update an existing spec and tasks before context compaction or session end
---

# spec-update — Update Development Spec

You are updating an existing development spec to preserve context before a session ends or context compaction occurs. Your goal is to capture everything a fresh session needs to continue the work seamlessly.

## Process

1. **Find the active spec**: Look in \`agent-specs/active/\` for the task directory. If multiple exist, ask which one to update.

2. **Review current state**: Read both the plan and tasks files. Compare against:
   - Git diff (staged and unstaged changes)
   - Git log (recent commits in this session)
   - Any open files or recent conversations

3. **Update the plan file** (\`<task-name>-plan.md\`):

   Update the "Last updated" timestamp.

   **Decisions & Trade-offs** — Append any new decisions made during this session:
   | Decision | Choice | Alternatives Considered | Rationale |
   |----------|--------|------------------------|-----------|
   | ... | ... | ... | ... |

   **Key Files & Context** — Add any newly touched or discovered files:
   | File | Role | Notes |
   |------|------|-------|
   | \\\`path/to/file\\\` | description | relevant details |

   **Session Notes** — Append a new timestamped entry (never edit prior entries):
   \`\`\`markdown
   ### Session — YYYY-MM-DD HH:MM
   - What was accomplished
   - What was attempted but didn't work (and why)
   - Gotchas or surprises discovered
   - Important context that isn't captured in code or commits
   \`\`\`

4. **Update the tasks file** (\`<task-name>-tasks.md\`):

   Update the "Last updated" timestamp.

   - Mark completed tasks: \`- [ ]\` → \`- [x]\`
   - Mark blocked tasks and note the blocker
   - Add newly discovered tasks in the appropriate phase
   - Update effort estimates if original was wrong

   **Update the Handoff section**:
   \`\`\`markdown
   ## Handoff
   - **Current focus**: what task/phase is in progress
   - **Next step**: the specific next action to take
   - **Uncommitted work**: description of any uncommitted changes and their state
   - **Open questions**: anything that needs human input or further research
   - **Gotchas**: things the next session should watch out for
   \`\`\`

## Guidelines

- **Focus on what git doesn't record**: Git captures *what* changed. You capture *why*, *what was tried and failed*, and *what to do next*.
- **Session notes are append-only**: Never edit or remove prior session notes. They form a decision log.
- **Be honest about state**: If something is broken, half-done, or unclear, say so explicitly in the handoff.
- **Keep it concise**: Each session note should be 5-15 bullet points, not a novel. Focus on actionable information.
- **Update, don't rewrite**: Modify existing sections in place (except session notes). Don't duplicate information.
- **Update timestamps**: Always update "Last updated" in both files. These files are gitignored, so timestamps are the only way to track freshness.
`;
