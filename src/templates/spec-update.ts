export const SPEC_UPDATE_SKILL = `---
name: spec-update
description: Update an existing spec and tasks before context compaction or session end
---

# spec-update — Update Development Spec

You are updating an existing development spec to preserve context before a session ends or context compaction occurs. Your goal is to capture everything a fresh session needs to continue the work seamlessly without turning the active spec into a novel.

The plan and tasks files are the concise working set. Detailed session-by-session notes belong in \`history/\`.

Preserve cross-repo context deliberately. If the work spans multiple microservices or repos, the active spec must say so clearly and keep those references current.

## Process

1. **Find the active spec**: Look in \`agent-specs/active/\` for the task directory. If multiple exist, ask which one to update.

2. **Review current state**: Read both the plan and tasks files. Read recent history notes only if needed. Compare against:
   - Git diff (staged and unstaged changes)
   - Git log (recent commits in this session)
   - Any open files or recent conversations

3. **Update the plan file** (\`<task-name>-plan.md\`):

   Update the "Last updated" timestamp.

   **Refresh sections in place** — Keep the plan current, concise, and deduplicated:
   - Rewrite summaries so they reflect the latest truth instead of appending session prose
   - Merge repeated bullets and remove stale details that no longer matter
   - If a previous decision was reversed, keep only the current decision in the main plan and record the change in the new history note

   **Decisions & Trade-offs** — Add or update the current decision set:
   | Decision | Choice | Alternatives Considered | Rationale |
   |----------|--------|------------------------|-----------|
   | ... | ... | ... | ... |

   **Codebase Map** — Treat this as the canonical inventory for context-compacted sessions across one or more codebases:
   - Add newly touched or discovered repos, service roots, files, directories, docs, issue links, dashboards, and helpful commands
   - Keep entries deduplicated
   - Ensure each path, link, or command is tied to the correct repo/codebase
   - Remove something only if you are sure it is no longer in scope; if you do, explain that change in the history note

4. **Write a session archive note**: Create a new file in \`history/\` named \`YYYY-MM-DD-HHMM.md\`.
   - If that filename already exists, add a short suffix such as \`-followup\`
   - Never edit or remove prior history files

   \`\`\`markdown
   # Session — YYYY-MM-DD HH:MM

   ## Session Summary
   - What was accomplished
   - What changed in understanding or design

   ## Work Completed
   - Concrete edits, investigations, or decisions made

   ## Attempts That Failed
   - What was tried
   - Why it did not work or was abandoned

   ## Handoff Context
   - Uncommitted work
   - Blockers or open questions
   - Gotchas or surprises discovered
   - Useful links, commands, or file paths discovered this session
   \`\`\`

5. **Update the tasks file** (\`<task-name>-tasks.md\`):

   Update the "Last updated" timestamp.

   - Mark completed tasks: \`- [ ]\` → \`- [x]\`
   - Mark blocked tasks and note the blocker
   - Add newly discovered tasks in the appropriate phase
   - Update effort estimates if original was wrong
   - Keep task wording short; design details stay in the plan and session chronology stays in \`history/\`

   **Update the Handoff section**:
   \`\`\`markdown
   ## Handoff
   - **Current focus**: what task/phase is in progress
   - **Next step**: the specific next action to take
   - **Primary repos / paths**: 1-5 repo-qualified paths or repo roots to open first (must also exist in the plan's Codebase Map)
   - **Uncommitted work**: description of any uncommitted changes and their state
   - **Open questions**: anything that needs human input or further research
   - **Gotchas**: things the next session should watch out for
   - **Latest history note**: \`history/YYYY-MM-DD-HHMM.md\`
   \`\`\`

## Guidelines

- **Focus on what git doesn't record**: Git captures *what* changed. You capture *why*, *what was tried and failed*, and *what to do next*.
- **Active spec stays concise**: The plan and tasks are the working set, not the full audit trail. Rewrite them in place to reflect the latest truth.
- **History is append-only**: Never edit or remove prior history notes. They form the audit log.
- **Codebase Map is sacred**: Keep it cumulative and current so future sessions can recover key repos, paths, and links after context compaction.
- **Multiple codebases matter**: When the work spans more than one repo or microservice, keep all affected codebases visible in the active spec. Never assume the current shell repo is the whole story.
- **Be honest about state**: If something is broken, half-done, or unclear, say so explicitly in the handoff.
- **Keep it concise**: Each history note should be short and actionable, not a novel. Focus on information that code and git do not already preserve.
- **Update, don't accumulate**: Modify the plan and tasks in place. Detailed chronology belongs in \`history/\`, not pasted into the active spec.
- **Update timestamps**: Always update "Last updated" in both files. These files are gitignored, so timestamps are the only way to track freshness.
`;
