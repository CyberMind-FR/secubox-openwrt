#!/bin/sh
# SecuBox Identity Trust - Peer trust scoring

. /lib/functions.sh

TRUST_DIR="/var/lib/secubox-identity/trust"
SCORES_FILE="$TRUST_DIR/scores.json"
HISTORY_FILE="$TRUST_DIR/history.json"

# Trust score adjustments
TRUST_VALID_SIGNATURE=5
TRUST_INVALID_SIGNATURE=-20
TRUST_SUCCESSFUL_EXCHANGE=2
TRUST_FAILED_EXCHANGE=-5
TRUST_VERIFIED_IDENTITY=10
TRUST_REFERRED_BY_TRUSTED=5

# Initialize trust storage
trust_init() {
    mkdir -p "$TRUST_DIR"
    [ -f "$SCORES_FILE" ] || echo '{}' > "$SCORES_FILE"
    [ -f "$HISTORY_FILE" ] || echo '[]' > "$HISTORY_FILE"
}

# Get initial trust score from config
_get_initial_score() {
    uci -q get identity.trust.initial_score || echo "50"
}

# Get minimum trust threshold
_get_min_trust() {
    uci -q get identity.trust.min_trust || echo "20"
}

# Get ban threshold
_get_ban_threshold() {
    uci -q get identity.trust.ban_threshold || echo "10"
}

# Get trust score for peer
trust_get_score() {
    local peer_id="$1"

    local score
    score=$(jsonfilter -i "$SCORES_FILE" -e "@[\"$peer_id\"].score" 2>/dev/null)

    if [ -z "$score" ]; then
        score=$(_get_initial_score)
    fi

    echo "$score"
}

# Set trust score (internal)
_trust_set_score() {
    local peer_id="$1"
    local score="$2"
    local reason="$3"

    # Clamp to 0-100
    [ "$score" -lt 0 ] && score=0
    [ "$score" -gt 100 ] && score=100

    local timestamp
    timestamp=$(date +%s)

    # Update scores file
    local tmp_file="/tmp/trust_scores_$$.json"

    if [ ! -s "$SCORES_FILE" ] || [ "$(cat "$SCORES_FILE")" = "{}" ]; then
        echo "{\"$peer_id\":{\"score\":$score,\"updated\":$timestamp,\"reason\":\"$reason\"}}" > "$tmp_file"
    else
        if grep -q "\"$peer_id\"" "$SCORES_FILE"; then
            sed "s/\"$peer_id\":{[^}]*}/\"$peer_id\":{\"score\":$score,\"updated\":$timestamp,\"reason\":\"$reason\"}/" "$SCORES_FILE" > "$tmp_file"
        else
            sed "s/^{/{\"$peer_id\":{\"score\":$score,\"updated\":$timestamp,\"reason\":\"$reason\"},/" "$SCORES_FILE" > "$tmp_file"
        fi
    fi

    mv "$tmp_file" "$SCORES_FILE"

    # Log to history
    _trust_log_event "$peer_id" "$score" "$reason"
}

# Log trust event
_trust_log_event() {
    local peer_id="$1"
    local score="$2"
    local reason="$3"
    local timestamp
    timestamp=$(date +%s)

    local event="{\"peer\":\"$peer_id\",\"score\":$score,\"reason\":\"$reason\",\"ts\":$timestamp}"

    local tmp_file="/tmp/trust_history_$$.json"
    if [ -s "$HISTORY_FILE" ] && [ "$(cat "$HISTORY_FILE")" != "[]" ]; then
        sed 's/]$/,'"$event"']/' "$HISTORY_FILE" > "$tmp_file"
    else
        echo "[$event]" > "$tmp_file"
    fi
    mv "$tmp_file" "$HISTORY_FILE"

    # Trim history if too large
    local count
    count=$(wc -l < "$HISTORY_FILE")
    if [ "$count" -gt 1000 ]; then
        tail -500 "$HISTORY_FILE" > "/tmp/trust_trim_$$.json"
        mv "/tmp/trust_trim_$$.json" "$HISTORY_FILE"
    fi
}

# Adjust trust score
trust_adjust() {
    local peer_id="$1"
    local delta="$2"
    local reason="$3"

    local current new
    current=$(trust_get_score "$peer_id")
    new=$((current + delta))

    _trust_set_score "$peer_id" "$new" "$reason"

    logger -t secubox-identity "Trust: $peer_id $current -> $new ($reason)"
}

# Trust events
trust_valid_signature() {
    trust_adjust "$1" "$TRUST_VALID_SIGNATURE" "valid_signature"
}

trust_invalid_signature() {
    trust_adjust "$1" "$TRUST_INVALID_SIGNATURE" "invalid_signature"
}

trust_successful_exchange() {
    trust_adjust "$1" "$TRUST_SUCCESSFUL_EXCHANGE" "successful_exchange"
}

trust_failed_exchange() {
    trust_adjust "$1" "$TRUST_FAILED_EXCHANGE" "failed_exchange"
}

trust_verified_identity() {
    trust_adjust "$1" "$TRUST_VERIFIED_IDENTITY" "verified_identity"
}

trust_referred_by_trusted() {
    trust_adjust "$1" "$TRUST_REFERRED_BY_TRUSTED" "referred_by_trusted"
}

# Check if peer is trusted
trust_is_trusted() {
    local peer_id="$1"
    local score min_trust

    score=$(trust_get_score "$peer_id")
    min_trust=$(_get_min_trust)

    [ "$score" -ge "$min_trust" ]
}

# Check if peer is banned
trust_is_banned() {
    local peer_id="$1"
    local score ban_threshold

    score=$(trust_get_score "$peer_id")
    ban_threshold=$(_get_ban_threshold)

    [ "$score" -le "$ban_threshold" ]
}

# Get trust level (human readable)
trust_level() {
    local peer_id="$1"
    local score
    score=$(trust_get_score "$peer_id")

    if [ "$score" -ge 80 ]; then
        echo "verified"
    elif [ "$score" -ge 60 ]; then
        echo "trusted"
    elif [ "$score" -ge 40 ]; then
        echo "neutral"
    elif [ "$score" -ge 20 ]; then
        echo "suspicious"
    else
        echo "untrusted"
    fi
}

# List all trust scores
trust_list() {
    cat "$SCORES_FILE"
}

# Get trust history
trust_history() {
    local count="${1:-50}"
    tail -n "$count" "$HISTORY_FILE" 2>/dev/null || echo "[]"
}

# Reset peer trust to initial
trust_reset() {
    local peer_id="$1"
    local initial
    initial=$(_get_initial_score)

    _trust_set_score "$peer_id" "$initial" "reset"
    logger -t secubox-identity "Trust reset for $peer_id"
}

# Ban peer
trust_ban() {
    local peer_id="$1"
    _trust_set_score "$peer_id" "0" "banned"
    logger -t secubox-identity "Peer $peer_id banned"
}

# Get trust summary
trust_summary() {
    local total=0
    local trusted=0
    local neutral=0
    local untrusted=0

    # Count by level (simplified)
    cat <<EOF
{
  "thresholds": {
    "min_trust": $(_get_min_trust),
    "ban": $(_get_ban_threshold)
  },
  "scores": $(cat "$SCORES_FILE")
}
EOF
}

# Initialize on source
trust_init
