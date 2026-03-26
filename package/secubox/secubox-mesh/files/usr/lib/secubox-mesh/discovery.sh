#!/bin/sh
# SecuBox Mesh Peer Discovery
# Multi-method service discovery for mesh peers and network devices
# CyberMind — SecuBox — 2026

PEERS_FILE="/var/lib/secubox-mesh/peers.json"
DEVICES_FILE="/var/lib/secubox-mesh/devices.json"
DISCOVERY_CACHE="/tmp/secubox_discovery_cache"
MDNS_SERVICE="_secubox._udp"
DISCOVERY_TIMEOUT=2

# Well-known SecuBox/service ports for fingerprinting
PORT_SECUBOX_API=7331
PORT_SECUBOX_P2P=7332
PORT_WIREGUARD=51820
PORT_HTTP=80
PORT_HTTPS=443
PORT_SSH=22
PORT_NETDATA=19999
PORT_MITMPROXY=8080
PORT_CROWDSEC=6060

# Initialize discovery
discovery_init() {
    mkdir -p "$(dirname "$PEERS_FILE")"
    mkdir -p "$(dirname "$DEVICES_FILE")"
    [ -f "$PEERS_FILE" ] || echo '[]' > "$PEERS_FILE"
    [ -f "$DEVICES_FILE" ] || echo '[]' > "$DEVICES_FILE"
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

# Check if port is open (fast, non-blocking)
_check_port() {
    local host="$1"
    local port="$2"

    # Use netcat if available (most reliable)
    if command -v nc >/dev/null 2>&1; then
        nc -z -w 1 "$host" "$port" 2>/dev/null
        return $?
    fi

    # Fallback: try wget
    wget -q -T 1 -O /dev/null "http://$host:$port/" 2>/dev/null
    [ $? -eq 0 ] || [ $? -eq 8 ]  # 8 = server error (port open)
}

# Scan subnet range for SecuBox peers (active discovery)
discovery_scan_subnet() {
    local subnet="${1:-}"

    # Auto-detect subnet from br-lan if not provided
    if [ -z "$subnet" ]; then
        local lan_ip
        lan_ip=$(ip -4 addr show br-lan 2>/dev/null | grep -o 'inet [0-9.]*' | cut -d' ' -f2)
        [ -z "$lan_ip" ] && lan_ip=$(ip -4 addr show eth0 2>/dev/null | grep -o 'inet [0-9.]*' | cut -d' ' -f2)
        [ -z "$lan_ip" ] && return

        # Extract network base (assume /24)
        subnet=$(echo "$lan_ip" | cut -d. -f1-3)
    fi

    # Extract base if full CIDR given
    local base
    base=$(echo "$subnet" | cut -d/ -f1 | cut -d. -f1-3)

    local my_ips
    my_ips=$(ip -4 addr show 2>/dev/null | grep -o 'inet [0-9.]*' | cut -d' ' -f2 | tr '\n' ' ')

    # Scan common SecuBox port across subnet
    local i=1
    while [ $i -lt 255 ]; do
        local target="${base}.${i}"

        # Skip self
        echo "$my_ips" | grep -q "$target " && { i=$((i+1)); continue; }

        # Quick port check
        if _check_port "$target" "$PORT_SECUBOX_API" 2>/dev/null; then
            local response
            response=$(wget -q -T 1 -O- "http://$target:$PORT_SECUBOX_API/api/status" 2>/dev/null)

            if [ -n "$response" ]; then
                local did role
                did=$(echo "$response" | jsonfilter -e '@.did' 2>/dev/null)
                role=$(echo "$response" | jsonfilter -e '@.role' 2>/dev/null)
                [ -n "$did" ] && echo "$did|$target|${role:-edge}|$PORT_SECUBOX_API"
            fi
        fi

        i=$((i+1))
    done
}

# Scan for Docker containers
discovery_scan_docker() {
    local docker_sock="/var/run/docker.sock"

    [ -S "$docker_sock" ] || return

    # List running containers via Unix socket
    local containers
    if command -v curl >/dev/null 2>&1; then
        containers=$(curl -s --unix-socket "$docker_sock" "http://localhost/containers/json" 2>/dev/null)
    else
        return
    fi

    [ -z "$containers" ] && return

    # Parse each container
    echo "$containers" | jsonfilter -e '@[*].Id' 2>/dev/null | while read -r full_id; do
        [ -z "$full_id" ] && continue

        local id name state ip
        id=$(echo "$full_id" | cut -c1-12)

        # Get container details
        local info
        info=$(curl -s --unix-socket "$docker_sock" "http://localhost/containers/$id/json" 2>/dev/null)

        name=$(echo "$info" | jsonfilter -e '@.Name' 2>/dev/null | tr -d '/')
        state=$(echo "$info" | jsonfilter -e '@.State.Running' 2>/dev/null)
        ip=$(echo "$info" | jsonfilter -e '@.NetworkSettings.IPAddress' 2>/dev/null)

        # Try bridge network if no IP
        [ -z "$ip" ] && ip=$(echo "$info" | jsonfilter -e '@.NetworkSettings.Networks.bridge.IPAddress' 2>/dev/null)

        [ -z "$ip" ] && continue
        [ "$state" != "true" ] && continue

        # Generate DID from container ID
        local did="did:container:docker:$id"

        # Check if it's a SecuBox container
        if _check_port "$ip" "$PORT_SECUBOX_API" 2>/dev/null; then
            local response
            response=$(wget -q -T 1 -O- "http://$ip:$PORT_SECUBOX_API/api/status" 2>/dev/null)

            if [ -n "$response" ]; then
                local real_did role
                real_did=$(echo "$response" | jsonfilter -e '@.did' 2>/dev/null)
                role=$(echo "$response" | jsonfilter -e '@.role' 2>/dev/null)
                echo "${real_did:-$did}|$ip|${role:-container}|$PORT_SECUBOX_API|docker:$name"
            else
                echo "$did|$ip|container|0|docker:$name"
            fi
        else
            echo "$did|$ip|container|0|docker:$name"
        fi
    done
}

# Scan for LXC containers
discovery_scan_lxc() {
    # Check for lxc-ls command
    if command -v lxc-ls >/dev/null 2>&1; then
        lxc-ls --running 2>/dev/null | while read -r container; do
            [ -z "$container" ] && continue

            # Get container IP
            local ip
            ip=$(lxc-info -n "$container" -iH 2>/dev/null | head -1)

            [ -z "$ip" ] && continue

            local did="did:container:lxc:$container"

            # Check if it's a SecuBox container
            if _check_port "$ip" "$PORT_SECUBOX_API" 2>/dev/null; then
                local response
                response=$(wget -q -T 1 -O- "http://$ip:$PORT_SECUBOX_API/api/status" 2>/dev/null)

                if [ -n "$response" ]; then
                    local real_did role
                    real_did=$(echo "$response" | jsonfilter -e '@.did' 2>/dev/null)
                    role=$(echo "$response" | jsonfilter -e '@.role' 2>/dev/null)
                    echo "${real_did:-$did}|$ip|${role:-container}|$PORT_SECUBOX_API|lxc:$container"
                else
                    echo "$did|$ip|container|0|lxc:$container"
                fi
            else
                echo "$did|$ip|container|0|lxc:$container"
            fi
        done
    fi

    # Check for Proxmox pct command
    if command -v pct >/dev/null 2>&1; then
        pct list 2>/dev/null | tail -n +2 | while read -r vmid status _ name _; do
            [ "$status" != "running" ] && continue

            # Get container IP via config
            local ip
            ip=$(pct config "$vmid" 2>/dev/null | grep -o 'ip=[0-9.]*' | head -1 | cut -d= -f2)

            [ -z "$ip" ] && continue

            local did="did:container:pve:$vmid"

            if _check_port "$ip" "$PORT_SECUBOX_API" 2>/dev/null; then
                local response
                response=$(wget -q -T 1 -O- "http://$ip:$PORT_SECUBOX_API/api/status" 2>/dev/null)

                if [ -n "$response" ]; then
                    local real_did role
                    real_did=$(echo "$response" | jsonfilter -e '@.did' 2>/dev/null)
                    role=$(echo "$response" | jsonfilter -e '@.role' 2>/dev/null)
                    echo "${real_did:-$did}|$ip|${role:-container}|$PORT_SECUBOX_API|pve:$name"
                else
                    echo "$did|$ip|container|0|pve:$name"
                fi
            else
                echo "$did|$ip|container|0|pve:$name"
            fi
        done
    fi
}

# Scan for libvirt/KVM virtual machines
discovery_scan_libvirt() {
    command -v virsh >/dev/null 2>&1 || return

    virsh list --name 2>/dev/null | while read -r vm; do
        [ -z "$vm" ] && continue

        # Get VM IP from guest agent or ARP
        local ip=""

        # Try qemu-guest-agent
        ip=$(virsh domifaddr "$vm" --source agent 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)

        # Fallback to ARP inspection via MAC
        if [ -z "$ip" ]; then
            local mac
            mac=$(virsh domiflist "$vm" 2>/dev/null | awk 'NR>2 && $5 != "" {print $5}' | head -1)
            [ -n "$mac" ] && ip=$(ip neigh show 2>/dev/null | grep -i "$mac" | awk '{print $1}' | head -1)
        fi

        [ -z "$ip" ] && continue

        local did="did:vm:libvirt:$vm"

        if _check_port "$ip" "$PORT_SECUBOX_API" 2>/dev/null; then
            local response
            response=$(wget -q -T 1 -O- "http://$ip:$PORT_SECUBOX_API/api/status" 2>/dev/null)

            if [ -n "$response" ]; then
                local real_did role
                real_did=$(echo "$response" | jsonfilter -e '@.did' 2>/dev/null)
                role=$(echo "$response" | jsonfilter -e '@.role' 2>/dev/null)
                echo "${real_did:-$did}|$ip|${role:-vm}|$PORT_SECUBOX_API|libvirt:$vm"
            else
                echo "$did|$ip|vm|0|libvirt:$vm"
            fi
        else
            echo "$did|$ip|vm|0|libvirt:$vm"
        fi
    done
}

# Fingerprint network device by open ports (quick check)
discovery_fingerprint_device() {
    local ip="$1"
    local services=""

    # Quick port checks - prioritize common ports
    _check_port "$ip" "$PORT_SSH" && services="${services}ssh,"
    _check_port "$ip" "$PORT_HTTP" && services="${services}http,"
    _check_port "$ip" "$PORT_HTTPS" && services="${services}https,"
    _check_port "$ip" "$PORT_MITMPROXY" && services="${services}mitmproxy,"

    echo "${services%,}"
}

# Scan all network neighbors for any device (not just SecuBox)
discovery_scan_all_devices() {
    local tmp_devices="/tmp/secubox_devices_$$.txt"

    # Get all neighbors from ARP
    # Format: IP dev INTERFACE lladdr MAC STATE
    ip neigh show 2>/dev/null | grep -v FAILED | grep lladdr | while read -r line; do
        local ip mac state

        # Parse: "192.168.1.1 dev br-lan lladdr aa:bb:cc:dd:ee:ff REACHABLE"
        ip=$(echo "$line" | awk '{print $1}')
        mac=$(echo "$line" | awk '{print $5}')
        state=$(echo "$line" | awk '{for(i=6;i<=NF;i++) printf $i" "; print ""}' | xargs)

        [ -z "$ip" ] && continue
        [ -z "$mac" ] && continue

        # Skip multicast/broadcast MACs
        echo "$mac" | grep -qi "^ff:" && continue
        echo "$mac" | grep -qi "^01:" && continue

        local device_type="unknown"
        local hostname=""
        local services=""

        # Try reverse DNS (quick timeout)
        hostname=$(nslookup "$ip" 2>/dev/null | grep "name =" | awk '{print $NF}' | sed 's/\.$//' | head -1)

        # Check if it's a SecuBox peer
        if _check_port "$ip" "$PORT_SECUBOX_API" 2>/dev/null; then
            device_type="secubox"
            services="secubox-api"
        else
            # Fingerprint by services (skip fingerprinting for IPv6 to be faster)
            if ! echo "$ip" | grep -q ":"; then
                services=$(discovery_fingerprint_device "$ip")
                [ -n "$services" ] && device_type="server"
            fi
        fi

        # Generate device ID from MAC
        local device_id
        device_id=$(echo -n "$mac" | md5sum | cut -c1-12)

        echo "$device_id|$ip|$mac|$device_type|$hostname|$services|$state"
    done > "$tmp_devices"

    # Build devices JSON
    local devices_json='['
    local first=1

    while IFS='|' read -r id ip mac dtype hostname services state; do
        [ -z "$id" ] && continue

        [ "$first" = "1" ] || devices_json="$devices_json,"

        local last_seen
        last_seen=$(date -Iseconds)

        devices_json="$devices_json{\"id\":\"$id\",\"ip\":\"$ip\",\"mac\":\"$mac\",\"type\":\"$dtype\",\"hostname\":\"${hostname:-}\",\"services\":\"${services:-}\",\"state\":\"$state\",\"last_seen\":\"$last_seen\"}"
        first=0
    done < "$tmp_devices"

    devices_json="$devices_json]"

    echo "$devices_json" > "$DEVICES_FILE"
    rm -f "$tmp_devices"
}

# Get all discovered devices
discovery_get_devices() {
    cat "$DEVICES_FILE" 2>/dev/null || echo '[]'
}

# Get device count
discovery_get_device_count() {
    jsonfilter -i "$DEVICES_FILE" -e '@[*]' 2>/dev/null | wc -l
}

# Combined peer discovery (SecuBox nodes + containers + VMs)
discovery_scan_peers() {
    local tmp_peers="/tmp/secubox_peers_$$.txt"
    local seen_dids=""

    # Combine all discovery methods
    {
        # Standard discovery methods
        discovery_scan_mdns
        discovery_scan_wireguard
        discovery_scan_arp
        discovery_scan_config

        # Container/VM discovery (run if commands exist)
        discovery_scan_docker 2>/dev/null
        discovery_scan_lxc 2>/dev/null
        discovery_scan_libvirt 2>/dev/null
    } | sort -u > "$tmp_peers"

    # Build peers JSON
    local peers_json='['
    local first=1
    local my_did="${NODE_DID:-$(cat /var/lib/mirrornet/identity/did.txt 2>/dev/null)}"

    while IFS='|' read -r did addr role port source; do
        [ -z "$did" ] && continue

        # Skip self
        [ "$did" = "$my_did" ] && continue

        # Skip duplicates
        echo "$seen_dids" | grep -q "$did" && continue
        seen_dids="$seen_dids $did"

        [ "$first" = "1" ] || peers_json="$peers_json,"

        local last_seen
        last_seen=$(date -Iseconds)

        # Include source if available (docker:name, lxc:name, etc.)
        local source_field=""
        [ -n "$source" ] && source_field=",\"source\":\"$source\""

        peers_json="$peers_json{\"did\":\"$did\",\"address\":\"$addr\",\"role\":\"$role\",\"port\":${port:-0}$source_field,\"last_seen\":\"$last_seen\"}"
        first=0
    done < "$tmp_peers"

    peers_json="$peers_json]"

    # Save to peers file
    echo "$peers_json" > "$PEERS_FILE"

    rm -f "$tmp_peers"

    # Also run full device discovery in background
    discovery_scan_all_devices &
}

# Full discovery scan (includes subnet scan - slower)
discovery_scan_full() {
    local tmp_peers="/tmp/secubox_peers_full_$$.txt"

    # Run all methods including slow subnet scan
    {
        discovery_scan_mdns
        discovery_scan_wireguard
        discovery_scan_arp
        discovery_scan_config
        discovery_scan_docker 2>/dev/null
        discovery_scan_lxc 2>/dev/null
        discovery_scan_libvirt 2>/dev/null
        discovery_scan_subnet 2>/dev/null
    } | sort -u > "$tmp_peers"

    # Use same parsing logic as discovery_scan_peers
    local peers_json='['
    local first=1
    local my_did="${NODE_DID:-$(cat /var/lib/mirrornet/identity/did.txt 2>/dev/null)}"
    local seen_dids=""

    while IFS='|' read -r did addr role port source; do
        [ -z "$did" ] && continue
        [ "$did" = "$my_did" ] && continue
        echo "$seen_dids" | grep -q "$did" && continue
        seen_dids="$seen_dids $did"

        [ "$first" = "1" ] || peers_json="$peers_json,"

        local last_seen source_field=""
        last_seen=$(date -Iseconds)
        [ -n "$source" ] && source_field=",\"source\":\"$source\""

        peers_json="$peers_json{\"did\":\"$did\",\"address\":\"$addr\",\"role\":\"$role\",\"port\":${port:-0}$source_field,\"last_seen\":\"$last_seen\"}"
        first=0
    done < "$tmp_peers"

    peers_json="$peers_json]"
    echo "$peers_json" > "$PEERS_FILE"
    rm -f "$tmp_peers"

    discovery_scan_all_devices
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
