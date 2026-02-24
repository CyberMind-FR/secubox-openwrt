#!/bin/sh
# P2P Intel Feedback - Track IOC effectiveness and update peer reputation
# Records effectiveness tracking for audit trail and reputation updates

. /usr/lib/p2p-intel/blockchain.sh 2>/dev/null

FEEDBACK_DIR="/var/lib/p2p-intel/feedback"
EFFECTIVENESS_LOG="$FEEDBACK_DIR/effectiveness.json"
IOC_TRACKING_FILE="$FEEDBACK_DIR/ioc-tracking.json"

# Reputation score adjustments for IOC feedback
SCORE_IOC_EFFECTIVE=5
SCORE_IOC_FALSE_POSITIVE=-8

# Initialize feedback storage
feedback_init() {
    mkdir -p "$FEEDBACK_DIR"
    [ -f "$EFFECTIVENESS_LOG" ] || echo '[]' > "$EFFECTIVENESS_LOG"
    [ -f "$IOC_TRACKING_FILE" ] || echo '{}' > "$IOC_TRACKING_FILE"
}

# Generate IOC hash for tracking
_ioc_hash() {
    local ioc_value="$1"
    echo "$ioc_value" | sha256sum | cut -c1-16
}

# Track IOC source for later feedback attribution
feedback_track_ioc() {
    local ioc_value="$1"
    local ioc_type="$2"
    local source_node="$3"
    local timestamp
    timestamp=$(date +%s)

    local ioc_hash
    ioc_hash=$(_ioc_hash "$ioc_value")

    local entry="{\"hash\":\"$ioc_hash\",\"value\":\"$ioc_value\",\"type\":\"$ioc_type\",\"source\":\"$source_node\",\"received_at\":$timestamp}"

    local tmp_file="/tmp/ioc_tracking_$$.json"

    if [ -s "$IOC_TRACKING_FILE" ] && [ "$(cat "$IOC_TRACKING_FILE")" != "{}" ]; then
        # Add or update entry
        if grep -q "\"$ioc_hash\"" "$IOC_TRACKING_FILE"; then
            # Already tracked
            return 0
        fi
        # Add new entry
        sed "s/^{/{\"$ioc_hash\":$entry,/" "$IOC_TRACKING_FILE" > "$tmp_file"
    else
        echo "{\"$ioc_hash\":$entry}" > "$tmp_file"
    fi

    mv "$tmp_file" "$IOC_TRACKING_FILE"
}

# Get source node for an IOC
_get_ioc_source() {
    local ioc_value="$1"
    local ioc_hash
    ioc_hash=$(_ioc_hash "$ioc_value")

    jsonfilter -i "$IOC_TRACKING_FILE" -e "@[\"$ioc_hash\"].source" 2>/dev/null
}

# Record effective IOC (blocked an attack)
# Usage: feedback_ioc_effective '<ip_or_ioc>' [source_node]
feedback_ioc_effective() {
    local ioc_value="$1"
    local source_node="${2:-}"
    local timestamp
    timestamp=$(date +%s)

    # Get source from tracking if not provided
    if [ -z "$source_node" ]; then
        source_node=$(_get_ioc_source "$ioc_value")
    fi

    [ -z "$source_node" ] && {
        logger -t p2p-intel "Warning: Cannot attribute effectiveness - no source for $ioc_value"
        return 1
    }

    local ioc_hash
    ioc_hash=$(_ioc_hash "$ioc_value")

    # Record to blockchain for permanent audit trail
    if type blockchain_record_feedback >/dev/null 2>&1; then
        blockchain_record_feedback "$ioc_hash" "effective" "blocked_attack"
    fi

    # Log locally
    local entry="{\"type\":\"effective\",\"ioc_hash\":\"$ioc_hash\",\"ioc_value\":\"$ioc_value\",\"source\":\"$source_node\",\"timestamp\":$timestamp}"
    _append_effectiveness "$entry"

    # Update peer reputation (+5)
    if [ -f /usr/lib/mirrornet/reputation.sh ]; then
        . /usr/lib/mirrornet/reputation.sh
        reputation_adjust "$source_node" "$SCORE_IOC_EFFECTIVE" "ioc_effective"
    fi

    logger -t p2p-intel "IOC effective: $ioc_value from $source_node (+$SCORE_IOC_EFFECTIVE rep)"
}

# Mark IOC as false positive
# Usage: feedback_false_positive '<ip_or_ioc>' [source_node] [reason]
feedback_false_positive() {
    local ioc_value="$1"
    local source_node="${2:-}"
    local reason="${3:-manual_override}"
    local timestamp
    timestamp=$(date +%s)

    # Get source from tracking if not provided
    if [ -z "$source_node" ]; then
        source_node=$(_get_ioc_source "$ioc_value")
    fi

    [ -z "$source_node" ] && {
        logger -t p2p-intel "Warning: Cannot attribute false positive - no source for $ioc_value"
        return 1
    }

    local ioc_hash
    ioc_hash=$(_ioc_hash "$ioc_value")

    # Record to blockchain for permanent audit trail
    if type blockchain_record_feedback >/dev/null 2>&1; then
        blockchain_record_feedback "$ioc_hash" "false_positive" "$reason"
    fi

    # Log locally
    local entry="{\"type\":\"false_positive\",\"ioc_hash\":\"$ioc_hash\",\"ioc_value\":\"$ioc_value\",\"source\":\"$source_node\",\"reason\":\"$reason\",\"timestamp\":$timestamp}"
    _append_effectiveness "$entry"

    # Update peer reputation (-8)
    if [ -f /usr/lib/mirrornet/reputation.sh ]; then
        . /usr/lib/mirrornet/reputation.sh
        reputation_adjust "$source_node" "$SCORE_IOC_FALSE_POSITIVE" "ioc_false_positive"
    fi

    logger -t p2p-intel "IOC false positive: $ioc_value from $source_node ($SCORE_IOC_FALSE_POSITIVE rep) - $reason"
}

# Append to effectiveness log
_append_effectiveness() {
    local entry="$1"
    local tmp_file="/tmp/effectiveness_$$.json"

    if [ -s "$EFFECTIVENESS_LOG" ] && [ "$(cat "$EFFECTIVENESS_LOG")" != "[]" ]; then
        sed 's/]$//' "$EFFECTIVENESS_LOG" > "$tmp_file"
        echo ",$entry]" >> "$tmp_file"
    else
        echo "[$entry]" > "$tmp_file"
    fi

    mv "$tmp_file" "$EFFECTIVENESS_LOG"
}

# Get effectiveness stats for a peer
feedback_peer_stats() {
    local peer_id="$1"

    [ -f "$EFFECTIVENESS_LOG" ] || { echo '{"effective":0,"false_positive":0,"ratio":0}'; return; }

    local effective=0
    local false_positive=0

    # Count from effectiveness log
    effective=$(grep -c "\"source\":\"$peer_id\".*\"type\":\"effective\"" "$EFFECTIVENESS_LOG" 2>/dev/null || echo 0)
    false_positive=$(grep -c "\"source\":\"$peer_id\".*\"type\":\"false_positive\"" "$EFFECTIVENESS_LOG" 2>/dev/null || echo 0)

    # Calculate ratio (effectiveness percentage)
    local total=$((effective + false_positive))
    local ratio=0
    if [ "$total" -gt 0 ]; then
        ratio=$((effective * 100 / total))
    fi

    echo "{\"effective\":$effective,\"false_positive\":$false_positive,\"total\":$total,\"ratio\":$ratio}"
}

# Get global effectiveness stats
feedback_global_stats() {
    [ -f "$EFFECTIVENESS_LOG" ] || { echo '{"effective":0,"false_positive":0,"total":0}'; return; }

    local effective=0
    local false_positive=0

    effective=$(grep -c '"type":"effective"' "$EFFECTIVENESS_LOG" 2>/dev/null || echo 0)
    false_positive=$(grep -c '"type":"false_positive"' "$EFFECTIVENESS_LOG" 2>/dev/null || echo 0)

    local total=$((effective + false_positive))

    echo "{\"effective\":$effective,\"false_positive\":$false_positive,\"total\":$total}"
}

# Get recent feedback events
feedback_recent() {
    local count="${1:-20}"

    [ -f "$EFFECTIVENESS_LOG" ] || { echo '[]'; return; }

    # Get last N entries (simple tail approximation)
    local total
    total=$(grep -c '"type":' "$EFFECTIVENESS_LOG" 2>/dev/null || echo 0)

    if [ "$total" -le "$count" ]; then
        cat "$EFFECTIVENESS_LOG"
    else
        # Return last N entries using jsonfilter
        jsonfilter -i "$EFFECTIVENESS_LOG" -e "@[-$count:]" 2>/dev/null || cat "$EFFECTIVENESS_LOG"
    fi
}

# Check if peer has poor effectiveness (for trust decisions)
feedback_peer_reliability() {
    local peer_id="$1"
    local min_samples="${2:-5}"
    local min_ratio="${3:-60}"

    local stats
    stats=$(feedback_peer_stats "$peer_id")

    local total ratio
    total=$(echo "$stats" | jsonfilter -e '@.total' 2>/dev/null || echo 0)
    ratio=$(echo "$stats" | jsonfilter -e '@.ratio' 2>/dev/null || echo 100)

    # Not enough samples = assume good
    if [ "$total" -lt "$min_samples" ]; then
        echo "unknown"
        return 0
    fi

    if [ "$ratio" -ge "$min_ratio" ]; then
        echo "reliable"
        return 0
    else
        echo "unreliable"
        return 1
    fi
}

# Cleanup old tracking data
feedback_cleanup() {
    local max_entries="${1:-10000}"
    local max_age_days="${2:-30}"

    # Clean effectiveness log if too large
    if [ -f "$EFFECTIVENESS_LOG" ]; then
        local count
        count=$(grep -c '"type":' "$EFFECTIVENESS_LOG" 2>/dev/null || echo 0)

        if [ "$count" -gt "$max_entries" ]; then
            local keep=$((max_entries / 2))
            local tmp_file="/tmp/effectiveness_$$.json"
            jsonfilter -i "$EFFECTIVENESS_LOG" -e "@[-$keep:]" > "$tmp_file" 2>/dev/null || echo "[]" > "$tmp_file"
            mv "$tmp_file" "$EFFECTIVENESS_LOG"
            logger -t p2p-intel "Cleaned effectiveness log (kept last $keep entries)"
        fi
    fi

    # Clean IOC tracking (remove entries older than max_age_days)
    if [ -f "$IOC_TRACKING_FILE" ]; then
        local current_time cutoff_time
        current_time=$(date +%s)
        cutoff_time=$((current_time - max_age_days * 86400))

        # Simple size-based cleanup for now
        local file_size
        file_size=$(stat -f%z "$IOC_TRACKING_FILE" 2>/dev/null || stat -c%s "$IOC_TRACKING_FILE" 2>/dev/null || echo 0)

        if [ "$file_size" -gt 1048576 ]; then  # 1MB
            echo '{}' > "$IOC_TRACKING_FILE"
            logger -t p2p-intel "Reset IOC tracking file (size limit)"
        fi
    fi
}

# Initialize on source
feedback_init
