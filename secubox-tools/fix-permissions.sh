#!/bin/bash
#
# SecuBox Permission Fix Script
# Automatically fixes file permissions for LuCI modules
#
# CRITICAL PERMISSIONS:
# - RPCD scripts (root/usr/libexec/rpcd/*): 755 (rwxr-xr-x) - Must be executable
# - CSS files (htdocs/**/*.css): 644 (rw-r--r--) - Web server readable
# - JS files (htdocs/**/*.js): 644 (rw-r--r--) - Web server readable
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOCAL_MODE=false
REMOTE_MODE=false
ROUTER=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            LOCAL_MODE=true
            shift
            ;;
        --remote)
            REMOTE_MODE=true
            ROUTER="${2:-root@192.168.8.191}"
            shift 2
            ;;
        *)
            echo "Usage: $0 [--local] [--remote [router]]"
            echo ""
            echo "  --local         Fix permissions in local source tree (development)"
            echo "  --remote [addr] Fix permissions on router (default: root@192.168.8.191)"
            echo ""
            echo "If no option specified, fixes both local and remote."
            exit 1
            ;;
    esac
done

# If neither specified, do both
if [ "$LOCAL_MODE" = false ] && [ "$REMOTE_MODE" = false ]; then
    LOCAL_MODE=true
    REMOTE_MODE=true
    ROUTER="root@192.168.8.191"
fi

echo "========================================"
echo "SecuBox Permission Fix"
echo "========================================"
echo ""

# Helper function to collect all luci-app directories
get_luci_apps() {
    find . -maxdepth 1 -type d -name 'luci-app-*' 2>/dev/null
    find package/secubox -maxdepth 1 -type d -name 'luci-app-*' 2>/dev/null
}

# Fix local permissions
if [ "$LOCAL_MODE" = true ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Fixing Local Source Permissions${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    RPCD_FIXED=0
    CSS_FIXED=0
    JS_FIXED=0

    while IFS= read -r module_dir; do
        [[ ! -d "$module_dir" ]] && continue
        module_name=$(basename "$module_dir")

        # Fix RPCD scripts (must be executable: 755)
        rpcd_dir="$module_dir/root/usr/libexec/rpcd"
        if [ -d "$rpcd_dir" ]; then
            while IFS= read -r script; do
                if [ -n "$script" ] && [ ! -x "$script" ]; then
                    chmod 755 "$script"
                    echo "  ✓ $module_name: RPCD $(basename $script) → 755"
                    ((RPCD_FIXED++))
                fi
            done < <(find "$rpcd_dir" -type f ! -name "*.md" 2>/dev/null)
        fi

        # Fix CSS files (must be readable: 644)
        htdocs_dir="$module_dir/htdocs"
        if [ -d "$htdocs_dir" ]; then
            while IFS= read -r css_file; do
                if [ -n "$css_file" ]; then
                    current_perms=$(stat -c "%a" "$css_file" 2>/dev/null)
                    if [ "$current_perms" != "644" ]; then
                        chmod 644 "$css_file"
                        echo "  ✓ $module_name: $(basename $css_file) $current_perms → 644"
                        ((CSS_FIXED++))
                    fi
                fi
            done < <(find "$htdocs_dir" -name "*.css" -type f 2>/dev/null)

            # Fix JS files (must be readable: 644)
            while IFS= read -r js_file; do
                if [ -n "$js_file" ]; then
                    current_perms=$(stat -c "%a" "$js_file" 2>/dev/null)
                    if [ "$current_perms" != "644" ]; then
                        chmod 644 "$js_file"
                        echo "  ✓ $module_name: $(basename $js_file) $current_perms → 644"
                        ((JS_FIXED++))
                    fi
                fi
            done < <(find "$htdocs_dir" -name "*.js" -type f 2>/dev/null)
        fi
    done < <(get_luci_apps)

    echo ""
    echo -e "${GREEN}Local Permissions Fixed:${NC}"
    echo "  RPCD scripts: $RPCD_FIXED"
    echo "  CSS files:    $CSS_FIXED"
    echo "  JS files:     $JS_FIXED"
    echo ""
fi

# Fix remote permissions
if [ "$REMOTE_MODE" = true ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Fixing Remote Permissions ($ROUTER)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Test connection
    if ! ssh "$ROUTER" "echo 'Connection OK'" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Cannot connect to $ROUTER${NC}"
        echo "  → Check router IP and SSH access"
        exit 1
    fi

    echo "  → Fixing RPCD script permissions (755)..."
    ssh "$ROUTER" "find /usr/libexec/rpcd -name 'luci.*' -type f -exec chmod 755 {} \;" 2>/dev/null || true

    echo "  → Fixing CSS file permissions (644)..."
    ssh "$ROUTER" "find /www/luci-static/resources -name '*.css' -type f -exec chmod 644 {} \;" 2>/dev/null || true

    echo "  → Fixing JS file permissions (644)..."
    ssh "$ROUTER" "find /www/luci-static/resources -name '*.js' -type f -exec chmod 644 {} \;" 2>/dev/null || true

    # Verify no files left with 600
    REMAINING_600=$(ssh "$ROUTER" "find /www/luci-static/resources -type f \( -name '*.js' -o -name '*.css' \) -perm 600 | wc -l" 2>/dev/null || echo "0")

    echo ""
    if [ "$REMAINING_600" -eq 0 ]; then
        echo -e "${GREEN}✓ All remote permissions fixed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: $REMAINING_600 files still have 600 permissions${NC}"
    fi

    echo ""
    echo "  → Clearing LuCI cache..."
    ssh "$ROUTER" "rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* 2>/dev/null" || true

    echo "  → Restarting services..."
    ssh "$ROUTER" "/etc/init.d/rpcd restart && /etc/init.d/uhttpd restart" >/dev/null 2>&1 || true

    echo ""
    echo -e "${GREEN}✓ Remote permissions fixed and services restarted${NC}"
    echo ""
fi

echo "========================================"
echo -e "${GREEN}✓ Permission Fix Complete!${NC}"
echo "========================================"
echo ""

if [ "$LOCAL_MODE" = true ]; then
    echo "Next steps:"
    echo "  1. Run validation: ./secubox-tools/validate-modules.sh"
    echo "  2. Build packages: ./secubox-tools/local-build.sh build"
    echo "  3. Deploy to router"
fi

if [ "$REMOTE_MODE" = true ]; then
    echo "Test modules in browser (use private mode: Ctrl+Shift+N)"
    echo "  → https://192.168.8.191/cgi-bin/luci/admin/secubox"
fi
