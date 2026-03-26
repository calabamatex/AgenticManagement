#!/usr/bin/env bash
# =============================================================================
# [AgentSentry] Shared State Manager
# =============================================================================
# Provides atomic read/write operations for hook state with flock-based locking.
# All hooks source this file to share a single state file, eliminating race
# conditions from concurrent hook execution.
#
# State is stored at: ${TMPDIR:-/tmp}/agent-sentry/context-state
# Lock file:          ${TMPDIR:-/tmp}/agent-sentry/context-state.lock
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/../lib/state-manager.sh"
#   state_read "message_count"        # -> prints value or "0"
#   state_write "message_count" "5"   # atomic update
#   state_increment "message_count"   # atomic increment, prints new value
#   state_get_last_fire_time          # epoch seconds of last stop-hook fire
#   state_set_last_fire_time          # set to now
# =============================================================================

STATE_DIR="${TMPDIR:-/tmp}/agent-sentry"
STATE_FILE="$STATE_DIR/context-state"
STATE_LOCK="$STATE_DIR/context-state.lock"

mkdir -p "$STATE_DIR"

# ---------------------------------------------------------------------------
# state_read KEY [DEFAULT]
# Read a key=value pair from the state file. Returns DEFAULT (or "0") if missing.
# ---------------------------------------------------------------------------
state_read() {
    local key="$1"
    local default="${2:-0}"

    if [[ ! -f "$STATE_FILE" ]]; then
        echo "$default"
        return 0
    fi

    local val
    val="$(grep -oP "(?<=^${key}=).+" "$STATE_FILE" 2>/dev/null | tail -1)" || true
    if [[ -z "$val" ]]; then
        echo "$default"
    else
        echo "$val"
    fi
}

# ---------------------------------------------------------------------------
# state_write KEY VALUE
# Atomically update (or add) a key=value pair in the state file.
# Uses flock + temp file + mv for crash safety.
# ---------------------------------------------------------------------------
state_write() {
    local key="$1"
    local value="$2"

    (
        flock -w 5 200 || { echo "[AgentSentry] WARN: Could not acquire state lock" >&2; return 1; }

        # Ensure state file exists
        if [[ ! -f "$STATE_FILE" ]]; then
            echo "${key}=${value}" > "$STATE_FILE"
            return 0
        fi

        local tmp_file="${STATE_FILE}.tmp.$$"

        if grep -q "^${key}=" "$STATE_FILE" 2>/dev/null; then
            # Replace existing key
            sed "s/^${key}=.*/${key}=${value}/" "$STATE_FILE" > "$tmp_file"
        else
            # Append new key
            cp "$STATE_FILE" "$tmp_file"
            echo "${key}=${value}" >> "$tmp_file"
        fi

        mv "$tmp_file" "$STATE_FILE"
    ) 200>"$STATE_LOCK"
}

# ---------------------------------------------------------------------------
# state_increment KEY
# Atomically increment a numeric key. Prints the new value.
# ---------------------------------------------------------------------------
state_increment() {
    local key="$1"
    local new_val

    (
        flock -w 5 200 || { echo "[AgentSentry] WARN: Could not acquire state lock" >&2; echo "0"; return 1; }

        # Ensure state file exists
        if [[ ! -f "$STATE_FILE" ]]; then
            echo "${key}=1" > "$STATE_FILE"
            echo "1"
            return 0
        fi

        local current
        current="$(grep -oP "(?<=^${key}=).+" "$STATE_FILE" 2>/dev/null | tail -1)" || true
        [[ -z "$current" ]] && current=0
        new_val=$((current + 1))

        local tmp_file="${STATE_FILE}.tmp.$$"

        if grep -q "^${key}=" "$STATE_FILE" 2>/dev/null; then
            sed "s/^${key}=.*/${key}=${new_val}/" "$STATE_FILE" > "$tmp_file"
        else
            cp "$STATE_FILE" "$tmp_file"
            echo "${key}=${new_val}" >> "$tmp_file"
        fi

        mv "$tmp_file" "$STATE_FILE"
        echo "$new_val"
    ) 200>"$STATE_LOCK"
}

# ---------------------------------------------------------------------------
# state_init
# Initialize the state file if it doesn't exist (idempotent).
# ---------------------------------------------------------------------------
state_init() {
    if [[ ! -f "$STATE_FILE" ]]; then
        (
            flock -w 5 200 || return 1
            if [[ ! -f "$STATE_FILE" ]]; then
                cat > "$STATE_FILE" <<EOF
message_count=0
session_id=$(date +%s)
last_stop_fire=0
EOF
            fi
        ) 200>"$STATE_LOCK"
    fi
}

# ---------------------------------------------------------------------------
# state_get_last_fire_time
# Returns the epoch timestamp of the last stop-hook firing.
# ---------------------------------------------------------------------------
state_get_last_fire_time() {
    state_read "last_stop_fire" "0"
}

# ---------------------------------------------------------------------------
# state_set_last_fire_time
# Sets the last stop-hook fire time to the current epoch.
# ---------------------------------------------------------------------------
state_set_last_fire_time() {
    state_write "last_stop_fire" "$(date +%s)"
}
