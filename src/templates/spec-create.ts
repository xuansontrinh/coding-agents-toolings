export const SPEC_CREATE_SKILL = `---
name: spec-create
description: Create a spec and task breakdown for a new development task
agent: *
---

# spec-create — Create Development Spec

You are starting a new development task. Your job is to create a comprehensive spec and task breakdown that any AI agent (or human) can pick up and implement independently.

## Process

1. **Understand the request**: Ask clarifying questions if the goal is ambiguous. Identify the scope, constraints, and success criteria.

2. **Research the codebase**: Before writing anything, explore the relevant parts of the codebase:
   - Find related files, patterns, and conventions
   - Understand existing architecture and how the new work fits in
   - Identify dependencies, potential conflicts, and reusable code

3. **Create the spec directory**: Create \`agent-specs/active/<task-name>/\` where \`<task-name>\` is a short kebab-case identifier.

4. **Write the spec file** (\`<task-name>-spec.md\`):

\`\`\`markdown
# <Task Name>

Last updated: YYYY-MM-DD HH:MM

## Overview
One-paragraph summary of what this task accomplishes and why.

## Requirements
- [ ] Requirement 1 — clear, testable statement
- [ ] Requirement 2
- ...

## Acceptance Criteria
- [ ] Criterion 1 — how to verify the requirement is met
- [ ] Criterion 2
- ...

## Current State
What exists today. Relevant code paths, data flows, or behaviors.

## Proposed Design
How the implementation will work. Include:
- Architecture / component design
- API contracts (if applicable)
- Data flow changes
- Key algorithms or logic

## Decisions & Trade-offs
| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| ... | ... | ... | ... |

## Dependencies & Risks
- **Dependency**: description and mitigation
- **Risk**: description and mitigation

## Key Files & Context
| File | Role | Notes |
|------|------|-------|
| \\\`path/to/file\\\` | description | relevant details |
\`\`\`

5. **Write the tasks file** (\`<task-name>-tasks.md\`):

\`\`\`markdown
# <Task Name> — Tasks

Last updated: YYYY-MM-DD HH:MM

## Phase 1: <Phase Name>
- [ ] **Task 1** [S] — Description
  - Acceptance: how to verify this task is done
  - Depends on: nothing | task X
- [ ] **Task 2** [M] — Description
  - Acceptance: ...
  - Depends on: Task 1

## Phase 2: <Phase Name>
- [ ] **Task 3** [L] — Description
  - Acceptance: ...
  - Depends on: Phase 1

## Effort Key
- **S** = Small (< 30 min) — single file, well-understood change
- **M** = Medium (30 min – 2 hr) — multi-file, some design needed
- **L** = Large (2 – 4 hr) — significant implementation, testing needed
- **XL** = Extra Large (4+ hr) — consider breaking down further

## Handoff
- **Current focus**: (which task/phase to start with)
- **Next step**: (specific action to take first)
- **Open questions**: (anything unresolved that needs input)
\`\`\`

## Guidelines

- **Be specific, not generic**: Every requirement and task should reference actual code, files, or behaviors in this codebase.
- **Avoid duplication**: The spec is the single source of truth for *what* and *why*. The tasks file is for *how* and *when*. Don't repeat design details in tasks.
- **Size tasks for AI agents**: Each task should be completable in a single focused session. If a task needs more than ~4 files changed, break it down.
- **Include acceptance criteria everywhere**: Both the spec (for requirements) and tasks (for individual work items) need clear verification steps.
- **Think about session continuity**: Write as if the next person reading has zero context. The spec + tasks should be fully self-contained.
- **Update timestamps**: Always update "Last updated" when creating or modifying files. These files are gitignored, so timestamps are the only way to track freshness.
`;
