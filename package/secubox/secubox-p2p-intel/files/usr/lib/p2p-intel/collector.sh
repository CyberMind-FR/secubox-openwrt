#!/bin/sh
# P2P Intel Collector - Gather IOCs from local security tools

. /lib/functions.sh

INTEL_DIR="/var/lib/p2p-intel"
LOCAL_IOCS="$INTEL_DIR/local-iocs.json"

# Initialize collector
collector_init() {
    mkdir -p "$INTEL_DIR"
    [ -f "$LOCAL_IOCS" ] || echo '[]' > "$LOCAL_IOCS"
}

# IOC severity levels
SEVERITY_CRITICAL=4
SEVERITY_HIGH=3
SEVERITY_MEDIUM=2
SEVERITY_LOW=1

# Map scenario to severity
_scenario_to_severity() {
    local scenario="$1"

    case "$scenario" in
        *bruteforce*|*brute-force*|*credential*|*password*)
            echo "high"
            ;;
        *sql*|*injection*|*xss*|*rce*|*command*)
            echo "critical"
            ;;
        *scan*|*probe*|*enumeration*)
            echo "medium"
            ;;
        *spam*|*bot*|*crawler*)
            echo "low"
            ;;
        *)
            echo "medium"
            ;;
    esac
}

# Collect from CrowdSec
collect_crowdsec() {
    if ! command -v cscli >/dev/null 2>&1; then
        return 0
    fi

    local iocs="[]"

    # Get active decisions
    local decisions
    decisions=$(cscli decisions list -o json 2>/dev/null)

    if [ -z "$decisions" ] || [ "$decisions" = "null" ]; then
        echo "[]"
        return 0
    fi

    local timestamp
    timestamp=$(date +%s)

    local my_did=""
    if [ -f /usr/lib/secubox-identity/core.sh ]; then
        . /usr/lib/secubox-identity/core.sh
        my_did=$(did_get 2>/dev/null)
    fi

    # Parse decisions (simplified - real implementation would use jsonfilter properly)
    echo "$decisions" | jsonfilter -e '@[*]' 2>/dev/null | while read -r decision; do
        local ip scenario duration
        ip=$(echo "$decision" | jsonfilter -e '@.value' 2>/dev/null)
        scenario=$(echo "$decision" | jsonfilter -e '@.scenario' 2>/dev/null)
        duration=$(echo "$decision" | jsonfilter -e '@.duration' 2>/dev/null)

        [ -z "$ip" ] && continue

        local severity
        severity=$(_scenario_to_severity "$scenario")

        cat <<EOF
{
  "type": "ip",
  "value": "$ip",
  "action": "ban",
  "severity": "$severity",
  "source": "crowdsec",
  "scenario": "$scenario",
  "duration": "$duration",
  "collected_at": $timestamp,
  "origin_did": "$my_did"
}
EOF
    done
}

# Collect from mitmproxy threats log
collect_mitmproxy() {
    local threats_log="/srv/mitmproxy/threats.log"

    if [ ! -f "$threats_log" ]; then
        echo "[]"
        return 0
    fi

    local timestamp
    timestamp=$(date +%s)
    local cutoff=$((timestamp - 86400))  # Last 24 hours

    local my_did=""
    if [ -f /usr/lib/secubox-identity/core.sh ]; then
        . /usr/lib/secubox-identity/core.sh
        my_did=$(did_get 2>/dev/null)
    fi

    # Read recent threats
    tail -100 "$threats_log" 2>/dev/null | while read -r line; do
        local ip threat_type ts
        ip=$(echo "$line" | jsonfilter -e '@.client_ip' 2>/dev/null)
        threat_type=$(echo "$line" | jsonfilter -e '@.threat_type' 2>/dev/null)
        ts=$(echo "$line" | jsonfilter -e '@.timestamp' 2>/dev/null)

        [ -z "$ip" ] && continue
        [ -n "$ts" ] && [ "$ts" -lt "$cutoff" ] && continue

        local severity="medium"
        case "$threat_type" in
            *injection*|*xss*|*rce*) severity="critical" ;;
            *scan*|*probe*) severity="low" ;;
        esac

        cat <<EOF
{
  "type": "ip",
  "value": "$ip",
  "action": "ban",
  "severity": "$severity",
  "source": "mitmproxy",
  "scenario": "$threat_type",
  "collected_at": $timestamp,
  "origin_did": "$my_did"
}
EOF
    done
}

# Collect from DNS Guard
collect_dns_guard() {
    local alerts_file="/var/lib/dns-guard/alerts.json"

    if [ ! -f "$alerts_file" ]; then
        echo "[]"
        return 0
    fi

    local timestamp
    timestamp=$(date +%s)

    local my_did=""
    if [ -f /usr/lib/secubox-identity/core.sh ]; then
        . /usr/lib/secubox-identity/core.sh
        my_did=$(did_get 2>/dev/null)
    fi

    jsonfilter -i "$alerts_file" -e '@[*]' 2>/dev/null | while read -r alert; do
        local domain alert_type severity_raw
        domain=$(echo "$alert" | jsonfilter -e '@.domain' 2>/dev/null)
        alert_type=$(echo "$alert" | jsonfilter -e '@.type' 2>/dev/null)
        severity_raw=$(echo "$alert" | jsonfilter -e '@.severity' 2>/dev/null)

        [ -z "$domain" ] && continue

        cat <<EOF
{
  "type": "domain",
  "value": "$domain",
  "action": "block",
  "severity": "${severity_raw:-medium}",
  "source": "dns_guard",
  "scenario": "$alert_type",
  "collected_at": $timestamp,
  "origin_did": "$my_did"
}
EOF
    done
}

# Collect from WAF logs
collect_waf() {
    local waf_log="/var/log/waf-alerts.json"

    if [ ! -f "$waf_log" ]; then
        return 0
    fi

    local timestamp
    timestamp=$(date +%s)

    local my_did=""
    if [ -f /usr/lib/secubox-identity/core.sh ]; then
        . /usr/lib/secubox-identity/core.sh
        my_did=$(did_get 2>/dev/null)
    fi

    tail -50 "$waf_log" 2>/dev/null | while read -r line; do
        local ip rule_id severity_raw
        ip=$(echo "$line" | jsonfilter -e '@.client_ip' 2>/dev/null)
        rule_id=$(echo "$line" | jsonfilter -e '@.rule_id' 2>/dev/null)
        severity_raw=$(echo "$line" | jsonfilter -e '@.severity' 2>/dev/null)

        [ -z "$ip" ] && continue

        cat <<EOF
{
  "type": "ip",
  "value": "$ip",
  "action": "ban",
  "severity": "${severity_raw:-medium}",
  "source": "waf",
  "scenario": "rule_$rule_id",
  "collected_at": $timestamp,
  "origin_did": "$my_did"
}
EOF
    done
}

# Collect all IOCs from enabled sources
collect_all() {
    local crowdsec_enabled mitmproxy_enabled waf_enabled dns_guard_enabled
    crowdsec_enabled=$(uci -q get p2p-intel.sources.crowdsec || echo "1")
    mitmproxy_enabled=$(uci -q get p2p-intel.sources.mitmproxy || echo "1")
    waf_enabled=$(uci -q get p2p-intel.sources.waf || echo "1")
    dns_guard_enabled=$(uci -q get p2p-intel.sources.dns_guard || echo "1")

    local all_iocs="["
    local first=1

    if [ "$crowdsec_enabled" = "1" ]; then
        local cs_iocs
        cs_iocs=$(collect_crowdsec)
        if [ -n "$cs_iocs" ] && [ "$cs_iocs" != "[]" ]; then
            [ "$first" = "1" ] || all_iocs="$all_iocs,"
            all_iocs="$all_iocs$cs_iocs"
            first=0
        fi
    fi

    if [ "$mitmproxy_enabled" = "1" ]; then
        local mp_iocs
        mp_iocs=$(collect_mitmproxy)
        if [ -n "$mp_iocs" ] && [ "$mp_iocs" != "[]" ]; then
            [ "$first" = "1" ] || all_iocs="$all_iocs,"
            all_iocs="$all_iocs$mp_iocs"
            first=0
        fi
    fi

    if [ "$waf_enabled" = "1" ]; then
        local waf_iocs
        waf_iocs=$(collect_waf)
        if [ -n "$waf_iocs" ] && [ "$waf_iocs" != "[]" ]; then
            [ "$first" = "1" ] || all_iocs="$all_iocs,"
            all_iocs="$all_iocs$waf_iocs"
            first=0
        fi
    fi

    if [ "$dns_guard_enabled" = "1" ]; then
        local dg_iocs
        dg_iocs=$(collect_dns_guard)
        if [ -n "$dg_iocs" ] && [ "$dg_iocs" != "[]" ]; then
            [ "$first" = "1" ] || all_iocs="$all_iocs,"
            all_iocs="$all_iocs$dg_iocs"
            first=0
        fi
    fi

    all_iocs="$all_iocs]"

    # Save to local file
    echo "$all_iocs" > "$LOCAL_IOCS"

    echo "$all_iocs"
}

# Get local IOCs
get_local_iocs() {
    if [ -f "$LOCAL_IOCS" ]; then
        cat "$LOCAL_IOCS"
    else
        echo "[]"
    fi
}

# Filter IOCs by minimum severity
filter_by_severity() {
    local min_severity="$1"
    local iocs="$2"

    local min_level=2
    case "$min_severity" in
        critical) min_level=4 ;;
        high) min_level=3 ;;
        medium) min_level=2 ;;
        low) min_level=1 ;;
    esac

    # This would need proper JSON filtering
    echo "$iocs"
}

# Initialize on source
collector_init
