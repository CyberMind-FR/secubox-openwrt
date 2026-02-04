#!/bin/bash
#
# secubox-image.sh - Build SecuBox firmware images via OpenWrt ASU API
#
# Uses the Attended SysUpgrade server (firmware-selector.openwrt.org backend)
# to build custom OpenWrt images with all required packages, maximum rootfs,
# and a first-boot script that installs SecuBox packages from the feed.
#
# Usage:
#   ./secubox-image.sh build [device]          # Build via ASU API
#   ./secubox-image.sh firmware-selector [dev] # Print config for web UI paste
#   ./secubox-image.sh status <hash>           # Check build status
#   ./secubox-image.sh download <hash>         # Download completed build
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASU_URL="https://sysupgrade.openwrt.org"
OPENWRT_VERSION="24.10.5"
OUTPUT_DIR="$SCRIPT_DIR/build/images"
DEFAULT_DEVICE="mochabin"
FEED_URL="https://github.com/gkerma/secubox-openwrt/releases/latest/download"
RESIZE_TARGET=""  # e.g. "16G" — resize image after download

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*" >&2; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_step()  { echo -e "${CYAN}[STEP]${NC} $*" >&2; }

# Device profiles: device_name -> target:profile
declare -A DEVICES=(
    ["mochabin"]="mvebu/cortexa72:globalscale_mochabin"
    ["espressobin-v7"]="mvebu/cortexa53:globalscale_espressobin"
    ["espressobin-ultra"]="mvebu/cortexa53:globalscale_espressobin-ultra"
    ["x86-64"]="x86/64:generic"
)

# Device-specific extra packages
declare -A DEVICE_PACKAGES=(
    ["mochabin"]="kmod-sfp kmod-phy-marvell-10g"
    ["espressobin-v7"]=""
    ["espressobin-ultra"]="kmod-mt76 kmod-mac80211"
    ["x86-64"]=""
)

# Base packages included in the firmware image (official OpenWrt repos)
BASE_PACKAGES=(
    # LuCI
    luci luci-ssl luci-theme-bootstrap luci-app-firewall

    # DNS
    dnsmasq-full -dnsmasq

    # Networking essentials
    curl wget-ssl ca-certificates openssl-util
    rsync diffutils

    # WireGuard VPN
    wireguard-tools luci-proto-wireguard kmod-wireguard

    # Reverse proxy & cache
    haproxy squid

    # MQTT
    mosquitto-client-ssl

    # Container runtimes
    docker dockerd containerd
    lxc lxc-common lxc-attach lxc-start lxc-stop lxc-destroy

    # Storage / filesystem tools
    block-mount kmod-fs-ext4 e2fsprogs parted losetup

    # Shell utilities
    nano htop lsblk

    # Attended sysupgrade client (for future upgrades)
    owut attendedsysupgrade-common
)

usage() {
    cat <<'EOF'
Usage: secubox-image.sh <command> [options]

Commands:
  build [device]            Build firmware image via ASU API (default: mochabin)
  firmware-selector [dev]   Print packages + script for firmware-selector.openwrt.org
  status <hash>             Check build status
  download <hash>           Download completed build

Devices:
  mochabin          MOCHAbin (Cortex-A72, 10G) — default
  espressobin-v7    ESPRESSObin V7 (Cortex-A53)
  espressobin-ultra ESPRESSObin Ultra (Cortex-A53, WiFi)
  x86-64            Generic x86_64

Options:
  -v, --version VERSION   OpenWrt version (default: 24.10.5)
  -o, --output DIR        Output directory (default: secubox-tools/build/images/)
  -r, --resize SIZE       Resize image after download (e.g., 16G for eMMC)
  -h, --help              Show this help
EOF
}

# Parse device profile into target and profile
parse_device() {
    local device="${1:-$DEFAULT_DEVICE}"

    if [[ -z "${DEVICES[$device]+x}" ]]; then
        log_error "Unknown device: $device"
        log_info "Available: ${!DEVICES[*]}"
        return 1
    fi

    local spec="${DEVICES[$device]}"
    TARGET="${spec%%:*}"
    PROFILE="${spec##*:}"
    DEVICE="$device"

    log_info "Device: $DEVICE ($TARGET / $PROFILE)"
}

# Build the full package list for a device
get_packages() {
    local device="${1:-$DEFAULT_DEVICE}"
    local pkgs=("${BASE_PACKAGES[@]}")

    # Add device-specific packages
    local extras="${DEVICE_PACKAGES[$device]:-}"
    if [[ -n "$extras" ]]; then
        for pkg in $extras; do
            pkgs+=("$pkg")
        done
    fi

    echo "${pkgs[*]}"
}

# Generate the first-boot defaults script
generate_defaults() {
    cat <<'DEFAULTS'
#!/bin/sh
# SecuBox First Boot Setup — runs once after flash/sysupgrade

FEED_URL="https://github.com/gkerma/secubox-openwrt/releases/latest/download"
LOG="/tmp/secubox-setup.log"

log() { echo "[$(date +%T)] $*" | tee -a "$LOG"; logger -t secubox-setup "$*"; }
log "SecuBox first-boot setup starting..."

# --- Step 1: Resize root to fill storage ---
log "Resizing root partition..."
ROOT_DEV=$(awk '$2=="/" {print $1}' /proc/mounts)
if [ -n "$ROOT_DEV" ]; then
    DISK=$(echo "$ROOT_DEV" | sed 's/p\?[0-9]*$//')
    [ "$DISK" = "$ROOT_DEV" ] && DISK=$(echo "$ROOT_DEV" | sed 's/[0-9]*$//')
    PART_NUM=$(echo "$ROOT_DEV" | grep -o '[0-9]*$')
    if command -v parted >/dev/null 2>&1; then
        parted -s "$DISK" resizepart "$PART_NUM" 100% 2>/dev/null
        resize2fs "$ROOT_DEV" 2>/dev/null
        log "Root resized: $(df -h / | tail -1 | awk '{print $2}')"
    else
        log "parted not available, skipping resize"
    fi
fi

# --- Step 2: Add SecuBox package feed ---
log "Adding SecuBox feed..."
FEED_CONF="/etc/opkg/customfeeds.conf"
grep -q "secubox" "$FEED_CONF" 2>/dev/null || \
    echo "src/gz secubox $FEED_URL" >> "$FEED_CONF"
opkg update >>"$LOG" 2>&1

# --- Step 3: Install SecuBox packages ---
log "Installing SecuBox core packages..."
CORE_PKGS="secubox-core secubox-app secubox-p2p luci-app-secubox luci-theme-secubox"
CORE_PKGS="$CORE_PKGS luci-app-secubox-admin luci-app-secubox-portal luci-app-system-hub"
CORE_PKGS="$CORE_PKGS luci-app-service-registry secubox-master-link luci-app-master-link"
for pkg in $CORE_PKGS; do
    opkg install "$pkg" >>"$LOG" 2>&1 || log "WARN: $pkg failed"
done

log "Installing all SecuBox packages from feed..."
opkg list 2>/dev/null | awk '/^(secubox-|luci-app-secubox|luci-app-master|luci-app-service|luci-app-auth|luci-app-bandwidth|luci-app-cdn|luci-app-client|luci-app-crowdsec|luci-app-cyber|luci-app-dns|luci-app-exposure|luci-app-gitea|luci-app-glances|luci-app-haproxy|luci-app-hexo|luci-app-jitsi|luci-app-ksm|luci-app-local|luci-app-lyrion|luci-app-magic|luci-app-mail|luci-app-media|luci-app-meta|luci-app-mitmproxy|luci-app-mmpm|luci-app-mqtt|luci-app-ndpid|luci-app-netd|luci-app-network|luci-app-next|luci-app-ollama|luci-app-pico|luci-app-simplex|luci-app-stream|luci-app-system-hub|luci-app-tor|luci-app-traffic|luci-app-vhost|luci-app-wireguard-dash|luci-app-zigbee|luci-secubox)/{print $1}' | \
while read -r pkg; do
    opkg install "$pkg" >>"$LOG" 2>&1 || true
done

# --- Step 4: Enable core services ---
for svc in secubox-core; do
    [ -x "/etc/init.d/$svc" ] && /etc/init.d/$svc enable
done

# --- Step 5: Ensure sysupgrade config preserves SecuBox data ---
SYSUPGRADE_CONF="/etc/sysupgrade.conf"
for path in /etc/config/ /etc/secubox/ /etc/opkg/customfeeds.conf /srv/; do
    grep -q "^${path}$" "$SYSUPGRADE_CONF" 2>/dev/null || echo "$path" >> "$SYSUPGRADE_CONF"
done

INSTALLED=$(opkg list-installed 2>/dev/null | grep -c secubox || echo 0)
log "SecuBox setup complete — $INSTALLED packages installed"
log "Disk usage: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
exit 0
DEFAULTS
}

# Build JSON request for ASU API
build_request_json() {
    local device="${1:-$DEFAULT_DEVICE}"
    parse_device "$device"

    local packages
    packages=$(get_packages "$device")

    # Write defaults to temp file for python to read
    local defaults_file
    defaults_file=$(mktemp)
    generate_defaults > "$defaults_file"

    # Build JSON package array
    local pkg_json=""
    for pkg in $packages; do
        [[ -n "$pkg_json" ]] && pkg_json="$pkg_json,"
        pkg_json="$pkg_json\"$pkg\""
    done

    # Encode defaults as JSON string
    local defaults_encoded
    defaults_encoded=$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    print(json.dumps(f.read()))
" "$defaults_file")
    rm -f "$defaults_file"

    # Build complete JSON via python for correctness
    python3 -c "
import json, sys
data = {
    'profile': '$PROFILE',
    'target': '$TARGET',
    'version': '$OPENWRT_VERSION',
    'packages': '$packages'.split(),
    'defaults': json.loads(sys.argv[1]),
    'rootfs_size_mb': 1024,
    'diff_packages': True,
    'client': 'secubox-image/1.0'
}
print(json.dumps(data, indent=2))
" "$defaults_encoded"
}

# POST build request to ASU API
api_build() {
    local json_file="$1"
    log_step "Submitting build request to ASU..."

    local response
    response=$(curl -s -w "\n%{http_code}" \
        -H "Content-Type: application/json" \
        -d "@$json_file" \
        "$ASU_URL/api/v1/build")

    local http_code
    http_code=$(echo "$response" | tail -1)
    local body
    body=$(echo "$response" | sed '$d')

    case "$http_code" in
        200)
            log_info "Build completed (cached)"
            echo "$body"
            ;;
        202)
            log_info "Build queued"
            echo "$body"
            ;;
        400)
            log_error "Bad request:"
            echo "$body" >&2
            return 1
            ;;
        422)
            log_error "Validation error:"
            echo "$body" >&2
            return 1
            ;;
        500)
            log_error "Server error:"
            echo "$body" >&2
            return 1
            ;;
        *)
            log_error "Unexpected HTTP $http_code:"
            echo "$body" >&2
            return 1
            ;;
    esac
}

# Poll build status until complete
poll_build() {
    local request_hash="$1"
    local max_wait=600  # 10 minutes
    local interval=10
    local elapsed=0

    log_step "Waiting for build to complete (hash: $request_hash)..."

    while [ $elapsed -lt $max_wait ]; do
        local response
        response=$(curl -s -w "\n%{http_code}" "$ASU_URL/api/v1/build/$request_hash")
        local http_code
        http_code=$(echo "$response" | tail -1)
        local body
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" = "200" ]; then
            # Check if build has images (= complete)
            local detail
            detail=$(echo "$body" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("detail",""))' 2>/dev/null || echo "")

            if [ "$detail" = "done" ] || [ "$detail" = "" ]; then
                # Check for images to confirm completion
                local img_count
                img_count=$(echo "$body" | python3 -c 'import sys,json; print(len(json.load(sys.stdin).get("images",[])))' 2>/dev/null || echo "0")
                if [ "$img_count" -gt 0 ] 2>/dev/null; then
                    log_info "Build complete!"
                    echo "$body"
                    return 0
                fi
            fi

            case "$detail" in
                "queued"|"building")
                    printf "\r  Waiting... %ds elapsed (%s)   " "$elapsed" "$detail" >&2
                    ;;
                *)
                    # Response has no images but detail is not queued/building
                    log_info "Build finished (detail: $detail)"
                    echo "$body"
                    return 0
                    ;;
            esac
        elif [ "$http_code" = "202" ]; then
            printf "\r  Waiting... %ds elapsed (building)   " "$elapsed" >&2
        elif [ "$http_code" = "404" ]; then
            log_error "Build not found: $request_hash"
            return 1
        else
            log_error "Unexpected HTTP $http_code"
            echo "$body" >&2
            return 1
        fi

        sleep "$interval"
        elapsed=$((elapsed + interval))
    done

    echo ""
    log_error "Build timed out after ${max_wait}s"
    return 1
}

# Download the built image
download_image() {
    local build_response="$1"
    local output_dir="${2:-$OUTPUT_DIR}"

    mkdir -p "$output_dir"

    # Save response to temp file for python to parse
    local resp_file
    resp_file=$(mktemp)
    echo "$build_response" > "$resp_file"

    # Extract image name: prefer ext4-sdcard, then sysupgrade, then any sdcard
    local image_name
    image_name=$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    d = json.load(f)
images = d.get('images', [])
# Prefer ext4-sdcard (best for resize)
for img in images:
    if 'ext4' in img.get('name', '') and 'sdcard' in img.get('name', ''):
        print(img['name']); sys.exit()
# Then sysupgrade
for img in images:
    if 'sysupgrade' in img.get('name', '') or 'sysupgrade' in img.get('type', ''):
        print(img['name']); sys.exit()
# Then any sdcard
for img in images:
    if 'sdcard' in img.get('name', '') or 'sdcard' in img.get('type', ''):
        print(img['name']); sys.exit()
# Fallback: first image
if images:
    print(images[0]['name'])
" "$resp_file" 2>/dev/null)

    # Extract request_hash (used as store directory) and expected sha256
    local request_hash expected_sha256
    read -r request_hash expected_sha256 < <(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    d = json.load(f)
rh = d.get('request_hash', '')
# Find sha256 for the selected image
sha = ''
for img in d.get('images', []):
    if img.get('name', '') == sys.argv[2]:
        sha = img.get('sha256', '')
        break
print(rh, sha)
" "$resp_file" "$image_name" 2>/dev/null)

    rm -f "$resp_file"

    if [[ -z "$image_name" ]]; then
        log_warn "No images found in build response"
        return 1
    fi

    if [[ -z "$request_hash" ]]; then
        log_error "No request_hash in build response"
        return 1
    fi

    # ASU store URL uses request_hash as directory
    local download_url="$ASU_URL/store/$request_hash/$image_name"
    local filename="$image_name"
    local output_file="$output_dir/$filename"

    log_step "Downloading: $filename"
    log_info "URL: $download_url"
    curl -# -o "$output_file" "$download_url" || {
        log_error "Download failed"
        return 1
    }

    # Verify size is non-zero
    local file_size
    file_size=$(stat -c%s "$output_file" 2>/dev/null || echo 0)
    if [[ "$file_size" -eq 0 ]]; then
        log_error "Downloaded file is empty"
        rm -f "$output_file"
        return 1
    fi

    # Verify SHA256 if available
    local sha256
    sha256=$(sha256sum "$output_file" | awk '{print $1}')
    log_info "Downloaded: $output_file"
    log_info "SHA256: $sha256"
    log_info "Size: $(du -h "$output_file" | awk '{print $1}')"

    if [[ -n "$expected_sha256" && "$sha256" != "$expected_sha256" ]]; then
        log_warn "SHA256 mismatch! Expected: $expected_sha256"
    elif [[ -n "$expected_sha256" ]]; then
        log_info "SHA256 verified OK"
    fi

    echo "$output_file"
}

# =============================================================================
# Commands
# =============================================================================

cmd_build() {
    local device="${1:-$DEFAULT_DEVICE}"

    # Check dependencies
    for cmd in curl python3; do
        command -v "$cmd" >/dev/null 2>&1 || {
            log_error "Required: $cmd"
            return 1
        }
    done

    echo -e "${BOLD}SecuBox Image Builder${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Generate request
    log_step "Generating build request for $device..."
    local json
    json=$(build_request_json "$device")

    local json_file
    json_file=$(mktemp)
    echo "$json" > "$json_file"
    trap "rm -f $json_file" EXIT

    local pkg_count
    pkg_count=$(echo "$json" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)["packages"]))' 2>/dev/null || echo "?")
    log_info "OpenWrt: $OPENWRT_VERSION"
    log_info "Rootfs: 1024 MB (maximum)"
    log_info "Packages: $pkg_count official + SecuBox feed at boot"

    # Submit build
    local response
    response=$(api_build "$json_file") || return 1

    # Check if response already has images (cached build) or needs polling
    local has_images request_hash
    has_images=$(echo "$response" | python3 -c 'import sys,json; print(len(json.load(sys.stdin).get("images",[])))' 2>/dev/null || echo "0")
    request_hash=$(echo "$response" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("request_hash",""))' 2>/dev/null || echo "")

    local image_file=""
    local build_result="$response"

    if [[ "$has_images" -gt 0 ]]; then
        # Cached build — already has images, skip polling
        image_file=$(download_image "$build_result") || return 1
    elif [[ -n "$request_hash" ]]; then
        # Need to poll for completion
        build_result=$(poll_build "$request_hash") || return 1
        echo "" >&2
        image_file=$(download_image "$build_result") || return 1
    else
        log_error "No images or request hash in response"
        echo "$response" >&2
        return 1
    fi

    # Resize image if requested (for full eMMC utilization)
    if [[ -n "$RESIZE_TARGET" && -n "$image_file" ]]; then
        local resize_script="$SCRIPT_DIR/resize-openwrt-image.sh"
        if [[ ! -x "$resize_script" ]]; then
            log_error "Resize script not found: $resize_script"
            log_info "Image saved without resize: $image_file"
            return 1
        fi

        local resized_file="${image_file%.img.gz}-${RESIZE_TARGET}.img.gz"
        log_step "Resizing image to $RESIZE_TARGET for full eMMC..."

        # resize-openwrt-image.sh requires root for loop devices
        local sudo_cmd=""
        if [ "$(id -u)" -ne 0 ]; then
            sudo_cmd="sudo"
            log_info "Root required for resize (loop devices). Running with sudo..."
        fi

        $sudo_cmd "$resize_script" "$image_file" "$RESIZE_TARGET" "$resized_file" || {
            log_error "Resize failed"
            log_info "To resize manually: sudo $resize_script $image_file $RESIZE_TARGET $resized_file"
            log_info "Original image: $image_file"
            return 1
        }

        log_info "Resized image: $resized_file"
        log_info "Original image: $image_file"
        echo "$resized_file"
    else
        echo "$image_file"
    fi
}

cmd_firmware_selector() {
    local device="${1:-$DEFAULT_DEVICE}"
    parse_device "$device"

    local packages
    packages=$(get_packages "$device")

    echo -e "${BOLD}SecuBox Firmware Selector Configuration${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${CYAN}1. Open:${NC} https://firmware-selector.openwrt.org/"
    echo -e "${CYAN}2. Select version:${NC} $OPENWRT_VERSION"
    echo -e "${CYAN}3. Search device:${NC} $DEVICE"
    echo -e "${CYAN}4. Click:${NC} 'Customize installed packages and/or first boot script'"
    echo ""
    echo -e "${BOLD}═══ PACKAGES (paste into 'Installed Packages' field) ═══${NC}"
    echo ""
    echo "$packages"
    echo ""
    echo -e "${BOLD}═══ SCRIPT (paste into 'Script to run on first boot' field) ═══${NC}"
    echo ""
    generate_defaults
    echo ""
    echo -e "${BOLD}═══ ROOTFS SIZE ═══${NC}"
    echo ""
    echo "Set 'Root filesystem partition size' to: 1024 MB"
    echo ""
    echo -e "${CYAN}5. Click:${NC} 'Request Build'"
    echo -e "${CYAN}6. Download:${NC} SYSUPGRADE or SDCARD image"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

cmd_status() {
    local hash="$1"
    [[ -z "$hash" ]] && { log_error "Usage: $0 status <hash>"; return 1; }

    local response
    response=$(curl -s "$ASU_URL/api/v1/build/$hash")
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
}

cmd_download() {
    local hash="$1"
    [[ -z "$hash" ]] && { log_error "Usage: $0 download <hash>"; return 1; }

    local response
    response=$(curl -s "$ASU_URL/api/v1/build/$hash")
    download_image "$response"
}

# =============================================================================
# Main
# =============================================================================

# Parse global options
while [[ $# -gt 0 ]]; do
    case "$1" in
        -v|--version)
            OPENWRT_VERSION="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -r|--resize)
            RESIZE_TARGET="$2"
            shift 2
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
    build)
        shift
        cmd_build "${1:-$DEFAULT_DEVICE}"
        ;;
    firmware-selector|fs)
        shift
        cmd_firmware_selector "${1:-$DEFAULT_DEVICE}"
        ;;
    status)
        shift
        cmd_status "${1:-}"
        ;;
    download)
        shift
        cmd_download "${1:-}"
        ;;
    help|--help|-h|"")
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage >&2
        exit 1
        ;;
esac
