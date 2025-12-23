#!/bin/sh
# install-rpcd-fix.sh
# Quick installation script for SecuBox RPCD fixes
# 
# Upload this script along with rpcd/ and acl/ folders to the router
# then run: sh install-rpcd-fix.sh

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           SecuBox RPCD Fix Installer                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

# Check if running as root
if [ "$(id -u)" != "0" ]; then
    echo "Error: This script must be run as root"
    exit 1
fi

# ============================================
# Install RPCD scripts
# ============================================
echo "→ Installing RPCD scripts..."

if [ -d "$SCRIPT_DIR/rpcd" ]; then
    for script in "$SCRIPT_DIR/rpcd"/*; do
        [ -f "$script" ] || continue
        
        NAME=$(basename "$script")
        DEST="/usr/libexec/rpcd/$NAME"
        
        cp "$script" "$DEST"
        chmod +x "$DEST"
        echo "  ✓ Installed: $DEST"
    done
else
    echo "  ⚠ No rpcd/ directory found"
fi

# ============================================
# Install ACL files
# ============================================
echo ""
echo "→ Installing ACL files..."

mkdir -p /usr/share/rpcd/acl.d

if [ -d "$SCRIPT_DIR/acl" ]; then
    for acl in "$SCRIPT_DIR/acl"/*.json; do
        [ -f "$acl" ] || continue
        
        NAME=$(basename "$acl")
        DEST="/usr/share/rpcd/acl.d/$NAME"
        
        cp "$acl" "$DEST"
        echo "  ✓ Installed: $DEST"
    done
else
    echo "  ⚠ No acl/ directory found"
fi

# ============================================
# Create missing UCI configs
# ============================================
echo ""
echo "→ Creating UCI configs..."

# vhost_manager
if [ ! -f /etc/config/vhost_manager ]; then
    cat > /etc/config/vhost_manager << 'EOF'
config global 'global'
    option enabled '1'
    option nginx_dir '/etc/nginx/conf.d'
    option acme_dir '/etc/acme'
EOF
    echo "  ✓ Created: /etc/config/vhost_manager"
fi

# ============================================
# Restart services
# ============================================
echo ""
echo "→ Restarting services..."

# Restart rpcd
/etc/init.d/rpcd restart
echo "  ✓ rpcd restarted"

# Clear LuCI cache
rm -rf /tmp/luci-*
echo "  ✓ LuCI cache cleared"

# Wait for rpcd to initialize
sleep 2

# ============================================
# Verify installation
# ============================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           Verification                                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# List installed modules
echo "Checking ubus registration:"

MODULES="vhost-manager secubox bandwidth-manager auth-guardian media-flow"

for module in $MODULES; do
    UBUS_NAME="luci.$module"
    if ubus list "$UBUS_NAME" > /dev/null 2>&1; then
        echo "  ✓ $UBUS_NAME"
    else
        echo "  ✗ $UBUS_NAME (not registered)"
    fi
done

echo ""
echo "Testing vhost-manager status:"
ubus call luci.vhost-manager status 2>/dev/null || echo "  ✗ Failed"

echo ""
echo "Installation complete!"
echo ""
echo "If modules are still not working, check:"
echo "  logread | grep rpcd"
echo "  logread | grep ubus"
