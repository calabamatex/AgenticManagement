#!/usr/bin/env bash
set -euo pipefail
# [AgentSentry] Session End Checkpoint — thin wrapper around TypeScript implementation.
# Pipes stdin to the compiled TS hook and passes through exit code.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_JS="$SCRIPT_DIR/../dist/src/cli/hooks/session-checkpoint.js"

if [[ -f "$HOOK_JS" ]]; then
    # Use a timeout to prevent the Node process from hanging indefinitely
    # (e.g., model downloads or database operations that stall).
    # The 10-second budget keeps us safely under any outer spawn timeout.
    if command -v timeout >/dev/null 2>&1; then
        timeout 5 node "$HOOK_JS" || true
    else
        node "$HOOK_JS" || true
    fi
else
    echo "[AgentSentry] WARN: Compiled hook not found at $HOOK_JS — run 'npm run build' first." >&2
fi

exit 0
