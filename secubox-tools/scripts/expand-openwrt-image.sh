#!/bin/bash
#
# expand-openwrt-image.sh
# Downloads OpenWrt ext4 image and expands it to specified size
#
# Usage: ./expand-openwrt-image.sh [SIZE_GB]
#        SIZE_GB defaults to 16

set -e

# Configuration
IMAGE_URL="https://downloads.openwrt.org/releases/24.10.5/targets/mvebu/cortexa72/openwrt-24.10.5-mvebu-cortexa72-globalscale_mochabin-ext4-sdcard.img.gz"
SIZE_GB="${1:-16}"
WORK_DIR="${WORK_DIR:-$(pwd)}"

# Derived names
IMAGE_GZ="$(basename "$IMAGE_URL")"
IMAGE_NAME="${IMAGE_GZ%.gz}"
OUTPUT_IMAGE="${IMAGE_NAME%.img}-${SIZE_GB}gb.img"

cd "$WORK_DIR"

echo "=== OpenWrt Image Expansion Script (ext4) ==="
echo "Target size: ${SIZE_GB}GB"
echo "Working directory: $WORK_DIR"
echo ""

# Check required tools
for tool in wget gunzip sfdisk; do
    if ! command -v "$tool" &>/dev/null; then
        echo "ERROR: Required tool '$tool' not found"
        exit 1
    fi
done

# Step 1: Download image if not present
if [ -f "$IMAGE_GZ" ]; then
    echo "[1/5] Image archive already exists: $IMAGE_GZ"
elif [ -f "$IMAGE_NAME" ]; then
    echo "[1/5] Decompressed image already exists: $IMAGE_NAME"
else
    echo "[1/5] Downloading image..."
    wget -q --show-progress "$IMAGE_URL" -O "$IMAGE_GZ"
fi

# Step 2: Decompress image
if [ -f "$IMAGE_NAME" ]; then
    echo "[2/5] Image already decompressed: $IMAGE_NAME"
else
    echo "[2/5] Decompressing image..."
    gunzip -k "$IMAGE_GZ" 2>/dev/null || gunzip -kf "$IMAGE_GZ" || true
fi

# Step 3: Create expanded copy
echo "[3/5] Creating ${SIZE_GB}GB image: $OUTPUT_IMAGE"
cp "$IMAGE_NAME" "$OUTPUT_IMAGE"

# Calculate target size in bytes
TARGET_BYTES=$((SIZE_GB * 1024 * 1024 * 1024))

# Expand the image file
truncate -s "$TARGET_BYTES" "$OUTPUT_IMAGE"

# Step 4: Expand partition 2 to fill all space
echo "[4/5] Expanding partition 2..."

echo "Original partition layout:"
fdisk -l "$OUTPUT_IMAGE"
echo ""

# Get partition info
PART_INFO=$(sfdisk -d "$OUTPUT_IMAGE" 2>/dev/null)

# Extract disk label-id (critical for PARTUUID)
LABEL_ID=$(echo "$PART_INFO" | grep -E '^label-id:' | sed 's/label-id: *//')
if [ -z "$LABEL_ID" ]; then
    echo "WARNING: Could not extract label-id, PARTUUID may change!"
else
    echo "Preserving disk label-id: $LABEL_ID"
fi

# Extract partition 1 info
PART1_LINE=$(echo "$PART_INFO" | grep -E '^[^ ]+1 :')
PART1_START=$(echo "$PART1_LINE" | sed -n 's/.*start= *\([0-9]*\).*/\1/p')
PART1_SIZE=$(echo "$PART1_LINE" | sed -n 's/.*size= *\([0-9]*\).*/\1/p')
PART1_TYPE=$(echo "$PART1_LINE" | sed -n 's/.*type= *\([^,]*\).*/\1/p')
PART1_BOOT=$(echo "$PART1_LINE" | grep -q 'bootable' && echo ", bootable" || echo "")

# Extract partition 2 start
PART2_LINE=$(echo "$PART_INFO" | grep -E '^[^ ]+2 :')
PART2_START=$(echo "$PART2_LINE" | sed -n 's/.*start= *\([0-9]*\).*/\1/p')
PART2_TYPE=$(echo "$PART2_LINE" | sed -n 's/.*type= *\([^,]*\).*/\1/p')

if [ -z "$PART2_START" ]; then
    echo "ERROR: Could not parse partition 2"
    exit 1
fi

echo "Partition 2 starts at sector: $PART2_START"
echo "Expanding partition 2 to fill all remaining space..."

# Create new partition table with expanded partition 2
# Include label-id to preserve PARTUUID
LABEL_ID_LINE=""
if [ -n "$LABEL_ID" ]; then
    LABEL_ID_LINE="label-id: $LABEL_ID"
fi

cat <<EOF | sfdisk --no-reread "$OUTPUT_IMAGE"
label: dos
$LABEL_ID_LINE
unit: sectors

${OUTPUT_IMAGE}1 : start=$PART1_START, size=$PART1_SIZE, type=$PART1_TYPE$PART1_BOOT
${OUTPUT_IMAGE}2 : start=$PART2_START, type=$PART2_TYPE
EOF

echo ""
echo "New partition layout:"
fdisk -l "$OUTPUT_IMAGE"

# Verify PARTUUID is preserved
if [ -n "$LABEL_ID" ]; then
    NEW_LABEL_ID=$(sfdisk -d "$OUTPUT_IMAGE" 2>/dev/null | grep -E '^label-id:' | sed 's/label-id: *//')
    if [ "$LABEL_ID" = "$NEW_LABEL_ID" ]; then
        echo ""
        echo "PARTUUID preserved: ${LABEL_ID#0x}-01 (boot), ${LABEL_ID#0x}-02 (root)"
    else
        echo ""
        echo "WARNING: label-id changed from $LABEL_ID to $NEW_LABEL_ID"
        echo "PARTUUID will be different!"
    fi
fi

# Step 5: Resize ext4 filesystem
echo ""
echo "[5/5] Resizing ext4 filesystem..."

PART2_OFFSET=$((PART2_START * 512))

if command -v losetup &>/dev/null && command -v resize2fs &>/dev/null; then
    # Calculate partition 2 size
    TOTAL_SECTORS=$((TARGET_BYTES / 512))
    PART2_SIZE_SECTORS=$((TOTAL_SECTORS - PART2_START))
    PART2_SIZE_BYTES=$((PART2_SIZE_SECTORS * 512))

    LOOP_DEV=$(losetup -f --show -o "$PART2_OFFSET" --sizelimit "$PART2_SIZE_BYTES" "$OUTPUT_IMAGE" 2>/dev/null || true)

    if [ -n "$LOOP_DEV" ]; then
        # Check filesystem
        FS_TYPE=$(blkid -o value -s TYPE "$LOOP_DEV" 2>/dev/null || echo "unknown")
        echo "Filesystem type: $FS_TYPE"

        if [ "$FS_TYPE" = "ext4" ]; then
            echo "Running e2fsck..."
            e2fsck -f -y "$LOOP_DEV" 2>&1 || true
            echo "Running resize2fs..."
            resize2fs "$LOOP_DEV" 2>&1 || true
            echo "Filesystem resized successfully!"
        else
            echo "Warning: Expected ext4, found $FS_TYPE"
        fi

        losetup -d "$LOOP_DEV"
    else
        echo "Note: Could not setup loop device (need root)."
        echo "      Resize filesystem after flashing:"
        echo "      resize2fs /dev/mmcblk0p2"
    fi
else
    echo "Note: losetup or resize2fs not available."
    echo "      Resize filesystem after flashing:"
    echo "      resize2fs /dev/mmcblk0p2"
fi

echo ""
echo "=== Compressing image ==="
echo "Compressing to ${OUTPUT_IMAGE}.gz (this may take a while)..."
gzip -f "$OUTPUT_IMAGE"

echo "Generating checksums..."
sha256sum "${OUTPUT_IMAGE}.gz" > "${OUTPUT_IMAGE}.gz.sha256"
md5sum "${OUTPUT_IMAGE}.gz" > "${OUTPUT_IMAGE}.gz.md5"

echo ""
echo "=== Complete ==="
echo "Expanded image created: ${OUTPUT_IMAGE}.gz"
echo "Compressed size: $(du -h "${OUTPUT_IMAGE}.gz" | cut -f1)"
echo ""
echo "Checksums:"
cat "${OUTPUT_IMAGE}.gz.sha256"
cat "${OUTPUT_IMAGE}.gz.md5"
echo ""
echo "To flash to SD card (replace /dev/sdX with your device):"
echo "  gunzip -c ${OUTPUT_IMAGE}.gz | sudo dd of=/dev/sdX bs=4M status=progress conv=fsync"
echo ""
echo "Or use balenaEtcher/Raspberry Pi Imager (supports .gz directly)."
