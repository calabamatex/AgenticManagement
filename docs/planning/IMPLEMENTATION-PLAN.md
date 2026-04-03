# AgentSentry for RuFlo — Implementation Plan

**Created:** March 19, 2026
**Source Spec:** AgentSentry-RuFlo-Spec.md v3.0
**Target Repo:** https://github.com/ruvnet/ruflo/tree/main

---

## Phase 1: Foundation (Week 1) — ~13h estimated

Priority: P0 — These are the minimum viable safety layer.

### 1.1 Secret Scanner (`agent-sentry/scripts/secret-scanner.sh`) — 3h
- Scan for standard patterns: `sk_live_*`, `sk_test_*`, `AKIA*`, `ghp_*`, `glpat-*`, JWT (`eyJ*`), private keys
- Scan for RuFlo-specific patterns: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `COHERE_API_KEY`, `OLLAMA_*` credentials, RuVector connection strings, MCP server tokens, ONNX auth tokens, Stripe keys
- Registered as `PreToolUse` hook matching `Write|Edit`
- Exits with code 2 (BLOCK) on detection
- Shows redacted match location and recommends `ruflo/.env.example` pattern

### 1.2 Git Hygiene Check (`agent-sentry/scripts/git-hygiene-check.sh`) — 2h
- `--pre-write` mode: checks git initialized, uncommitted change count, last commit age
- Blocks if no git repo (exit 2)
- Warns and auto-commits if >5 uncommitted files or >30 min since last commit
- Warns and auto-branches if on `main` with risk score >= 7
- Registered as `PreToolUse` hook matching `Write|Edit|Bash`

### 1.3 Session Start Validation (`agent-sentry/scripts/session-start-checks.sh`) — 2h
- Checks CLAUDE.md exists (critical if missing)
- Checks AGENTS.md exists (warn if missing)
- Checks for AgentSentry rules section in CLAUDE.md
- Warns if CLAUDE.md > 300 lines
- Validates required sections: security, error handling
- Checks git state (initialized, clean)
- Registered as `SessionStart` hook

### 1.4 CLAUDE.md AgentSentry Section Additions — 1h
- Append `## AgentSentry Management Rules` section to existing CLAUDE.md
- Subsections: Version Control, Context Health, Task Sizing, Error Handling, Security (Non-Negotiable), Swarm Safety
- Extend only — never replace existing content

### 1.5 AGENTS.md AgentSentry Section Additions — 1h
- Append `## AgentSentry Universal Rules (All Tools)` section
- Subsections: Before starting any task (4 steps), After completing any task (4 steps), Security, Error Handling
- Must be cross-tool compatible (no Claude-specific syntax)

### 1.6 Git Hooks (`.githooks/pre-commit`) — 2h
- Secret scanner on staged files (all LLM provider key patterns)
- PII logging check on staged TypeScript/JavaScript files
- Verify `.env` not being committed
- Verify `.claude/mcp.json` doesn't contain real tokens
- Check WASM build output isn't being committed
- Exit 1 to block commit if critical issues found
- Setup instruction: `git config core.hooksPath .githooks`

### 1.7 `/agentops check` Basic Command — 2h
- File: `.claude/commands/agent-sentry/check.md`
- Reports: git status, rules file status
- Basic output format (full version in Phase 2)

### Phase 1 Deliverables
```
agent-sentry/
├── scripts/
│   ├── secret-scanner.sh
│   ├── git-hygiene-check.sh
│   └── session-start-checks.sh
├── agentops.config.json
.githooks/
├── pre-commit
.claude/
├── commands/
│   └── agent-sentry/
│       ├── check.md
│       └── README.md
```
Plus modifications to: CLAUDE.md, AGENTS.md, .claude/settings.json

---

## Phase 2: Monitoring (Week 2) — ~20h estimated

Priority: P0-P1 — Real-time monitoring of context, task risk, and blast radius.

### 2.1 Context Estimator (`agent-sentry/scripts/context-estimator.sh`) — 3h
- Estimates token usage: user messages + agent responses + files read + CLAUDE.md + AGENTS.md + skill content
- Adds swarm overhead: `agent_count * ~2000 tokens` when swarm active
- Thresholds: 60% notify, 80% warn (standard); 50% warn (swarm active)
- Registered as `UserPromptSubmit` hook

### 2.2 Task Sizer (`agent-sentry/scripts/task-sizer.sh`) — 4h
- Implements full risk scoring model from spec §5.2
- Base scoring: file count estimate (1-5 points)
- Database changes: new tables (+2), modify existing (+4), delete/drop (+5)
- RuFlo multipliers: swarm/queen/topology (+3), consensus/raft/bft (+4), MCP (+3), SONA/EWC/MoE (+4), WASM/Rust (+3)
- General multipliers: auth/security (+4), refactor/rewrite (+4), "all"/"every"/"entire" (+3)
- Risk levels: LOW (1-3), MEDIUM (4-7), HIGH (8-12), CRITICAL (13+)
- Actions: auto-commit checkpoint at MEDIUM+, require decomposition at HIGH+, require branch + step-by-step approval at CRITICAL
- Registered as `UserPromptSubmit` hook

### 2.3 Swarm Blast Radius Monitor (`agent-sentry/scripts/swarm-blast-radius.sh`) — 4h
- Tracks each agent's file modifications separately during swarm deploys
- Computes `total_blast_radius` = union of all agent modifications
- Warns if total > 15 files, or single agent > 8 files
- Detects overlapping file modifications between agents (conflict warning)
- Registered as `PostToolUse` hook matching `Bash`

### 2.4 Post-Write Checks (`agent-sentry/scripts/post-write-checks.sh`) — 3h
- Error handling enforcer: scans for unhandled fetch/axios/MCP/RuVector/ONNX/LLM/consensus calls
- PII logging scanner: checks console.log/warn/error for email, password, card, SSN, phone
- RuFlo-specific: agent memory writes with PII, vector embeddings of PII, swarm message passing with unmasked data
- Blast radius tracking: increments files_modified counter, auto-commits at 8+ files
- Registered as `PostToolUse` hook matching `Write|Edit`

### 2.5 Message Count Tracker — 1h
- Part of context estimator
- Standard warning at 20 messages, critical at 30
- Lower thresholds when swarm is active

### 2.6 Session End Auto-Commit (`agent-sentry/scripts/session-checkpoint.sh`) — 2h
- Auto-commits uncommitted changes with `[agentops] session-end checkpoint`
- Updates WORKFLOW.md with session summary
- Updates CONTEXT.md with current state
- Registered as `Stop` hook

### 2.7 `/agentops check` Full Version — 3h
- Full dashboard output with all 6 status lines:
  - Save Points (last commit time, uncommitted files)
  - Context Health (capacity %, message count, degradation status)
  - Standing Orders (CLAUDE.md line count, violations this session)
  - Blast Radius (files modified, risk level)
  - Safety Checks (warnings count)
  - Swarm State (active/inactive, topology, agent count)

### Phase 2 Deliverables
```
agent-sentry/
├── scripts/
│   ├── context-estimator.sh
│   ├── task-sizer.sh
│   ├── swarm-blast-radius.sh
│   ├── post-write-checks.sh
│   └── session-checkpoint.sh
```
Plus updates to: .claude/settings.json (new hooks), .claude/commands/agent-sentry/check.md

---

## Phase 3: Scaffold System (Week 3) — ~16h estimated

Priority: P0-P1 — Document management for context continuity across sessions.

### 3.1 Scaffold Templates — 3h
- `agent-sentry/templates/PLANNING.md.template`: Pre-populated with RuFlo tech stack (TS, WASM, PG, SQLite, ONNX), architecture layers, swarm topologies, agent categories
- `agent-sentry/templates/TASKS.md.template`: Structured with feature areas from `.claude/commands/`, `.claude/skills/`, `ruflo/src/`
- `agent-sentry/templates/CONTEXT.md.template`: Branch, recent commits, swarm state, key decisions, known issues, "DO NOT CHANGE" section
- `agent-sentry/templates/WORKFLOW.md.template`: Session log format
- `agent-sentry/templates/rules-file-starter.md`: Starter rules for new projects
- `agent-sentry/templates/handoff-message.md`: RuFlo-specific handoff with swarm state fields

### 3.2 Scaffold Subagent (`agentops-scaffold`) — 4h
- File: `.claude/agents/agentops-scaffold.md`
- Model: sonnet, tools: Read/Write/Edit/Glob/Grep/Bash, maxTurns: 20
- On invocation: checks which scaffold docs exist, creates missing from templates, updates existing based on current state
- Cross-references TASKS.md against git log and file modifications
- Generates handoff message with swarm topology, queen agent state, memory system status

### 3.3 `/agentops scaffold` Command — 2h
- File: `.claude/commands/agent-sentry/scaffold.md`
- Invokes agentops-scaffold subagent
- Creates or updates PLANNING.md, TASKS.md, CONTEXT.md, WORKFLOW.md

### 3.4 Scaffold Validator (`agent-sentry/scripts/scaffold-validator.sh`) — 2h
- Validates scaffold docs exist and have required sections
- Checks freshness (updated within 7 days of last commit)
- Verifies CONTEXT.md has "Last Session" section

### 3.5 Handoff Message Generator — 2h
- Part of scaffold subagent
- Produces structured handoff including: project info, tech stack, branch/commit, done/next tasks, swarm state, key decisions, known issues, "DO NOT CHANGE" list, files to read first

### 3.6 Auto-Scaffold on Context Degradation — 3h
- Triggered when context estimator detects >80% usage
- Invokes scaffold subagent to update docs
- Generates handoff message and recommends fresh session

### Phase 3 Deliverables
```
agent-sentry/
├── templates/
│   ├── PLANNING.md.template
│   ├── TASKS.md.template
│   ├── CONTEXT.md.template
│   ├── WORKFLOW.md.template
│   ├── rules-file-starter.md
│   └── handoff-message.md
├── scripts/
│   └── scaffold-validator.sh
.claude/
├── agents/
│   └── agentops-scaffold.md
├── commands/
│   └── agent-sentry/
│       └── scaffold.md
PLANNING.md
TASKS.md
CONTEXT.md
WORKFLOW.md
```

---

## Phase 4: Deep Auditing (Week 4) — ~28h estimated

Priority: P0-P2 — Comprehensive security and compliance auditing.

### 4.1 Security Audit (`agent-sentry/scripts/security-audit.sh`) — 8h
Full RuFlo-adapted audit covering 7 areas:
1. **Secrets in code**: All TS/JS files, `.env.example` placeholders, `.env` in `.gitignore`, git history, `.claude/mcp.json`
2. **LLM provider security**: API keys as env vars, failover error messages don't expose keys, ONNX model files clean, cost routing doesn't log full responses
3. **MCP bridge security**: Authenticated channels, prompt injection prevention, AIDefence active, message passing doesn't expose internal state
4. **Swarm security**: Queen-to-worker auth, agent definitions immutable at runtime, consensus integrity checks, topology changes require approval
5. **Database security**: PostgreSQL SSL/TLS, RuVector access controls, SQLite WAL permissions, row-level security
6. **Input validation**: User-facing inputs, agent inputs before LLM calls, path traversal prevention, WASM kernel bounds checking
7. **Dependency audit**: `npm audit`, `cargo audit`, outdated dependencies with security patches

### 4.2 Error Handling Audit — 4h
- Scans all TS/JS files for unhandled external calls
- Covers: fetch, axios, database queries, MCP bridge calls, agent-to-agent messages, RuVector queries, ONNX inference, LLM provider calls, consensus protocol messages
- Checks for timeout configuration on LLM provider calls
- Reports coverage percentage (target: ≥80%)

### 4.3 Rules File Linter (`agent-sentry/scripts/rules-file-linter.sh`) — 3h
- CLAUDE.md checks: structure (Identity, Security, Error Handling, Swarm Safety), size (<300 lines), RuFlo coverage (MCP, swarm, agent, consensus, vector/memory), clarity (flag vague language)
- AGENTS.md checks: cross-tool compatibility (no Claude-specific syntax), consistency with CLAUDE.md security rules, size (<150 lines)
- Cross-file: no contradictions between CLAUDE.md and AGENTS.md

### 4.4 Agent Drift Detector (`agent-sentry/scripts/agent-drift-detector.sh`) — 4h
- Compares agent output against: original task description, TASKS.md scope, agent's defined role
- Flags: files modified outside scope, unrelated dependency installs, unauthorized agent definition changes, swarm topology/consensus parameter changes, MCP config modifications
- Hooks into RuFlo's hierarchical coordinator for drift signals
- Escalates after 2+ drift events

### 4.5 Scale Analysis Module — 5h
- Swarm scalability: topology vs. agent count, consensus algorithm appropriateness, message queue bounds
- Vector database: HNSW index size, query performance, RuVector configuration
- LLM cost optimization: MoE routing efficiency, WASM utilization, token caching effectiveness, projected monthly spend
- Database: PostgreSQL indexes, SQLite WAL mode, connection pooling
- Memory system: 8 memory types partitioned, ReasoningBank growth bounded, knowledge graph PageRank efficiency, EWC++ effectiveness
- Output: risk report prioritized by likelihood of failure at target scale

### 4.6 `/agentops audit` Full Report — 4h
- File: `.claude/commands/agent-sentry/audit.md`
- Runs all audit checks from all 5 skills
- Output grouped by severity (Critical → Warning → Advisory → Pass)
- Includes all RuFlo-specific checks

### Phase 4 Deliverables
```
agent-sentry/
├── scripts/
│   ├── security-audit.sh
│   ├── rules-file-linter.sh
│   └── agent-drift-detector.sh
.claude/
├── commands/
│   └── agent-sentry/
│       └── audit.md
```

---

## Phase 5: Hardening (Ongoing) — ~18h+ estimated

Priority: P1-P2 — Refinement, integration, and cross-tool parity.

### 5.1 Behavior Degradation Detector — 6h
- Tracks 6 degradation signals: instruction violations, file rewrites (marked complete in TASKS.md), repeated errors, contradictions, swarm drift, consensus failures
- Triggers at sum ≥ 3 signals
- Auto-updates scaffold docs and generates handoff message
- Integrates with RuFlo's anti-drift coordinator

### 5.2 Rules Violation Detector (Diff Comparison) — 5h
- Parses CLAUDE.md for prohibitions (NEVER, DO NOT, STOP, always)
- After each Write/Edit, checks diff against extracted rules
- Detects: hardcoded secrets, PII in logging, missing error handling on MCP calls, missing auth checks, unapproved dependencies

### 5.3 False Positive Tuning — Ongoing
- Tune swarm blast radius thresholds based on real usage
- Adjust risk scoring weights
- Refine secret scanner patterns to reduce noise

### 5.4 Codex CLI Sync Automation — 3h
- When CLAUDE.md or AGENTS.md is updated, extract universal rules
- Update `.agents/skills/agent-sentry/SKILL.md` with equivalent instructions
- Maintain parity between `.claude/` and `.agents/` configurations

### 5.5 Integration Tests with Existing Skills — 4h
- Test composition with `hooks-automation`, `verification-quality`, `v3-security-overhaul`, `performance-analysis`
- Verify AgentSentry hooks don't conflict with existing RuFlo hooks
- Validate that existing monitoring commands still work alongside AgentSentry

### Phase 5 Deliverables
```
.agents/
├── skills/
│   └── agent-sentry/
│       └── SKILL.md
```
Plus refinements to all existing scripts and hooks.

---

## Phase 6: Dashboard (Weeks 5-6) — ~33h estimated

Priority: P0-P2 — Visual monitoring interface.

### 6.1 Dashboard HTML Shell — 4h
- Single self-contained HTML file (`agent-sentry/dashboard/agentops-dashboard.html`)
- Zero dependencies: inline CSS + vanilla JS
- CSS custom properties for theming, CSS Grid for responsive layout
- Sidebar navigation between pages
- Open via `file://` or `npx serve agent-sentry/dashboard`

### 6.2 Overview Page — 4h
- Overall health score (0-100) as ring gauge (inline SVG)
- 5 KPI cards: commits today, context usage %, blast radius (files), violations count, last scan time
- Skills health panel: 5 skills with score bars and status
- Recent events log (chronological feed from all hooks)
- Trend charts: commit frequency and health score over 7/30 days
- Time range selector: 24h / 7d / 30d

### 6.3 Hook Data Writers — 4h
- All scripts output NDJSON to `agent-sentry/dashboard/data/` files
- Files: session-log.json, audit-results.json, health-history.json, commit-history.json, swarm-state.json
- Each hook appends to the appropriate file (see spec §10.5 mapping)

### 6.4 Skill Detail Pages (5 pages) — 6h
1. **Save Points**: last commit time, current branch, auto-saves count, commit timeline, uncommitted files warning
2. **Context Health**: context usage gauge, message count, degradation signals, scaffold doc freshness
3. **Standing Orders**: CLAUDE.md/AGENTS.md line counts, section coverage matrix, violation history, linter results
4. **Small Bets**: current risk score with level, blast radius gauge, median commit size, task size distribution
5. **Safety Checks**: secrets blocked count, error handling coverage %, PII warnings, security audit results

### 6.5 Audit Report Page — 3h
- Sortable table: check name, severity, detail
- Summary cards at top: counts per severity level
- Reads `audit-results.json`

### 6.6 Trends Page — 4h
- Overall health score over 30 days (line/bar chart)
- Violations per week by type
- Commit frequency trend over 30 days
- Most violated rules table with improvement/decline arrows
- Reads `health-history.json`

### 6.7 RuFlo Swarm Agents Page — 5h
- KPI cards: active agent count (of 60+), queen status/type, consensus algorithm, drift events, memory usage %
- Active agent roster table: name, type, status, files modified, current task, drift status
- ASCII swarm topology visualization
- Memory system table: 8 memory types with health and entry counts
- Reads `swarm-state.json`

### 6.8 Auto-Refresh and Live Data Loading — 3h
- `fetch()` on configurable interval (default: 30 seconds)
- Reads all JSON data files on load and on refresh
- No server required for local file access

### Phase 6 Deliverables
```
agent-sentry/
├── dashboard/
│   ├── agentops-dashboard.html
│   ├── data/
│   │   ├── session-log.json
│   │   ├── audit-results.json
│   │   ├── health-history.json
│   │   ├── commit-history.json
│   │   └── swarm-state.json
│   └── README.md
```

---

## Advanced Features (Post-Launch)

These are defined in the spec (§14-20) but are not part of the core 6-phase rollout. They can be prioritized after the core system is stable.

### A. Distributed Tracing (§14)
- OpenTelemetry AI Agent Semantic Convention
- Trace ID propagation across agent boundaries
- Span logging per agent action with token/cost attribution
- Dashboard Trace Viewer page with waterfall visualization
- Files: `agent-sentry/tracing/trace-context.ts`, `span-logger.ts`, `traces.json`

### B. Agent Identity & Permissions (§15)
- 3-layer model: Agent Identity Registry → Runtime Permission Enforcement → Delegation Scope Narrowing
- Per-agent YAML permissions: file read/write/deny, tool allow/deny, bash allow/deny
- PreToolUse hook validates every tool call against agent permissions
- Queen-to-worker delegation tokens narrow scope
- Files: permission schema in agent YAMLs, `permission-enforcer.sh`, audit trail

### C. Cost Management & Token Budgeting (§16)
- Hierarchical budgets: monthly ($500) → session ($10) → per-agent
- Per-agent token metering with provider/model/cost tracking
- Budget enforcement: warn at 80%, downgrade model at 100%, halt non-essential at session budget exceeded
- Cost-aware routing integration with RuFlo's MoE
- Files: budget config in `agentops.config.json`, `cost-tracker.sh`, `cost-log.json`

### D. Agent Lifecycle Management (§17)
- State machine: CREATED → ACTIVE → AWAITING → COMPLETED/FAILED/CANCELLED
- Graceful shutdown protocol (finish current tool call, save progress, commit checkpoint, return partial results, clean up)
- Timeout enforcement for auto-cancel
- Files: `lifecycle-manager.sh`, `lifecycle.json`

### E. Multi-Provider Orchestration Awareness (§18)
- Per-provider tracking: availability %, latency p50/p95/p99, error rate by type, cost per 1K tokens, rate limit headroom
- Failover audit trail: every provider switch logged with reason and cost difference
- Files: `provider-health.sh`, failover events in `session-log.json`

### F. Testing & Evaluation Framework (§19)
- Tier 1: Golden datasets per module (YAML test cases with fixtures and expected results)
- Tier 2: Regression suite (production bugs become test cases, blocks merge on regressions)
- Tier 3: Behavioral benchmarks (periodic full-system tests)
- Files: `agent-sentry/evals/` directory, `run-evals.sh`, CI integration

### G. Compliance & Immutable Audit Trail (§20)
- EU AI Act compliance (Article 12 — fully enforceable August 2, 2026)
- Every agent action produces an immutable record with SHA-256 hash chain
- Fields: eventId, traceId, actor, delegatedBy, originalUser, action, target, permissionCheck, status, tokens, cost, riskScore
- Append-only, tamper-evident log

---

## Configuration Reference

All thresholds are configurable in `agent-sentry/agentops.config.json`:

| Section | Key Settings |
|---|---|
| `save_points` | auto_commit_after_minutes: 30, max_uncommitted_files_warning: 5, swarm_pre/post_commit: true |
| `context_health` | message_count_warning: 20, context_percent_warning: 60/80, swarm_context_percent_warning: 50 |
| `rules_file` | claude_md_max_lines: 300, agents_md_max_lines: 150, required_sections: [security, error handling, swarm safety] |
| `task_sizing` | medium: 4, high: 8, critical: 13, max_files_per_task: 5/8, swarm_max_total_files: 15 |
| `security` | block_on_secret_detection: true, scan_git_history: false, scan_mcp_config: true |
| `ruflo_integration` | compose_with_hooks_automation/verification_quality/security_overhaul: true, drift_detection_threshold: 2 |
| `notifications` | verbose: false, suppress_advisory: false, prefix: "[AgentSentry]" |

---

## Severity Levels

| Severity | Behavior | Example |
|---|---|---|
| **Critical** | Blocks action (exit 2). Requires resolution. | Hardcoded LLM API key |
| **Warning** | Takes preventive action + notifies. | Auto-commit before swarm deploy |
| **Advisory** | Notifies with recommendation. No action. | CONTEXT.md slightly stale |

---

## Success Metrics

| Metric | Target |
|---|---|
| Reverts per session | < 1 |
| Commit frequency | Every 20-30 min active work |
| Swarm checkpoint compliance | 100% pre/post commits |
| Security audit pass rate | 100% critical, >90% warning |
| Scaffold freshness | Updated within 24h of last session |
| Blast radius per task | ≤ 5 files median (single), ≤ 15 (swarm) |
| Drift events per swarm | < 2 |
| Secret exposure incidents | 0 |
| Context restarts per session | ≤ 1 |
