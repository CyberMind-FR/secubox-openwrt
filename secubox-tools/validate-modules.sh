#!/bin/bash
#
# SecuBox Module Validation Script
# Validates RPCD naming, menu paths, and module structure
#

set -e
set -o pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Helper function to collect all luci-app directories
get_luci_apps() {
	find . -maxdepth 1 -type d -name 'luci-app-*' 2>/dev/null
	find package/secubox -maxdepth 1 -type d -name 'luci-app-*' 2>/dev/null
}

echo "========================================"
echo "SecuBox Module Validation"
echo "========================================"
echo ""

# Function to print error
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Function to print warning
warn() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Check 1: RPCD script names must match ubus object names
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Validating RPCD script names vs ubus objects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while IFS= read -r module_dir; do
    [[ ! -d "$module_dir" ]] && continue
    module_name=$(basename "$module_dir")
    echo "Checking $module_name..."

    # Find RPCD script
    rpcd_dir="$module_dir/root/usr/libexec/rpcd"
    if [ -d "$rpcd_dir" ]; then
        rpcd_script=$(find "$rpcd_dir" -type f ! -name "*.md" 2>/dev/null | head -1)

        if [ -n "$rpcd_script" ]; then
            rpcd_name=$(basename "$rpcd_script")

            # Extract ubus object names from JavaScript files
            set +e
            js_objects=$(find "$module_dir/htdocs" -name "*.js" -type f 2>/dev/null | \
                xargs grep -h "object:" 2>/dev/null | \
                grep -o "'[^']*'" | sort -u | tr -d "'")
            set -e

            if [ -n "$js_objects" ]; then
                # Check if RPCD script name matches any ubus object
                match_found=false
                for obj in $js_objects; do
                    if [ "$rpcd_name" = "$obj" ]; then
                        match_found=true
                        success "$module_name: RPCD script '$rpcd_name' matches ubus object '$obj'"
                        break
                    fi
                done

                if [ "$match_found" = false ]; then
                    error "$module_name: RPCD script '$rpcd_name' does not match any ubus object(s): $js_objects"
                    echo "  → Rename $rpcd_script to one of: $js_objects"
                fi
            else
                warn "$module_name: No ubus object declarations found in JavaScript files"
            fi
        else
            warn "$module_name: No RPCD script found in $rpcd_dir"
        fi
    else
        warn "$module_name: No RPCD directory found"
    fi
    echo ""
done < <(get_luci_apps)

# Check 2: Menu paths must match actual view file locations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Validating menu paths vs view file locations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while IFS= read -r module_dir; do
    [[ ! -d "$module_dir" ]] && continue
    module_name=$(basename "$module_dir")
    menu_file="$module_dir/root/usr/share/luci/menu.d/${module_name}.json"

    if [ -f "$menu_file" ]; then
        echo "Checking $module_name menu paths..."

        # Extract all view paths from menu JSON
        menu_paths=$(grep -o '"path":\s*"[^"]*"' "$menu_file" | cut -d'"' -f4)

        for path in $menu_paths; do
            # Locate view file anywhere in repo (supports shared menus pointing to other modules)
            view_file=$(find . -path "*/htdocs/luci-static/resources/view/${path}.js" -print -quit 2>/dev/null)

            if [ -n "$view_file" ] && [ -f "$view_file" ]; then
                success "$module_name: Menu path '$path' → file exists at ${view_file#./}"
            else
                error "$module_name: Menu path '$path' → no view found in repository"

                view_dir_guess=$(printf "%s/htdocs/luci-static/resources/view/%s" "$module_dir" "$(dirname "$path")")
                if [ -d "$view_dir_guess" ]; then
                    echo "  → Possible files in $(dirname $path):"
                    find "$view_dir_guess" -name "*.js" -type f | while read -r f; do
                        echo "     - $(basename $f)"
                    done
                fi
            fi
        done
        echo ""
    fi
done < <(get_luci_apps)

# Check 3: View files must have corresponding menu entries
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Validating view files have menu entries"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while IFS= read -r module_dir; do
    [[ ! -d "$module_dir" ]] && continue
    module_name=$(basename "$module_dir")
    view_dir="$module_dir/htdocs/luci-static/resources/view"
    menu_file="$module_dir/root/usr/share/luci/menu.d/${module_name}.json"

    if [ -d "$view_dir" ] && [ -f "$menu_file" ]; then
        echo "Checking $module_name view files..."

        # Temporarily disable exit on error for grep checks in loops
        set +e
        # Find all .js view files
        find "$view_dir" -name "*.js" -type f 2>/dev/null | while read -r view_file; do
            # Convert file path to menu path
            rel_path=$(echo "$view_file" | sed "s|$module_dir/htdocs/luci-static/resources/view/||" | sed 's|.js$||')

            # Check if path exists in menu
            if grep -q "\"path\":\s*\"$rel_path\"" "$menu_file" 2>/dev/null; then
                success "$module_name: View '$rel_path.js' has menu entry"
            else
                warn "$module_name: View file '$rel_path.js' exists but has no menu entry"
            fi
        done
        set -e
        echo ""
    fi
done < <(get_luci_apps)

# Check 4: RPCD scripts must be executable
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Validating RPCD script permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while IFS= read -r module_dir; do
    [[ ! -d "$module_dir" ]] && continue
    module_name=$(basename "$module_dir")
    rpcd_dir="$module_dir/root/usr/libexec/rpcd"

    if [ -d "$rpcd_dir" ]; then
        find "$rpcd_dir" -type f ! -name "*.md" 2>/dev/null | while read -r script; do
            if [ -x "$script" ]; then
                success "$module_name: RPCD script $(basename $script) is executable"
            else
                error "$module_name: RPCD script $(basename $script) is NOT executable"
                echo "  → Run: chmod +x $script"
            fi
        done
    fi
done < <(get_luci_apps)
echo ""

# Check 5: JSON files must be valid
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Validating JSON syntax"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while IFS= read -r module_dir; do
    [[ ! -d "$module_dir" ]] && continue
    module_name=$(basename "$module_dir")

    # Check menu JSON
    menu_file="$module_dir/root/usr/share/luci/menu.d/${module_name}.json"
    if [ -f "$menu_file" ]; then
        if python3 -m json.tool "$menu_file" > /dev/null 2>&1; then
            success "$module_name: menu.d JSON is valid"
        else
            error "$module_name: menu.d JSON is INVALID"
        fi
    fi

    # Check ACL JSON
    acl_file="$module_dir/root/usr/share/rpcd/acl.d/${module_name}.json"
    if [ -f "$acl_file" ]; then
        if python3 -m json.tool "$acl_file" > /dev/null 2>&1; then
            success "$module_name: acl.d JSON is valid"
        else
            error "$module_name: acl.d JSON is INVALID"
        fi
    fi
done < <(get_luci_apps)
echo ""

# Check 6: Verify ubus object naming convention
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Validating ubus object naming convention"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while IFS= read -r module_dir; do
    [[ ! -d "$module_dir" ]] && continue
    module_name=$(basename "$module_dir")

    # Extract ubus object names from JavaScript
    set +e
    js_objects=$(find "$module_dir/htdocs" -name "*.js" -type f 2>/dev/null | \
        xargs grep -h "object:" 2>/dev/null | \
        grep -o "'[^']*'" | sort -u | tr -d "'")
    set -e

    if [ -n "$js_objects" ]; then
        for obj in $js_objects; do
            if [[ "$obj" == "service" || "$obj" == "file" ]]; then
                continue
            fi
            # Check if object starts with 'luci.'
            if [[ $obj == luci.* ]]; then
                success "$module_name: ubus object '$obj' follows naming convention (luci.* prefix)"
            else
                error "$module_name: ubus object '$obj' does NOT follow naming convention (missing luci. prefix)"
            fi
        done
    fi
done < <(get_luci_apps)
echo ""

# Check 7: htdocs files must have correct permissions (644 for web server)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Validating htdocs file permissions (CSS/JS must be 644)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PERMISSION_ERRORS=0

while IFS= read -r module_dir; do
    [[ ! -d "$module_dir" ]] && continue
    module_name=$(basename "$module_dir")
    htdocs_dir="$module_dir/htdocs"

    if [ -d "$htdocs_dir" ]; then
        # Check CSS files
        while IFS= read -r css_file; do
            if [ -n "$css_file" ]; then
                perms=$(stat -c "%a" "$css_file" 2>/dev/null)
                if [ "$perms" != "644" ]; then
                    error "$module_name: CSS file has wrong permissions: $css_file ($perms, should be 644)"
                    echo "  → Run: chmod 644 $css_file"
                    ((PERMISSION_ERRORS++))
                else
                    success "$module_name: CSS file has correct permissions (644): $(basename $css_file)"
                fi
            fi
        done < <(find "$htdocs_dir" -name "*.css" -type f 2>/dev/null)

        # Check JS files
        while IFS= read -r js_file; do
            if [ -n "$js_file" ]; then
                perms=$(stat -c "%a" "$js_file" 2>/dev/null)
                if [ "$perms" != "644" ]; then
                    error "$module_name: JS file has wrong permissions: $js_file ($perms, should be 644)"
                    echo "  → Run: chmod 644 $js_file"
                    ((PERMISSION_ERRORS++))
                else
                    success "$module_name: JS file has correct permissions (644): $(basename $js_file)"
                fi
            fi
        done < <(find "$htdocs_dir" -name "*.js" -type f 2>/dev/null)
    fi
done < <(get_luci_apps)

if [ $PERMISSION_ERRORS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  To fix all permission errors automatically, run:${NC}"
    echo "  ./secubox-tools/fix-permissions.sh --local"
fi
echo ""

# Add permission errors to total error count
TOTAL_ERRORS=$((ERRORS + PERMISSION_ERRORS))

# Summary
echo "========================================"
echo "Validation Summary"
echo "========================================"
echo ""
if [ $TOTAL_ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
elif [ $TOTAL_ERRORS -eq 0 ]; then
    echo -e "${YELLOW}✓ All critical checks passed with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${RED}✗ Found $TOTAL_ERRORS error(s) and $WARNINGS warning(s)${NC}"
    if [ $PERMISSION_ERRORS -gt 0 ]; then
        echo -e "${YELLOW}   ($PERMISSION_ERRORS permission error(s))${NC}"
    fi
    echo ""
    echo "Please fix the errors listed above before deploying."
    echo "Run: ./secubox-tools/fix-permissions.sh --local"
    exit 1
fi
