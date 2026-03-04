#!/bin/bash
# SecuBox SBOM Prerequisites Checker
# Validates build environment for SBOM generation
# Part of CRA Annex I compliance pipeline

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOPDIR="${TOPDIR:-${SCRIPT_DIR}/..}"

# Auto-detect SDK location if not in buildroot
if [[ ! -f "${TOPDIR}/include/version.mk" ]]; then
    if [[ -f "${TOPDIR}/secubox-tools/sdk/include/version.mk" ]]; then
        TOPDIR="${TOPDIR}/secubox-tools/sdk"
    elif [[ -f "${TOPDIR}/secubox-tools/openwrt/include/version.mk" ]]; then
        TOPDIR="${TOPDIR}/secubox-tools/openwrt"
    fi
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_ok() { echo -e "${GREEN}[✓]${NC} $*"; }
log_info() { echo -e "    $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_fail() { echo -e "${RED}[✗]${NC} $*"; }

ERRORS=0

check_openwrt_version() {
    local version_mk="${TOPDIR}/include/version.mk"

    if [[ ! -f "$version_mk" ]]; then
        log_fail "OpenWrt version.mk not found: $version_mk"
        echo "    → Ensure you're running from OpenWrt buildroot directory"
        ((ERRORS++))
        return
    fi

    local version_id
    # Try multiple patterns to extract version number
    version_id=$(grep -E '^VERSION_NUMBER\s*[:?]?=' "$version_mk" 2>/dev/null | head -1 | sed 's/.*=\s*//' | tr -d ' ')

    # If it contains Makefile variables, try to extract the fallback value
    if [[ "$version_id" == *'$('* ]]; then
        # Extract version from patterns like $(if...,VERSION,FALLBACK) or direct number
        version_id=$(echo "$version_id" | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 || echo "")
    fi

    # Fallback: check for VERSION_CODE or similar
    if [[ -z "$version_id" ]]; then
        version_id=$(grep -E '^VERSION_CODE\s*[:?]?=' "$version_mk" 2>/dev/null | head -1 | sed 's/.*=\s*//' | tr -d ' ')
    fi

    if [[ -z "$version_id" || ! "$version_id" =~ ^[0-9] ]]; then
        log_warn "Could not determine OpenWrt version from version.mk"
        log_info "Assuming OpenWrt >= 22.03 (SDK present)"
        return
    fi

    local major minor
    major=$(echo "$version_id" | cut -d'.' -f1)
    minor=$(echo "$version_id" | cut -d'.' -f2)

    # Handle non-numeric gracefully
    [[ ! "$major" =~ ^[0-9]+$ ]] && { log_warn "Non-numeric version: $version_id"; return; }
    [[ ! "$minor" =~ ^[0-9]+$ ]] && minor=0

    if [[ "$major" -lt 22 ]] || { [[ "$major" -eq 22 ]] && [[ "$minor" -lt 3 ]]; }; then
        log_fail "OpenWrt version $version_id < 22.03 (SBOM support requires 22.03+)"
        echo "    → Upgrade to OpenWrt 22.03 or later for CONFIG_JSON_CYCLONEDX_SBOM support"
        ((ERRORS++))
    else
        log_ok "OpenWrt version: $version_id (>= 22.03)"
    fi
}

check_package_metadata() {
    local metadata_pl="${TOPDIR}/scripts/package-metadata.pl"

    if [[ -f "$metadata_pl" ]]; then
        log_ok "package-metadata.pl found"

        if grep -q "cyclonedx" "$metadata_pl" 2>/dev/null; then
            log_ok "package-metadata.pl has CycloneDX support"
        else
            log_warn "package-metadata.pl may not have CycloneDX support (older version?)"
        fi
    else
        log_fail "package-metadata.pl not found: $metadata_pl"
        echo "    → This script is required for native OpenWrt SBOM generation"
        ((ERRORS++))
    fi
}

check_perl() {
    local staging_perl="${TOPDIR}/staging_dir/host/bin/perl"

    if [[ -x "$staging_perl" ]]; then
        log_ok "Perl found in staging_dir: $staging_perl"
    elif command -v perl &>/dev/null; then
        log_ok "System Perl found: $(command -v perl)"
    else
        log_fail "Perl not found"
        echo "    → Install perl: apt install perl (Debian/Ubuntu)"
        ((ERRORS++))
    fi
}

check_host_tools() {
    local tools=("jq" "sha256sum" "git")

    for tool in "${tools[@]}"; do
        if command -v "$tool" &>/dev/null; then
            log_ok "$tool found: $(command -v "$tool")"
        else
            log_fail "$tool not found"
            echo "    → Install: apt install $tool (Debian/Ubuntu)"
            ((ERRORS++))
        fi
    done
}

check_sbom_tools() {
    local optional_tools=("syft" "grype" "cyclonedx-cli")

    echo ""
    echo "=== Optional SBOM Tools ==="

    for tool in "${optional_tools[@]}"; do
        if command -v "$tool" &>/dev/null; then
            local version
            case "$tool" in
                syft) version=$("$tool" version 2>/dev/null | head -1 || echo "unknown") ;;
                grype) version=$("$tool" version 2>/dev/null | head -1 || echo "unknown") ;;
                cyclonedx-cli) version=$("$tool" --version 2>/dev/null | head -1 || echo "unknown") ;;
                *) version="unknown" ;;
            esac
            log_ok "$tool found: $version"
        else
            log_warn "$tool not found (will be installed by sbom-generate.sh)"
            echo "    → Manual install: see https://github.com/anchore/$tool"
        fi
    done
}

check_kconfig() {
    local config="${TOPDIR}/.config"

    echo ""
    echo "=== Kconfig SBOM Options ==="

    if [[ ! -f "$config" ]]; then
        log_warn ".config not found - run 'make menuconfig' first"
        return
    fi

    if grep -q "^CONFIG_JSON_CYCLONEDX_SBOM=y" "$config" 2>/dev/null; then
        log_ok "CONFIG_JSON_CYCLONEDX_SBOM=y is set"
    else
        log_warn "CONFIG_JSON_CYCLONEDX_SBOM not enabled"
        echo "    → Add to .config: CONFIG_JSON_CYCLONEDX_SBOM=y"
        echo "    → Or run: echo 'CONFIG_JSON_CYCLONEDX_SBOM=y' >> .config && make defconfig"
    fi
}

main() {
    echo "=========================================="
    echo "SecuBox SBOM Prerequisites Check"
    echo "CRA Annex I Compliance Pipeline"
    echo "=========================================="
    echo ""

    echo "=== Core Requirements ==="
    check_openwrt_version
    check_package_metadata
    check_perl
    check_host_tools

    check_sbom_tools
    check_kconfig

    echo ""
    echo "=========================================="
    if [[ $ERRORS -gt 0 ]]; then
        log_fail "$ERRORS critical prerequisite(s) missing"
        echo "Fix the issues above before running SBOM generation."
        exit 1
    else
        log_ok "All prerequisites satisfied"
        exit 0
    fi
}

main "$@"
