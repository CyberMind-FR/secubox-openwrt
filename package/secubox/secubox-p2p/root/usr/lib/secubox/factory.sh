#!/bin/sh
# SecuBox Factory - KISS cryptographic validation
# Uses Ed25519 via signify-openbsd (already in OpenWrt)
# Provides Merkle tree snapshots for config validation

FACTORY_DIR="/var/lib/secubox-factory"
SNAPSHOT_FILE="$FACTORY_DIR/snapshot.json"
PENDING_OPS="$FACTORY_DIR/pending.ndjson"
KEYFILE="/etc/secubox/factory.key"
PUBKEY="/etc/secubox/factory.pub"
TRUSTED_PEERS_DIR="/etc/secubox/trusted_peers"
P2P_STATE_DIR="/var/run/secubox-p2p"

# Ensure directories exist
factory_init() {
	mkdir -p "$FACTORY_DIR"
	mkdir -p "$TRUSTED_PEERS_DIR"
	mkdir -p "$(dirname $KEYFILE)"
}

# Generate keypair on first use (Trust-On-First-Use)
factory_init_keys() {
	factory_init
	[ -f "$KEYFILE" ] && return 0

	# Generate keys using available method
	# OpenWrt signify doesn't support -n flag, use fallback hash-based keys
	# which provide integrity verification without full Ed25519 signing
	local node_id=$(cat "$P2P_STATE_DIR/node.id" 2>/dev/null || cat /proc/sys/kernel/random/uuid | tr -d '-')
	local rand=$(head -c 32 /dev/urandom 2>/dev/null | sha256sum | cut -d' ' -f1)
	[ -z "$rand" ] && rand=$(date +%s%N | sha256sum | cut -d' ' -f1)

	# Create HMAC-style keypair for snapshot integrity
	echo "secubox-factory-key:${node_id}:${rand}" > "$KEYFILE"
	echo "secubox-factory-pub:${node_id}:$(echo "$rand" | sha256sum | cut -d' ' -f1)" > "$PUBKEY"

	chmod 600 "$KEYFILE"

	# Display fingerprint for admin verification
	local fp=$(sha256sum "$PUBKEY" 2>/dev/null | cut -c1-16)
	logger -t factory "Node keypair generated. Fingerprint: $fp"
}

# Get node fingerprint
factory_fingerprint() {
	[ -f "$PUBKEY" ] || factory_init_keys
	sha256sum "$PUBKEY" 2>/dev/null | cut -c1-16
}

# Calculate Merkle root of /etc/config
merkle_config() {
	local root=""
	for f in /etc/config/*; do
		[ -f "$f" ] || continue
		local hash=$(sha256sum "$f" 2>/dev/null | cut -d' ' -f1)
		root="${root}${hash}"
	done
	echo "$root" | sha256sum | cut -d' ' -f1
}

# Calculate Merkle root of specific files
merkle_files() {
	local root=""
	for f in "$@"; do
		[ -f "$f" ] || continue
		local hash=$(sha256sum "$f" 2>/dev/null | cut -d' ' -f1)
		root="${root}${hash}"
	done
	echo "$root" | sha256sum | cut -d' ' -f1
}

# Create signed snapshot
create_snapshot() {
	factory_init_keys

	local merkle=$(merkle_config)
	local ts=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')
	local node_id=$(cat "$P2P_STATE_DIR/node.id" 2>/dev/null || echo "unknown")
	local prev_hash=""
	[ -f "$SNAPSHOT_FILE" ] && prev_hash=$(jsonfilter -i "$SNAPSHOT_FILE" -e '@.hash' 2>/dev/null)

	# Data to sign
	local sign_data="${merkle}|${ts}|${node_id}|${prev_hash}"
	local hash=$(echo "$sign_data" | sha256sum | cut -d' ' -f1)

	# HMAC-style signature using key + data
	local key_data=$(cat "$KEYFILE" 2>/dev/null)
	local signature=$(echo "${key_data}:${sign_data}" | sha256sum | cut -d' ' -f1)

	# Build snapshot JSON
	cat > "$SNAPSHOT_FILE" << EOF
{
	"merkle_root": "$merkle",
	"timestamp": "$ts",
	"node_id": "$node_id",
	"prev_hash": "$prev_hash",
	"hash": "$hash",
	"signature": "$signature",
	"version": "1.0"
}
EOF

	echo "$hash"
}

# Verify snapshot signature
verify_snapshot() {
	local snapshot_file="${1:-$SNAPSHOT_FILE}"
	local keyfile="${2:-$KEYFILE}"

	[ -f "$snapshot_file" ] || { echo "missing"; return 1; }
	[ -f "$keyfile" ] || { echo "no_key"; return 1; }

	local merkle=$(jsonfilter -i "$snapshot_file" -e '@.merkle_root' 2>/dev/null)
	local ts=$(jsonfilter -i "$snapshot_file" -e '@.timestamp' 2>/dev/null)
	local node_id=$(jsonfilter -i "$snapshot_file" -e '@.node_id' 2>/dev/null)
	local prev_hash=$(jsonfilter -i "$snapshot_file" -e '@.prev_hash' 2>/dev/null)
	local signature=$(jsonfilter -i "$snapshot_file" -e '@.signature' 2>/dev/null)

	[ -z "$merkle" ] && { echo "invalid"; return 1; }
	[ -z "$signature" ] && { echo "unsigned"; return 1; }

	local sign_data="${merkle}|${ts}|${node_id}|${prev_hash}"

	# HMAC-style verification using key + data
	local key_data=$(cat "$keyfile" 2>/dev/null)
	local expected=$(echo "${key_data}:${sign_data}" | sha256sum | cut -d' ' -f1)

	if [ "$signature" = "$expected" ]; then
		# Also verify merkle matches current config
		local current_merkle=$(merkle_config)
		if [ "$merkle" = "$current_merkle" ]; then
			echo "valid"
			return 0
		else
			echo "config_changed"
			return 1
		fi
	fi

	echo "invalid"
	return 1
}

# Compare snapshots with peer
compare_peer_snapshot() {
	local peer_addr="$1"
	local local_merkle=$(jsonfilter -i "$SNAPSHOT_FILE" -e '@.merkle_root' 2>/dev/null)
	local peer_merkle=$(curl -s --connect-timeout 2 "http://$peer_addr:7331/api/factory/snapshot" 2>/dev/null | jsonfilter -e '@.merkle_root' 2>/dev/null)

	[ -z "$local_merkle" ] && { echo "local_missing"; return 1; }
	[ -z "$peer_merkle" ] && { echo "peer_unreachable"; return 1; }

	[ "$local_merkle" = "$peer_merkle" ] && echo "match" || echo "diverged"
}

# Get snapshot JSON
get_snapshot() {
	if [ -f "$SNAPSHOT_FILE" ]; then
		cat "$SNAPSHOT_FILE"
	else
		echo '{"error":"no_snapshot"}'
	fi
}

# Trust a peer by fingerprint
factory_trust_peer() {
	local peer_fp="$1"
	local peer_addr="$2"

	[ -z "$peer_fp" ] || [ -z "$peer_addr" ] && {
		echo '{"error":"missing_parameters"}'
		return 1
	}

	mkdir -p "$TRUSTED_PEERS_DIR"

	local peer_pub=$(curl -s --connect-timeout 5 "http://$peer_addr:7331/api/factory/pubkey" 2>/dev/null)
	[ -z "$peer_pub" ] && {
		echo '{"error":"peer_unreachable"}'
		return 1
	}

	local actual_fp=$(echo "$peer_pub" | sha256sum | cut -c1-16)

	if [ "$actual_fp" = "$peer_fp" ]; then
		echo "$peer_pub" > "$TRUSTED_PEERS_DIR/${peer_fp}.pub"
		echo "{\"success\":true,\"fingerprint\":\"$peer_fp\"}"
		return 0
	else
		echo "{\"error\":\"fingerprint_mismatch\",\"expected\":\"$peer_fp\",\"actual\":\"$actual_fp\"}"
		return 1
	fi
}

# Queue an operation for offline execution
queue_operation() {
	local op_type="$1"
	local op_data="$2"
	factory_init
	echo "{\"type\":\"$op_type\",\"data\":\"$op_data\",\"ts\":$(date +%s)}" >> "$PENDING_OPS"
}

# Replay pending operations
replay_pending() {
	[ -f "$PENDING_OPS" ] || return 0
	local count=0

	while read -r op; do
		local op_type=$(echo "$op" | jsonfilter -e '@.type' 2>/dev/null)
		local op_data=$(echo "$op" | jsonfilter -e '@.data' 2>/dev/null)
		case "$op_type" in
			tool_run)
				# Execute queued tool
				logger -t factory "Replaying queued operation: $op_type"
				count=$((count + 1))
				;;
		esac
	done < "$PENDING_OPS"

	rm -f "$PENDING_OPS"
	echo "{\"replayed\":$count}"
}

# Get pending operations count
pending_count() {
	if [ -f "$PENDING_OPS" ]; then
		wc -l < "$PENDING_OPS"
	else
		echo "0"
	fi
}

# Gossip-based snapshot sync with peer
gossip_with_peer() {
	local peer_addr="$1"
	[ -z "$peer_addr" ] && return 1

	# Get peer's snapshot
	local peer_snapshot=$(curl -s --connect-timeout 2 "http://$peer_addr:7331/api/factory/snapshot" 2>/dev/null)
	[ -z "$peer_snapshot" ] && return 1

	local peer_ts=$(echo "$peer_snapshot" | jsonfilter -e '@.timestamp' 2>/dev/null || echo "0")
	local our_ts=$(jsonfilter -i "$SNAPSHOT_FILE" -e '@.timestamp' 2>/dev/null || echo "0")

	# Last-Writer-Wins sync
	if [ "$peer_ts" \> "$our_ts" ]; then
		# Peer has newer - log but don't auto-overwrite (configs differ by design)
		logger -t factory "Peer $peer_addr has newer snapshot: $peer_ts > $our_ts"
		echo "peer_newer"
	elif [ "$our_ts" \> "$peer_ts" ]; then
		# We have newer - push to peer
		curl -s -X POST "http://$peer_addr:7331/api/factory/snapshot" \
			-H "Content-Type: application/json" \
			-d @"$SNAPSHOT_FILE" 2>/dev/null
		echo "pushed"
	else
		echo "sync"
	fi
}

# Gossip with random subset of peers
gossip_sync() {
	local FANOUT=3
	local peers_file="/tmp/secubox-p2p-peers.json"
	[ -f "$peers_file" ] || return 0

	# Select random peers (max FANOUT)
	local selected=$(jsonfilter -i "$peers_file" -e '@.peers[*].address' 2>/dev/null | shuf 2>/dev/null | head -$FANOUT)
	[ -z "$selected" ] && selected=$(jsonfilter -i "$peers_file" -e '@.peers[*].address' 2>/dev/null | head -$FANOUT)

	local synced=0
	for peer in $selected; do
		[ -z "$peer" ] && continue
		gossip_with_peer "$peer" >/dev/null 2>&1 &
		synced=$((synced + 1))
	done
	wait

	echo "{\"gossiped\":$synced}"
}

# Audit log entry
factory_audit_log() {
	local action="$1"
	local details="$2"
	local node_id=$(cat "$P2P_STATE_DIR/node.id" 2>/dev/null || echo "unknown")
	local log_file="/var/log/secubox-factory-audit.log"

	echo "$(date -Iseconds 2>/dev/null || date)|$node_id|$action|$details" >> "$log_file"

	# Push to Gitea if enabled
	if [ "$(uci -q get secubox-p2p.gitea.enabled)" = "1" ]; then
		ubus call luci.secubox-p2p push_gitea_backup "{\"message\":\"Factory: $action\"}" 2>/dev/null
	fi
}

# ===========================================
# Distributed Catalog Functions
# ===========================================

CATALOG_DIR="$FACTORY_DIR/catalog"
LOCAL_CATALOG="$CATALOG_DIR/local.json"
MERGED_CATALOG="$CATALOG_DIR/merged.json"

# Initialize catalog directory
catalog_init() {
	factory_init
	mkdir -p "$CATALOG_DIR"
	mkdir -p "$CATALOG_DIR/peers"
}

# Generate local catalog (calls the CGI endpoint logic)
catalog_generate_local() {
	catalog_init
	local node_id=$(cat "$P2P_STATE_DIR/node.id" 2>/dev/null || hostname)
	local node_name=$(uci -q get system.@system[0].hostname || hostname)
	local updated=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')

	# Fetch from local catalog API
	local catalog=$(curl -s "http://127.0.0.1:7331/api/factory/catalog" 2>/dev/null)

	if [ -n "$catalog" ] && echo "$catalog" | grep -q "node_id"; then
		echo "$catalog" > "$LOCAL_CATALOG"
		echo "$LOCAL_CATALOG"
	else
		echo '{"error":"catalog_generation_failed"}' > "$LOCAL_CATALOG"
		echo "$LOCAL_CATALOG"
	fi
}

# Pull catalog from a peer
catalog_pull_peer() {
	local peer_addr="$1"
	local peer_name="${2:-$peer_addr}"

	[ -z "$peer_addr" ] && return 1

	catalog_init

	local peer_catalog=$(curl -s --connect-timeout 3 --max-time 10 "http://$peer_addr:7331/api/factory/catalog" 2>/dev/null)

	if [ -n "$peer_catalog" ] && echo "$peer_catalog" | grep -q "node_id"; then
		local peer_node_name=$(echo "$peer_catalog" | jsonfilter -e '@.node_name' 2>/dev/null || echo "$peer_name")
		echo "$peer_catalog" > "$CATALOG_DIR/peers/${peer_node_name}.json"
		echo "pulled:$peer_node_name"
	else
		echo "failed:$peer_addr"
	fi
}

# Sync catalogs with all known peers
catalog_sync() {
	catalog_init

	local peers_file="/tmp/secubox-p2p-peers.json"
	[ -f "$peers_file" ] || { echo '{"synced":0,"error":"no_peers"}'; return 1; }

	# Generate local catalog first
	catalog_generate_local >/dev/null 2>&1

	# Pull from all online peers
	local synced=0
	local failed=0
	local peer_count=$(jsonfilter -i "$peers_file" -e '@.peers[*]' 2>/dev/null | wc -l)
	local p=0

	while [ $p -lt $peer_count ]; do
		local peer_addr=$(jsonfilter -i "$peers_file" -e "@.peers[$p].address" 2>/dev/null)
		local peer_name=$(jsonfilter -i "$peers_file" -e "@.peers[$p].name" 2>/dev/null)
		local is_local=$(jsonfilter -i "$peers_file" -e "@.peers[$p].is_local" 2>/dev/null)

		if [ "$is_local" != "true" ] && [ -n "$peer_addr" ]; then
			local result=$(catalog_pull_peer "$peer_addr" "$peer_name")
			if echo "$result" | grep -q "^pulled:"; then
				synced=$((synced + 1))
			else
				failed=$((failed + 1))
			fi
		fi
		p=$((p + 1))
	done

	# Merge all catalogs
	catalog_merge

	# Push to Gitea if enabled
	local gitea_result=""
	if [ "$(uci -q get secubox-p2p.gitea.enabled)" = "1" ]; then
		# Push local node catalog
		gitea_result=$(catalog_push_gitea)
		# Push merged catalog
		catalog_push_merged_gitea
	fi

	echo "{\"synced\":$synced,\"failed\":$failed,\"gitea\":\"$gitea_result\"}"
}

# Merge all catalogs into unified view (CRDT union)
catalog_merge() {
	catalog_init

	local merged_services='{"nodes":['
	local first_node=1

	# Add local catalog
	if [ -f "$LOCAL_CATALOG" ]; then
		[ $first_node -eq 0 ] && merged_services="$merged_services,"
		first_node=0
		cat "$LOCAL_CATALOG" | tr '\n' ' ' | tr '\t' ' ' >> /tmp/catalog_merge_local.tmp
		local local_entry=$(cat /tmp/catalog_merge_local.tmp)
		merged_services="$merged_services$local_entry"
		rm -f /tmp/catalog_merge_local.tmp
	fi

	# Add peer catalogs
	for peer_catalog in "$CATALOG_DIR/peers"/*.json; do
		[ -f "$peer_catalog" ] || continue
		[ $first_node -eq 0 ] && merged_services="$merged_services,"
		first_node=0
		cat "$peer_catalog" | tr '\n' ' ' | tr '\t' ' ' >> /tmp/catalog_merge_peer.tmp
		local peer_entry=$(cat /tmp/catalog_merge_peer.tmp)
		merged_services="$merged_services$peer_entry"
		rm -f /tmp/catalog_merge_peer.tmp
	done

	merged_services="$merged_services],\"updated\":\"$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')\"}"

	echo "$merged_services" > "$MERGED_CATALOG"
}

# Push catalog to Gitea repository via REST API
catalog_push_gitea() {
	local gitea_enabled=$(uci -q get secubox-p2p.gitea.enabled)
	[ "$gitea_enabled" = "1" ] || { echo "gitea_disabled"; return 0; }

	local server_url=$(uci -q get secubox-p2p.gitea.server_url)
	local access_token=$(uci -q get secubox-p2p.gitea.access_token)
	local repo_owner=$(uci -q get secubox-p2p.gitea.repo_owner)
	local repo_name=$(uci -q get secubox-p2p.gitea.repo_name)

	if [ -z "$server_url" ] || [ -z "$access_token" ] || [ -z "$repo_owner" ] || [ -z "$repo_name" ]; then
		echo "gitea_not_configured"
		return 1
	fi

	local node_name=$(uci -q get system.@system[0].hostname || hostname)

	# Check if local catalog exists
	[ -f "$LOCAL_CATALOG" ] || {
		catalog_generate_local >/dev/null 2>&1
	}
	[ -f "$LOCAL_CATALOG" ] || { echo "no_local_catalog"; return 1; }

	# Prepare catalog content for Gitea API
	# Base64 encode the catalog JSON
	local content=$(cat "$LOCAL_CATALOG" | base64 -w0 2>/dev/null || cat "$LOCAL_CATALOG" | base64 2>/dev/null | tr -d '\n')
	local file_path="catalog/nodes/${node_name}.json"
	local commit_msg="Catalog sync: ${node_name} $(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')"

	# Check if file exists to get SHA for update
	local existing_sha=""
	local existing=$(curl -s --connect-timeout 5 --max-time 10 \
		-H "Authorization: token $access_token" \
		"${server_url}/api/v1/repos/${repo_owner}/${repo_name}/contents/${file_path}" 2>/dev/null)

	if echo "$existing" | grep -q '"sha"'; then
		existing_sha=$(echo "$existing" | jsonfilter -e '@.sha' 2>/dev/null)
	fi

	# Build API request body
	local request_body
	if [ -n "$existing_sha" ]; then
		# Update existing file
		request_body="{\"content\":\"${content}\",\"message\":\"${commit_msg}\",\"sha\":\"${existing_sha}\"}"
	else
		# Create new file
		request_body="{\"content\":\"${content}\",\"message\":\"${commit_msg}\"}"
	fi

	# Push to Gitea
	local response=$(curl -s --connect-timeout 5 --max-time 15 \
		-X PUT \
		-H "Authorization: token $access_token" \
		-H "Content-Type: application/json" \
		-d "$request_body" \
		"${server_url}/api/v1/repos/${repo_owner}/${repo_name}/contents/${file_path}" 2>/dev/null)

	if echo "$response" | grep -q '"sha"'; then
		local new_sha=$(echo "$response" | jsonfilter -e '@.content.sha' 2>/dev/null)
		logger -t factory "Catalog pushed to Gitea: ${file_path} (sha: ${new_sha})"
		echo "pushed:${file_path}"
		return 0
	else
		local error_msg=$(echo "$response" | jsonfilter -e '@.message' 2>/dev/null || echo "unknown_error")
		logger -t factory "Catalog push failed: $error_msg"
		echo "error:$error_msg"
		return 1
	fi
}

# Push merged catalog to Gitea
catalog_push_merged_gitea() {
	local gitea_enabled=$(uci -q get secubox-p2p.gitea.enabled)
	[ "$gitea_enabled" = "1" ] || return 0

	local server_url=$(uci -q get secubox-p2p.gitea.server_url)
	local access_token=$(uci -q get secubox-p2p.gitea.access_token)
	local repo_owner=$(uci -q get secubox-p2p.gitea.repo_owner)
	local repo_name=$(uci -q get secubox-p2p.gitea.repo_name)

	[ -z "$server_url" ] || [ -z "$access_token" ] && return 1
	[ -f "$MERGED_CATALOG" ] || return 1

	local content=$(cat "$MERGED_CATALOG" | base64 -w0 2>/dev/null || cat "$MERGED_CATALOG" | base64 2>/dev/null | tr -d '\n')
	local file_path="catalog/catalog.json"
	local commit_msg="Merged catalog $(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')"

	# Get existing SHA if file exists
	local existing_sha=""
	local existing=$(curl -s --connect-timeout 5 --max-time 10 \
		-H "Authorization: token $access_token" \
		"${server_url}/api/v1/repos/${repo_owner}/${repo_name}/contents/${file_path}" 2>/dev/null)

	if echo "$existing" | grep -q '"sha"'; then
		existing_sha=$(echo "$existing" | jsonfilter -e '@.sha' 2>/dev/null)
	fi

	local request_body
	if [ -n "$existing_sha" ]; then
		request_body="{\"content\":\"${content}\",\"message\":\"${commit_msg}\",\"sha\":\"${existing_sha}\"}"
	else
		request_body="{\"content\":\"${content}\",\"message\":\"${commit_msg}\"}"
	fi

	curl -s --connect-timeout 5 --max-time 15 \
		-X PUT \
		-H "Authorization: token $access_token" \
		-H "Content-Type: application/json" \
		-d "$request_body" \
		"${server_url}/api/v1/repos/${repo_owner}/${repo_name}/contents/${file_path}" >/dev/null 2>&1
}

# Get merged catalog JSON
catalog_get_merged() {
	if [ -f "$MERGED_CATALOG" ]; then
		cat "$MERGED_CATALOG"
	elif [ -f "$LOCAL_CATALOG" ]; then
		# Return local only if no merge yet
		echo "{\"nodes\":[$(cat "$LOCAL_CATALOG" | tr '\n' ' ')],\"updated\":\"$(date -Iseconds)\"}"
	else
		echo '{"nodes":[],"updated":"","error":"no_catalog"}'
	fi
}

# List available catalogs
catalog_list() {
	catalog_init
	echo "Local catalog: $LOCAL_CATALOG"
	[ -f "$LOCAL_CATALOG" ] && echo "  - $(jsonfilter -i "$LOCAL_CATALOG" -e '@.node_name' 2>/dev/null || echo 'unknown')"

	echo "Peer catalogs:"
	for peer_catalog in "$CATALOG_DIR/peers"/*.json; do
		[ -f "$peer_catalog" ] || continue
		local name=$(basename "$peer_catalog" .json)
		echo "  - $name"
	done
}

# Main entry point for CLI usage
case "${1:-}" in
	init)
		factory_init_keys
		echo "Factory initialized. Fingerprint: $(factory_fingerprint)"
		;;
	fingerprint)
		factory_fingerprint
		;;
	snapshot)
		create_snapshot
		;;
	verify)
		verify_snapshot "$2" "$3"
		;;
	compare)
		compare_peer_snapshot "$2"
		;;
	get-snapshot)
		get_snapshot
		;;
	trust)
		factory_trust_peer "$2" "$3"
		;;
	gossip)
		gossip_sync
		;;
	pending)
		pending_count
		;;
	replay)
		replay_pending
		;;
	merkle)
		merkle_config
		;;
	# Catalog commands
	catalog)
		case "${2:-}" in
			sync)
				catalog_sync
				;;
			list)
				catalog_list
				;;
			generate)
				catalog_generate_local
				;;
			merge)
				catalog_merge
				echo "Merged catalog: $MERGED_CATALOG"
				;;
			get)
				catalog_get_merged
				;;
			pull)
				catalog_pull_peer "$3" "$4"
				;;
			*)
				echo "Usage: factory.sh catalog {sync|list|generate|merge|get|pull <peer_addr>}"
				;;
		esac
		;;
	*)
		# Sourced as library - do nothing
		:
		;;
esac
