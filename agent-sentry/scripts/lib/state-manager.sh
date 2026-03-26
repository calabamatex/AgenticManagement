#!/usr/bin/env bash
# [AgentSentry] Shared State Manager
# Single owner of all state files under $STATE_DIR. All hooks should source
# this library instead of reading/writing state files directly.
#
# Features:
#   - Atomic writes via temp-file + mv (no partial reads)
#   - Single source of truth for message count, session ID, timestamps
#   - Feedback-loop detection for stop hooks
#   - All runtime data stays in /tmp (never in the repo)

# Guard against double-sourcing
if [[ "${_AGENT_SENTRY_STATE_LOADED:-}" == "1" ]]; then
    return 0 2>/dev/null || true
fi
_AGENT_SENTRY_STATE_LOADED=1

readonly AS_STATE_DIR="${TMPDIR:-/tmp}/agent-sentry"
readonly AS_STATE_FILE="$AS_STATE_DIR/context-state"
readonly AS_LOCK_FILE="$AS_STATE_DIR/.state.lock"
readonly AS_STOP_HOOK_MARKER="$AS_STATE_DIR/.last-stop-hook-ts"

mkdir -p "$AS_STATE_DIR"

# -- Atomic file write --------------------------------------------------------
# Usage: as_atomic_write <file> <content>
as_atomic_write() {
    local file="$1" content="$2"
    local tmp="${file}.tmp.$$"
    printf '%s\n' "$content" > "$tmp"
    mv -f "$tmp" "$file"
}

# -- Locking (simple flock-based, with fallback) ------------------------------
as_lock() {
    if command -v flock &>/dev/null; then
        exec 9>"$AS_LOCK_FILE"
        flock -w 2 9 || true
    fi
}

as_unlock() {
    if command -v flock &>/dev/null; then
        flock -u 9 2>/dev/null || true
        exec 9>&- 2>/dev/null || true
    fi
}

# -- State read ---------------------------------------------------------------
# Reads a key from the state file. Usage: as_state_get <key> [default]
as_state_get() {
    local key="$1" default="${2:-}"
    if [[ -f "$AS_STATE_FILE" ]]; then
        local val
        val=$(grep -oP "(?<=${key}=).+" "$AS_STATE_FILE" 2>/dev/null | head -1) || true
        if [[ -n "$val" ]]; then
            echo "$val"
            return 0
        fi
    fi
    echo "$default"
}

# -- State write --------------------------------------------------------------
# Sets a key in the state file atomically. Usage: as_state_set <key> <value>
as_state_set() {
    local key="$1" value="$2"

    as_lock

    if [[ ! -f "$AS_STATE_FILE" ]]; then
        as_atomic_write "$AS_STATE_FILE" "${key}=${value}"
        as_unlock
        return 0
    fi

    local content
    content=$(cat "$AS_STATE_FILE" 2>/dev/null) || content=""

    if echo "$content" | grep -q "^${key}=" 2>/dev/null; then
        content=$(echo "$content" | sed "s/^${key}=.*/${key}=${value}/")
    else
        content="${content}
${key}=${value}"
    fi

    as_atomic_write "$AS_STATE_FILE" "$content"
    as_unlock
}

# -- Initialize session state -------------------------------------------------
as_init_state() {
    if [[ ! -f "$AS_STATE_FILE" ]]; then
        as_lock
        if [[ ! -f "$AS_STATE_FILE" ]]; then
            as_atomic_write "$AS_STATE_FILE" "message_count=0
session_id=$(date +%s)
stop_hook_count=0"
        fi
        as_unlock
    fi
}

# -- Message counter ----------------------------------------------------------
# Increments message_count and returns the new value.
# Usage: new_count=$(as_increment_messages)
as_increment_messages() {
    as_lock
    local count
    count=$(as_state_get "message_count" "0")
    count=$((count + 1))
    as_state_set "message_count" "$count"
    as_unlock
    echo "$count"
}

# -- Feedback loop detection --------------------------------------------------
# Returns 0 (true) if the stop hook fired less than 2 seconds ago,
# indicating a feedback loop where the stop hook's own output triggered
# another response which triggered the stop hook again.
as_is_feedback_loop() {
    if [[ ! -f "$AS_STOP_HOOK_MARKER" ]]; then
        return 1  # No prior stop hook run
    fi

    local last_ts now_ts diff
    last_ts=$(cat "$AS_STOP_HOOK_MARKER" 2>/dev/null) || last_ts=0
    now_ts=$(date +%s)
    diff=$((now_ts - last_ts))

    # If the stop hook ran less than 2 seconds ago, it's a feedback loop
    if [[ "$diff" -lt 2 ]]; then
        return 0  # true: is feedback loop
    fi
    return 1  # false: not a feedback loop
}

# Mark that the stop hook just ran (call at start of stop hooks)
as_mark_stop_hook() {
    as_atomic_write "$AS_STOP_HOOK_MARKER" "$(date +%s)"
}

# -- Token estimation ---------------------------------------------------------
# Estimates context usage percentage. Returns the percentage (0-100).
as_estimate_context_percent() {
    local max_tokens="${1:-200000}"
    local msg_count
    msg_count=$(as_state_get "message_count" "0")

    local total_chars=0
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        while IFS= read -r file; do
            if [[ -f "$file" ]]; then
                local chars
                chars=$(wc -c < "$file" 2>/dev/null | tr -d ' ')
                total_chars=$((total_chars + chars))
            fi
        done < <(git ls-files -z 2>/dev/null \
            | xargs -0 ls -1t 2>/dev/null \
            | head -50)
    fi

    local conversation_tokens=$((msg_count * 500))
    local file_tokens=$((total_chars / 4))
    local estimated_tokens=$((file_tokens + conversation_tokens))

    local ctx_percent=0
    if [[ "$max_tokens" -gt 0 ]]; then
        ctx_percent=$((estimated_tokens * 100 / max_tokens))
    fi

    if [[ "$ctx_percent" -gt 100 ]]; then
        ctx_percent=100
    fi

    echo "$ctx_percent"
}

# -- Runtime data directory ---------------------------------------------------
# Returns the persistent path for runtime data logs (~/.agent-sentry/data).
# Survives across sessions (unlike /tmp) and stays out of the repo.
readonly AS_RUNTIME_DATA_DIR="${HOME}/.agent-sentry/data"

as_runtime_data_dir() {
    mkdir -p "$AS_RUNTIME_DATA_DIR"
    echo "$AS_RUNTIME_DATA_DIR"
}
