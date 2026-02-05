# SecuBox DNS Guard - Blocklist Management Module
# Copyright (C) 2026 CyberMind.fr
#
# Manages domain blocklists with approval workflow

# =============================================================================
# PENDING BLOCKS QUEUE
# =============================================================================

queue_blocks() {
	local blocks="$1"
	local pending_file="$STATE_DIR/pending_blocks.json"
	local timestamp=$(date -Iseconds)

	# Load existing pending blocks
	local existing='[]'
	[ -f "$pending_file" ] && existing=$(cat "$pending_file")

	# Add new blocks with IDs
	local next_id=1
	if [ -f "$STATE_DIR/block_id_counter" ]; then
		next_id=$(cat "$STATE_DIR/block_id_counter")
	fi

	echo "$blocks" | jsonfilter -e '@[*]' 2>/dev/null | while read -r block; do
		local domain=$(echo "$block" | jsonfilter -e '@.domain' 2>/dev/null)
		local type=$(echo "$block" | jsonfilter -e '@.type' 2>/dev/null)
		local confidence=$(echo "$block" | jsonfilter -e '@.confidence' 2>/dev/null)
		local reason=$(echo "$block" | jsonfilter -e '@.reason' 2>/dev/null)

		# Skip if already pending
		if [ -f "$pending_file" ] && grep -q "\"domain\":\"$domain\"" "$pending_file"; then
			continue
		fi

		# Skip if already blocked
		local blocklist_file=$(uci -q get dns-guard.dnsmasq_blocklist.output_path)
		[ -z "$blocklist_file" ] && blocklist_file="/etc/dnsmasq.d/dns-guard-blocklist.conf"
		if [ -f "$blocklist_file" ] && grep -q "address=/$domain/" "$blocklist_file"; then
			continue
		fi

		printf '{"id":"%d","domain":"%s","type":"%s","confidence":%s,"reason":"%s","created":"%s"}\n' \
			"$next_id" "$domain" "${type:-unknown}" "${confidence:-0}" "$reason" "$timestamp"

		next_id=$((next_id + 1))
	done > "$STATE_DIR/new_pending.tmp"

	echo "$next_id" > "$STATE_DIR/block_id_counter"

	# Merge with existing
	if [ -s "$STATE_DIR/new_pending.tmp" ]; then
		{
			[ "$existing" != "[]" ] && echo "$existing" | jsonfilter -e '@[*]' 2>/dev/null
			cat "$STATE_DIR/new_pending.tmp"
		} | json_slurp > "$pending_file"
	fi

	rm -f "$STATE_DIR/new_pending.tmp"
}

approve_pending_block() {
	local block_id="$1"
	local pending_file="$STATE_DIR/pending_blocks.json"

	[ ! -f "$pending_file" ] && { log_error "No pending blocks"; return 1; }

	# Find the block
	local block=$(jsonfilter -i "$pending_file" -e "@[*]" 2>/dev/null | while read -r b; do
		local id=$(echo "$b" | jsonfilter -e '@.id' 2>/dev/null)
		[ "$id" = "$block_id" ] && { echo "$b"; break; }
	done)

	[ -z "$block" ] && { log_error "Block ID not found: $block_id"; return 1; }

	local domain=$(echo "$block" | jsonfilter -e '@.domain' 2>/dev/null)
	local reason=$(echo "$block" | jsonfilter -e '@.reason' 2>/dev/null)

	# Apply the block
	add_to_blocklist "$domain" "$reason"

	# Remove from pending
	remove_from_pending "$block_id"

	log_info "Approved and applied block for: $domain"
}

approve_all_pending_blocks() {
	local pending_file="$STATE_DIR/pending_blocks.json"

	[ ! -f "$pending_file" ] && { echo "No pending blocks"; return 0; }

	local count=0
	jsonfilter -i "$pending_file" -e '@[*]' 2>/dev/null | while read -r block; do
		local domain=$(echo "$block" | jsonfilter -e '@.domain' 2>/dev/null)
		local reason=$(echo "$block" | jsonfilter -e '@.reason' 2>/dev/null)

		add_to_blocklist "$domain" "$reason"
		count=$((count + 1))
	done

	# Clear pending
	echo '[]' > "$pending_file"

	log_info "Approved all pending blocks ($count domains)"
	reload_dnsmasq
}

reject_pending_block() {
	local block_id="$1"
	remove_from_pending "$block_id"
	log_info "Rejected block ID: $block_id"
}

remove_from_pending() {
	local block_id="$1"
	local pending_file="$STATE_DIR/pending_blocks.json"

	[ ! -f "$pending_file" ] && return

	# Filter out the block
	jsonfilter -i "$pending_file" -e '@[*]' 2>/dev/null | while read -r block; do
		local id=$(echo "$block" | jsonfilter -e '@.id' 2>/dev/null)
		[ "$id" != "$block_id" ] && echo "$block"
	done | json_slurp > "$STATE_DIR/pending_filtered.tmp"

	mv "$STATE_DIR/pending_filtered.tmp" "$pending_file"
}

# =============================================================================
# BLOCKLIST MANAGEMENT
# =============================================================================

apply_blocks() {
	local blocks="$1"

	echo "$blocks" | jsonfilter -e '@[*]' 2>/dev/null | while read -r block; do
		local domain=$(echo "$block" | jsonfilter -e '@.domain' 2>/dev/null)
		local reason=$(echo "$block" | jsonfilter -e '@.reason' 2>/dev/null)

		[ -n "$domain" ] && add_to_blocklist "$domain" "$reason"
	done

	reload_dnsmasq
}

add_to_blocklist() {
	local domain="$1"
	local reason="$2"

	local blocklist_file=$(uci -q get dns-guard.dnsmasq_blocklist.output_path)
	[ -z "$blocklist_file" ] && blocklist_file="/etc/dnsmasq.d/dns-guard-blocklist.conf"

	# Ensure directory exists
	mkdir -p "$(dirname "$blocklist_file")"

	# Skip if already blocked
	if [ -f "$blocklist_file" ] && grep -q "address=/$domain/" "$blocklist_file"; then
		return 0
	fi

	# Add to blocklist with comment
	local timestamp=$(date "+%Y-%m-%d %H:%M")
	{
		echo "# Added: $timestamp - $reason"
		echo "address=/$domain/"
	} >> "$blocklist_file"

	# Also add to threat domains for future reference
	echo "$domain" >> "$STATE_DIR/threat_domains.txt"

	log_info "Blocked domain: $domain"
}

remove_from_blocklist() {
	local domain="$1"

	local blocklist_file=$(uci -q get dns-guard.dnsmasq_blocklist.output_path)
	[ -z "$blocklist_file" ] && blocklist_file="/etc/dnsmasq.d/dns-guard-blocklist.conf"

	[ ! -f "$blocklist_file" ] && return 0

	# Remove domain and its comment
	sed -i "/address=\/$domain\//d" "$blocklist_file"
	sed -i "/# Added:.*$domain/d" "$blocklist_file"

	# Remove from threat domains
	[ -f "$STATE_DIR/threat_domains.txt" ] && \
		sed -i "/^$domain$/d" "$STATE_DIR/threat_domains.txt"

	log_info "Unblocked domain: $domain"
}

reload_dnsmasq() {
	local reload_cmd=$(uci -q get dns-guard.dnsmasq_blocklist.reload_cmd)
	[ -z "$reload_cmd" ] && reload_cmd="/etc/init.d/dnsmasq restart"

	eval "$reload_cmd" >/dev/null 2>&1
}

# =============================================================================
# ADGUARD HOME INTEGRATION (optional)
# =============================================================================

add_to_adguardhome_blocklist() {
	local domain="$1"

	local enabled=$(uci -q get dns-guard.adguardhome_blocklist.enabled)
	[ "$enabled" != "1" ] && return

	local blocklist_file=$(uci -q get dns-guard.adguardhome_blocklist.output_path)
	[ -z "$blocklist_file" ] && blocklist_file="/etc/adguardhome/filters/dns-guard.txt"

	mkdir -p "$(dirname "$blocklist_file")"

	# AdGuard format: ||domain^
	if ! grep -q "||$domain^" "$blocklist_file" 2>/dev/null; then
		echo "||$domain^" >> "$blocklist_file"
	fi
}

reload_adguardhome() {
	local enabled=$(uci -q get dns-guard.adguardhome_blocklist.enabled)
	[ "$enabled" != "1" ] && return

	local reload_cmd=$(uci -q get dns-guard.adguardhome_blocklist.reload_cmd)
	[ -z "$reload_cmd" ] && reload_cmd="killall -HUP AdGuardHome"

	eval "$reload_cmd" >/dev/null 2>&1
}

# =============================================================================
# BLOCKLIST QUERIES
# =============================================================================

get_blocklist() {
	local blocklist_file=$(uci -q get dns-guard.dnsmasq_blocklist.output_path)
	[ -z "$blocklist_file" ] && blocklist_file="/etc/dnsmasq.d/dns-guard-blocklist.conf"

	[ ! -f "$blocklist_file" ] && { echo '[]'; return; }

	grep "^address=" "$blocklist_file" 2>/dev/null | while read -r line; do
		local domain=$(echo "$line" | sed 's/address=\/\([^/]*\)\/.*/\1/')
		printf '{"domain":"%s"}\n' "$domain"
	done | json_slurp
}

get_blocklist_count() {
	local blocklist_file=$(uci -q get dns-guard.dnsmasq_blocklist.output_path)
	[ -z "$blocklist_file" ] && blocklist_file="/etc/dnsmasq.d/dns-guard-blocklist.conf"

	if [ -f "$blocklist_file" ]; then
		grep -c "^address=" "$blocklist_file" 2>/dev/null || echo "0"
	else
		echo "0"
	fi
}

is_domain_blocked() {
	local domain="$1"

	local blocklist_file=$(uci -q get dns-guard.dnsmasq_blocklist.output_path)
	[ -z "$blocklist_file" ] && blocklist_file="/etc/dnsmasq.d/dns-guard-blocklist.conf"

	[ -f "$blocklist_file" ] && grep -q "address=/$domain/" "$blocklist_file" 2>/dev/null
}
