#!/bin/sh
# Mirror setup for passive DPI using tc mirred
# Creates a TAP interface and mirrors traffic from source interface

. /lib/functions.sh

config_load dpi-dual

TAP_IF=""
MIRROR_SRC=""
MIRROR_MODE=""

load_config() {
    config_get TAP_IF tap interface "tap0"
    config_get MIRROR_SRC tap mirror_source "eth0"
    config_get MIRROR_MODE tap mirror_mode "software"
}

create_tap_interface() {
    echo "Creating TAP interface: $TAP_IF"

    # Remove if exists
    ip link show "$TAP_IF" >/dev/null 2>&1 && ip link del "$TAP_IF"

    # Create dummy interface for receiving mirrored packets
    ip link add name "$TAP_IF" type dummy
    ip link set "$TAP_IF" up

    # Set promiscuous mode
    ip link set "$TAP_IF" promisc on

    echo "TAP interface $TAP_IF created"
}

setup_mirror_ingress() {
    echo "Setting up ingress mirror: $MIRROR_SRC -> $TAP_IF"

    # Add ingress qdisc if not exists
    tc qdisc show dev "$MIRROR_SRC" | grep -q "ingress" || \
        tc qdisc add dev "$MIRROR_SRC" handle ffff: ingress

    # Mirror all ingress traffic to TAP
    tc filter add dev "$MIRROR_SRC" parent ffff: protocol all prio 1 \
        u32 match u32 0 0 \
        action mirred egress mirror dev "$TAP_IF"

    echo "Ingress mirror configured"
}

setup_mirror_egress() {
    echo "Setting up egress mirror: $MIRROR_SRC -> $TAP_IF"

    # Add root qdisc for egress if not exists
    tc qdisc show dev "$MIRROR_SRC" | grep -q "prio" || \
        tc qdisc add dev "$MIRROR_SRC" handle 1: root prio

    # Mirror all egress traffic to TAP
    tc filter add dev "$MIRROR_SRC" parent 1: protocol all prio 1 \
        u32 match u32 0 0 \
        action mirred egress mirror dev "$TAP_IF"

    echo "Egress mirror configured"
}

cleanup_mirror() {
    echo "Cleaning up mirror configuration for $MIRROR_SRC"

    # Remove ingress qdisc
    tc qdisc del dev "$MIRROR_SRC" handle ffff: ingress 2>/dev/null

    # Remove root qdisc (careful - this removes all tc config)
    tc qdisc del dev "$MIRROR_SRC" root 2>/dev/null

    echo "Mirror cleanup done"
}

remove_tap_interface() {
    echo "Removing TAP interface: $TAP_IF"
    ip link del "$TAP_IF" 2>/dev/null
    echo "TAP interface removed"
}

status() {
    echo "=== TAP Interface ==="
    if ip link show "$TAP_IF" >/dev/null 2>&1; then
        ip -s link show "$TAP_IF"
    else
        echo "TAP interface $TAP_IF not found"
    fi

    echo ""
    echo "=== Mirror Source: $MIRROR_SRC ==="
    echo "Ingress qdisc:"
    tc qdisc show dev "$MIRROR_SRC" | grep ingress || echo "  (none)"
    echo "Ingress filters:"
    tc filter show dev "$MIRROR_SRC" parent ffff: 2>/dev/null || echo "  (none)"

    echo ""
    echo "Egress qdisc:"
    tc qdisc show dev "$MIRROR_SRC" | grep -v ingress || echo "  (none)"
    echo "Egress filters:"
    tc filter show dev "$MIRROR_SRC" parent 1: 2>/dev/null || echo "  (none)"
}

start() {
    load_config

    if [ "$MIRROR_MODE" = "hardware" ]; then
        echo "Hardware TAP mode - configure switch port mirroring manually"
        echo "TAP interface: $TAP_IF"
        return 0
    fi

    # Software mirroring with tc mirred
    create_tap_interface
    setup_mirror_ingress
    setup_mirror_egress

    echo ""
    echo "Mirror setup complete:"
    echo "  Source: $MIRROR_SRC"
    echo "  TAP: $TAP_IF"
    echo "  Mode: $MIRROR_MODE"
}

stop() {
    load_config

    cleanup_mirror
    remove_tap_interface

    echo "Mirror stopped"
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 1
        start
        ;;
    status)
        load_config
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
