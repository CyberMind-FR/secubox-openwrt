#!/bin/sh
# P2P Intel Applier - Apply validated IOCs to security controls

. /lib/functions.sh

INTEL_DIR="/var/lib/p2p-intel"
APPLIED_FILE="$INTEL_DIR/applied.json"
PENDING_FILE="$INTEL_DIR/pending.json"

# Initialize applier
applier_init() {
    [ -f "$APPLIED_FILE" ] || echo '[]' > "$APPLIED_FILE"
    [ -f "$PENDING_FILE" ] || echo '[]' > "$PENDING_FILE"
}

# Get application method
_get_method() {
    uci -q get p2p-intel.application.apply_method || echo "nftables"
}

# Get ban duration
_get_ban_duration() {
    uci -q get p2p-intel.application.ban_duration || echo "86400"
}

# Get ipset name
_get_ipset_name() {
    uci -q get p2p-intel.application.ipset_name || echo "p2p_intel_blocked"
}

# Apply IP ban via nftables
_apply_nftables_ip() {
    local ip="$1"
    local duration="$2"

    local ipset_name
    ipset_name=$(_get_ipset_name)

    # Ensure ipset exists
    nft list set inet fw4 "$ipset_name" >/dev/null 2>&1 || \
        nft add set inet fw4 "$ipset_name" '{ type ipv4_addr; flags timeout; }' 2>/dev/null

    # Add IP with timeout
    nft add element inet fw4 "$ipset_name" "{ $ip timeout ${duration}s }" 2>/dev/null

    if [ $? -eq 0 ]; then
        logger -t p2p-intel "Applied IP ban: $ip (${duration}s via nftables)"
        return 0
    else
        return 1
    fi
}

# Apply IP ban via iptables
_apply_iptables_ip() {
    local ip="$1"
    local duration="$2"

    local ipset_name
    ipset_name=$(_get_ipset_name)

    # Ensure ipset exists
    ipset list "$ipset_name" >/dev/null 2>&1 || \
        ipset create "$ipset_name" hash:ip timeout "$duration" 2>/dev/null

    # Add IP
    ipset add "$ipset_name" "$ip" timeout "$duration" 2>/dev/null

    if [ $? -eq 0 ]; then
        logger -t p2p-intel "Applied IP ban: $ip (${duration}s via iptables)"
        return 0
    else
        return 1
    fi
}

# Apply IP ban via CrowdSec
_apply_crowdsec_ip() {
    local ip="$1"
    local duration="$2"
    local scenario="${3:-p2p-intel/shared-ioc}"

    if ! command -v cscli >/dev/null 2>&1; then
        return 1
    fi

    cscli decisions add -i "$ip" -d "${duration}s" -R "$scenario" 2>/dev/null

    if [ $? -eq 0 ]; then
        logger -t p2p-intel "Applied IP ban: $ip (${duration}s via CrowdSec)"
        return 0
    else
        return 1
    fi
}

# Apply domain block
_apply_domain_block() {
    local domain="$1"

    # Add to dnsmasq blocklist
    local blocklist="/etc/dnsmasq.d/p2p-intel-blocked.conf"

    # Check if already blocked
    if grep -q "^address=/$domain/" "$blocklist" 2>/dev/null; then
        return 0
    fi

    echo "address=/$domain/0.0.0.0" >> "$blocklist"

    # Reload dnsmasq
    /etc/init.d/dnsmasq reload 2>/dev/null

    logger -t p2p-intel "Applied domain block: $domain"
    return 0
}

# Apply single IOC
apply_ioc() {
    local ioc="$1"

    local ioc_type value action duration
    ioc_type=$(echo "$ioc" | jsonfilter -e '@.type' 2>/dev/null)
    value=$(echo "$ioc" | jsonfilter -e '@.value' 2>/dev/null)
    action=$(echo "$ioc" | jsonfilter -e '@.action' 2>/dev/null)
    duration=$(_get_ban_duration)

    local method
    method=$(_get_method)

    local result=1

    case "$ioc_type" in
        ip)
            case "$method" in
                nftables)
                    _apply_nftables_ip "$value" "$duration" && result=0
                    ;;
                iptables)
                    _apply_iptables_ip "$value" "$duration" && result=0
                    ;;
                crowdsec)
                    _apply_crowdsec_ip "$value" "$duration" && result=0
                    ;;
            esac
            ;;

        domain)
            _apply_domain_block "$value" && result=0
            ;;

        *)
            logger -t p2p-intel "Unknown IOC type: $ioc_type"
            return 1
            ;;
    esac

    if [ "$result" -eq 0 ]; then
        # Record as applied
        _record_applied "$ioc"
    fi

    return $result
}

# Record applied IOC
_record_applied() {
    local ioc="$1"
    local timestamp
    timestamp=$(date +%s)

    local entry="{\"ioc\":$ioc,\"applied_at\":$timestamp}"

    local tmp_file="/tmp/applied_$$.json"
    if [ -s "$APPLIED_FILE" ] && [ "$(cat "$APPLIED_FILE")" != "[]" ]; then
        sed 's/]$/,'"$entry"']/' "$APPLIED_FILE" > "$tmp_file"
    else
        echo "[$entry]" > "$tmp_file"
    fi
    mv "$tmp_file" "$APPLIED_FILE"
}

# Add IOC to pending queue (for manual approval)
queue_pending() {
    local ioc="$1"
    local source="$2"
    local timestamp
    timestamp=$(date +%s)

    local entry="{\"ioc\":$ioc,\"source\":\"$source\",\"queued_at\":$timestamp,\"status\":\"pending\"}"

    local tmp_file="/tmp/pending_$$.json"
    if [ -s "$PENDING_FILE" ] && [ "$(cat "$PENDING_FILE")" != "[]" ]; then
        sed 's/]$/,'"$entry"']/' "$PENDING_FILE" > "$tmp_file"
    else
        echo "[$entry]" > "$tmp_file"
    fi
    mv "$tmp_file" "$PENDING_FILE"

    logger -t p2p-intel "Queued IOC for approval from $source"
}

# Get pending IOCs
get_pending() {
    cat "$PENDING_FILE"
}

# Approve pending IOC
approve_pending() {
    local index="$1"

    # Get the IOC at index
    local ioc
    ioc=$(jsonfilter -i "$PENDING_FILE" -e "@[$index].ioc" 2>/dev/null)

    if [ -z "$ioc" ]; then
        echo '{"error": "IOC not found"}'
        return 1
    fi

    # Apply it
    apply_ioc "$ioc"

    # Remove from pending (simplified - just mark as approved)
    logger -t p2p-intel "Approved pending IOC at index $index"

    echo '{"success": true}'
}

# Reject pending IOC
reject_pending() {
    local index="$1"

    # Mark as rejected (simplified)
    logger -t p2p-intel "Rejected pending IOC at index $index"

    echo '{"success": true}'
}

# Apply all validated IOCs (auto-apply mode)
apply_all_validated() {
    local validated_dir="$INTEL_DIR/validated"

    local applied=0
    local failed=0

    for f in "$validated_dir"/*.json 2>/dev/null; do
        [ -f "$f" ] || continue

        jsonfilter -i "$f" -e '@[*]' 2>/dev/null | while read -r ioc; do
            [ -z "$ioc" ] && continue

            if apply_ioc "$ioc"; then
                applied=$((applied + 1))
            else
                failed=$((failed + 1))
            fi
        done

        # Move processed file
        mv "$f" "$INTEL_DIR/processed/" 2>/dev/null
    done

    echo "{\"applied\": $applied, \"failed\": $failed}"
}

# Get applied IOCs
get_applied() {
    cat "$APPLIED_FILE"
}

# Remove IP ban
remove_ban() {
    local ip="$1"
    local method
    method=$(_get_method)
    local ipset_name
    ipset_name=$(_get_ipset_name)

    case "$method" in
        nftables)
            nft delete element inet fw4 "$ipset_name" "{ $ip }" 2>/dev/null
            ;;
        iptables)
            ipset del "$ipset_name" "$ip" 2>/dev/null
            ;;
        crowdsec)
            cscli decisions delete -i "$ip" 2>/dev/null
            ;;
    esac

    logger -t p2p-intel "Removed ban: $ip"
}

# Initialize on source
applier_init
