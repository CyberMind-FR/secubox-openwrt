#!/bin/sh
#
# SecuBox Seed Script
# Bootstrap a fresh OpenWrt installation with SecuBox packages
#
# Usage:
#   wget -O- https://repo.secubox.in/seed.sh | sh
#   OR
#   curl -fsSL https://repo.secubox.in/seed.sh | sh
#
# Options (via environment):
#   SECUBOX_PROFILE=minimal|standard|full (default: standard)
#   SECUBOX_MIRROR=url (override repo URL)
#   SECUBOX_SKIP_UPDATE=1 (skip opkg update)
#   SECUBOX_DRY_RUN=1 (show what would be installed)
#

set -e

# Colors (if terminal supports it)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

log_info() { printf "${BLUE}[INFO]${NC} %s\n" "$1"; }
log_ok() { printf "${GREEN}[OK]${NC} %s\n" "$1"; }
log_warn() { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }
log_error() { printf "${RED}[ERROR]${NC} %s\n" "$1"; }

# Detect architecture
detect_arch() {
    local arch
    if [ -f /etc/openwrt_release ]; then
        arch=$(grep "DISTRIB_ARCH" /etc/openwrt_release | cut -d"'" -f2)
    fi

    if [ -z "$arch" ]; then
        # Fallback: detect from uname
        case "$(uname -m)" in
            x86_64)  arch="x86_64" ;;
            aarch64) arch="aarch64_cortex-a72" ;;
            armv7l)  arch="arm_cortex-a7_neon-vfpv4" ;;
            *)       arch="$(uname -m)" ;;
        esac
    fi

    echo "$arch"
}

# Repository URLs in order of preference
REPO_URLS="
https://repo.secubox.in
https://secubox.in/repo
https://github.com/CyberMind-FR/secubox-openwrt/releases/download/packages
"

# Check connectivity and find working repo
check_connectivity() {
    log_info "Checking network connectivity..."

    # First check general connectivity
    if ! ping -c 1 -W 3 "downloads.openwrt.org" >/dev/null 2>&1; then
        if ! wget -q -T 5 --spider "https://downloads.openwrt.org" 2>/dev/null; then
            log_error "No network connectivity. Please check your network configuration."
            return 1
        fi
    fi

    log_ok "Network connectivity OK"
    return 0
}

# Find a working SecuBox repository
# Outputs only the URL to stdout, all log messages go to stderr
find_working_repo() {
    local arch="$1"

    # If user specified a mirror, use it directly
    if [ -n "$SECUBOX_MIRROR" ]; then
        log_info "Using user-specified mirror: $SECUBOX_MIRROR" >&2
        echo "$SECUBOX_MIRROR"
        return 0
    fi

    # Check local feed first (for bonus package)
    if [ -d "/www/secubox-feed" ] && [ -f "/www/secubox-feed/Packages" ]; then
        log_info "Found local SecuBox feed at /www/secubox-feed" >&2
        echo "file:///www/secubox-feed"
        return 0
    fi

    # Try each remote URL
    log_info "Searching for working SecuBox repository..." >&2
    for base_url in $REPO_URLS; do
        local test_url="${base_url}/packages/${arch}/Packages.gz"
        log_info "Trying: $base_url" >&2

        # Try wget - actually download the file to verify it exists and is valid
        # Using -O /dev/null to discard content but verify it downloads
        if wget -q -T 10 -O /tmp/pkg_test.gz "$test_url" 2>/dev/null; then
            # Verify it's actually a gzip file (not an error page)
            if file /tmp/pkg_test.gz 2>/dev/null | grep -q "gzip"; then
                log_ok "Found working repository: $base_url" >&2
                rm -f /tmp/pkg_test.gz
                echo "$base_url"
                return 0
            else
                log_warn "Invalid response from $base_url (not a package index)" >&2
                rm -f /tmp/pkg_test.gz
            fi
        fi

        # Try curl as fallback
        if command -v curl >/dev/null 2>&1; then
            if curl -sf -m 10 -o /tmp/pkg_test.gz "$test_url" 2>/dev/null; then
                if file /tmp/pkg_test.gz 2>/dev/null | grep -q "gzip"; then
                    log_ok "Found working repository: $base_url" >&2
                    rm -f /tmp/pkg_test.gz
                    echo "$base_url"
                    return 0
                else
                    log_warn "Invalid response from $base_url (not a package index)" >&2
                    rm -f /tmp/pkg_test.gz
                fi
            fi
        fi
    done

    log_warn "No remote SecuBox repository available" >&2
    return 1
}

# Configure SecuBox repository
configure_repo() {
    local arch="$1"
    local feeds_file="/etc/opkg/customfeeds.conf"

    log_info "Configuring SecuBox package repository..."

    # Backup existing customfeeds.conf
    if [ -f "$feeds_file" ]; then
        cp "$feeds_file" "${feeds_file}.bak"
    fi

    # Check if SecuBox feed already configured
    if grep -q "secubox_packages\|secubox_local\|secubox_luci" "$feeds_file" 2>/dev/null; then
        log_warn "SecuBox feeds already configured, updating..."
        sed -i '/secubox_packages/d; /secubox_luci/d; /secubox_local/d; /SecuBox Package/d; /SecuBox Local/d; /Added by secubox-seed/d' "$feeds_file"
        # Remove empty lines at end of file
        sed -i -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$feeds_file" 2>/dev/null || true
    fi

    # Find a working repository (URL goes to stdout, logs go to stderr)
    local repo_url
    repo_url=$(find_working_repo "$arch") || true

    # Check if we got a valid URL
    if [ -z "$repo_url" ]; then
        log_warn "No SecuBox repository found. Packages will need to be installed manually."
        log_info "You can set SECUBOX_MIRROR to specify a custom repository URL."

        # Still configure the default URL for future use
        repo_url="https://repo.secubox.in"
        SECUBOX_REPO_AVAILABLE=0
    else
        SECUBOX_REPO_AVAILABLE=1
    fi

    # Handle local file:// URLs differently
    if echo "$repo_url" | grep -q "^file://"; then
        cat >> "$feeds_file" << EOF

# SecuBox Local Package Repository
# Added by secubox-seed.sh on $(date +%Y-%m-%d)
src secubox_local ${repo_url}
EOF
    else
        cat >> "$feeds_file" << EOF

# SecuBox Package Repository
# Added by secubox-seed.sh on $(date +%Y-%m-%d)
src/gz secubox_packages ${repo_url}/packages/${arch}
src/gz secubox_luci ${repo_url}/luci/${arch}
EOF
    fi

    log_ok "Repository configured: ${repo_url}"
}

# Update package lists
update_packages() {
    if [ "${SECUBOX_SKIP_UPDATE:-0}" = "1" ]; then
        log_warn "Skipping package list update (SECUBOX_SKIP_UPDATE=1)"
        return 0
    fi

    log_info "Updating package lists..."

    if ! opkg update 2>&1; then
        log_warn "Some feeds failed to update, continuing anyway..."
    fi

    log_ok "Package lists updated"
}

# Install a package with fallback
install_pkg() {
    local pkg="$1"
    local optional="${2:-0}"

    if [ "${SECUBOX_DRY_RUN:-0}" = "1" ]; then
        log_info "[DRY RUN] Would install: $pkg"
        return 0
    fi

    # Check if already installed
    if opkg list-installed | grep -q "^${pkg} "; then
        log_ok "$pkg already installed"
        return 0
    fi

    log_info "Installing $pkg..."

    if opkg install "$pkg" 2>&1; then
        log_ok "$pkg installed successfully"
        return 0
    else
        if [ "$optional" = "1" ]; then
            log_warn "$pkg installation failed (optional, continuing)"
            return 0
        else
            log_error "$pkg installation failed"
            return 1
        fi
    fi
}

# Install package group with error handling
install_group() {
    local group_name="$1"
    shift
    local packages="$@"
    local failed=""

    log_info "Installing $group_name packages..."

    for pkg in $packages; do
        # Check if package is optional (prefixed with ?)
        local optional=0
        if echo "$pkg" | grep -q "^?"; then
            optional=1
            pkg="${pkg#?}"
        fi

        if ! install_pkg "$pkg" "$optional"; then
            failed="$failed $pkg"
        fi
    done

    if [ -n "$failed" ]; then
        log_warn "Some packages failed to install:$failed"
        return 1
    fi

    log_ok "$group_name packages installed"
    return 0
}

# Define package profiles
get_profile_packages() {
    local profile="${1:-standard}"

    case "$profile" in
        minimal)
            # Minimal: Just core + theme
            echo "CORE:secubox-core secubox-base"
            echo "THEME:luci-theme-secubox"
            ;;
        standard)
            # Standard: Core + Security + Basic LuCI apps
            echo "CORE:secubox-core secubox-base secubox-identity"
            echo "THEME:luci-theme-secubox"
            echo "SECURITY:?secubox-app-crowdsec ?secubox-app-cs-firewall-bouncer secubox-app-ipblocklist"
            echo "NETWORK:secubox-app-haproxy secubox-app-mitmproxy"
            echo "LUCI:luci-app-secubox luci-app-haproxy ?luci-app-crowdsec-dashboard"
            ;;
        full)
            # Full: Everything
            echo "CORE:secubox-core secubox-base secubox-identity secubox-master-link secubox-p2p"
            echo "THEME:luci-theme-secubox"
            echo "SECURITY:?secubox-app-crowdsec ?secubox-app-cs-firewall-bouncer secubox-app-ipblocklist secubox-app-mitmproxy"
            echo "NETWORK:secubox-app-haproxy secubox-app-dns-master secubox-app-exposure secubox-app-tor"
            echo "MONITORING:secubox-app-glances secubox-app-netifyd secubox-app-watchdog"
            echo "LUCI:luci-app-secubox luci-app-haproxy luci-app-exposure luci-app-dns-master"
            echo "LUCI:?luci-app-crowdsec-dashboard luci-app-glances luci-app-master-link"
            echo "BONUS:?secubox-app-bonus"
            ;;
        *)
            log_error "Unknown profile: $profile"
            log_info "Available profiles: minimal, standard, full"
            return 1
            ;;
    esac
}

# Post-installation setup
post_install() {
    log_info "Running post-installation setup..."

    # Initialize SecuBox if secubox-core is installed
    if [ -x /usr/sbin/secuboxctl ]; then
        log_info "Initializing SecuBox..."
        /usr/sbin/secuboxctl init 2>/dev/null || true
    fi

    # Enable and start key services
    local services="secubox haproxy"
    for svc in $services; do
        if [ -f "/etc/init.d/$svc" ]; then
            log_info "Enabling $svc service..."
            /etc/init.d/$svc enable 2>/dev/null || true
        fi
    done

    # Reload rpcd for new RPC methods
    if [ -f /etc/init.d/rpcd ]; then
        log_info "Reloading RPCD..."
        /etc/init.d/rpcd restart 2>/dev/null || true
    fi

    log_ok "Post-installation setup complete"
}

# Print summary
print_summary() {
    local profile="$1"

    echo ""
    echo "=========================================="
    printf "${GREEN}SecuBox Installation Complete${NC}\n"
    echo "=========================================="
    echo ""
    echo "Profile: $profile"
    echo "Architecture: $(detect_arch)"
    echo ""
    echo "Access LuCI at: http://$(uci get network.lan.ipaddr 2>/dev/null || echo '192.168.1.1')"
    echo ""
    echo "Installed packages:"
    opkg list-installed | grep -E "^secubox-|^luci-.*secubox|^luci-theme-secubox" | while read line; do
        echo "  - $line"
    done
    echo ""
    echo "For more information:"
    echo "  https://docs.secubox.in"
    echo ""
}

# Main installation flow
main() {
    local profile="${SECUBOX_PROFILE:-standard}"

    echo ""
    echo "=========================================="
    printf "${BLUE}SecuBox Seed Installer${NC}\n"
    echo "=========================================="
    echo ""
    log_info "Profile: $profile"

    # Pre-flight checks
    if [ "$(id -u)" != "0" ]; then
        log_error "This script must be run as root"
        exit 1
    fi

    if ! command -v opkg >/dev/null 2>&1; then
        log_error "opkg not found. Is this an OpenWrt system?"
        exit 1
    fi

    # Detect architecture
    local arch
    arch=$(detect_arch)
    log_info "Detected architecture: $arch"

    # Check connectivity
    if ! check_connectivity; then
        exit 1
    fi

    # Configure repository
    configure_repo "$arch"

    # Update package lists
    update_packages

    # Check if repo is available before trying to install
    if [ "${SECUBOX_REPO_AVAILABLE:-1}" = "0" ]; then
        log_warn "SecuBox repository not available. Skipping package installation."
        log_info "Repository has been configured for future use."
        log_info "When packages are available, run: opkg update && opkg install secubox-core"
        if [ "${SECUBOX_DRY_RUN:-0}" != "1" ]; then
            echo ""
            echo "=========================================="
            printf "${YELLOW}SecuBox Setup Incomplete${NC}\n"
            echo "=========================================="
            echo ""
            echo "Repository configured but packages not available."
            echo "To complete installation later:"
            echo "  opkg update"
            echo "  opkg install secubox-core secubox-base luci-theme-secubox"
            echo ""
        fi
        exit 0
    fi

    # Get packages for selected profile
    local profile_data
    profile_data=$(get_profile_packages "$profile")

    if [ -z "$profile_data" ]; then
        exit 1
    fi

    # Install each package group
    local install_failed=0
    echo "$profile_data" | while IFS=: read group packages; do
        if ! install_group "$group" $packages; then
            install_failed=1
        fi
    done

    # Post-installation
    if [ "${SECUBOX_DRY_RUN:-0}" != "1" ]; then
        post_install
        print_summary "$profile"
    else
        log_info "[DRY RUN] Skipping post-installation"
    fi

    if [ "$install_failed" = "1" ]; then
        log_warn "Installation completed with some errors"
        exit 1
    fi

    log_ok "SecuBox installation completed successfully!"
}

# Handle command-line arguments
while [ $# -gt 0 ]; do
    case "$1" in
        --profile=*)
            SECUBOX_PROFILE="${1#*=}"
            ;;
        --mirror=*)
            SECUBOX_MIRROR="${1#*=}"
            ;;
        --dry-run)
            SECUBOX_DRY_RUN=1
            ;;
        --skip-update)
            SECUBOX_SKIP_UPDATE=1
            ;;
        --help|-h)
            echo "SecuBox Seed Installer"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --profile=PROFILE   Installation profile (minimal|standard|full)"
            echo "  --mirror=URL        Override repository URL"
            echo "  --dry-run           Show what would be installed"
            echo "  --skip-update       Skip opkg update"
            echo "  --help              Show this help"
            echo ""
            echo "Environment variables:"
            echo "  SECUBOX_PROFILE     Same as --profile"
            echo "  SECUBOX_MIRROR      Same as --mirror"
            echo "  SECUBOX_DRY_RUN=1   Same as --dry-run"
            echo "  SECUBOX_SKIP_UPDATE=1  Same as --skip-update"
            echo ""
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
    shift
done

main
