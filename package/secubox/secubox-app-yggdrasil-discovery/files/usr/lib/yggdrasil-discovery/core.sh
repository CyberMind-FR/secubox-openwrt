#!/bin/sh
# Yggdrasil Discovery Core Library

DISCOVERY_DIR="/var/lib/yggdrasil-discovery"
PEERS_CACHE="$DISCOVERY_DIR/peers.json"
ANNOUNCED_FILE="$DISCOVERY_DIR/announced.json"

# Initialize discovery storage
discovery_init() {
    mkdir -p "$DISCOVERY_DIR"
    [ -f "$PEERS_CACHE" ] || echo '[]' > "$PEERS_CACHE"
}

# Get local Yggdrasil IPv6
get_ygg_ipv6() {
    ip -6 addr show tun0 2>/dev/null | grep -oP '2[0-9a-f:]+(?=/)'
}

# Get local Yggdrasil public key
get_ygg_pubkey() {
    if command -v yggdrasilctl >/dev/null 2>&1; then
        yggdrasilctl -json getSelf 2>/dev/null | jsonfilter -e '@.key' 2>/dev/null
    fi
}

# Check if peer is trusted via master-link
is_peer_trusted() {
    local ml_fingerprint="$1"

    [ -z "$ml_fingerprint" ] && return 1

    # Check master-link approval
    if [ -f /usr/lib/secubox/master-link.sh ]; then
        . /usr/lib/secubox/master-link.sh
        ml_is_peer_approved "$ml_fingerprint" 2>/dev/null && return 0
    fi

    # Check ZKP verification
    if [ -f /var/lib/secubox-master-link/zkp-verified.json ]; then
        grep -q "\"$ml_fingerprint\"" /var/lib/secubox-master-link/zkp-verified.json 2>/dev/null && return 0
    fi

    # Check reputation score
    if [ -f /usr/lib/mirrornet/reputation.sh ]; then
        . /usr/lib/mirrornet/reputation.sh
        local score
        score=$(reputation_get_score "$ml_fingerprint" 2>/dev/null || echo 0)
        local min_trust
        min_trust=$(uci -q get yggdrasil-discovery.main.min_trust_score || echo 50)
        [ "$score" -ge "$min_trust" ] && return 0
    fi

    return 1
}

# Add peer to cache
add_peer_to_cache() {
    local ipv6="$1"
    local pubkey="$2"
    local hostname="$3"
    local ml_fingerprint="$4"
    local zkp_fingerprint="$5"
    local timestamp="$6"

    [ -z "$ipv6" ] && return 1

    local peer_json
    peer_json=$(cat <<EOF
{"ipv6":"$ipv6","pubkey":"$pubkey","hostname":"$hostname","ml_fingerprint":"$ml_fingerprint","zkp_fingerprint":"$zkp_fingerprint","timestamp":$timestamp}
EOF
)

    # Check if peer already exists (by IPv6)
    if grep -q "\"$ipv6\"" "$PEERS_CACHE" 2>/dev/null; then
        # Update existing peer
        local tmp_file="/tmp/peers_cache_$$.json"
        # Simple approach: remove old entry and add new
        grep -v "\"$ipv6\"" "$PEERS_CACHE" > "$tmp_file" 2>/dev/null || echo '[]' > "$tmp_file"

        if [ "$(cat "$tmp_file")" = "[]" ] || [ ! -s "$tmp_file" ]; then
            echo "[$peer_json]" > "$PEERS_CACHE"
        else
            # Remove trailing ] and add new entry
            sed 's/]$//' "$tmp_file" | sed 's/$/,/' > "$tmp_file.2"
            echo "$peer_json]" >> "$tmp_file.2"
            mv "$tmp_file.2" "$PEERS_CACHE"
        fi
        rm -f "$tmp_file" "$tmp_file.2"
    else
        # Add new peer
        if [ ! -f "$PEERS_CACHE" ] || [ "$(cat "$PEERS_CACHE" 2>/dev/null)" = "[]" ]; then
            echo "[$peer_json]" > "$PEERS_CACHE"
        else
            sed "s/]$/,$peer_json]/" "$PEERS_CACHE" > "$PEERS_CACHE.tmp"
            mv "$PEERS_CACHE.tmp" "$PEERS_CACHE"
        fi
    fi

    logger -t yggdrasil-discovery "Added/updated peer: $hostname ($ipv6)"
}

# Remove peer from cache
remove_peer_from_cache() {
    local ipv6="$1"

    [ -z "$ipv6" ] && return 1
    [ ! -f "$PEERS_CACHE" ] && return 0

    local tmp_file="/tmp/peers_cache_$$.json"
    grep -v "\"$ipv6\"" "$PEERS_CACHE" > "$tmp_file" 2>/dev/null

    # Ensure valid JSON array
    if [ ! -s "$tmp_file" ]; then
        echo '[]' > "$PEERS_CACHE"
    else
        mv "$tmp_file" "$PEERS_CACHE"
    fi

    rm -f "$tmp_file"
    logger -t yggdrasil-discovery "Removed peer: $ipv6"
}

# Get peer count
get_peer_count() {
    [ ! -f "$PEERS_CACHE" ] && echo 0 && return
    jsonfilter -i "$PEERS_CACHE" -e '@[*]' 2>/dev/null | wc -l
}

# Get trusted peer count
get_trusted_peer_count() {
    [ ! -f "$PEERS_CACHE" ] && echo 0 && return

    local count=0
    jsonfilter -i "$PEERS_CACHE" -e '@[*]' 2>/dev/null | while read -r peer; do
        local ml_fp
        ml_fp=$(echo "$peer" | jsonfilter -e '@.ml_fingerprint' 2>/dev/null)
        is_peer_trusted "$ml_fp" && count=$((count + 1))
    done
    echo "$count"
}

# Initialize
discovery_init
