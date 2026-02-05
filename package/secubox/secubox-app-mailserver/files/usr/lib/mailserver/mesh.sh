#!/bin/sh
# Mail Server Mesh Backup & Sync

CONFIG="mailserver"

get_data_path() {
	uci -q get $CONFIG.main.data_path || echo "/srv/mailserver"
}

# Backup mail data for mesh sync
mesh_backup() {
	local data_path=$(get_data_path)
	local backup_dir="/srv/backups/mailserver"
	local timestamp=$(date +%Y%m%d-%H%M%S)

	mkdir -p "$backup_dir"

	echo "Creating mail backup for mesh sync..."

	# Backup config (small, always sync)
	tar -czf "$backup_dir/config-${timestamp}.tar.gz" \
		-C "$data_path" config 2>/dev/null

	# Backup mail data (larger, selective sync)
	tar -czf "$backup_dir/mail-${timestamp}.tar.gz" \
		-C "$data_path" mail 2>/dev/null

	echo "Backup created: $backup_dir/*-${timestamp}.tar.gz"

	# Push to mesh if secubox-p2p available
	if command -v secubox-p2p >/dev/null 2>&1; then
		local mesh_enabled=$(uci -q get $CONFIG.mesh.enabled)
		if [ "$mesh_enabled" = "1" ]; then
			echo "Pushing to mesh peers..."
			secubox-p2p publish "mailbackup:config:$backup_dir/config-${timestamp}.tar.gz"
		fi
	fi
}

# Restore from mesh backup
mesh_restore() {
	local backup_file="$1"
	local data_path=$(get_data_path)

	[ -f "$backup_file" ] || { echo "Backup not found: $backup_file"; return 1; }

	echo "Restoring from: $backup_file"

	# Determine type from filename
	if echo "$backup_file" | grep -q "config-"; then
		tar -xzf "$backup_file" -C "$data_path"
	elif echo "$backup_file" | grep -q "mail-"; then
		tar -xzf "$backup_file" -C "$data_path"
	fi

	echo "Restore complete. Restart mail server to apply."
}

# Sync with mesh peers
mesh_sync() {
	local mode="${1:-pull}"

	if ! command -v secubox-p2p >/dev/null 2>&1; then
		echo "Mesh sync requires secubox-p2p"
		return 1
	fi

	local mesh_enabled=$(uci -q get $CONFIG.mesh.enabled)
	[ "$mesh_enabled" = "1" ] || { echo "Mesh sync disabled"; return 1; }

	case "$mode" in
		push)
			mesh_backup
			;;
		pull)
			echo "Checking mesh for mail backups..."
			secubox-p2p list | grep "mailbackup:" | while read entry; do
				local file=$(echo "$entry" | cut -d: -f3)
				echo "  Found: $file"
			done
			;;
		*)
			echo "Usage: mesh_sync [push|pull]"
			;;
	esac
}

# Configure mesh peers
mesh_add_peer() {
	local peer="$1"
	[ -z "$peer" ] && { echo "Usage: mesh_add_peer <peer_id>"; return 1; }

	local peers=$(uci -q get $CONFIG.mesh.backup_peers)
	if [ -z "$peers" ]; then
		uci set $CONFIG.mesh.backup_peers="$peer"
	else
		uci set $CONFIG.mesh.backup_peers="$peers $peer"
	fi
	uci commit $CONFIG

	echo "Mesh peer added: $peer"
}

# List mesh peers
mesh_list_peers() {
	local peers=$(uci -q get $CONFIG.mesh.backup_peers)
	if [ -n "$peers" ]; then
		echo "Mesh Backup Peers:"
		for peer in $peers; do
			echo "  $peer"
		done
	else
		echo "No mesh peers configured"
	fi
}
