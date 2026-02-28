#!/bin/sh
# Yggdrasil Discovery Gossip Handler
# Handles yggdrasil_peer messages from mirrornet gossip protocol

. /usr/lib/yggdrasil-discovery/core.sh

# Handle incoming yggdrasil_peer announcement
handle_peer_announce() {
    local data="$1"
    local origin="$2"

    # Parse announcement data
    local ipv6 pubkey hostname ml_fingerprint zkp_fingerprint timestamp

    ipv6=$(echo "$data" | jsonfilter -e '@.ipv6' 2>/dev/null)
    pubkey=$(echo "$data" | jsonfilter -e '@.pubkey' 2>/dev/null)
    hostname=$(echo "$data" | jsonfilter -e '@.hostname' 2>/dev/null)
    ml_fingerprint=$(echo "$data" | jsonfilter -e '@.ml_fingerprint' 2>/dev/null)
    zkp_fingerprint=$(echo "$data" | jsonfilter -e '@.zkp_fingerprint' 2>/dev/null)
    timestamp=$(echo "$data" | jsonfilter -e '@.timestamp' 2>/dev/null)

    # Validate IPv6 is in Yggdrasil range (200::/7)
    if ! echo "$ipv6" | grep -qE '^2[0-9a-f]{2}:'; then
        logger -t yggdrasil-discovery "Rejected: Invalid Yggdrasil IPv6: $ipv6"
        return 1
    fi

    # Don't add self
    local my_ipv6
    my_ipv6=$(get_ygg_ipv6)
    if [ "$ipv6" = "$my_ipv6" ]; then
        return 0
    fi

    # Add to peer cache
    add_peer_to_cache "$ipv6" "$pubkey" "$hostname" "$ml_fingerprint" "$zkp_fingerprint" "$timestamp"

    # Auto-peer if enabled and trusted
    local auto_peer
    auto_peer=$(uci -q get yggdrasil-discovery.main.auto_peer)

    if [ "$auto_peer" = "1" ]; then
        local require_trust
        require_trust=$(uci -q get yggdrasil-discovery.main.require_trust)

        local should_connect=0

        if [ "$require_trust" = "1" ]; then
            # Only connect if trusted
            if is_peer_trusted "$ml_fingerprint"; then
                should_connect=1
                logger -t yggdrasil-discovery "Auto-peering with trusted node: $hostname ($ipv6)"
            else
                logger -t yggdrasil-discovery "Skipping untrusted peer: $hostname ($ipv6)"
            fi
        else
            # Connect to all discovered peers
            should_connect=1
        fi

        if [ "$should_connect" = "1" ] && command -v yggdrasilctl >/dev/null 2>&1; then
            # Check if already connected
            local already_connected=0
            yggdrasilctl -json getPeers 2>/dev/null | grep -q "$ipv6" && already_connected=1

            if [ "$already_connected" = "0" ]; then
                # Try to connect
                yggdrasilctl addPeer "tcp://[$ipv6]:0" 2>/dev/null && {
                    logger -t yggdrasil-discovery "Connected to: $hostname ($ipv6)"
                } || {
                    logger -t yggdrasil-discovery "Failed to connect to: $hostname ($ipv6)"
                }
            fi
        fi
    fi

    return 0
}

# Handle peer departure (when a node goes offline)
handle_peer_departure() {
    local data="$1"
    local origin="$2"

    local ipv6
    ipv6=$(echo "$data" | jsonfilter -e '@.ipv6' 2>/dev/null)

    [ -z "$ipv6" ] && return 1

    remove_peer_from_cache "$ipv6"
    logger -t yggdrasil-discovery "Peer departed: $ipv6"
}

# Main handler entry point (called from gossip.sh)
handle() {
    local action="$1"
    local data="$2"
    local origin="$3"

    case "$action" in
        announce)
            handle_peer_announce "$data" "$origin"
            ;;
        departure)
            handle_peer_departure "$data" "$origin"
            ;;
        *)
            # Default to announce
            handle_peer_announce "$data" "$origin"
            ;;
    esac
}

# CLI entry point
case "${1:-}" in
    handle)
        shift
        handle "$@"
        ;;
    *)
        # Called with just data (from gossip.sh)
        handle "announce" "$1" "$2"
        ;;
esac
