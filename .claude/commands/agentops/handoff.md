---
name: agentops-handoff
description: >
  Generate a structured handoff prompt for session continuity. Use when context
  is critically full or when ending a work session. Outputs a paste-ready prompt
  for a fresh session.
---

Generate a structured handoff for the current session. Follow these steps exactly:

## Step 1: Gather session state

Use the `agentops_generate_handoff` MCP tool to generate the handoff data. Pass in:
- `session_summary`: A brief summary of what was accomplished this session
- `remaining_work`: A list of tasks that still need to be done

If the MCP tool is unavailable, gather the data manually:
1. Run `git status --short` for uncommitted changes
2. Run `git diff --stat` for change summary
3. Run `git log --oneline -10` for recent commits
4. Run `git branch --show-current` for current branch

## Step 2: Review todo list

Check the current todo list for any incomplete items. These become the "remaining work" in the handoff.

## Step 3: Check memory files

Read the memory index at `~/.claude/projects/.../memory/MEMORY.md` to find any open project notes or pending tasks that should be carried forward.

## Step 4: Format the handoff

Output the handoff in this format:

```
---
name: Phase N Handoff — <short description>
description: Session handoff for Phase N+1
type: project
---

# Session Handoff — AgentOps Phase N → Phase N+1

## What was completed (<date>, Session N)
- <completed item 1>
- <completed item 2>

## Current state
- **Branch**: <branch>
- **Tests**: <test count> passing, <failing> failing
- **Build**: <clean/errors>

## Uncommitted changes
<git status output>

## Recent commits
<git log output>

## What needs to happen next
- <next task 1>
- <next task 2>
```

## Step 5: Save the handoff

Save the handoff to `~/.claude/projects/.../memory/project_handoff_phaseN.md` and update `MEMORY.md` to include a pointer to the new file.

## Step 6: Present paste-ready prompt

Output a condensed version of the handoff that can be pasted directly into a fresh session to resume work.
