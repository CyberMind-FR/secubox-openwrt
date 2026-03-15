#!/bin/sh
# Correlation Library for DPI Dual-Stream
# Shared functions for event matching and threat correlation

# Paths
STATS_DIR="/tmp/secubox"
FLOW_DIR="/tmp/dpi-flows"
BUFFER_DIR="/tmp/dpi-buffer"
REPUTATION_DB="$STATS_DIR/ip-reputation.json"
CORRELATION_LOG="$STATS_DIR/correlated-threats.json"
WAF_ALERTS="$STATS_DIR/waf-alerts.json"
MITM_LOG="/var/log/mitmproxy/access.log"

# Initialize reputation database
init_reputation_db() {
    [ ! -f "$REPUTATION_DB" ] && echo '{}' > "$REPUTATION_DB"
}

# Get IP reputation score (0-100, higher = more suspicious)
get_ip_reputation() {
    local ip="$1"
    init_reputation_db

    local score
    score=$(jsonfilter -i "$REPUTATION_DB" -e "@[\"$ip\"].score" 2>/dev/null)
    echo "${score:-0}"
}

# Update IP reputation based on event
update_ip_reputation() {
    local ip="$1"
    local event_type="$2"  # threat, alert, block, clean
    local delta="$3"       # score change

    init_reputation_db

    local current_score last_seen event_count
    current_score=$(jsonfilter -i "$REPUTATION_DB" -e "@[\"$ip\"].score" 2>/dev/null || echo 0)
    event_count=$(jsonfilter -i "$REPUTATION_DB" -e "@[\"$ip\"].events" 2>/dev/null || echo 0)

    # Calculate new score
    local new_score=$((current_score + delta))
    [ "$new_score" -lt 0 ] && new_score=0
    [ "$new_score" -gt 100 ] && new_score=100

    event_count=$((event_count + 1))

    # Build updated entry
    local tmp_file="/tmp/reputation_update_$$.json"
    cat "$REPUTATION_DB" > "$tmp_file"

    # Update using shell (jsonfilter is read-only)
    local now
    now=$(date -Iseconds)

    # Simple JSON update - replace or add entry
    if grep -q "\"$ip\"" "$tmp_file"; then
        # Update existing - this is simplified, full implementation would use jq
        sed -i "s/\"$ip\":{[^}]*}/\"$ip\":{\"score\":$new_score,\"events\":$event_count,\"last_event\":\"$event_type\",\"updated\":\"$now\"}/" "$tmp_file"
    else
        # Add new entry
        sed -i "s/^{/{\n\"$ip\":{\"score\":$new_score,\"events\":$event_count,\"last_event\":\"$event_type\",\"updated\":\"$now\"},/" "$tmp_file"
    fi

    mv "$tmp_file" "$REPUTATION_DB"
}

# Decay all IP reputations by a fixed amount
# Called periodically to let old threats "heal"
decay_all_reputations() {
    local decay_amount="${1:-5}"

    init_reputation_db

    [ ! -f "$REPUTATION_DB" ] && return 0

    local tmp_file="/tmp/reputation_decay_$$.json"
    local now
    now=$(date -Iseconds)

    # Process each IP in the reputation DB
    # Extract IPs and their scores, apply decay
    local ip score new_score

    # Read current state
    cp "$REPUTATION_DB" "$tmp_file"

    # Get all IPs from the JSON
    local ips
    ips=$(grep -oE '"[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+"' "$REPUTATION_DB" | tr -d '"' | sort -u)

    for ip in $ips; do
        score=$(jsonfilter -i "$REPUTATION_DB" -e "@[\"$ip\"].score" 2>/dev/null || echo 0)
        new_score=$((score - decay_amount))
        [ "$new_score" -lt 0 ] && new_score=0

        if [ "$new_score" -eq 0 ]; then
            # Remove entries that have decayed to 0
            sed -i "s/\"$ip\":{[^}]*},\?//" "$tmp_file"
        else
            # Update score
            sed -i "s/\"$ip\":{\"score\":[0-9]*/\"$ip\":{\"score\":$new_score/" "$tmp_file"
        fi
    done

    # Clean up JSON (remove trailing commas, empty entries)
    sed -i 's/,\s*}/}/g; s/{\s*,/{/g; s/,,/,/g' "$tmp_file"

    mv "$tmp_file" "$REPUTATION_DB"
}

# Reset reputation for a specific IP
reset_ip_reputation() {
    local ip="$1"

    init_reputation_db
    [ ! -f "$REPUTATION_DB" ] && return 0

    local tmp_file="/tmp/reputation_reset_$$.json"
    cp "$REPUTATION_DB" "$tmp_file"

    # Remove the IP entry
    sed -i "s/\"$ip\":{[^}]*},\?//" "$tmp_file"
    sed -i 's/,\s*}/}/g; s/{\s*,/{/g; s/,,/,/g' "$tmp_file"

    mv "$tmp_file" "$REPUTATION_DB"
    echo "Reset reputation for $ip"
}

# Get MITM context for IP (recent requests)
get_mitm_context() {
    local ip="$1"
    local count="${2:-10}"
    local window="${3:-300}"  # seconds

    local result="[]"

    if [ -f "$MITM_LOG" ]; then
        # Get recent entries from MITM log
        local now
        now=$(date +%s)

        result=$(grep "$ip" "$MITM_LOG" 2>/dev/null | tail -"$count" | \
            awk -F'\t' -v now="$now" -v window="$window" '
            BEGIN { printf "[" }
            {
                if (NR > 1) printf ","
                printf "{\"method\":\"%s\",\"host\":\"%s\",\"path\":\"%s\",\"status\":\"%s\"}",
                    $2, $3, $4, $5
            }
            END { printf "]" }
        ')
    fi

    echo "$result"
}

# Get DPI flow context for IP
get_dpi_context() {
    local ip="$1"
    local count="${2:-5}"

    local result="[]"

    if [ -d "$FLOW_DIR" ]; then
        result=$(find "$FLOW_DIR" -name "*.json" -mmin -5 -exec grep -l "$ip" {} \; 2>/dev/null | \
            head -"$count" | xargs cat 2>/dev/null | \
            awk 'BEGIN { printf "[" }
                 { if (NR > 1) printf ","; print }
                 END { printf "]" }')
    fi

    [ -z "$result" ] && result="[]"
    echo "$result"
}

# Get WAF alert context for IP
get_waf_context() {
    local ip="$1"
    local count="${2:-10}"

    if [ -f "$WAF_ALERTS" ]; then
        jsonfilter -i "$WAF_ALERTS" -e "@[*]" 2>/dev/null | \
            grep "\"client_ip\":\"$ip\"" | \
            tail -"$count" | \
            awk 'BEGIN { printf "[" }
                 { if (NR > 1) printf ","; print }
                 END { printf "]" }'
    else
        echo "[]"
    fi
}

# Get buffer context for IP (from mitmproxy double buffer)
get_buffer_context() {
    local ip="$1"
    local count="${2:-20}"

    local buffer_file="$BUFFER_DIR/entries.jsonl"

    if [ -f "$buffer_file" ]; then
        grep "\"client_ip\":\"$ip\"" "$buffer_file" 2>/dev/null | \
            tail -"$count" | \
            awk 'BEGIN { printf "[" }
                 { if (NR > 1) printf ","; print }
                 END { printf "]" }'
    else
        echo "[]"
    fi
}

# Check if IP is in CrowdSec decisions
check_crowdsec_decision() {
    local ip="$1"

    if command -v cscli >/dev/null 2>&1; then
        local decision
        decision=$(cscli decisions list -o json 2>/dev/null | jsonfilter -e "@[*]" 2>/dev/null | grep "\"value\":\"$ip\"" | head -1)

        if [ -n "$decision" ]; then
            echo "banned"
            return 0
        fi
    fi

    echo "clean"
    return 1
}

# Notify CrowdSec about a threat (for potential ban)
notify_crowdsec() {
    local ip="$1"
    local reason="$2"
    local duration="${3:-4h}"

    if command -v cscli >/dev/null 2>&1; then
        # Add a decision manually
        cscli decisions add -i "$ip" -d "$duration" -r "$reason" -t ban >/dev/null 2>&1
        return $?
    fi

    return 1
}

# Build full correlation entry
build_correlation_entry() {
    local ip="$1"
    local event_type="$2"
    local reason="$3"
    local threat_score="${4:-0}"

    local mitm_ctx dpi_ctx waf_ctx reputation cs_status

    mitm_ctx=$(get_mitm_context "$ip" 10)
    dpi_ctx=$(get_dpi_context "$ip" 5)
    waf_ctx=$(get_waf_context "$ip" 10)
    reputation=$(get_ip_reputation "$ip")
    cs_status=$(check_crowdsec_decision "$ip")

    cat << EOF
{
    "ip": "$ip",
    "timestamp": "$(date -Iseconds)",
    "event_type": "$event_type",
    "reason": "$reason",
    "threat_score": $threat_score,
    "reputation_score": $reputation,
    "crowdsec_status": "$cs_status",
    "context": {
        "mitm_requests": $mitm_ctx,
        "dpi_flows": $dpi_ctx,
        "waf_alerts": $waf_ctx
    }
}
EOF
}

# Save correlation entry to log
save_correlation() {
    local entry="$1"

    mkdir -p "$(dirname "$CORRELATION_LOG")"

    # Append to JSONL file (one JSON object per line)
    echo "$entry" >> "$CORRELATION_LOG"

    # Rotate if too large (keep last 10000 entries)
    local lines
    lines=$(wc -l < "$CORRELATION_LOG" 2>/dev/null || echo 0)
    if [ "$lines" -gt 10000 ]; then
        tail -5000 "$CORRELATION_LOG" > "$CORRELATION_LOG.tmp"
        mv "$CORRELATION_LOG.tmp" "$CORRELATION_LOG"
    fi
}

# Get correlation summary stats
get_correlation_stats() {
    local total=0 high_threat=0 banned=0 unique_ips=0

    if [ -f "$CORRELATION_LOG" ]; then
        total=$(wc -l < "$CORRELATION_LOG")
        high_threat=$(grep -c '"threat_score":[5-9][0-9]' "$CORRELATION_LOG" 2>/dev/null || echo 0)
        banned=$(grep -c '"crowdsec_status":"banned"' "$CORRELATION_LOG" 2>/dev/null || echo 0)
        unique_ips=$(cut -d'"' -f4 "$CORRELATION_LOG" | sort -u | wc -l)
    fi

    cat << EOF
{
    "total_correlations": $total,
    "high_threat_count": $high_threat,
    "banned_ips": $banned,
    "unique_ips": $unique_ips,
    "updated": "$(date -Iseconds)"
}
EOF
}

# Search correlations by IP or time range
search_correlations() {
    local ip="$1"
    local since="$2"  # ISO timestamp
    local limit="${3:-50}"

    if [ -f "$CORRELATION_LOG" ]; then
        if [ -n "$ip" ]; then
            grep "\"ip\":\"$ip\"" "$CORRELATION_LOG" | tail -"$limit"
        elif [ -n "$since" ]; then
            # Simple time filter - assumes entries are chronological
            awk -v since="$since" '
                $0 ~ since || found { found=1; print }
            ' "$CORRELATION_LOG" | tail -"$limit"
        else
            tail -"$limit" "$CORRELATION_LOG"
        fi
    fi
}
