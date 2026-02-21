#!/bin/sh
# crowdsec-reporter.sh — SecuBox AbuseIPDB Reporter
# Reports CrowdSec blocked IPs to AbuseIPDB community database
# Inspired by SysWarden reporter pattern — shell version for OpenWrt

ABUSEIPDB_API_URL="https://api.abuseipdb.com/api/v2/report"
ABUSEIPDB_CHECK_URL="https://api.abuseipdb.com/api/v2/check"
UCI_CONFIG="crowdsec_abuseipdb"
LOG_FILE="/var/log/crowdsec-reporter.log"
STATE_DIR="/var/lib/crowdsec-reporter"
REPORTED_FILE="${STATE_DIR}/reported.txt"

# Load configuration from UCI
load_config() {
    ENABLED=$(uci -q get "${UCI_CONFIG}.global.enabled" || echo "0")
    API_KEY=$(uci -q get "${UCI_CONFIG}.global.api_key" || echo "")
    CONFIDENCE_THRESHOLD=$(uci -q get "${UCI_CONFIG}.global.confidence_threshold" || echo "80")
    CATEGORIES=$(uci -q get "${UCI_CONFIG}.global.categories" || echo "18,21")
    MAX_REPORTS=$(uci -q get "${UCI_CONFIG}.global.max_reports_per_run" || echo "50")
    COOLDOWN_MINUTES=$(uci -q get "${UCI_CONFIG}.global.cooldown_minutes" || echo "15")
    COMMENT_PREFIX=$(uci -q get "${UCI_CONFIG}.global.comment_prefix" || echo "Blocked by SecuBox CrowdSec")
}

# Log message with timestamp
log_msg() {
    local level="$1"
    local msg="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $msg" >> "$LOG_FILE"
    [ "$level" = "ERROR" ] && echo "[$level] $msg" >&2
}

# Initialize state directory
init_state() {
    mkdir -p "$STATE_DIR"
    touch "$REPORTED_FILE"

    # Rotate old reported entries (keep 7 days)
    if [ -f "$REPORTED_FILE" ]; then
        local cutoff=$(date -d "7 days ago" +%s 2>/dev/null || date -D "%s" -d "$(( $(date +%s) - 604800 ))" +%s 2>/dev/null || echo "0")
        local tmp=$(mktemp)
        while IFS='|' read -r ip timestamp; do
            [ -n "$timestamp" ] && [ "$timestamp" -gt "$cutoff" ] 2>/dev/null && echo "$ip|$timestamp"
        done < "$REPORTED_FILE" > "$tmp"
        mv "$tmp" "$REPORTED_FILE"
    fi
}

# Check if IP was recently reported (cooldown)
is_recently_reported() {
    local ip="$1"
    local now=$(date +%s)
    local cooldown_seconds=$((COOLDOWN_MINUTES * 60))

    if grep -q "^${ip}|" "$REPORTED_FILE" 2>/dev/null; then
        local last_report=$(grep "^${ip}|" "$REPORTED_FILE" | tail -1 | cut -d'|' -f2)
        if [ -n "$last_report" ]; then
            local elapsed=$((now - last_report))
            [ "$elapsed" -lt "$cooldown_seconds" ] && return 0
        fi
    fi
    return 1
}

# Mark IP as reported
mark_reported() {
    local ip="$1"
    local now=$(date +%s)

    # Remove old entry for this IP
    local tmp=$(mktemp)
    grep -v "^${ip}|" "$REPORTED_FILE" > "$tmp" 2>/dev/null || true
    mv "$tmp" "$REPORTED_FILE"

    # Add new entry
    echo "${ip}|${now}" >> "$REPORTED_FILE"
}

# Get recent CrowdSec decisions
get_recent_decisions() {
    if command -v cscli >/dev/null 2>&1; then
        # Get decisions from last hour with high confidence
        cscli decisions list --output json 2>/dev/null | \
            jsonfilter -e '@[*]' 2>/dev/null | while read -r decision; do
                local ip=$(echo "$decision" | jsonfilter -e '@.value' 2>/dev/null)
                local scope=$(echo "$decision" | jsonfilter -e '@.scope' 2>/dev/null)
                local scenario=$(echo "$decision" | jsonfilter -e '@.scenario' 2>/dev/null)

                # Only report IP-scoped decisions
                [ "$scope" = "Ip" ] && [ -n "$ip" ] && echo "$ip|$scenario"
            done
    else
        # Fallback: parse CrowdSec logs
        if [ -f /var/log/crowdsec.log ]; then
            grep -h "ban" /var/log/crowdsec.log 2>/dev/null | \
                grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort -u | \
                while read -r ip; do
                    echo "$ip|unknown"
                done
        fi
    fi
}

# Report single IP to AbuseIPDB
report_ip() {
    local ip="$1"
    local scenario="$2"

    # Skip if no API key
    [ -z "$API_KEY" ] && return 1

    # Skip if recently reported
    if is_recently_reported "$ip"; then
        log_msg "DEBUG" "Skipping $ip (cooldown active)"
        return 0
    fi

    # Skip private/local IPs
    case "$ip" in
        10.*|172.16.*|172.17.*|172.18.*|172.19.*|172.20.*|172.21.*|172.22.*|172.23.*|172.24.*|172.25.*|172.26.*|172.27.*|172.28.*|172.29.*|172.30.*|172.31.*|192.168.*|127.*|0.*)
            log_msg "DEBUG" "Skipping private IP: $ip"
            return 0
            ;;
    esac

    # Build comment with scenario info
    local comment="${COMMENT_PREFIX}"
    [ -n "$scenario" ] && [ "$scenario" != "unknown" ] && comment="${comment} - ${scenario}"
    comment=$(echo "$comment" | sed 's/ /+/g; s/[^a-zA-Z0-9+_-]//g')

    # Make API request
    local response
    response=$(wget -q -O- \
        --header="Key: ${API_KEY}" \
        --header="Accept: application/json" \
        --post-data="ip=${ip}&categories=${CATEGORIES}&comment=${comment}" \
        "$ABUSEIPDB_API_URL" 2>/dev/null)

    if echo "$response" | grep -q '"abuseConfidenceScore"'; then
        local score=$(echo "$response" | jsonfilter -e '@.data.abuseConfidenceScore' 2>/dev/null || echo "?")
        mark_reported "$ip"
        log_msg "INFO" "Reported $ip to AbuseIPDB (score: $score)"
        return 0
    else
        local error=$(echo "$response" | jsonfilter -e '@.errors[0].detail' 2>/dev/null || echo "Unknown error")
        log_msg "ERROR" "Failed to report $ip: $error"
        return 1
    fi
}

# Check IP reputation on AbuseIPDB
check_ip() {
    local ip="$1"

    [ -z "$API_KEY" ] && echo '{"error":"No API key configured"}' && return 1

    local response
    response=$(wget -q -O- \
        --header="Key: ${API_KEY}" \
        --header="Accept: application/json" \
        "${ABUSEIPDB_CHECK_URL}?ipAddress=${ip}&maxAgeInDays=90" 2>/dev/null)

    echo "$response"
}

# Update statistics in UCI
update_stats() {
    local reported="$1"

    # Get current stats
    local today=$(uci -q get "${UCI_CONFIG}.stats.reported_today" || echo "0")
    local week=$(uci -q get "${UCI_CONFIG}.stats.reported_week" || echo "0")
    local total=$(uci -q get "${UCI_CONFIG}.stats.reported_total" || echo "0")

    # Update counters
    today=$((today + reported))
    week=$((week + reported))
    total=$((total + reported))

    uci set "${UCI_CONFIG}.stats.reported_today=$today"
    uci set "${UCI_CONFIG}.stats.reported_week=$week"
    uci set "${UCI_CONFIG}.stats.reported_total=$total"
    uci set "${UCI_CONFIG}.stats.last_report=$(date +%s)"
    uci commit "$UCI_CONFIG"
}

# Reset daily stats (called by cron at midnight)
reset_daily_stats() {
    uci set "${UCI_CONFIG}.stats.reported_today=0"
    uci commit "$UCI_CONFIG"
    log_msg "INFO" "Daily stats reset"
}

# Reset weekly stats (called by cron on Monday)
reset_weekly_stats() {
    uci set "${UCI_CONFIG}.stats.reported_week=0"
    uci commit "$UCI_CONFIG"
    log_msg "INFO" "Weekly stats reset"
}

# Main reporting routine
do_report() {
    load_config

    if [ "$ENABLED" != "1" ]; then
        log_msg "INFO" "AbuseIPDB reporter is disabled"
        return 0
    fi

    if [ -z "$API_KEY" ]; then
        log_msg "ERROR" "No API key configured"
        return 1
    fi

    init_state

    log_msg "INFO" "Starting AbuseIPDB reporting run"

    local reported=0
    local skipped=0

    get_recent_decisions | head -n "$MAX_REPORTS" | while IFS='|' read -r ip scenario; do
        [ -z "$ip" ] && continue

        if report_ip "$ip" "$scenario"; then
            reported=$((reported + 1))
        else
            skipped=$((skipped + 1))
        fi

        # Rate limiting - small delay between requests
        sleep 1
    done

    # Count actually reported (from subshell issue, re-count)
    reported=$(grep "$(date '+%Y-%m-%d')" "$LOG_FILE" 2>/dev/null | grep -c "Reported.*to AbuseIPDB" || echo "0")

    update_stats "$reported"
    log_msg "INFO" "Reporting run completed: $reported IPs reported"
}

# Get status for RPCD
get_status() {
    load_config

    local reported_today=$(uci -q get "${UCI_CONFIG}.stats.reported_today" || echo "0")
    local reported_week=$(uci -q get "${UCI_CONFIG}.stats.reported_week" || echo "0")
    local reported_total=$(uci -q get "${UCI_CONFIG}.stats.reported_total" || echo "0")
    local last_report=$(uci -q get "${UCI_CONFIG}.stats.last_report" || echo "0")
    local pending=$(get_recent_decisions 2>/dev/null | wc -l || echo "0")

    cat <<EOF
{
    "enabled": $( [ "$ENABLED" = "1" ] && echo "true" || echo "false" ),
    "api_key_configured": $( [ -n "$API_KEY" ] && echo "true" || echo "false" ),
    "confidence_threshold": $CONFIDENCE_THRESHOLD,
    "categories": "$CATEGORIES",
    "cooldown_minutes": $COOLDOWN_MINUTES,
    "reported_today": $reported_today,
    "reported_week": $reported_week,
    "reported_total": $reported_total,
    "last_report": $last_report,
    "pending_ips": $pending
}
EOF
}

# Get recent report history
get_history() {
    local lines="${1:-20}"

    echo '{"history":['
    local first=1

    grep "Reported.*to AbuseIPDB" "$LOG_FILE" 2>/dev/null | tail -n "$lines" | while IFS= read -r line; do
        local timestamp=$(echo "$line" | cut -d' ' -f1-2)
        local ip=$(echo "$line" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')
        local score=$(echo "$line" | grep -oE 'score: [0-9]+' | cut -d' ' -f2)

        [ $first -eq 0 ] && echo ","
        first=0

        echo "{\"timestamp\":\"$timestamp\",\"ip\":\"$ip\",\"score\":\"${score:-?}\"}"
    done

    echo ']}'
}

# Print usage
usage() {
    cat <<EOF
Usage: $0 <command> [options]

Commands:
    report          Run reporting cycle (report CrowdSec decisions to AbuseIPDB)
    check <ip>      Check IP reputation on AbuseIPDB
    status          Show reporter status (JSON)
    history [n]     Show last n reports (default: 20)
    logs [n]        Show last n log lines (default: 50)
    reset-daily     Reset daily stats counter
    reset-weekly    Reset weekly stats counter
    enable          Enable the reporter
    disable         Disable the reporter
    set-key <key>   Set AbuseIPDB API key
    help            Show this help

EOF
}

# Main entry point
case "$1" in
    report)
        do_report
        ;;
    check)
        [ -z "$2" ] && echo "Usage: $0 check <ip>" && exit 1
        load_config
        check_ip "$2"
        ;;
    status)
        get_status
        ;;
    history)
        get_history "${2:-20}"
        ;;
    logs)
        tail -n "${2:-50}" "$LOG_FILE" 2>/dev/null || echo "No logs available"
        ;;
    reset-daily)
        reset_daily_stats
        ;;
    reset-weekly)
        reset_weekly_stats
        ;;
    enable)
        uci set "${UCI_CONFIG}.global.enabled=1"
        uci commit "$UCI_CONFIG"
        echo "AbuseIPDB reporter enabled"
        ;;
    disable)
        uci set "${UCI_CONFIG}.global.enabled=0"
        uci commit "$UCI_CONFIG"
        echo "AbuseIPDB reporter disabled"
        ;;
    set-key)
        [ -z "$2" ] && echo "Usage: $0 set-key <api_key>" && exit 1
        uci set "${UCI_CONFIG}.global.api_key=$2"
        uci commit "$UCI_CONFIG"
        echo "API key configured"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        usage
        exit 1
        ;;
esac

exit 0
