export type Maturity = 'stable' | 'beta' | 'experimental';

export interface Feature {
  id: string;
  title: string;
  description: string;
  maturity: Maturity;
  icon: string; // lucide icon name
  details: string[];
}

export const features: Feature[] = [
  {
    id: 'mcp-server',
    title: 'MCP Server (9 Tools)',
    description: 'Full Model Context Protocol integration with stdio and HTTP transport for seamless Claude Code workflows.',
    maturity: 'stable',
    icon: 'Plug',
    details: [
      'Health checks & store diagnostics',
      'Event capture with hash chains',
      'Rules validation against CLAUDE.md',
      'Context window estimation',
      'Risk scoring & task sizing',
      'Secret scanning (20+ patterns)',
      'Git status & hygiene checks',
      'Cross-session context recall',
    ],
  },
  {
    id: 'hash-memory',
    title: 'Hash-Chained Memory',
    description: 'Tamper-evident event storage with auto-pruning, incremental verification, and chunked vector search.',
    maturity: 'stable',
    icon: 'Link',
    details: [
      'SHA-256 hash chain for integrity',
      'Auto-pruning by age and count',
      'Incremental chain verification',
      '3-tier search fallback (vector → text → JS)',
      'Multi-provider: SQLite, Supabase',
    ],
  },
  {
    id: 'progressive-enablement',
    title: 'Progressive Enablement',
    description: 'Five adoption levels from Safe Ground to Full Guard — teams adopt at their own pace.',
    maturity: 'stable',
    icon: 'Layers',
    details: [
      'Level 1: Save Points',
      'Level 2: Context Health (default)',
      'Level 3: House Rules',
      'Level 4: Right Size',
      'Level 5: Full Guard',
    ],
  },
  {
    id: 'secret-detection',
    title: 'Secret Detection',
    description: 'Catches AWS keys, GitHub tokens, hardcoded passwords, SQL injection, and eval usage before they reach production.',
    maturity: 'stable',
    icon: 'ShieldAlert',
    details: [
      '20+ detection patterns',
      'AWS, GCP, Azure credential patterns',
      'GitHub/GitLab/npm tokens',
      'Hardcoded passwords & API keys',
      'SQL injection & eval detection',
    ],
  },
  {
    id: 'risk-scoring',
    title: 'Risk Scoring',
    description: 'Weighted factor analysis scores every change from LOW to CRITICAL based on file count, DB changes, shared code, and branch.',
    maturity: 'stable',
    icon: 'Gauge',
    details: [
      '0-15 composite score',
      'File count weighting',
      'Database migration detection',
      'Shared code impact analysis',
      'Main branch proximity factor',
    ],
  },
  {
    id: 'cli',
    title: 'CLI (11 Commands)',
    description: 'Full command-line interface for init, health checks, metrics, search, streaming, plugins, config, and data management.',
    maturity: 'stable',
    icon: 'Terminal',
    details: [
      'init, health, metrics',
      'memory search & list',
      'stream (live events)',
      'plugin management',
      'config, dashboard',
      'prune, export, import',
    ],
  },
  {
    id: 'observability',
    title: 'Observability Stack',
    description: 'Structured logging, health checks, circuit breakers, Prometheus metrics, and graceful shutdown — all built in.',
    maturity: 'stable',
    icon: 'Activity',
    details: [
      'Structured logger with trace IDs',
      'Readiness & liveness probes',
      'Circuit breaker (configurable backoff)',
      'Histogram metrics + Prometheus export',
      'Graceful shutdown manager',
    ],
  },
  {
    id: 'cross-session',
    title: 'Cross-Session Intelligence',
    description: 'Session summaries, pattern detection, and context recall so agents remember what happened last time.',
    maturity: 'beta',
    icon: 'Brain',
    details: [
      'SessionSummarizer: structured summaries',
      'PatternDetector: recurring pattern identification',
      'ContextRecaller: semantic search for prior context',
      'Confidence scoring for pattern matches',
    ],
  },
  {
    id: 'streaming',
    title: 'Streaming Dashboard',
    description: 'Real-time SSE/WebSocket event streaming with a single-file HTML monitoring dashboard.',
    maturity: 'beta',
    icon: 'Radio',
    details: [
      'Server-Sent Events (SSE)',
      'WebSocket transport',
      'In-process event bus',
      'Single-file HTML dashboard',
      'Backpressure management',
    ],
  },
  {
    id: 'handoff',
    title: 'Handoff Messages',
    description: 'Generates structured handoff prompts on context overflow for seamless session continuity.',
    maturity: 'beta',
    icon: 'ArrowRightLeft',
    details: [
      'Auto-trigger on high context usage',
      'Template system for custom messages',
      'Cross-session context preservation',
    ],
  },
  {
    id: 'plugins',
    title: 'Plugin System',
    description: 'Extensible architecture with manifest-based plugin discovery, hooks, and validation.',
    maturity: 'experimental',
    icon: 'Puzzle',
    details: [
      'Local directory scanning',
      '11-check validation',
      'Hook-based lifecycle (Pre/PostToolUse, SessionStart)',
      'Categories: monitor, integration, dashboard, auditor',
    ],
  },
  {
    id: 'coordination',
    title: 'Multi-Agent Coordination',
    description: 'Single-machine event-sourced coordination with atomic locks, leases, and task delegation.',
    maturity: 'experimental',
    icon: 'Users',
    details: [
      'Atomic locks (SQLite CAS)',
      'Lease manager with fencing tokens',
      'Agent registry & messaging',
      'Task delegation via TaskDelegator',
    ],
  },
];
