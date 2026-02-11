#!/bin/sh
# SecuBox Backup - LXC Container Functions

LXC_DIR="/srv/lxc"

# List all LXC containers with status
container_list() {
	local json="${1:-0}"

	if [ "$json" = "1" ]; then
		printf '['
		local first=1
		for dir in $LXC_DIR/*/; do
			[ -d "$dir" ] || continue
			local name=$(basename "$dir")
			[ -f "$dir/config" ] || continue

			[ $first -eq 0 ] && printf ','
			first=0

			local state="stopped"
			lxc-info -n "$name" 2>/dev/null | grep -q "RUNNING" && state="running"

			local size=$(du -sh "$dir" 2>/dev/null | awk '{print $1}')

			printf '{"name":"%s","state":"%s","size":"%s"}' "$name" "$state" "$size"
		done
		printf ']'
	else
		printf "%-20s %-10s %-10s\n" "CONTAINER" "STATE" "SIZE"
		printf "%-20s %-10s %-10s\n" "---------" "-----" "----"

		for dir in $LXC_DIR/*/; do
			[ -d "$dir" ] || continue
			local name=$(basename "$dir")
			[ -f "$dir/config" ] || continue

			local state="stopped"
			lxc-info -n "$name" 2>/dev/null | grep -q "RUNNING" && state="running"

			local size=$(du -sh "$dir" 2>/dev/null | awk '{print $1}')

			printf "%-20s %-10s %-10s\n" "$name" "$state" "$size"
		done
	fi
}

# Backup single container
container_backup() {
	local name="$1"
	local dest="$2"
	local compress="${3:-1}"

	[ -d "$LXC_DIR/$name" ] || { echo "Container not found: $name"; return 1; }

	local was_running=0
	lxc-info -n "$name" 2>/dev/null | grep -q "RUNNING" && was_running=1

	# Stop container if running
	if [ "$was_running" = "1" ]; then
		echo "  Stopping container..."
		lxc-stop -n "$name" -t 30 2>/dev/null
	fi

	local timestamp=$(date +%Y%m%d-%H%M%S)
	local backup_file="${dest}/${name}-${timestamp}"

	# Create backup
	echo "  Creating backup..."
	if [ "$compress" = "1" ]; then
		tar -czf "${backup_file}.tar.gz" -C "$LXC_DIR" "$name"
		backup_file="${backup_file}.tar.gz"
	else
		tar -cf "${backup_file}.tar" -C "$LXC_DIR" "$name"
		backup_file="${backup_file}.tar"
	fi

	# Save config separately for easy inspection
	cp "$LXC_DIR/$name/config" "${dest}/${name}-${timestamp}.config"

	# Restart if was running
	if [ "$was_running" = "1" ]; then
		echo "  Restarting container..."
		lxc-start -n "$name"
	fi

	local size=$(du -sh "$backup_file" 2>/dev/null | awk '{print $1}')
	echo "  Backup created: $backup_file ($size)"

	return 0
}

# Restore container from backup
container_restore() {
	local name="$1"
	local backup_file="$2"

	[ -f "$backup_file" ] || { echo "Backup file not found: $backup_file"; return 1; }

	# Stop container if running
	if lxc-info -n "$name" 2>/dev/null | grep -q "RUNNING"; then
		echo "  Stopping container..."
		lxc-stop -n "$name" -t 30 2>/dev/null
	fi

	# Backup current state first
	if [ -d "$LXC_DIR/$name" ]; then
		echo "  Creating safety backup..."
		local safety_backup="${LXC_DIR}/${name}.pre-restore.tar.gz"
		tar -czf "$safety_backup" -C "$LXC_DIR" "$name" 2>/dev/null

		echo "  Removing old container..."
		rm -rf "$LXC_DIR/$name"
	fi

	# Extract backup
	echo "  Extracting backup..."
	mkdir -p "$LXC_DIR"
	if echo "$backup_file" | grep -q '\.gz$'; then
		tar -xzf "$backup_file" -C "$LXC_DIR"
	else
		tar -xf "$backup_file" -C "$LXC_DIR"
	fi

	# Start container
	echo "  Starting container..."
	lxc-start -n "$name"

	local state="stopped"
	sleep 2
	lxc-info -n "$name" 2>/dev/null | grep -q "RUNNING" && state="running"

	echo "  Container restored: $name ($state)"
	return 0
}

# List container backups
container_list_backups() {
	local name="$1"
	local backup_dir="$2"

	ls -lh "${backup_dir}/${name}-"*.tar* 2>/dev/null | while read line; do
		local file=$(echo "$line" | awk '{print $NF}')
		local size=$(echo "$line" | awk '{print $5}')
		local date=$(echo "$line" | awk '{print $6" "$7" "$8}')
		printf "%-50s %-10s %s\n" "$(basename "$file")" "$size" "$date"
	done
}
