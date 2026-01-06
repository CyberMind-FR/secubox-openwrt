#!/usr/bin/env bash
#
# Copies the freshly built Netifyd and CrowdSec IPKs from the OpenWrt build tree
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
    src=$(find "$OPENWRT_BIN_DIR" -name "$pattern" -print -quit 2>/dev/null || true)

    if [[ -z "$src" ]]; then
        echo "⚠️  $label not found in $OPENWRT_BIN_DIR"
        return 1
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
        grep -v -E 'netifyd_.*\.ipk|crowdsec_.*\.ipk' "$sha_file" > "$tmp" || true
    fi
    for pkg in "${COPIED_FILES[@]}"; do
        sha256sum "$pkg" >> "$tmp"
    done
    mv "$tmp" "$sha_file"
}

copy_package 'netifyd_*.ipk' "netifyd DPI agent"
copy_package 'crowdsec_*.ipk' "CrowdSec core"

if [[ ${#COPIED_FILES[@]} -gt 0 ]]; then
    update_checksums
    echo "📦 Firmware directory now contains:"
    ls -1 "$FIRMWARE_DIR" | grep -E 'netifyd_|crowdsec_' || true
else
    echo "⚠️  No packages copied"
fi
