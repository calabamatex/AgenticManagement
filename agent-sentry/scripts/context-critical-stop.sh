#!/usr/bin/env bash
# [AgentSentry] Context-Critical Stop Hook — blocks agent when context is critically full.
#
# This runs as a Stop hook. When context usage exceeds the critical threshold,
# the script exits non-zero (exit 2) which blocks the agent from continuing
# until the user runs /agent-sentry:handoff to generate a handoff prompt.
#
# Claude Code Stop hooks:
#   exit 0 → allow (agent continues)
#   exit 2 → block with message (agent cannot continue until resolved)
#
# Uses shared state-manager for atomic state access.
# Includes feedback-loop guard: if this hook fired <2s ago, exit silently.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../agent-sentry.config.json"
PREFIX="[AgentSentry]"

# Source shared state manager
source "$SCRIPT_DIR/lib/state-manager.sh"

# ── Feedback Loop Guard ──────────────────────────────────────────────────
# If this stop hook fired less than 2 seconds ago, exit silently to
# prevent feedback loops where the hook's own output triggers re-firing.
LAST_FIRE="$(state_get_last_fire_time)"
NOW_EPOCH="$(date +%s)"
if [[ "$((NOW_EPOCH - LAST_FIRE))" -lt 2 ]]; then
    exit 0
fi
state_set_last_fire_time

# ── Config ────────────────────────────────────────────────────────────
CTX_CRIT=$(jq -r '.context_health.context_percent_critical // 80' "$CONFIG_FILE" 2>/dev/null || echo 80)
MSG_CRIT=$(jq -r '.context_health.message_count_critical // 30' "$CONFIG_FILE" 2>/dev/null || echo 30)
MAX_TOKENS=${AGENT_SENTRY_MAX_TOKENS:-200000}

# ── Session State (read-only — context-estimator.sh owns the counter) ──
state_init
MSG_COUNT="$(state_read "message_count" "0")"

# If no messages yet, context is fresh — allow
if [[ "$MSG_COUNT" -eq 0 ]]; then
    exit 0
fi

# ── Token Estimation (same logic as context-estimator.sh) ─────────────
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

if [[ "$CTX_PERCENT" -gt 100 ]]; then
    CTX_PERCENT=100
fi

# ── Decision ──────────────────────────────────────────────────────────
# Block if context is critically full OR message count exceeds critical threshold
if [[ "$CTX_PERCENT" -ge "$CTX_CRIT" ]] || [[ "$MSG_COUNT" -ge "$MSG_CRIT" ]]; then
    echo "$PREFIX BLOCKED: Context critically full (~${CTX_PERCENT}%, ${MSG_COUNT} messages)."
    echo "$PREFIX ACTION REQUIRED: Run \`/agent-sentry:handoff\` to generate a handoff prompt before continuing."
    echo "$PREFIX This is a blocking directive — the session cannot proceed until a handoff is created."
    exit 2
fi

# Context is healthy — allow
exit 0
