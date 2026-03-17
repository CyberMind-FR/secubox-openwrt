#!/bin/bash
#
# c3box-vm-full-build.sh - Build C3Box VM with full SecuBox package suite
#
# Uses prebuilt packages from release artifacts - same method as GitHub Actions
#
# Usage:
#   ./c3box-vm-full-build.sh [version] [arch]
#   ./c3box-vm-full-build.sh v1.0.0-beta x86-64
#   ./c3box-vm-full-build.sh v1.0.0-beta aarch64
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
VERSION="${1:-v1.0.0-beta}"
ARCH="${2:-x86-64}"
OPENWRT_VERSION="${OPENWRT_VERSION:-24.10.5}"
DISK_SIZE="${DISK_SIZE:-8}"

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
BUILD_DIR="/tmp/c3box-vm-build-$$"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/c3box-vm-output}"

print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

cleanup() {
    if [[ -d "$BUILD_DIR" ]]; then
        print_info "Cleaning up build directory..."
        rm -rf "$BUILD_DIR"
    fi
}
trap cleanup EXIT

# Map architecture to OpenWrt target
get_openwrt_target() {
    case "$ARCH" in
        x86-64|x86_64)
            echo "x86/64"
            ;;
        aarch64|aarch64-generic)
            echo "armsr/armv8"
            ;;
        aarch64-cortex-a72|bcm27xx-bcm2711)
            echo "bcm27xx/bcm2711"
            ;;
        rockchip-armv8)
            echo "rockchip/armv8"
            ;;
        mediatek-filogic)
            echo "mediatek/filogic"
            ;;
        *)
            echo "x86/64"
            ;;
    esac
}

# Map architecture to package archive name
get_package_arch() {
    case "$ARCH" in
        x86-64|x86_64)
            echo "x86-64"
            ;;
        aarch64|aarch64-generic|armsr-armv8)
            echo "aarch64-generic"
            ;;
        aarch64-cortex-a72|bcm27xx-bcm2711)
            echo "aarch64-cortex-a72"
            ;;
        rockchip-armv8)
            echo "rockchip-armv8"
            ;;
        *)
            echo "x86-64"
            ;;
    esac
}

print_header "C3Box VM Full Build - SecuBox Suite"
echo "Version:      $VERSION"
echo "Architecture: $ARCH"
echo "OpenWrt:      $OPENWRT_VERSION"
echo "Disk Size:    ${DISK_SIZE}GB"
echo "Output:       $OUTPUT_DIR"
echo ""

mkdir -p "$BUILD_DIR" "$OUTPUT_DIR"
cd "$BUILD_DIR"

# Step 1: Download Image Builder
print_header "Downloading OpenWrt Image Builder"

TARGET=$(get_openwrt_target)
TARGET_SAFE=$(echo "$TARGET" | tr '/' '-')

IB_URL="https://downloads.openwrt.org/releases/${OPENWRT_VERSION}/targets/${TARGET}/openwrt-imagebuilder-${OPENWRT_VERSION}-${TARGET_SAFE}.Linux-x86_64.tar.zst"

print_info "Target: $TARGET"
print_info "URL: $IB_URL"

if wget -q "$IB_URL" -O imagebuilder.tar.zst 2>/dev/null; then
    tar --zstd -xf imagebuilder.tar.zst
    mv openwrt-imagebuilder-* imagebuilder
elif wget -q "${IB_URL%.zst}.xz" -O imagebuilder.tar.xz 2>/dev/null; then
    tar -xf imagebuilder.tar.xz
    mv openwrt-imagebuilder-* imagebuilder
else
    print_error "Failed to download Image Builder"
    exit 1
fi

print_success "Image Builder ready"

# Step 2: Download prebuilt SecuBox packages
print_header "Downloading Prebuilt SecuBox Packages"

PKG_ARCH=$(get_package_arch)
PKG_URL="https://github.com/gkerma/secubox-openwrt/releases/download/${VERSION}/secubox-${VERSION#v}-${PKG_ARCH}.tar.gz"

mkdir -p imagebuilder/packages/secubox

print_info "Package URL: $PKG_URL"

if wget -q "$PKG_URL" -O /tmp/secubox-packages.tar.gz 2>/dev/null; then
    tar -xzf /tmp/secubox-packages.tar.gz -C imagebuilder/packages/secubox/ --strip-components=1 2>/dev/null || \
    tar -xzf /tmp/secubox-packages.tar.gz -C imagebuilder/packages/secubox/
    print_success "Downloaded release packages"
else
    print_warning "Release packages not found, will use feed installation"
fi

IPK_COUNT=$(find imagebuilder/packages/secubox/ -name "*.ipk" 2>/dev/null | wc -l)
print_info "Found $IPK_COUNT prebuilt packages"

# Create local repository if packages exist
if [[ $IPK_COUNT -gt 0 ]]; then
    print_info "Creating local package repository..."
    cd imagebuilder/packages/secubox
    for ipk in *.ipk; do
        [ -f "$ipk" ] || continue
        PKG_NAME=$(echo "$ipk" | sed 's/_.*//; s/^.*\///')
        echo "Package: $PKG_NAME"
        echo "Version: 1.0.0"
        echo "Filename: $ipk"
        echo ""
    done > Packages
    gzip -k Packages
    cd "$BUILD_DIR"

    # Add to repositories.conf
    echo "src secubox file://$(pwd)/imagebuilder/packages/secubox" >> imagebuilder/repositories.conf
    print_success "Local repository created"
fi

# Step 3: Create preseed files
print_header "Creating Preseed Configuration"

mkdir -p imagebuilder/files/etc/uci-defaults
mkdir -p imagebuilder/files/etc/c3box
mkdir -p imagebuilder/files/etc/opkg
mkdir -p imagebuilder/files/etc/secubox

# SecuBox feed configuration
cat > imagebuilder/files/etc/opkg/customfeeds.conf << 'EOF'
# SecuBox Official Package Feed
src/gz secubox_packages https://repo.secubox.org/packages/aarch64_generic
src/gz secubox_luci https://repo.secubox.org/luci/aarch64_generic
EOF

# Network preseed
cat > imagebuilder/files/etc/uci-defaults/10-c3box-network << 'EOF'
#!/bin/sh
# C3Box VM Network Configuration

uci set system.@system[0].hostname='c3box'
uci set system.@system[0].timezone='UTC'
uci set system.@system[0].zonename='UTC'

uci set network.lan.ipaddr='192.168.200.1'
uci set network.lan.netmask='255.255.255.0'
uci set network.lan.proto='static'

uci set network.wan=interface
uci set network.wan.device='eth1'
uci set network.wan.proto='dhcp'

uci set dhcp.lan.start='100'
uci set dhcp.lan.limit='150'
uci set dhcp.lan.leasetime='12h'

uci set firewall.@zone[0].input='ACCEPT'
uci set firewall.@zone[0].output='ACCEPT'
uci set firewall.@zone[0].forward='REJECT'
uci set firewall.@zone[1].input='REJECT'
uci set firewall.@zone[1].output='ACCEPT'
uci set firewall.@zone[1].forward='REJECT'
uci set firewall.@zone[1].masq='1'

uci set uhttpd.main.redirect_https='1'

uci commit
exit 0
EOF
chmod 755 imagebuilder/files/etc/uci-defaults/10-c3box-network

# SecuBox config preseed
cat > imagebuilder/files/etc/uci-defaults/20-secubox-config << 'EOF'
#!/bin/sh
# SecuBox Core Configuration

touch /etc/config/secubox

uci set secubox.main=core
uci set secubox.main.enabled='1'
uci set secubox.main.log_level='info'
uci set secubox.main.appstore_url='https://repo.secubox.org/catalog'
uci set secubox.main.appstore_fallback_local='1'
uci set secubox.main.health_check_interval='300'
uci set secubox.main.watchdog_interval='60'
uci set secubox.main.led_heartbeat='1'
uci set secubox.main.ai_enabled='0'
uci set secubox.main.ai_mode='copilot'

uci set secubox.enforcement=security
uci set secubox.enforcement.sandboxing='1'
uci set secubox.enforcement.module_signature_check='0'
uci set secubox.enforcement.allowed_repos='official'
uci set secubox.enforcement.auto_update_check='1'

uci set secubox.settings=diagnostics
uci set secubox.settings.collect_metrics='1'
uci set secubox.settings.retain_days='7'
uci set secubox.settings.alert_enabled='1'

uci set secubox.remote=wan_access
uci set secubox.remote.enabled='1'
uci set secubox.remote.https_enabled='1'
uci set secubox.remote.https_port='443'
uci set secubox.remote.ssh_enabled='1'

uci set secubox.external=settings
uci set secubox.external.enabled='1'
uci set secubox.external.wildcard_enabled='1'
uci set secubox.external.default_landing='1'

uci set secubox.local=domain
uci set secubox.local.enabled='1'
uci set secubox.local.base_domain='sb.local'
uci set secubox.local.suffix='_local'

uci commit secubox
exit 0
EOF
chmod 755 imagebuilder/files/etc/uci-defaults/20-secubox-config

# Filesystem resize
cat > imagebuilder/files/etc/uci-defaults/99-c3box-resize << 'EOF'
#!/bin/sh
if [ ! -f /etc/c3box/resized ]; then
    ROOT_DEV=$(mount | grep ' / ' | cut -d' ' -f1)
    if [ -n "$ROOT_DEV" ]; then
        DISK_DEV=$(echo "$ROOT_DEV" | sed 's/[0-9]*$//')
        PART_NUM=$(echo "$ROOT_DEV" | grep -o '[0-9]*$')
        parted -s "$DISK_DEV" resizepart "$PART_NUM" 100% 2>/dev/null || true
        resize2fs "$ROOT_DEV" 2>/dev/null || true
        mkdir -p /etc/c3box
        touch /etc/c3box/resized
    fi
fi
touch /etc/c3box/configured
exit 0
EOF
chmod 755 imagebuilder/files/etc/uci-defaults/99-c3box-resize

# Release info
cat > imagebuilder/files/etc/c3box/release << EOF
C3BOX_VERSION="$VERSION"
C3BOX_BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
OPENWRT_VERSION="$OPENWRT_VERSION"
ARCH="$ARCH"
DISK_SIZE="${DISK_SIZE}GB"
SECUBOX_MODULES="101"
EOF

# Banner
cat > imagebuilder/files/etc/banner << 'EOF'

   ██████╗██████╗ ██████╗  ██████╗ ██╗  ██╗
  ██╔════╝╚════██╗██╔══██╗██╔═══██╗╚██╗██╔╝
  ██║      █████╔╝██████╔╝██║   ██║ ╚███╔╝
  ██║      ╚═══██╗██╔══██╗██║   ██║ ██╔██╗
  ╚██████╗██████╔╝██████╔╝╚██████╔╝██╔╝ ██╗
   ╚═════╝╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝

  C3Box - CyberMind Security Appliance
  SecuBox 101+ Modules | Master Target Mesh

  Web UI:  https://192.168.200.1
  Wiki:    https://github.com/gkerma/secubox-openwrt/wiki

EOF

print_success "Preseed configuration created"

# Step 4: Build firmware
print_header "Building Firmware Image"

cd imagebuilder

# Base packages
PACKAGES="luci luci-ssl luci-app-opkg luci-theme-openwrt-2020"
PACKAGES="$PACKAGES curl wget-ssl htop iftop tcpdump nano"
PACKAGES="$PACKAGES openssh-sftp-server"
PACKAGES="$PACKAGES block-mount kmod-fs-ext4 kmod-fs-vfat kmod-fs-btrfs"
PACKAGES="$PACKAGES parted e2fsprogs resize2fs"
PACKAGES="$PACKAGES git rsync screen tmux bash jq"
PACKAGES="$PACKAGES wireguard-tools kmod-wireguard luci-proto-wireguard"
PACKAGES="$PACKAGES -dnsmasq dnsmasq-full"
PACKAGES="$PACKAGES haproxy bind-server bind-tools"

# Add SecuBox packages if available
if [[ $IPK_COUNT -gt 0 ]]; then
    SECUBOX_PKGS="secubox-core secubox-identity secubox-master-link secubox-p2p"
    SECUBOX_PKGS="$SECUBOX_PKGS secubox-app secubox-app-bonus luci-theme-secubox"
    SECUBOX_PKGS="$SECUBOX_PKGS luci-app-crowdsec-dashboard luci-app-mitmproxy"
    SECUBOX_PKGS="$SECUBOX_PKGS luci-app-secubox luci-app-secubox-admin"
    SECUBOX_PKGS="$SECUBOX_PKGS luci-app-secubox-portal luci-app-secubox-p2p"
    SECUBOX_PKGS="$SECUBOX_PKGS luci-app-haproxy luci-app-wireguard-dashboard"
    SECUBOX_PKGS="$SECUBOX_PKGS luci-app-vhost-manager luci-app-network-modes"
    SECUBOX_PKGS="$SECUBOX_PKGS luci-app-system-hub luci-app-master-link"
    SECUBOX_PKGS="$SECUBOX_PKGS luci-app-metrics-dashboard luci-app-config-vault"

    for pkg in $SECUBOX_PKGS; do
        if find packages/secubox -name "${pkg}_*.ipk" 2>/dev/null | head -1 | grep -q .; then
            PACKAGES="$PACKAGES $pkg"
        fi
    done
fi

# Root partition size
ROOT_SIZE=$(( DISK_SIZE * 1024 - 64 ))

print_info "Packages: $PACKAGES"
print_info "Root partition: ${ROOT_SIZE}MB"

make image \
    PROFILE="generic" \
    PACKAGES="$PACKAGES" \
    FILES="files" \
    ROOTFS_PARTSIZE="$ROOT_SIZE" \
    2>&1 | tee build.log

print_success "Firmware built"

# Step 5: Convert to VM formats
print_header "Converting to VM Formats"

# Find the image
IMG_FILE=$(find bin/targets/ -name "*combined*.img.gz" 2>/dev/null | head -1)

if [[ -z "$IMG_FILE" ]]; then
    print_error "No firmware image found!"
    ls -la bin/targets/
    exit 1
fi

print_info "Source: $IMG_FILE"

# Extract (ignore trailing garbage warning)
gunzip -c "$IMG_FILE" > /tmp/openwrt.img 2>/dev/null || {
    if [[ ! -s /tmp/openwrt.img ]]; then
        print_error "Failed to extract"
        exit 1
    fi
}

# Expand to target size
TARGET_BYTES=$(( DISK_SIZE * 1024 * 1024 * 1024 ))
truncate -s ${TARGET_BYTES} /tmp/openwrt.img

BASENAME="c3box-vm-${VERSION}-${ARCH}"

# Convert formats
print_info "Creating VMDK..."
qemu-img convert -f raw -O vmdk /tmp/openwrt.img "$OUTPUT_DIR/${BASENAME}.vmdk"

print_info "Creating VDI..."
qemu-img convert -f raw -O vdi /tmp/openwrt.img "$OUTPUT_DIR/${BASENAME}.vdi"

print_info "Creating QCOW2..."
qemu-img convert -f raw -O qcow2 -c /tmp/openwrt.img "$OUTPUT_DIR/${BASENAME}.qcow2"

print_info "Compressing raw..."
gzip -c /tmp/openwrt.img > "$OUTPUT_DIR/${BASENAME}.img.gz"

rm /tmp/openwrt.img

# Checksums
cd "$OUTPUT_DIR"
sha256sum ${BASENAME}.* > "${BASENAME}-SHA256SUMS"

print_header "Build Complete!"
echo ""
ls -lh "$OUTPUT_DIR/${BASENAME}"*
echo ""
print_success "Output: $OUTPUT_DIR"
