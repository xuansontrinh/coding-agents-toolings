export const SPEC_COMPLETE_SKILL = `---
name: spec-complete
description: Mark a spec as completed and archive it
---

# spec-complete — Complete and Archive Spec

You are marking a development task as completed and archiving it for future reference.

## Process

1. **Find the active spec**: Look in \`agent-specs/active/\` for the task directory. If multiple exist, ask which one to complete.

2. **Verify completeness**: Read the plan and tasks files, then check:
   - All tasks in the tasks file are marked \`[x]\`
   - All acceptance criteria in the plan are met
   - All requirements are satisfied
   - No open questions remain in the Handoff section

   If anything is incomplete, inform the user and ask whether to proceed anyway or finish the remaining work first.

3. **Write a completion summary**: Append to the plan file:

   \`\`\`markdown
   ## Completion Summary

   **Completed**: YYYY-MM-DD
   **Status**: completed | partial (explain what was skipped and why)

   ### Outcome
   - Brief summary of what was delivered
   - Any deviations from the original design and why

   ### Lessons Learned
   - What went well
   - What was harder than expected
   - What would you do differently next time
   \`\`\`

4. **Update the tasks file**: Update "Last updated" timestamp. Ensure all tasks reflect their final state (done, skipped with reason, or deferred).

5. **Archive**: Move the entire task directory from \`agent-specs/active/<task-name>/\` to \`agent-specs/completed/<task-name>/\`. Create \`agent-specs/completed/\` if it doesn't exist.
   - Preserve the \`history/\` directory and any handoff files exactly as they are for audit purposes
   - Do not flatten or rewrite archived history just to "clean it up"

6. **Report**: Tell the user what was archived and where to find it.

## Guidelines

- **Don't skip verification**: Even if the user says "it's done", read the tasks and confirm. Catching a missed task now is better than discovering it later.
- **Be honest in the summary**: If the implementation diverged from the plan, document why. This is valuable context for anyone revisiting the work.
- **Keep the plan concise even at the end**: The completion summary should explain the outcome, not repeat the full session history. Historical detail already lives in \`history/\`.
- **Preserve auditability**: The archived task should still contain the durable multi-codebase map, final tasks state, handoff snapshot, and history notes.
- **Lessons learned are optional but encouraged**: If nothing surprising happened, a single "Straightforward implementation, no surprises" is fine.
- **Partial completion is OK**: Not every spec needs 100% completion. What matters is that the final state is clearly documented.
`;
