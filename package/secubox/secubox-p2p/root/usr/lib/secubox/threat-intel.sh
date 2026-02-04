#!/bin/sh
# SecuBox Threat Intelligence - Decentralized IOC Sharing via P2P Mesh
# Shares CrowdSec bans and mitmproxy detections between mesh nodes
# IOCs propagate via the existing blockchain chain + gossip sync
# Copyright 2026 CyberMind - Licensed under MIT

# Source mesh and factory libraries (suppress case-statement output)
. /usr/lib/secubox/p2p-mesh.sh >/dev/null 2>/dev/null
. /usr/lib/secubox/factory.sh >/dev/null 2>/dev/null

# ============================================================================
# Chain helper (fixes single-line JSON append in p2p-mesh.sh)
# ============================================================================
_ti_chain_add_block() {
	local block_type="$1"
	local block_data="$2"
	local block_hash="$3"

	local prev_hash=$(chain_get_hash)
	local index=$(jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*]' | wc -l)
	local timestamp=$(date +%s)
	local node_id=$(cat "$NODE_ID_FILE")

	local block_record="{\"index\":$index,\"timestamp\":$timestamp,\"type\":\"$block_type\",\"hash\":\"$block_hash\",\"prev_hash\":\"$prev_hash\",\"node\":\"$node_id\",\"data\":$block_data}"

	# Strip trailing ] } from LAST LINE only (avoids corrupting block data)
	local tmp_chain="$MESH_DIR/tmp/chain_$$.json"
	sed '$ s/ *\] *} *$//' "$CHAIN_FILE" > "$tmp_chain"
	echo ", $block_record ] }" >> "$tmp_chain"
	mv "$tmp_chain" "$CHAIN_FILE"

	echo "$block_hash"
}

# ============================================================================
# Configuration
# ============================================================================
TI_DIR="/var/lib/secubox/threat-intel"
IOC_LOCAL="$TI_DIR/iocs-local.json"
IOC_RECEIVED="$TI_DIR/iocs-received.json"
IOC_APPLIED="$TI_DIR/iocs-applied.json"
TI_PROCESSED="$TI_DIR/processed-blocks.list"
TI_WHITELIST="$TI_DIR/whitelist.list"
TI_LOCK="/tmp/secubox-threat-intel.lock"

# UCI defaults
TI_ENABLED="1"
TI_AUTO_APPLY="1"
TI_APPLY_TRANSITIVE="1"
TI_MIN_SEVERITY="high"
TI_COLLECT_INTERVAL="900"
TI_MAX_BATCH="20"
TI_IOC_TTL="86400"

# ============================================================================
# Initialization
# ============================================================================
ti_init() {
	mkdir -p "$TI_DIR"

	# Load UCI config
	TI_ENABLED=$(uci -q get secubox-p2p.threat_intel.enabled || echo "1")
	TI_AUTO_APPLY=$(uci -q get secubox-p2p.threat_intel.auto_apply || echo "1")
	TI_APPLY_TRANSITIVE=$(uci -q get secubox-p2p.threat_intel.apply_transitive || echo "1")
	TI_MIN_SEVERITY=$(uci -q get secubox-p2p.threat_intel.min_severity || echo "high")
	TI_COLLECT_INTERVAL=$(uci -q get secubox-p2p.threat_intel.collect_interval || echo "900")
	TI_MAX_BATCH=$(uci -q get secubox-p2p.threat_intel.max_iocs_per_batch || echo "20")
	TI_IOC_TTL=$(uci -q get secubox-p2p.threat_intel.ioc_ttl || echo "86400")

	# Initialize JSON files if missing
	[ -f "$IOC_LOCAL" ] || echo '[]' > "$IOC_LOCAL"
	[ -f "$IOC_RECEIVED" ] || echo '[]' > "$IOC_RECEIVED"
	[ -f "$IOC_APPLIED" ] || echo '[]' > "$IOC_APPLIED"
	[ -f "$TI_PROCESSED" ] || touch "$TI_PROCESSED"
	[ -f "$TI_WHITELIST" ] || touch "$TI_WHITELIST"
}

# ============================================================================
# Severity Helpers
# ============================================================================
_severity_rank() {
	case "$1" in
		critical) echo 4 ;;
		high)     echo 3 ;;
		medium)   echo 2 ;;
		low)      echo 1 ;;
		*)        echo 0 ;;
	esac
}

_severity_meets_min() {
	local sev="$1"
	local min="$2"
	local sev_rank=$(_severity_rank "$sev")
	local min_rank=$(_severity_rank "$min")
	[ "$sev_rank" -ge "$min_rank" ]
}

# ============================================================================
# Collection - CrowdSec
# ============================================================================
ti_collect_crowdsec() {
	command -v cscli >/dev/null 2>&1 || return 0

	local now=$(date +%s)
	local node_id=$(cat "$NODE_ID_FILE" 2>/dev/null || echo "unknown")
	local decisions

	decisions=$(cscli decisions list -o json 2>/dev/null)
	[ -z "$decisions" ] && return 0

	# Parse decisions - each is an IP ban with scenario and duration
	local count=0
	local iocs="["
	local first=1

	echo "$decisions" | jsonfilter -e '@[*]' 2>/dev/null | while read -r decision; do
		local ip=$(echo "$decision" | jsonfilter -e '@.value' 2>/dev/null)
		local scenario=$(echo "$decision" | jsonfilter -e '@.scenario' 2>/dev/null)
		local duration=$(echo "$decision" | jsonfilter -e '@.duration' 2>/dev/null)

		[ -z "$ip" ] && continue

		# Skip whitelisted IPs
		grep -q "^${ip}$" "$TI_WHITELIST" 2>/dev/null && continue

		# Determine severity from scenario
		local severity="high"
		case "$scenario" in
			*brute*|*exploit*|*scan*)  severity="critical" ;;
			*crawl*|*probe*)          severity="high" ;;
			*bad-user-agent*)         severity="medium" ;;
		esac

		# Normalize duration to seconds
		local dur_secs="$TI_IOC_TTL"
		case "$duration" in
			*h) dur_secs=$(echo "$duration" | sed 's/h//' | awk '{print $1 * 3600}') ;;
			*m) dur_secs=$(echo "$duration" | sed 's/m//' | awk '{print $1 * 60}') ;;
			*s) dur_secs=$(echo "$duration" | sed 's/s//') ;;
		esac
		[ -z "$dur_secs" ] && dur_secs="$TI_IOC_TTL"

		echo "{\"ip\":\"$ip\",\"type\":\"ban\",\"severity\":\"$severity\",\"source\":\"crowdsec\",\"scenario\":\"$scenario\",\"duration\":\"${dur_secs}s\",\"ts\":$now,\"node\":\"$node_id\",\"ttl\":$dur_secs}"
	done
}

# ============================================================================
# Collection - mitmproxy threats log
# ============================================================================
ti_collect_mitmproxy() {
	local threats_log="/srv/mitmproxy/threats.log"
	[ -f "$threats_log" ] || return 0

	local now=$(date +%s)
	local node_id=$(cat "$NODE_ID_FILE" 2>/dev/null || echo "unknown")
	local last_collect_pos="$TI_DIR/.mitmproxy-last-pos"
	local last_pos=0
	[ -f "$last_collect_pos" ] && last_pos=$(cat "$last_collect_pos")

	# Get current file size; only process new lines since last run
	local current_size=$(wc -c < "$threats_log" 2>/dev/null)
	[ -z "$current_size" ] && return 0

	# If file was truncated/rotated, reset position
	[ "$last_pos" -gt "$current_size" ] 2>/dev/null && last_pos=0

	# Read recent entries (tail last 5000 lines for coverage)
	tail -n 5000 "$threats_log" | while read -r line; do
		[ -z "$line" ] && continue

		# Parse JSON fields using jsonfilter
		local ip=$(echo "$line" | jsonfilter -e '@.source_ip' 2>/dev/null)
		[ -z "$ip" ] && continue

		# Skip private/local IPs
		case "$ip" in
			192.168.*|10.*|172.1[6-9].*|172.2[0-9].*|172.3[01].*|127.*) continue ;;
		esac

		local severity=$(echo "$line" | jsonfilter -e '@.severity' 2>/dev/null)

		# Only high and critical severity
		case "$severity" in
			critical|high) ;;
			*) continue ;;
		esac

		# Skip whitelisted IPs
		grep -q "^${ip}$" "$TI_WHITELIST" 2>/dev/null && continue

		local scenario=$(echo "$line" | jsonfilter -e '@.type' 2>/dev/null || echo "unknown")
		local pattern=$(echo "$line" | jsonfilter -e '@.pattern' 2>/dev/null)
		[ -n "$pattern" ] && scenario="${scenario}:${pattern}"

		echo "{\"ip\":\"$ip\",\"type\":\"ban\",\"severity\":\"$severity\",\"source\":\"mitmproxy\",\"scenario\":\"$scenario\",\"duration\":\"${TI_IOC_TTL}s\",\"ts\":$now,\"node\":\"$node_id\",\"ttl\":$TI_IOC_TTL}"
	done

	echo "$current_size" > "$last_collect_pos"
}

# ============================================================================
# Collection - Aggregate and deduplicate
# ============================================================================
ti_collect_all() {
	ti_init

	local tmp_file="$TI_DIR/tmp-collect-$$.json"
	local existing_ips=""

	# Gather existing local IOC IPs for dedup
	if [ -f "$IOC_LOCAL" ] && [ "$(cat "$IOC_LOCAL")" != "[]" ]; then
		existing_ips=$(jsonfilter -i "$IOC_LOCAL" -e '@[*].ip' 2>/dev/null | sort -u)
	fi

	# Collect from all sources
	{
		ti_collect_crowdsec
		ti_collect_mitmproxy
	} > "$tmp_file"

	# Deduplicate by IP against existing and within new results
	local new_iocs="["
	local first=1
	local seen_ips=""

	while read -r ioc_line; do
		[ -z "$ioc_line" ] && continue

		local ip=$(echo "$ioc_line" | jsonfilter -e '@.ip' 2>/dev/null)
		[ -z "$ip" ] && continue

		# Skip if already in local IOCs
		echo "$existing_ips" | grep -q "^${ip}$" && continue

		# Skip if already seen in this batch
		echo "$seen_ips" | grep -q "^${ip}$" && continue
		seen_ips="$seen_ips
$ip"

		[ $first -eq 0 ] && new_iocs="$new_iocs,"
		first=0
		new_iocs="$new_iocs$ioc_line"
	done < "$tmp_file"

	new_iocs="$new_iocs]"
	rm -f "$tmp_file"

	# Merge with existing local IOCs, pruning expired
	local now=$(date +%s)
	local merged="["
	local mfirst=1

	# Keep non-expired existing IOCs
	if [ -f "$IOC_LOCAL" ] && [ "$(cat "$IOC_LOCAL")" != "[]" ]; then
		jsonfilter -i "$IOC_LOCAL" -e '@[*]' 2>/dev/null | while read -r existing; do
			local ets=$(echo "$existing" | jsonfilter -e '@.ts' 2>/dev/null || echo "0")
			local ettl=$(echo "$existing" | jsonfilter -e '@.ttl' 2>/dev/null || echo "$TI_IOC_TTL")
			local expires=$((ets + ettl))
			[ "$now" -ge "$expires" ] && continue
			echo "$existing"
		done
	fi > "$TI_DIR/tmp-existing-$$.json"

	# Rebuild local IOC list
	local final="["
	local ffirst=1

	while read -r line; do
		[ -z "$line" ] && continue
		[ $ffirst -eq 0 ] && final="$final,"
		ffirst=0
		final="$final$line"
	done < "$TI_DIR/tmp-existing-$$.json"

	# Append new IOCs
	echo "$new_iocs" | jsonfilter -e '@[*]' 2>/dev/null | while read -r nioc; do
		echo "$nioc"
	done > "$TI_DIR/tmp-new-$$.json"

	while read -r line; do
		[ -z "$line" ] && continue
		[ $ffirst -eq 0 ] && final="$final,"
		ffirst=0
		final="$final$line"
	done < "$TI_DIR/tmp-new-$$.json"

	final="$final]"
	echo "$final" > "$IOC_LOCAL"

	rm -f "$TI_DIR/tmp-existing-$$.json" "$TI_DIR/tmp-new-$$.json"

	local total=$(echo "$final" | jsonfilter -e '@[*]' 2>/dev/null | wc -l)
	logger -t threat-intel "Collected IOCs: $total local"
}

# ============================================================================
# Publishing - Push IOCs to chain as blocks
# ============================================================================
ti_publish_iocs() {
	ti_init
	[ "$TI_ENABLED" != "1" ] && return 0

	[ -f "$IOC_LOCAL" ] || return 0
	local count=$(jsonfilter -i "$IOC_LOCAL" -e '@[*]' 2>/dev/null | wc -l)
	[ "$count" -eq 0 ] && return 0

	local published_file="$TI_DIR/.published-hashes"
	[ -f "$published_file" ] || touch "$published_file"

	# Dump IOCs to temp file to avoid pipe-subshell variable loss
	local tmp_iocs="$TI_DIR/tmp-pub-$$.list"
	jsonfilter -i "$IOC_LOCAL" -e '@[*]' > "$tmp_iocs" 2>/dev/null

	# Build batches of max TI_MAX_BATCH IOCs
	local batch="["
	local batch_count=0
	local bfirst=1
	local total_published=0

	while read -r ioc; do
		[ -z "$ioc" ] && continue
		local ioc_hash=$(echo "$ioc" | sha256sum | cut -c1-16)

		# Skip already published
		grep -q "$ioc_hash" "$published_file" 2>/dev/null && continue

		[ $bfirst -eq 0 ] && batch="$batch,"
		bfirst=0
		batch="$batch$ioc"
		batch_count=$((batch_count + 1))

		echo "$ioc_hash" >> "$published_file"

		# Publish batch when full
		if [ "$batch_count" -ge "$TI_MAX_BATCH" ]; then
			batch="$batch]"
			local block_data="{\"version\":1,\"count\":$batch_count,\"iocs\":$batch}"
			local block_hash=$(echo "$block_data" | sha256sum | cut -d' ' -f1)
			_ti_chain_add_block "threat_ioc" "$block_data" "$block_hash"
			total_published=$((total_published + batch_count))

			# Reset batch
			batch="["
			batch_count=0
			bfirst=1
		fi
	done < "$tmp_iocs"

	# Publish remaining IOCs
	if [ "$batch_count" -gt 0 ]; then
		batch="$batch]"
		local block_data="{\"version\":1,\"count\":$batch_count,\"iocs\":$batch}"
		local block_hash=$(echo "$block_data" | sha256sum | cut -d' ' -f1)
		_ti_chain_add_block "threat_ioc" "$block_data" "$block_hash"
		total_published=$((total_published + batch_count))
	fi

	rm -f "$tmp_iocs"
	logger -t threat-intel "Published $total_published IOCs to chain"
	echo "{\"published\":$total_published}"
}

# ============================================================================
# Receiving - Scan chain for threat_ioc blocks
# ============================================================================
ti_process_pending() {
	ti_init

	[ -f "$CHAIN_FILE" ] || return 0
	local node_id=$(cat "$NODE_ID_FILE" 2>/dev/null || echo "unknown")
	local now=$(date +%s)
	local new_count=0

	# Scan chain for unprocessed threat_ioc blocks
	jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*]' 2>/dev/null | while read -r block; do
		local btype=$(echo "$block" | jsonfilter -e '@.type' 2>/dev/null)
		[ "$btype" = "threat_ioc" ] || continue

		local bhash=$(echo "$block" | jsonfilter -e '@.hash' 2>/dev/null)
		local bnode=$(echo "$block" | jsonfilter -e '@.node' 2>/dev/null)

		# Skip our own blocks
		[ "$bnode" = "$node_id" ] && continue

		# Skip already processed
		grep -q "$bhash" "$TI_PROCESSED" 2>/dev/null && continue

		# Extract IOCs from block data
		local block_data=$(echo "$block" | jsonfilter -e '@.data' 2>/dev/null)
		echo "$block_data" | jsonfilter -e '@.iocs[*]' 2>/dev/null | while read -r ioc; do
			local ip=$(echo "$ioc" | jsonfilter -e '@.ip' 2>/dev/null)
			[ -z "$ip" ] && continue

			local ioc_ts=$(echo "$ioc" | jsonfilter -e '@.ts' 2>/dev/null || echo "0")
			local ioc_ttl=$(echo "$ioc" | jsonfilter -e '@.ttl' 2>/dev/null || echo "$TI_IOC_TTL")
			local expires=$((ioc_ts + ioc_ttl))

			# Skip expired IOCs
			[ "$now" -ge "$expires" ] && continue

			echo "$ioc"
		done

		# Mark block as processed
		echo "$bhash" >> "$TI_PROCESSED"
	done > "$TI_DIR/tmp-received-$$.json"

	# Append to received IOCs (dedup by IP)
	local existing_recv_ips=""
	if [ -f "$IOC_RECEIVED" ] && [ "$(cat "$IOC_RECEIVED")" != "[]" ]; then
		existing_recv_ips=$(jsonfilter -i "$IOC_RECEIVED" -e '@[*].ip' 2>/dev/null | sort -u)
	fi

	# Load existing received IOCs (prune expired)
	local recv="["
	local rfirst=1

	if [ -f "$IOC_RECEIVED" ] && [ "$(cat "$IOC_RECEIVED")" != "[]" ]; then
		jsonfilter -i "$IOC_RECEIVED" -e '@[*]' 2>/dev/null | while read -r existing; do
			local ets=$(echo "$existing" | jsonfilter -e '@.ts' 2>/dev/null || echo "0")
			local ettl=$(echo "$existing" | jsonfilter -e '@.ttl' 2>/dev/null || echo "$TI_IOC_TTL")
			local expires=$((ets + ettl))
			[ "$now" -ge "$expires" ] && continue
			[ $rfirst -eq 0 ] && recv="$recv,"
			rfirst=0
			recv="$recv$existing"
		done
	fi

	# Add new received IOCs
	while read -r ioc_line; do
		[ -z "$ioc_line" ] && continue
		local ip=$(echo "$ioc_line" | jsonfilter -e '@.ip' 2>/dev/null)
		[ -z "$ip" ] && continue
		echo "$existing_recv_ips" | grep -q "^${ip}$" && continue

		[ $rfirst -eq 0 ] && recv="$recv,"
		rfirst=0
		recv="$recv$ioc_line"
		new_count=$((new_count + 1))
	done < "$TI_DIR/tmp-received-$$.json"

	recv="$recv]"
	echo "$recv" > "$IOC_RECEIVED"
	rm -f "$TI_DIR/tmp-received-$$.json"

	logger -t threat-intel "Processed pending: $new_count new IOCs received"
	echo "{\"new_received\":$new_count}"
}

# ============================================================================
# Trust Model
# ============================================================================
ti_trust_score() {
	local target_node="$1"
	[ -z "$target_node" ] && { echo "unknown"; return; }

	local node_id=$(cat "$NODE_ID_FILE" 2>/dev/null || echo "unknown")
	[ "$target_node" = "$node_id" ] && { echo "self"; return; }

	# Check if node is a direct approved peer
	local peers_file="/tmp/secubox-p2p-peers.json"
	if [ -f "$peers_file" ]; then
		local peer_count=$(jsonfilter -i "$peers_file" -e '@.peers[*]' 2>/dev/null | wc -l)
		local p=0
		while [ $p -lt $peer_count ]; do
			local pid=$(jsonfilter -i "$peers_file" -e "@.peers[$p].id" 2>/dev/null)
			local pname=$(jsonfilter -i "$peers_file" -e "@.peers[$p].name" 2>/dev/null)
			if [ "$pid" = "$target_node" ] || [ "$pname" = "$target_node" ]; then
				echo "direct"
				return
			fi
			p=$((p + 1))
		done
	fi

	# Check if node is known in the chain (transitive trust)
	if [ -f "$CHAIN_FILE" ]; then
		local in_chain=$(jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*].node' 2>/dev/null | grep -c "^${target_node}$")
		[ "$in_chain" -gt 0 ] && { echo "transitive"; return; }
	fi

	# Check trusted peers directory
	if [ -d "$TRUSTED_PEERS_DIR" ]; then
		for pub in "$TRUSTED_PEERS_DIR"/*.pub; do
			[ -f "$pub" ] || continue
			local fp=$(basename "$pub" .pub)
			if echo "$target_node" | grep -q "$fp"; then
				echo "direct"
				return
			fi
		done
	fi

	echo "unknown"
}

# ============================================================================
# Apply IOCs - Add CrowdSec decisions
# ============================================================================
ti_apply_ioc() {
	local ioc_json="$1"
	local ip=$(echo "$ioc_json" | jsonfilter -e '@.ip' 2>/dev/null)
	local severity=$(echo "$ioc_json" | jsonfilter -e '@.severity' 2>/dev/null)
	local source_node=$(echo "$ioc_json" | jsonfilter -e '@.node' 2>/dev/null)
	local scenario=$(echo "$ioc_json" | jsonfilter -e '@.scenario' 2>/dev/null || echo "mesh-shared")
	local duration=$(echo "$ioc_json" | jsonfilter -e '@.duration' 2>/dev/null || echo "${TI_IOC_TTL}s")
	local ttl=$(echo "$ioc_json" | jsonfilter -e '@.ttl' 2>/dev/null || echo "$TI_IOC_TTL")
	local ts=$(echo "$ioc_json" | jsonfilter -e '@.ts' 2>/dev/null || echo "0")

	[ -z "$ip" ] && return 1

	# Check whitelist
	grep -q "^${ip}$" "$TI_WHITELIST" 2>/dev/null && {
		logger -t threat-intel "Skipping whitelisted IP: $ip"
		return 1
	}

	# Check TTL (skip expired)
	local now=$(date +%s)
	local expires=$((ts + ttl))
	[ "$now" -ge "$expires" ] && return 1

	# Check trust level
	local trust=$(ti_trust_score "$source_node")

	case "$trust" in
		direct)
			# Apply as-is for direct peers
			;;
		transitive)
			# Only apply if policy allows and severity is high enough
			[ "$TI_APPLY_TRANSITIVE" != "1" ] && return 1
			_severity_meets_min "$severity" "high" || return 1
			# Halve the remaining TTL for transitive trust
			local remaining=$((expires - now))
			ttl=$((remaining / 2))
			duration="${ttl}s"
			;;
		unknown|*)
			# Never auto-apply unknown sources
			logger -t threat-intel "Skipping IOC from unknown node: $source_node ($ip)"
			return 1
			;;
	esac

	# Check minimum severity
	_severity_meets_min "$severity" "$TI_MIN_SEVERITY" || return 1

	# Apply via CrowdSec
	if command -v cscli >/dev/null 2>&1; then
		cscli decisions add --ip "$ip" --duration "$duration" \
			--reason "mesh-p2p:$scenario" --type ban 2>/dev/null
		if [ $? -eq 0 ]; then
			logger -t threat-intel "Applied IOC: $ip (trust=$trust, severity=$severity, source=$source_node)"
			return 0
		fi
	fi

	return 1
}

ti_apply_pending() {
	ti_init
	[ "$TI_ENABLED" != "1" ] && return 0
	[ "$TI_AUTO_APPLY" != "1" ] && return 0

	# First process any new blocks from chain
	ti_process_pending >/dev/null 2>&1

	[ -f "$IOC_RECEIVED" ] || return 0
	local recv_count=$(jsonfilter -i "$IOC_RECEIVED" -e '@[*]' 2>/dev/null | wc -l)
	[ "$recv_count" -eq 0 ] && return 0

	local applied_count=0
	local skipped_count=0
	local now=$(date +%s)

	# Get already-applied IPs
	local applied_ips=""
	if [ -f "$IOC_APPLIED" ] && [ "$(cat "$IOC_APPLIED")" != "[]" ]; then
		applied_ips=$(jsonfilter -i "$IOC_APPLIED" -e '@[*].ip' 2>/dev/null | sort -u)
	fi

	local new_applied="["
	local afirst=1

	# Load existing applied (prune expired) via temp file to avoid subshell
	local tmp_applied="$TI_DIR/tmp-applied-$$.list"
	if [ -f "$IOC_APPLIED" ] && [ "$(cat "$IOC_APPLIED")" != "[]" ]; then
		jsonfilter -i "$IOC_APPLIED" -e '@[*]' > "$tmp_applied" 2>/dev/null
		while read -r existing; do
			[ -z "$existing" ] && continue
			local ets=$(echo "$existing" | jsonfilter -e '@.ts' 2>/dev/null || echo "0")
			local ettl=$(echo "$existing" | jsonfilter -e '@.ttl' 2>/dev/null || echo "$TI_IOC_TTL")
			local expires=$((ets + ettl))
			[ "$now" -ge "$expires" ] && continue
			[ $afirst -eq 0 ] && new_applied="$new_applied,"
			afirst=0
			new_applied="$new_applied$existing"
		done < "$tmp_applied"
	fi

	# Dump received IOCs to temp file to avoid subshell
	local tmp_recv="$TI_DIR/tmp-recv-$$.list"
	jsonfilter -i "$IOC_RECEIVED" -e '@[*]' > "$tmp_recv" 2>/dev/null

	# Apply pending received IOCs
	while read -r ioc; do
		[ -z "$ioc" ] && continue
		local ip=$(echo "$ioc" | jsonfilter -e '@.ip' 2>/dev/null)
		[ -z "$ip" ] && continue

		# Skip already applied
		echo "$applied_ips" | grep -q "^${ip}$" && continue

		if ti_apply_ioc "$ioc"; then
			[ $afirst -eq 0 ] && new_applied="$new_applied,"
			afirst=0
			# Add applied_at timestamp
			local ioc_with_meta=$(echo "$ioc" | sed "s/}$/,\"applied_at\":$now}/")
			new_applied="$new_applied$ioc_with_meta"
			applied_count=$((applied_count + 1))
		else
			skipped_count=$((skipped_count + 1))
		fi
	done < "$tmp_recv"

	new_applied="$new_applied]"
	echo "$new_applied" > "$IOC_APPLIED"

	rm -f "$tmp_applied" "$tmp_recv"
	logger -t threat-intel "Apply pending: applied=$applied_count skipped=$skipped_count"
	echo "{\"applied\":$applied_count,\"skipped\":$skipped_count}"
}

# ============================================================================
# Status and Listings
# ============================================================================
ti_status() {
	ti_init

	local now=$(date +%s)
	local node_id=$(cat "$NODE_ID_FILE" 2>/dev/null || echo "unknown")

	# Count IOCs
	local local_count=0
	local received_count=0
	local applied_count=0

	[ -f "$IOC_LOCAL" ] && local_count=$(jsonfilter -i "$IOC_LOCAL" -e '@[*]' 2>/dev/null | wc -l)
	[ -f "$IOC_RECEIVED" ] && received_count=$(jsonfilter -i "$IOC_RECEIVED" -e '@[*]' 2>/dev/null | wc -l)
	[ -f "$IOC_APPLIED" ] && applied_count=$(jsonfilter -i "$IOC_APPLIED" -e '@[*]' 2>/dev/null | wc -l)

	# Count contributing peers
	local peer_nodes=""
	local peer_count=0
	if [ -f "$IOC_RECEIVED" ] && [ "$received_count" -gt 0 ]; then
		peer_nodes=$(jsonfilter -i "$IOC_RECEIVED" -e '@[*].node' 2>/dev/null | sort -u)
		peer_count=$(echo "$peer_nodes" | grep -c '.' 2>/dev/null)
		[ -z "$peer_count" ] && peer_count=0
	fi

	# Chain threat_ioc block count
	local chain_blocks=0
	if [ -f "$CHAIN_FILE" ]; then
		chain_blocks=$(jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*].type' 2>/dev/null | grep -c "^threat_ioc$" 2>/dev/null)
		[ -z "$chain_blocks" ] && chain_blocks=0
	fi

	cat << EOF
{
	"enabled": $( [ "$TI_ENABLED" = "1" ] && echo "true" || echo "false"),
	"auto_apply": $( [ "$TI_AUTO_APPLY" = "1" ] && echo "true" || echo "false"),
	"node_id": "$node_id",
	"timestamp": $now,
	"local_iocs": $local_count,
	"received_iocs": $received_count,
	"applied_iocs": $applied_count,
	"peer_contributors": $peer_count,
	"chain_threat_blocks": $chain_blocks,
	"min_severity": "$TI_MIN_SEVERITY",
	"ioc_ttl": $TI_IOC_TTL,
	"apply_transitive": $( [ "$TI_APPLY_TRANSITIVE" = "1" ] && echo "true" || echo "false")
}
EOF
}

ti_list_local() {
	ti_init
	[ -f "$IOC_LOCAL" ] && cat "$IOC_LOCAL" || echo '[]'
}

ti_list_received() {
	ti_init

	if [ ! -f "$IOC_RECEIVED" ] || [ "$(cat "$IOC_RECEIVED")" = "[]" ]; then
		echo '[]'
		return
	fi

	# Enrich with trust scores
	local enriched="["
	local efirst=1

	jsonfilter -i "$IOC_RECEIVED" -e '@[*]' 2>/dev/null | while read -r ioc; do
		local source_node=$(echo "$ioc" | jsonfilter -e '@.node' 2>/dev/null)
		local trust=$(ti_trust_score "$source_node")

		# Check if already applied
		local ip=$(echo "$ioc" | jsonfilter -e '@.ip' 2>/dev/null)
		local is_applied="false"
		if [ -f "$IOC_APPLIED" ]; then
			jsonfilter -i "$IOC_APPLIED" -e '@[*].ip' 2>/dev/null | grep -q "^${ip}$" && is_applied="true"
		fi

		# Add trust and applied fields
		local enriched_ioc=$(echo "$ioc" | sed "s/}$/,\"trust\":\"$trust\",\"applied\":$is_applied}/")
		[ $efirst -eq 0 ] && enriched="$enriched,"
		efirst=0
		enriched="$enriched$enriched_ioc"
	done

	enriched="$enriched]"
	echo "$enriched"
}

ti_list_applied() {
	ti_init
	[ -f "$IOC_APPLIED" ] && cat "$IOC_APPLIED" || echo '[]'
}

# ============================================================================
# Peer Statistics
# ============================================================================
ti_peer_stats() {
	ti_init

	[ -f "$IOC_RECEIVED" ] || { echo '[]'; return; }

	local now=$(date +%s)
	local stats="["
	local sfirst=1
	local seen_nodes=""

	jsonfilter -i "$IOC_RECEIVED" -e '@[*]' 2>/dev/null | while read -r ioc; do
		local node=$(echo "$ioc" | jsonfilter -e '@.node' 2>/dev/null)
		[ -z "$node" ] && continue

		# Skip already counted nodes
		echo "$seen_nodes" | grep -q "^${node}$" && continue
		seen_nodes="$seen_nodes
$node"

		# Count IOCs from this node
		local ioc_count=$(jsonfilter -i "$IOC_RECEIVED" -e '@[*].node' 2>/dev/null | grep -c "^${node}$" 2>/dev/null)
		[ -z "$ioc_count" ] && ioc_count=0

		# Get last seen timestamp
		local last_ts=0
		jsonfilter -i "$IOC_RECEIVED" -e '@[*]' 2>/dev/null | while read -r n_ioc; do
			local n_node=$(echo "$n_ioc" | jsonfilter -e '@.node' 2>/dev/null)
			[ "$n_node" = "$node" ] || continue
			local n_ts=$(echo "$n_ioc" | jsonfilter -e '@.ts' 2>/dev/null || echo "0")
			[ "$n_ts" -gt "$last_ts" ] && last_ts="$n_ts"
		done

		local trust=$(ti_trust_score "$node")

		# Count applied from this node
		local applied_count=0
		if [ -f "$IOC_APPLIED" ]; then
			applied_count=$(jsonfilter -i "$IOC_APPLIED" -e '@[*].node' 2>/dev/null | grep -c "^${node}$" 2>/dev/null)
			[ -z "$applied_count" ] && applied_count=0
		fi

		[ $sfirst -eq 0 ] && stats="$stats,"
		sfirst=0
		stats="$stats{\"node\":\"$node\",\"trust\":\"$trust\",\"ioc_count\":$ioc_count,\"applied_count\":$applied_count,\"last_seen\":$last_ts}"
	done

	stats="$stats]"
	echo "$stats"
}

# ============================================================================
# Collect and Publish (cron entry point)
# ============================================================================
ti_collect_and_publish() {
	# Acquire lock
	if [ -f "$TI_LOCK" ]; then
		local lock_age=$(( $(date +%s) - $(stat -c %Y "$TI_LOCK" 2>/dev/null || echo "0") ))
		[ "$lock_age" -lt 300 ] && {
			logger -t threat-intel "Skipping collect-and-publish: locked"
			return 0
		}
	fi
	touch "$TI_LOCK"

	ti_init

	if [ "$TI_ENABLED" != "1" ]; then
		rm -f "$TI_LOCK"
		return 0
	fi

	ti_collect_all
	ti_publish_iocs

	rm -f "$TI_LOCK"
}

# ============================================================================
# CLI Interface
# ============================================================================
case "${1:-}" in
	collect-and-publish)
		ti_collect_and_publish
		;;
	apply-pending)
		ti_init
		ti_apply_pending
		;;
	status)
		ti_status
		;;
	list)
		case "${2:-}" in
			local)    ti_list_local ;;
			received) ti_list_received ;;
			applied)  ti_list_applied ;;
			*)        ti_list_received ;;
		esac
		;;
	peers)
		ti_peer_stats
		;;
	collect)
		ti_init
		ti_collect_all
		;;
	publish)
		ti_init
		ti_publish_iocs
		;;
	process)
		ti_init
		ti_process_pending
		;;
	*)
		# When sourced as library, do nothing
		[ -n "${1:-}" ] && {
			echo "SecuBox Threat Intelligence - P2P IOC Sharing"
			echo ""
			echo "Usage: $0 <command>"
			echo ""
			echo "Commands:"
			echo "  collect-and-publish   Collect IOCs and publish to chain (cron)"
			echo "  apply-pending         Process and apply received IOCs (cron)"
			echo "  status                Show threat intel status (JSON)"
			echo "  list [local|received|applied]  List IOCs"
			echo "  peers                 Show peer contribution stats"
			echo "  collect               Collect IOCs from local sources"
			echo "  publish               Publish local IOCs to chain"
			echo "  process               Process pending chain blocks"
		}
		;;
esac
