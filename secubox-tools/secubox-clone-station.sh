#!/bin/bash
#
# secubox-clone-station.sh - Host-side SecuBox Station Cloner
#
# Orchestrates cloning of SecuBox devices via dual USB serial:
#   - Master device: Extract config, build clone image, generate join token
#   - Target device: Enter U-Boot, flash image, auto-join mesh
#
# Dependencies:
#   - MOKATOOL (mochabin_tool.py) for serial console automation
#   - secubox-image.sh for ASU API firmware building
#   - TFTP server (dnsmasq or tftpd-hpa)
#
# Usage:
#   ./secubox-clone-station.sh detect               # Detect serial devices
#   ./secubox-clone-station.sh pull [--master DEV]  # Pull image from master
#   ./secubox-clone-station.sh flash [--target DEV] # Flash image to target
#   ./secubox-clone-station.sh clone                # Full workflow
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SECUBOX_ROOT="$(dirname "$SCRIPT_DIR")"

# MOKATOOL location
MOKATOOL_DIR="${MOKATOOL_DIR:-/home/reepost/DEVEL/MOKATOOL}"
MOKATOOL="$MOKATOOL_DIR/mochabin_tool.py"

# Clone station directories
CLONE_DIR="$SCRIPT_DIR/clone-station"
CLONE_IMAGES="$CLONE_DIR/images"
CLONE_LOGS="$CLONE_DIR/logs"
TFTP_ROOT="${TFTP_ROOT:-/srv/tftp}"

# Defaults
BAUDRATE=115200
DEFAULT_MASTER=""
DEFAULT_TARGET=""
MASTER_DEV=""
TARGET_DEV=""
OPENWRT_VERSION="24.10.5"
CLONE_TOKEN=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()  { echo -e "${CYAN}[STEP]${NC} $*"; }

# =============================================================================
# Helpers
# =============================================================================

check_deps() {
    local missing=0

    # Check MOKATOOL
    if [[ ! -x "$MOKATOOL" ]]; then
        log_error "MOKATOOL not found: $MOKATOOL"
        log_info "Set MOKATOOL_DIR environment variable or install from ~/DEVEL/MOKATOOL"
        missing=1
    fi

    # Check Python dependencies
    if ! python3 -c "import serial, pexpect, rich, typer" 2>/dev/null; then
        log_warn "Missing Python deps. Install: pip install 'typer[all]' pyserial pexpect rich pyyaml"
    fi

    # Check TFTP directory
    if [[ ! -d "$TFTP_ROOT" ]]; then
        log_warn "TFTP root not found: $TFTP_ROOT"
        log_info "Create with: sudo mkdir -p $TFTP_ROOT && sudo chmod 777 $TFTP_ROOT"
    fi

    return $missing
}

mokatool() {
    python3 "$MOKATOOL" "$@"
}

# Create directory structure
init_dirs() {
    mkdir -p "$CLONE_IMAGES"
    mkdir -p "$CLONE_LOGS"
    mkdir -p "$TFTP_ROOT" 2>/dev/null || true
}

# Get timestamp for logging
get_tag() {
    date +%Y%m%d-%H%M%S
}

# =============================================================================
# Device Detection
# =============================================================================

detect_devices() {
    log_step "Detecting USB serial devices..."

    local found_master=""
    local found_target=""

    # Use MOKATOOL to list ports
    mokatool list-ports 2>/dev/null || true
    echo ""

    # Scan each USB serial device
    for dev in /dev/ttyUSB* /dev/ttyACM*; do
        [[ -c "$dev" ]] || continue

        log_info "Probing $dev..."

        # Try to detect device type by sending CR and checking response
        local response=""
        response=$(timeout 3 python3 -c "
import serial
import time
try:
    ser = serial.Serial('$dev', $BAUDRATE, timeout=1)
    time.sleep(0.2)
    ser.write(b'\\r\\n')
    time.sleep(0.5)
    data = ser.read(1000).decode('utf-8', errors='ignore')
    print(data)
    ser.close()
except Exception as e:
    print(f'ERROR: {e}')
" 2>/dev/null || echo "")

        if echo "$response" | grep -qiE "(SecuBox|OpenWrt|root@|BusyBox)"; then
            log_info "  → ${GREEN}MASTER${NC}: $dev (SecuBox/OpenWrt running)"
            found_master="$dev"
            MASTER_DEV="$dev"
        elif echo "$response" | grep -qiE "(U-Boot|=>|Marvell|Hit any key)"; then
            log_info "  → ${YELLOW}TARGET${NC}: $dev (U-Boot prompt detected)"
            found_target="$dev"
            TARGET_DEV="$dev"
        elif echo "$response" | grep -qiE "login:"; then
            log_info "  → ${GREEN}MASTER${NC}: $dev (Linux login prompt)"
            found_master="$dev"
            MASTER_DEV="$dev"
        else
            log_info "  → Unknown/no response"
        fi
    done

    echo ""
    echo -e "${BOLD}Detection Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [[ -n "$MASTER_DEV" ]]; then
        echo -e "  Master: ${GREEN}$MASTER_DEV${NC}"
    else
        echo -e "  Master: ${RED}Not found${NC}"
    fi
    if [[ -n "$TARGET_DEV" ]]; then
        echo -e "  Target: ${GREEN}$TARGET_DEV${NC}"
    else
        echo -e "  Target: ${YELLOW}Not found (or not at U-Boot)${NC}"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Save to state file
    cat > "$CLONE_DIR/.detected" <<EOF
MASTER_DEV="$MASTER_DEV"
TARGET_DEV="$TARGET_DEV"
DETECTED_AT="$(date -Iseconds)"
EOF
}

load_detected() {
    if [[ -f "$CLONE_DIR/.detected" ]]; then
        source "$CLONE_DIR/.detected"
    fi
}

# =============================================================================
# Master Operations
# =============================================================================

get_master_info() {
    local master="${1:-$MASTER_DEV}"
    [[ -z "$master" ]] && { log_error "No master device"; return 1; }

    log_step "Getting master device info..."

    # Use Python to send commands and get output
    python3 -c "
import serial
import time
import sys

dev = '$master'
try:
    ser = serial.Serial(dev, $BAUDRATE, timeout=2)
    time.sleep(0.2)

    # Get board info
    ser.write(b'cat /tmp/sysinfo/board_name 2>/dev/null || echo unknown\\n')
    time.sleep(0.3)
    board = ser.read(500).decode('utf-8', errors='ignore').strip().split('\\n')[-1]

    # Get SecuBox version
    ser.write(b'secubox --version 2>/dev/null || echo unknown\\n')
    time.sleep(0.3)
    version = ser.read(500).decode('utf-8', errors='ignore').strip().split('\\n')[-1]

    # Get device ID
    ser.write(b'uci -q get secubox.main.device_id 2>/dev/null || echo unknown\\n')
    time.sleep(0.3)
    device_id = ser.read(500).decode('utf-8', errors='ignore').strip().split('\\n')[-1]

    # Get LAN IP
    ser.write(b'uci -q get network.lan.ipaddr 2>/dev/null || echo 192.168.1.1\\n')
    time.sleep(0.3)
    lan_ip = ser.read(500).decode('utf-8', errors='ignore').strip().split('\\n')[-1]

    ser.close()

    print(f'Board: {board}')
    print(f'SecuBox: {version}')
    print(f'Device ID: {device_id}')
    print(f'LAN IP: {lan_ip}')
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1
}

generate_clone_token() {
    local master="${1:-$MASTER_DEV}"
    [[ -z "$master" ]] && { log_error "No master device"; return 1; }

    log_step "Generating clone token on master..."

    # Send command to generate token
    CLONE_TOKEN=$(python3 -c "
import serial
import time
import sys

dev = '$master'
try:
    ser = serial.Serial(dev, $BAUDRATE, timeout=5)
    time.sleep(0.2)

    # Generate auto-approve clone token (valid 24h)
    ser.write(b'secubox-cloner token --auto-approve 2>/dev/null || /usr/lib/secubox/master-link.sh generate-token 86400 clone\\n')
    time.sleep(1)
    output = ser.read(2000).decode('utf-8', errors='ignore')

    # Extract token (should be a hex string)
    for line in output.strip().split('\\n'):
        line = line.strip()
        if len(line) == 64 and all(c in '0123456789abcdef' for c in line):
            print(line)
            break

    ser.close()
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1)

    if [[ -n "$CLONE_TOKEN" && ${#CLONE_TOKEN} -eq 64 ]]; then
        log_info "Clone token: ${CLONE_TOKEN:0:16}...${CLONE_TOKEN: -8}"
        echo "$CLONE_TOKEN" > "$CLONE_DIR/.clone_token"
        return 0
    else
        log_warn "Could not generate clone token on master"
        log_info "Token will need to be generated manually or clone will request approval"
        return 1
    fi
}

# =============================================================================
# Image Building
# =============================================================================

build_clone_image() {
    local device="${1:-mochabin}"

    log_step "Building clone image for $device via ASU API..."

    # Use existing secubox-image.sh
    local image_script="$SCRIPT_DIR/secubox-image.sh"
    if [[ ! -x "$image_script" ]]; then
        log_error "secubox-image.sh not found: $image_script"
        return 1
    fi

    # Build with ext4 (needed for resize)
    mkdir -p "$CLONE_IMAGES"

    local image_file
    image_file=$("$image_script" --output "$CLONE_IMAGES" build "$device") || {
        log_error "Image build failed"
        return 1
    }

    log_info "Clone image built: $image_file"
    echo "$image_file"
}

inject_clone_config() {
    local image="$1"
    local master_ip="$2"
    local token="${3:-}"

    log_step "Injecting clone configuration into image..."

    # This would require mounting the image and modifying it
    # For now, we'll create a companion script that gets downloaded at first boot

    local clone_script="$CLONE_DIR/clone-provision.sh"
    cat > "$clone_script" <<CLONESCRIPT
#!/bin/sh
# SecuBox Clone Auto-Provision Script
# Downloaded and executed at first boot

MASTER_IP="$master_ip"
CLONE_TOKEN="$token"

log() { logger -t secubox-clone "\$*"; echo "\$*"; }

log "SecuBox clone provisioning starting..."
log "Master: \$MASTER_IP"

# Step 1: Resize root partition
log "Resizing root partition..."
ROOT_DEV=\$(awk '\$2=="/" {print \$1}' /proc/mounts)
if [ -n "\$ROOT_DEV" ]; then
    DISK=\$(echo "\$ROOT_DEV" | sed 's/p\\?[0-9]*\$//')
    [ "\$DISK" = "\$ROOT_DEV" ] && DISK=\$(echo "\$ROOT_DEV" | sed 's/[0-9]*\$//')
    PART_NUM=\$(echo "\$ROOT_DEV" | grep -o '[0-9]*\$')
    if command -v parted >/dev/null 2>&1; then
        parted -s "\$DISK" resizepart "\$PART_NUM" 100% 2>/dev/null || true
        resize2fs "\$ROOT_DEV" 2>/dev/null || true
        log "Root resized: \$(df -h / | tail -1 | awk '{print \$2}')"
    fi
fi

# Step 2: Configure as mesh slave
log "Configuring as mesh peer..."
uci set master-link.main=master-link
uci set master-link.main.role='peer'
uci set master-link.main.upstream="\$MASTER_IP"
uci commit master-link

# Step 3: Join mesh
if [ -n "\$CLONE_TOKEN" ]; then
    log "Joining mesh with pre-approved token..."
    /usr/lib/secubox/master-link.sh join "\$MASTER_IP" "\$CLONE_TOKEN" 2>/dev/null || {
        log "Join with token failed, requesting approval..."
        /usr/lib/secubox/master-link.sh request_join "\$MASTER_IP" 2>/dev/null || true
    }
else
    log "Requesting mesh join (manual approval required)..."
    /usr/lib/secubox/master-link.sh request_join "\$MASTER_IP" 2>/dev/null || true
fi

log "Clone provisioning complete"
CLONESCRIPT

    chmod +x "$clone_script"
    log_info "Clone provision script: $clone_script"

    # Copy to TFTP for first-boot download
    if [[ -d "$TFTP_ROOT" ]]; then
        cp "$clone_script" "$TFTP_ROOT/clone-provision.sh"
        log_info "Script available via TFTP: clone-provision.sh"
    fi
}

# =============================================================================
# Pull from Master
# =============================================================================

cmd_pull() {
    local master="${MASTER_DEV:-}"

    # Parse args
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --master) master="$2"; shift 2 ;;
            *) shift ;;
        esac
    done

    load_detected
    [[ -z "$master" ]] && master="$MASTER_DEV"
    [[ -z "$master" ]] && { log_error "No master device. Run: $0 detect"; return 1; }

    init_dirs
    local tag=$(get_tag)

    echo -e "${BOLD}SecuBox Clone Station - Pull from Master${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Master: $master"
    echo "Tag: $tag"
    echo ""

    # Get master info
    get_master_info "$master"
    echo ""

    # Detect device type from master
    local board_name
    board_name=$(python3 -c "
import serial
import time
ser = serial.Serial('$master', $BAUDRATE, timeout=2)
time.sleep(0.2)
ser.write(b'cat /tmp/sysinfo/board_name 2>/dev/null\\n')
time.sleep(0.3)
output = ser.read(500).decode('utf-8', errors='ignore')
for line in output.strip().split('\\n'):
    if 'mochabin' in line.lower() or 'espressobin' in line.lower() or 'x86' in line.lower():
        print(line.strip())
        break
ser.close()
" 2>/dev/null || echo "")

    local device_type="mochabin"  # default
    case "$board_name" in
        *mochabin*|*MOCHAbin*) device_type="mochabin" ;;
        *espressobin*ultra*) device_type="espressobin-ultra" ;;
        *espressobin*) device_type="espressobin-v7" ;;
        *x86*|*generic*) device_type="x86-64" ;;
    esac

    log_info "Detected device type: $device_type"

    # Get master LAN IP
    local master_ip
    master_ip=$(python3 -c "
import serial
import time
ser = serial.Serial('$master', $BAUDRATE, timeout=2)
time.sleep(0.2)
ser.write(b'uci -q get network.lan.ipaddr\\n')
time.sleep(0.3)
output = ser.read(500).decode('utf-8', errors='ignore')
for line in output.strip().split('\\n'):
    if '.' in line and not line.startswith('uci'):
        print(line.strip())
        break
ser.close()
" 2>/dev/null || echo "192.168.255.1")

    log_info "Master LAN IP: $master_ip"

    # Generate clone token
    generate_clone_token "$master" || true

    # Build clone image
    log_step "Building clone image for $device_type..."
    local image_file
    image_file=$(build_clone_image "$device_type") || {
        log_error "Failed to build clone image"
        return 1
    }

    # Inject clone config
    local token=""
    [[ -f "$CLONE_DIR/.clone_token" ]] && token=$(cat "$CLONE_DIR/.clone_token")
    inject_clone_config "$image_file" "$master_ip" "$token"

    # Copy image to TFTP
    if [[ -d "$TFTP_ROOT" ]]; then
        log_step "Copying image to TFTP root..."

        # Decompress if gzipped
        local tftp_image="$TFTP_ROOT/secubox-clone.img"
        if [[ "$image_file" == *.gz ]]; then
            gunzip -c "$image_file" > "$tftp_image"
        else
            cp "$image_file" "$tftp_image"
        fi

        log_info "TFTP image ready: $tftp_image"
        log_info "Size: $(du -h "$tftp_image" | awk '{print $1}')"
    fi

    # Generate U-Boot commands for target
    local host_ip
    host_ip=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' | head -1)
    [[ -z "$host_ip" ]] && host_ip=$(hostname -I | awk '{print $1}')

    echo ""
    echo -e "${BOLD}Clone Image Ready${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Image: $image_file"
    echo "TFTP:  $TFTP_ROOT/secubox-clone.img"
    echo ""
    echo -e "${BOLD}To flash target in U-Boot:${NC}"
    echo "  setenv serverip $host_ip"
    echo "  setenv ipaddr 192.168.1.100"
    echo "  dhcp"
    echo "  tftpboot 0x20000000 secubox-clone.img"
    echo "  mmc dev 0"
    echo '  mmc write 0x20000000 0 ${filesize}'
    echo "  reset"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Save state
    cat > "$CLONE_DIR/.pull_state" <<EOF
IMAGE_FILE="$image_file"
TFTP_IMAGE="$TFTP_ROOT/secubox-clone.img"
MASTER_IP="$master_ip"
CLONE_TOKEN="$token"
HOST_IP="$host_ip"
DEVICE_TYPE="$device_type"
PULL_TAG="$tag"
EOF
}

# =============================================================================
# Flash Target
# =============================================================================

cmd_flash() {
    local target="${TARGET_DEV:-}"
    local image=""

    # Parse args
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --target) target="$2"; shift 2 ;;
            --image) image="$2"; shift 2 ;;
            *) shift ;;
        esac
    done

    load_detected
    [[ -z "$target" ]] && target="$TARGET_DEV"
    [[ -z "$target" ]] && { log_error "No target device. Run: $0 detect"; return 1; }

    # Load pull state
    if [[ -f "$CLONE_DIR/.pull_state" ]]; then
        source "$CLONE_DIR/.pull_state"
        [[ -z "$image" ]] && image="$TFTP_IMAGE"
    fi

    [[ -z "$image" || ! -f "$image" ]] && {
        log_error "No clone image. Run: $0 pull first"
        return 1
    }

    # Get host IP
    local host_ip="${HOST_IP:-}"
    [[ -z "$host_ip" ]] && host_ip=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' | head -1)
    [[ -z "$host_ip" ]] && host_ip=$(hostname -I | awk '{print $1}')

    local tag=$(get_tag)

    echo -e "${BOLD}SecuBox Clone Station - Flash Target${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Target: $target"
    echo "Image:  $image"
    echo "Host:   $host_ip"
    echo ""

    log_step "Entering U-Boot on target..."

    # Use MOKATOOL to break into U-Boot and flash
    mokatool break --port "$target" --baud "$BAUDRATE" || {
        log_warn "Could not auto-break into U-Boot"
        log_info "Ensure target is at U-Boot prompt or reset it"
    }

    log_step "Sending flash commands via MOKATOOL..."

    # Create a temporary macro file for flashing
    local macro_file="$CLONE_DIR/flash-clone.yaml"
    cat > "$macro_file" <<MACRO
macros:
  flash-clone:
    desc: "Flash SecuBox clone image via TFTP"
    steps:
      - send: "setenv serverip $host_ip"
        expect: "(=>|U-Boot>)"
      - send: "setenv ipaddr 192.168.1.100"
        expect: "(=>|U-Boot>)"
      - send: "dhcp"
        expect: "(=>|U-Boot>)"
        timeout: 30
      - send: "tftpboot 0x20000000 secubox-clone.img"
        expect: "(=>|U-Boot>)"
        timeout: 120
      - send: "mmc dev 0"
        expect: "(=>|U-Boot>)"
      - send: 'mmc write 0x20000000 0 \${filesize}'
        expect: "(=>|U-Boot>)"
        timeout: 300
      - send: "echo Flash complete, resetting..."
        expect: "(=>|U-Boot>)"
      - pause: 2
      - send: "reset"
MACRO

    mokatool macro --file "$macro_file" --name flash-clone --port "$target" \
        --baud "$BAUDRATE" --no-break-first 2>&1 | tee "$CLONE_LOGS/flash-$tag.log" || {
        log_warn "Flash may have failed or timed out"
        log_info "Check logs: $CLONE_LOGS/flash-$tag.log"
    }

    echo ""
    log_info "Flash commands sent. Target should be rebooting..."
    log_info "Monitor progress: mokatool console --port $target"

    # Save state
    cat > "$CLONE_DIR/.flash_state" <<EOF
TARGET_DEV="$target"
FLASH_TAG="$tag"
FLASH_TIME="$(date -Iseconds)"
EOF
}

# =============================================================================
# Verify Clone
# =============================================================================

cmd_verify() {
    load_detected

    local master="${MASTER_DEV:-}"
    local target="${TARGET_DEV:-}"

    # Parse args
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --master) master="$2"; shift 2 ;;
            --target) target="$2"; shift 2 ;;
            *) shift ;;
        esac
    done

    echo -e "${BOLD}SecuBox Clone Station - Verify${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ -n "$target" && -c "$target" ]]; then
        log_step "Checking target status..."

        # Wait for Linux boot
        log_info "Waiting for target to boot (up to 120s)..."
        local i=0
        while [ $i -lt 120 ]; do
            local response
            response=$(timeout 3 python3 -c "
import serial
import time
try:
    ser = serial.Serial('$target', $BAUDRATE, timeout=1)
    time.sleep(0.2)
    ser.write(b'\\n')
    time.sleep(0.5)
    print(ser.read(500).decode('utf-8', errors='ignore'))
    ser.close()
except: pass
" 2>/dev/null || echo "")

            if echo "$response" | grep -qE "(root@|login:)"; then
                log_info "Target booted!"
                break
            fi

            sleep 2
            i=$((i + 2))
            printf "\r  Waiting... %ds   " "$i"
        done
        echo ""

        # Check mesh status on target
        log_step "Checking target mesh status..."
        python3 -c "
import serial
import time
ser = serial.Serial('$target', $BAUDRATE, timeout=2)
time.sleep(0.2)
ser.write(b'secubox master-link status 2>/dev/null || echo \"master-link not ready\"\\n')
time.sleep(1)
print(ser.read(1000).decode('utf-8', errors='ignore'))
ser.close()
" 2>/dev/null || echo "Could not check target"
    fi

    if [[ -n "$master" && -c "$master" ]]; then
        log_step "Checking master for new peers..."

        python3 -c "
import serial
import time
ser = serial.Serial('$master', $BAUDRATE, timeout=2)
time.sleep(0.2)
ser.write(b'secubox master-link peers 2>/dev/null || echo \"No peers command\"\\n')
time.sleep(1)
print(ser.read(2000).decode('utf-8', errors='ignore'))
ser.close()
" 2>/dev/null || echo "Could not check master"
    fi
}

# =============================================================================
# Full Clone Workflow
# =============================================================================

cmd_clone() {
    local master=""
    local target=""

    # Parse args
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --master) master="$2"; shift 2 ;;
            --target) target="$2"; shift 2 ;;
            *) shift ;;
        esac
    done

    init_dirs

    echo -e "${BOLD}SecuBox Clone Station - Full Workflow${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Step 1: Detect devices
    if [[ -z "$master" || -z "$target" ]]; then
        log_step "Step 1/4: Detecting devices..."
        detect_devices
        load_detected

        [[ -z "$master" ]] && master="$MASTER_DEV"
        [[ -z "$target" ]] && target="$TARGET_DEV"
    else
        MASTER_DEV="$master"
        TARGET_DEV="$target"
    fi

    [[ -z "$master" ]] && { log_error "No master device found"; return 1; }
    [[ -z "$target" ]] && { log_error "No target device found"; return 1; }

    echo ""
    log_info "Master: $master"
    log_info "Target: $target"
    echo ""

    # Step 2: Pull from master
    log_step "Step 2/4: Pulling image from master..."
    cmd_pull --master "$master"

    echo ""
    read -p "Press Enter to flash target, or Ctrl+C to cancel..." _

    # Step 3: Flash target
    log_step "Step 3/4: Flashing target..."
    cmd_flash --target "$target"

    echo ""
    log_info "Waiting 60s for target to boot..."
    sleep 60

    # Step 4: Verify
    log_step "Step 4/4: Verifying clone..."
    cmd_verify --master "$master" --target "$target"

    echo ""
    echo -e "${BOLD}Clone Complete!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Master: $master"
    echo "Target: $target (now a mesh peer)"
    echo ""
    echo "Next steps:"
    echo "  - Monitor target: mokatool console --port $target"
    echo "  - Check mesh: ssh root@\$(target_ip) secubox master-link status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# =============================================================================
# MOKATOOL Helpers
# =============================================================================

cmd_console() {
    local device="${1:-}"
    load_detected

    [[ -z "$device" ]] && device="${MASTER_DEV:-${TARGET_DEV:-}}"
    [[ -z "$device" ]] && { log_error "No device specified"; return 1; }

    log_info "Connecting to $device..."
    mokatool console --port "$device" --baud "$BAUDRATE"
}

cmd_uboot() {
    local device="${1:-}"
    load_detected

    [[ -z "$device" ]] && device="${TARGET_DEV:-}"
    [[ -z "$device" ]] && { log_error "No device specified"; return 1; }

    log_info "Breaking into U-Boot on $device..."
    mokatool break --port "$device" --baud "$BAUDRATE"
}

cmd_env_backup() {
    local device="${1:-}"
    local output="${2:-$CLONE_DIR/uboot-env-$(get_tag).txt}"

    load_detected
    [[ -z "$device" ]] && device="${TARGET_DEV:-${MASTER_DEV:-}}"
    [[ -z "$device" ]] && { log_error "No device specified"; return 1; }

    log_step "Backing up U-Boot environment from $device..."

    # Break into U-Boot and dump env
    mokatool break --port "$device" --baud "$BAUDRATE" 2>/dev/null || true

    python3 -c "
import serial
import time
ser = serial.Serial('$device', $BAUDRATE, timeout=3)
time.sleep(0.2)
ser.write(b'printenv\\n')
time.sleep(2)
output = ser.read(10000).decode('utf-8', errors='ignore')
# Filter to actual env vars
for line in output.split('\\n'):
    if '=' in line and not line.startswith(' ') and not line.startswith('printenv'):
        print(line.strip())
ser.close()
" > "$output" 2>/dev/null

    log_info "U-Boot environment saved: $output"
}

# =============================================================================
# Usage
# =============================================================================

usage() {
    cat <<'EOF'
SecuBox Clone Station - Host-side Device Cloner

Usage: secubox-clone-station.sh <command> [options]

Commands:
  detect                    Detect USB serial devices (master/target)
  pull [--master DEV]       Pull clone image from master device
  flash [--target DEV]      Flash clone image to target via U-Boot
  verify                    Verify clone joined mesh
  clone                     Full workflow: detect → pull → flash → verify

  console [DEV]             Connect to serial console (via MOKATOOL)
  uboot [DEV]               Break into U-Boot prompt
  env-backup [DEV] [FILE]   Backup U-Boot environment

Options:
  --master DEV              Master device (e.g., /dev/ttyUSB0)
  --target DEV              Target device (e.g., /dev/ttyUSB1)
  --image FILE              Clone image file (for flash)

Environment:
  MOKATOOL_DIR              Path to MOKATOOL (default: ~/DEVEL/MOKATOOL)
  TFTP_ROOT                 TFTP root directory (default: /srv/tftp)

Examples:
  # Auto-detect devices
  ./secubox-clone-station.sh detect

  # Full clone workflow
  ./secubox-clone-station.sh clone

  # Manual workflow
  ./secubox-clone-station.sh pull --master /dev/ttyUSB0
  ./secubox-clone-station.sh flash --target /dev/ttyUSB1

  # Interactive console
  ./secubox-clone-station.sh console /dev/ttyUSB0

Requirements:
  - MOKATOOL (mochabin_tool.py) with pyserial, pexpect, rich, typer
  - TFTP server configured and running
  - Both devices connected via USB serial
EOF
}

# =============================================================================
# Main
# =============================================================================

check_deps || exit 1
init_dirs

case "${1:-}" in
    detect)
        detect_devices
        ;;
    pull)
        shift
        cmd_pull "$@"
        ;;
    flash)
        shift
        cmd_flash "$@"
        ;;
    verify)
        shift
        cmd_verify "$@"
        ;;
    clone)
        shift
        cmd_clone "$@"
        ;;
    console)
        shift
        cmd_console "$@"
        ;;
    uboot)
        shift
        cmd_uboot "$@"
        ;;
    env-backup|env-dump)
        shift
        cmd_env_backup "$@"
        ;;
    help|--help|-h|"")
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        usage >&2
        exit 1
        ;;
esac
