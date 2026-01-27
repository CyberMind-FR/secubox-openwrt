#!/bin/bash
# SecuBox Remote Deployment Script
# Deploys all SecuBox packages to a remote OpenWrt router

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$SCRIPT_DIR/sdk/bin/packages/aarch64_cortex-a72/secubox"
ROUTER_IP="${1:-192.168.255.1}"
ROUTER_USER="${2:-root}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
error() { echo -e "${RED}❌ $*${NC}"; exit 1; }

# Check SSH connectivity
check_ssh() {
    info "Checking SSH connectivity to $ROUTER_IP..."
    if ! ssh -o ConnectTimeout=10 "$ROUTER_USER@$ROUTER_IP" "echo ok" 2>/dev/null; then
        error "Cannot connect to $ROUTER_IP via SSH"
    fi
    success "SSH connection OK"
}

# Setup local feed on router
setup_feed() {
    info "Setting up local package feed on router..."

    ssh "$ROUTER_USER@$ROUTER_IP" 'mkdir -p /www/secubox-feed /tmp/secubox-install'

    # Copy packages
    info "Copying packages to router (this may take a while)..."
    scp -q "$BUILD_DIR"/*.ipk "$ROUTER_USER@$ROUTER_IP:/www/secubox-feed/" 2>/dev/null || true

    # Generate Packages index
    info "Generating package index..."
    ssh "$ROUTER_USER@$ROUTER_IP" 'cd /www/secubox-feed && {
        rm -f Packages Packages.gz
        for ipk in *.ipk; do
            [ -f "$ipk" ] || continue
            tar -xOzf "$ipk" ./control.tar.gz 2>/dev/null | tar -xOz ./control 2>/dev/null >> Packages
            echo "Filename: $ipk" >> Packages
            echo "" >> Packages
        done
        gzip -k Packages
    }'

    # Configure opkg
    ssh "$ROUTER_USER@$ROUTER_IP" 'grep -q "secubox-feed" /etc/opkg/customfeeds.conf 2>/dev/null || {
        echo "src/gz secubox file:///www/secubox-feed" >> /etc/opkg/customfeeds.conf
    }'

    success "Local feed configured"
}

# Install core packages first
install_core() {
    info "Installing core SecuBox packages..."

    ssh "$ROUTER_USER@$ROUTER_IP" 'opkg update 2>/dev/null

    # Core packages (order matters)
    for pkg in secubox-core; do
        if [ -f "/www/secubox-feed/${pkg}_"*.ipk ]; then
            echo "Installing $pkg..."
            opkg install --force-reinstall /www/secubox-feed/${pkg}_*.ipk 2>&1 || true
        fi
    done'

    success "Core packages installed"
}

# Install LuCI apps
install_luci_apps() {
    info "Installing LuCI applications..."

    ssh "$ROUTER_USER@$ROUTER_IP" '
    cd /www/secubox-feed

    # Skip large bonus package and packages with missing deps
    SKIP="secubox-bonus|auth-guardian|ksm-manager|vhost-manager|zigbee"

    for ipk in luci-app-*.ipk; do
        [ -f "$ipk" ] || continue

        # Skip excluded packages
        if echo "$ipk" | grep -qE "$SKIP"; then
            echo "Skipping: $ipk (excluded)"
            continue
        fi

        pkg_name=$(echo "$ipk" | sed "s/_[0-9].*//")
        echo "Installing: $pkg_name"
        opkg install --force-reinstall "/www/secubox-feed/$ipk" 2>&1 | grep -v "^Collected" || true
    done'

    success "LuCI apps installed"
}

# Install service packages
install_services() {
    info "Installing service packages..."

    ssh "$ROUTER_USER@$ROUTER_IP" '
    cd /www/secubox-feed

    for ipk in secubox-app-*.ipk; do
        [ -f "$ipk" ] || continue

        pkg_name=$(echo "$ipk" | sed "s/_[0-9].*//")
        echo "Installing: $pkg_name"
        opkg install --force-reinstall "/www/secubox-feed/$ipk" 2>&1 | grep -v "^Collected" || true
    done'

    success "Service packages installed"
}

# Fix permissions and restart services
finalize() {
    info "Finalizing installation..."

    ssh "$ROUTER_USER@$ROUTER_IP" '
    # Fix RPCD script permissions
    chmod 755 /usr/libexec/rpcd/luci.* 2>/dev/null || true

    # Restart rpcd
    /etc/init.d/rpcd restart

    # Clear LuCI cache
    rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null

    # Show installed packages
    echo ""
    echo "=== Installed SecuBox packages ==="
    opkg list-installed | grep -E "^(luci-app-|secubox-)" | wc -l
    echo "packages installed"
    '

    success "Installation complete!"
}

# Generate apps-local.json for store UI
generate_apps_json() {
    info "Generating apps manifest..."

    ssh "$ROUTER_USER@$ROUTER_IP" 'cd /www/secubox-feed && {
    cat > apps-local.json << "HEADER"
{
  "feed_url": "/secubox-feed",
  "generated": "TIMESTAMP",
  "packages": [
HEADER
    sed -i "s/TIMESTAMP/$(date -Iseconds)/" apps-local.json

    first=true
    for pkg in *.ipk; do
        [ -f "$pkg" ] || continue
        filename="$pkg"
        name=$(echo "$filename" | sed "s/_[0-9].*$//")
        version=$(echo "$filename" | sed "s/^[^_]*_//; s/_[^_]*$//")
        size=$(stat -c%s "$pkg" 2>/dev/null || ls -l "$pkg" | awk "{print \$5}")

        # Category based on name
        category="utility"
        case "$name" in
            *crowdsec*|*mitmproxy*|*tor*) category="security";;
            *bandwidth*|*traffic*|*network*|*wireguard*) category="network";;
            *hexojs*|*gitea*|*streamlit*) category="apps";;
            *secubox*) category="system";;
        esac

        [ "$first" = "true" ] || echo "," >> apps-local.json
        first=false

        cat >> apps-local.json << ENTRY
    {
      "name": "$name",
      "version": "$version",
      "filename": "$filename",
      "size": $size,
      "category": "$category"
    }
ENTRY
    done

    echo "  ]" >> apps-local.json
    echo "}" >> apps-local.json
    }'

    success "Apps manifest generated"
}

# Main
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  SecuBox Remote Deployment"
    echo "  Target: $ROUTER_USER@$ROUTER_IP"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    check_ssh
    setup_feed
    install_core
    install_services
    install_luci_apps
    generate_apps_json
    finalize

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success "Deployment complete!"
    echo "  Access LuCI at: http://$ROUTER_IP"
    echo "  Local feed at: http://$ROUTER_IP/secubox-feed/"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

main "$@"
