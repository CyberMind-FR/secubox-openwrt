#!/bin/sh
# MirrorNet Service Mirroring - Reverse proxy chaining for redundancy

. /lib/functions.sh

MIRROR_DIR="/var/lib/mirrornet/mirrors"
MIRROR_CONFIG="$MIRROR_DIR/config.json"
MIRROR_STATUS="$MIRROR_DIR/status.json"

# Initialize mirror storage
mirror_init() {
    mkdir -p "$MIRROR_DIR"
    [ -f "$MIRROR_CONFIG" ] || echo '{"services":[]}' > "$MIRROR_CONFIG"
    [ -f "$MIRROR_STATUS" ] || echo '{"mirrors":[]}' > "$MIRROR_STATUS"
}

# Get upstream timeout
_get_timeout() {
    uci -q get mirrornet.mirror.upstream_timeout || echo "5"
}

# Get failover threshold
_get_failover_threshold() {
    uci -q get mirrornet.mirror.failover_threshold || echo "3"
}

# Add service to mirror pool
mirror_add_service() {
    local service_name="$1"
    local local_port="$2"
    local description="$3"

    local service_id
    service_id=$(echo -n "${service_name}:${local_port}" | md5sum | cut -c1-8)

    local timestamp
    timestamp=$(date +%s)

    local new_service="{\"id\":\"$service_id\",\"name\":\"$service_name\",\"port\":$local_port,\"description\":\"$description\",\"created\":$timestamp,\"mirrors\":[]}"

    # Add to config
    local tmp_file="/tmp/mirror_cfg_$$.json"
    if [ -s "$MIRROR_CONFIG" ]; then
        # Check if service already exists
        local existing
        existing=$(jsonfilter -i "$MIRROR_CONFIG" -e "@.services[*]" 2>/dev/null | grep "\"id\":\"$service_id\"")
        if [ -n "$existing" ]; then
            echo "Service already exists: $service_id"
            return 1
        fi

        # Add new service
        sed 's/"services":\[/"services":['"$new_service"',/' "$MIRROR_CONFIG" | \
        sed 's/,\]/]/' > "$tmp_file"
    else
        echo "{\"services\":[$new_service]}" > "$tmp_file"
    fi

    mv "$tmp_file" "$MIRROR_CONFIG"
    logger -t mirrornet "Added mirror service: $service_name on port $local_port"

    echo "$service_id"
}

# Add upstream mirror for a service
mirror_add_upstream() {
    local service_id="$1"
    local peer_id="$2"
    local peer_address="$3"
    local peer_port="$4"
    local priority="${5:-50}"

    local upstream_id
    upstream_id=$(echo -n "${service_id}:${peer_id}" | md5sum | cut -c1-8)

    local timestamp
    timestamp=$(date +%s)

    local new_upstream="{\"id\":\"$upstream_id\",\"peer_id\":\"$peer_id\",\"address\":\"$peer_address\",\"port\":$peer_port,\"priority\":$priority,\"status\":\"unknown\",\"failures\":0,\"added\":$timestamp}"

    # This would need proper JSON manipulation to add to the correct service
    # Simplified: just log it
    logger -t mirrornet "Added upstream $peer_address:$peer_port for service $service_id (priority: $priority)"

    # Store in separate upstreams file for simplicity
    local upstreams_file="$MIRROR_DIR/upstreams_$service_id.json"
    if [ -f "$upstreams_file" ]; then
        # Append to existing
        sed 's/]$/,'"$new_upstream"']/' "$upstreams_file" > "/tmp/ups_$$.json"
        mv "/tmp/ups_$$.json" "$upstreams_file"
    else
        echo "[$new_upstream]" > "$upstreams_file"
    fi

    echo "$upstream_id"
}

# Health check single upstream
mirror_check_upstream() {
    local address="$1"
    local port="$2"
    local timeout
    timeout=$(_get_timeout)

    local start_time end_time latency
    start_time=$(date +%s%N 2>/dev/null || date +%s)

    # Try HTTP health check first
    local result
    result=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$timeout" "http://$address:$port/health" 2>/dev/null)

    if [ "$result" = "000" ]; then
        # Try TCP connect
        if timeout "$timeout" sh -c "echo > /dev/tcp/$address/$port" 2>/dev/null; then
            result="tcp_ok"
        else
            result="failed"
        fi
    fi

    end_time=$(date +%s%N 2>/dev/null || date +%s)

    # Calculate latency (simplified)
    if [ "$result" != "failed" ]; then
        echo "ok"
    else
        echo "failed"
    fi
}

# Check all upstreams for a service
mirror_check_service() {
    local service_id="$1"
    local upstreams_file="$MIRROR_DIR/upstreams_$service_id.json"

    if [ ! -f "$upstreams_file" ]; then
        echo "No upstreams configured for service $service_id"
        return 1
    fi

    echo "{"
    echo "  \"service_id\": \"$service_id\","
    echo "  \"upstreams\": ["

    # Parse and check each upstream
    local first=1
    local count=0
    local tmp_output="/tmp/mirror_check_$$.tmp"

    # Simple line-by-line parsing (ash-compatible)
    jsonfilter -i "$upstreams_file" -e '@[*]' 2>/dev/null | while read -r line; do
        local address port peer_id
        address=$(echo "$line" | jsonfilter -e '@.address' 2>/dev/null)
        port=$(echo "$line" | jsonfilter -e '@.port' 2>/dev/null)
        peer_id=$(echo "$line" | jsonfilter -e '@.peer_id' 2>/dev/null)

        [ -z "$address" ] && continue

        local status
        status=$(mirror_check_upstream "$address" "$port")

        echo "{\"peer_id\":\"$peer_id\",\"address\":\"$address\",\"port\":$port,\"status\":\"$status\"}"
    done > "$tmp_output"

    # Output collected results
    local count=0
    local first=1
    while read -r item; do
        [ "$first" = "1" ] || echo ","
        echo "    $item"
        first=0
        count=$((count + 1))
    done < "$tmp_output"
    rm -f "$tmp_output"

    echo "  ],"
    echo "  \"total\": $count"
    echo "}"
}

# Get best upstream for failover (by priority and health)
mirror_get_best_upstream() {
    local service_id="$1"
    local upstreams_file="$MIRROR_DIR/upstreams_$service_id.json"

    if [ ! -f "$upstreams_file" ]; then
        return 1
    fi

    # Find highest priority healthy upstream (ash-compatible)
    local best_file="/tmp/mirror_best_$$.tmp"
    echo "0" > "$best_file"

    jsonfilter -i "$upstreams_file" -e '@[*]' 2>/dev/null | while read -r line; do
        local address port priority status
        address=$(echo "$line" | jsonfilter -e '@.address' 2>/dev/null)
        port=$(echo "$line" | jsonfilter -e '@.port' 2>/dev/null)
        priority=$(echo "$line" | jsonfilter -e '@.priority' 2>/dev/null)

        [ -z "$address" ] && continue
        [ -z "$priority" ] && priority=50

        status=$(mirror_check_upstream "$address" "$port")

        if [ "$status" = "ok" ]; then
            local current_best=$(cat "$best_file" | cut -d: -f1)
            if [ "$priority" -gt "$current_best" ]; then
                echo "$priority:$address:$port" > "$best_file"
            fi
        fi
    done

    local result=$(cat "$best_file")
    rm -f "$best_file"

    if [ "$result" != "0" ]; then
        echo "$result" | cut -d: -f2-
    else
        return 1
    fi
}

# Failover to next best upstream
mirror_failover() {
    local service_id="$1"
    local failed_address="$2"

    logger -t mirrornet "Failover triggered for service $service_id (failed: $failed_address)"

    # Increment failure count for failed upstream
    # (simplified - would need proper JSON update)

    local new_upstream
    new_upstream=$(mirror_get_best_upstream "$service_id")

    if [ -n "$new_upstream" ]; then
        logger -t mirrornet "Failover to: $new_upstream"
        echo "$new_upstream"

        # Update HAProxy backend (if integrated)
        if command -v haproxyctl >/dev/null 2>&1; then
            haproxyctl set-server "mirror_$service_id/upstream" addr "$new_upstream" 2>/dev/null
        fi
    else
        logger -t mirrornet "ERROR: No healthy upstreams available for $service_id"
        return 1
    fi
}

# Generate HAProxy backend config for mirrored service
mirror_generate_haproxy_backend() {
    local service_id="$1"
    local service_name="$2"
    local upstreams_file="$MIRROR_DIR/upstreams_$service_id.json"

    if [ ! -f "$upstreams_file" ]; then
        return 1
    fi

    echo "backend mirror_$service_id"
    echo "    mode http"
    echo "    balance roundrobin"
    echo "    option httpchk GET /health"
    echo "    http-check expect status 200"

    # Generate server lines (ash-compatible)
    local tmp_servers="/tmp/mirror_servers_$$.tmp"
    jsonfilter -i "$upstreams_file" -e '@[*]' 2>/dev/null | while read -r line; do
        local address port priority
        address=$(echo "$line" | jsonfilter -e '@.address' 2>/dev/null)
        port=$(echo "$line" | jsonfilter -e '@.port' 2>/dev/null)
        priority=$(echo "$line" | jsonfilter -e '@.priority' 2>/dev/null)

        [ -z "$address" ] && continue
        [ -z "$priority" ] && priority=50

        local weight=$((priority / 10))
        [ "$weight" -lt 1 ] && weight=1

        echo "$address:$port:$weight"
    done > "$tmp_servers"

    local server_num=1
    while read -r srv_line; do
        local addr_port=$(echo "$srv_line" | cut -d: -f1-2)
        local weight=$(echo "$srv_line" | cut -d: -f3)
        echo "    server srv$server_num $addr_port weight $weight check inter 10s fall 3 rise 2"
        server_num=$((server_num + 1))
    done < "$tmp_servers"
    rm -f "$tmp_servers"

    echo ""
}

# List all mirrored services
mirror_list() {
    if [ -f "$MIRROR_CONFIG" ]; then
        cat "$MIRROR_CONFIG"
    else
        echo '{"services":[]}'
    fi
}

# Remove service from mirror pool
mirror_remove_service() {
    local service_id="$1"

    # Remove upstreams file
    rm -f "$MIRROR_DIR/upstreams_$service_id.json"

    # Remove from config (simplified - would need proper JSON update)
    logger -t mirrornet "Removed mirror service: $service_id"
}

# Sync mirror config from peer
mirror_sync_from_peer() {
    local peer_address="$1"
    local timeout
    timeout=$(_get_timeout)

    local peer_config
    peer_config=$(curl -s --connect-timeout "$timeout" "http://$peer_address:7332/api/mirrors" 2>/dev/null)

    if [ -n "$peer_config" ]; then
        logger -t mirrornet "Synced mirror config from $peer_address"
        echo "$peer_config"
    else
        logger -t mirrornet "Failed to sync from $peer_address"
        return 1
    fi
}

# Get mirror status summary
mirror_status() {
    local total_services=0
    local total_upstreams=0
    local healthy_upstreams=0

    # Count services
    if [ -f "$MIRROR_CONFIG" ]; then
        total_services=$(jsonfilter -i "$MIRROR_CONFIG" -e '@.services[*]' 2>/dev/null | wc -l)
    fi

    # Count upstreams
    for ups_file in "$MIRROR_DIR"/upstreams_*.json; do
        [ -f "$ups_file" ] || continue
        local count
        count=$(jsonfilter -i "$ups_file" -e '@[*]' 2>/dev/null | wc -l)
        total_upstreams=$((total_upstreams + count))
    done

    cat <<EOF
{
  "enabled": $(uci -q get mirrornet.mirror.enabled || echo "0"),
  "total_services": $total_services,
  "total_upstreams": $total_upstreams,
  "healthy_upstreams": $healthy_upstreams,
  "failover_threshold": $(_get_failover_threshold),
  "upstream_timeout": $(_get_timeout)
}
EOF
}

# Initialize on source
mirror_init
