#!/bin/sh
# SecuBox Backup - Remote Storage Functions (Gitea/Mesh)

CONFIG="backup"

# Get Gitea config
gitea_get_config() {
	local url=$(uci -q get $CONFIG.gitea.url)
	local repo=$(uci -q get $CONFIG.gitea.repo)
	local token=$(uci -q get $CONFIG.gitea.token)
	local branch=$(uci -q get $CONFIG.gitea.branch)

	[ -z "$url" ] || [ -z "$repo" ] && return 1

	echo "$url|$repo|$token|${branch:-master}"
}

# Push backup to Gitea
gitea_push() {
	local backup_file="$1"
	local message="${2:-Automated backup}"

	local config=$(gitea_get_config)
	[ -z "$config" ] && { echo "Gitea not configured"; return 1; }

	local url=$(echo "$config" | cut -d'|' -f1)
	local repo=$(echo "$config" | cut -d'|' -f2)
	local token=$(echo "$config" | cut -d'|' -f3)
	local branch=$(echo "$config" | cut -d'|' -f4)

	local filename=$(basename "$backup_file")
	local content=$(base64 -w 0 < "$backup_file")

	# Check if file exists (to update or create)
	local sha=""
	local existing=$(wget -q -O - --header="Authorization: token $token" \
		"$url/api/v1/repos/$repo/contents/backups/$filename?ref=$branch" 2>/dev/null)

	if [ -n "$existing" ]; then
		sha=$(echo "$existing" | jsonfilter -e '@.sha' 2>/dev/null)
	fi

	# Create/update file
	local payload
	if [ -n "$sha" ]; then
		payload="{\"message\":\"$message\",\"content\":\"$content\",\"sha\":\"$sha\",\"branch\":\"$branch\"}"
	else
		payload="{\"message\":\"$message\",\"content\":\"$content\",\"branch\":\"$branch\"}"
	fi

	local response=$(echo "$payload" | wget -q -O - --post-data=- \
		--header="Authorization: token $token" \
		--header="Content-Type: application/json" \
		"$url/api/v1/repos/$repo/contents/backups/$filename" 2>/dev/null)

	if echo "$response" | grep -q '"content"'; then
		echo "  Pushed to Gitea: $filename"
		return 0
	else
		echo "  Failed to push to Gitea"
		return 1
	fi
}

# Pull backup from Gitea
gitea_pull() {
	local filename="$1"
	local dest="$2"

	local config=$(gitea_get_config)
	[ -z "$config" ] && { echo "Gitea not configured"; return 1; }

	local url=$(echo "$config" | cut -d'|' -f1)
	local repo=$(echo "$config" | cut -d'|' -f2)
	local token=$(echo "$config" | cut -d'|' -f3)
	local branch=$(echo "$config" | cut -d'|' -f4)

	local response=$(wget -q -O - --header="Authorization: token $token" \
		"$url/api/v1/repos/$repo/contents/backups/$filename?ref=$branch" 2>/dev/null)

	if [ -z "$response" ]; then
		echo "  File not found on Gitea: $filename"
		return 1
	fi

	local content=$(echo "$response" | jsonfilter -e '@.content' 2>/dev/null)

	if [ -n "$content" ]; then
		echo "$content" | base64 -d > "$dest/$filename"
		echo "  Downloaded from Gitea: $filename"
		return 0
	fi

	return 1
}

# List remote backups
gitea_list() {
	local config=$(gitea_get_config)
	[ -z "$config" ] && { echo "Gitea not configured"; return 1; }

	local url=$(echo "$config" | cut -d'|' -f1)
	local repo=$(echo "$config" | cut -d'|' -f2)
	local token=$(echo "$config" | cut -d'|' -f3)
	local branch=$(echo "$config" | cut -d'|' -f4)

	local response=$(wget -q -O - --header="Authorization: token $token" \
		"$url/api/v1/repos/$repo/contents/backups?ref=$branch" 2>/dev/null)

	if [ -z "$response" ]; then
		echo "  No remote backups found"
		return 0
	fi

	echo "$response" | jsonfilter -e '@[*].name' 2>/dev/null | while read name; do
		local size=$(echo "$response" | jsonfilter -e "@[@.name='$name'].size" 2>/dev/null)
		printf "%-50s %s\n" "$name" "${size:-?} bytes"
	done
}

# Sync with mesh peers (placeholder)
mesh_sync() {
	local mode="${1:-push}"

	if command -v secubox-p2p >/dev/null 2>&1; then
		case "$mode" in
			push)
				echo "  Pushing to mesh peers..."
				secubox-p2p push-backup 2>/dev/null || echo "  Mesh sync not implemented"
				;;
			pull)
				echo "  Pulling from mesh peers..."
				secubox-p2p pull-backup 2>/dev/null || echo "  Mesh sync not implemented"
				;;
		esac
	else
		echo "  Mesh (secubox-p2p) not available"
	fi
}
