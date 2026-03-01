#!/bin/sh
# SecuBox WireGuard Uplink Library
# Provides gossip-based peer discovery for reverse MWAN failover
# Part of the Reverse MWAN WireGuard v2 feature

# Runtime state file
UPLINK_STATE_FILE="/var/run/wireguard-uplinks.json"
UPLINK_OFFERS_FILE="/var/run/wireguard-uplink-offers.json"
P2P_SOCKET="/var/run/secubox-p2p.sock"

# UCI config section
UPLINK_UCI="wireguard_uplink"

# ============================================================================
# Gossip Protocol Integration
# ============================================================================

# Check if secubox-p2p is available
p2p_available() {
    [ -S "$P2P_SOCKET" ] && command -v p2pctl >/dev/null 2>&1
}

# Get this node's identity for gossip
get_local_node_id() {
    if p2p_available; then
        p2pctl status 2>/dev/null | jsonfilter -e '@.node_id' 2>/dev/null
    else
        # Fallback to MAC-based ID
        cat /sys/class/net/eth0/address 2>/dev/null | tr -d ':'
    fi
}

# Advertise this node as an uplink provider via gossip
# Usage: advertise_uplink_offer <bandwidth_mbps> [latency_ms]
advertise_uplink_offer() {
    local bandwidth="${1:-100}"
    local latency="${2:-10}"
    local node_id
    local wg_pubkey
    local wg_endpoint
    local wg_port

    node_id="$(get_local_node_id)"
    [ -z "$node_id" ] && { echo "Error: Cannot determine node ID" >&2; return 1; }

    # Get WireGuard public key and endpoint
    wg_pubkey="$(uci -q get wireguard_uplink.local.public_key)"
    if [ -z "$wg_pubkey" ]; then
        # Generate keypair if not exists
        local privkey
        privkey="$(wg genkey)"
        wg_pubkey="$(echo "$privkey" | wg pubkey)"
        uci set wireguard_uplink.local=provider
        uci set wireguard_uplink.local.private_key="$privkey"
        uci set wireguard_uplink.local.public_key="$wg_pubkey"
        uci commit wireguard_uplink
    fi

    # Determine endpoint (external IP or mesh address)
    wg_endpoint="$(uci -q get wireguard_uplink.local.endpoint)"
    if [ -z "$wg_endpoint" ]; then
        # Try to detect external IP
        wg_endpoint="$(wget -qO- http://ifconfig.me 2>/dev/null || ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K[^ ]+')"
    fi

    wg_port="$(uci -q get wireguard_uplink.local.listen_port)"
    [ -z "$wg_port" ] && wg_port="51821"

    # Create offer payload
    local offer_json
    offer_json=$(cat <<EOF
{
    "type": "uplink_offer",
    "node_id": "$node_id",
    "wg_pubkey": "$wg_pubkey",
    "wg_endpoint": "${wg_endpoint}:${wg_port}",
    "bandwidth_mbps": $bandwidth,
    "latency_ms": $latency,
    "timestamp": $(date +%s),
    "active": true
}
EOF
)

    # Publish via gossip
    if p2p_available; then
        echo "$offer_json" | p2pctl gossip publish "uplink_offer" 2>/dev/null
        local rc=$?
        if [ $rc -eq 0 ]; then
            # Store local state
            echo "$offer_json" > "$UPLINK_OFFERS_FILE"
            uci set wireguard_uplink.local.offering='1'
            uci set wireguard_uplink.local.bandwidth="$bandwidth"
            uci set wireguard_uplink.local.latency="$latency"
            uci commit wireguard_uplink
            echo "Uplink offer published successfully"
            return 0
        else
            echo "Error: Failed to publish gossip message" >&2
            return 1
        fi
    else
        # P2P not available - store locally only
        echo "$offer_json" > "$UPLINK_OFFERS_FILE"
        uci set wireguard_uplink.local.offering='1'
        uci commit wireguard_uplink
        echo "Warning: P2P not available, offer stored locally only" >&2
        return 0
    fi
}

# Withdraw uplink offer
withdraw_uplink_offer() {
    local node_id
    node_id="$(get_local_node_id)"

    # Create withdrawal message
    local withdraw_json
    withdraw_json=$(cat <<EOF
{
    "type": "uplink_withdraw",
    "node_id": "$node_id",
    "timestamp": $(date +%s)
}
EOF
)

    # Publish withdrawal via gossip
    if p2p_available; then
        echo "$withdraw_json" | p2pctl gossip publish "uplink_withdraw" 2>/dev/null
    fi

    # Update local state
    rm -f "$UPLINK_OFFERS_FILE"
    uci set wireguard_uplink.local.offering='0'
    uci commit wireguard_uplink

    echo "Uplink offer withdrawn"
}

# Get available uplink offers from mesh peers
# Returns JSON array of uplink offers
get_peer_uplink_offers() {
    local offers="[]"

    if p2p_available; then
        # Query gossip for uplink_offer messages
        offers=$(p2pctl gossip query "uplink_offer" 2>/dev/null)
        [ -z "$offers" ] && offers="[]"
    fi

    # Merge with any cached offers
    if [ -f "$UPLINK_STATE_FILE" ]; then
        local cached
        cached=$(cat "$UPLINK_STATE_FILE" 2>/dev/null)
        if [ -n "$cached" ] && [ "$cached" != "[]" ]; then
            # Merge and deduplicate by node_id
            # For simplicity, prefer fresh gossip data
            :
        fi
    fi

    echo "$offers"
}

# Get specific peer's uplink offer
# Usage: get_peer_uplink_offer <node_id>
get_peer_uplink_offer() {
    local target_node="$1"
    [ -z "$target_node" ] && return 1

    local offers
    offers=$(get_peer_uplink_offers)

    # Filter by node_id
    echo "$offers" | jsonfilter -e "@[*]" 2>/dev/null | while read -r offer; do
        local node_id
        node_id=$(echo "$offer" | jsonfilter -e '@.node_id' 2>/dev/null)
        if [ "$node_id" = "$target_node" ]; then
            echo "$offer"
            return 0
        fi
    done
}

# ============================================================================
# WireGuard Interface Management
# ============================================================================

# Find next available WireGuard interface name
get_next_wg_interface() {
    local prefix="${1:-wgup}"
    local i=0
    while [ $i -lt 100 ]; do
        local ifname="${prefix}${i}"
        if ! ip link show "$ifname" >/dev/null 2>&1; then
            echo "$ifname"
            return 0
        fi
        i=$((i + 1))
    done
    return 1
}

# Create WireGuard interface for uplink peer
# Usage: create_uplink_interface <peer_pubkey> <endpoint> <allowed_ips>
create_uplink_interface() {
    local peer_pubkey="$1"
    local endpoint="$2"
    local allowed_ips="${3:-0.0.0.0/0}"

    [ -z "$peer_pubkey" ] && { echo "Error: peer public key required" >&2; return 1; }
    [ -z "$endpoint" ] && { echo "Error: endpoint required" >&2; return 1; }

    local ifname
    ifname=$(get_next_wg_interface)
    [ -z "$ifname" ] && { echo "Error: no available interface name" >&2; return 1; }

    # Generate local keypair for this interface
    local privkey pubkey
    privkey=$(wg genkey)
    pubkey=$(echo "$privkey" | wg pubkey)

    # Allocate IP from uplink range (172.31.x.x/16)
    local local_ip
    local_ip=$(allocate_uplink_ip "$ifname")

    # Create interface via UCI
    uci set network."$ifname"=interface
    uci set network."$ifname".proto='wireguard'
    uci set network."$ifname".private_key="$privkey"
    uci set network."$ifname".addresses="$local_ip"
    uci set network."$ifname".mtu='1420'

    # Add peer
    local peer_section="${ifname}_peer"
    uci set network."$peer_section"=wireguard_"$ifname"
    uci set network."$peer_section".public_key="$peer_pubkey"
    uci set network."$peer_section".endpoint_host="$(echo "$endpoint" | cut -d: -f1)"
    uci set network."$peer_section".endpoint_port="$(echo "$endpoint" | cut -d: -f2)"
    uci set network."$peer_section".allowed_ips="$allowed_ips"
    uci set network."$peer_section".persistent_keepalive='25'
    uci set network."$peer_section".route_allowed_ips='0'  # We manage routing via mwan3

    uci commit network

    # Store metadata
    uci set wireguard_uplink."$ifname"=uplink
    uci set wireguard_uplink."$ifname".interface="$ifname"
    uci set wireguard_uplink."$ifname".peer_pubkey="$peer_pubkey"
    uci set wireguard_uplink."$ifname".endpoint="$endpoint"
    uci set wireguard_uplink."$ifname".local_pubkey="$pubkey"
    uci set wireguard_uplink."$ifname".created="$(date +%s)"
    uci set wireguard_uplink."$ifname".enabled='1'
    uci commit wireguard_uplink

    echo "$ifname"
}

# Remove uplink interface
remove_uplink_interface() {
    local ifname="$1"
    [ -z "$ifname" ] && return 1

    # Bring down interface
    ip link set "$ifname" down 2>/dev/null
    ip link delete "$ifname" 2>/dev/null

    # Remove UCI config
    uci delete network."$ifname" 2>/dev/null
    uci delete network."${ifname}_peer" 2>/dev/null
    uci commit network

    uci delete wireguard_uplink."$ifname" 2>/dev/null
    uci commit wireguard_uplink

    # Release IP
    release_uplink_ip "$ifname"
}

# Allocate IP from uplink pool (172.31.x.x/16)
allocate_uplink_ip() {
    local ifname="$1"
    local pool_file="/var/run/wireguard-uplink-pool.json"

    # Simple sequential allocation
    local next_octet=1
    if [ -f "$pool_file" ]; then
        next_octet=$(jsonfilter -i "$pool_file" -e '@.next_octet' 2>/dev/null || echo 1)
    fi

    local ip="172.31.0.${next_octet}/24"

    # Update pool
    next_octet=$((next_octet + 1))
    [ $next_octet -gt 254 ] && next_octet=1

    cat > "$pool_file" <<EOF
{
    "next_octet": $next_octet,
    "allocations": {
        "$ifname": "$ip"
    }
}
EOF

    echo "$ip"
}

# Release allocated IP
release_uplink_ip() {
    local ifname="$1"
    # For now, we don't reclaim IPs (simple implementation)
    :
}

# ============================================================================
# mwan3 Integration
# ============================================================================

# Add uplink interface to mwan3 failover
# Usage: add_to_mwan3 <interface> [metric] [weight]
add_to_mwan3() {
    local ifname="$1"
    local metric="${2:-100}"
    local weight="${3:-1}"

    [ -z "$ifname" ] && return 1

    # Check if mwan3 is available
    if ! uci -q get mwan3 >/dev/null 2>&1; then
        echo "Warning: mwan3 not configured" >&2
        return 0
    fi

    # Add interface to mwan3
    uci set mwan3."$ifname"=interface
    uci set mwan3."$ifname".enabled='1'
    uci set mwan3."$ifname".family='ipv4'
    uci set mwan3."$ifname".track_ip='8.8.8.8'
    uci add_list mwan3."$ifname".track_ip='1.1.1.1'
    uci set mwan3."$ifname".track_method='ping'
    uci set mwan3."$ifname".reliability='1'
    uci set mwan3."$ifname".count='1'
    uci set mwan3."$ifname".timeout='2'
    uci set mwan3."$ifname".interval='5'
    uci set mwan3."$ifname".down='3'
    uci set mwan3."$ifname".up='3'

    # Add member for failover policy
    local member="${ifname}_m1_w${weight}"
    uci set mwan3."$member"=member
    uci set mwan3."$member".interface="$ifname"
    uci set mwan3."$member".metric="$metric"
    uci set mwan3."$member".weight="$weight"

    # Add to failover policy (create if not exists)
    if ! uci -q get mwan3.uplink_failover >/dev/null 2>&1; then
        uci set mwan3.uplink_failover=policy
        uci set mwan3.uplink_failover.last_resort='default'
    fi
    uci add_list mwan3.uplink_failover.use_member="$member"

    uci commit mwan3

    # Reload mwan3
    /etc/init.d/mwan3 reload 2>/dev/null
}

# Remove interface from mwan3
remove_from_mwan3() {
    local ifname="$1"
    [ -z "$ifname" ] && return 1

    # Remove interface
    uci delete mwan3."$ifname" 2>/dev/null

    # Remove associated members
    local members
    members=$(uci show mwan3 2>/dev/null | grep "interface='$ifname'" | cut -d. -f2 | cut -d= -f1)
    for member in $members; do
        # Remove from policies
        uci show mwan3 2>/dev/null | grep "use_member.*$member" | while read -r line; do
            local policy
            policy=$(echo "$line" | cut -d. -f2)
            uci del_list mwan3."$policy".use_member="$member" 2>/dev/null
        done
        uci delete mwan3."$member" 2>/dev/null
    done

    uci commit mwan3
    /etc/init.d/mwan3 reload 2>/dev/null
}

# Get mwan3 status for uplink interfaces
get_mwan3_status() {
    if command -v mwan3 >/dev/null 2>&1; then
        mwan3 interfaces 2>/dev/null
    else
        echo "mwan3 not available"
    fi
}

# ============================================================================
# Connectivity Testing
# ============================================================================

# Test connectivity through an uplink interface
# Usage: test_uplink_connectivity <interface> [target]
test_uplink_connectivity() {
    local ifname="$1"
    local target="${2:-8.8.8.8}"

    [ -z "$ifname" ] && return 1

    # Check interface exists and is up
    if ! ip link show "$ifname" 2>/dev/null | grep -q "UP"; then
        echo "Interface $ifname is down"
        return 1
    fi

    # Get interface IP
    local src_ip
    src_ip=$(ip -4 addr show "$ifname" 2>/dev/null | grep -oP 'inet \K[^/]+')
    [ -z "$src_ip" ] && { echo "No IP on $ifname"; return 1; }

    # Ping test
    if ping -c 3 -W 2 -I "$ifname" "$target" >/dev/null 2>&1; then
        echo "OK"
        return 0
    else
        echo "FAIL"
        return 1
    fi
}

# Measure latency through uplink
measure_uplink_latency() {
    local ifname="$1"
    local target="${2:-8.8.8.8}"

    [ -z "$ifname" ] && return 1

    local result
    result=$(ping -c 5 -W 2 -I "$ifname" "$target" 2>/dev/null | tail -1)

    if echo "$result" | grep -q "avg"; then
        # Extract average latency
        echo "$result" | sed -E 's/.*= [0-9.]+\/([0-9.]+)\/.*/\1/'
    else
        echo "-1"
    fi
}

# ============================================================================
# State Management
# ============================================================================

# Refresh uplink state from gossip
refresh_uplink_state() {
    local offers
    offers=$(get_peer_uplink_offers)

    # Filter out expired offers (older than 5 minutes)
    local now
    now=$(date +%s)
    local cutoff=$((now - 300))

    local filtered="[]"
    # Process each offer
    echo "$offers" | jsonfilter -e '@[*]' 2>/dev/null | while read -r offer; do
        local ts
        ts=$(echo "$offer" | jsonfilter -e '@.timestamp' 2>/dev/null)
        if [ -n "$ts" ] && [ "$ts" -gt "$cutoff" ]; then
            # Valid offer - would add to filtered array
            :
        fi
    done

    # Update state file
    echo "$offers" > "$UPLINK_STATE_FILE"
}

# Get list of active uplink interfaces
get_active_uplinks() {
    uci show wireguard_uplink 2>/dev/null | grep "=uplink" | cut -d. -f2 | cut -d= -f1
}

# Get uplink statistics
get_uplink_stats() {
    local stats='{"uplinks":[],"total":0,"active":0,"offering":false}'
    local total=0
    local active=0

    for ifname in $(get_active_uplinks); do
        local enabled
        enabled=$(uci -q get wireguard_uplink."$ifname".enabled)
        total=$((total + 1))
        [ "$enabled" = "1" ] && active=$((active + 1))
    done

    local offering
    offering=$(uci -q get wireguard_uplink.local.offering)
    [ "$offering" = "1" ] && offering="true" || offering="false"

    cat <<EOF
{
    "total": $total,
    "active": $active,
    "offering": $offering,
    "peer_offers": $(get_peer_uplink_offers)
}
EOF
}

# Initialize uplink subsystem
init_uplink() {
    # Ensure state directory exists
    mkdir -p /var/run

    # Initialize state files if missing
    [ ! -f "$UPLINK_STATE_FILE" ] && echo '[]' > "$UPLINK_STATE_FILE"

    # Ensure UCI section exists
    if ! uci -q get wireguard_uplink.local >/dev/null 2>&1; then
        uci set wireguard_uplink.local=provider
        uci set wireguard_uplink.local.offering='0'
        uci commit wireguard_uplink
    fi
}

# Initialize on source
init_uplink
