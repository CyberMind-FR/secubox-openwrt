#!/bin/sh
# Fix extroot by formatting mmcblk0p3 fresh
# Run this from console or SSH after failsafe boot

OVERLAY_DEV="/dev/mmcblk0p3"

echo "=== SecuBox Extroot Fix ==="
echo ""

# Stop services using overlay
echo "Stopping services..."
for svc in /etc/init.d/*; do
    [ -x "$svc" ] && "$svc" stop 2>/dev/null &
done
sleep 3

# Kill processes using overlay
echo "Killing processes using overlay..."
fuser -km /overlay 2>/dev/null || true
sleep 2

# Unmount everything
echo "Unmounting filesystems..."
umount -l /overlay 2>/dev/null || true
umount -l /mnt/extroot 2>/dev/null || true
umount -l "$OVERLAY_DEV" 2>/dev/null || true
sync
sleep 2

# Verify unmounted
if mount | grep -q "$OVERLAY_DEV"; then
    echo "ERROR: Cannot unmount $OVERLAY_DEV"
    echo "Try: reboot into failsafe mode and run this script"
    exit 1
fi

echo ""
echo "Formatting $OVERLAY_DEV as f2fs..."
mkfs.f2fs -f -l rootfs_data "$OVERLAY_DEV" || {
    echo "Format failed! Try: mkfs.ext4 -L rootfs_data $OVERLAY_DEV"
    exit 1
}

echo ""
echo "Preparing overlay structure..."
mkdir -p /mnt/extroot
mount -t f2fs "$OVERLAY_DEV" /mnt/extroot
mkdir -p /mnt/extroot/upper /mnt/extroot/work
sync
umount /mnt/extroot

echo ""
echo "Configuring fstab..."
UUID=$(blkid "$OVERLAY_DEV" -s UUID -o value)
echo "UUID: $UUID"

# Write fstab config
cat > /etc/config/fstab << EOF
config global
	option anon_swap '0'
	option anon_mount '0'
	option auto_swap '0'
	option auto_mount '1'
	option delay_root '5'
	option check_fs '1'

config mount 'extroot'
	option target '/overlay'
	option uuid '$UUID'
	option enabled '1'
	option fstype 'f2fs'
	option options 'rw,noatime'

config mount 'srv'
	option target '/srv'
	option uuid '443e8304-4d3b-4fd0-9f26-74c50ba64113'
	option enabled '1'
EOF

echo ""
echo "=== Setup complete ==="
echo ""
cat /etc/config/fstab
echo ""
echo "Now reboot: reboot"
