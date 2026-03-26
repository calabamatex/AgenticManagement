#!/usr/bin/env bash
set -euo pipefail
# [AgentSentry] SessionStart hook — sets up runtime data directory and
# delegates to TypeScript implementation if available.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_JS="$SCRIPT_DIR/../dist/src/cli/hooks/session-start.js"
DASHBOARD_DATA="$SCRIPT_DIR/../dashboard/data"
RUNTIME_DATA="$HOME/.agent-sentry/data"

# ── Runtime data setup ────────────────────────────────────────────────
# All hooks write runtime data (cost logs, lifecycle events, audit results)
# to ~/.agent-sentry/data/ to keep the repo clean. The dashboard reads
# data via a symlink at agent-sentry/dashboard/data/ -> ~/.agent-sentry/data/.
mkdir -p "$RUNTIME_DATA"

# Create symlink if dashboard/data doesn't exist or is not already a symlink
if [[ -L "$DASHBOARD_DATA" ]]; then
    # Already a symlink — verify it points to the right place
    current_target="$(readlink "$DASHBOARD_DATA" 2>/dev/null || true)"
    if [[ "$current_target" != "$RUNTIME_DATA" ]]; then
        rm "$DASHBOARD_DATA"
        ln -s "$RUNTIME_DATA" "$DASHBOARD_DATA"
    fi
elif [[ -d "$DASHBOARD_DATA" ]]; then
    # Real directory exists — migrate any existing data, then replace with symlink
    if [[ -n "$(ls -A "$DASHBOARD_DATA" 2>/dev/null)" ]]; then
        cp -n "$DASHBOARD_DATA"/* "$RUNTIME_DATA/" 2>/dev/null || true
    fi
    rm -rf "$DASHBOARD_DATA"
    ln -s "$RUNTIME_DATA" "$DASHBOARD_DATA"
else
    # Nothing exists — create symlink
    mkdir -p "$(dirname "$DASHBOARD_DATA")"
    ln -s "$RUNTIME_DATA" "$DASHBOARD_DATA"
fi

# ── Delegate to TS hook ───────────────────────────────────────────────
if [[ -f "$HOOK_JS" ]]; then
    node "$HOOK_JS"
else
    echo "[AgentSentry] WARN: Compiled hook not found at $HOOK_JS — run 'npm run build' first." >&2
fi

exit 0
