#!/usr/bin/env bash
# [AgentSentry] Context Usage Estimator -- UserPromptSubmit hook
# Estimates context window usage and message count, warns when thresholds
# are approached or exceeded. See AgentSentry-Product-Spec.md S3.2.1.
# Exit 0 always (advisory only, never blocks prompt submission).

set -euo pipefail

# Consume stdin (hook input) so the pipe doesn't break
cat > /dev/null 2>&1 || true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../agent-sentry.config.json"
PREFIX="[AgentSentry]"

# Source shared state manager (single owner of state files)
source "$SCRIPT_DIR/lib/state-manager.sh"

# -- Config -------------------------------------------------------------------
CTX_WARN=$(jq -r '.context_health.context_percent_warning // 60' "$CONFIG_FILE" 2>/dev/null || echo 60)
CTX_CRIT=$(jq -r '.context_health.context_percent_critical // 80' "$CONFIG_FILE" 2>/dev/null || echo 80)
MSG_WARN=$(jq -r '.context_health.message_count_warning // 20' "$CONFIG_FILE" 2>/dev/null || echo 20)
MSG_CRIT=$(jq -r '.context_health.message_count_critical // 30' "$CONFIG_FILE" 2>/dev/null || echo 30)
MAX_TOKENS=${AGENT_SENTRY_MAX_TOKENS:-200000}

# -- State (single source of truth via state-manager) -------------------------
as_init_state
MSG_COUNT=$(as_increment_messages)

# -- Token estimation (delegated to state manager) ----------------------------
CTX_PERCENT=$(as_estimate_context_percent "$MAX_TOKENS")

# -- Notifications ------------------------------------------------------------
NOTIFICATIONS=()

# Context percentage checks
if [[ "$CTX_PERCENT" -ge "$CTX_CRIT" ]]; then
    NOTIFICATIONS+=("$PREFIX WARN: Context critically full (~${CTX_PERCENT}%). Early instructions being lost.")
    NOTIFICATIONS+=("$PREFIX RECOMMEND: Start fresh session using handoff message.")
    NOTIFICATIONS+=("$PREFIX ACTION: Run \`agent_sentry_generate_handoff\` MCP tool or \`/agent-sentry:handoff\` to auto-generate a handoff prompt.")
elif [[ "$CTX_PERCENT" -ge "$CTX_WARN" ]]; then
    NOTIFICATIONS+=("$PREFIX NOTIFY: Context at ~${CTX_PERCENT}%. Consider wrapping up current task.")
fi

# Message count checks
if [[ "$MSG_COUNT" -ge "$MSG_CRIT" ]]; then
    NOTIFICATIONS+=("$PREFIX WARN: Message count ($MSG_COUNT) has reached critical threshold ($MSG_CRIT). Context degradation likely.")
elif [[ "$MSG_COUNT" -ge "$MSG_WARN" ]]; then
    NOTIFICATIONS+=("$PREFIX NOTIFY: Message count ($MSG_COUNT) approaching limit (warning: $MSG_WARN, critical: $MSG_CRIT).")
fi

# Only print if there are notifications (keep hook quiet when healthy)
if [[ ${#NOTIFICATIONS[@]} -gt 0 ]]; then
    for note in "${NOTIFICATIONS[@]}"; do
        echo "$note"
    done
fi

# Hook must never block
exit 0
