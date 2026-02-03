#!/bin/sh
#
# secubox-sysupgrade.sh - Upgrade a running SecuBox via OpenWrt ASU API
#
# Detects the current device, packages, and version, then requests a
# custom sysupgrade image from the ASU server with all packages preserved.
#
# Usage:
#   secubox-sysupgrade check      # Show current version + available upgrades
#   secubox-sysupgrade build      # Request new image from ASU
#   secubox-sysupgrade upgrade    # Build + download + sysupgrade
#   secubox-sysupgrade status     # Show current device info
#

ASU_URL="https://sysupgrade.openwrt.org"
DOWNLOAD_DIR="/tmp"
IMAGE_FILE="$DOWNLOAD_DIR/secubox-sysupgrade.img.gz"
LOG="/tmp/secubox-sysupgrade.log"
FEED_URL="https://github.com/gkerma/secubox-openwrt/releases/latest/download"

log() { echo "[$(date +%T)] $*" | tee -a "$LOG"; }
log_info() { echo "[INFO] $*"; }
log_warn() { echo "[WARN] $*" >&2; }
log_error() { echo "[ERROR] $*" >&2; }

usage() {
	cat <<'EOF'
Usage: secubox-sysupgrade <command>

Commands:
  check       Show current version and check for updates
  build       Request a new image from ASU (does not flash)
  upgrade     Build + download + sysupgrade (flashes the device)
  status      Show current device info

Options:
  -v VERSION  Target OpenWrt version (default: current)
  -y          Skip confirmation prompt for upgrade
  -h          Show this help
EOF
}

# =============================================================================
# Device Detection
# =============================================================================

detect_device() {
	# OpenWrt version
	if [ -f /etc/os-release ]; then
		. /etc/os-release
		CURRENT_VERSION="${VERSION_ID:-unknown}"
	else
		CURRENT_VERSION="unknown"
	fi

	# Target from board.json
	if [ -f /etc/board.json ] && command -v jsonfilter >/dev/null 2>&1; then
		BOARD_TARGET=$(jsonfilter -i /etc/board.json -e '@.target.name' 2>/dev/null || echo "")
		BOARD_PROFILE=$(jsonfilter -i /etc/board.json -e '@.model.id' 2>/dev/null || echo "")
		BOARD_NAME=$(jsonfilter -i /etc/board.json -e '@.model.name' 2>/dev/null || echo "")
	fi

	# Fallback: read from /tmp/sysinfo
	[ -z "$BOARD_TARGET" ] && BOARD_TARGET=$(cat /tmp/sysinfo/board_name 2>/dev/null | sed 's/,.*//')

	# Normalize profile: comma -> underscore
	BOARD_PROFILE=$(echo "$BOARD_PROFILE" | tr ',' '_')

	# Installed packages (names only)
	INSTALLED_PACKAGES=$(opkg list-installed 2>/dev/null | awk '{print $1}' | sort)
	PACKAGE_COUNT=$(echo "$INSTALLED_PACKAGES" | wc -l)
}

# =============================================================================
# Sysupgrade Config
# =============================================================================

ensure_sysupgrade_conf() {
	local conf="/etc/sysupgrade.conf"
	for path in /etc/config/ /etc/secubox/ /etc/opkg/customfeeds.conf /srv/; do
		grep -q "^${path}$" "$conf" 2>/dev/null || echo "$path" >> "$conf"
	done
}

# Ensure SecuBox feed is configured for post-upgrade
ensure_feed() {
	local feed_conf="/etc/opkg/customfeeds.conf"
	grep -q "secubox" "$feed_conf" 2>/dev/null || {
		echo "src/gz secubox $FEED_URL" >> "$feed_conf"
		log "Added SecuBox feed to $feed_conf"
	}
}

# =============================================================================
# ASU API
# =============================================================================

# Build JSON request body
build_request() {
	local version="${1:-$CURRENT_VERSION}"
	local packages

	# Convert package list to JSON array
	packages=$(echo "$INSTALLED_PACKAGES" | awk '{printf "\"%s\",", $1}' | sed 's/,$//')

	cat <<EOF
{
  "profile": "$BOARD_PROFILE",
  "target": "$BOARD_TARGET",
  "version": "$version",
  "packages": [$packages],
  "rootfs_size_mb": 1024,
  "diff_packages": true,
  "client": "secubox-sysupgrade/1.0"
}
EOF
}

# Submit build to ASU
asu_build() {
	local version="${1:-$CURRENT_VERSION}"
	local json
	json=$(build_request "$version")

	log "Submitting build request to ASU..."
	log "  Target: $BOARD_TARGET"
	log "  Profile: $BOARD_PROFILE"
	log "  Version: $version"
	log "  Packages: $PACKAGE_COUNT"

	local tmpfile="/tmp/secubox-asu-request.json"
	echo "$json" > "$tmpfile"

	local response
	response=$(curl -s -w "\n%{http_code}" \
		-H "Content-Type: application/json" \
		-d "@$tmpfile" \
		"$ASU_URL/api/v1/build" 2>>"$LOG")

	local http_code
	http_code=$(echo "$response" | tail -1)
	local body
	body=$(echo "$response" | sed '$d')

	rm -f "$tmpfile"

	case "$http_code" in
		200)
			log_info "Build completed (cached)"
			echo "$body"
			return 0
			;;
		202)
			log_info "Build queued, waiting..."
			# Extract request hash and poll
			local hash
			hash=$(echo "$body" | jsonfilter -e '@.request_hash' 2>/dev/null || echo "")
			if [ -n "$hash" ]; then
				poll_build "$hash"
				return $?
			fi
			echo "$body"
			return 0
			;;
		400|422)
			log_error "Build request rejected:"
			echo "$body" >&2
			return 1
			;;
		500)
			log_error "ASU server error"
			echo "$body" >&2
			return 1
			;;
		*)
			log_error "Unexpected HTTP $http_code"
			echo "$body" >&2
			return 1
			;;
	esac
}

# Poll build status
poll_build() {
	local hash="$1"
	local max_wait=600
	local interval=10
	local elapsed=0

	while [ $elapsed -lt $max_wait ]; do
		local response
		response=$(curl -s "$ASU_URL/api/v1/build/$hash" 2>/dev/null)

		# Check if response has images (= complete)
		local image_count
		image_count=$(echo "$response" | jsonfilter -e '@.images[*]' 2>/dev/null | wc -l)

		if [ "$image_count" -gt 0 ] 2>/dev/null; then
			log_info "Build complete!"
			echo "$response"
			return 0
		fi

		printf "\r  Building... %ds elapsed   " "$elapsed"
		sleep "$interval"
		elapsed=$((elapsed + interval))
	done

	echo ""
	log_error "Build timed out after ${max_wait}s"
	return 1
}

# Download sysupgrade image from build response
download_image() {
	local build_response="$1"

	# Find sysupgrade image name
	local image_name=""
	local image_sha256=""

	# Find best image: prefer sysupgrade, then ext4-sdcard, then any sdcard
	local images
	images=$(echo "$build_response" | jsonfilter -e '@.images[*].name' 2>/dev/null)

	for name in $images; do
		case "$name" in
			*sysupgrade*)
				image_name="$name"
				break
				;;
		esac
	done

	# Fallback: prefer ext4-sdcard (better for resize)
	if [ -z "$image_name" ]; then
		for name in $images; do
			case "$name" in
				*ext4*sdcard*)
					image_name="$name"
					break
					;;
			esac
		done
	fi

	# Fallback: any sdcard
	if [ -z "$image_name" ]; then
		for name in $images; do
			case "$name" in
				*sdcard*)
					image_name="$name"
					break
					;;
			esac
		done
	fi

	if [ -z "$image_name" ]; then
		log_error "No sysupgrade or sdcard image found in build"
		log_error "Available images:"
		echo "$images" >&2
		return 1
	fi

	# Extract request_hash (used as store directory in ASU)
	local request_hash
	request_hash=$(echo "$build_response" | jsonfilter -e '@.request_hash' 2>/dev/null || echo "")

	local download_url
	if [ -n "$request_hash" ]; then
		download_url="$ASU_URL/store/$request_hash/$image_name"
	else
		# Fallback: try image_prefix
		local image_prefix
		image_prefix=$(echo "$build_response" | jsonfilter -e '@.image_prefix' 2>/dev/null || echo "")
		download_url="$ASU_URL/store/$image_prefix/$image_name"
	fi

	log "Downloading: $image_name"
	curl -# -o "$IMAGE_FILE" "$download_url" 2>>"$LOG" || {
		log_error "Download failed"
		return 1
	}

	local size
	size=$(ls -lh "$IMAGE_FILE" 2>/dev/null | awk '{print $5}')
	log_info "Downloaded: $IMAGE_FILE ($size)"

	# Verify checksum if available
	local expected_sha
	# Find sha256 for the sysupgrade image
	expected_sha=$(echo "$build_response" | jsonfilter -e '@.images[*]' 2>/dev/null | \
		while read -r line; do
			echo "$line"
		done | grep -A1 "$image_name" | grep sha256 | head -1)

	if [ -n "$expected_sha" ]; then
		local actual_sha
		actual_sha=$(sha256sum "$IMAGE_FILE" | awk '{print $1}')
		log_info "SHA256: $actual_sha"
	fi

	return 0
}

# =============================================================================
# Commands
# =============================================================================

cmd_status() {
	detect_device

	echo "SecuBox Device Info"
	echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	echo "  OpenWrt Version : $CURRENT_VERSION"
	echo "  Target          : $BOARD_TARGET"
	echo "  Profile         : $BOARD_PROFILE"
	echo "  Board           : $BOARD_NAME"
	echo "  Packages        : $PACKAGE_COUNT installed"
	echo "  SecuBox pkgs    : $(echo "$INSTALLED_PACKAGES" | grep -c secubox) installed"
	echo "  Disk usage      : $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
	echo "  Uptime          : $(uptime | sed 's/.*up //' | sed 's/,.*load.*//')"
	echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

cmd_check() {
	detect_device

	echo "Current: OpenWrt $CURRENT_VERSION ($BOARD_TARGET / $BOARD_PROFILE)"
	echo "Packages: $PACKAGE_COUNT installed"
	echo ""

	# Check ASU for available versions
	log_info "Checking ASU server for available versions..."
	local overview
	overview=$(curl -s "$ASU_URL/api/v1/overview" 2>/dev/null)

	if [ -n "$overview" ]; then
		# Try to extract version info
		local branches
		branches=$(echo "$overview" | jsonfilter -e '@.branches[*]' 2>/dev/null || echo "")
		if [ -n "$branches" ]; then
			echo "Available branches:"
			echo "$branches" | while read -r branch; do
				echo "  - $branch"
			done
		else
			log_info "ASU server reachable"
		fi
	else
		log_warn "Could not reach ASU server"
	fi
}

cmd_build() {
	detect_device

	local version="${TARGET_VERSION:-$CURRENT_VERSION}"

	log_info "Building image for $BOARD_PROFILE ($BOARD_TARGET) v$version"
	log_info "$PACKAGE_COUNT packages will be preserved"
	echo ""

	local result
	result=$(asu_build "$version") || return 1

	download_image "$result" || return 1

	echo ""
	log_info "Image ready: $IMAGE_FILE"
	log_info "To flash: sysupgrade -v $IMAGE_FILE"
}

cmd_upgrade() {
	detect_device
	ensure_sysupgrade_conf
	ensure_feed

	local version="${TARGET_VERSION:-$CURRENT_VERSION}"
	local skip_confirm="${SKIP_CONFIRM:-0}"

	echo "SecuBox Sysupgrade"
	echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	echo "  Current : OpenWrt $CURRENT_VERSION"
	echo "  Target  : OpenWrt $version"
	echo "  Device  : $BOARD_PROFILE ($BOARD_TARGET)"
	echo "  Packages: $PACKAGE_COUNT"
	echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	echo ""

	if [ "$skip_confirm" != "1" ]; then
		printf "Proceed with sysupgrade? [y/N] "
		read -r confirm
		case "$confirm" in
			y|Y|yes|YES) ;;
			*) log_info "Aborted"; return 0 ;;
		esac
	fi

	# Build
	log_info "Step 1/3: Building image..."
	local result
	result=$(asu_build "$version") || return 1

	# Download
	log_info "Step 2/3: Downloading image..."
	download_image "$result" || return 1

	# Sysupgrade
	log_info "Step 3/3: Applying sysupgrade..."
	log_info "The device will reboot. Reconnect in ~60 seconds."
	echo ""

	sysupgrade -v "$IMAGE_FILE"
}

# =============================================================================
# Main
# =============================================================================

TARGET_VERSION=""
SKIP_CONFIRM=0

# Parse options
while [ $# -gt 0 ]; do
	case "$1" in
		-v)
			TARGET_VERSION="$2"
			shift 2
			;;
		-y)
			SKIP_CONFIRM=1
			shift
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			break
			;;
	esac
done

case "${1:-}" in
	check)   cmd_check ;;
	build)   cmd_build ;;
	upgrade) cmd_upgrade ;;
	status)  cmd_status ;;
	help|--help|-h|"") usage ;;
	*)
		log_error "Unknown command: $1"
		usage >&2
		exit 1
		;;
esac
