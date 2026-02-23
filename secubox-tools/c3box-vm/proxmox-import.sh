#!/bin/bash
#
# proxmox-import.sh - Import SecuBox VM into Proxmox VE
#
# Usage: ./proxmox-import.sh [VMID] [STORAGE] [QCOW2_FILE]
#
# Examples:
#   ./proxmox-import.sh 200 local-lvm
#   ./proxmox-import.sh 201 local-zfs C3Box-SecuBox.qcow2
#

set -e

VMID="${1:-200}"
STORAGE="${2:-local-lvm}"
QCOW2_FILE="${3:-C3Box-SecuBox.qcow2}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}SecuBox VM Import for Proxmox VE${NC}"
echo "=================================="
echo ""
echo "VMID:    $VMID"
echo "Storage: $STORAGE"
echo "Image:   $QCOW2_FILE"
echo ""

# Check if file exists
if [ ! -f "$QCOW2_FILE" ]; then
    echo "Error: QCOW2 file not found: $QCOW2_FILE"
    exit 1
fi

# Check if qm command exists
if ! command -v qm &>/dev/null; then
    echo "Error: qm command not found. Are you running this on Proxmox?"
    exit 1
fi

# Check if VMID already exists
if qm status $VMID &>/dev/null; then
    echo "Error: VM $VMID already exists. Choose a different VMID."
    exit 1
fi

echo "Creating VM $VMID..."

# Create VM with basic settings
qm create $VMID \
    --name c3box-secubox \
    --memory 2048 \
    --cores 2 \
    --cpu host \
    --net0 virtio,bridge=vmbr0 \
    --ostype l26 \
    --agent enabled=1

echo "Importing disk..."

# Import disk
qm importdisk $VMID "$QCOW2_FILE" $STORAGE --format qcow2

echo "Attaching disk..."

# Attach disk with VirtIO SCSI
qm set $VMID \
    --scsihw virtio-scsi-pci \
    --scsi0 $STORAGE:vm-$VMID-disk-0

# Set boot order
qm set $VMID --boot order=scsi0

# Add serial console for troubleshooting
qm set $VMID --serial0 socket

echo ""
echo -e "${GREEN}VM $VMID created successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Start VM:     qm start $VMID"
echo "  2. Open console: qm terminal $VMID"
echo "  3. Get IP:       qm guest cmd $VMID network-get-interfaces"
echo "  4. Web UI:       https://<vm-ip>"
echo ""
echo "Default credentials: root / c3box"
echo "IMPORTANT: Change the password on first login!"
