# rtty-session.sh - Session Management Library for RTTY Remote
#
# SQLite-based session storage and replay functionality
#

SESSION_DB="${SESSION_DB:-/srv/rtty-remote/sessions.db}"

# Initialize session database
session_init_db() {
    mkdir -p "$(dirname "$SESSION_DB")" 2>/dev/null

    sqlite3 "$SESSION_DB" << 'EOF'
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,
    node_address TEXT,
    type TEXT NOT NULL,  -- 'terminal', 'rpc', 'replay'
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    duration INTEGER,
    bytes_sent INTEGER DEFAULT 0,
    bytes_recv INTEGER DEFAULT 0,
    commands TEXT,  -- JSON array of commands/calls
    label TEXT,
    metadata TEXT   -- JSON metadata
);

CREATE TABLE IF NOT EXISTS rpc_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    object TEXT NOT NULL,
    method TEXT NOT NULL,
    params TEXT,
    result TEXT,
    status_code INTEGER,
    executed_at INTEGER NOT NULL,
    duration_ms INTEGER,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_node ON sessions(node_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_rpc_log_session ON rpc_log(session_id);
EOF
}

# Start a new session
# $1 = node_id
# $2 = node_address
# $3 = type (terminal|rpc|replay)
session_start() {
    local node_id="$1"
    local node_address="$2"
    local type="${3:-rpc}"
    local now=$(date +%s)

    session_init_db

    sqlite3 "$SESSION_DB" "INSERT INTO sessions (node_id, node_address, type, started_at) VALUES ('$node_id', '$node_address', '$type', $now)"

    # Return session ID
    sqlite3 "$SESSION_DB" "SELECT last_insert_rowid()"
}

# End a session
# $1 = session_id
session_end() {
    local session_id="$1"
    local now=$(date +%s)

    sqlite3 "$SESSION_DB" "UPDATE sessions SET ended_at = $now, duration = $now - started_at WHERE id = $session_id"
}

# Log an RPC call
# $1 = session_id
# $2 = object
# $3 = method
# $4 = params (JSON)
# $5 = result (JSON)
# $6 = status_code
# $7 = duration_ms
session_log_rpc() {
    local session_id="$1"
    local object="$2"
    local method="$3"
    local params="$4"
    local result="$5"
    local status_code="${6:-0}"
    local duration_ms="${7:-0}"
    local now=$(date +%s)

    # Escape single quotes
    params=$(echo "$params" | sed "s/'/''/g")
    result=$(echo "$result" | sed "s/'/''/g")

    sqlite3 "$SESSION_DB" "INSERT INTO rpc_log (session_id, object, method, params, result, status_code, executed_at, duration_ms) VALUES ($session_id, '$object', '$method', '$params', '$result', $status_code, $now, $duration_ms)"
}

# List sessions
# $1 = node_id (optional filter)
# $2 = limit (default 50)
session_list() {
    local node_id="$1"
    local limit="${2:-50}"

    session_init_db

    local where=""
    [ -n "$node_id" ] && where="WHERE node_id = '$node_id'"

    sqlite3 -json "$SESSION_DB" "SELECT id, node_id, node_address, type, datetime(started_at, 'unixepoch') as started, duration, label FROM sessions $where ORDER BY started_at DESC LIMIT $limit"
}

# Get session details
# $1 = session_id
session_get() {
    local session_id="$1"

    session_init_db

    sqlite3 -json "$SESSION_DB" "SELECT * FROM sessions WHERE id = $session_id"
}

# Get RPC log for session
# $1 = session_id
session_get_rpc_log() {
    local session_id="$1"

    sqlite3 -json "$SESSION_DB" "SELECT * FROM rpc_log WHERE session_id = $session_id ORDER BY executed_at"
}

# Label a session
# $1 = session_id
# $2 = label
session_label() {
    local session_id="$1"
    local label="$2"

    sqlite3 "$SESSION_DB" "UPDATE sessions SET label = '$label' WHERE id = $session_id"
}

# Delete a session
# $1 = session_id
session_delete() {
    local session_id="$1"

    sqlite3 "$SESSION_DB" "DELETE FROM rpc_log WHERE session_id = $session_id"
    sqlite3 "$SESSION_DB" "DELETE FROM sessions WHERE id = $session_id"
}

# Export session to JSON
# $1 = session_id
session_export() {
    local session_id="$1"

    local session=$(session_get "$session_id")
    local rpc_log=$(session_get_rpc_log "$session_id")

    cat << EOF
{
    "session": $session,
    "rpc_log": $rpc_log
}
EOF
}

# Cleanup old sessions
# $1 = days (default 7)
session_cleanup() {
    local days="${1:-7}"
    local cutoff=$(($(date +%s) - (days * 86400)))

    sqlite3 "$SESSION_DB" "DELETE FROM rpc_log WHERE session_id IN (SELECT id FROM sessions WHERE ended_at < $cutoff AND label IS NULL)"
    sqlite3 "$SESSION_DB" "DELETE FROM sessions WHERE ended_at < $cutoff AND label IS NULL"
}

# Get session statistics
session_stats() {
    session_init_db

    local total=$(sqlite3 "$SESSION_DB" "SELECT COUNT(*) FROM sessions")
    local active=$(sqlite3 "$SESSION_DB" "SELECT COUNT(*) FROM sessions WHERE ended_at IS NULL")
    local rpc_calls=$(sqlite3 "$SESSION_DB" "SELECT COUNT(*) FROM rpc_log")
    local nodes=$(sqlite3 "$SESSION_DB" "SELECT COUNT(DISTINCT node_id) FROM sessions")

    cat << EOF
{
    "total_sessions": $total,
    "active_sessions": $active,
    "total_rpc_calls": $rpc_calls,
    "unique_nodes": $nodes
}
EOF
}
