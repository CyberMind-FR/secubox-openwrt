#!/bin/sh
# MirrorNet Enhanced Gossip Protocol - Priority-based message routing

. /lib/functions.sh

GOSSIP_DIR="/var/lib/mirrornet/gossip"
GOSSIP_QUEUE="$GOSSIP_DIR/queue.json"
GOSSIP_SEEN="$GOSSIP_DIR/seen.json"
GOSSIP_STATS="$GOSSIP_DIR/stats.json"

# Message priorities (higher = more urgent)
PRIORITY_CRITICAL=100   # Security alerts, bans
PRIORITY_HIGH=75        # IOC updates, peer status changes
PRIORITY_NORMAL=50      # Config sync, service discovery
PRIORITY_LOW=25         # Metrics, non-urgent updates
PRIORITY_BACKGROUND=10  # Bulk sync, cleanup

# Initialize gossip storage
gossip_init() {
    mkdir -p "$GOSSIP_DIR"
    [ -f "$GOSSIP_QUEUE" ] || echo '[]' > "$GOSSIP_QUEUE"
    [ -f "$GOSSIP_SEEN" ] || echo '{}' > "$GOSSIP_SEEN"
    [ -f "$GOSSIP_STATS" ] || echo '{"sent":0,"received":0,"dropped":0,"forwarded":0}' > "$GOSSIP_STATS"
}

# Get gossip settings
_get_max_hops() {
    uci -q get mirrornet.gossip.max_hops || echo "5"
}

_get_dedup_window() {
    uci -q get mirrornet.gossip.dedup_window || echo "300"
}

_get_batch_size() {
    uci -q get mirrornet.gossip.batch_size || echo "10"
}

# Generate message ID
_generate_msg_id() {
    local type="$1"
    local data="$2"
    local timestamp
    timestamp=$(date +%s%N 2>/dev/null || date +%s)

    echo -n "${type}:${data}:${timestamp}" | md5sum | cut -c1-16
}

# Check if message was already seen (deduplication)
gossip_is_seen() {
    local msg_id="$1"
    local current_time
    current_time=$(date +%s)

    local seen_time
    seen_time=$(jsonfilter -i "$GOSSIP_SEEN" -e "@[\"$msg_id\"]" 2>/dev/null)

    if [ -n "$seen_time" ]; then
        local dedup_window
        dedup_window=$(_get_dedup_window)
        local age=$((current_time - seen_time))

        if [ "$age" -lt "$dedup_window" ]; then
            return 0  # Already seen within window
        fi
    fi

    return 1  # Not seen
}

# Mark message as seen
gossip_mark_seen() {
    local msg_id="$1"
    local current_time
    current_time=$(date +%s)

    # Update seen file (simplified)
    local tmp_file="/tmp/gossip_seen_$$.json"

    if [ -s "$GOSSIP_SEEN" ] && [ "$(cat "$GOSSIP_SEEN")" != "{}" ]; then
        if grep -q "\"$msg_id\"" "$GOSSIP_SEEN"; then
            # Update timestamp
            sed "s/\"$msg_id\":[0-9]*/\"$msg_id\":$current_time/" "$GOSSIP_SEEN" > "$tmp_file"
        else
            # Add new entry
            sed "s/^{/{\"$msg_id\":$current_time,/" "$GOSSIP_SEEN" > "$tmp_file"
        fi
    else
        echo "{\"$msg_id\":$current_time}" > "$tmp_file"
    fi

    mv "$tmp_file" "$GOSSIP_SEEN"
}

# Clean up old seen entries
gossip_cleanup_seen() {
    local current_time dedup_window
    current_time=$(date +%s)
    dedup_window=$(_get_dedup_window)
    local cutoff=$((current_time - dedup_window))

    # Would need proper JSON processing to remove old entries
    # Simplified: just truncate if file is too large
    local file_size
    file_size=$(stat -f%z "$GOSSIP_SEEN" 2>/dev/null || stat -c%s "$GOSSIP_SEEN" 2>/dev/null || echo 0)

    if [ "$file_size" -gt 102400 ]; then
        echo '{}' > "$GOSSIP_SEEN"
        logger -t mirrornet "Gossip seen cache cleared (size limit)"
    fi
}

# Create gossip message
gossip_create_message() {
    local type="$1"
    local data="$2"
    local priority="${3:-$PRIORITY_NORMAL}"

    local msg_id origin_node timestamp ttl

    msg_id=$(_generate_msg_id "$type" "$data")
    origin_node=$(cat /var/lib/mirrornet/identity/did.txt 2>/dev/null || echo "unknown")
    timestamp=$(date +%s)
    ttl=$(_get_max_hops)

    # Sign message if identity available
    local signature=""
    if [ -f /usr/lib/mirrornet/identity.sh ]; then
        . /usr/lib/mirrornet/identity.sh
        signature=$(identity_sign "${msg_id}:${type}:${timestamp}" 2>/dev/null)
    fi

    cat <<EOF
{
  "id": "$msg_id",
  "type": "$type",
  "priority": $priority,
  "origin": "$origin_node",
  "timestamp": $timestamp,
  "ttl": $ttl,
  "hops": 0,
  "path": ["$origin_node"],
  "signature": "$signature",
  "data": $data
}
EOF
}

# Queue message for sending
gossip_queue_message() {
    local message="$1"

    local tmp_file="/tmp/gossip_queue_$$.json"

    if [ -s "$GOSSIP_QUEUE" ] && [ "$(cat "$GOSSIP_QUEUE")" != "[]" ]; then
        # Append to queue
        sed 's/]$/,'"$(echo "$message" | tr -d '\n')"']/' "$GOSSIP_QUEUE" > "$tmp_file"
    else
        echo "[$(echo "$message" | tr -d '\n')]" > "$tmp_file"
    fi

    mv "$tmp_file" "$GOSSIP_QUEUE"

    # Update stats
    _update_stat "sent"
}

# Update gossip stats
_update_stat() {
    local stat_name="$1"
    local current_val
    current_val=$(jsonfilter -i "$GOSSIP_STATS" -e "@.$stat_name" 2>/dev/null || echo 0)
    local new_val=$((current_val + 1))

    sed -i "s/\"$stat_name\":[0-9]*/\"$stat_name\":$new_val/" "$GOSSIP_STATS"
}

# Process incoming gossip message
gossip_receive() {
    local message="$1"

    local msg_id type priority ttl hops origin
    msg_id=$(echo "$message" | jsonfilter -e '@.id' 2>/dev/null)
    type=$(echo "$message" | jsonfilter -e '@.type' 2>/dev/null)
    priority=$(echo "$message" | jsonfilter -e '@.priority' 2>/dev/null)
    ttl=$(echo "$message" | jsonfilter -e '@.ttl' 2>/dev/null)
    hops=$(echo "$message" | jsonfilter -e '@.hops' 2>/dev/null)
    origin=$(echo "$message" | jsonfilter -e '@.origin' 2>/dev/null)

    # Check deduplication
    if gossip_is_seen "$msg_id"; then
        _update_stat "dropped"
        logger -t mirrornet "Gossip: dropped duplicate $msg_id"
        return 1
    fi

    # Mark as seen
    gossip_mark_seen "$msg_id"
    _update_stat "received"

    # Verify signature if available
    local signature
    signature=$(echo "$message" | jsonfilter -e '@.signature' 2>/dev/null)
    # (signature verification would go here)

    # Process by type
    case "$type" in
        ioc)
            # Threat intelligence update - bridge to p2p-intel with ZKP trust
            local ioc_data
            ioc_data=$(echo "$message" | jsonfilter -e '@.data')

            if [ -f /usr/lib/p2p-intel/validator.sh ]; then
                . /usr/lib/p2p-intel/validator.sh

                # Validate IOC with ZKP-enhanced trust
                if _is_source_trusted "$origin"; then
                    # Update reputation for valid IOC
                    if [ -f /usr/lib/mirrornet/reputation.sh ]; then
                        . /usr/lib/mirrornet/reputation.sh
                        reputation_valid_ioc "$origin"
                    fi

                    # Queue for application
                    if [ -f /usr/lib/p2p-intel/applier.sh ]; then
                        . /usr/lib/p2p-intel/applier.sh
                        queue_pending "$ioc_data" "$origin"
                    fi

                    # Track IOC source for feedback attribution
                    if [ -f /usr/lib/p2p-intel/feedback.sh ]; then
                        . /usr/lib/p2p-intel/feedback.sh
                        local ioc_value ioc_type
                        ioc_value=$(echo "$ioc_data" | jsonfilter -e '@.value' 2>/dev/null)
                        ioc_type=$(echo "$ioc_data" | jsonfilter -e '@.type' 2>/dev/null)
                        [ -n "$ioc_value" ] && feedback_track_ioc "$ioc_value" "$ioc_type" "$origin"
                    fi

                    logger -t mirrornet "Gossip: valid IOC from ZKP-trusted $origin"
                else
                    # Untrusted source
                    if [ -f /usr/lib/mirrornet/reputation.sh ]; then
                        . /usr/lib/mirrornet/reputation.sh
                        reputation_invalid_ioc "$origin"
                    fi
                    logger -t mirrornet "Gossip: rejected IOC from untrusted $origin"
                fi
            else
                # Fallback to legacy threat-intel.sh
                if [ -f /usr/lib/secubox/threat-intel.sh ]; then
                    . /usr/lib/secubox/threat-intel.sh
                    threat_intel_receive "$ioc_data" "$origin"
                fi
            fi
            ;;
        peer_status)
            # Peer status change
            logger -t mirrornet "Gossip: peer status from $origin"
            ;;
        config_sync)
            # Configuration sync request
            logger -t mirrornet "Gossip: config sync from $origin"
            ;;
        service_announce)
            # Service announcement
            logger -t mirrornet "Gossip: service announce from $origin"
            ;;
        mirror_update)
            # Mirror configuration update
            if [ -f /usr/lib/mirrornet/mirror.sh ]; then
                . /usr/lib/mirrornet/mirror.sh
                local mirror_data
                mirror_data=$(echo "$message" | jsonfilter -e '@.data')
                # Process mirror update
            fi
            ;;
        reputation_update)
            # Reputation score update
            logger -t mirrornet "Gossip: reputation update from $origin"
            ;;
        *)
            logger -t mirrornet "Gossip: unknown type '$type' from $origin"
            ;;
    esac

    # Forward if TTL allows
    if [ "$ttl" -gt 0 ]; then
        gossip_forward "$message"
    fi

    return 0
}

# Forward message to peers
gossip_forward() {
    local message="$1"

    local ttl hops my_node
    ttl=$(echo "$message" | jsonfilter -e '@.ttl' 2>/dev/null)
    hops=$(echo "$message" | jsonfilter -e '@.hops' 2>/dev/null)
    my_node=$(cat /var/lib/mirrornet/identity/did.txt 2>/dev/null || echo "unknown")

    # Decrement TTL, increment hops
    local new_ttl=$((ttl - 1))
    local new_hops=$((hops + 1))

    if [ "$new_ttl" -le 0 ]; then
        return 0  # TTL expired
    fi

    # Update message with new TTL/hops and add self to path
    local updated_message
    updated_message=$(echo "$message" | sed "s/\"ttl\":[0-9]*/\"ttl\":$new_ttl/" | sed "s/\"hops\":[0-9]*/\"hops\":$new_hops/")

    # Get peer list (exclude those already in path)
    local peers_file="/tmp/secubox-p2p-peers.json"
    if [ ! -f "$peers_file" ]; then
        return 0
    fi

    local msg_path
    msg_path=$(echo "$message" | jsonfilter -e '@.path[*]' 2>/dev/null)

    # Forward to each peer not in path (ash-compatible)
    jsonfilter -i "$peers_file" -e '@[*]' 2>/dev/null | while read -r peer_line; do
        local peer_addr peer_id
        peer_addr=$(echo "$peer_line" | jsonfilter -e '@.address' 2>/dev/null)
        peer_id=$(echo "$peer_line" | jsonfilter -e '@.id' 2>/dev/null)

        [ -z "$peer_addr" ] && continue

        # Skip if peer already in path
        if echo "$msg_path" | grep -q "$peer_id"; then
            continue
        fi

        # Send to peer (async)
        curl -s -X POST -H "Content-Type: application/json" \
            -d "$updated_message" \
            "http://$peer_addr:7332/api/gossip" \
            --connect-timeout 2 &

        _update_stat "forwarded"
    done

    wait  # Wait for all forwards to complete
}

# Broadcast message to all peers (no forwarding)
gossip_broadcast() {
    local type="$1"
    local data="$2"
    local priority="${3:-$PRIORITY_NORMAL}"

    local message
    message=$(gossip_create_message "$type" "$data" "$priority")

    # Mark as seen locally
    local msg_id
    msg_id=$(echo "$message" | jsonfilter -e '@.id' 2>/dev/null)
    gossip_mark_seen "$msg_id"

    # Send to all peers
    local peers_file="/tmp/secubox-p2p-peers.json"
    if [ ! -f "$peers_file" ]; then
        logger -t mirrornet "Gossip: no peers to broadcast to"
        return 1
    fi

    # Send to all peers (ash-compatible)
    local sent_count_file="/tmp/gossip_sent_$$.tmp"
    echo "0" > "$sent_count_file"

    jsonfilter -i "$peers_file" -e '@[*]' 2>/dev/null | while read -r peer_line; do
        local peer_addr
        peer_addr=$(echo "$peer_line" | jsonfilter -e '@.address' 2>/dev/null)

        [ -z "$peer_addr" ] && continue

        curl -s -X POST -H "Content-Type: application/json" \
            -d "$message" \
            "http://$peer_addr:7332/api/gossip" \
            --connect-timeout 2 &

        local cnt=$(cat "$sent_count_file")
        echo $((cnt + 1)) > "$sent_count_file"
        _update_stat "sent"
    done

    wait
    local sent_count=$(cat "$sent_count_file")
    rm -f "$sent_count_file"
    logger -t mirrornet "Gossip: broadcast $type to $sent_count peers"

    echo "$msg_id"
}

# Publish IOC via gossip
gossip_publish_ioc() {
    local ioc_json="$1"
    gossip_broadcast "ioc" "$ioc_json" "$PRIORITY_HIGH"
}

# Publish service announcement
gossip_announce_service() {
    local service_name="$1"
    local service_port="$2"
    local service_type="$3"

    local data="{\"name\":\"$service_name\",\"port\":$service_port,\"type\":\"$service_type\"}"
    gossip_broadcast "service_announce" "$data" "$PRIORITY_NORMAL"
}

# Publish peer status change
gossip_peer_status() {
    local status="$1"
    local data="{\"status\":\"$status\"}"
    gossip_broadcast "peer_status" "$data" "$PRIORITY_HIGH"
}

# Get gossip queue (pending messages)
gossip_get_queue() {
    cat "$GOSSIP_QUEUE"
}

# Clear gossip queue
gossip_clear_queue() {
    echo '[]' > "$GOSSIP_QUEUE"
}

# Get gossip statistics
gossip_stats() {
    cat "$GOSSIP_STATS"
}

# Reset gossip statistics
gossip_reset_stats() {
    echo '{"sent":0,"received":0,"dropped":0,"forwarded":0}' > "$GOSSIP_STATS"
}

# Process queued messages
gossip_process_queue() {
    local batch_size
    batch_size=$(_get_batch_size)

    # Process queue (ash-compatible)
    local count_file="/tmp/gossip_proc_$$.tmp"
    echo "0" > "$count_file"

    jsonfilter -i "$GOSSIP_QUEUE" -e '@[*]' 2>/dev/null | while read -r message; do
        [ -z "$message" ] && continue

        local cnt=$(cat "$count_file")
        [ "$cnt" -ge "$batch_size" ] && break

        gossip_forward "$message"
        echo $((cnt + 1)) > "$count_file"
    done

    local count=$(cat "$count_file")
    rm -f "$count_file"

    # Clear processed messages
    if [ "$count" -gt 0 ]; then
        gossip_clear_queue
        logger -t mirrornet "Gossip: processed $count queued messages"
    fi
}

# Initialize on source
gossip_init
