/**
 * check-rules.ts — agentops_check_rules tool: Validate changes against project rules.
 */

import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export const name = 'agentops_check_rules';
export const description =
  'Check a proposed file change against CLAUDE.md and AGENTS.md rules. Reports violations.';

export const inputSchema = {
  type: 'object' as const,
  properties: {
    file_path: {
      type: 'string',
      description: 'Path of the file being changed',
    },
    change_description: {
      type: 'string',
      description: 'Description of the proposed change',
    },
  },
  required: ['file_path', 'change_description'],
};

export const argsSchema = z.object({
  file_path: z.string(),
  change_description: z.string(),
});

export interface RuleViolation {
  rule: string;
  description: string;
  severity: string;
}

export interface CheckRulesResult {
  violations: RuleViolation[];
  compliant: boolean;
}

interface RuleCheck {
  rule: string;
  pattern: RegExp;
  severity: string;
  description: string;
}

const BUILT_IN_RULES: RuleCheck[] = [
  {
    rule: 'no-root-files',
    pattern: /saving?\s+(to|in)\s+root|root\s+folder/i,
    severity: 'high',
    description: 'Do not save files to the root folder',
  },
  {
    rule: 'no-secrets',
    pattern: /api[_-]?key|secret|password|credential|\.env/i,
    severity: 'critical',
    description: 'Do not commit secrets, credentials, or .env files',
  },
  {
    rule: 'no-documentation-unless-asked',
    pattern: /readme|\.md$/i,
    severity: 'medium',
    description: 'Do not create documentation files unless explicitly requested',
  },
];

function loadRulesFile(filename: string): string | null {
  const paths = [
    resolve(process.cwd(), filename),
    resolve(process.cwd(), '..', filename),
  ];

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        return readFileSync(p, 'utf-8');
      } catch {
        // Skip unreadable files
      }
    }
  }
  return null;
}

function extractRulesFromMarkdown(content: string): RuleCheck[] {
  const rules: RuleCheck[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Look for NEVER/ALWAYS/DO NOT patterns
    if (/\bNEVER\b/i.test(trimmed)) {
      rules.push({
        rule: 'claude-md-never',
        pattern: new RegExp(
          trimmed
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .substring(0, 60),
          'i',
        ),
        severity: 'high',
        description: trimmed.substring(0, 200),
      });
    }

    if (/\bDO NOT\b/i.test(trimmed)) {
      rules.push({
        rule: 'claude-md-do-not',
        pattern: new RegExp(
          trimmed
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .substring(0, 60),
          'i',
        ),
        severity: 'high',
        description: trimmed.substring(0, 200),
      });
    }
  }

  return rules;
}

function checkFilePathRules(filePath: string): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Check for root folder writes
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 1 && !normalized.startsWith('src/') && !normalized.startsWith('tests/')) {
    violations.push({
      rule: 'no-root-files',
      description: `File "${filePath}" appears to be in the root directory. Use /src, /tests, /docs, /config, /scripts, or /examples instead.`,
      severity: 'high',
    });
  }

  // Check for secret files
  const lowerPath = filePath.toLowerCase();
  if (lowerPath.includes('.env') || lowerPath.includes('credentials') || lowerPath.includes('secret')) {
    violations.push({
      rule: 'no-secrets',
      description: `File "${filePath}" may contain secrets. Never commit .env files or credentials.`,
      severity: 'critical',
    });
  }

  return violations;
}

function checkChangeDescriptionRules(
  changeDescription: string,
  rulesContent: string | null,
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const lowerDesc = changeDescription.toLowerCase();

  // Check for DO NOT CHANGE patterns from rules files
  if (rulesContent) {
    const doNotChangePattern = /DO NOT CHANGE[^]*?(?=\n\n|\n#|$)/gi;
    const matches = rulesContent.match(doNotChangePattern);
    if (matches) {
      for (const match of matches) {
        const files = match.match(/[\w-]+\.\w+/g);
        if (files) {
          for (const file of files) {
            if (lowerDesc.includes(file.toLowerCase())) {
              violations.push({
                rule: 'do-not-change',
                description: `Change appears to affect "${file}" which is marked as DO NOT CHANGE.`,
                severity: 'critical',
              });
            }
          }
        }
      }
    }
  }

  return violations;
}

export async function handler(
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const parsed = argsSchema.parse(args);
    const violations: RuleViolation[] = [];

    // Load rules files
    const claudeMd = loadRulesFile('CLAUDE.md');
    const agentsMd = loadRulesFile('AGENTS.md');
    const rulesContent = [claudeMd, agentsMd].filter(Boolean).join('\n');

    // Check file path rules
    violations.push(...checkFilePathRules(parsed.file_path));

    // Check change description against rules
    violations.push(...checkChangeDescriptionRules(parsed.change_description, rulesContent || null));

    const result: CheckRulesResult = {
      violations,
      compliant: violations.length === 0,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
    };
  }
}
