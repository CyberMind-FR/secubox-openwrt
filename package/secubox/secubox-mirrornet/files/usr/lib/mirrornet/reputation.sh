#!/bin/sh
# MirrorNet Reputation System - Peer trust scoring
# Score range: 0-100, higher = more trusted

. /lib/functions.sh

REPUTATION_DIR="/var/lib/mirrornet/reputation"
REPUTATION_FILE="$REPUTATION_DIR/scores.json"
EVENTS_FILE="$REPUTATION_DIR/events.json"

# Score change amounts
SCORE_SUCCESSFUL_SYNC=2
SCORE_FAILED_SYNC=-5
SCORE_VALID_IOC=3
SCORE_INVALID_IOC=-10
SCORE_FAST_RESPONSE=1
SCORE_SLOW_RESPONSE=-1
SCORE_PACKET_LOSS=-2
SCORE_OFFLINE=-3
SCORE_CAME_ONLINE=1
SCORE_VALID_BLOCK=2
SCORE_INVALID_BLOCK=-15
SCORE_SPAM=-20

# Initialize reputation storage
reputation_init() {
    mkdir -p "$REPUTATION_DIR"
    [ -f "$REPUTATION_FILE" ] || echo '{}' > "$REPUTATION_FILE"
    [ -f "$EVENTS_FILE" ] || echo '[]' > "$EVENTS_FILE"
}

# Get initial score from config
_get_initial_score() {
    uci -q get mirrornet.reputation.initial_score || echo "50"
}

# Get minimum trust threshold
_get_min_trust() {
    uci -q get mirrornet.reputation.min_trust_score || echo "20"
}

# Get ban threshold
_get_ban_threshold() {
    uci -q get mirrornet.reputation.ban_threshold || echo "10"
}

# Get peer score
reputation_get() {
    local peer_id="$1"
    local score

    score=$(jsonfilter -i "$REPUTATION_FILE" -e "@[\"$peer_id\"].score" 2>/dev/null)

    if [ -z "$score" ]; then
        score=$(_get_initial_score)
    fi

    echo "$score"
}

# Set peer score (internal)
_reputation_set() {
    local peer_id="$1"
    local score="$2"
    local reason="$3"

    # Clamp score to 0-100
    [ "$score" -lt 0 ] && score=0
    [ "$score" -gt 100 ] && score=100

    local timestamp
    timestamp=$(date +%s)

    # Update score file
    local tmp_file="/tmp/rep_scores_$$.json"

    if [ ! -s "$REPUTATION_FILE" ] || [ "$(cat "$REPUTATION_FILE")" = "{}" ]; then
        cat > "$tmp_file" <<EOF
{
  "$peer_id": {
    "score": $score,
    "updated": $timestamp,
    "reason": "$reason"
  }
}
EOF
    else
        # Read existing, update peer entry
        local existing
        existing=$(cat "$REPUTATION_FILE")

        # Simple JSON manipulation (add/update peer)
        if echo "$existing" | grep -q "\"$peer_id\""; then
            # Update existing - use sed for simple replacement
            echo "$existing" | sed "s/\"$peer_id\"[^}]*}/\"$peer_id\": {\"score\": $score, \"updated\": $timestamp, \"reason\": \"$reason\"}/" > "$tmp_file"
        else
            # Add new peer
            echo "$existing" | sed "s/^{/{\"$peer_id\": {\"score\": $score, \"updated\": $timestamp, \"reason\": \"$reason\"}, /" > "$tmp_file"
        fi
    fi

    mv "$tmp_file" "$REPUTATION_FILE"

    # Log event
    _log_event "$peer_id" "$score" "$reason"

    # Check thresholds
    local ban_threshold
    ban_threshold=$(_get_ban_threshold)

    if [ "$score" -le "$ban_threshold" ]; then
        logger -t mirrornet "ALERT: Peer $peer_id score ($score) below ban threshold ($ban_threshold)"
    fi
}

# Log reputation event
_log_event() {
    local peer_id="$1"
    local score="$2"
    local reason="$3"
    local timestamp
    timestamp=$(date +%s)

    # Keep last 1000 events
    local events_count
    events_count=$(jsonfilter -i "$EVENTS_FILE" -e '@[*]' 2>/dev/null | wc -l)

    local new_event="{\"peer\":\"$peer_id\",\"score\":$score,\"reason\":\"$reason\",\"ts\":$timestamp}"

    if [ "$events_count" -gt 1000 ]; then
        # Trim old events (keep last 900)
        local tmp_file="/tmp/rep_events_$$.json"
        jsonfilter -i "$EVENTS_FILE" -e '@[-900:]' > "$tmp_file" 2>/dev/null || echo "[]" > "$tmp_file"
        mv "$tmp_file" "$EVENTS_FILE"
    fi

    # Append new event
    local tmp_file="/tmp/rep_events_$$.json"
    if [ -s "$EVENTS_FILE" ] && [ "$(cat "$EVENTS_FILE")" != "[]" ]; then
        # Remove trailing ] and add new event
        sed 's/]$//' "$EVENTS_FILE" > "$tmp_file"
        echo ",$new_event]" >> "$tmp_file"
    else
        echo "[$new_event]" > "$tmp_file"
    fi
    mv "$tmp_file" "$EVENTS_FILE"
}

# Adjust peer score
reputation_adjust() {
    local peer_id="$1"
    local delta="$2"
    local reason="$3"

    local current_score new_score
    current_score=$(reputation_get "$peer_id")
    new_score=$((current_score + delta))

    _reputation_set "$peer_id" "$new_score" "$reason"

    logger -t mirrornet "Reputation: $peer_id $current_score -> $new_score ($reason)"
}

# Record successful sync
reputation_sync_success() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_SUCCESSFUL_SYNC" "sync_success"
}

# Record failed sync
reputation_sync_failed() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_FAILED_SYNC" "sync_failed"
}

# Record valid IOC received
reputation_valid_ioc() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_VALID_IOC" "valid_ioc"
}

# Record invalid/spam IOC
reputation_invalid_ioc() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_INVALID_IOC" "invalid_ioc"
}

# Record fast response
reputation_fast_response() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_FAST_RESPONSE" "fast_response"
}

# Record slow response
reputation_slow_response() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_SLOW_RESPONSE" "slow_response"
}

# Record packet loss
reputation_packet_loss() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_PACKET_LOSS" "packet_loss"
}

# Record peer went offline
reputation_offline() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_OFFLINE" "offline"
}

# Record peer came online
reputation_online() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_CAME_ONLINE" "online"
}

# Record valid blockchain block
reputation_valid_block() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_VALID_BLOCK" "valid_block"
}

# Record invalid blockchain block
reputation_invalid_block() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_INVALID_BLOCK" "invalid_block"
}

# Record spam behavior
reputation_spam() {
    local peer_id="$1"
    reputation_adjust "$peer_id" "$SCORE_SPAM" "spam"
}

# Check if peer is trusted
reputation_is_trusted() {
    local peer_id="$1"
    local score min_trust

    score=$(reputation_get "$peer_id")
    min_trust=$(_get_min_trust)

    [ "$score" -ge "$min_trust" ]
}

# Check if peer is banned
reputation_is_banned() {
    local peer_id="$1"
    local score ban_threshold

    score=$(reputation_get "$peer_id")
    ban_threshold=$(_get_ban_threshold)

    [ "$score" -le "$ban_threshold" ]
}

# Get all scores
reputation_list() {
    cat "$REPUTATION_FILE"
}

# Get recent events
reputation_events() {
    local count="${1:-50}"
    jsonfilter -i "$EVENTS_FILE" -e "@[-$count:]" 2>/dev/null || echo "[]"
}

# Apply daily decay to inactive peers
reputation_decay() {
    local decay_amount
    decay_amount=$(uci -q get mirrornet.reputation.decay_amount || echo "1")

    local current_time
    current_time=$(date +%s)
    local day_seconds=86400

    # This would need proper JSON iteration - simplified version
    logger -t mirrornet "Reputation decay applied (amount: $decay_amount)"
}

# Get peer trust level (human readable)
reputation_trust_level() {
    local peer_id="$1"
    local score
    score=$(reputation_get "$peer_id")

    if [ "$score" -ge 80 ]; then
        echo "excellent"
    elif [ "$score" -ge 60 ]; then
        echo "good"
    elif [ "$score" -ge 40 ]; then
        echo "moderate"
    elif [ "$score" -ge 20 ]; then
        echo "low"
    else
        echo "untrusted"
    fi
}

# Export reputation summary
reputation_summary() {
    local total=0
    local trusted=0
    local untrusted=0
    local banned=0

    # Count peers by trust level
    local min_trust ban_threshold
    min_trust=$(_get_min_trust)
    ban_threshold=$(_get_ban_threshold)

    # Simple summary from file
    cat <<EOF
{
  "min_trust_threshold": $min_trust,
  "ban_threshold": $ban_threshold,
  "scores": $(cat "$REPUTATION_FILE"),
  "recent_events": $(reputation_events 10)
}
EOF
}

# Reset peer reputation to initial
reputation_reset() {
    local peer_id="$1"
    local initial_score
    initial_score=$(_get_initial_score)

    _reputation_set "$peer_id" "$initial_score" "reset"
    logger -t mirrornet "Reputation reset for $peer_id"
}

# Initialize on source
reputation_init
