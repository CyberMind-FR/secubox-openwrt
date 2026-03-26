#!/bin/sh
# SecuBox Mesh Peer Discovery
# mDNS-based service discovery for mesh peers
# CyberMind — SecuBox — 2026

PEERS_FILE="/var/lib/secubox-mesh/peers.json"
DISCOVERY_CACHE="/tmp/secubox_discovery_cache"
MDNS_SERVICE="_secubox._udp"

# Initialize discovery
discovery_init() {
    mkdir -p "$(dirname "$PEERS_FILE")"
    [ -f "$PEERS_FILE" ] || echo '[]' > "$PEERS_FILE"
}

# Scan for peers using mDNS
discovery_scan_mdns() {
    local peers=""

    # Try umdns-client first
    if command -v umdns >/dev/null 2>&1; then
        # Query umdns for _secubox._udp services
        local services
        services=$(ubus call umdns browse 2>/dev/null | jsonfilter -e '@.services[*]' 2>/dev/null)

        echo "$services" | while IFS= read -r svc; do
            local name addr port txt_did txt_role
            name=$(echo "$svc" | jsonfilter -e '@.name' 2>/dev/null)
            addr=$(echo "$svc" | jsonfilter -e '@.address' 2>/dev/null)
            port=$(echo "$svc" | jsonfilter -e '@.port' 2>/dev/null)

            # Parse TXT records
            txt_did=$(echo "$svc" | jsonfilter -e '@.txt[*]' 2>/dev/null | grep "^did=" | cut -d= -f2)
            txt_role=$(echo "$svc" | jsonfilter -e '@.txt[*]' 2>/dev/null | grep "^role=" | cut -d= -f2)

            [ -n "$txt_did" ] && echo "$txt_did|$addr|${txt_role:-edge}|$port"
        done
    fi

    # Try avahi-browse as fallback
    if command -v avahi-browse >/dev/null 2>&1; then
        avahi-browse -rpt "$MDNS_SERVICE.local" 2>/dev/null | \
        grep "^=" | while IFS=';' read -r _ _ _ name _ _ addr port txt; do
            local did role
            did=$(echo "$txt" | grep -o 'did=[^"]*' | cut -d= -f2 | tr -d '"')
            role=$(echo "$txt" | grep -o 'role=[^"]*' | cut -d= -f2 | tr -d '"')
            [ -n "$did" ] && echo "$did|$addr|${role:-edge}|$port"
        done
    fi
}

# Scan for peers using WireGuard peer list
discovery_scan_wireguard() {
    local wg_interface="${1:-wg0}"

    if command -v wg >/dev/null 2>&1; then
        wg show "$wg_interface" endpoints 2>/dev/null | while read -r pubkey endpoint; do
            [ -z "$endpoint" ] || [ "$endpoint" = "(none)" ] && continue

            local addr port
            addr=$(echo "$endpoint" | cut -d: -f1)
            port=$(echo "$endpoint" | cut -d: -f2)

            # Generate DID from public key
            local did
            did="did:plc:$(echo -n "$pubkey" | md5sum | cut -c1-16)"

            echo "$did|$addr|peer|$port"
        done
    fi
}

# Scan for peers using ARP/neighbor discovery
discovery_scan_arp() {
    # Look for SecuBox nodes on local network via known ports
    local secubox_port=7331  # P2P API port

    ip neigh show 2>/dev/null | grep -v FAILED | while read -r ip _ _ mac _; do
        [ -z "$ip" ] && continue

        # Quick check if SecuBox P2P API is responding
        local response
        response=$(timeout 1 wget -qO- "http://$ip:$secubox_port/api/status" 2>/dev/null)

        if [ -n "$response" ]; then
            local did role
            did=$(echo "$response" | jsonfilter -e '@.did' 2>/dev/null)
            role=$(echo "$response" | jsonfilter -e '@.role' 2>/dev/null || echo "edge")

            [ -n "$did" ] && echo "$did|$ip|$role|$secubox_port"
        fi
    done
}

# Scan for peers using configured peer list
discovery_scan_config() {
    # Read static peers from UCI config
    config_load secubox
    config_foreach _scan_config_peer peer
}

_scan_config_peer() {
    local section="$1"
    local did addr role port

    config_get did "$section" did ""
    config_get addr "$section" address ""
    config_get role "$section" role "edge"
    config_get port "$section" port "51820"

    [ -n "$did" ] && [ -n "$addr" ] && echo "$did|$addr|$role|$port"
}

# Combined peer discovery
discovery_scan_peers() {
    local tmp_peers="/tmp/secubox_peers_$$.txt"
    local seen_dids=""

    # Combine all discovery methods
    {
        discovery_scan_mdns
        discovery_scan_wireguard
        discovery_scan_arp
        discovery_scan_config
    } | sort -u > "$tmp_peers"

    # Build peers JSON
    local peers_json='['
    local first=1
    local my_did="${NODE_DID:-$(cat /var/lib/mirrornet/identity/did.txt 2>/dev/null)}"

    while IFS='|' read -r did addr role port; do
        [ -z "$did" ] && continue

        # Skip self
        [ "$did" = "$my_did" ] && continue

        # Skip duplicates
        echo "$seen_dids" | grep -q "$did" && continue
        seen_dids="$seen_dids $did"

        [ "$first" = "1" ] || peers_json="$peers_json,"

        local last_seen
        last_seen=$(date -Iseconds)

        peers_json="$peers_json{\"did\":\"$did\",\"address\":\"$addr\",\"role\":\"$role\",\"port\":$port,\"last_seen\":\"$last_seen\"}"
        first=0
    done < "$tmp_peers"

    peers_json="$peers_json]"

    # Save to peers file
    echo "$peers_json" > "$PEERS_FILE"

    rm -f "$tmp_peers"
}

# Get peer count
discovery_get_peer_count() {
    jsonfilter -i "$PEERS_FILE" -e '@[*]' 2>/dev/null | wc -l
}

# Get peer by DID
discovery_get_peer() {
    local did="$1"
    jsonfilter -i "$PEERS_FILE" -e "@[did=\"$did\"]" 2>/dev/null
}

# Get all peers
discovery_get_peers() {
    cat "$PEERS_FILE" 2>/dev/null || echo '[]'
}

# Check peer connectivity
discovery_check_peer() {
    local did="$1"
    local addr

    addr=$(discovery_get_peer "$did" | jsonfilter -e '@.address' 2>/dev/null)
    [ -z "$addr" ] && return 1

    # Try ping
    ping -c 1 -W 1 "$addr" >/dev/null 2>&1
}

# Refresh peer status
discovery_refresh_peer() {
    local did="$1"
    local peer_json

    peer_json=$(discovery_get_peer "$did")
    [ -z "$peer_json" ] && return 1

    local addr port
    addr=$(echo "$peer_json" | jsonfilter -e '@.address' 2>/dev/null)
    port=$(echo "$peer_json" | jsonfilter -e '@.port' 2>/dev/null || echo "7331")

    # Query peer's status API
    local response
    response=$(timeout 2 wget -qO- "http://$addr:$port/api/status" 2>/dev/null)

    if [ -n "$response" ]; then
        # Update peer info
        local new_role
        new_role=$(echo "$response" | jsonfilter -e '@.role' 2>/dev/null)
        [ -n "$new_role" ] && logger -t secubox-mesh "Peer $did role updated: $new_role"
        return 0
    fi

    return 1
}

# Initialize on source
discovery_init
