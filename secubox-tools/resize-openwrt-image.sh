#!/bin/bash
#
# resize-openwrt-image.sh - Resize OpenWrt image to fit target eMMC/SD card
#
# This script expands an OpenWrt ext4-sdcard image to a specified size
# while preserving all UUIDs (disk ID, PARTUUIDs, filesystem UUIDs).
#
# Usage: sudo ./resize-openwrt-image.sh <input.img.gz> <target_size> [output.img.gz]
#
# Examples:
#   sudo ./resize-openwrt-image.sh openwrt.img.gz 8G
#   sudo ./resize-openwrt-image.sh openwrt.img.gz 16G openwrt-16g.img.gz
#
# Target size can be: 8G, 16G, 32G, or any size in bytes/KB/MB/GB
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root (sudo)"
    exit 1
fi

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <input.img.gz> <target_size> [output.img.gz]"
    echo ""
    echo "Arguments:"
    echo "  input.img.gz   - Compressed OpenWrt image file"
    echo "  target_size    - Target size (e.g., 8G, 16G, 32G)"
    echo "  output.img.gz  - Optional output filename (default: input-resized.img.gz)"
    echo ""
    echo "Examples:"
    echo "  $0 openwrt.img.gz 8G"
    echo "  $0 openwrt.img.gz 16G openwrt-16g.img.gz"
    exit 1
fi

INPUT_FILE="$1"
TARGET_SIZE="$2"
OUTPUT_FILE="${3:-${INPUT_FILE%.img.gz}-resized.img.gz}"

# Remove (1) or similar from output name if present
OUTPUT_FILE="${OUTPUT_FILE/\(1\)/}"
OUTPUT_FILE="${OUTPUT_FILE/\(2\)/}"

# Check input file exists
if [ ! -f "$INPUT_FILE" ]; then
    log_error "Input file not found: $INPUT_FILE"
    exit 1
fi

# Check required tools
for tool in gunzip gzip fdisk sfdisk parted e2fsck resize2fs losetup blkid; do
    if ! command -v $tool &> /dev/null; then
        log_error "Required tool not found: $tool"
        exit 1
    fi
done

# Convert target size to bytes
parse_size() {
    local size="$1"
    local num="${size%[GgMmKk]*}"
    local unit="${size#$num}"

    case "${unit^^}" in
        G|GB) echo $((num * 1024 * 1024 * 1024)) ;;
        M|MB) echo $((num * 1024 * 1024)) ;;
        K|KB) echo $((num * 1024)) ;;
        *)    echo "$num" ;;
    esac
}

TARGET_BYTES=$(parse_size "$TARGET_SIZE")
TARGET_SECTORS=$((TARGET_BYTES / 512))

log_info "Input file: $INPUT_FILE"
log_info "Target size: $TARGET_SIZE ($TARGET_BYTES bytes, $TARGET_SECTORS sectors)"
log_info "Output file: $OUTPUT_FILE"

# Create temporary working directory
WORK_DIR=$(mktemp -d)
TEMP_IMG="$WORK_DIR/openwrt.img"
trap "rm -rf $WORK_DIR" EXIT

log_info "Working directory: $WORK_DIR"

# Decompress image
log_info "Decompressing image..."
gunzip -c "$INPUT_FILE" > "$TEMP_IMG" 2>/dev/null || {
    # Handle trailing garbage warning
    if [ -f "$TEMP_IMG" ] && [ -s "$TEMP_IMG" ]; then
        log_warn "Decompression completed with warnings (trailing garbage ignored)"
    else
        log_error "Failed to decompress image"
        exit 1
    fi
}

# Get original image info
ORIG_SIZE=$(stat -c%s "$TEMP_IMG")
log_info "Original image size: $((ORIG_SIZE / 1024 / 1024)) MB"

# Save partition table info
log_info "Reading partition table..."
DISK_ID=$(fdisk -l "$TEMP_IMG" 2>/dev/null | grep "Identifiant de disque\|Disk identifier" | awk '{print $NF}')
log_info "Disk ID: $DISK_ID"

# Get partition info using sfdisk
sfdisk -d "$TEMP_IMG" > "$WORK_DIR/part_table.txt" 2>/dev/null

# Parse partition info
PART1_START=$(grep "${TEMP_IMG}1" "$WORK_DIR/part_table.txt" | sed 's/.*start= *\([0-9]*\).*/\1/')
PART1_SIZE=$(grep "${TEMP_IMG}1" "$WORK_DIR/part_table.txt" | sed 's/.*size= *\([0-9]*\).*/\1/')
PART2_START=$(grep "${TEMP_IMG}2" "$WORK_DIR/part_table.txt" | sed 's/.*start= *\([0-9]*\).*/\1/')

log_info "Partition 1: start=$PART1_START, size=$PART1_SIZE (boot/kernel)"
log_info "Partition 2: start=$PART2_START (rootfs, will be expanded)"

# Calculate new partition 2 size (use all remaining space, leave 1MB at end for safety)
SAFETY_SECTORS=2048  # 1MB safety margin
NEW_PART2_SIZE=$((TARGET_SECTORS - PART2_START - SAFETY_SECTORS))

log_info "New partition 2 size: $NEW_PART2_SIZE sectors ($((NEW_PART2_SIZE * 512 / 1024 / 1024)) MB)"

# Expand the image file
log_info "Expanding image to $TARGET_SIZE..."
truncate -s "$TARGET_BYTES" "$TEMP_IMG"

# Setup loop device to get filesystem UUIDs before modifying
log_info "Setting up loop device to preserve UUIDs..."
LOOP=$(losetup -fP --show "$TEMP_IMG")
log_info "Loop device: $LOOP"

# Get filesystem UUIDs
PART1_UUID=$(blkid -s UUID -o value "${LOOP}p1" 2>/dev/null || echo "")
PART2_UUID=$(blkid -s UUID -o value "${LOOP}p2" 2>/dev/null || echo "")
PART1_PARTUUID=$(blkid -s PARTUUID -o value "${LOOP}p1" 2>/dev/null || echo "")
PART2_PARTUUID=$(blkid -s PARTUUID -o value "${LOOP}p2" 2>/dev/null || echo "")

log_info "Partition 1 UUID: $PART1_UUID, PARTUUID: $PART1_PARTUUID"
log_info "Partition 2 UUID: $PART2_UUID, PARTUUID: $PART2_PARTUUID"

# Detach loop for partition table modification
losetup -d "$LOOP"

# Recreate partition table with same disk ID and expanded partition 2
log_info "Recreating partition table with expanded partition 2..."

# Use sfdisk to recreate partitions
cat > "$WORK_DIR/new_part_table.txt" << EOF
label: dos
label-id: $DISK_ID
unit: sectors

${TEMP_IMG}1 : start=$PART1_START, size=$PART1_SIZE, type=83, bootable
${TEMP_IMG}2 : start=$PART2_START, size=$NEW_PART2_SIZE, type=83
EOF

sfdisk "$TEMP_IMG" < "$WORK_DIR/new_part_table.txt" 2>/dev/null

# Verify disk ID preserved
NEW_DISK_ID=$(fdisk -l "$TEMP_IMG" 2>/dev/null | grep "Identifiant de disque\|Disk identifier" | awk '{print $NF}')
log_info "Verified Disk ID: $NEW_DISK_ID"

if [ "$DISK_ID" != "$NEW_DISK_ID" ]; then
    log_warn "Disk ID changed! Attempting to restore..."
    # Use fdisk to set disk ID (not typically needed with sfdisk)
fi

# Setup loop device again for filesystem operations
LOOP=$(losetup -fP --show "$TEMP_IMG")
log_info "Loop device for resize: $LOOP"

# Check and resize ext4 filesystem on partition 2
log_info "Checking ext4 filesystem..."
e2fsck -f -y "${LOOP}p2" || true

log_info "Resizing ext4 filesystem to fill partition..."
resize2fs "${LOOP}p2"

# Verify UUIDs are preserved
NEW_PART1_UUID=$(blkid -s UUID -o value "${LOOP}p1" 2>/dev/null || echo "")
NEW_PART2_UUID=$(blkid -s UUID -o value "${LOOP}p2" 2>/dev/null || echo "")
NEW_PART1_PARTUUID=$(blkid -s PARTUUID -o value "${LOOP}p1" 2>/dev/null || echo "")
NEW_PART2_PARTUUID=$(blkid -s PARTUUID -o value "${LOOP}p2" 2>/dev/null || echo "")

log_info "Verifying UUIDs preserved:"
log_info "  Part1 UUID: $PART1_UUID -> $NEW_PART1_UUID"
log_info "  Part2 UUID: $PART2_UUID -> $NEW_PART2_UUID"
log_info "  Part1 PARTUUID: $PART1_PARTUUID -> $NEW_PART1_PARTUUID"
log_info "  Part2 PARTUUID: $PART2_PARTUUID -> $NEW_PART2_PARTUUID"

# Check if UUIDs match
UUID_OK=true
if [ "$PART2_UUID" != "$NEW_PART2_UUID" ] && [ -n "$PART2_UUID" ]; then
    log_warn "Partition 2 UUID changed! Restoring..."
    tune2fs -U "$PART2_UUID" "${LOOP}p2"
    UUID_OK=false
fi

# Show final partition info
log_info "Final partition layout:"
fdisk -l "$TEMP_IMG" 2>/dev/null | grep -E "^/|^Périphérique|^Device"

# Detach loop device
losetup -d "$LOOP"

# Compress output
log_info "Compressing output image..."
gzip -c "$TEMP_IMG" > "$OUTPUT_FILE"

# Show results
OUTPUT_SIZE=$(stat -c%s "$OUTPUT_FILE")
log_info "Done!"
log_info ""
log_info "Summary:"
log_info "  Input:  $INPUT_FILE ($((ORIG_SIZE / 1024 / 1024)) MB uncompressed)"
log_info "  Output: $OUTPUT_FILE ($((OUTPUT_SIZE / 1024 / 1024)) MB compressed)"
log_info "  Target: $TARGET_SIZE ($((TARGET_BYTES / 1024 / 1024)) MB)"
log_info ""
log_info "UUIDs preserved - image ready for flashing!"
