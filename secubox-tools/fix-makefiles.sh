#!/bin/bash
# fix-makefiles.sh
# Script to fix Makefiles for OpenWrt LuCI packages

set -e

echo "🔧 SecuBox Makefile Fixer"
echo "========================="
echo ""

FIXED=0
SKIPPED=0

for makefile in luci-app-*/Makefile; do
    if [[ ! -f "$makefile" ]]; then
        continue
    fi
    
    PKG_DIR=$(dirname "$makefile")
    PKG_NAME=$(basename "$PKG_DIR")
    
    echo "📦 Processing: $PKG_NAME"
    
    # Check if already has luci.mk include
    if grep -q 'include.*feeds/luci/luci\.mk' "$makefile"; then
        echo "   ✅ Already has luci.mk include"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # Check if has package.mk include (alternative valid format)
    if grep -q 'include.*package\.mk' "$makefile" && grep -q 'BuildPackage' "$makefile"; then
        echo "   ✅ Uses package.mk with BuildPackage (valid)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # Need to fix - create backup first
    cp "$makefile" "${makefile}.bak"
    
    # Extract existing values
    PKG_VERSION=$(grep "^PKG_VERSION:=" "$makefile" | cut -d'=' -f2 || echo "1.0.0")
    PKG_RELEASE=$(grep "^PKG_RELEASE:=" "$makefile" | cut -d'=' -f2 || echo "1")
    PKG_LICENSE=$(grep "^PKG_LICENSE:=" "$makefile" | cut -d'=' -f2 || echo "Apache-2.0")
    LUCI_TITLE=$(grep "^LUCI_TITLE:=" "$makefile" | cut -d'=' -f2- || echo "LuCI - $PKG_NAME")
    LUCI_DEPENDS=$(grep "^LUCI_DEPENDS:=" "$makefile" | cut -d'=' -f2- || echo "+luci-base")
    
    # If no LUCI_TITLE, try to extract from define Package section
    if [[ -z "$LUCI_TITLE" || "$LUCI_TITLE" == "LuCI - $PKG_NAME" ]]; then
        TITLE_LINE=$(grep -A5 "define Package/" "$makefile" | grep "TITLE" | head -1 | cut -d'=' -f2-)
        if [[ -n "$TITLE_LINE" ]]; then
            LUCI_TITLE="$TITLE_LINE"
        fi
    fi
    
    # Generate new Makefile
    cat > "$makefile" << MAKEFILE_EOF
include \$(TOPDIR)/rules.mk

PKG_NAME:=${PKG_NAME}
PKG_VERSION:=${PKG_VERSION:-1.0.0}
PKG_RELEASE:=${PKG_RELEASE:-1}
PKG_LICENSE:=${PKG_LICENSE:-Apache-2.0}
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=${LUCI_TITLE:-LuCI - SecuBox Module}
LUCI_DEPENDS:=${LUCI_DEPENDS:-+luci-base}
LUCI_PKGARCH:=all

include \$(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildance
MAKEFILE_EOF
    
    echo "   🔧 Fixed Makefile (backup: ${makefile}.bak)"
    FIXED=$((FIXED + 1))
    
done

echo ""
echo "========================="
echo "📊 Summary"
echo "========================="
echo "Fixed:   $FIXED"
echo "Skipped: $SKIPPED"
echo ""

if [[ $FIXED -gt 0 ]]; then
    echo "⚠️  Review the fixed Makefiles and adjust LUCI_TITLE and LUCI_DEPENDS as needed"
    echo ""
    echo "📝 Example correct values:"
    echo "   LUCI_TITLE:=LuCI - CrowdSec Security Dashboard"
    echo "   LUCI_DEPENDS:=+luci-base +rpcd +curl"
fi

echo ""
echo "✅ Done!"
