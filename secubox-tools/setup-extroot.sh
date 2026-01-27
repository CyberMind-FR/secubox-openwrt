#!/bin/bash
# SecuBox Extroot Setup Script
# Configures overlay on mmcblk0p3 for expanded storage
# Run after fresh install or upgrade

ROUTER_IP="${1:-192.168.255.1}"
ROUTER_USER="${2:-root}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
error() { echo -e "${RED}❌ $*${NC}"; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SecuBox Extroot Setup"
echo "  Target: $ROUTER_USER@$ROUTER_IP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

info "Connecting to router..."

ssh "$ROUTER_USER@$ROUTER_IP" '
#!/bin/sh
# Extroot setup script - runs on router

set -e

OVERLAY_DEV="/dev/mmcblk0p3"
OVERLAY_MOUNT="/mnt/extroot"

echo "=== Checking current setup ==="
echo "Root filesystem:"
df -h /
echo ""

# Check if overlay already mounted
if mount | grep -q "overlay on / "; then
    echo "Overlay already active!"
    df -h /overlay
    exit 0
fi

# Check if partition exists
if [ ! -b "$OVERLAY_DEV" ]; then
    echo "ERROR: Partition $OVERLAY_DEV not found"
    exit 1
fi

# Get partition info
FSTYPE=$(blkid "$OVERLAY_DEV" -s TYPE -o value 2>/dev/null || echo "unknown")
echo "Partition: $OVERLAY_DEV"
echo "Filesystem: $FSTYPE"
echo ""

# Install required packages if not present
echo "=== Checking required packages ==="
opkg update 2>/dev/null || true

if [ "$FSTYPE" = "f2fs" ]; then
    if ! opkg list-installed | grep -q "^kmod-fs-f2fs"; then
        echo "Installing f2fs support..."
        opkg install kmod-fs-f2fs f2fs-tools 2>/dev/null || true
    fi
elif [ "$FSTYPE" = "ext4" ]; then
    if ! opkg list-installed | grep -q "^kmod-fs-ext4"; then
        echo "Installing ext4 support..."
        opkg install kmod-fs-ext4 e2fsprogs 2>/dev/null || true
    fi
fi

# Ensure block-mount is installed
if ! opkg list-installed | grep -q "^block-mount"; then
    echo "Installing block-mount..."
    opkg install block-mount 2>/dev/null || true
fi

echo ""
echo "=== Preparing overlay partition ==="

# Mount partition temporarily
mkdir -p "$OVERLAY_MOUNT"
mount -t "$FSTYPE" "$OVERLAY_DEV" "$OVERLAY_MOUNT" || {
    echo "ERROR: Cannot mount $OVERLAY_DEV"
    exit 1
}

# Create overlay directories
mkdir -p "$OVERLAY_MOUNT/upper"
mkdir -p "$OVERLAY_MOUNT/work"

# Copy existing overlay data if any
if [ -d /overlay/upper ]; then
    echo "Copying existing overlay data..."
    cp -a /overlay/upper/* "$OVERLAY_MOUNT/upper/" 2>/dev/null || true
fi

# Sync
sync

# Unmount
umount "$OVERLAY_MOUNT"

echo ""
echo "=== Configuring fstab ==="

# Get block info
eval $(block info "$OVERLAY_DEV" | grep -o "UUID=\S*")
echo "UUID: $UUID"

# Configure fstab using UCI
uci -q delete fstab.extroot 2>/dev/null || true
uci set fstab.extroot=mount
uci set fstab.extroot.target="/overlay"
uci set fstab.extroot.uuid="$UUID"
uci set fstab.extroot.enabled="1"
if [ "$FSTYPE" = "f2fs" ]; then
    uci set fstab.extroot.fstype="f2fs"
    uci set fstab.extroot.options="rw,noatime"
fi
uci commit fstab

echo ""
echo "=== Updated fstab ==="
cat /etc/config/fstab

echo ""
echo "=== Setup complete! ==="
echo ""
echo "IMPORTANT: Reboot to activate the overlay"
echo "After reboot, /overlay will be mounted on the 14GB partition"
echo ""
echo "Run: reboot"
'

if [ $? -eq 0 ]; then
    success "Extroot configuration complete!"
    echo ""
    warn "REBOOT REQUIRED to activate overlay"
    echo ""
    read -p "Reboot router now? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Rebooting router..."
        ssh "$ROUTER_USER@$ROUTER_IP" "reboot" 2>/dev/null || true
        echo ""
        info "Waiting for router to come back online..."
        sleep 60

        # Wait for router to come back
        for i in {1..30}; do
            if ssh -o ConnectTimeout=5 "$ROUTER_USER@$ROUTER_IP" "echo ok" 2>/dev/null; then
                success "Router is back online!"
                echo ""
                ssh "$ROUTER_USER@$ROUTER_IP" '
                    echo "=== Overlay status ==="
                    mount | grep overlay || echo "No overlay (yet)"
                    echo ""
                    echo "=== Disk usage ==="
                    df -h / /overlay 2>/dev/null
                '
                break
            fi
            echo "Waiting... ($i/30)"
            sleep 5
        done
    fi
else
    error "Setup failed"
fi
