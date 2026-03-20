#!/bin/sh
#
# SecuBox Slipstream Script
# Bakes SecuBox repository configuration into OpenWrt images during build
#
# This script is designed to be run during the OpenWrt build process
# to pre-configure the SecuBox repository and optionally pre-install packages.
#
# Usage (during OpenWrt build):
#   ./scripts/secubox-slipstream.sh <rootfs_dir> [--profile=PROFILE]
#
# Or as a standalone image modifier:
#   ./scripts/secubox-slipstream.sh --image=<image.img.gz> [--profile=PROFILE]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_URL="${SECUBOX_REPO_URL:-https://repo.secubox.in}"
PROFILE="${SECUBOX_PROFILE:-standard}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { printf "${BLUE}[SLIPSTREAM]${NC} %s\n" "$1"; }
log_ok() { printf "${GREEN}[SLIPSTREAM]${NC} %s\n" "$1"; }
log_warn() { printf "${YELLOW}[SLIPSTREAM]${NC} %s\n" "$1"; }
log_error() { printf "${RED}[SLIPSTREAM]${NC} %s\n" "$1"; }

# Detect architecture from rootfs
detect_arch() {
    local rootfs="$1"
    local arch=""

    # Try reading from openwrt_release
    if [ -f "$rootfs/etc/openwrt_release" ]; then
        arch=$(grep "DISTRIB_ARCH" "$rootfs/etc/openwrt_release" 2>/dev/null | cut -d"'" -f2)
    fi

    # Fallback: check for common arch indicators
    if [ -z "$arch" ]; then
        if [ -d "$rootfs/lib/aarch64-linux-gnu" ] || file "$rootfs/bin/busybox" 2>/dev/null | grep -q "aarch64"; then
            arch="aarch64_cortex-a72"
        elif file "$rootfs/bin/busybox" 2>/dev/null | grep -q "x86-64"; then
            arch="x86_64"
        elif file "$rootfs/bin/busybox" 2>/dev/null | grep -q "ARM"; then
            arch="arm_cortex-a7_neon-vfpv4"
        fi
    fi

    echo "$arch"
}

# Create the customfeeds.conf with SecuBox repository
create_feeds_config() {
    local rootfs="$1"
    local arch="$2"
    local feeds_file="$rootfs/etc/opkg/customfeeds.conf"

    log_info "Creating SecuBox feed configuration..."

    mkdir -p "$rootfs/etc/opkg"

    cat > "$feeds_file" << EOF
# SecuBox Package Repository
# Pre-configured by secubox-slipstream.sh
# Architecture: $arch
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

src/gz secubox_packages ${REPO_URL}/packages/${arch}
src/gz secubox_luci ${REPO_URL}/luci/${arch}
EOF

    log_ok "Feed configuration created: $feeds_file"
}

# Install the seed script into the image
install_seed_script() {
    local rootfs="$1"
    local seed_script="$SCRIPT_DIR/secubox-seed.sh"

    log_info "Installing seed script..."

    mkdir -p "$rootfs/usr/sbin"

    if [ -f "$seed_script" ]; then
        cp "$seed_script" "$rootfs/usr/sbin/secubox-seed"
        chmod +x "$rootfs/usr/sbin/secubox-seed"
        log_ok "Seed script installed: /usr/sbin/secubox-seed"
    else
        log_warn "Seed script not found: $seed_script"
    fi
}

# Create first-boot script for auto-setup
create_firstboot_script() {
    local rootfs="$1"
    local profile="$2"

    log_info "Creating first-boot setup script..."

    mkdir -p "$rootfs/etc/uci-defaults"

    cat > "$rootfs/etc/uci-defaults/99-secubox-setup" << 'FIRSTBOOT'
#!/bin/sh
#
# SecuBox First-Boot Setup
# Runs once on first boot to complete SecuBox installation
#

PROFILE="${SECUBOX_PROFILE:-standard}"
LOG_FILE="/tmp/secubox-firstboot.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "SecuBox first-boot setup starting..."

# Check if opkg feeds are already configured
if grep -q "secubox_packages" /etc/opkg/customfeeds.conf 2>/dev/null; then
    log "SecuBox feeds already configured"
else
    log "Error: SecuBox feeds not configured!"
    exit 1
fi

# Update package lists
log "Updating package lists..."
if opkg update 2>&1 | tee -a "$LOG_FILE"; then
    log "Package lists updated successfully"
else
    log "Warning: opkg update had errors"
fi

# Install core packages if not already installed
CORE_PACKAGES="secubox-core secubox-base luci-theme-secubox"

for pkg in $CORE_PACKAGES; do
    if ! opkg list-installed | grep -q "^$pkg "; then
        log "Installing $pkg..."
        if opkg install "$pkg" 2>&1 | tee -a "$LOG_FILE"; then
            log "$pkg installed successfully"
        else
            log "Warning: $pkg installation failed"
        fi
    else
        log "$pkg already installed"
    fi
done

# Set SecuBox theme as default
if [ -f /etc/config/luci ]; then
    uci set luci.main.mediaurlbase='/luci-static/secubox' 2>/dev/null || true
    uci commit luci 2>/dev/null || true
    log "SecuBox theme set as default"
fi

# Mark setup complete
touch /etc/secubox-installed
log "SecuBox first-boot setup complete"

# Remove this script (run once)
exit 0
FIRSTBOOT

    chmod +x "$rootfs/etc/uci-defaults/99-secubox-setup"
    log_ok "First-boot script created"
}

# Create SecuBox branding
create_branding() {
    local rootfs="$1"

    log_info "Adding SecuBox branding..."

    # Custom banner
    mkdir -p "$rootfs/etc"
    cat > "$rootfs/etc/banner" << 'BANNER'

  ____                  ____
 / ___|  ___  ___ _   _| __ )  _____  __
 \___ \ / _ \/ __| | | |  _ \ / _ \ \/ /
  ___) |  __/ (__| |_| | |_) | (_) >  <
 |____/ \___|\___|\__,_|____/ \___/_/\_\

 SecuBox - Security Gateway for OpenWrt
 https://secubox.in

 Run 'secubox-seed --help' for setup options

BANNER

    # Version info
    cat > "$rootfs/etc/secubox-release" << EOF
SECUBOX_VERSION="1.0.0"
SECUBOX_CODENAME="Genesis"
SECUBOX_BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
SECUBOX_PROFILE="${PROFILE}"
EOF

    log_ok "Branding added"
}

# Slipstream into an existing rootfs directory
slipstream_rootfs() {
    local rootfs="$1"
    local profile="$2"

    log_info "Slipstreaming SecuBox into rootfs: $rootfs"

    if [ ! -d "$rootfs" ]; then
        log_error "Rootfs directory not found: $rootfs"
        exit 1
    fi

    # Detect architecture
    local arch
    arch=$(detect_arch "$rootfs")
    if [ -z "$arch" ]; then
        log_warn "Could not detect architecture, using x86_64"
        arch="x86_64"
    fi
    log_info "Detected architecture: $arch"

    # Apply slipstream
    create_feeds_config "$rootfs" "$arch"
    install_seed_script "$rootfs"
    create_firstboot_script "$rootfs" "$profile"
    create_branding "$rootfs"

    log_ok "Slipstream complete for: $rootfs"
}

# Slipstream into a compressed image file
slipstream_image() {
    local image="$1"
    local profile="$2"

    log_info "Slipstreaming SecuBox into image: $image"

    if [ ! -f "$image" ]; then
        log_error "Image file not found: $image"
        exit 1
    fi

    # Create temp directory
    local tmpdir
    tmpdir=$(mktemp -d)
    trap "rm -rf '$tmpdir'" EXIT

    local mount_point="$tmpdir/rootfs"
    local work_image="$tmpdir/work.img"
    mkdir -p "$mount_point"

    # Decompress if needed
    case "$image" in
        *.gz)
            log_info "Decompressing image..."
            gunzip -c "$image" > "$work_image"
            ;;
        *.img|*.raw)
            cp "$image" "$work_image"
            ;;
        *)
            log_error "Unsupported image format: $image"
            exit 1
            ;;
    esac

    # Find and mount rootfs partition
    log_info "Mounting image..."

    # Try to find rootfs partition offset
    local offset
    offset=$(fdisk -l "$work_image" 2>/dev/null | grep -E "Linux|ext4" | tail -1 | awk '{print $2}')

    if [ -n "$offset" ]; then
        offset=$((offset * 512))
        sudo mount -o loop,offset=$offset "$work_image" "$mount_point"
    else
        # Try mounting as-is (might be raw rootfs)
        sudo mount -o loop "$work_image" "$mount_point"
    fi

    # Apply slipstream
    slipstream_rootfs "$mount_point" "$profile"

    # Unmount
    log_info "Unmounting image..."
    sudo umount "$mount_point"

    # Recompress if original was compressed
    case "$image" in
        *.gz)
            log_info "Recompressing image..."
            local output="${image%.gz}-secubox.img.gz"
            gzip -c "$work_image" > "$output"
            log_ok "Output: $output"
            ;;
        *)
            local output="${image%.*}-secubox.${image##*.}"
            mv "$work_image" "$output"
            log_ok "Output: $output"
            ;;
    esac
}

# Print usage
usage() {
    cat << EOF
SecuBox Slipstream Script

Usage:
  $0 <rootfs_dir>                    Slipstream into rootfs directory
  $0 --image=<file.img.gz>           Slipstream into image file

Options:
  --profile=PROFILE    Installation profile (minimal|standard|full)
  --repo=URL           Override repository URL
  --help               Show this help

Environment:
  SECUBOX_REPO_URL     Repository URL (default: https://repo.secubox.in)
  SECUBOX_PROFILE      Installation profile (default: standard)

Examples:
  # During OpenWrt build (in files/):
  $0 ../build_dir/target-*/root-*/

  # Modify existing image:
  $0 --image=openwrt-x86-64-generic-ext4-combined.img.gz

  # With custom profile:
  $0 --profile=full /path/to/rootfs
EOF
}

# Main
main() {
    local rootfs=""
    local image=""

    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            --image=*)
                image="${1#*=}"
                ;;
            --profile=*)
                PROFILE="${1#*=}"
                ;;
            --repo=*)
                REPO_URL="${1#*=}"
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                rootfs="$1"
                ;;
        esac
        shift
    done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  SecuBox Slipstream"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Profile: $PROFILE"
    echo "  Repo: $REPO_URL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [ -n "$image" ]; then
        slipstream_image "$image" "$PROFILE"
    elif [ -n "$rootfs" ]; then
        slipstream_rootfs "$rootfs" "$PROFILE"
    else
        log_error "No rootfs directory or image specified"
        usage
        exit 1
    fi
}

main "$@"
