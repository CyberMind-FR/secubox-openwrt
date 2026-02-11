#!/bin/sh
#
# IoT Guard - Anomaly Detection Module
#
# Detects behavioral anomalies in IoT device traffic patterns.
#

# Sensitivity levels
SENSITIVITY_LOW=3
SENSITIVITY_MEDIUM=2
SENSITIVITY_HIGH=1.5

# ============================================================================
# Baseline Management
# ============================================================================

get_device_baseline() {
    local mac="$1"
    local db="${2:-/var/lib/iot-guard/iot-guard.db}"

    sqlite3 -json "$db" \
        "SELECT avg_bps_in, avg_bps_out, peak_bps_in, peak_bps_out, common_ports
         FROM traffic_baseline WHERE mac='$mac';" 2>/dev/null
}

update_device_baseline() {
    local mac="$1"
    local bps_in="$2"
    local bps_out="$3"
    local ports="$4"
    local db="${5:-/var/lib/iot-guard/iot-guard.db}"

    local now=$(date -Iseconds)

    # Get current baseline
    local current=$(sqlite3 "$db" \
        "SELECT avg_bps_in, avg_bps_out, sample_count FROM traffic_baseline WHERE mac='$mac';" 2>/dev/null)

    if [ -z "$current" ]; then
        # Create new baseline
        sqlite3 "$db" "INSERT INTO traffic_baseline
            (mac, avg_bps_in, avg_bps_out, peak_bps_in, peak_bps_out, common_ports, sample_count, last_update)
            VALUES ('$mac', $bps_in, $bps_out, $bps_in, $bps_out, '$ports', 1, '$now');"
    else
        # Update with exponential moving average
        local old_in=$(echo "$current" | cut -d'|' -f1)
        local old_out=$(echo "$current" | cut -d'|' -f2)
        local count=$(echo "$current" | cut -d'|' -f3)

        # EMA with alpha = 0.1
        local new_in=$(awk "BEGIN {printf \"%.2f\", $old_in * 0.9 + $bps_in * 0.1}")
        local new_out=$(awk "BEGIN {printf \"%.2f\", $old_out * 0.9 + $bps_out * 0.1}")

        sqlite3 "$db" "UPDATE traffic_baseline SET
            avg_bps_in = $new_in,
            avg_bps_out = $new_out,
            peak_bps_in = MAX(peak_bps_in, $bps_in),
            peak_bps_out = MAX(peak_bps_out, $bps_out),
            sample_count = sample_count + 1,
            last_update = '$now'
            WHERE mac = '$mac';"
    fi
}

# ============================================================================
# Anomaly Detection
# ============================================================================

check_bandwidth_anomaly() {
    local mac="$1"
    local current_bps="$2"
    local direction="$3"
    local db="${4:-/var/lib/iot-guard/iot-guard.db}"

    local sensitivity
    config_load iot-guard
    config_get sensitivity main anomaly_sensitivity "medium"

    local threshold
    case "$sensitivity" in
        low) threshold=$SENSITIVITY_LOW ;;
        high) threshold=$SENSITIVITY_HIGH ;;
        *) threshold=$SENSITIVITY_MEDIUM ;;
    esac

    # Get baseline average
    local avg_field="avg_bps_in"
    [ "$direction" = "out" ] && avg_field="avg_bps_out"

    local baseline=$(sqlite3 "$db" "SELECT $avg_field FROM traffic_baseline WHERE mac='$mac';" 2>/dev/null)
    [ -z "$baseline" ] && return 1

    # Check if current is threshold times the baseline
    local ratio=$(awk "BEGIN {printf \"%.2f\", $current_bps / ($baseline + 0.01)}")
    local is_anomaly=$(awk "BEGIN {print ($ratio > $threshold) ? 1 : 0}")

    if [ "$is_anomaly" = "1" ]; then
        echo "bandwidth_spike|high|Traffic ${direction} ${ratio}x above baseline"
        return 0
    fi

    return 1
}

check_new_destination() {
    local mac="$1"
    local domain="$2"
    local db="${3:-/var/lib/iot-guard/iot-guard.db}"

    # Check if this is a new destination for this device
    local exists=$(sqlite3 "$db" \
        "SELECT COUNT(*) FROM cloud_deps WHERE mac='$mac' AND domain='$domain';" 2>/dev/null)

    if [ "$exists" = "0" ]; then
        echo "new_destination|low|First connection to $domain"
        return 0
    fi

    return 1
}

check_port_scan() {
    local mac="$1"
    local port_count="$2"
    local time_window="$3"

    # If device contacts many ports in short time, flag as port scan
    if [ "$port_count" -gt 10 ]; then
        echo "port_scan|high|Contacted $port_count ports in ${time_window}s"
        return 0
    fi

    return 1
}

check_time_anomaly() {
    local mac="$1"
    local db="${2:-/var/lib/iot-guard/iot-guard.db}"

    # Get device class to determine expected active hours
    local device_class=$(sqlite3 "$db" "SELECT device_class FROM devices WHERE mac='$mac';" 2>/dev/null)

    local hour=$(date +%H)

    # Cameras/doorbells should be active 24/7
    # Thermostats should have some activity
    # Lights/plugs typically quiet at night

    case "$device_class" in
        lighting|plug)
            if [ "$hour" -ge 2 ] && [ "$hour" -lt 6 ]; then
                echo "time_anomaly|medium|Unusual activity at night (${hour}:00)"
                return 0
            fi
            ;;
    esac

    return 1
}

# ============================================================================
# Main Anomaly Check
# ============================================================================

run_anomaly_detection() {
    local db="${1:-/var/lib/iot-guard/iot-guard.db}"

    # Get all active devices
    sqlite3 "$db" "SELECT mac FROM devices WHERE status='active';" 2>/dev/null | while read -r mac; do
        [ -z "$mac" ] && continue

        # Check various anomaly types
        # These would normally be called with real-time data from traffic monitoring

        # Time-based anomaly
        local time_result=$(check_time_anomaly "$mac" "$db")
        if [ -n "$time_result" ]; then
            local atype=$(echo "$time_result" | cut -d'|' -f1)
            local severity=$(echo "$time_result" | cut -d'|' -f2)
            local desc=$(echo "$time_result" | cut -d'|' -f3)
            record_anomaly "$mac" "$atype" "$severity" "$desc"
        fi
    done
}

record_anomaly() {
    local mac="$1"
    local atype="$2"
    local severity="$3"
    local desc="$4"
    local db="${5:-/var/lib/iot-guard/iot-guard.db}"

    local now=$(date -Iseconds)
    sqlite3 "$db" "INSERT INTO anomalies (mac, timestamp, anomaly_type, severity, description)
                   VALUES ('$mac', '$now', '$atype', '$severity', '$desc');"

    logger -t "iot-guard" "Anomaly detected: $mac - $atype ($severity): $desc"
}
