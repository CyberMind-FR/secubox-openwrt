#!/bin/bash
# cleanup-packages.sh
# Script to fix common issues in SecuBox package structure

set -e

echo "🧹 SecuBox Package Cleanup Script"
echo "=================================="
echo ""

ERRORS=0
FIXES=0

# 1. Remove malformed {htdocs directories
echo "📁 Checking for malformed directories..."
for pkg in luci-app-*/; do
    if [[ -d "${pkg}{htdocs" ]]; then
        echo "  ❌ Found malformed directory: ${pkg}{htdocs"
        echo "     → Removing..."
        rm -rf "${pkg}{htdocs"
        FIXES=$((FIXES + 1))
    fi
done

# 2. Ensure htdocs structure exists
echo ""
echo "📁 Checking htdocs structure..."
for pkg in luci-app-*/; do
    if [[ -d "$pkg" ]]; then
        PKG_NAME=$(basename "$pkg")
        
        # Create htdocs structure if missing
        if [[ ! -d "${pkg}htdocs/luci-static/resources/view" ]]; then
            echo "  ⚠️ Missing htdocs structure in $PKG_NAME"
            mkdir -p "${pkg}htdocs/luci-static/resources/view"
            FIXES=$((FIXES + 1))
        fi
    fi
done

# 3. Fix file permissions
echo ""
echo "🔐 Fixing file permissions..."
for pkg in luci-app-*/; do
    # RPCD scripts
    if [[ -d "${pkg}root/usr/libexec/rpcd" ]]; then
        for script in "${pkg}root/usr/libexec/rpcd/"*; do
            if [[ -f "$script" && ! -x "$script" ]]; then
                echo "  → Making executable: $script"
                chmod +x "$script"
                FIXES=$((FIXES + 1))
            fi
        done
    fi
    
    # Init scripts
    if [[ -d "${pkg}root/etc/init.d" ]]; then
        for script in "${pkg}root/etc/init.d/"*; do
            if [[ -f "$script" && ! -x "$script" ]]; then
                echo "  → Making executable: $script"
                chmod +x "$script"
                FIXES=$((FIXES + 1))
            fi
        done
    fi
    
    # UCI defaults
    if [[ -d "${pkg}root/etc/uci-defaults" ]]; then
        for script in "${pkg}root/etc/uci-defaults/"*; do
            if [[ -f "$script" && ! -x "$script" ]]; then
                echo "  → Making executable: $script"
                chmod +x "$script"
                FIXES=$((FIXES + 1))
            fi
        done
    fi
done

# 4. Validate Makefiles
echo ""
echo "📋 Validating Makefiles..."
for makefile in luci-app-*/Makefile; do
    if [[ -f "$makefile" ]]; then
        PKG=$(dirname "$makefile")
        PKG_NAME=$(basename "$PKG")
        
        # Check PKG_NAME matches directory
        MAKEFILE_PKG_NAME=$(grep "^PKG_NAME:=" "$makefile" | cut -d'=' -f2)
        if [[ "$MAKEFILE_PKG_NAME" != "$PKG_NAME" ]]; then
            echo "  ❌ PKG_NAME mismatch in $PKG_NAME"
            echo "     Directory: $PKG_NAME"
            echo "     Makefile:  $MAKEFILE_PKG_NAME"
            ERRORS=$((ERRORS + 1))
        fi
        
        # Check required fields
        for field in PKG_VERSION PKG_RELEASE PKG_LICENSE; do
            if ! grep -q "^${field}:=" "$makefile"; then
                echo "  ⚠️ Missing $field in $PKG_NAME/Makefile"
            fi
        done
        
        # Check include statement
        if ! grep -q "include.*luci.mk" "$makefile"; then
            echo "  ⚠️ Missing 'include \$(TOPDIR)/feeds/luci/luci.mk' in $PKG_NAME"
        fi
    fi
done

# 5. Check for required directories
echo ""
echo "📂 Checking required structure..."
for pkg in luci-app-*/; do
    if [[ -d "$pkg" ]]; then
        PKG_NAME=$(basename "$pkg")
        
        REQUIRED_DIRS=(
            "root/usr/share/luci/menu.d"
            "root/usr/share/rpcd/acl.d"
        )
        
        for dir in "${REQUIRED_DIRS[@]}"; do
            if [[ ! -d "${pkg}${dir}" ]]; then
                echo "  ⚠️ Creating missing: ${PKG_NAME}/${dir}"
                mkdir -p "${pkg}${dir}"
                FIXES=$((FIXES + 1))
            fi
        done
    fi
done

# 6. Summary
echo ""
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo "Fixes applied: $FIXES"
echo "Errors found:  $ERRORS"

if [[ $ERRORS -gt 0 ]]; then
    echo ""
    echo "⚠️ Please fix the errors above manually"
    exit 1
fi

echo ""
echo "✅ Cleanup complete!"
