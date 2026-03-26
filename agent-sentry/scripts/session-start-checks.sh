#!/usr/bin/env bash
set -euo pipefail
# [AgentSentry] SessionStart hook — thin wrapper around TypeScript implementation.
# Pipes stdin to the compiled TS hook and passes through exit code.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_JS="$SCRIPT_DIR/../dist/src/cli/hooks/session-start.js"
DASHBOARD_DATA="$SCRIPT_DIR/../dashboard/data"
RUNTIME_DATA="${HOME}/.agent-sentry/data"

# Ensure runtime data directory exists and dashboard symlink points to it.
# Hooks write to ~/.agent-sentry/data; the dashboard reads via this symlink.
mkdir -p "$RUNTIME_DATA"
if [[ ! -L "$DASHBOARD_DATA" ]]; then
    rm -rf "$DASHBOARD_DATA"
    ln -s "$RUNTIME_DATA" "$DASHBOARD_DATA"
fi

if [[ -f "$HOOK_JS" ]]; then
    node "$HOOK_JS"
else
    echo "[AgentSentry] WARN: Compiled hook not found at $HOOK_JS -- run 'npm run build' first." >&2
fi

exit 0
