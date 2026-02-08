#!/bin/sh
# SecuBox Master-Link - Secure Mesh Propagation
# Manages join tokens, peer onboarding, and gigogne hierarchy
# Copyright 2026 CyberMind - Licensed under Apache-2.0

# Source dependencies
. /usr/lib/secubox/p2p-mesh.sh 2>/dev/null
. /usr/lib/secubox/factory.sh 2>/dev/null

# ============================================================================
# Configuration
# ============================================================================
ML_DIR="/var/lib/secubox-master-link"
ML_TOKENS_DIR="$ML_DIR/tokens"
ML_REQUESTS_DIR="$ML_DIR/requests"
MESH_PORT="${MESH_PORT:-7331}"

ml_init() {
	mkdir -p "$ML_DIR" "$ML_TOKENS_DIR" "$ML_REQUESTS_DIR"
	factory_init_keys >/dev/null 2>&1
	mesh_init >/dev/null 2>&1
}

# ============================================================================
# Token Management
# ============================================================================

# Generate HMAC-based one-time join token
ml_token_generate() {
	ml_init

	local ttl=$(uci -q get master-link.main.token_ttl)
	[ -z "$ttl" ] && ttl=3600

	local now=$(date +%s)
	local expires=$((now + ttl))
	local rand=$(head -c 32 /dev/urandom 2>/dev/null | sha256sum | cut -d' ' -f1)
	[ -z "$rand" ] && rand=$(date +%s%N | sha256sum | cut -d' ' -f1)

	# HMAC token using master key
	local key_data=$(cat "$KEYFILE" 2>/dev/null)
	local token=$(echo "${key_data}:${rand}:${now}" | sha256sum | cut -d' ' -f1)
	local token_hash=$(echo "$token" | sha256sum | cut -d' ' -f1)

	# Store token in UCI
	local section_id="token_$(echo "$token_hash" | cut -c1-8)"
	uci -q batch <<-EOF
		set master-link.${section_id}=token
		set master-link.${section_id}.hash='${token_hash}'
		set master-link.${section_id}.created='${now}'
		set master-link.${section_id}.expires='${expires}'
		set master-link.${section_id}.peer_fp=''
		set master-link.${section_id}.status='active'
	EOF
	uci commit master-link

	# Also store full token locally for validation
	echo "$token" > "$ML_TOKENS_DIR/${token_hash}"

	# Record in blockchain
	local fp=$(factory_fingerprint 2>/dev/null)
	chain_add_block "token_generated" \
		"{\"token_hash\":\"$token_hash\",\"expires\":$expires,\"created_by\":\"$fp\"}" \
		"$(echo "token_generated:${token_hash}:${now}" | sha256sum | cut -d' ' -f1)" >/dev/null 2>&1

	# Build join URL
	local my_addr=$(uci -q get network.lan.ipaddr)
	[ -z "$my_addr" ] && my_addr=$(ip -4 addr show br-lan 2>/dev/null | grep -oP 'inet \K[0-9.]+' | head -1)
	[ -z "$my_addr" ] && my_addr="$(hostname -i 2>/dev/null | awk '{print $1}')"

	logger -t master-link "Token generated: ${token_hash} (expires: $(date -d @$expires -Iseconds 2>/dev/null || echo $expires))"

	cat <<-EOF
	{
		"token": "$token",
		"token_hash": "$token_hash",
		"expires": $expires,
		"ttl": $ttl,
		"url": "http://${my_addr}:${MESH_PORT}/master-link/?token=${token}"
	}
	EOF
}

# Validate a token
ml_token_validate() {
	local token="$1"
	[ -z "$token" ] && { echo '{"valid":false,"error":"missing_token"}'; return 1; }

	local token_hash=$(echo "$token" | sha256sum | cut -d' ' -f1)
	local now=$(date +%s)

	# Check token file exists
	if [ ! -f "$ML_TOKENS_DIR/${token_hash}" ]; then
		echo '{"valid":false,"error":"unknown_token"}'
		return 1
	fi

	# Find token in UCI
	local status=""
	local expires=""
	local found=0

	local sections=$(uci -q show master-link 2>/dev/null | grep "\.hash=" | sed "s/master-link\.\(.*\)\.hash=.*/\1/")
	for sec in $sections; do
		local sec_hash=$(uci -q get "master-link.${sec}.hash")
		if [ "$sec_hash" = "$token_hash" ]; then
			status=$(uci -q get "master-link.${sec}.status")
			expires=$(uci -q get "master-link.${sec}.expires")
			found=1
			break
		fi
	done

	if [ "$found" -eq 0 ]; then
		echo '{"valid":false,"error":"token_not_found"}'
		return 1
	fi

	# Check status
	if [ "$status" = "used" ]; then
		echo '{"valid":false,"error":"token_already_used"}'
		return 1
	fi

	if [ "$status" = "expired" ]; then
		echo '{"valid":false,"error":"token_expired"}'
		return 1
	fi

	# Check expiry
	if [ "$now" -gt "$expires" ]; then
		# Mark as expired in UCI
		for sec in $sections; do
			local sec_hash=$(uci -q get "master-link.${sec}.hash")
			if [ "$sec_hash" = "$token_hash" ]; then
				uci -q set "master-link.${sec}.status=expired"
				uci commit master-link
				break
			fi
		done
		echo '{"valid":false,"error":"token_expired"}'
		return 1
	fi

	echo "{\"valid\":true,\"token_hash\":\"$token_hash\",\"expires\":$expires}"
	return 0
}

# Revoke a token
ml_token_revoke() {
	local token="$1"
	[ -z "$token" ] && return 1

	local token_hash=$(echo "$token" | sha256sum | cut -d' ' -f1)

	local sections=$(uci -q show master-link 2>/dev/null | grep "\.hash=" | sed "s/master-link\.\(.*\)\.hash=.*/\1/")
	for sec in $sections; do
		local sec_hash=$(uci -q get "master-link.${sec}.hash")
		if [ "$sec_hash" = "$token_hash" ]; then
			uci -q set "master-link.${sec}.status=expired"
			uci commit master-link
			rm -f "$ML_TOKENS_DIR/${token_hash}"
			logger -t master-link "Token revoked: $token_hash"
			echo '{"success":true}'
			return 0
		fi
	done

	echo '{"success":false,"error":"token_not_found"}'
	return 1
}

# Cleanup expired tokens
ml_token_cleanup() {
	local now=$(date +%s)
	local cleaned=0

	local sections=$(uci -q show master-link 2>/dev/null | grep "=token$" | sed "s/master-link\.\(.*\)=token/\1/")
	for sec in $sections; do
		local expires=$(uci -q get "master-link.${sec}.expires")
		local status=$(uci -q get "master-link.${sec}.status")
		[ -z "$expires" ] && continue

		if [ "$now" -gt "$expires" ] || [ "$status" = "used" ] || [ "$status" = "expired" ]; then
			local hash=$(uci -q get "master-link.${sec}.hash")
			uci -q delete "master-link.${sec}"
			rm -f "$ML_TOKENS_DIR/${hash}"
			cleaned=$((cleaned + 1))
		fi
	done

	[ "$cleaned" -gt 0 ] && uci commit master-link
	logger -t master-link "Token cleanup: removed $cleaned expired tokens"
	echo "{\"cleaned\":$cleaned}"
}

# Generate clone-specific token with auto-approve
# Used by secubox-cloner for station cloning
ml_clone_token_generate() {
	ml_init

	local ttl="${1:-86400}"  # 24 hours default for clones
	local token_type="${2:-clone}"

	local now=$(date +%s)
	local expires=$((now + ttl))
	local rand=$(head -c 32 /dev/urandom 2>/dev/null | sha256sum | cut -d' ' -f1)
	[ -z "$rand" ] && rand=$(date +%s%N | sha256sum | cut -d' ' -f1)

	# HMAC token using master key
	local key_data=$(cat "$KEYFILE" 2>/dev/null)
	local token=$(echo "${key_data}:clone:${rand}:${now}" | sha256sum | cut -d' ' -f1)
	local token_hash=$(echo "$token" | sha256sum | cut -d' ' -f1)

	# Store token in UCI with auto_approve flag
	local section_id="clone_$(echo "$token_hash" | cut -c1-8)"
	uci -q batch <<-EOF
		set master-link.${section_id}=token
		set master-link.${section_id}.hash='${token_hash}'
		set master-link.${section_id}.created='${now}'
		set master-link.${section_id}.expires='${expires}'
		set master-link.${section_id}.peer_fp=''
		set master-link.${section_id}.status='active'
		set master-link.${section_id}.type='${token_type}'
		set master-link.${section_id}.auto_approve='1'
	EOF
	uci commit master-link

	# Store full token locally for validation
	echo "$token" > "$ML_TOKENS_DIR/${token_hash}"

	# Record in blockchain
	local fp=$(factory_fingerprint 2>/dev/null)
	chain_add_block "clone_token_generated" \
		"{\"token_hash\":\"$token_hash\",\"type\":\"$token_type\",\"expires\":$expires,\"created_by\":\"$fp\"}" \
		"$(echo "clone_token:${token_hash}:${now}" | sha256sum | cut -d' ' -f1)" >/dev/null 2>&1

	# Build join URL
	local my_addr=$(uci -q get network.lan.ipaddr)
	[ -z "$my_addr" ] && my_addr=$(ip -4 addr show br-lan 2>/dev/null | grep -oP 'inet \K[0-9.]+' | head -1)

	logger -t master-link "Clone token generated: ${token_hash} (auto-approve, expires: $(date -d @$expires -Iseconds 2>/dev/null || echo $expires))"

	cat <<-EOF
	{
		"token": "$token",
		"token_hash": "$token_hash",
		"type": "$token_type",
		"auto_approve": true,
		"expires": $expires,
		"ttl": $ttl,
		"master_ip": "$my_addr",
		"url": "http://${my_addr}:${MESH_PORT}/master-link/?token=${token}&type=clone"
	}
	EOF
}

# Check if token is a clone token with auto-approve
ml_token_is_auto_approve() {
	local token="$1"
	local token_hash=$(echo "$token" | sha256sum | cut -d' ' -f1)

	# Find token in UCI
	local sections=$(uci -q show master-link 2>/dev/null | grep "=token$" | sed "s/master-link\.\(.*\)=token/\1/")
	for sec in $sections; do
		local hash=$(uci -q get "master-link.${sec}.hash")
		if [ "$hash" = "$token_hash" ]; then
			local auto=$(uci -q get "master-link.${sec}.auto_approve")
			if [ "$auto" = "1" ]; then
				echo "true"
				return 0
			fi
			break
		fi
	done
	echo "false"
	return 1
}

# ============================================================================
# Join Protocol
# ============================================================================

# Handle join request from new node
ml_join_request() {
	local token="$1"
	local peer_fp="$2"
	local peer_addr="$3"
	local peer_hostname="${4:-unknown}"

	# Validate token
	local validation=$(ml_token_validate "$token")
	local valid=$(echo "$validation" | jsonfilter -e '@.valid' 2>/dev/null)

	if [ "$valid" != "true" ]; then
		echo "$validation"
		return 1
	fi

	local token_hash=$(echo "$token" | sha256sum | cut -d' ' -f1)

	# Store join request
	local now=$(date +%s)
	cat > "$ML_REQUESTS_DIR/${peer_fp}.json" <<-EOF
	{
		"fingerprint": "$peer_fp",
		"address": "$peer_addr",
		"hostname": "$peer_hostname",
		"token_hash": "$token_hash",
		"timestamp": $now,
		"status": "pending"
	}
	EOF

	# Add join_request block to chain
	chain_add_block "join_request" \
		"{\"fp\":\"$peer_fp\",\"addr\":\"$peer_addr\",\"hostname\":\"$peer_hostname\",\"token_hash\":\"$token_hash\"}" \
		"$(echo "join_request:${peer_fp}:${now}" | sha256sum | cut -d' ' -f1)" >/dev/null 2>&1

	logger -t master-link "Join request from $peer_hostname ($peer_fp) at $peer_addr"

	# Check auto-approve: either global setting or token-specific (clone tokens)
	local auto_approve=$(uci -q get master-link.main.auto_approve)
	local token_auto=$(ml_token_is_auto_approve "$token")

	if [ "$auto_approve" = "1" ] || [ "$token_auto" = "true" ]; then
		logger -t master-link "Auto-approving join for $peer_fp (global=$auto_approve, token=$token_auto)"
		ml_join_approve "$peer_fp"
		return $?
	fi

	echo "{\"success\":true,\"status\":\"pending\",\"message\":\"Join request queued for approval\"}"
}

# Approve a peer join request
ml_join_approve() {
	local peer_fp="$1"

	[ -z "$peer_fp" ] && {
		echo '{"error":"missing_fingerprint"}'
		return 1
	}

	local request_file="$ML_REQUESTS_DIR/${peer_fp}.json"
	[ -f "$request_file" ] || {
		echo '{"error":"no_pending_request"}'
		return 1
	}

	local peer_addr=$(jsonfilter -i "$request_file" -e '@.address' 2>/dev/null)
	local peer_hostname=$(jsonfilter -i "$request_file" -e '@.hostname' 2>/dev/null)
	local token_hash=$(jsonfilter -i "$request_file" -e '@.token_hash' 2>/dev/null)
	local orig_ts=$(jsonfilter -i "$request_file" -e '@.timestamp' 2>/dev/null)
	[ -z "$orig_ts" ] && orig_ts=0
	local now=$(date +%s)
	local my_fp=$(factory_fingerprint 2>/dev/null)
	local my_depth=$(uci -q get master-link.main.depth)
	[ -z "$my_depth" ] && my_depth=0
	local peer_depth=$((my_depth + 1))

	# Trust peer via factory TOFU
	factory_trust_peer "$peer_fp" "$peer_addr" >/dev/null 2>&1

	# Add peer to mesh
	peer_add "$peer_addr" "$MESH_PORT" "$peer_fp" >/dev/null 2>&1

	# Update request status
	cat > "$request_file" <<-EOF
	{
		"fingerprint": "$peer_fp",
		"address": "$peer_addr",
		"hostname": "$peer_hostname",
		"token_hash": "$token_hash",
		"timestamp": $orig_ts,
		"approved_at": $now,
		"approved_by": "$my_fp",
		"depth": $peer_depth,
		"status": "approved"
	}
	EOF

	# Mark token as used
	local sections=$(uci -q show master-link 2>/dev/null | grep "\.hash=" | sed "s/master-link\.\(.*\)\.hash=.*/\1/")
	for sec in $sections; do
		local sec_hash=$(uci -q get "master-link.${sec}.hash")
		if [ "$sec_hash" = "$token_hash" ]; then
			uci -q set "master-link.${sec}.status=used"
			uci -q set "master-link.${sec}.peer_fp=$peer_fp"
			uci commit master-link
			break
		fi
	done

	# Add peer_approved block to chain
	chain_add_block "peer_approved" \
		"{\"fp\":\"$peer_fp\",\"addr\":\"$peer_addr\",\"depth\":$peer_depth,\"approved_by\":\"$my_fp\"}" \
		"$(echo "peer_approved:${peer_fp}:${now}" | sha256sum | cut -d' ' -f1)" >/dev/null 2>&1

	# Sync chain with new peer
	gossip_sync >/dev/null 2>&1 &

	logger -t master-link "Peer approved: $peer_hostname ($peer_fp) at depth $peer_depth"

	cat <<-EOF
	{
		"success": true,
		"fingerprint": "$peer_fp",
		"address": "$peer_addr",
		"hostname": "$peer_hostname",
		"depth": $peer_depth,
		"status": "approved"
	}
	EOF
}

# Reject a peer join request
ml_join_reject() {
	local peer_fp="$1"
	local reason="${2:-rejected by admin}"

	[ -z "$peer_fp" ] && {
		echo '{"error":"missing_fingerprint"}'
		return 1
	}

	local request_file="$ML_REQUESTS_DIR/${peer_fp}.json"
	[ -f "$request_file" ] || {
		echo '{"error":"no_pending_request"}'
		return 1
	}

	local my_fp=$(factory_fingerprint 2>/dev/null)
	local now=$(date +%s)

	# Read all fields before overwriting
	local peer_addr=$(jsonfilter -i "$request_file" -e '@.address' 2>/dev/null)
	local peer_hostname=$(jsonfilter -i "$request_file" -e '@.hostname' 2>/dev/null)
	local orig_ts=$(jsonfilter -i "$request_file" -e '@.timestamp' 2>/dev/null)
	[ -z "$orig_ts" ] && orig_ts=0

	cat > "$request_file" <<-EOF
	{
		"fingerprint": "$peer_fp",
		"address": "$peer_addr",
		"hostname": "$peer_hostname",
		"timestamp": $orig_ts,
		"rejected_at": $now,
		"rejected_by": "$my_fp",
		"reason": "$reason",
		"status": "rejected"
	}
	EOF

	# Add peer_rejected block to chain
	chain_add_block "peer_rejected" \
		"{\"fp\":\"$peer_fp\",\"reason\":\"$reason\",\"rejected_by\":\"$my_fp\"}" \
		"$(echo "peer_rejected:${peer_fp}:${now}" | sha256sum | cut -d' ' -f1)" >/dev/null 2>&1

	logger -t master-link "Peer rejected: $peer_fp - $reason"

	echo "{\"success\":true,\"fingerprint\":\"$peer_fp\",\"status\":\"rejected\"}"
}

# ============================================================================
# IPK Generation & Serving
# ============================================================================

# Generate a minimal join IPK on-the-fly
# OpenWrt IPK format: tar.gz containing debian-binary, control.tar.gz, data.tar.gz
# Args: $1=master_ip  $2=master_depth  $3=master_hostname  $4=token_prefix
# Output: path to generated IPK file on stdout
ml_ipk_generate() {
	local master_ip="$1"
	local master_depth="${2:-0}"
	local master_hostname="${3:-secubox}"
	local token_prefix="${4:-0000}"
	local peer_depth=$((master_depth + 1))
	local version="1.0.0-${token_prefix}"

	local work="/tmp/ml-ipk-$$"
	local ipk_file="/tmp/secubox-mesh-join-$$.ipk"

	rm -rf "$work"
	mkdir -p "$work/ipk" "$work/control" "$work/data"

	# --- debian-binary ---
	printf '2.0\n' > "$work/ipk/debian-binary"

	# --- control file ---
	cat > "$work/control/control" <<-CTRL
	Package: secubox-mesh-join
	Version: ${version}
	Architecture: all
	Installed-Size: 1
	Description: SecuBox mesh join - peer of ${master_hostname} (${master_ip})
	Maintainer: SecuBox
	Section: admin
	CTRL

	# --- postinst script ---
	# Configure master-link via uci instead of shipping config file
	# (avoids file conflict with secubox-master-link package)
	cat > "$work/control/postinst" <<-POSTINST
	#!/bin/sh
	[ -n "\${IPKG_INSTROOT}" ] || {
		uci -q set master-link.main=master-link
		uci -q set master-link.main.enabled='1'
		uci -q set master-link.main.role='peer'
		uci -q set master-link.main.upstream='${master_ip}'
		uci -q set master-link.main.depth='${peer_depth}'
		uci -q set master-link.main.max_depth='3'
		uci -q set master-link.main.token_ttl='3600'
		uci -q set master-link.main.auto_approve='0'
		uci commit master-link
		/etc/init.d/master-link enable 2>/dev/null
		/etc/init.d/master-link start 2>/dev/null
	}
	exit 0
	POSTINST
	chmod 755 "$work/control/postinst"

	# --- data: empty (config is applied by postinst via uci) ---

	# --- Build inner tar.gz archives ---
	tar czf "$work/ipk/control.tar.gz" -C "$work/control" . 2>/dev/null
	tar czf "$work/ipk/data.tar.gz" -C "$work/data" . 2>/dev/null

	# --- Assemble IPK (outer tar.gz) ---
	tar czf "$ipk_file" -C "$work/ipk" \
		debian-binary control.tar.gz data.tar.gz 2>/dev/null

	rm -rf "$work"
	echo "$ipk_file"
}

# Detect master IP from CGI environment or UCI
_ml_detect_master_ip() {
	# Try HTTP_HOST (CGI environment, set by uhttpd)
	local ip=$(echo "${HTTP_HOST:-}" | cut -d: -f1)
	[ -n "$ip" ] && { echo "$ip"; return; }

	# Try UCI network config
	ip=$(uci -q get network.lan.ipaddr)
	[ -n "$ip" ] && { echo "$ip"; return; }

	# Fallback: parse ip addr
	ip addr show br-lan 2>/dev/null | grep -o 'inet [0-9.]*' | head -1 | cut -d' ' -f2
}

# Validate token and serve IPK file (pre-built or generated)
ml_ipk_serve() {
	local token="$1"

	# Validate token
	local validation=$(ml_token_validate "$token")
	local valid=$(echo "$validation" | jsonfilter -e '@.valid' 2>/dev/null)

	if [ "$valid" != "true" ]; then
		echo "Status: 403 Forbidden"
		echo "Content-Type: application/json"
		echo "Access-Control-Allow-Origin: *"
		echo ""
		echo "$validation"
		return 1
	fi

	# Try pre-built IPK first
	local ipk_path=$(uci -q get master-link.main.ipk_path)
	[ -z "$ipk_path" ] && ipk_path="/www/secubox-feed/secubox-master-link_*.ipk"

	local ipk_file=""
	for f in $ipk_path; do
		[ -f "$f" ] && ipk_file="$f"
	done

	# Fallback: generate minimal join IPK on-the-fly
	local generated=0
	if [ -z "$ipk_file" ]; then
		local master_ip=$(_ml_detect_master_ip)
		local master_depth=$(uci -q get master-link.main.depth)
		[ -z "$master_depth" ] && master_depth=0
		local master_hostname=$(uci -q get system.@system[0].hostname 2>/dev/null)
		[ -z "$master_hostname" ] && master_hostname="secubox"
		local token_hash=$(echo "$token" | sha256sum | cut -d' ' -f1)
		local token_prefix=$(echo "$token_hash" | cut -c1-8)

		ipk_file=$(ml_ipk_generate "$master_ip" "$master_depth" "$master_hostname" "$token_prefix")
		generated=1

		if [ -z "$ipk_file" ] || [ ! -f "$ipk_file" ]; then
			echo "Status: 500 Internal Server Error"
			echo "Content-Type: application/json"
			echo "Access-Control-Allow-Origin: *"
			echo ""
			echo '{"error":"ipk_generation_failed"}'
			return 1
		fi
	fi

	local filename="secubox-mesh-join.ipk"
	[ "$generated" = "0" ] && filename=$(basename "$ipk_file")
	local filesize=$(wc -c < "$ipk_file")

	echo "Content-Type: application/octet-stream"
	echo "Content-Disposition: attachment; filename=\"$filename\""
	echo "Content-Length: $filesize"
	echo "Access-Control-Allow-Origin: *"
	echo ""
	cat "$ipk_file"

	# Clean up generated IPK
	[ "$generated" = "1" ] && rm -f "$ipk_file"
}

# Return IPK metadata
ml_ipk_bundle_info() {
	local ipk_path=$(uci -q get master-link.main.ipk_path)
	[ -z "$ipk_path" ] && ipk_path="/www/secubox-feed/secubox-master-link_*.ipk"

	local ipk_file=""
	for f in $ipk_path; do
		[ -f "$f" ] && ipk_file="$f"
	done

	if [ -n "$ipk_file" ]; then
		local filename=$(basename "$ipk_file")
		local filesize=$(wc -c < "$ipk_file")
		local sha256=$(sha256sum "$ipk_file" | cut -d' ' -f1)

		cat <<-EOF
		{
			"available": true,
			"type": "prebuilt",
			"filename": "$filename",
			"size": $filesize,
			"sha256": "$sha256"
		}
		EOF
	else
		# Dynamic generation always available
		cat <<-EOF
		{
			"available": true,
			"type": "dynamic",
			"filename": "secubox-mesh-join.ipk",
			"description": "Minimal join package (generated on-the-fly)"
		}
		EOF
	fi
}

# ============================================================================
# Gigogne (Nested Hierarchy)
# ============================================================================

# Promote an approved peer to sub-master
ml_promote_to_submaster() {
	local peer_fp="$1"

	[ -z "$peer_fp" ] && {
		echo '{"error":"missing_fingerprint"}'
		return 1
	}

	# Check depth limit
	local depth_ok=$(ml_check_depth)
	local can_promote=$(echo "$depth_ok" | jsonfilter -e '@.can_promote' 2>/dev/null)

	if [ "$can_promote" != "true" ]; then
		echo "$depth_ok"
		return 1
	fi

	local request_file="$ML_REQUESTS_DIR/${peer_fp}.json"
	[ -f "$request_file" ] || {
		echo '{"error":"peer_not_found"}'
		return 1
	}

	local peer_status=$(jsonfilter -i "$request_file" -e '@.status' 2>/dev/null)
	if [ "$peer_status" != "approved" ]; then
		echo '{"error":"peer_not_approved"}'
		return 1
	fi

	local peer_addr=$(jsonfilter -i "$request_file" -e '@.address' 2>/dev/null)
	local my_depth=$(uci -q get master-link.main.depth)
	[ -z "$my_depth" ] && my_depth=0
	local new_depth=$((my_depth + 1))
	local now=$(date +%s)

	# Read all fields before truncating the file
	local peer_hostname=$(jsonfilter -i "$request_file" -e '@.hostname' 2>/dev/null)
	local token_hash=$(jsonfilter -i "$request_file" -e '@.token_hash' 2>/dev/null)
	local orig_ts=$(jsonfilter -i "$request_file" -e '@.timestamp' 2>/dev/null)
	local orig_approved=$(jsonfilter -i "$request_file" -e '@.approved_at' 2>/dev/null)

	cat > "$request_file" <<-EOF
	{
		"fingerprint": "$peer_fp",
		"address": "$peer_addr",
		"hostname": "$peer_hostname",
		"token_hash": "$token_hash",
		"timestamp": $orig_ts,
		"approved_at": $orig_approved,
		"promoted_at": $now,
		"depth": $new_depth,
		"role": "sub-master",
		"status": "approved"
	}
	EOF

	# Add peer_promoted block to chain
	chain_add_block "peer_promoted" \
		"{\"fp\":\"$peer_fp\",\"new_role\":\"sub-master\",\"new_depth\":$new_depth}" \
		"$(echo "peer_promoted:${peer_fp}:${now}" | sha256sum | cut -d' ' -f1)" >/dev/null 2>&1

	# Notify the peer to update its role (via mesh API)
	curl -s --connect-timeout 5 -X POST \
		"http://$peer_addr:$MESH_PORT/api/master-link/status" \
		-H "Content-Type: application/json" \
		-d "{\"action\":\"promote\",\"role\":\"sub-master\",\"depth\":$new_depth}" 2>/dev/null &

	logger -t master-link "Peer promoted to sub-master: $peer_fp at depth $new_depth"

	cat <<-EOF
	{
		"success": true,
		"fingerprint": "$peer_fp",
		"new_role": "sub-master",
		"new_depth": $new_depth
	}
	EOF
}

# Forward blocks to upstream master
ml_propagate_block_upstream() {
	local block_data="$1"
	local upstream=$(uci -q get master-link.main.upstream)
	[ -z "$upstream" ] && return 0

	curl -s --connect-timeout 5 -X POST \
		"http://$upstream:$MESH_PORT/api/chain" \
		-H "Content-Type: application/json" \
		-d "$block_data" 2>/dev/null

	return $?
}

# Check if depth allows sub-master promotion
ml_check_depth() {
	local depth=$(uci -q get master-link.main.depth)
	local max_depth=$(uci -q get master-link.main.max_depth)
	[ -z "$depth" ] && depth=0
	[ -z "$max_depth" ] && max_depth=3

	local next_depth=$((depth + 1))

	if [ "$next_depth" -ge "$max_depth" ]; then
		echo "{\"can_promote\":false,\"depth\":$depth,\"max_depth\":$max_depth,\"error\":\"max_depth_reached\"}"
		return 1
	fi

	echo "{\"can_promote\":true,\"depth\":$depth,\"max_depth\":$max_depth,\"next_depth\":$next_depth}"
	return 0
}

# ============================================================================
# Status & Peer Listing
# ============================================================================

# Return mesh status
ml_status() {
	ml_init 2>/dev/null

	local role=$(uci -q get master-link.main.role)
	local depth=$(uci -q get master-link.main.depth)
	local upstream=$(uci -q get master-link.main.upstream)
	local max_depth=$(uci -q get master-link.main.max_depth)
	local enabled=$(uci -q get master-link.main.enabled)
	local auto_approve=$(uci -q get master-link.main.auto_approve)
	local fp=$(factory_fingerprint 2>/dev/null)

	[ -z "$role" ] && role="master"
	[ -z "$depth" ] && depth=0
	[ -z "$max_depth" ] && max_depth=3
	[ -z "$enabled" ] && enabled=1

	# Count peers by status
	local pending=0
	local approved=0
	local rejected=0
	for req in "$ML_REQUESTS_DIR"/*.json; do
		[ -f "$req" ] || continue
		local st=$(jsonfilter -i "$req" -e '@.status' 2>/dev/null)
		case "$st" in
			pending) pending=$((pending + 1)) ;;
			approved) approved=$((approved + 1)) ;;
			rejected) rejected=$((rejected + 1)) ;;
		esac
	done

	# Count active tokens
	local active_tokens=0
	local now=$(date +%s)
	local sections=$(uci -q show master-link 2>/dev/null | grep "=token$" | sed "s/master-link\.\(.*\)=token/\1/")
	for sec in $sections; do
		local status=$(uci -q get "master-link.${sec}.status")
		local expires=$(uci -q get "master-link.${sec}.expires")
		if [ "$status" = "active" ] && [ -n "$expires" ] && [ "$now" -lt "$expires" ]; then
			active_tokens=$((active_tokens + 1))
		fi
	done

	# Chain height
	local chain_height=0
	[ -f "$CHAIN_FILE" ] && chain_height=$(jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*]' 2>/dev/null | wc -l)

	local hostname=$(uci -q get system.@system[0].hostname 2>/dev/null || hostname)

	cat <<-EOF
	{
		"enabled": $enabled,
		"role": "$role",
		"depth": $depth,
		"max_depth": $max_depth,
		"upstream": "$upstream",
		"fingerprint": "$fp",
		"hostname": "$hostname",
		"auto_approve": $auto_approve,
		"peers": {
			"pending": $pending,
			"approved": $approved,
			"rejected": $rejected,
			"total": $((pending + approved + rejected))
		},
		"active_tokens": $active_tokens,
		"chain_height": $chain_height
	}
	EOF
}

# List all peers with details
ml_peer_list() {
	local first=1
	echo '{"peers":['

	for req in "$ML_REQUESTS_DIR"/*.json; do
		[ -f "$req" ] || continue
		[ $first -eq 0 ] && echo ","
		first=0
		cat "$req" | tr '\n' ' ' | tr '\t' ' '
	done

	echo ']}'
}

# Build mesh tree from chain blocks
ml_tree() {
	local fp=$(factory_fingerprint 2>/dev/null)
	local hostname=$(uci -q get system.@system[0].hostname 2>/dev/null || hostname)
	local role=$(uci -q get master-link.main.role)
	local depth=$(uci -q get master-link.main.depth)
	[ -z "$role" ] && role="master"
	[ -z "$depth" ] && depth=0

	echo '{"tree":{'
	echo "\"fingerprint\":\"$fp\","
	echo "\"hostname\":\"$hostname\","
	echo "\"role\":\"$role\","
	echo "\"depth\":$depth,"
	echo '"children":['

	# Build children from approved peers
	local first=1
	for req in "$ML_REQUESTS_DIR"/*.json; do
		[ -f "$req" ] || continue
		local st=$(jsonfilter -i "$req" -e '@.status' 2>/dev/null)
		[ "$st" != "approved" ] && continue

		local child_fp=$(jsonfilter -i "$req" -e '@.fingerprint' 2>/dev/null)
		local child_hostname=$(jsonfilter -i "$req" -e '@.hostname' 2>/dev/null)
		local child_addr=$(jsonfilter -i "$req" -e '@.address' 2>/dev/null)
		local child_depth=$(jsonfilter -i "$req" -e '@.depth' 2>/dev/null)
		local child_role=$(jsonfilter -i "$req" -e '@.role' 2>/dev/null)
		[ -z "$child_depth" ] && child_depth=$((depth + 1))
		[ -z "$child_role" ] && child_role="peer"

		# Check if peer is online
		local online="false"
		curl -s --connect-timeout 2 "http://$child_addr:$MESH_PORT/api/status" >/dev/null 2>&1 && online="true"

		[ $first -eq 0 ] && echo ","
		first=0

		cat <<-CHILD
		{
			"fingerprint": "$child_fp",
			"hostname": "$child_hostname",
			"address": "$child_addr",
			"role": "$child_role",
			"depth": $child_depth,
			"online": $online
		}
		CHILD
	done

	echo ']}}'
}

# ============================================================================
# Auth Helpers
# ============================================================================

# Check if request is from local origin (127.0.0.1 or LAN)
ml_check_local_auth() {
	local remote_addr="${REMOTE_ADDR:-}"

	case "$remote_addr" in
		127.0.0.1|::1|"")
			return 0
			;;
	esac

	# Check if from LAN subnet
	local lan_addr=$(uci -q get network.lan.ipaddr)
	local lan_mask=$(uci -q get network.lan.netmask)

	if [ -n "$lan_addr" ]; then
		local lan_prefix=$(echo "$lan_addr" | cut -d. -f1-3)
		local remote_prefix=$(echo "$remote_addr" | cut -d. -f1-3)
		[ "$lan_prefix" = "$remote_prefix" ] && return 0
	fi

	# Check for LuCI session cookie
	local cookie="${HTTP_COOKIE:-}"
	if echo "$cookie" | grep -q "sysauth="; then
		return 0
	fi

	return 1
}

# ============================================================================
# Main CLI
# ============================================================================
case "${1:-}" in
	token-generate)
		ml_token_generate
		;;
	token-validate)
		ml_token_validate "$2"
		;;
	token-revoke)
		ml_token_revoke "$2"
		;;
	token-cleanup)
		ml_token_cleanup
		;;
	clone-token|generate-clone-token)
		# Generate clone-specific auto-approve token
		# Usage: master-link.sh clone-token [ttl]
		ml_clone_token_generate "${2:-86400}" "clone"
		;;
	register-token)
		# Register external token (for secubox-cloner integration)
		# Usage: master-link.sh register-token <token> <ttl> <type>
		local ext_token="$2"
		local ext_ttl="${3:-86400}"
		local ext_type="${4:-clone}"
		local token_hash=$(echo "$ext_token" | sha256sum | cut -d' ' -f1)
		local now=$(date +%s)
		local expires=$((now + ext_ttl))
		local section_id="ext_$(echo "$token_hash" | cut -c1-8)"
		uci -q batch <<-EOF
			set master-link.${section_id}=token
			set master-link.${section_id}.hash='${token_hash}'
			set master-link.${section_id}.created='${now}'
			set master-link.${section_id}.expires='${expires}'
			set master-link.${section_id}.peer_fp=''
			set master-link.${section_id}.status='active'
			set master-link.${section_id}.type='${ext_type}'
			set master-link.${section_id}.auto_approve='1'
		EOF
		uci commit master-link
		mkdir -p "$ML_TOKENS_DIR"
		echo "$ext_token" > "$ML_TOKENS_DIR/${token_hash}"
		logger -t master-link "External token registered: ${token_hash} (type=$ext_type, expires=$(date -d @$expires -Iseconds 2>/dev/null || echo $expires))"
		echo "{\"registered\":true,\"token_hash\":\"$token_hash\",\"expires\":$expires}"
		;;
	join-request)
		ml_join_request "$2" "$3" "$4" "$5"
		;;
	join-approve)
		ml_join_approve "$2"
		;;
	join-reject)
		ml_join_reject "$2" "$3"
		;;
	promote)
		ml_promote_to_submaster "$2"
		;;
	status)
		ml_status
		;;
	peers)
		ml_peer_list
		;;
	tree)
		ml_tree
		;;
	ipk-info)
		ml_ipk_bundle_info
		;;
	ipk-generate)
		ml_ipk_generate "$2" "$3" "$4" "$5"
		;;
	init)
		ml_init
		echo "Master-link initialized"
		;;
	*)
		# Sourced as library - do nothing
		:
		;;
esac
