#!/bin/sh
# Simple OpenWrt script: detect repeated LuCI failed logins and block offending IPs
# Place this file in /usr/bin or /etc/init.d and run periodically (cron) as root.

THRESHOLD=${THRESHOLD:-5}   # attempts
TAIL_LINES=${TAIL_LINES:-1000}

log() { logger -t auto_block_luci "$@"; }

detect_offenders() {
    log "Scanning logs for failed LuCI logins..."
    # Gather recent failed login lines and extract IPs
    logread | tail -n "$TAIL_LINES" | grep -i "luci: failed login" | awk '{for(i=1;i<=NF;i++) if ($i=="from") print $(i+1)}' | sort | uniq -c | while read -r count ip; do
        if [ -z "$ip" ]; then continue; fi
        if [ "$count" -ge "$THRESHOLD" ]; then
            block_ip "$ip" "$count"
        fi
    done
}

block_ip() {
    ip=$1
    cnt=$2
    log "Detected $cnt failed attempts from $ip; blocking"

    # Check if already blocked by searching existing firewall rules
    exists=$(uci show firewall 2>/dev/null | grep "src_ip='$ip'" || true)
    if [ -n "$exists" ]; then
        log "$ip already blocked (uci rule exists)"
        return
    fi

    # Create persistent UCI firewall rule named auto_block_<ip>
    # UCI section names cannot contain dots, replace with '_'
    name="auto_block_$(echo "$ip" | tr '.' '_')"
    uci set firewall.$name=rule
    uci set firewall.$name.name="auto_block_$ip"
    uci set firewall.$name.src='lan'
    uci set firewall.$name.src_ip="$ip"
    uci set firewall.$name.family='ipv4'
    uci set firewall.$name.target='DROP'
    uci commit firewall
    /etc/init.d/firewall reload

    log "Blocked $ip via UCI firewall rule $name"
}

main() {
    detect_offenders
}

main
