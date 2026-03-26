#!/usr/bin/env bash
# [AgentSentry] Context-Critical Stop Hook -- blocks agent when context is critically full.
#
# This runs as a Stop hook. When context usage exceeds the critical threshold,
# the script exits non-zero (exit 2) which blocks the agent from continuing
# until the user runs /agent-sentry:handoff to generate a handoff prompt.
#
# Claude Code Stop hooks:
#   exit 0 -> allow (agent continues)
#   exit 2 -> block with message (agent cannot continue until resolved)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../agent-sentry.config.json"
PREFIX="[AgentSentry]"

# Source shared state manager
source "$SCRIPT_DIR/lib/state-manager.sh"

# -- Feedback loop guard ------------------------------------------------------
# If this stop hook fired very recently (< 2s), we're in a feedback loop
# where our own output triggered another assistant response. Exit silently.
if as_is_feedback_loop; then
    exit 0
fi
as_mark_stop_hook

# -- Config -------------------------------------------------------------------
CTX_CRIT=$(jq -r '.context_health.context_percent_critical // 80' "$CONFIG_FILE" 2>/dev/null || echo 80)
MSG_CRIT=$(jq -r '.context_health.message_count_critical // 30' "$CONFIG_FILE" 2>/dev/null || echo 30)
MAX_TOKENS=${AGENT_SENTRY_MAX_TOKENS:-200000}

# -- State (single source of truth via state-manager) -------------------------
as_init_state
MSG_COUNT=$(as_increment_messages)

# -- Token estimation (delegated to state manager) ----------------------------
CTX_PERCENT=$(as_estimate_context_percent "$MAX_TOKENS")

# -- Decision -----------------------------------------------------------------
# Block if context is critically full OR message count exceeds critical threshold
if [[ "$CTX_PERCENT" -ge "$CTX_CRIT" ]] || [[ "$MSG_COUNT" -ge "$MSG_CRIT" ]]; then
    echo "$PREFIX BLOCKED: Context critically full (~${CTX_PERCENT}%, ${MSG_COUNT} messages)."
    echo "$PREFIX ACTION REQUIRED: Run \`/agent-sentry:handoff\` to generate a handoff prompt before continuing."
    echo "$PREFIX This is a blocking directive -- the session cannot proceed until a handoff is created."
    exit 2
fi

# Context is healthy -- allow
exit 0
