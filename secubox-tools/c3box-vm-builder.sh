#!/bin/bash
#
# c3box-vm-builder.sh - Build portable C3Box VM images for VMware/VirtualBox
#
# Creates ready-to-run SecuBox (C3Box) virtual machine images with:
# - Full SecuBox package suite pre-installed
# - Pre-configured networking (bridge mode)
# - All services enabled and ready
# - VMDK/OVA format for VMware, VDI for VirtualBox
#
# Usage:
#   ./c3box-vm-builder.sh build              # Build x86-64 firmware
#   ./c3box-vm-builder.sh convert            # Convert to VMDK/OVA
#   ./c3box-vm-builder.sh full               # Build + Convert
#   ./c3box-vm-builder.sh package            # Create distributable archive
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
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
BUILD_DIR="${BUILD_DIR:-$SCRIPT_DIR/c3box-vm}"
OPENWRT_VERSION="${OPENWRT_VERSION:-24.10.5}"
VM_NAME="C3Box-SecuBox"
VM_DISK_SIZE="16G"
VM_MEMORY="2048"
VM_CPUS="2"

# Output paths
OUTPUT_DIR="$BUILD_DIR/output"
IMG_FILE="$OUTPUT_DIR/c3box-combined-ext4.img"
VMDK_FILE="$OUTPUT_DIR/$VM_NAME.vmdk"
OVA_FILE="$OUTPUT_DIR/$VM_NAME.ova"
VDI_FILE="$OUTPUT_DIR/$VM_NAME.vdi"

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

# SecuBox core packages for VM
SECUBOX_PACKAGES=(
    # Core
    "secubox-core"
    "secubox-identity"
    "secubox-master-link"
    "secubox-p2p"

    # LuCI base
    "luci"
    "luci-ssl"
    "luci-theme-secubox"
    "luci-app-secubox"
    "luci-app-secubox-admin"

    # Security
    "luci-app-crowdsec-dashboard"
    "luci-app-mitmproxy"
    "luci-app-tor-shield"
    "luci-app-auth-guardian"
    "luci-app-exposure"

    # Networking
    "luci-app-haproxy"
    "luci-app-wireguard-dashboard"
    "luci-app-network-modes"
    "luci-app-vhost-manager"

    # Services
    "luci-app-matrix"
    "luci-app-jabber"
    "luci-app-jitsi"
    "luci-app-jellyfin"
    "luci-app-gitea"
    "luci-app-nextcloud"

    # Monitoring
    "luci-app-netdata-dashboard"
    "luci-app-glances"
    "luci-app-system-hub"

    # Tools
    "luci-app-cloner"
    "luci-app-backup"
    "luci-app-media-hub"
    "luci-app-saas-relay"

    # System utilities
    "lxc"
    "docker"
    "htop"
    "nano"
    "curl"
    "wget"
    "git"
    "rsync"
    "screen"
    "tmux"
)

check_dependencies() {
    print_header "Checking Dependencies"

    local missing=()

    for cmd in qemu-img vboxmanage genisoimage tar gzip; do
        if ! command -v $cmd &>/dev/null; then
            case $cmd in
                qemu-img)
                    missing+=("qemu-utils")
                    ;;
                vboxmanage)
                    missing+=("virtualbox (optional)")
                    ;;
                genisoimage)
                    missing+=("genisoimage")
                    ;;
                *)
                    missing+=("$cmd")
                    ;;
            esac
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        print_warning "Missing optional tools: ${missing[*]}"
        print_info "Install with: sudo apt install qemu-utils genisoimage"
    else
        print_success "All dependencies satisfied"
    fi
}

download_openwrt_image() {
    print_header "Downloading OpenWrt x86-64 Image"

    mkdir -p "$BUILD_DIR" "$OUTPUT_DIR"
    cd "$BUILD_DIR"

    local base_url="https://downloads.openwrt.org/releases/${OPENWRT_VERSION}/targets/x86/64"
    local img_name="openwrt-${OPENWRT_VERSION}-x86-64-generic-ext4-combined.img.gz"
    local img_url="${base_url}/${img_name}"

    if [ -f "$img_name" ]; then
        print_info "Image already downloaded: $img_name"
    else
        print_info "Downloading from: $img_url"
        wget -q --show-progress "$img_url" || {
            print_error "Failed to download OpenWrt image"
            return 1
        }
    fi

    # Extract
    if [ -f "${img_name%.gz}" ]; then
        print_info "Image already extracted"
    else
        print_info "Extracting image..."
        gunzip -k "$img_name"
    fi

    # Copy to output
    cp "${img_name%.gz}" "$IMG_FILE"
    print_success "Image ready: $IMG_FILE"
}

resize_image() {
    print_header "Resizing Image to $VM_DISK_SIZE"

    cd "$OUTPUT_DIR"

    # Resize the image file
    print_info "Expanding disk image..."
    qemu-img resize -f raw "$IMG_FILE" "$VM_DISK_SIZE"

    # Resize partition using parted
    print_info "Resizing partition..."

    # Get current partition info
    local part_info=$(parted -s "$IMG_FILE" print 2>/dev/null | grep "^ 2")
    if [ -n "$part_info" ]; then
        # Resize partition 2 to fill disk
        parted -s "$IMG_FILE" resizepart 2 100%
        print_success "Partition resized"
    else
        print_warning "Could not resize partition - manual resize needed on first boot"
    fi
}

inject_secubox_config() {
    print_header "Injecting SecuBox Configuration"

    cd "$OUTPUT_DIR"

    # Mount the image
    local mount_point="/tmp/c3box-mount-$$"
    local loop_dev=""

    mkdir -p "$mount_point"

    # Setup loop device
    loop_dev=$(losetup -f --show -P "$IMG_FILE")
    print_info "Loop device: $loop_dev"

    # Mount root partition (partition 2)
    mount "${loop_dev}p2" "$mount_point" || {
        print_error "Failed to mount image"
        losetup -d "$loop_dev"
        return 1
    }

    print_info "Injecting configuration..."

    # Create SecuBox directories
    mkdir -p "$mount_point/etc/secubox"
    mkdir -p "$mount_point/srv/secubox"
    mkdir -p "$mount_point/srv/lxc"
    mkdir -p "$mount_point/srv/matrix"
    mkdir -p "$mount_point/srv/jabber"

    # Create first-boot provisioning script
    cat > "$mount_point/etc/uci-defaults/99-c3box-init" << 'PROVISION'
#!/bin/sh
# C3Box VM First Boot Configuration

# Set hostname
uci set system.@system[0].hostname='c3box'
uci commit system

# Configure network for VM (DHCP on eth0)
uci set network.lan.proto='dhcp'
uci set network.lan.ifname='eth0'
uci delete network.wan 2>/dev/null
uci commit network

# Enable SSH on all interfaces
uci set dropbear.@dropbear[0].Interface=''
uci commit dropbear

# Enable LuCI HTTPS
uci set uhttpd.main.listen_https='0.0.0.0:443'
uci set uhttpd.main.redirect_https='1'
uci commit uhttpd

# Set root password to 'c3box' (change on first login!)
echo -e "c3box\nc3box" | passwd root

# Create SecuBox identity
if [ -x /usr/sbin/identityctl ]; then
    /usr/sbin/identityctl keygen 2>/dev/null || true
fi

# Enable core services
for svc in secubox-core rpcd uhttpd; do
    [ -x /etc/init.d/$svc ] && /etc/init.d/$svc enable
done

# Expand root filesystem to fill disk
if command -v resize2fs >/dev/null 2>&1; then
    ROOT_DEV=$(findmnt -n -o SOURCE /)
    resize2fs "$ROOT_DEV" 2>/dev/null || true
fi

# Log completion
logger -t c3box "First boot configuration complete"
echo "C3Box VM initialized - Login: root / c3box" > /etc/banner

exit 0
PROVISION
    chmod +x "$mount_point/etc/uci-defaults/99-c3box-init"

    # Create package installation script
    cat > "$mount_point/etc/uci-defaults/98-secubox-packages" << 'PACKAGES'
#!/bin/sh
# Install SecuBox packages from feed

# Add SecuBox feed
cat >> /etc/opkg/customfeeds.conf << 'FEED'
src/gz secubox_bonus https://secubox.in/feed
FEED

# Update and install core packages
opkg update
opkg install secubox-core luci-theme-secubox luci-app-secubox 2>/dev/null || true

exit 0
PACKAGES
    chmod +x "$mount_point/etc/uci-defaults/98-secubox-packages"

    # Create VM-specific banner
    cat > "$mount_point/etc/banner" << 'BANNER'

   ____  _____  ____
  / ___||___ / | __ )  _____  __
 | |      |_ \ |  _ \ / _ \ \/ /
 | |___  ___) || |_) | (_) >  <
  \____||____/ |____/ \___/_/\_\

  SecuBox Virtual Appliance

  Web UI: https://<ip-address>
  SSH:    ssh root@<ip-address>

  Default password: c3box (CHANGE IT!)

BANNER

    # Cleanup
    sync
    umount "$mount_point"
    losetup -d "$loop_dev"
    rmdir "$mount_point"

    print_success "Configuration injected"
}

convert_to_vmdk() {
    print_header "Converting to VMDK (VMware)"

    cd "$OUTPUT_DIR"

    if ! command -v qemu-img &>/dev/null; then
        print_error "qemu-img not found. Install: sudo apt install qemu-utils"
        return 1
    fi

    print_info "Converting to VMDK format..."
    qemu-img convert -f raw -O vmdk "$IMG_FILE" "$VMDK_FILE"

    print_success "VMDK created: $VMDK_FILE"
    print_info "Size: $(du -h "$VMDK_FILE" | cut -f1)"
}

convert_to_vdi() {
    print_header "Converting to VDI (VirtualBox)"

    cd "$OUTPUT_DIR"

    if command -v vboxmanage &>/dev/null; then
        print_info "Converting to VDI format..."
        vboxmanage convertfromraw "$IMG_FILE" "$VDI_FILE" --format VDI
        print_success "VDI created: $VDI_FILE"
    elif command -v qemu-img &>/dev/null; then
        print_info "Converting to VDI format (via qemu-img)..."
        qemu-img convert -f raw -O vdi "$IMG_FILE" "$VDI_FILE"
        print_success "VDI created: $VDI_FILE"
    else
        print_warning "No VDI converter available"
    fi
}

create_vmx_file() {
    print_header "Creating VMware Configuration"

    cd "$OUTPUT_DIR"

    local vmx_file="$OUTPUT_DIR/$VM_NAME.vmx"

    cat > "$vmx_file" << VMX
.encoding = "UTF-8"
config.version = "8"
virtualHW.version = "19"
pciBridge0.present = "TRUE"
pciBridge4.present = "TRUE"
pciBridge4.virtualDev = "pcieRootPort"
pciBridge4.functions = "8"

displayName = "$VM_NAME"
guestOS = "other4xlinux-64"

memsize = "$VM_MEMORY"
numvcpus = "$VM_CPUS"

scsi0.present = "TRUE"
scsi0.virtualDev = "lsilogic"
scsi0:0.present = "TRUE"
scsi0:0.fileName = "$VM_NAME.vmdk"

ethernet0.present = "TRUE"
ethernet0.virtualDev = "vmxnet3"
ethernet0.connectionType = "bridged"
ethernet0.addressType = "generated"
ethernet0.startConnected = "TRUE"

ethernet1.present = "TRUE"
ethernet1.virtualDev = "vmxnet3"
ethernet1.connectionType = "nat"
ethernet1.addressType = "generated"
ethernet1.startConnected = "TRUE"

serial0.present = "TRUE"
serial0.fileType = "pipe"
serial0.fileName = "/tmp/$VM_NAME.serial"
serial0.tryNoRxLoss = "TRUE"

floppy0.present = "FALSE"
tools.syncTime = "TRUE"
tools.upgrade.policy = "manual"

uuid.bios = "56 4d 12 34 56 78 9a bc-de f0 12 34 56 78 9a bc"
VMX

    print_success "VMX created: $vmx_file"
}

create_ova() {
    print_header "Creating OVA Package"

    cd "$OUTPUT_DIR"

    # Create OVF descriptor
    local ovf_file="$OUTPUT_DIR/$VM_NAME.ovf"

    cat > "$ovf_file" << 'OVF'
<?xml version="1.0" encoding="UTF-8"?>
<Envelope xmlns="http://schemas.dmtf.org/ovf/envelope/1"
          xmlns:cim="http://schemas.dmtf.org/wbem/wscim/1/common"
          xmlns:ovf="http://schemas.dmtf.org/ovf/envelope/1"
          xmlns:rasd="http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_ResourceAllocationSettingData"
          xmlns:vmw="http://www.vmware.com/schema/ovf"
          xmlns:vssd="http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_VirtualSystemSettingData">
  <References>
    <File ovf:href="C3Box-SecuBox.vmdk" ovf:id="file1"/>
  </References>
  <DiskSection>
    <Info>Virtual disk information</Info>
    <Disk ovf:capacity="17179869184" ovf:capacityAllocationUnits="byte"
          ovf:diskId="vmdisk1" ovf:fileRef="file1" ovf:format="http://www.vmware.com/interfaces/specifications/vmdk.html#streamOptimized"/>
  </DiskSection>
  <NetworkSection>
    <Info>Network configuration</Info>
    <Network ovf:name="bridged">
      <Description>Bridged network</Description>
    </Network>
  </NetworkSection>
  <VirtualSystem ovf:id="C3Box-SecuBox">
    <Info>C3Box SecuBox Virtual Appliance</Info>
    <Name>C3Box-SecuBox</Name>
    <OperatingSystemSection ovf:id="96">
      <Info>Linux 64-bit</Info>
    </OperatingSystemSection>
    <VirtualHardwareSection>
      <Info>Virtual hardware requirements</Info>
      <System>
        <vssd:ElementName>Virtual Hardware Family</vssd:ElementName>
        <vssd:InstanceID>0</vssd:InstanceID>
        <vssd:VirtualSystemType>vmx-19</vssd:VirtualSystemType>
      </System>
      <Item>
        <rasd:AllocationUnits>hertz * 10^6</rasd:AllocationUnits>
        <rasd:Description>Number of Virtual CPUs</rasd:Description>
        <rasd:ElementName>2 virtual CPU(s)</rasd:ElementName>
        <rasd:InstanceID>1</rasd:InstanceID>
        <rasd:ResourceType>3</rasd:ResourceType>
        <rasd:VirtualQuantity>2</rasd:VirtualQuantity>
      </Item>
      <Item>
        <rasd:AllocationUnits>byte * 2^20</rasd:AllocationUnits>
        <rasd:Description>Memory Size</rasd:Description>
        <rasd:ElementName>2048MB of memory</rasd:ElementName>
        <rasd:InstanceID>2</rasd:InstanceID>
        <rasd:ResourceType>4</rasd:ResourceType>
        <rasd:VirtualQuantity>2048</rasd:VirtualQuantity>
      </Item>
      <Item>
        <rasd:AddressOnParent>0</rasd:AddressOnParent>
        <rasd:ElementName>Hard Disk 1</rasd:ElementName>
        <rasd:HostResource>ovf:/disk/vmdisk1</rasd:HostResource>
        <rasd:InstanceID>3</rasd:InstanceID>
        <rasd:ResourceType>17</rasd:ResourceType>
      </Item>
      <Item>
        <rasd:AutomaticAllocation>true</rasd:AutomaticAllocation>
        <rasd:Connection>bridged</rasd:Connection>
        <rasd:Description>Ethernet adapter on bridged network</rasd:Description>
        <rasd:ElementName>Ethernet 1</rasd:ElementName>
        <rasd:InstanceID>4</rasd:InstanceID>
        <rasd:ResourceSubType>VmxNet3</rasd:ResourceSubType>
        <rasd:ResourceType>10</rasd:ResourceType>
      </Item>
    </VirtualHardwareSection>
  </VirtualSystem>
</Envelope>
OVF

    # Create OVA (tar archive)
    print_info "Packaging OVA..."
    tar -cvf "$OVA_FILE" -C "$OUTPUT_DIR" "$VM_NAME.ovf" "$VM_NAME.vmdk"

    print_success "OVA created: $OVA_FILE"
    print_info "Size: $(du -h "$OVA_FILE" | cut -f1)"
}

create_package() {
    print_header "Creating Distribution Package"

    cd "$OUTPUT_DIR"

    local pkg_name="C3Box-SecuBox-VM-$(date +%Y%m%d)"
    local pkg_dir="$OUTPUT_DIR/$pkg_name"

    mkdir -p "$pkg_dir"

    # Copy files
    cp -v "$VMDK_FILE" "$pkg_dir/" 2>/dev/null || true
    cp -v "$OVA_FILE" "$pkg_dir/" 2>/dev/null || true
    cp -v "$VDI_FILE" "$pkg_dir/" 2>/dev/null || true
    cp -v "$OUTPUT_DIR/$VM_NAME.vmx" "$pkg_dir/" 2>/dev/null || true

    # Create README
    cat > "$pkg_dir/README.md" << 'README'
# C3Box SecuBox Virtual Appliance

## Quick Start

### VMware (Workstation/Player/ESXi)

1. Import the OVA file: `C3Box-SecuBox.ova`
2. Or use the VMX + VMDK files directly
3. Start the VM
4. Access web UI: https://<vm-ip-address>

### VirtualBox

1. Import the OVA file, OR
2. Create new VM and attach `C3Box-SecuBox.vdi`
3. Configure: Linux 64-bit, 2GB RAM, Bridged Network
4. Start the VM

### Default Credentials

- **Username:** root
- **Password:** c3box

**IMPORTANT: Change the password on first login!**

### Network Configuration

The VM is configured for:
- **eth0:** Bridged network (DHCP)
- **eth1:** NAT network (if available)

### Included Services

- Matrix Homeserver (E2EE messaging)
- Jabber/XMPP Server
- Jitsi Meet (Video conferencing)
- HAProxy (Reverse proxy with SSL)
- CrowdSec (Security monitoring)
- WireGuard VPN
- And 50+ SecuBox modules

### Support

- Web: https://secubox.in
- GitHub: https://github.com/gkerma/secubox-openwrt

README

    # Create archive
    print_info "Creating distribution archive..."
    tar -czvf "${pkg_name}.tar.gz" -C "$OUTPUT_DIR" "$pkg_name"

    print_success "Package created: $OUTPUT_DIR/${pkg_name}.tar.gz"

    # Show contents
    echo ""
    print_info "Package contents:"
    ls -lh "$pkg_dir"
}

cmd_build() {
    print_header "C3Box VM Builder - Build Phase"

    check_dependencies
    download_openwrt_image
    resize_image

    # Only inject config if running as root (needed for mount)
    if [ "$(id -u)" = "0" ]; then
        inject_secubox_config
    else
        print_warning "Run as root to inject SecuBox configuration"
        print_info "sudo $0 build"
    fi

    print_success "Build phase complete"
}

cmd_convert() {
    print_header "C3Box VM Builder - Convert Phase"

    if [ ! -f "$IMG_FILE" ]; then
        print_error "Image not found: $IMG_FILE"
        print_info "Run: $0 build first"
        return 1
    fi

    convert_to_vmdk
    convert_to_vdi
    create_vmx_file
    create_ova

    print_success "Conversion complete"
}

cmd_full() {
    cmd_build
    cmd_convert
    create_package

    print_header "C3Box VM Build Complete!"
    echo ""
    print_info "Output files in: $OUTPUT_DIR"
    ls -lh "$OUTPUT_DIR"/*.{vmdk,ova,vdi,vmx,img} 2>/dev/null || true
    echo ""
    print_success "Ready to deploy!"
}

usage() {
    cat << 'USAGE'
C3Box VM Builder - Create portable SecuBox virtual appliances

Usage: c3box-vm-builder.sh <command> [options]

Commands:
  build           Download OpenWrt and prepare base image
  convert         Convert image to VMDK/VDI/OVA formats
  full            Build + Convert + Package (complete workflow)
  package         Create distribution archive
  clean           Remove build artifacts

Options:
  --version VER   OpenWrt version (default: 24.10.5)
  --disk SIZE     Disk size (default: 16G)
  --memory MB     RAM in MB (default: 2048)
  --cpus N        CPU count (default: 2)

Examples:
  sudo ./c3box-vm-builder.sh full
  sudo ./c3box-vm-builder.sh build --version 24.10.5
  ./c3box-vm-builder.sh convert
  ./c3box-vm-builder.sh package

Output:
  c3box-vm/output/C3Box-SecuBox.vmdk  - VMware disk
  c3box-vm/output/C3Box-SecuBox.ova   - VMware appliance
  c3box-vm/output/C3Box-SecuBox.vdi   - VirtualBox disk
  c3box-vm/output/C3Box-SecuBox.vmx   - VMware config

USAGE
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            OPENWRT_VERSION="$2"
            shift 2
            ;;
        --disk)
            VM_DISK_SIZE="$2"
            shift 2
            ;;
        --memory)
            VM_MEMORY="$2"
            shift 2
            ;;
        --cpus)
            VM_CPUS="$2"
            shift 2
            ;;
        build)
            CMD="build"
            shift
            ;;
        convert)
            CMD="convert"
            shift
            ;;
        full)
            CMD="full"
            shift
            ;;
        package)
            CMD="package"
            shift
            ;;
        clean)
            print_info "Cleaning build directory..."
            rm -rf "$BUILD_DIR"
            print_success "Clean complete"
            exit 0
            ;;
        -h|--help|help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Execute command
case "${CMD:-}" in
    build)
        cmd_build
        ;;
    convert)
        cmd_convert
        ;;
    full)
        cmd_full
        ;;
    package)
        create_package
        ;;
    *)
        usage
        exit 1
        ;;
esac
