#!/usr/bin/env bash
set -euo pipefail
# [AgentSentry] Session End Checkpoint — thin wrapper around TypeScript implementation.
# Pipes stdin to the compiled TS hook and passes through exit code.
#
# Also runs the context-critical check (formerly a separate Stop hook).
# If context is critically full, this script exits 2 to block the agent.
#
# IMPORTANT: On the healthy path this script produces NO output and exits 0.
# Any stdout/stderr on exit 0 causes the harness to inject feedback text into
# the conversation, which triggers another assistant response, which triggers
# this Stop hook again — creating an infinite cycle.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_JS="$SCRIPT_DIR/../dist/src/cli/hooks/session-checkpoint.js"

# ── Session checkpoint (suppress output — non-critical) ─────────────────
if [[ -f "$HOOK_JS" ]]; then
    node "$HOOK_JS" >/dev/null 2>&1 || true
fi

# ── Context-critical check (inline from context-critical-stop.sh) ───────
CONFIG_FILE="$SCRIPT_DIR/../agent-sentry.config.json"
PREFIX="[AgentSentry]"

CTX_CRIT=$(jq -r '.context_health.context_percent_critical // 80' "$CONFIG_FILE" 2>/dev/null || echo 80)
MSG_CRIT=$(jq -r '.context_health.message_count_critical // 30' "$CONFIG_FILE" 2>/dev/null || echo 30)
MAX_TOKENS=${AGENT_SENTRY_MAX_TOKENS:-200000}

STATE_DIR="${TMPDIR:-/tmp}/agent-sentry"
STATE_FILE="$STATE_DIR/context-state"

# If no state file yet, context is fresh — allow silently
if [[ ! -f "$STATE_FILE" ]]; then
    exit 0
fi

MSG_COUNT=$(grep -oP '(?<=message_count=)\d+' "$STATE_FILE" 2>/dev/null || echo 0)

# Token estimation
TOTAL_CHARS=0
if git rev-parse --is-inside-work-tree &>/dev/null; then
    while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            CHARS=$(wc -c < "$file" 2>/dev/null | tr -d ' ')
            TOTAL_CHARS=$((TOTAL_CHARS + CHARS))
        fi
    done < <(git ls-files -z 2>/dev/null \
        | xargs -0 ls -1t 2>/dev/null \
        | head -50)
fi

CONVERSATION_TOKENS=$((MSG_COUNT * 500))
FILE_TOKENS=$((TOTAL_CHARS / 4))
ESTIMATED_TOKENS=$((FILE_TOKENS + CONVERSATION_TOKENS))

if [[ "$MAX_TOKENS" -gt 0 ]]; then
    CTX_PERCENT=$((ESTIMATED_TOKENS * 100 / MAX_TOKENS))
else
    CTX_PERCENT=0
fi
[[ "$CTX_PERCENT" -gt 100 ]] && CTX_PERCENT=100

# Block if context is critically full — this is the ONLY path that produces output
if [[ "$CTX_PERCENT" -ge "$CTX_CRIT" ]] || [[ "$MSG_COUNT" -ge "$MSG_CRIT" ]]; then
    echo "$PREFIX BLOCKED: Context critically full (~${CTX_PERCENT}%, ${MSG_COUNT} messages)."
    echo "$PREFIX ACTION REQUIRED: Run \`/agent-sentry:handoff\` to generate a handoff prompt before continuing."
    echo "$PREFIX This is a blocking directive — the session cannot proceed until a handoff is created."
    exit 2
fi

# Healthy — exit silently (NO output to avoid feedback loop)
exit 0
