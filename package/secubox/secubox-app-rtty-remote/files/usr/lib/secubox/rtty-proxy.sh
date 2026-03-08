# rtty-proxy.sh - RPCD Proxy Library for RTTY Remote
#
# Functions for proxying RPCD calls to remote SecuBox nodes
#

PROXY_CACHE_DIR="/tmp/rtty-remote/cache"

# Initialize proxy cache
proxy_init() {
    mkdir -p "$PROXY_CACHE_DIR" 2>/dev/null
}

# Execute remote RPCD call
# $1 = node address
# $2 = ubus object
# $3 = method
# $4 = params (JSON)
# $5 = auth token
proxy_rpc_call() {
    local addr="$1"
    local object="$2"
    local method="$3"
    local params="${4:-{}}"
    local token="${5:-00000000000000000000000000000000}"

    local rpc_id=$(date +%s%N | cut -c1-13)

    # Build JSON-RPC 2.0 request
    local request=$(cat << EOF
{
    "jsonrpc": "2.0",
    "id": $rpc_id,
    "method": "call",
    "params": ["$token", "$object", "$method", $params]
}
EOF
)

    # Execute request
    curl -s -m 30 \
        -H "Content-Type: application/json" \
        -d "$request" \
        "http://${addr}/ubus"
}

# List remote RPCD objects (with caching)
# $1 = node address
# $2 = auth token
proxy_list_objects() {
    local addr="$1"
    local token="${2:-00000000000000000000000000000000}"

    local cache_file="$PROXY_CACHE_DIR/objects_${addr//[.:]/_}"
    local cache_ttl=60

    # Check cache
    if [ -f "$cache_file" ]; then
        local mtime=$(stat -c %Y "$cache_file" 2>/dev/null || echo 0)
        local now=$(date +%s)
        if [ $((now - mtime)) -lt $cache_ttl ]; then
            cat "$cache_file"
            return 0
        fi
    fi

    # Fetch fresh list
    local request=$(cat << EOF
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "list",
    "params": ["$token", "*"]
}
EOF
)

    local response=$(curl -s -m 30 \
        -H "Content-Type: application/json" \
        -d "$request" \
        "http://${addr}/ubus")

    # Cache response
    echo "$response" > "$cache_file"
    echo "$response"
}

# Batch execute multiple RPCD calls
# $1 = node address
# $2 = auth token
# $3 = batch JSON array
proxy_batch_call() {
    local addr="$1"
    local token="$2"
    local batch="$3"

    local results="[]"
    local count=0

    echo "$batch" | jsonfilter -e '@[*]' 2>/dev/null | while read call; do
        local object=$(echo "$call" | jsonfilter -e '@.object')
        local method=$(echo "$call" | jsonfilter -e '@.method')
        local params=$(echo "$call" | jsonfilter -e '@.params')

        local result=$(proxy_rpc_call "$addr" "$object" "$method" "$params" "$token")
        count=$((count + 1))

        echo "$result"
    done
}

# Clear proxy cache
proxy_clear_cache() {
    rm -rf "$PROXY_CACHE_DIR"/* 2>/dev/null
}
