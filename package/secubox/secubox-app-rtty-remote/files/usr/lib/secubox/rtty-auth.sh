# rtty-auth.sh - Authentication Library for RTTY Remote
#
# Integration with master-link for secure node authentication
#

AUTH_CACHE_DIR="/tmp/rtty-remote/auth"

# Initialize auth cache
auth_init() {
    mkdir -p "$AUTH_CACHE_DIR" 2>/dev/null
}

# Get or create session token for remote node
# $1 = node address
auth_get_token() {
    local addr="$1"
    local cache_file="$AUTH_CACHE_DIR/token_${addr//[.:]/_}"
    local ttl=3600

    # Check cache
    if [ -f "$cache_file" ]; then
        local data=$(cat "$cache_file")
        local ts=$(echo "$data" | cut -d: -f1)
        local token=$(echo "$data" | cut -d: -f2-)
        local now=$(date +%s)

        if [ $((now - ts)) -lt $ttl ]; then
            echo "$token"
            return 0
        fi
    fi

    # Try to authenticate
    local token=$(auth_login "$addr")

    if [ -n "$token" ]; then
        echo "$(date +%s):$token" > "$cache_file"
        echo "$token"
        return 0
    fi

    # Fallback to anonymous
    echo "00000000000000000000000000000000"
}

# Authenticate to remote node
# $1 = node address
auth_login() {
    local addr="$1"

    # Check if master-link is available
    if [ -f /usr/lib/secubox/master-link.sh ]; then
        . /usr/lib/secubox/master-link.sh

        # Get peer info
        local peer_info=$(ml_peer_list 2>/dev/null | jsonfilter -e "@.peers[?(@.address=='$addr')]" 2>/dev/null)

        if [ -n "$peer_info" ]; then
            local status=$(echo "$peer_info" | jsonfilter -e '@.status')
            if [ "$status" = "approved" ]; then
                # Use master-link token
                local ml_token=$(ml_token_generate 2>/dev/null | jsonfilter -e '@.token')
                if [ -n "$ml_token" ]; then
                    # Exchange master-link token for session
                    auth_exchange_ml_token "$addr" "$ml_token"
                    return $?
                fi
            fi
        fi
    fi

    # Try password-less login
    local request=$(cat << EOF
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "call",
    "params": ["00000000000000000000000000000000", "session", "login", {"username": "root", "password": ""}]
}
EOF
)

    local response=$(curl -s -m 10 \
        -H "Content-Type: application/json" \
        -d "$request" \
        "http://${addr}/ubus" 2>/dev/null)

    local token=$(echo "$response" | jsonfilter -e '@.result[1].ubus_rpc_session' 2>/dev/null)

    if [ -n "$token" ] && [ "$token" != "null" ]; then
        echo "$token"
        return 0
    fi

    return 1
}

# Exchange master-link token for session
# $1 = node address
# $2 = master-link token
auth_exchange_ml_token() {
    local addr="$1"
    local ml_token="$2"

    # TODO: Implement master-link token exchange endpoint on remote
    # For now, use standard login
    auth_login "$addr"
}

# Revoke authentication for node
# $1 = node address
auth_revoke() {
    local addr="$1"
    rm -f "$AUTH_CACHE_DIR/token_${addr//[.:]/_}" 2>/dev/null
}

# Clear all auth cache
auth_clear_all() {
    rm -rf "$AUTH_CACHE_DIR"/* 2>/dev/null
}

# Check if node is authenticated
# $1 = node address
auth_is_authenticated() {
    local addr="$1"
    local cache_file="$AUTH_CACHE_DIR/token_${addr//[.:]/_}"

    [ -f "$cache_file" ] && return 0
    return 1
}
