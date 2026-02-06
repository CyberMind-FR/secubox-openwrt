#!/bin/sh
# Config Advisor - Risk Scoring Module

. /lib/functions.sh

SCORE_FILE="/var/lib/config-advisor/score.json"
HISTORY_FILE="/var/lib/config-advisor/score_history.json"

# Get severity weights from config
_get_weight() {
    local severity="$1"
    uci -q get "config-advisor.scoring.weight_$severity" || \
    case "$severity" in
        critical) echo "40" ;;
        high) echo "25" ;;
        medium) echo "20" ;;
        low) echo "10" ;;
        info) echo "5" ;;
        *) echo "0" ;;
    esac
}

# Get passing score threshold
_get_passing_score() {
    uci -q get config-advisor.scoring.passing_score || echo "70"
}

# Calculate security score
scoring_calculate() {
    local results_file="/var/lib/config-advisor/results.json"

    if [ ! -f "$results_file" ]; then
        echo '{"error": "No check results available"}'
        return 1
    fi

    local total_weight=0
    local earned_weight=0
    local critical_fails=0
    local high_fails=0
    local medium_fails=0
    local low_fails=0

    # Read rules file for severity mapping
    local rules_file="/usr/share/config-advisor/anssi-rules.json"

    # Process each result
    while read -r result; do
        [ -z "$result" ] && continue

        local check_id status
        check_id=$(echo "$result" | jsonfilter -e '@.id' 2>/dev/null)
        status=$(echo "$result" | jsonfilter -e '@.status' 2>/dev/null)

        # Get severity from rules
        local severity="medium"
        if [ -f "$rules_file" ]; then
            severity=$(jsonfilter -i "$rules_file" -e '@.categories[*].rules[*]' 2>/dev/null | \
                grep "\"id\":\"$check_id\"" | \
                head -1 | \
                jsonfilter -e '@.severity' 2>/dev/null || echo "medium")
        fi

        local weight
        weight=$(_get_weight "$severity")
        total_weight=$((total_weight + weight))

        if [ "$status" = "pass" ]; then
            earned_weight=$((earned_weight + weight))
        else
            case "$severity" in
                critical) critical_fails=$((critical_fails + 1)) ;;
                high) high_fails=$((high_fails + 1)) ;;
                medium) medium_fails=$((medium_fails + 1)) ;;
                low) low_fails=$((low_fails + 1)) ;;
            esac
        fi
    done < <(jsonfilter -i "$results_file" -e '@[*]' 2>/dev/null)

    # Calculate score (0-100)
    local score=0
    if [ "$total_weight" -gt 0 ]; then
        score=$(echo "scale=0; $earned_weight * 100 / $total_weight" | bc 2>/dev/null || echo "0")
    fi

    # Determine grade
    local grade
    if [ "$score" -ge 90 ]; then
        grade="A"
    elif [ "$score" -ge 80 ]; then
        grade="B"
    elif [ "$score" -ge 70 ]; then
        grade="C"
    elif [ "$score" -ge 60 ]; then
        grade="D"
    else
        grade="F"
    fi

    # Determine risk level
    local risk_level
    if [ "$critical_fails" -gt 0 ]; then
        risk_level="critical"
    elif [ "$high_fails" -gt 0 ]; then
        risk_level="high"
    elif [ "$medium_fails" -gt 0 ]; then
        risk_level="medium"
    elif [ "$low_fails" -gt 0 ]; then
        risk_level="low"
    else
        risk_level="minimal"
    fi

    local timestamp
    timestamp=$(date +%s)

    # Save score
    cat > "$SCORE_FILE" <<EOF
{
  "timestamp": $timestamp,
  "score": $score,
  "grade": "$grade",
  "risk_level": "$risk_level",
  "passing_threshold": $(_get_passing_score),
  "is_passing": $([ "$score" -ge "$(_get_passing_score)" ] && echo "true" || echo "false"),
  "breakdown": {
    "total_weight": $total_weight,
    "earned_weight": $earned_weight,
    "critical_failures": $critical_fails,
    "high_failures": $high_fails,
    "medium_failures": $medium_fails,
    "low_failures": $low_fails
  }
}
EOF

    # Record history
    _record_history "$timestamp" "$score" "$grade" "$risk_level"

    cat "$SCORE_FILE"
}

# Record score history
_record_history() {
    local timestamp="$1"
    local score="$2"
    local grade="$3"
    local risk_level="$4"

    local entry="{\"timestamp\":$timestamp,\"score\":$score,\"grade\":\"$grade\",\"risk_level\":\"$risk_level\"}"

    if [ ! -f "$HISTORY_FILE" ]; then
        echo "[$entry]" > "$HISTORY_FILE"
        return
    fi

    local tmp_file="/tmp/score_history_$$.json"
    if [ "$(cat "$HISTORY_FILE")" = "[]" ]; then
        echo "[$entry]" > "$tmp_file"
    else
        sed 's/]$/,'"$entry"']/' "$HISTORY_FILE" > "$tmp_file"
    fi
    mv "$tmp_file" "$HISTORY_FILE"

    # Keep last 100 entries
    local count
    count=$(jsonfilter -i "$HISTORY_FILE" -e '@[*]' 2>/dev/null | wc -l)
    if [ "$count" -gt 100 ]; then
        jsonfilter -i "$HISTORY_FILE" -e '@[-100:]' > "$tmp_file" 2>/dev/null
        mv "$tmp_file" "$HISTORY_FILE"
    fi
}

# Get current score
scoring_get_score() {
    if [ -f "$SCORE_FILE" ]; then
        cat "$SCORE_FILE"
    else
        echo '{"error": "No score calculated yet"}'
    fi
}

# Get score history
scoring_get_history() {
    local count="${1:-30}"

    if [ -f "$HISTORY_FILE" ]; then
        jsonfilter -i "$HISTORY_FILE" -e "@[-$count:]" 2>/dev/null || echo "[]"
    else
        echo "[]"
    fi
}

# Get score trend
scoring_get_trend() {
    if [ ! -f "$HISTORY_FILE" ]; then
        echo '{"trend": "unknown", "change": 0}'
        return
    fi

    local recent_scores
    recent_scores=$(jsonfilter -i "$HISTORY_FILE" -e '@[-5:].score' 2>/dev/null | tr '\n' ' ')

    local scores_array=($recent_scores)
    local count=${#scores_array[@]}

    if [ "$count" -lt 2 ]; then
        echo '{"trend": "stable", "change": 0}'
        return
    fi

    local first_score=${scores_array[0]}
    local last_score=${scores_array[$((count-1))]}
    local change=$((last_score - first_score))

    local trend
    if [ "$change" -gt 5 ]; then
        trend="improving"
    elif [ "$change" -lt -5 ]; then
        trend="declining"
    else
        trend="stable"
    fi

    echo "{\"trend\": \"$trend\", \"change\": $change, \"samples\": $count}"
}

# Get risk summary
scoring_risk_summary() {
    if [ ! -f "$SCORE_FILE" ]; then
        echo '{"error": "No score available"}'
        return 1
    fi

    local score grade risk_level
    score=$(jsonfilter -i "$SCORE_FILE" -e '@.score' 2>/dev/null)
    grade=$(jsonfilter -i "$SCORE_FILE" -e '@.grade' 2>/dev/null)
    risk_level=$(jsonfilter -i "$SCORE_FILE" -e '@.risk_level' 2>/dev/null)

    local critical high medium low
    critical=$(jsonfilter -i "$SCORE_FILE" -e '@.breakdown.critical_failures' 2>/dev/null)
    high=$(jsonfilter -i "$SCORE_FILE" -e '@.breakdown.high_failures' 2>/dev/null)
    medium=$(jsonfilter -i "$SCORE_FILE" -e '@.breakdown.medium_failures' 2>/dev/null)
    low=$(jsonfilter -i "$SCORE_FILE" -e '@.breakdown.low_failures' 2>/dev/null)

    local trend_info
    trend_info=$(scoring_get_trend)

    cat <<EOF
{
  "score": $score,
  "grade": "$grade",
  "risk_level": "$risk_level",
  "failures": {
    "critical": $critical,
    "high": $high,
    "medium": $medium,
    "low": $low
  },
  "trend": $(echo "$trend_info")
}
EOF
}

# Check if score meets threshold
scoring_is_passing() {
    local threshold
    threshold=$(_get_passing_score)

    local score
    score=$(jsonfilter -i "$SCORE_FILE" -e '@.score' 2>/dev/null || echo "0")

    [ "$score" -ge "$threshold" ]
}
