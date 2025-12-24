#!/bin/bash
#
# SecuBox Module Validation Script
# Validates RPCD naming, menu paths, and module structure
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "========================================"
echo "SecuBox Module Validation"
echo "========================================"
echo ""

# Function to print error
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((ERRORS++))
}

# Function to print warning
warn() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
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

for module_dir in luci-app-*/; do
    module_name=$(basename "$module_dir")
    echo "Checking $module_name..."

    # Find RPCD script
    rpcd_dir="$module_dir/root/usr/libexec/rpcd"
    if [ -d "$rpcd_dir" ]; then
        rpcd_script=$(find "$rpcd_dir" -type f ! -name "*.md" 2>/dev/null | head -1)

        if [ -n "$rpcd_script" ]; then
            rpcd_name=$(basename "$rpcd_script")

            # Extract ubus object names from JavaScript files
            js_objects=$(find "$module_dir/htdocs" -name "*.js" -type f 2>/dev/null | \
                xargs grep -h "object:" 2>/dev/null | \
                grep -o "'[^']*'" | sort -u | tr -d "'")

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
done

# Check 2: Menu paths must match actual view file locations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Validating menu paths vs view file locations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for module_dir in luci-app-*/; do
    module_name=$(basename "$module_dir")
    menu_file="$module_dir/root/usr/share/luci/menu.d/${module_name}.json"

    if [ -f "$menu_file" ]; then
        echo "Checking $module_name menu paths..."

        # Extract all view paths from menu JSON
        menu_paths=$(grep -o '"path":\s*"[^"]*"' "$menu_file" | cut -d'"' -f4)

        for path in $menu_paths; do
            # Convert menu path to file path
            view_file="$module_dir/htdocs/luci-static/resources/view/${path}.js"

            if [ -f "$view_file" ]; then
                success "$module_name: Menu path '$path' → file exists"
            else
                error "$module_name: Menu path '$path' → file NOT found at $view_file"

                # Suggest possible matches
                view_dir=$(dirname "$view_file")
                if [ -d "$view_dir" ]; then
                    echo "  → Possible files in $(dirname $path):"
                    find "$view_dir" -name "*.js" -type f | while read -r f; do
                        echo "     - $(basename $f)"
                    done
                fi
            fi
        done
        echo ""
    fi
done

# Check 3: View files must have corresponding menu entries
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Validating view files have menu entries"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for module_dir in luci-app-*/; do
    module_name=$(basename "$module_dir")
    view_dir="$module_dir/htdocs/luci-static/resources/view"
    menu_file="$module_dir/root/usr/share/luci/menu.d/${module_name}.json"

    if [ -d "$view_dir" ] && [ -f "$menu_file" ]; then
        echo "Checking $module_name view files..."

        # Find all .js view files
        find "$view_dir" -name "*.js" -type f | while read -r view_file; do
            # Convert file path to menu path
            rel_path=$(echo "$view_file" | sed "s|$module_dir/htdocs/luci-static/resources/view/||" | sed 's|.js$||')

            # Check if path exists in menu
            if grep -q "\"path\":\s*\"$rel_path\"" "$menu_file"; then
                success "$module_name: View '$rel_path.js' has menu entry"
            else
                warn "$module_name: View file '$rel_path.js' exists but has no menu entry"
            fi
        done
        echo ""
    fi
done

# Check 4: RPCD scripts must be executable
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Validating RPCD script permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for module_dir in luci-app-*/; do
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
done
echo ""

# Check 5: JSON files must be valid
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Validating JSON syntax"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for module_dir in luci-app-*/; do
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
done
echo ""

# Check 6: Verify ubus object naming convention
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Validating ubus object naming convention"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for module_dir in luci-app-*/; do
    module_name=$(basename "$module_dir")

    # Extract ubus object names from JavaScript
    js_objects=$(find "$module_dir/htdocs" -name "*.js" -type f 2>/dev/null | \
        xargs grep -h "object:" 2>/dev/null | \
        grep -o "'[^']*'" | sort -u | tr -d "'")

    if [ -n "$js_objects" ]; then
        for obj in $js_objects; do
            # Check if object starts with 'luci.'
            if [[ $obj == luci.* ]]; then
                success "$module_name: ubus object '$obj' follows naming convention (luci.* prefix)"
            else
                error "$module_name: ubus object '$obj' does NOT follow naming convention (missing luci. prefix)"
            fi
        done
    fi
done
echo ""

# Summary
echo "========================================"
echo "Validation Summary"
echo "========================================"
echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}✓ All critical checks passed with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors listed above before deploying."
    exit 1
fi
