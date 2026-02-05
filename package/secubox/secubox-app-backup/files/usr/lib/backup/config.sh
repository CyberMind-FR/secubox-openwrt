#!/bin/sh
# SecuBox Backup - Configuration Backup Functions

CONFIG_DIRS="/etc/config /etc/secubox /etc/haproxy /etc/mitmproxy"
CERT_DIRS="/srv/haproxy/certs /etc/acme"
PROFILE_DIR="/etc/secubox/profiles"

# Backup UCI and related configs
config_backup() {
	local dest="$1"
	local timestamp=$(date +%Y%m%d-%H%M%S)
	local backup_file="${dest}/config-${timestamp}.tar.gz"

	echo "  Backing up UCI configs..."

	# Create temp dir for staging
	local staging="/tmp/backup_staging_$$"
	mkdir -p "$staging"

	# Copy config dirs
	for dir in $CONFIG_DIRS; do
		if [ -d "$dir" ]; then
			local reldir=$(dirname "$dir")
			mkdir -p "$staging$reldir"
			cp -a "$dir" "$staging$reldir/" 2>/dev/null
		fi
	done

	# Copy certs
	for dir in $CERT_DIRS; do
		if [ -d "$dir" ]; then
			local reldir=$(dirname "$dir")
			mkdir -p "$staging$reldir"
			cp -a "$dir" "$staging$reldir/" 2>/dev/null
		fi
	done

	# Create manifest
	cat > "$staging/manifest.json" << EOF
{
	"type": "config",
	"timestamp": "$(date -Iseconds)",
	"hostname": "$(uci -q get system.@system[0].hostname)",
	"version": "$(cat /etc/secubox-version 2>/dev/null || echo 'unknown')",
	"files": $(find "$staging" -type f | wc -l)
}
EOF

	# Create archive
	tar -czf "$backup_file" -C "$staging" .

	# Cleanup
	rm -rf "$staging"

	local size=$(du -sh "$backup_file" 2>/dev/null | awk '{print $1}')
	echo "  Config backup created: $backup_file ($size)"

	return 0
}

# Restore config from backup
config_restore() {
	local backup_file="$1"
	local dry_run="${2:-0}"

	[ -f "$backup_file" ] || { echo "Backup file not found: $backup_file"; return 1; }

	local staging="/tmp/restore_staging_$$"
	mkdir -p "$staging"

	echo "  Extracting backup..."
	tar -xzf "$backup_file" -C "$staging"

	# Show manifest
	if [ -f "$staging/manifest.json" ]; then
		echo "  Backup info:"
		cat "$staging/manifest.json" | grep -E "timestamp|hostname|version" | sed 's/[",]//g' | sed 's/^/    /'
	fi

	if [ "$dry_run" = "1" ]; then
		echo "  [DRY RUN] Would restore:"
		find "$staging" -type f ! -name "manifest.json" | while read f; do
			echo "    $f"
		done | head -20
		rm -rf "$staging"
		return 0
	fi

	# Create safety backup
	echo "  Creating safety backup..."
	config_backup "/tmp" >/dev/null 2>&1

	# Restore files
	echo "  Restoring configs..."
	for dir in $CONFIG_DIRS $CERT_DIRS; do
		local reldir="${dir#/}"
		if [ -d "$staging/$reldir" ]; then
			cp -a "$staging/$reldir"/* "$dir/" 2>/dev/null
		fi
	done

	# Cleanup
	rm -rf "$staging"

	# Reload services
	echo "  Reloading services..."
	/etc/init.d/network reload 2>/dev/null &
	ubus call uci reload 2>/dev/null &

	echo "  Config restore complete"
	return 0
}

# Export specific UCI config
config_export_uci() {
	local config="$1"
	local dest="$2"

	uci export "$config" > "${dest}/${config}.uci" 2>/dev/null
}

# List config backups
config_list_backups() {
	local backup_dir="$1"

	ls -lh "${backup_dir}/config-"*.tar* 2>/dev/null | while read line; do
		local file=$(echo "$line" | awk '{print $NF}')
		local size=$(echo "$line" | awk '{print $5}')
		local date=$(echo "$line" | awk '{print $6" "$7" "$8}')
		printf "%-40s %-10s %s\n" "$(basename "$file")" "$size" "$date"
	done
}
