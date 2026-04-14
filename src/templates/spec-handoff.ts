export const SPEC_HANDOFF_SKILL = `---
name: spec-handoff
description: Generate a standalone handoff summary from an active spec for sharing with teammates
---

# spec-handoff — Generate Handoff Summary

You are generating a standalone handoff summary from an active development spec. The handoff is a self-contained briefing that any teammate — with zero prior context — can read and understand. It is meant for sharing in Slack, PR descriptions, Jira/YouTrack tickets, or any external tool.

## Process

1. **Find the active spec**: Look in \`agent-specs/active/\` for the task directory. If multiple exist, ask which one to generate a handoff for.

2. **Auto-run spec-update**: Before generating the handoff, run the \`spec-update\` skill logic to ensure the spec files reflect the current state. Print a brief note:
   > Updating spec before generating handoff...

   Do not show the full spec-update output — just ensure the plan and tasks files are up to date, then continue.

3. **Read the spec**: Read both the plan file (\`<task-name>-plan.md\`) and tasks file (\`<task-name>-tasks.md\`).

4. **Review git state**: Check \`git log\` and \`git diff\` (staged and unstaged) for recent work related to the spec. Use this to understand what actually happened vs. what was planned.

5. **Determine format**: Check if the user provided a \`--format\` flag:
   - If \`--format <value>\` was provided, use that format (\`default\`, \`pr\`, \`slack\`, or \`ticket\`).
   - If no format was specified, ask the user which format they want before proceeding.

6. **Ask length preference (slack only)**: If the format is \`slack\`, ask the user for a preferred word limit. Suggest a default of 300 words.

7. **Generate the handoff**: Produce a structured summary using the appropriate format template below. Follow these rules:
   - Describe all changes in **natural language** (prose only) — no raw diff stats, no file lists, no code snippets.
   - Write for a reader who has **no prior context** about the task.
   - Be honest about what's incomplete, blocked, or uncertain.

8. **Write to file**: Save the handoff to \`agent-specs/active/<task-name>/<task-name>-handoff.md\`. If the file already exists from a previous run, overwrite it.

9. **Output to conversation**: Print the full handoff to the conversation. After the handoff, tell the user:
   > Handoff saved to \`agent-specs/active/<task-name>/<task-name>-handoff.md\` — open the file to copy the raw markdown.

## Output Format — Default

Use this template when format is \`default\` or unspecified. No length constraint — scale to the complexity of the task.

\`\`\`markdown
## Handoff: <Task Name>

**Date**: YYYY-MM-DD
**Status**: in-progress | blocked | nearly-done

### Context
What this task is about and why it exists. 2-3 sentences max — enough for someone with no prior context.

### Progress
**Completed:**
- Item 1
- Item 2

**Remaining:**
- Item 3 (with any relevant notes)
- Item 4

### Blockers & Risks
- Blocker/risk description and what's needed to resolve it
(or "None" if clear)

### Next Steps
1. The specific next action someone should take
2. Follow-up action

### Key Context
Non-obvious things the reader should know — gotchas, decisions made, things that were tried and didn't work.
(Omit this section if there's nothing non-obvious to call out)
\`\`\`

## Format Variants

### \`pr\` — Pull Request Description

Structured for a PR. Include a test plan. Omit "Context" if the PR title/description already covers it.

\`\`\`markdown
## Summary
1-3 bullet points describing what this PR does and why.

## Changes
Prose description of the key changes, grouped logically.

## Test Plan
- [ ] How to verify this works
- [ ] Edge cases to check

## Notes for Reviewers
Anything non-obvious that reviewers should pay attention to.
(Omit if straightforward)
\`\`\`

### \`slack\` — Slack Message

Short, scannable, no markdown headers. Use bold text for structure. Aim for the user's specified word limit (default: 300 words).

\`\`\`
*Handoff: <Task Name>*
Status: in-progress | blocked | nearly-done

*What:* 1-2 sentence summary.

*Done:*
• Item 1
• Item 2

*Remaining:*
• Item 3
• Item 4

*Blockers:* None | description

*Next:* Specific next action to take.
\`\`\`

### \`ticket\` — Jira/YouTrack Ticket Comment

More formal. Include references to relevant files and acceptance criteria status.

\`\`\`markdown
## Status Update: <Task Name>

**Date**: YYYY-MM-DD
**Status**: in-progress | blocked | nearly-done

### Summary
What was accomplished and where things stand.

### Acceptance Criteria Status
- [x] Criterion 1 — done
- [ ] Criterion 2 — in progress, notes on current state
- [ ] Criterion 3 — not started

### Blockers & Dependencies
- Description and what's needed to unblock
(or "None")

### Next Steps
1. Action item with enough detail for someone to pick it up
2. Follow-up action

### References
- Relevant file paths or documentation links that provide context
\`\`\`

## Guidelines

- **Write for humans, not agents**: The handoff will be read by teammates in Slack, PRs, or tickets. Use natural language, not structured data.
- **No raw diffs or file lists**: Summarize changes in prose. If someone needs the diff, they can look at the PR.
- **Be honest about state**: If something is half-done, broken, or uncertain, say so clearly. A misleading handoff is worse than no handoff.
- **Context is king**: The most valuable part of a handoff is the non-obvious context — things that aren't captured in the code or commit messages.
- **Overwrite, don't accumulate**: The handoff file is a snapshot of current state. Previous versions have no value — always overwrite.
- **Keep format variants distinct**: Don't mix elements between formats. A Slack message should feel like a Slack message, not a miniature PR description.
`;
