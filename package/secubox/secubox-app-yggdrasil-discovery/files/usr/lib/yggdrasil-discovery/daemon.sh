#!/bin/sh
# Yggdrasil Discovery Daemon
# Periodically announces this node and discovers peers

. /usr/lib/yggdrasil-discovery/core.sh

PIDFILE="/var/run/yggdrasil-discovery.pid"
LOGFILE="/var/log/yggdrasil-discovery.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOGFILE"
    logger -t yggdrasil-discovery "$1"
}

# Check if already running
is_running() {
    [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

# Start daemon
start() {
    if is_running; then
        echo "Daemon already running (PID $(cat "$PIDFILE"))"
        return 1
    fi

    local enabled
    enabled=$(uci -q get yggdrasil-discovery.main.enabled)
    if [ "$enabled" != "1" ]; then
        echo "Yggdrasil discovery is disabled"
        return 1
    fi

    echo $$ > "$PIDFILE"
    log "Daemon started (PID $$)"

    # Main loop
    while true; do
        # Check if Yggdrasil is running
        local ipv6
        ipv6=$(get_ygg_ipv6)

        if [ -z "$ipv6" ]; then
            log "Waiting for Yggdrasil..."
            sleep 30
            continue
        fi

        # Auto-announce if enabled
        local auto_announce
        auto_announce=$(uci -q get yggdrasil-discovery.main.auto_announce)

        if [ "$auto_announce" = "1" ]; then
            log "Announcing node..."
            /usr/sbin/yggctl announce >/dev/null 2>&1
        fi

        # Get announce interval
        local interval
        interval=$(uci -q get yggdrasil-discovery.main.announce_interval)
        interval="${interval:-300}"

        sleep "$interval"
    done
}

# Stop daemon
stop() {
    if [ -f "$PIDFILE" ]; then
        local pid
        pid=$(cat "$PIDFILE")
        kill "$pid" 2>/dev/null
        rm -f "$PIDFILE"
        log "Daemon stopped"
        echo "Daemon stopped"
    else
        echo "Daemon not running"
    fi
}

# Status
status() {
    if is_running; then
        echo "Running (PID $(cat "$PIDFILE"))"
    else
        echo "Stopped"
    fi
}

case "${1:-}" in
    start)
        start &
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 1
        start &
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        ;;
esac
