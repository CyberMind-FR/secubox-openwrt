#!/bin/sh
# SecuBox Auth Monitor - Lightweight auth failure detection
# Monitors SSH and LuCI login failures for CrowdSec
# Copyright (C) 2024 CyberMind.fr

LOG_FILE="/var/log/secubox-auth.log"
LOG_TAG="secubox-auth"

# Ensure log file exists
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# Track recent IPs to avoid duplicate logging
TRACK_FILE="/tmp/auth-monitor-track"
touch "$TRACK_FILE"

log_failure() {
    local service="$1"
    local ip="$2"
    local user="${3:-root}"

    # Avoid duplicate logs within 60 seconds
    local key="${service}:${ip}"
    local now=$(date +%s)

    if grep -q "^${key}:" "$TRACK_FILE" 2>/dev/null; then
        local last=$(grep "^${key}:" "$TRACK_FILE" | cut -d: -f3)
        if [ $((now - last)) -lt 60 ]; then
            return
        fi
        sed -i "/^${key}:/d" "$TRACK_FILE"
    fi
    echo "${key}:${now}" >> "$TRACK_FILE"

    # Log to dedicated file in syslog format for CrowdSec
    local ts=$(date "+%b %d %H:%M:%S")
    local hostname=$(cat /proc/sys/kernel/hostname 2>/dev/null || echo "OpenWrt")
    echo "$ts $hostname $LOG_TAG[$$]: authentication failure for $user from $ip via $service" >> "$LOG_FILE"

    # Also log to syslog for local visibility
    logger -t "$LOG_TAG" -p auth.warning "authentication failure for $user from $ip via $service"
}

# Monitor logread for auth failures
monitor_logs() {
    logread -f 2>/dev/null | while read line; do

        # OpenSSH failures
        # Format: sshd[xxx]: Failed password for root from 1.2.3.4 port xxx
        if echo "$line" | grep -qi "sshd.*failed.*password"; then
            ip=$(echo "$line" | grep -oE 'from [0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | awk '{print $2}')
            user=$(echo "$line" | grep -oE 'for [^ ]+' | awk '{print $2}')
            [ -n "$ip" ] && log_failure "ssh" "$ip" "$user"
        fi

        # OpenSSH invalid user
        # Format: sshd[xxx]: Invalid user xxx from 1.2.3.4
        if echo "$line" | grep -qi "sshd.*invalid.user"; then
            ip=$(echo "$line" | grep -oE 'from [0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | awk '{print $2}')
            user=$(echo "$line" | grep -oE 'user [^ ]+' | awk '{print $2}')
            [ -n "$ip" ] && log_failure "ssh" "$ip" "${user:-unknown}"
        fi

        # Dropbear failures (if ever enabled)
        # Format: dropbear[xxx]: Bad password attempt for 'root' from x.x.x.x:port
        if echo "$line" | grep -qi "dropbear.*bad.password"; then
            ip=$(echo "$line" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1)
            user=$(echo "$line" | grep -oE "for '[^']+'" | tr -d "'" | awk '{print $2}')
            [ -n "$ip" ] && log_failure "ssh" "$ip" "$user"
        fi

        # uhttpd/LuCI - Look for failed POST to login
        # When uhttpd syslog is enabled, failed logins redirect with 302/403
        if echo "$line" | grep -qi "uhttpd.*POST.*/cgi-bin/luci"; then
            ip=$(echo "$line" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1)
            # Check if this is followed by a failure indicator
            if echo "$line" | grep -qE "403|401"; then
                [ -n "$ip" ] && log_failure "luci" "$ip"
            fi
        fi

        # NOTE: rpcd "access denied" is NOT a login attempt - it just means
        # someone accessed LuCI without a valid session (session expired or
        # not logged in). Real login attempts are detected by the JS hook
        # in secubox-auth-hook.js which intercepts session.login calls.

    done
}

# Cleanup old tracking entries (older than 5 minutes)
cleanup_tracking() {
    while true; do
        sleep 300
        local now=$(date +%s)
        local tmp=$(mktemp)
        while read line; do
            local ts=$(echo "$line" | cut -d: -f3)
            if [ $((now - ts)) -lt 300 ]; then
                echo "$line"
            fi
        done < "$TRACK_FILE" > "$tmp"
        mv "$tmp" "$TRACK_FILE"
    done
}

case "$1" in
    start)
        cleanup_tracking &
        monitor_logs
        ;;
    *)
        echo "Usage: $0 start"
        echo "Monitors auth failures and logs to syslog for CrowdSec"
        exit 1
        ;;
esac
