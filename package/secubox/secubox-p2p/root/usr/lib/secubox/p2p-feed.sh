#!/bin/sh
# P2P Feed Library - Package federation functions
# Provides package catalog parsing, peer discovery, and fetch operations

FEED_DIR="/www/secubox-feed"
PACKAGES_FILE="$FEED_DIR/Packages"
PEER_CACHE_DIR="/tmp/secubox-p2p-feed-cache"
PEER_CACHE_TTL=300  # 5 minutes

# Get local node info
get_local_node_id() {
	cat /var/run/secubox-p2p/node.id 2>/dev/null || hostname
}

get_local_node_name() {
	uci -q get system.@system[0].hostname || hostname
}

# Check if local feed sharing is enabled
feed_sharing_enabled() {
	local enabled=$(uci -q get secubox-p2p.feed.share_feed)
	[ "$enabled" = "1" ]
}

# Check if local feed exists and is valid
feed_exists() {
	[ -f "$PACKAGES_FILE" ] && [ -s "$PACKAGES_FILE" ]
}

# Get feed hash (for change detection)
get_feed_hash() {
	if feed_exists; then
		sha256sum "$PACKAGES_FILE" 2>/dev/null | cut -c1-16
	else
		echo "none"
	fi
}

# Get package count from Packages file
get_package_count() {
	if feed_exists; then
		grep -c '^Package:' "$PACKAGES_FILE" 2>/dev/null || echo "0"
	else
		echo "0"
	fi
}

# Parse Packages file and output JSON array
# Reads standard opkg Packages format and converts to JSON
packages_to_json() {
	local packages_file="${1:-$PACKAGES_FILE}"
	[ -f "$packages_file" ] || { echo '[]'; return; }

	awk '
	BEGIN {
		first = 1
		printf "["
	}

	# Empty line marks end of package block
	/^$/ {
		if (pkg_name != "") {
			if (!first) printf ","
			first = 0
			printf "\n{"
			printf "\"name\":\"%s\"", pkg_name
			printf ",\"version\":\"%s\"", pkg_version
			printf ",\"architecture\":\"%s\"", pkg_arch
			printf ",\"size\":%s", (pkg_size != "" ? pkg_size : "0")
			printf ",\"installed_size\":%s", (pkg_isize != "" ? pkg_isize : "0")
			if (pkg_sha256 != "") printf ",\"sha256\":\"%s\"", pkg_sha256
			if (pkg_depends != "") printf ",\"depends\":\"%s\"", pkg_depends
			if (pkg_desc != "") {
				gsub(/"/, "\\\"", pkg_desc)
				printf ",\"description\":\"%s\"", pkg_desc
			}
			if (pkg_filename != "") printf ",\"filename\":\"%s\"", pkg_filename
			printf "}"
		}
		pkg_name = pkg_version = pkg_arch = pkg_size = pkg_isize = ""
		pkg_sha256 = pkg_depends = pkg_desc = pkg_filename = ""
		next
	}

	/^Package:/ { pkg_name = $2 }
	/^Version:/ { pkg_version = $2 }
	/^Architecture:/ { pkg_arch = $2 }
	/^Size:/ { pkg_size = $2 }
	/^Installed-Size:/ { pkg_isize = $2 }
	/^SHA256sum:/ { pkg_sha256 = $2 }
	/^Depends:/ {
		pkg_depends = $0
		sub(/^Depends: */, "", pkg_depends)
	}
	/^Description:/ {
		pkg_desc = $0
		sub(/^Description: */, "", pkg_desc)
	}
	/^Filename:/ { pkg_filename = $2 }

	END {
		# Handle last package if file doesnt end with empty line
		if (pkg_name != "") {
			if (!first) printf ","
			printf "\n{"
			printf "\"name\":\"%s\"", pkg_name
			printf ",\"version\":\"%s\"", pkg_version
			printf ",\"architecture\":\"%s\"", pkg_arch
			printf ",\"size\":%s", (pkg_size != "" ? pkg_size : "0")
			printf ",\"installed_size\":%s", (pkg_isize != "" ? pkg_isize : "0")
			if (pkg_sha256 != "") printf ",\"sha256\":\"%s\"", pkg_sha256
			if (pkg_depends != "") printf ",\"depends\":\"%s\"", pkg_depends
			if (pkg_desc != "") {
				gsub(/"/, "\\\"", pkg_desc)
				printf ",\"description\":\"%s\"", pkg_desc
			}
			if (pkg_filename != "") printf ",\"filename\":\"%s\"", pkg_filename
			printf "}"
		}
		printf "\n]"
	}
	' "$packages_file"
}

# Get list of mesh peers with active feeds
# Returns: peer_addr|peer_name|feed_hash|pkg_count for each peer
get_feed_peers() {
	local peers_file="/tmp/secubox-p2p-peers.json"
	[ -f "$peers_file" ] || return

	local peer_count=$(jsonfilter -i "$peers_file" -e '@.peers[*]' 2>/dev/null | wc -l)
	local i=0

	while [ $i -lt $peer_count ]; do
		local is_local=$(jsonfilter -i "$peers_file" -e "@.peers[$i].is_local" 2>/dev/null)
		[ "$is_local" = "true" ] && { i=$((i + 1)); continue; }

		local peer_addr=$(jsonfilter -i "$peers_file" -e "@.peers[$i].address" 2>/dev/null)
		local peer_name=$(jsonfilter -i "$peers_file" -e "@.peers[$i].name" 2>/dev/null)
		local peer_wg=$(jsonfilter -i "$peers_file" -e "@.peers[$i].wg_addresses" 2>/dev/null | cut -d',' -f1)

		# Prefer WireGuard address for mesh access
		local use_addr="$peer_addr"
		[ -n "$peer_wg" ] && use_addr="$peer_wg"

		[ -n "$use_addr" ] || { i=$((i + 1)); continue; }

		# Check if peer has feed available (quick probe)
		local feed_info=$(probe_peer_feed "$use_addr")
		if [ -n "$feed_info" ]; then
			echo "$use_addr|$peer_name|$feed_info"
		fi

		i=$((i + 1))
	done
}

# Probe a peer for feed availability
# Returns: feed_hash|pkg_count if available, empty if not
probe_peer_feed() {
	local peer_addr="$1"
	local cache_file="$PEER_CACHE_DIR/${peer_addr}.probe"

	mkdir -p "$PEER_CACHE_DIR"

	# Check cache
	if [ -f "$cache_file" ]; then
		local cache_time=$(stat -c %Y "$cache_file" 2>/dev/null || echo 0)
		local now=$(date +%s)
		local age=$((now - cache_time))
		if [ $age -lt $PEER_CACHE_TTL ]; then
			cat "$cache_file"
			return
		fi
	fi

	# Probe peer's packages API
	local result=$(curl -s --connect-timeout 2 --max-time 5 \
		"http://${peer_addr}:7331/api/factory/packages?info_only=1" 2>/dev/null)

	if [ -n "$result" ]; then
		local feed_hash=$(echo "$result" | jsonfilter -e '@.feed_hash' 2>/dev/null)
		local pkg_count=$(echo "$result" | jsonfilter -e '@.package_count' 2>/dev/null)
		if [ -n "$feed_hash" ]; then
			echo "$feed_hash|$pkg_count" > "$cache_file"
			echo "$feed_hash|$pkg_count"
			return
		fi
	fi

	# Mark as unavailable
	echo "" > "$cache_file"
}

# Fetch package catalog from a peer
# Returns JSON package list
fetch_peer_packages() {
	local peer_addr="$1"
	local cache_file="$PEER_CACHE_DIR/${peer_addr}.packages"

	mkdir -p "$PEER_CACHE_DIR"

	# Check cache
	if [ -f "$cache_file" ]; then
		local cache_time=$(stat -c %Y "$cache_file" 2>/dev/null || echo 0)
		local now=$(date +%s)
		local age=$((now - cache_time))
		if [ $age -lt $PEER_CACHE_TTL ]; then
			cat "$cache_file"
			return
		fi
	fi

	# Fetch from peer
	local result=$(curl -s --connect-timeout 5 --max-time 30 \
		"http://${peer_addr}:7331/api/factory/packages" 2>/dev/null)

	if [ -n "$result" ]; then
		echo "$result" > "$cache_file"
		echo "$result"
	fi
}

# Fetch a specific IPK file from a peer
# Downloads to local feed directory
fetch_peer_ipk() {
	local peer_addr="$1"
	local package_name="$2"
	local filename="$3"

	[ -n "$peer_addr" ] && [ -n "$package_name" ] || return 1

	# If filename not provided, try to construct it
	if [ -z "$filename" ]; then
		# Need to get filename from peer's package info
		local pkg_info=$(curl -s --connect-timeout 2 --max-time 5 \
			"http://${peer_addr}:7331/api/factory/packages?package=$package_name" 2>/dev/null)
		filename=$(echo "$pkg_info" | jsonfilter -e '@.packages[0].filename' 2>/dev/null)
	fi

	[ -n "$filename" ] || return 1

	# Download IPK
	local dest="$FEED_DIR/$filename"
	curl -s --connect-timeout 5 --max-time 300 \
		-o "$dest" \
		"http://${peer_addr}/secubox-feed/$filename" 2>/dev/null

	if [ -f "$dest" ] && [ -s "$dest" ]; then
		# Verify download (basic check)
		if file "$dest" | grep -qi "gzip\|compressed"; then
			return 0
		else
			rm -f "$dest"
			return 1
		fi
	fi

	return 1
}

# Search for a package across local and all peers
# Returns: source|peer_addr|version for each match
search_package() {
	local pkg_name="$1"
	local results=""

	# Check local first
	if feed_exists; then
		local local_version=$(awk -v pkg="$pkg_name" '
			/^Package:/ { current_pkg = $2 }
			/^Version:/ { if (current_pkg == pkg) print $2; current_pkg = "" }
		' "$PACKAGES_FILE")

		if [ -n "$local_version" ]; then
			echo "local||$local_version"
		fi
	fi

	# Check peers
	local peers=$(get_feed_peers)
	for peer_line in $peers; do
		local peer_addr=$(echo "$peer_line" | cut -d'|' -f1)
		local peer_name=$(echo "$peer_line" | cut -d'|' -f2)

		local pkg_info=$(curl -s --connect-timeout 2 --max-time 5 \
			"http://${peer_addr}:7331/api/factory/packages?package=$pkg_name" 2>/dev/null)

		if [ -n "$pkg_info" ]; then
			local version=$(echo "$pkg_info" | jsonfilter -e '@.packages[0].version' 2>/dev/null)
			if [ -n "$version" ]; then
				echo "peer|$peer_addr|$version"
			fi
		fi
	done
}

# Invalidate peer cache
invalidate_peer_cache() {
	local peer_addr="$1"
	if [ -n "$peer_addr" ]; then
		rm -f "$PEER_CACHE_DIR/${peer_addr}."*
	else
		rm -rf "$PEER_CACHE_DIR"
	fi
}

# Get aggregated package list from local + all peers
# Outputs unified JSON with source attribution
get_all_packages() {
	local node_id=$(get_local_node_id)
	local node_name=$(get_local_node_name)

	echo '{"sources":['

	local first_source=1

	# Local packages
	if feed_exists && feed_sharing_enabled; then
		echo '{'
		echo "\"node_id\":\"$node_id\","
		echo "\"node_name\":\"$node_name\","
		echo "\"type\":\"local\","
		echo "\"feed_hash\":\"$(get_feed_hash)\","
		echo "\"package_count\":$(get_package_count),"
		echo "\"packages\":$(packages_to_json)"
		echo '}'
		first_source=0
	fi

	# Peer packages
	local peers=$(get_feed_peers)
	for peer_line in $peers; do
		local peer_addr=$(echo "$peer_line" | cut -d'|' -f1)
		local peer_name=$(echo "$peer_line" | cut -d'|' -f2)
		local feed_info=$(echo "$peer_line" | cut -d'|' -f3-)
		local feed_hash=$(echo "$feed_info" | cut -d'|' -f1)
		local pkg_count=$(echo "$feed_info" | cut -d'|' -f2)

		[ $first_source -eq 0 ] && echo ','
		first_source=0

		echo '{'
		echo "\"node_id\":\"$peer_addr\","
		echo "\"node_name\":\"$peer_name\","
		echo "\"type\":\"peer\","
		echo "\"address\":\"$peer_addr\","
		echo "\"feed_hash\":\"$feed_hash\","
		echo "\"package_count\":${pkg_count:-0}"
		echo '}'
	done

	echo ']}'
}
