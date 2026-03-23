/**
 * handoff.ts — CLI command: generate a structured handoff prompt.
 *
 * `agentops handoff` produces a markdown handoff document that includes:
 * - Summary of session events
 * - Uncommitted changes (git status / diff --stat)
 * - Recent commits (git log)
 * - Open tasks / next steps from memory
 * - A ready-to-paste prompt for a fresh session
 *
 * Can be triggered manually or recommended automatically when context is full.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { CommandDefinition, ParsedArgs, output, isJson } from '../parser';
import { Logger } from '../../observability/logger';

const logger = new Logger({ module: 'cli-handoff' });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HandoffResult {
  generated_at: string;
  branch: string;
  last_commit: string;
  uncommitted_changes: string;
  git_diff_stat: string;
  recent_commits: string[];
  session_summary: string;
  remaining_work: string[];
  handoff_prompt: string;
  saved_to?: string;
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function git(cmd: string, cwd?: string): string {
  try {
    return execSync(`git ${cmd}`, {
      encoding: 'utf-8',
      timeout: 5000,
      cwd: cwd ?? process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Memory helpers
// ---------------------------------------------------------------------------

/** Read memory files from the Claude project memory directory. */
function readMemoryFiles(projectDir?: string): { index: string; handoffs: string[] } {
  const memoryDir = resolveMemoryDir(projectDir);
  let index = '';
  const handoffs: string[] = [];

  if (!memoryDir || !fs.existsSync(memoryDir)) {
    return { index, handoffs };
  }

  // Read MEMORY.md index
  const indexPath = path.join(memoryDir, 'MEMORY.md');
  if (fs.existsSync(indexPath)) {
    index = fs.readFileSync(indexPath, 'utf-8');
  }

  // Read all handoff files
  try {
    const files = fs.readdirSync(memoryDir);
    for (const file of files) {
      if (file.startsWith('project_handoff_') && file.endsWith('.md')) {
        handoffs.push(file);
      }
    }
  } catch {
    // Ignore
  }

  return { index, handoffs };
}

/** Resolve the Claude project memory directory. */
function resolveMemoryDir(projectDir?: string): string | undefined {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  if (!home) return undefined;

  // Try to find the project-specific memory dir
  const cwd = projectDir ?? process.cwd();
  const encoded = cwd.replace(/\//g, '-');
  const candidate = path.join(home, '.claude', 'projects', encoded, 'memory');
  if (fs.existsSync(candidate)) return candidate;

  // Try common patterns
  const claudeProjects = path.join(home, '.claude', 'projects');
  if (!fs.existsSync(claudeProjects)) return undefined;

  try {
    const dirs = fs.readdirSync(claudeProjects);
    for (const dir of dirs) {
      const memDir = path.join(claudeProjects, dir, 'memory');
      if (fs.existsSync(memDir) && fs.existsSync(path.join(memDir, 'MEMORY.md'))) {
        // Check if this directory name contains parts of our cwd
        const cwdParts = cwd.split('/').filter(Boolean);
        const lastPart = cwdParts[cwdParts.length - 1];
        if (dir.includes(lastPart)) {
          return memDir;
        }
      }
    }
  } catch {
    // Ignore
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Session data from MemoryStore (best-effort)
// ---------------------------------------------------------------------------

async function getSessionSummary(): Promise<string> {
  try {
    const { MemoryStore } = await import('../../memory/store');
    const store = new MemoryStore();
    await store.initialize();

    // Get recent events from this session
    const events = await store.list({ limit: 50 });
    await store.close();

    if (events.length === 0) return 'No events captured in memory store.';

    const decisions = events.filter(e => e.event_type === 'decision').length;
    const incidents = events.filter(e => e.event_type === 'incident').length;
    const patterns = events.filter(e => e.event_type === 'pattern').length;
    const files = new Set(events.flatMap(e => e.affected_files ?? []));

    return `${events.length} events (${decisions} decisions, ${incidents} incidents, ${patterns} patterns). ${files.size} files referenced.`;
  } catch (e) {
    logger.debug('Failed to get session summary', { error: e instanceof Error ? e.message : String(e) });
    return 'Memory store unavailable.';
  }
}

async function getRemainingWork(): Promise<string[]> {
  try {
    const { MemoryStore } = await import('../../memory/store');
    const store = new MemoryStore();
    await store.initialize();

    // Search for open tasks / remaining work events
    const events = await store.search('remaining work next steps todo', {
      limit: 10,
    });
    await store.close();

    return events
      .filter(e => e.event.detail)
      .map(e => e.event.detail.slice(0, 200))
      .slice(0, 5);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Handoff formatter
// ---------------------------------------------------------------------------

function formatHandoff(result: HandoffResult): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push(`name: Auto-handoff — ${new Date().toISOString().slice(0, 10)}`);
  lines.push('description: Auto-generated handoff for fresh session continuity');
  lines.push('type: project');
  lines.push('---');
  lines.push('');
  lines.push('# Session Handoff (Auto-Generated)');
  lines.push('');
  lines.push(`Generated: ${result.generated_at}`);
  lines.push('');

  // Current state
  lines.push('## Current State');
  lines.push(`- **Branch**: ${result.branch}`);
  lines.push(`- **Last commit**: ${result.last_commit}`);
  lines.push('');

  // Session summary
  if (result.session_summary) {
    lines.push('## Session Summary');
    lines.push(result.session_summary);
    lines.push('');
  }

  // Uncommitted changes
  if (result.uncommitted_changes) {
    lines.push('## Uncommitted Changes');
    lines.push('```');
    lines.push(result.uncommitted_changes);
    lines.push('```');
    lines.push('');
  }

  // Diff stat
  if (result.git_diff_stat) {
    lines.push('## Recent Diff');
    lines.push('```');
    lines.push(result.git_diff_stat);
    lines.push('```');
    lines.push('');
  }

  // Recent commits
  if (result.recent_commits.length > 0) {
    lines.push('## Recent Commits');
    lines.push('```');
    for (const commit of result.recent_commits) {
      lines.push(commit);
    }
    lines.push('```');
    lines.push('');
  }

  // Remaining work
  if (result.remaining_work.length > 0) {
    lines.push('## Remaining Work');
    for (const item of result.remaining_work) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // The paste-ready handoff prompt
  lines.push('## Handoff Prompt');
  lines.push('');
  lines.push('Copy and paste the block below into a fresh session:');
  lines.push('');
  lines.push('```');
  lines.push(result.handoff_prompt);
  lines.push('```');

  return lines.join('\n');
}

function buildHandoffPrompt(result: Omit<HandoffResult, 'handoff_prompt'>): string {
  const lines: string[] = [];

  lines.push(`Read the handoff at ~/.claude/projects/.../memory/ and continue work.`);
  lines.push('');
  lines.push(`Branch: ${result.branch}`);
  lines.push(`Last commit: ${result.last_commit}`);
  lines.push('');

  if (result.uncommitted_changes) {
    lines.push('Uncommitted changes:');
    lines.push(result.uncommitted_changes);
    lines.push('');
  }

  if (result.recent_commits.length > 0) {
    lines.push('Recent commits:');
    for (const c of result.recent_commits.slice(0, 5)) {
      lines.push(`  ${c}`);
    }
    lines.push('');
  }

  if (result.remaining_work.length > 0) {
    lines.push('Remaining work:');
    for (const w of result.remaining_work) {
      lines.push(`  - ${w}`);
    }
    lines.push('');
  }

  lines.push('Pick up where the previous session left off.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const handoffCommand: CommandDefinition = {
  name: 'handoff',
  description: 'Generate a structured handoff for session continuity',
  usage: [
    'Usage: agentops handoff [options]',
    '',
    'Options:',
    '  --save          Save handoff to memory directory',
    '  --session-id    Session identifier (default: auto)',
    '  --remaining     Comma-separated remaining work items',
    '  --json          Output in JSON format',
    '',
    'What it does:',
    '  1. Gathers git state (status, diff, log)',
    '  2. Reads session events from memory store',
    '  3. Formats a structured handoff document',
    '  4. Generates a paste-ready prompt for a new session',
    '  5. Optionally saves to ~/.claude/projects/.../memory/',
  ].join('\n'),

  async run(args: ParsedArgs): Promise<void> {
    const json = isJson(args.flags);
    const save = args.flags['save'] === true;
    const sessionId = typeof args.flags['session-id'] === 'string'
      ? args.flags['session-id']
      : `session-${Date.now()}`;

    // Parse remaining work from --remaining flag or positional args
    let remaining: string[] = [];
    const remainingFlag = args.flags['remaining'];
    if (typeof remainingFlag === 'string') {
      remaining = remainingFlag.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Gather git state
    const branch = git('branch --show-current') || git('rev-parse --abbrev-ref HEAD') || 'unknown';
    const lastCommit = git('log -1 --oneline') || 'no commits';
    const uncommitted = git('status --short') || '';
    const diffStat = git('diff --stat') || '';
    const recentCommits = git('log --oneline -10').split('\n').filter(Boolean);

    // Gather session data
    const sessionSummary = await getSessionSummary();

    // If no remaining work provided, try to get from memory
    if (remaining.length === 0) {
      remaining = await getRemainingWork();
    }

    // Build result (without prompt first)
    const partial: Omit<HandoffResult, 'handoff_prompt'> = {
      generated_at: new Date().toISOString(),
      branch,
      last_commit: lastCommit,
      uncommitted_changes: uncommitted,
      git_diff_stat: diffStat,
      recent_commits: recentCommits,
      session_summary: sessionSummary,
      remaining_work: remaining,
    };

    const handoffPrompt = buildHandoffPrompt(partial);

    const result: HandoffResult = {
      ...partial,
      handoff_prompt: handoffPrompt,
    };

    // Save to memory directory if requested
    if (save) {
      const memoryDir = resolveMemoryDir();
      if (memoryDir) {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `project_handoff_auto_${timestamp}.md`;
        const filePath = path.join(memoryDir, filename);
        const formatted = formatHandoff(result);
        fs.writeFileSync(filePath, formatted + '\n', 'utf-8');
        result.saved_to = filePath;
      }
    }

    // Store handoff event in memory (best-effort)
    try {
      const { MemoryStore } = await import('../../memory/store');
      const store = new MemoryStore();
      await store.initialize();
      await store.capture({
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        agent_id: 'cli-handoff',
        event_type: 'handoff',
        severity: 'low',
        skill: 'system',
        title: `auto-handoff:${sessionId}`,
        detail: `Handoff generated. Branch: ${branch}. ${recentCommits.length} recent commits.`,
        affected_files: [],
        tags: ['handoff', 'auto-generated'],
        metadata: { branch, commit_count: recentCommits.length },
      });
      await store.close();
    } catch (e) {
      logger.debug('Failed to store handoff event', { error: e instanceof Error ? e.message : String(e) });
    }

    // Output
    if (json) {
      output(result, true);
      return;
    }

    // Pretty output
    const w = (s: string) => process.stdout.write(s);
    const formatted = formatHandoff(result);
    w(formatted);
    w('\n');

    if (result.saved_to) {
      w(`\nSaved to: ${result.saved_to}\n`);
    }
  },
};
