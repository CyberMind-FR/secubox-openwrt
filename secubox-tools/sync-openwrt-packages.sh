#!/usr/bin/env bash
#
# Copies the freshly built packages from the OpenWrt build tree
# into the firmware release directory so they are included alongside the other
# SecuBox packages (mirrors what the GitHub Actions jobs expect).

set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
ARCH_NAME="${ARCH_NAME:-aarch64_cortex-a72}"
OPENWRT_BIN_DIR="${OPENWRT_BIN_DIR:-$REPO_ROOT/secubox-tools/openwrt/bin/packages/$ARCH_NAME}"
FIRMWARE_DIR="${FIRMWARE_DIR:-$REPO_ROOT/secubox-tools/build/firmware/mochabin/packages}"

mkdir -p "$FIRMWARE_DIR"

declare -a COPIED_FILES=()

copy_package() {
    local pattern="$1"
    local label="$2"
    local src
    # Search recursively in OPENWRT_BIN_DIR (packages are in base/, packages/ subdirs)
    src=$(find "$OPENWRT_BIN_DIR" -name "$pattern" -print -quit 2>/dev/null || true)

    if [[ -z "$src" ]]; then
        echo "⚠️  $label not found in $OPENWRT_BIN_DIR"
        return 0
    fi

    local dest="$FIRMWARE_DIR/$(basename "$src")"
    cp -f "$src" "$dest"
    COPIED_FILES+=("$dest")
    echo "✅ Copied $label → $dest"
}

update_checksums() {
    local sha_file="$FIRMWARE_DIR/SHA256SUMS"
    local tmp
    tmp=$(mktemp)
    if [[ -f "$sha_file" ]]; then
        # Remove old entries for packages we're updating
        grep -v -E 'netifyd_|crowdsec|ndpid_|nodogsplash_|secubox-' "$sha_file" > "$tmp" || true
    fi
    for pkg in "${COPIED_FILES[@]}"; do
        (cd "$(dirname "$pkg")" && sha256sum "$(basename "$pkg")") >> "$tmp"
    done
    sort -u "$tmp" > "$sha_file"
    rm -f "$tmp"
}

echo "📦 Syncing OpenWrt packages for $ARCH_NAME..."
echo ""

# DPI Engines
copy_package 'netifyd_*.ipk' "Netifyd DPI engine"
copy_package 'ndpid_*.ipk' "nDPId DPI engine"

# Security
copy_package 'crowdsec_*.ipk' "CrowdSec core"
copy_package 'crowdsec-firewall-bouncer_*.ipk' "CrowdSec firewall bouncer"

# Captive Portal
copy_package 'secubox-app-nodogsplash_*.ipk' "Nodogsplash captive portal"

# SecuBox Core packages
copy_package 'secubox-core_*.ipk' "SecuBox Core"
copy_package 'secubox-app_*.ipk' "SecuBox App"

# LuCI apps
copy_package 'luci-app-secubox_*.ipk' "LuCI SecuBox"
copy_package 'luci-app-secubox-admin_*.ipk' "LuCI SecuBox Admin"
copy_package 'luci-app-secubox-netifyd_*.ipk' "LuCI Netifyd Dashboard"
copy_package 'luci-app-ndpid_*.ipk' "LuCI nDPId Dashboard"
copy_package 'luci-theme-secubox_*.ipk' "LuCI SecuBox Theme"

echo ""
if [[ ${#COPIED_FILES[@]} -gt 0 ]]; then
    update_checksums
    echo "📦 Firmware packages directory ($FIRMWARE_DIR):"
    ls -1 "$FIRMWARE_DIR"/*.ipk 2>/dev/null | xargs -n1 basename | sort
    echo ""
    echo "✅ Synced ${#COPIED_FILES[@]} packages"
else
    echo "⚠️  No packages copied"
fi
