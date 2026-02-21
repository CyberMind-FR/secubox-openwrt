#!/bin/sh
# ipblocklist-update.sh — SecuBox IP Blocklist Manager
# Pre-emptive static threat defense layer using ipset
# Compatible OpenWrt — uses nftables (fw4) or legacy iptables

. /lib/functions.sh

UCI_CONFIG="ipblocklist"
LOG_FILE="/var/log/ipblocklist.log"
STATE_DIR="/var/lib/ipblocklist"
SAVE_FILE="/etc/ipblocklist/ipset.save"

# Get configuration from UCI
get_config() {
    ENABLED=$(uci -q get "${UCI_CONFIG}.global.enabled" || echo "1")
    IPSET_NAME=$(uci -q get "${UCI_CONFIG}.global.ipset_name" || echo "secubox_blocklist")
    MAX_ENTRIES=$(uci -q get "${UCI_CONFIG}.global.max_entries" || echo "200000")
    WHITELIST_FILE=$(uci -q get "${UCI_CONFIG}.global.whitelist_file" || echo "/etc/ipblocklist/whitelist.txt")
    LOG_DROPS=$(uci -q get "${UCI_CONFIG}.global.log_drops" || echo "1")
}

# Log message with timestamp
log_msg() {
    local level="$1"
    local msg="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $msg" >> "$LOG_FILE"
    [ "$level" = "ERROR" ] && echo "[$level] $msg" >&2
}

# Detect firewall backend
detect_firewall() {
    if [ -f /etc/config/firewall ] && grep -q "fw4" /etc/config/firewall 2>/dev/null; then
        echo "nftables"
    elif command -v nft >/dev/null 2>&1 && nft list tables 2>/dev/null | grep -q "fw4"; then
        echo "nftables"
    elif command -v iptables >/dev/null 2>&1; then
        echo "iptables"
    else
        echo "none"
    fi
}

# Initialize ipset
init_ipset() {
    log_msg "INFO" "Initializing ipset $IPSET_NAME (max $MAX_ENTRIES entries)"

    # Create ipset if it doesn't exist
    if ! ipset list "$IPSET_NAME" >/dev/null 2>&1; then
        ipset create "$IPSET_NAME" hash:net hashsize 65536 maxelem "$MAX_ENTRIES" 2>/dev/null
        if [ $? -ne 0 ]; then
            log_msg "ERROR" "Failed to create ipset $IPSET_NAME"
            return 1
        fi
    fi
    return 0
}

# Flush ipset
flush_ipset() {
    log_msg "INFO" "Flushing ipset $IPSET_NAME"
    ipset flush "$IPSET_NAME" 2>/dev/null || true
}

# Load whitelist into memory for fast lookup
load_whitelist() {
    WHITELIST_PATTERNS=""
    if [ -f "$WHITELIST_FILE" ]; then
        WHITELIST_PATTERNS=$(grep -v '^#' "$WHITELIST_FILE" 2>/dev/null | grep -v '^$' | tr '\n' '|')
        WHITELIST_PATTERNS="${WHITELIST_PATTERNS%|}"  # Remove trailing |
    fi
}

# Check if IP is whitelisted
is_whitelisted() {
    local ip="$1"
    [ -z "$WHITELIST_PATTERNS" ] && return 1
    echo "$ip" | grep -qE "^($WHITELIST_PATTERNS)" && return 0
    return 1
}

# Download and load a single blocklist source
load_source() {
    local url="$1"
    local tmp_file=$(mktemp)
    local count=0
    local skipped=0

    log_msg "INFO" "Downloading blocklist from: $url"

    if wget -q -T 30 -O "$tmp_file" "$url" 2>/dev/null; then
        while IFS= read -r line; do
            # Skip empty lines and comments
            [ -z "$line" ] && continue
            line="${line%%#*}"  # Remove inline comments
            line=$(echo "$line" | tr -d ' \t\r')  # Trim whitespace
            [ -z "$line" ] && continue

            # Validate IP/CIDR format
            echo "$line" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+(/[0-9]+)?$' || continue

            # Check whitelist
            if is_whitelisted "$line"; then
                skipped=$((skipped + 1))
                continue
            fi

            # Add to ipset
            if ipset add "$IPSET_NAME" "$line" 2>/dev/null; then
                count=$((count + 1))
            fi
        done < "$tmp_file"

        log_msg "INFO" "Loaded $count IPs from $url (skipped $skipped whitelisted)"
    else
        log_msg "ERROR" "Failed to download: $url"
    fi

    rm -f "$tmp_file"
    echo "$count"
}

# Load all configured blocklist sources
load_blocklists() {
    local total=0

    load_whitelist

    # Get sources from UCI
    config_load "$UCI_CONFIG"

    # Iterate over sources
    local sources=""
    config_list_foreach "global" "sources" _add_source

    for url in $SOURCES_LIST; do
        local loaded=$(load_source "$url")
        total=$((total + loaded))
    done

    log_msg "INFO" "Total IPs loaded into $IPSET_NAME: $total"
    echo "$total"
}

_add_source() {
    SOURCES_LIST="$SOURCES_LIST $1"
}
SOURCES_LIST=""

# Apply firewall rules to DROP traffic from blocklist
apply_firewall_rules() {
    local fw=$(detect_firewall)

    log_msg "INFO" "Applying firewall rules (backend: $fw)"

    case "$fw" in
        nftables)
            # Check if set exists in nftables
            if ! nft list set inet fw4 "$IPSET_NAME" >/dev/null 2>&1; then
                # Create nftables set that references ipset
                nft add set inet fw4 "$IPSET_NAME" "{ type ipv4_addr; flags interval; }" 2>/dev/null || true
            fi

            # Add rules if not present (check by comment)
            if ! nft list chain inet fw4 input 2>/dev/null | grep -q "secubox_blocklist_drop"; then
                nft insert rule inet fw4 input ip saddr @"$IPSET_NAME" counter drop comment \"secubox_blocklist_drop\" 2>/dev/null || true
            fi
            if ! nft list chain inet fw4 forward 2>/dev/null | grep -q "secubox_blocklist_drop"; then
                nft insert rule inet fw4 forward ip saddr @"$IPSET_NAME" counter drop comment \"secubox_blocklist_drop\" 2>/dev/null || true
            fi

            # Sync ipset to nftables set
            sync_ipset_to_nft
            ;;
        iptables)
            # Add iptables rules if not present
            if ! iptables -C INPUT -m set --match-set "$IPSET_NAME" src -j DROP 2>/dev/null; then
                iptables -I INPUT -m set --match-set "$IPSET_NAME" src -j DROP 2>/dev/null || true
            fi
            if ! iptables -C FORWARD -m set --match-set "$IPSET_NAME" src -j DROP 2>/dev/null; then
                iptables -I FORWARD -m set --match-set "$IPSET_NAME" src -j DROP 2>/dev/null || true
            fi
            ;;
        *)
            log_msg "ERROR" "No supported firewall backend found"
            return 1
            ;;
    esac

    return 0
}

# Sync ipset entries to nftables set (for nftables backend)
sync_ipset_to_nft() {
    # Export ipset to temp file and import to nftables
    local tmp_nft=$(mktemp)

    nft flush set inet fw4 "$IPSET_NAME" 2>/dev/null || true

    ipset list "$IPSET_NAME" 2>/dev/null | grep -E '^[0-9]+\.' | while read -r ip; do
        echo "add element inet fw4 $IPSET_NAME { $ip }" >> "$tmp_nft"
    done

    if [ -s "$tmp_nft" ]; then
        nft -f "$tmp_nft" 2>/dev/null || true
    fi

    rm -f "$tmp_nft"
}

# Remove firewall rules
remove_firewall_rules() {
    local fw=$(detect_firewall)

    log_msg "INFO" "Removing firewall rules"

    case "$fw" in
        nftables)
            # Remove rules by comment
            nft delete rule inet fw4 input handle $(nft -a list chain inet fw4 input 2>/dev/null | grep "secubox_blocklist_drop" | awk '{print $NF}') 2>/dev/null || true
            nft delete rule inet fw4 forward handle $(nft -a list chain inet fw4 forward 2>/dev/null | grep "secubox_blocklist_drop" | awk '{print $NF}') 2>/dev/null || true
            nft delete set inet fw4 "$IPSET_NAME" 2>/dev/null || true
            ;;
        iptables)
            iptables -D INPUT -m set --match-set "$IPSET_NAME" src -j DROP 2>/dev/null || true
            iptables -D FORWARD -m set --match-set "$IPSET_NAME" src -j DROP 2>/dev/null || true
            ;;
    esac
}

# Save ipset for persistence across reboots
save_ipset() {
    log_msg "INFO" "Saving ipset to $SAVE_FILE"
    mkdir -p "$(dirname "$SAVE_FILE")"
    ipset save "$IPSET_NAME" > "$SAVE_FILE" 2>/dev/null
}

# Restore ipset from saved file
restore_ipset() {
    if [ -f "$SAVE_FILE" ]; then
        log_msg "INFO" "Restoring ipset from $SAVE_FILE"
        ipset restore < "$SAVE_FILE" 2>/dev/null || true
        return 0
    fi
    return 1
}

# Get status information
get_status() {
    get_config

    local count=0
    local memory=""

    if ipset list "$IPSET_NAME" >/dev/null 2>&1; then
        count=$(ipset list "$IPSET_NAME" 2>/dev/null | grep -c '^[0-9]' || echo "0")
        memory=$(ipset list "$IPSET_NAME" 2>/dev/null | grep "memsize" | awk '{print $2}')
    fi

    local fw=$(detect_firewall)
    local last_update=$(stat -c %Y "$LOG_FILE" 2>/dev/null || echo "0")

    cat <<EOF
{
    "enabled": "$ENABLED",
    "ipset_name": "$IPSET_NAME",
    "entry_count": $count,
    "max_entries": $MAX_ENTRIES,
    "memory_bytes": "${memory:-0}",
    "firewall_backend": "$fw",
    "last_update": $last_update,
    "whitelist_file": "$WHITELIST_FILE"
}
EOF
}

# Test if an IP would be blocked
test_ip() {
    local ip="$1"
    get_config

    if ipset test "$IPSET_NAME" "$ip" 2>/dev/null; then
        echo "BLOCKED: $ip is in blocklist $IPSET_NAME"
        return 0
    else
        echo "ALLOWED: $ip is not in blocklist"
        return 1
    fi
}

# Main update routine
do_update() {
    get_config

    if [ "$ENABLED" != "1" ]; then
        log_msg "INFO" "IP Blocklist is disabled, skipping update"
        return 0
    fi

    log_msg "INFO" "Starting blocklist update"

    init_ipset || return 1
    flush_ipset
    load_blocklists
    apply_firewall_rules
    save_ipset

    log_msg "INFO" "Blocklist update completed"
}

# Start service
do_start() {
    get_config

    if [ "$ENABLED" != "1" ]; then
        log_msg "INFO" "IP Blocklist is disabled"
        return 0
    fi

    log_msg "INFO" "Starting IP Blocklist service"

    mkdir -p "$STATE_DIR"

    # Try to restore from saved ipset first
    if restore_ipset; then
        apply_firewall_rules
        log_msg "INFO" "Restored ipset from saved state"
    else
        # Full update needed
        do_update
    fi
}

# Stop service
do_stop() {
    get_config

    log_msg "INFO" "Stopping IP Blocklist service"

    save_ipset
    remove_firewall_rules

    # Don't destroy ipset, just remove firewall rules
    # ipset destroy "$IPSET_NAME" 2>/dev/null || true
}

# Print usage
usage() {
    cat <<EOF
Usage: $0 <command> [options]

Commands:
    start       Start the blocklist service (restore or update)
    stop        Stop the blocklist service
    update      Download and apply blocklists
    flush       Remove all IPs from blocklist
    status      Show current status (JSON)
    test <ip>   Test if an IP is blocked
    logs        Show recent log entries
    help        Show this help

EOF
}

# Main entry point
case "$1" in
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    update)
        do_update
        ;;
    flush)
        get_config
        flush_ipset
        save_ipset
        log_msg "INFO" "Blocklist flushed"
        ;;
    status)
        get_status
        ;;
    test)
        test_ip "$2"
        ;;
    logs)
        tail -n "${2:-50}" "$LOG_FILE" 2>/dev/null || echo "No logs available"
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
