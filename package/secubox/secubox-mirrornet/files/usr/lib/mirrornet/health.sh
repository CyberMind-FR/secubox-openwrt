#!/bin/sh
# MirrorNet Health Monitoring - Per-peer metrics and anomaly detection

. /lib/functions.sh

HEALTH_DIR="/var/lib/mirrornet/health"
METRICS_FILE="$HEALTH_DIR/metrics.json"
BASELINES_FILE="$HEALTH_DIR/baselines.json"
ALERTS_FILE="$HEALTH_DIR/alerts.json"

# Initialize health storage
health_init() {
    mkdir -p "$HEALTH_DIR"
    [ -f "$METRICS_FILE" ] || echo '{}' > "$METRICS_FILE"
    [ -f "$BASELINES_FILE" ] || echo '{}' > "$BASELINES_FILE"
    [ -f "$ALERTS_FILE" ] || echo '[]' > "$ALERTS_FILE"
}

# Get health settings
_get_latency_threshold() {
    uci -q get mirrornet.health.latency_threshold || echo "500"
}

_get_packet_loss_threshold() {
    uci -q get mirrornet.health.packet_loss_threshold || echo "10"
}

# Ping peer and measure latency
health_ping() {
    local peer_address="$1"
    local count="${2:-3}"

    # Use ping with timeout
    local result
    result=$(ping -c "$count" -W 2 "$peer_address" 2>/dev/null)

    if [ -z "$result" ]; then
        echo '{"status":"unreachable","latency_ms":null,"packet_loss":100}'
        return 1
    fi

    # Parse ping output
    local latency packet_loss
    latency=$(echo "$result" | grep "avg" | sed 's/.*= [0-9.]*\/\([0-9.]*\)\/.*/\1/' | cut -d'.' -f1)
    packet_loss=$(echo "$result" | grep "packet loss" | sed 's/.*\([0-9]*\)% packet loss.*/\1/')

    [ -z "$latency" ] && latency="null"
    [ -z "$packet_loss" ] && packet_loss="0"

    local status="healthy"
    local latency_threshold packet_loss_threshold
    latency_threshold=$(_get_latency_threshold)
    packet_loss_threshold=$(_get_packet_loss_threshold)

    if [ "$latency" != "null" ] && [ "$latency" -gt "$latency_threshold" ]; then
        status="slow"
    fi

    if [ "$packet_loss" -gt "$packet_loss_threshold" ]; then
        status="unreliable"
    fi

    echo "{\"status\":\"$status\",\"latency_ms\":$latency,\"packet_loss\":$packet_loss}"
}

# Check HTTP health endpoint
health_http_check() {
    local peer_address="$1"
    local port="${2:-7331}"
    local endpoint="${3:-/api/status}"

    local start_time response_time status_code

    start_time=$(date +%s%N 2>/dev/null || echo "$(date +%s)000000000")

    local result
    result=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" \
        --connect-timeout 5 \
        "http://$peer_address:$port$endpoint" 2>/dev/null)

    status_code=$(echo "$result" | cut -d':' -f1)
    response_time=$(echo "$result" | cut -d':' -f2 | cut -d'.' -f1)

    [ -z "$status_code" ] && status_code="000"
    [ -z "$response_time" ] && response_time="null"

    local status="healthy"
    if [ "$status_code" = "000" ]; then
        status="unreachable"
    elif [ "$status_code" != "200" ]; then
        status="unhealthy"
    fi

    echo "{\"status\":\"$status\",\"http_code\":$status_code,\"response_time_ms\":$response_time}"
}

# Record peer metrics
health_record_metrics() {
    local peer_id="$1"
    local metrics="$2"
    local timestamp
    timestamp=$(date +%s)

    # Update metrics file
    local tmp_file="/tmp/health_metrics_$$.json"

    local peer_metrics="{\"peer_id\":\"$peer_id\",\"timestamp\":$timestamp,\"metrics\":$metrics}"

    if [ -s "$METRICS_FILE" ] && [ "$(cat "$METRICS_FILE")" != "{}" ]; then
        if grep -q "\"$peer_id\"" "$METRICS_FILE"; then
            # Update existing - simplified replacement
            sed "s/\"$peer_id\":{[^}]*}/\"$peer_id\":$peer_metrics/" "$METRICS_FILE" > "$tmp_file"
        else
            # Add new
            sed "s/^{/{\"$peer_id\":$peer_metrics,/" "$METRICS_FILE" > "$tmp_file"
        fi
    else
        echo "{\"$peer_id\":$peer_metrics}" > "$tmp_file"
    fi

    mv "$tmp_file" "$METRICS_FILE"

    # Check for anomalies
    health_check_anomalies "$peer_id" "$metrics"
}

# Check for anomalies against baseline
health_check_anomalies() {
    local peer_id="$1"
    local metrics="$2"

    local anomaly_enabled
    anomaly_enabled=$(uci -q get mirrornet.health.anomaly_detection || echo "1")
    [ "$anomaly_enabled" = "1" ] || return 0

    # Get baseline for peer
    local baseline
    baseline=$(jsonfilter -i "$BASELINES_FILE" -e "@[\"$peer_id\"]" 2>/dev/null)

    if [ -z "$baseline" ]; then
        # No baseline yet - this becomes the baseline
        health_update_baseline "$peer_id" "$metrics"
        return 0
    fi

    # Compare metrics to baseline
    local current_latency baseline_latency
    current_latency=$(echo "$metrics" | jsonfilter -e '@.latency_ms' 2>/dev/null)
    baseline_latency=$(echo "$baseline" | jsonfilter -e '@.latency_ms' 2>/dev/null)

    if [ -n "$current_latency" ] && [ -n "$baseline_latency" ] && [ "$baseline_latency" -gt 0 ]; then
        # Alert if latency increased by more than 200%
        local threshold=$((baseline_latency * 3))
        if [ "$current_latency" -gt "$threshold" ]; then
            health_create_alert "$peer_id" "latency_spike" "Latency increased from ${baseline_latency}ms to ${current_latency}ms"
        fi
    fi

    local current_loss baseline_loss
    current_loss=$(echo "$metrics" | jsonfilter -e '@.packet_loss' 2>/dev/null)
    baseline_loss=$(echo "$baseline" | jsonfilter -e '@.packet_loss' 2>/dev/null)

    if [ -n "$current_loss" ] && [ "$current_loss" -gt 0 ]; then
        local threshold=$(_get_packet_loss_threshold)
        if [ "$current_loss" -gt "$threshold" ]; then
            health_create_alert "$peer_id" "packet_loss" "Packet loss at ${current_loss}%"
        fi
    fi
}

# Update baseline for peer
health_update_baseline() {
    local peer_id="$1"
    local metrics="$2"
    local timestamp
    timestamp=$(date +%s)

    local baseline="{\"peer_id\":\"$peer_id\",\"timestamp\":$timestamp,\"metrics\":$metrics}"

    local tmp_file="/tmp/health_baseline_$$.json"

    if [ -s "$BASELINES_FILE" ] && [ "$(cat "$BASELINES_FILE")" != "{}" ]; then
        if grep -q "\"$peer_id\"" "$BASELINES_FILE"; then
            sed "s/\"$peer_id\":{[^}]*}/\"$peer_id\":$baseline/" "$BASELINES_FILE" > "$tmp_file"
        else
            sed "s/^{/{\"$peer_id\":$baseline,/" "$BASELINES_FILE" > "$tmp_file"
        fi
    else
        echo "{\"$peer_id\":$baseline}" > "$tmp_file"
    fi

    mv "$tmp_file" "$BASELINES_FILE"
    logger -t mirrornet "Updated health baseline for $peer_id"
}

# Create health alert
health_create_alert() {
    local peer_id="$1"
    local alert_type="$2"
    local message="$3"
    local timestamp
    timestamp=$(date +%s)

    local alert_id
    alert_id=$(echo -n "${peer_id}:${alert_type}:${timestamp}" | md5sum | cut -c1-8)

    local alert="{\"id\":\"$alert_id\",\"peer_id\":\"$peer_id\",\"type\":\"$alert_type\",\"message\":\"$message\",\"timestamp\":$timestamp,\"acknowledged\":false}"

    local tmp_file="/tmp/health_alerts_$$.json"

    if [ -s "$ALERTS_FILE" ] && [ "$(cat "$ALERTS_FILE")" != "[]" ]; then
        sed 's/]$/,'"$alert"']/' "$ALERTS_FILE" > "$tmp_file"
    else
        echo "[$alert]" > "$tmp_file"
    fi

    mv "$tmp_file" "$ALERTS_FILE"
    logger -t mirrornet "Health alert: $alert_type for $peer_id - $message"

    # Update reputation if reputation system available
    if [ -f /usr/lib/mirrornet/reputation.sh ]; then
        . /usr/lib/mirrornet/reputation.sh
        case "$alert_type" in
            latency_spike)
                reputation_slow_response "$peer_id"
                ;;
            packet_loss)
                reputation_packet_loss "$peer_id"
                ;;
            unreachable)
                reputation_offline "$peer_id"
                ;;
        esac
    fi
}

# Get alerts
health_get_alerts() {
    local count="${1:-50}"
    local unack_only="${2:-false}"

    if [ "$unack_only" = "true" ]; then
        jsonfilter -i "$ALERTS_FILE" -e '@[*]' 2>/dev/null | grep '"acknowledged":false' | head -n "$count"
    else
        jsonfilter -i "$ALERTS_FILE" -e "@[-$count:]" 2>/dev/null
    fi
}

# Acknowledge alert
health_ack_alert() {
    local alert_id="$1"

    # Update alert in file
    sed -i "s/\"id\":\"$alert_id\",\([^}]*\)\"acknowledged\":false/\"id\":\"$alert_id\",\1\"acknowledged\":true/" "$ALERTS_FILE"
    logger -t mirrornet "Acknowledged health alert: $alert_id"
}

# Clear old alerts
health_clear_alerts() {
    local max_age="${1:-604800}"  # Default 7 days
    local current_time
    current_time=$(date +%s)
    local cutoff=$((current_time - max_age))

    # Would need proper JSON filtering to remove old alerts
    # Simplified: check file size and truncate if needed
    local file_size
    file_size=$(stat -f%z "$ALERTS_FILE" 2>/dev/null || stat -c%s "$ALERTS_FILE" 2>/dev/null || echo 0)

    if [ "$file_size" -gt 102400 ]; then
        # Keep last 100 alerts
        local tmp_file="/tmp/health_alerts_$$.json"
        jsonfilter -i "$ALERTS_FILE" -e '@[-100:]' > "$tmp_file" 2>/dev/null || echo "[]" > "$tmp_file"
        mv "$tmp_file" "$ALERTS_FILE"
        logger -t mirrornet "Trimmed health alerts (size limit)"
    fi
}

# Run full health check on all peers
health_check_all_peers() {
    local peers_file="/tmp/secubox-p2p-peers.json"

    if [ ! -f "$peers_file" ]; then
        echo '{"error":"No peers file found"}'
        return 1
    fi

    echo "{"
    echo "  \"timestamp\": $(date +%s),"
    echo "  \"peers\": ["

    local first=1
    while read -r peer_line; do
        local peer_id peer_addr
        peer_id=$(echo "$peer_line" | jsonfilter -e '@.id' 2>/dev/null)
        peer_addr=$(echo "$peer_line" | jsonfilter -e '@.address' 2>/dev/null)

        [ -z "$peer_addr" ] && continue

        [ "$first" = "1" ] || echo ","

        # Run health checks
        local ping_result http_result
        ping_result=$(health_ping "$peer_addr")
        http_result=$(health_http_check "$peer_addr")

        # Combine results
        local combined_status="healthy"
        local ping_status http_status
        ping_status=$(echo "$ping_result" | jsonfilter -e '@.status' 2>/dev/null)
        http_status=$(echo "$http_result" | jsonfilter -e '@.status' 2>/dev/null)

        if [ "$ping_status" = "unreachable" ] || [ "$http_status" = "unreachable" ]; then
            combined_status="unreachable"
        elif [ "$ping_status" = "slow" ] || [ "$ping_status" = "unreliable" ]; then
            combined_status="degraded"
        elif [ "$http_status" = "unhealthy" ]; then
            combined_status="unhealthy"
        fi

        echo "    {"
        echo "      \"peer_id\": \"$peer_id\","
        echo "      \"address\": \"$peer_addr\","
        echo "      \"status\": \"$combined_status\","
        echo "      \"ping\": $ping_result,"
        echo "      \"http\": $http_result"
        echo "    }"

        # Record metrics
        local metrics="{\"latency_ms\":$(echo "$ping_result" | jsonfilter -e '@.latency_ms' 2>/dev/null || echo null),\"packet_loss\":$(echo "$ping_result" | jsonfilter -e '@.packet_loss' 2>/dev/null || echo 0),\"http_code\":$(echo "$http_result" | jsonfilter -e '@.http_code' 2>/dev/null || echo 0)}"
        health_record_metrics "$peer_id" "$metrics"

        first=0
    done < <(jsonfilter -i "$peers_file" -e '@[*]' 2>/dev/null)

    echo "  ]"
    echo "}"
}

# Get health summary
health_summary() {
    local total_peers=0
    local healthy=0
    local degraded=0
    local unreachable=0
    local unack_alerts=0

    # Count peers by status from metrics
    # Simplified summary
    if [ -f "$METRICS_FILE" ]; then
        total_peers=$(grep -o '"peer_id"' "$METRICS_FILE" 2>/dev/null | wc -l)
    fi

    if [ -f "$ALERTS_FILE" ]; then
        unack_alerts=$(grep -c '"acknowledged":false' "$ALERTS_FILE" 2>/dev/null || echo 0)
    fi

    cat <<EOF
{
  "total_peers": $total_peers,
  "healthy": $healthy,
  "degraded": $degraded,
  "unreachable": $unreachable,
  "unacknowledged_alerts": $unack_alerts,
  "latency_threshold_ms": $(_get_latency_threshold),
  "packet_loss_threshold_percent": $(_get_packet_loss_threshold),
  "anomaly_detection": $(uci -q get mirrornet.health.anomaly_detection || echo "1")
}
EOF
}

# Initialize on source
health_init
