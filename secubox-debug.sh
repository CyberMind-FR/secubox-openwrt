#!/bin/sh
# secubox-debug.sh
# Debug and analysis script for SecuBox LuCI modules RPC/ubus issues
# 
# Usage: ./secubox-debug.sh [module-name]
# Example: ./secubox-debug.sh vhost-manager
#          ./secubox-debug.sh all

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# SecuBox modules list
MODULES="
secubox
crowdsec-dashboard
netdata-dashboard
netifyd-dashboard
wireguard-dashboard
network-modes
client-guardian
system-hub
bandwidth-manager
auth-guardian
media-flow
vhost-manager
cdn-cache
traffic-shaper
"

echo ""
echo "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo "${CYAN}║          SecuBox RPC/UBUS Debug & Analysis Tool              ║${NC}"
echo "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# System Information
# ============================================
print_section() {
    echo ""
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${BLUE}  $1${NC}"
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_ok() {
    echo "  ${GREEN}✓${NC} $1"
}

print_warn() {
    echo "  ${YELLOW}⚠${NC} $1"
}

print_error() {
    echo "  ${RED}✗${NC} $1"
}

print_info() {
    echo "  ${CYAN}→${NC} $1"
}

# ============================================
# Check prerequisites
# ============================================
print_section "System Prerequisites"

# Check if running on OpenWrt
if [ -f /etc/openwrt_release ]; then
    print_ok "Running on OpenWrt"
    . /etc/openwrt_release
    print_info "Version: $DISTRIB_DESCRIPTION"
else
    print_warn "Not running on OpenWrt - some checks may fail"
fi

# Check rpcd
if pgrep -x rpcd > /dev/null 2>&1; then
    print_ok "rpcd is running (PID: $(pgrep -x rpcd))"
else
    print_error "rpcd is NOT running!"
    echo "       Try: /etc/init.d/rpcd restart"
fi

# Check uhttpd
if pgrep -x uhttpd > /dev/null 2>&1; then
    print_ok "uhttpd is running"
else
    print_warn "uhttpd not running (nginx mode?)"
fi

# Check ubus socket
if [ -S /var/run/ubus/ubus.sock ]; then
    print_ok "ubus socket exists"
else
    print_error "ubus socket missing!"
fi

# ============================================
# List all ubus objects
# ============================================
print_section "Available UBUS Objects"

echo ""
echo "  All registered ubus objects:"
echo "  ${CYAN}─────────────────────────────${NC}"

ubus list 2>/dev/null | while read obj; do
    # Highlight luci objects
    case "$obj" in
        luci.*)
            echo "  ${GREEN}$obj${NC}"
            ;;
        *)
            echo "  $obj"
            ;;
    esac
done

# Count luci objects
LUCI_COUNT=$(ubus list 2>/dev/null | grep -c "^luci\." || echo "0")
echo ""
print_info "Total LuCI objects registered: $LUCI_COUNT"

# ============================================
# Check SecuBox modules
# ============================================
print_section "SecuBox Modules Status"

echo ""
printf "  ${CYAN}%-25s %-10s %-10s %-10s %-10s${NC}\n" "MODULE" "UBUS" "RPCD" "ACL" "MENU"
echo "  ─────────────────────────────────────────────────────────────────"

check_module() {
    local module="$1"
    local ubus_name="luci.$module"
    local rpcd_script="/usr/libexec/rpcd/$module"
    local acl_file="/usr/share/rpcd/acl.d/luci-app-${module}.json"
    local menu_file="/usr/share/luci/menu.d/luci-app-${module}.json"
    
    # Alternative paths
    local rpcd_script_alt="/usr/libexec/rpcd/luci.$module"
    local acl_file_alt="/usr/share/rpcd/acl.d/luci-${module}.json"
    local menu_file_alt="/usr/share/luci/menu.d/luci-${module}.json"
    
    # Check ubus
    local ubus_status="${RED}✗${NC}"
    if ubus list "$ubus_name" > /dev/null 2>&1; then
        ubus_status="${GREEN}✓${NC}"
    fi
    
    # Check rpcd script
    local rpcd_status="${RED}✗${NC}"
    if [ -x "$rpcd_script" ] || [ -x "$rpcd_script_alt" ]; then
        rpcd_status="${GREEN}✓${NC}"
    elif [ -f "$rpcd_script" ] || [ -f "$rpcd_script_alt" ]; then
        rpcd_status="${YELLOW}!${NC}"  # exists but not executable
    fi
    
    # Check ACL
    local acl_status="${RED}✗${NC}"
    if [ -f "$acl_file" ] || [ -f "$acl_file_alt" ]; then
        acl_status="${GREEN}✓${NC}"
    fi
    
    # Check menu
    local menu_status="${RED}✗${NC}"
    if [ -f "$menu_file" ] || [ -f "$menu_file_alt" ]; then
        menu_status="${GREEN}✓${NC}"
    fi
    
    printf "  %-25s %-18s %-18s %-18s %-18s\n" \
        "$module" "$ubus_status" "$rpcd_status" "$acl_status" "$menu_status"
}

for module in $MODULES; do
    check_module "$module"
done

echo ""
echo "  ${CYAN}Legend:${NC} ${GREEN}✓${NC}=OK  ${YELLOW}!${NC}=Issue  ${RED}✗${NC}=Missing"

# ============================================
# Detailed module analysis
# ============================================
TARGET_MODULE="$1"

if [ -n "$TARGET_MODULE" ] && [ "$TARGET_MODULE" != "all" ]; then
    print_section "Detailed Analysis: $TARGET_MODULE"
    
    MODULE="$TARGET_MODULE"
    UBUS_NAME="luci.$MODULE"
    
    echo ""
    echo "  ${CYAN}UBUS Object: $UBUS_NAME${NC}"
    echo "  ─────────────────────────────────────"
    
    # Check if ubus object exists
    if ubus list "$UBUS_NAME" > /dev/null 2>&1; then
        print_ok "Object registered in ubus"
        
        echo ""
        echo "  Available methods:"
        ubus -v list "$UBUS_NAME" 2>/dev/null | sed 's/^/    /'
        
        echo ""
        echo "  Testing 'status' method:"
        if ubus call "$UBUS_NAME" status 2>/dev/null; then
            print_ok "status method works"
        else
            print_error "status method failed"
        fi
    else
        print_error "Object NOT registered in ubus"
        echo ""
        echo "  ${YELLOW}Troubleshooting steps:${NC}"
        echo ""
        
        # Check RPCD script
        RPCD_PATHS="
/usr/libexec/rpcd/$MODULE
/usr/libexec/rpcd/luci.$MODULE
/usr/libexec/rpcd/luci-$MODULE
"
        echo "  1. Checking RPCD script locations:"
        FOUND_RPCD=""
        for path in $RPCD_PATHS; do
            if [ -f "$path" ]; then
                FOUND_RPCD="$path"
                if [ -x "$path" ]; then
                    print_ok "Found executable: $path"
                else
                    print_error "Found but NOT executable: $path"
                    echo "       ${YELLOW}Fix: chmod +x $path${NC}"
                fi
            fi
        done
        
        if [ -z "$FOUND_RPCD" ]; then
            print_error "No RPCD script found!"
            echo "       Expected at: /usr/libexec/rpcd/$MODULE"
        fi
        
        # Check ACL file
        echo ""
        echo "  2. Checking ACL configuration:"
        ACL_PATHS="
/usr/share/rpcd/acl.d/luci-app-${MODULE}.json
/usr/share/rpcd/acl.d/luci-${MODULE}.json
/usr/share/rpcd/acl.d/${MODULE}.json
"
        FOUND_ACL=""
        for path in $ACL_PATHS; do
            if [ -f "$path" ]; then
                FOUND_ACL="$path"
                print_ok "Found ACL: $path"
                
                # Validate JSON
                if command -v jsonfilter > /dev/null 2>&1; then
                    if jsonfilter -i "$path" -e '@' > /dev/null 2>&1; then
                        print_ok "JSON syntax valid"
                    else
                        print_error "Invalid JSON syntax!"
                    fi
                fi
                
                # Check for correct ubus permission
                if grep -q "\"$UBUS_NAME\"" "$path" 2>/dev/null; then
                    print_ok "ACL contains $UBUS_NAME permission"
                else
                    print_warn "ACL might be missing $UBUS_NAME permission"
                fi
            fi
        done
        
        if [ -z "$FOUND_ACL" ]; then
            print_error "No ACL file found!"
        fi
        
        # Test RPCD script directly
        if [ -n "$FOUND_RPCD" ] && [ -x "$FOUND_RPCD" ]; then
            echo ""
            echo "  3. Testing RPCD script directly:"
            
            # Test list method
            echo '{"method":"list"}' | "$FOUND_RPCD" 2>&1 | head -20
        fi
    fi
    
    # Check menu entry
    echo ""
    echo "  ${CYAN}Menu Configuration${NC}"
    echo "  ─────────────────────────────────────"
    
    MENU_PATHS="
/usr/share/luci/menu.d/luci-app-${MODULE}.json
/usr/share/luci/menu.d/luci-${MODULE}.json
"
    for path in $MENU_PATHS; do
        if [ -f "$path" ]; then
            print_ok "Found menu: $path"
            echo ""
            cat "$path" | sed 's/^/    /'
        fi
    done
fi

# ============================================
# Common fixes
# ============================================
print_section "Common Fixes"

echo ""
echo "  ${YELLOW}If a module is not working:${NC}"
echo ""
echo "  1. ${CYAN}Restart rpcd:${NC}"
echo "     /etc/init.d/rpcd restart"
echo ""
echo "  2. ${CYAN}Check script permissions:${NC}"
echo "     chmod +x /usr/libexec/rpcd/<module-name>"
echo ""
echo "  3. ${CYAN}Validate JSON files:${NC}"
echo "     jsonfilter -i /usr/share/rpcd/acl.d/luci-app-<module>.json -e '@'"
echo ""
echo "  4. ${CYAN}Check rpcd logs:${NC}"
echo "     logread | grep rpcd"
echo ""
echo "  5. ${CYAN}Test ubus manually:${NC}"
echo "     ubus call luci.<module> status"
echo ""
echo "  6. ${CYAN}Reload LuCI:${NC}"
echo "     rm -rf /tmp/luci-*"
echo "     /etc/init.d/uhttpd restart"
echo ""

# ============================================
# Generate fix script
# ============================================
if [ -n "$TARGET_MODULE" ] && [ "$TARGET_MODULE" != "all" ]; then
    print_section "Auto-Fix Script for $TARGET_MODULE"
    
    FIX_SCRIPT="/tmp/fix-${TARGET_MODULE}.sh"
    
    cat > "$FIX_SCRIPT" << FIXEOF
#!/bin/sh
# Auto-generated fix script for $TARGET_MODULE

echo "Fixing $TARGET_MODULE..."

# Fix permissions
if [ -f /usr/libexec/rpcd/$TARGET_MODULE ]; then
    chmod +x /usr/libexec/rpcd/$TARGET_MODULE
    echo "✓ Fixed permissions for RPCD script"
fi

if [ -f /usr/libexec/rpcd/luci.$TARGET_MODULE ]; then
    chmod +x /usr/libexec/rpcd/luci.$TARGET_MODULE
    echo "✓ Fixed permissions for RPCD script (alt)"
fi

# Restart rpcd
/etc/init.d/rpcd restart
echo "✓ Restarted rpcd"

# Clear LuCI cache
rm -rf /tmp/luci-*
echo "✓ Cleared LuCI cache"

# Test
sleep 2
if ubus list luci.$TARGET_MODULE > /dev/null 2>&1; then
    echo "✓ Module $TARGET_MODULE is now registered!"
    ubus -v list luci.$TARGET_MODULE
else
    echo "✗ Module still not working. Check logs:"
    echo "  logread | grep -i rpcd"
    echo "  logread | grep -i $TARGET_MODULE"
fi
FIXEOF
    
    chmod +x "$FIX_SCRIPT"
    
    echo ""
    echo "  Generated fix script: ${GREEN}$FIX_SCRIPT${NC}"
    echo ""
    echo "  Run it with: ${CYAN}sh $FIX_SCRIPT${NC}"
    echo ""
fi

# ============================================
# Summary
# ============================================
print_section "Quick Commands"

echo ""
echo "  ${CYAN}Debug specific module:${NC}"
echo "    ./secubox-debug.sh vhost-manager"
echo ""
echo "  ${CYAN}List all ubus objects:${NC}"
echo "    ubus list | grep luci"
echo ""
echo "  ${CYAN}Test RPC call:${NC}"
echo "    ubus call luci.vhost-manager status"
echo ""
echo "  ${CYAN}View RPCD logs:${NC}"
echo "    logread | grep -E '(rpcd|ubus)'"
echo ""
echo "  ${CYAN}Full restart:${NC}"
echo "    /etc/init.d/rpcd restart && rm -rf /tmp/luci-* && /etc/init.d/uhttpd restart"
echo ""

echo "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo "${CYAN}║                    Debug Complete                            ║${NC}"
echo "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
