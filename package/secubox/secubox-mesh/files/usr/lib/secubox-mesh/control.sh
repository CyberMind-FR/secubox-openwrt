#!/bin/sh
# SecuBox Mesh Control Socket Handler
# Handles commands received via Unix control socket
# CyberMind — SecuBox — 2026

# Control socket helpers

# Parse JSON-RPC style command
control_parse_command() {
    local input="$1"

    # Simple command (just method name)
    if ! echo "$input" | grep -q '{'; then
        echo "$input"
        return
    fi

    # JSON-RPC format: {"method":"...", "params":{...}}
    local method
    method=$(echo "$input" | jsonfilter -e '@.method' 2>/dev/null)
    echo "$method"
}

# Get command parameters
control_get_params() {
    local input="$1"
    echo "$input" | jsonfilter -e '@.params' 2>/dev/null || echo '{}'
}

# Format JSON response
control_response() {
    local result="$1"
    local id="${2:-null}"

    cat <<EOF
{"jsonrpc":"2.0","result":$result,"id":$id}
EOF
}

# Format JSON error
control_error() {
    local code="$1"
    local message="$2"
    local id="${3:-null}"

    cat <<EOF
{"jsonrpc":"2.0","error":{"code":$code,"message":"$message"},"id":$id}
EOF
}

# Validate command authorization (placeholder for future auth)
control_authorize() {
    local cmd="$1"
    local client="$2"

    # All commands allowed for now (socket access = authorized)
    return 0
}

# Log control socket activity
control_log() {
    local level="$1"
    local msg="$2"

    logger -t secuboxd-control -p "daemon.$level" "$msg"
}

# Rate limiting (simple token bucket)
RATE_LIMIT_FILE="/tmp/secuboxd_rate_limit"
RATE_LIMIT_MAX=100  # Max requests per minute
RATE_LIMIT_WINDOW=60

control_check_rate_limit() {
    local client="$1"
    local current_time
    current_time=$(date +%s)

    if [ ! -f "$RATE_LIMIT_FILE" ]; then
        echo "$current_time:1" > "$RATE_LIMIT_FILE"
        return 0
    fi

    local last_time last_count
    IFS=':' read -r last_time last_count < "$RATE_LIMIT_FILE"

    local elapsed=$((current_time - last_time))

    if [ "$elapsed" -ge "$RATE_LIMIT_WINDOW" ]; then
        # Reset window
        echo "$current_time:1" > "$RATE_LIMIT_FILE"
        return 0
    fi

    if [ "$last_count" -ge "$RATE_LIMIT_MAX" ]; then
        control_log "warn" "Rate limit exceeded for $client"
        return 1
    fi

    echo "$last_time:$((last_count + 1))" > "$RATE_LIMIT_FILE"
    return 0
}

# Available commands and their handlers
control_list_commands() {
    cat <<EOF
{
  "commands": [
    {"method": "ping", "description": "Check daemon is alive"},
    {"method": "mesh.status", "description": "Get mesh status"},
    {"method": "mesh.peers", "description": "List connected peers"},
    {"method": "mesh.topology", "description": "Get mesh topology graph"},
    {"method": "mesh.nodes", "description": "List all known nodes"},
    {"method": "node.info", "description": "Get this node's information"},
    {"method": "node.rotate", "description": "Rotate node keys"},
    {"method": "telemetry.latest", "description": "Get latest telemetry"}
  ]
}
EOF
}

# Health check for socket server
control_health_check() {
    local socket="$1"

    if [ ! -S "$socket" ]; then
        return 1
    fi

    # Try sending ping
    local response
    response=$(echo "ping" | timeout 2 socat - "UNIX-CONNECT:$socket" 2>/dev/null)

    if echo "$response" | grep -q '"pong":true'; then
        return 0
    fi

    return 1
}
