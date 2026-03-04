#!/bin/bash
# SecuBox SBOM Generation Pipeline
# Generates CycloneDX 1.6 + SPDX 2.3 for CRA Annex I compliance
# Covers: OpenWrt buildroot, SecuBox feed, rootfs, firmware image
#
# Copyright (C) 2026 CyberMind Produits SASU
# License: GPL-2.0-only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOPDIR="${SCRIPT_DIR}/.."

# Defaults
VERSION="${VERSION:-}"
ARCH="${ARCH:-aarch64_cortex-a53}"
OFFLINE="${OFFLINE:-false}"
NO_CVE="${NO_CVE:-false}"
OUTPUT_DIR="${OUTPUT_DIR:-${TOPDIR}/dist/sbom}"
ROOTFS_DIR="${ROOTFS_DIR:-${TOPDIR}/build_dir/target-${ARCH}_musl/root-mvebu}"
FIRMWARE_DIR="${FIRMWARE_DIR:-${TOPDIR}/bin/targets/mvebu/cortexa53}"
FEED_DIR="${FEED_DIR:-${TOPDIR}/feeds/secubox}"

# Tool paths (local install fallback)
LOCAL_BIN="${HOME}/.local/bin"
SYFT="${SYFT:-$(command -v syft 2>/dev/null || echo "${LOCAL_BIN}/syft")}"
GRYPE="${GRYPE:-$(command -v grype 2>/dev/null || echo "${LOCAL_BIN}/grype")}"
CYCLONEDX_CLI="${CYCLONEDX_CLI:-$(command -v cyclonedx-cli 2>/dev/null || echo "${LOCAL_BIN}/cyclonedx-cli")}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

usage() {
    cat <<EOF
SecuBox SBOM Generation Pipeline
CRA Annex I Compliance - CycloneDX 1.6 + SPDX 2.3

Usage: $0 [OPTIONS]

Options:
  --version VERSION    Firmware version (default: from ./version or git describe)
  --arch ARCH          Target architecture (default: aarch64_cortex-a53)
  --offline            Offline mode - no network access
  --no-cve             Skip CVE scan
  --output-dir DIR     Output directory (default: dist/sbom)
  --help               Show this help

Environment:
  SOURCE_DATE_EPOCH    Reproducible timestamp (auto-set from git)
  ROOTFS_DIR           Path to rootfs build directory
  FIRMWARE_DIR         Path to firmware output directory

Examples:
  $0                           # Auto-detect version, full pipeline
  $0 --version 0.20            # Explicit version
  $0 --offline --no-cve        # Offline mode, skip CVE
EOF
    exit 0
}

# Validate version string (security)
validate_version() {
    local ver="$1"
    # Strip 'v' prefix if present
    ver="${ver#v}"
    # Allow: X.Y, X.Y.Z, X.Y.Z-tag, X.Y.Z-tag-N-gHASH (git describe)
    if [[ ! "$ver" =~ ^[0-9]+\.[0-9]+([.-][a-zA-Z0-9_-]+)*$ ]]; then
        log_error "Invalid version format: $ver"
        log_error "Expected: X.Y or X.Y.Z or X.Y-tag or git describe format"
        exit 1
    fi
}

# Validate architecture (security)
validate_arch() {
    local arch="$1"
    local allowed="aarch64_cortex-a53|aarch64_cortex-a72|x86_64|arm_cortex-a9"
    if [[ ! "$arch" =~ ^($allowed)$ ]]; then
        log_error "Invalid architecture: $arch"
        log_error "Allowed: $allowed"
        exit 1
    fi
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --version) VERSION="$2"; shift 2 ;;
            --arch) ARCH="$2"; shift 2 ;;
            --offline) OFFLINE="true"; shift ;;
            --no-cve) NO_CVE="true"; shift ;;
            --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
            --help|-h) usage ;;
            *) log_error "Unknown option: $1"; usage ;;
        esac
    done
}

# 2.0 - Set reproducible timestamp
setup_reproducibility() {
    if [[ -z "${SOURCE_DATE_EPOCH:-}" ]]; then
        if [[ -d "${TOPDIR}/.git" ]]; then
            export SOURCE_DATE_EPOCH=$(git -C "$TOPDIR" log -1 --pretty=%ct 2>/dev/null || date +%s)
        else
            export SOURCE_DATE_EPOCH=$(date +%s)
        fi
    fi
    log_info "SOURCE_DATE_EPOCH: $SOURCE_DATE_EPOCH ($(date -d "@$SOURCE_DATE_EPOCH" -Iseconds 2>/dev/null || date -r "$SOURCE_DATE_EPOCH" -Iseconds))"
}

# 2.1 - Check and install tools
install_tool() {
    local tool="$1"
    local url="${2:-}"

    if [[ "$OFFLINE" == "true" ]]; then
        log_error "Tool $tool not found and --offline mode enabled"
        exit 1
    fi

    log_info "Installing $tool to ${LOCAL_BIN}..."
    mkdir -p "$LOCAL_BIN"

    local tmpdir
    tmpdir=$(mktemp -d)
    trap "rm -rf '$tmpdir'" EXIT

    case "$tool" in
        syft)
            curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b "$LOCAL_BIN"
            ;;
        grype)
            curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b "$LOCAL_BIN"
            ;;
        cyclonedx-cli)
            local arch_suffix="linux-x64"
            [[ "$(uname -m)" == "aarch64" ]] && arch_suffix="linux-arm64"
            curl -sSfL -o "${LOCAL_BIN}/cyclonedx-cli" \
                "https://github.com/CycloneDX/cyclonedx-cli/releases/latest/download/cyclonedx-${arch_suffix}"
            chmod +x "${LOCAL_BIN}/cyclonedx-cli"
            ;;
    esac

    trap - EXIT
    rm -rf "$tmpdir"
}

check_tools() {
    log_info "Checking required tools..."

    local required_tools=("jq" "sha256sum")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &>/dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done

    # Syft
    if [[ ! -x "$SYFT" ]] && ! command -v syft &>/dev/null; then
        install_tool syft
        SYFT="${LOCAL_BIN}/syft"
    fi
    log_ok "syft: $($SYFT version 2>/dev/null | head -1 || echo 'installed')"

    # Grype (optional for CVE scan)
    if [[ "$NO_CVE" != "true" ]]; then
        if [[ ! -x "$GRYPE" ]] && ! command -v grype &>/dev/null; then
            install_tool grype
            GRYPE="${LOCAL_BIN}/grype"
        fi
        log_ok "grype: $($GRYPE version 2>/dev/null | head -1 || echo 'installed')"
    fi

    # cyclonedx-cli
    if [[ ! -x "$CYCLONEDX_CLI" ]] && ! command -v cyclonedx-cli &>/dev/null; then
        install_tool cyclonedx-cli
        CYCLONEDX_CLI="${LOCAL_BIN}/cyclonedx-cli"
    fi
    log_ok "cyclonedx-cli: $($CYCLONEDX_CLI --version 2>/dev/null | head -1 || echo 'installed')"
}

# 2.2 - Cible A: Native OpenWrt SBOM from ipk
generate_sbom_native() {
    log_info "[A] Generating SBOM from OpenWrt native Packages.manifest..."

    local manifest="${TOPDIR}/bin/packages/${ARCH}/secubox/Packages.manifest"
    local native_cdx="${TOPDIR}/bin/packages/${ARCH}/secubox/Packages.cdx.json"

    if [[ -f "$native_cdx" ]]; then
        log_ok "Native CycloneDX found: $native_cdx"
        cp "$native_cdx" "${OUTPUT_DIR}/secubox-${VERSION}-native.cdx.json"
        return 0
    fi

    if [[ -f "$manifest" ]]; then
        log_warn "Packages.manifest found but no .cdx.json - ensure CONFIG_JSON_CYCLONEDX_SBOM=y"
        # Generate basic SBOM from manifest
        generate_sbom_from_manifest "$manifest" "${OUTPUT_DIR}/secubox-${VERSION}-native.cdx.json"
    else
        log_warn "No Packages.manifest found at $manifest"
    fi
}

# Generate SBOM from Packages.manifest
generate_sbom_from_manifest() {
    local manifest="$1"
    local output="$2"

    log_info "Parsing Packages.manifest..."

    local components="[]"
    local pkg_name="" pkg_version="" pkg_license=""

    while IFS= read -r line || [[ -n "$line" ]]; do
        case "$line" in
            Package:*)
                pkg_name="${line#Package: }"
                ;;
            Version:*)
                pkg_version="${line#Version: }"
                ;;
            License:*)
                pkg_license="${line#License: }"
                ;;
            "")
                if [[ -n "$pkg_name" && -n "$pkg_version" ]]; then
                    local component
                    component=$(jq -n \
                        --arg name "$pkg_name" \
                        --arg version "$pkg_version" \
                        --arg license "${pkg_license:-unknown}" \
                        '{
                            type: "library",
                            name: $name,
                            version: $version,
                            purl: "pkg:openwrt/\($name)@\($version)",
                            licenses: [{license: {id: $license}}]
                        }')
                    components=$(echo "$components" | jq --argjson c "$component" '. + [$c]')
                fi
                pkg_name="" pkg_version="" pkg_license=""
                ;;
        esac
    done < "$manifest"

    jq -n \
        --arg version "$VERSION" \
        --arg timestamp "$(date -d "@$SOURCE_DATE_EPOCH" -Iseconds 2>/dev/null || date -r "$SOURCE_DATE_EPOCH" -Iseconds)" \
        --argjson components "$components" \
        '{
            bomFormat: "CycloneDX",
            specVersion: "1.6",
            serialNumber: "urn:uuid:'$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)'",
            version: 1,
            metadata: {
                timestamp: $timestamp,
                component: {
                    type: "firmware",
                    name: "SecuBox-native",
                    version: $version
                }
            },
            components: $components
        }' > "$output"

    log_ok "Generated native SBOM: $output"
}

# 2.3 - Cible B: Feed SecuBox Makefiles
generate_sbom_feed() {
    log_info "[B] Generating SBOM from SecuBox feed Makefiles..."

    local components="[]"
    local warnings="${OUTPUT_DIR}/sbom-warnings.txt"
    > "$warnings"

    if [[ ! -d "$FEED_DIR" ]]; then
        log_warn "Feed directory not found: $FEED_DIR"
        return 0
    fi

    local count=0
    for makefile in "$FEED_DIR"/*/Makefile; do
        [[ -f "$makefile" ]] || continue

        local pkg_dir
        pkg_dir=$(dirname "$makefile")
        local pkg_name="" pkg_version="" pkg_source="" pkg_hash="" pkg_license=""

        # Extract variables from Makefile
        pkg_name=$(grep -E '^PKG_NAME\s*[:?]?=' "$makefile" 2>/dev/null | head -1 | sed 's/.*=\s*//' | tr -d ' ')
        pkg_version=$(grep -E '^PKG_VERSION\s*[:?]?=' "$makefile" 2>/dev/null | head -1 | sed 's/.*=\s*//' | tr -d ' ')
        pkg_source=$(grep -E '^PKG_SOURCE_URL\s*[:?]?=' "$makefile" 2>/dev/null | head -1 | sed 's/.*=\s*//')
        pkg_hash=$(grep -E '^PKG_HASH\s*[:?]?=' "$makefile" 2>/dev/null | head -1 | sed 's/.*=\s*//' | tr -d ' ')
        pkg_license=$(grep -E '^PKG_LICENSE\s*[:?]?=' "$makefile" 2>/dev/null | head -1 | sed 's/.*=\s*//' | tr -d ' ')

        # Fallback to directory name
        [[ -z "$pkg_name" ]] && pkg_name=$(basename "$pkg_dir")
        [[ -z "$pkg_version" ]] && pkg_version="0.0.0"

        # Warnings for missing metadata
        if [[ -z "$pkg_hash" || "$pkg_hash" == "skip" ]]; then
            echo "MISSING PKG_HASH: $pkg_name ($makefile)" >> "$warnings"
        fi
        if [[ -z "$pkg_license" ]]; then
            echo "MISSING PKG_LICENSE: $pkg_name ($makefile)" >> "$warnings"
        fi

        # Build component
        local component
        component=$(jq -n \
            --arg name "$pkg_name" \
            --arg version "$pkg_version" \
            --arg license "${pkg_license:-unknown}" \
            --arg source "${pkg_source:-}" \
            --arg hash "${pkg_hash:-}" \
            '{
                type: "library",
                name: $name,
                version: $version,
                purl: "pkg:openwrt/\($name)@\($version)",
                licenses: [{license: {id: $license}}],
                externalReferences: (if $source != "" then [{type: "distribution", url: $source}] else [] end),
                hashes: (if $hash != "" and $hash != "skip" then [{alg: "SHA-256", content: $hash}] else [] end)
            }')
        components=$(echo "$components" | jq --argjson c "$component" '. + [$c]')
        ((count++))
    done

    # Generate feed SBOM
    jq -n \
        --arg version "$VERSION" \
        --arg timestamp "$(date -d "@$SOURCE_DATE_EPOCH" -Iseconds 2>/dev/null || date -r "$SOURCE_DATE_EPOCH" -Iseconds)" \
        --argjson components "$components" \
        '{
            bomFormat: "CycloneDX",
            specVersion: "1.6",
            serialNumber: "urn:uuid:'$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)'",
            version: 1,
            metadata: {
                timestamp: $timestamp,
                component: {
                    type: "firmware",
                    name: "SecuBox-feed",
                    version: $version
                }
            },
            components: $components
        }' > "${OUTPUT_DIR}/secubox-${VERSION}-feed.cdx.json"

    log_ok "Feed SBOM: $count packages"

    if [[ -s "$warnings" ]]; then
        log_warn "Metadata warnings: $(wc -l < "$warnings") issues (see $warnings)"
    fi
}

# 2.4 - Cible C: Rootfs scan with Syft
generate_sbom_rootfs() {
    log_info "[C] Generating SBOM from rootfs with Syft..."

    if [[ ! -d "$ROOTFS_DIR" ]]; then
        log_warn "Rootfs directory not found: $ROOTFS_DIR"
        return 0
    fi

    "$SYFT" packages "dir:${ROOTFS_DIR}" \
        --source-name "SecuBox-rootfs" \
        --source-version "${VERSION}" \
        -o "cyclonedx-json=${OUTPUT_DIR}/secubox-${VERSION}-rootfs.cdx.json" \
        -o "spdx-json=${OUTPUT_DIR}/secubox-${VERSION}-rootfs.spdx.json"

    log_ok "Rootfs SBOM generated"
}

# 2.5 - Cible D: Firmware image scan
generate_sbom_firmware() {
    log_info "[D] Generating SBOM from firmware images..."

    if [[ ! -d "$FIRMWARE_DIR" ]]; then
        log_warn "Firmware directory not found: $FIRMWARE_DIR"
        return 0
    fi

    local found=0
    for fw in "$FIRMWARE_DIR"/secubox-*.bin "$FIRMWARE_DIR"/*.img.gz; do
        [[ -f "$fw" ]] || continue
        found=1

        local fw_name
        fw_name=$(basename "$fw")
        log_info "Scanning firmware: $fw_name"

        "$SYFT" packages "file:${fw}" \
            --source-name "SecuBox-firmware" \
            --source-version "${VERSION}" \
            -o "cyclonedx-json=${OUTPUT_DIR}/secubox-${VERSION}-firmware.cdx.json" || {
            log_warn "Syft failed on $fw_name (may be binary blob)"
        }
        break  # Only process first firmware
    done

    if [[ $found -eq 0 ]]; then
        log_warn "No firmware images found in $FIRMWARE_DIR"
    fi
}

# 2.6 - Merge SBOMs
merge_sboms() {
    log_info "Merging SBOMs from all sources..."

    local all_components="[]"
    local sbom_files=()

    # Collect all partial SBOMs
    for sbom in "${OUTPUT_DIR}"/secubox-${VERSION}-*.cdx.json; do
        [[ -f "$sbom" ]] || continue
        sbom_files+=("$sbom")
        local components
        components=$(jq '.components // []' "$sbom")
        all_components=$(echo "$all_components" | jq --argjson c "$components" '. + $c')
    done

    # Deduplicate by (name, version)
    local unique_components
    unique_components=$(echo "$all_components" | jq 'unique_by(.name + "@" + .version)')

    local component_count
    component_count=$(echo "$unique_components" | jq 'length')

    # Generate merged SBOM with full metadata
    jq -n \
        --arg version "$VERSION" \
        --arg timestamp "$(date -d "@$SOURCE_DATE_EPOCH" -Iseconds 2>/dev/null || date -r "$SOURCE_DATE_EPOCH" -Iseconds)" \
        --arg serial "urn:uuid:$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)" \
        --argjson components "$unique_components" \
        '{
            bomFormat: "CycloneDX",
            specVersion: "1.6",
            serialNumber: $serial,
            version: 1,
            metadata: {
                timestamp: $timestamp,
                component: {
                    type: "firmware",
                    name: "SecuBox",
                    version: $version,
                    supplier: {
                        name: "CyberMind Produits SASU",
                        contact: [{email: "secubox@cybermind.fr"}]
                    },
                    manufacturer: {
                        name: "CyberMind Produits SASU",
                        url: ["https://cybermind.fr"]
                    },
                    licenses: [{license: {id: "GPL-2.0-only"}}],
                    externalReferences: [
                        {type: "website", url: "https://secubox.in"},
                        {type: "vcs", url: "https://github.com/cybermind/secubox"},
                        {type: "documentation", url: "https://secubox.in/docs/cra"}
                    ]
                },
                tools: [{
                    vendor: "Anchore",
                    name: "syft",
                    version: "'$($SYFT version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "unknown")'"
                }]
            },
            components: $components
        }' > "${OUTPUT_DIR}/secubox-${VERSION}.cdx.json"

    log_ok "Merged SBOM: $component_count unique components"

    # Also generate SPDX version
    if command -v "$CYCLONEDX_CLI" &>/dev/null; then
        "$CYCLONEDX_CLI" convert \
            --input-file "${OUTPUT_DIR}/secubox-${VERSION}.cdx.json" \
            --output-file "${OUTPUT_DIR}/secubox-${VERSION}.spdx.json" \
            --output-format spdxjson 2>/dev/null || {
            log_warn "SPDX conversion failed (cyclonedx-cli issue)"
        }
    fi
}

# 2.7 - Validate SBOM
validate_sbom() {
    log_info "Validating CycloneDX SBOM..."

    local sbom="${OUTPUT_DIR}/secubox-${VERSION}.cdx.json"

    if ! "$CYCLONEDX_CLI" validate \
        --input-format json \
        --input-file "$sbom" \
        --fail-on-errors 2>&1; then
        log_error "SBOM validation failed"
        exit 1
    fi

    log_ok "SBOM validation passed"
}

# 2.8 - CVE scan
scan_cve() {
    if [[ "$NO_CVE" == "true" ]]; then
        log_info "Skipping CVE scan (--no-cve)"
        return 0
    fi

    log_info "Scanning for CVEs with Grype..."

    local sbom="${OUTPUT_DIR}/secubox-${VERSION}.cdx.json"

    "$GRYPE" "sbom:${sbom}" \
        --output table \
        --file "${OUTPUT_DIR}/secubox-${VERSION}-cve-table.txt" || true

    "$GRYPE" "sbom:${sbom}" \
        --output json \
        --file "${OUTPUT_DIR}/secubox-${VERSION}-cve-report.json" || true

    log_ok "CVE scan complete: ${OUTPUT_DIR}/secubox-${VERSION}-cve-report.json"
}

# 2.9 - Generate CRA summary report
generate_cra_summary() {
    log_info "Generating CRA compliance summary..."

    local sbom="${OUTPUT_DIR}/secubox-${VERSION}.cdx.json"
    local timestamp
    timestamp=$(date -d "@$SOURCE_DATE_EPOCH" -Iseconds 2>/dev/null || date -r "$SOURCE_DATE_EPOCH" -Iseconds)
    local component_count
    component_count=$(jq '.components | length' "$sbom")
    local sbom_hash
    sbom_hash=$(sha256sum "$sbom" | cut -d' ' -f1)

    # Extract unique licenses
    local licenses
    licenses=$(jq -r '.components[].licenses[]?.license?.id // empty' "$sbom" 2>/dev/null | sort -u | tr '\n' ', ' | sed 's/,$//')

    # CVE counts
    local cve_critical=0 cve_high=0 cve_medium=0 cve_low=0
    local cve_report="${OUTPUT_DIR}/secubox-${VERSION}-cve-report.json"
    if [[ -f "$cve_report" ]]; then
        cve_critical=$(jq '[.matches[]? | select(.vulnerability.severity == "Critical")] | length' "$cve_report" 2>/dev/null || echo 0)
        cve_high=$(jq '[.matches[]? | select(.vulnerability.severity == "High")] | length' "$cve_report" 2>/dev/null || echo 0)
        cve_medium=$(jq '[.matches[]? | select(.vulnerability.severity == "Medium")] | length' "$cve_report" 2>/dev/null || echo 0)
        cve_low=$(jq '[.matches[]? | select(.vulnerability.severity == "Low")] | length' "$cve_report" 2>/dev/null || echo 0)
    fi

    # Missing metadata
    local missing_metadata=""
    local warnings="${OUTPUT_DIR}/sbom-warnings.txt"
    if [[ -f "$warnings" && -s "$warnings" ]]; then
        missing_metadata=$(cat "$warnings")
    fi

    cat > "${OUTPUT_DIR}/secubox-${VERSION}-cra-summary.txt" <<EOF
=== SecuBox CRA Compliance Summary ===
Version     : ${VERSION}
Generated   : ${timestamp}
SOURCE_DATE : ${SOURCE_DATE_EPOCH}

--- Software Bill of Materials ---
SBOM format    : CycloneDX 1.6 + SPDX 2.3
Total components : ${component_count}
SBOM SHA256    : ${sbom_hash}

--- Licenses ---
${licenses:-No licenses detected}

--- CVE Summary ---
CRITICAL : ${cve_critical}
HIGH     : ${cve_high}
MEDIUM   : ${cve_medium}
LOW      : ${cve_low}
(See secubox-${VERSION}-cve-report.json for details)

--- Missing Metadata ---
${missing_metadata:-None}

--- CRA Annex I Checklist ---
[x] SBOM published in machine-readable format
[x] Vulnerability disclosure contact: security@cybermind.fr
[ ] CSPN certification : IN PROGRESS (target Q3 2026)
[x] VCS traceability : https://github.com/cybermind/secubox
EOF

    log_ok "CRA summary: ${OUTPUT_DIR}/secubox-${VERSION}-cra-summary.txt"
}

# 2.10 - Generate checksums
generate_checksums() {
    log_info "Generating checksums..."

    cd "${OUTPUT_DIR}"
    sha256sum secubox-${VERSION}.* > checksums.sha256

    echo ""
    echo "=== Generated Files ==="
    ls -lh secubox-${VERSION}.* checksums.sha256
    echo ""

    log_ok "SBOM pipeline complete"
}

# Main
main() {
    parse_args "$@"

    # Determine version
    if [[ -z "$VERSION" ]]; then
        if [[ -f "${TOPDIR}/version" ]]; then
            VERSION=$(cat "${TOPDIR}/version" | tr -d ' \n')
        elif [[ -d "${TOPDIR}/.git" ]]; then
            VERSION=$(git -C "$TOPDIR" describe --tags --always 2>/dev/null || echo "dev")
        else
            VERSION="dev"
        fi
    fi

    validate_version "$VERSION"
    validate_arch "$ARCH"

    echo "=========================================="
    echo "SecuBox SBOM Generation Pipeline"
    echo "Version: $VERSION | Arch: $ARCH"
    echo "=========================================="
    echo ""

    # Setup
    mkdir -p "$OUTPUT_DIR"
    setup_reproducibility
    check_tools

    # Generate SBOMs from all 4 sources
    echo ""
    generate_sbom_native   # A: OpenWrt native
    generate_sbom_feed     # B: SecuBox feed
    generate_sbom_rootfs   # C: Rootfs
    generate_sbom_firmware # D: Firmware image

    # Merge and validate
    echo ""
    merge_sboms
    validate_sbom

    # CVE scan and reports
    echo ""
    scan_cve
    generate_cra_summary
    generate_checksums
}

main "$@"
