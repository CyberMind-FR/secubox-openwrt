#!/bin/bash
#
# validate-module-generation.sh
# ============================
# Validates a newly generated or modified SecuBox module
# Ensures all naming conventions, file structures, and integrations are correct
#
# Usage:
#   ./validate-module-generation.sh <module-directory>
#   ./validate-module-generation.sh luci-app-cdn-cache
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
CHECKS=0

MODULE_DIR="$1"

if [ -z "$MODULE_DIR" ]; then
    echo "Usage: $0 <module-directory>"
    echo "Example: $0 luci-app-cdn-cache"
    exit 1
fi

if [ ! -d "$MODULE_DIR" ]; then
    echo -e "${RED}Error: Directory $MODULE_DIR not found${NC}"
    exit 1
fi

MODULE_NAME=$(basename "$MODULE_DIR" | sed 's/^luci-app-//')
PKG_NAME=$(basename "$MODULE_DIR")

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}Module Generation Validation: $MODULE_NAME${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

error() {
    echo -e "  ${RED}✗ ERROR: $1${NC}"
    ((ERRORS++))
}

warn() {
    echo -e "  ${YELLOW}⚠ WARNING: $1${NC}"
    ((WARNINGS++))
}

success() {
    echo -e "  ${GREEN}✓ $1${NC}"
    ((CHECKS++))
}

info() {
    echo -e "  ${CYAN}→ $1${NC}"
}

section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================
# 1. Check Makefile
# ============================================
section "1. Validating Makefile"

MAKEFILE="$MODULE_DIR/Makefile"

if [ ! -f "$MAKEFILE" ]; then
    error "Makefile is missing"
else
    success "Makefile exists"

    # Check required fields
    REQUIRED_FIELDS=("PKG_NAME" "PKG_VERSION" "PKG_RELEASE" "PKG_LICENSE" "LUCI_TITLE" "LUCI_DEPENDS")

    for field in "${REQUIRED_FIELDS[@]}"; do
        if grep -q "^${field}" "$MAKEFILE"; then
            success "Makefile has $field"
        else
            error "Makefile missing $field"
        fi
    done

    # Check PKG_NAME matches directory
    if grep -q "^PKG_NAME.*${PKG_NAME}" "$MAKEFILE"; then
        success "PKG_NAME matches directory name"
    else
        error "PKG_NAME in Makefile doesn't match directory name"
    fi

    # Check luci.mk include
    if grep -q 'include.*luci\.mk' "$MAKEFILE"; then
        success "Includes luci.mk"
    else
        error "Missing include for luci.mk"
    fi

    # Check for proper dependencies
    if grep -q 'LUCI_DEPENDS.*+luci-base.*+rpcd' "$MAKEFILE"; then
        success "Has required dependencies (luci-base, rpcd)"
    else
        warn "Missing standard dependencies (luci-base, rpcd)"
    fi
fi

# ============================================
# 2. Check RPCD Script
# ============================================
section "2. Validating RPCD Backend"

RPCD_DIR="$MODULE_DIR/root/usr/libexec/rpcd"
RPCD_SCRIPT=""

if [ ! -d "$RPCD_DIR" ]; then
    error "RPCD directory missing: $RPCD_DIR"
else
    # Find RPCD script
    RPCD_COUNT=$(find "$RPCD_DIR" -type f ! -name "*.md" 2>/dev/null | wc -l)

    if [ "$RPCD_COUNT" -eq 0 ]; then
        error "No RPCD script found in $RPCD_DIR"
    elif [ "$RPCD_COUNT" -gt 1 ]; then
        warn "Multiple RPCD scripts found (expected 1)"
        find "$RPCD_DIR" -type f ! -name "*.md" -exec basename {} \;
    else
        RPCD_SCRIPT=$(find "$RPCD_DIR" -type f ! -name "*.md" 2>/dev/null | head -1)
        RPCD_NAME=$(basename "$RPCD_SCRIPT")

        success "Found RPCD script: $RPCD_NAME"

        # CRITICAL: Check naming convention
        if [[ $RPCD_NAME == luci.* ]]; then
            success "RPCD script follows naming convention (luci.* prefix)"
        else
            error "RPCD script MUST start with 'luci.' prefix (found: $RPCD_NAME)"
            info "Expected: luci.$MODULE_NAME or similar"
        fi

        # Check executable
        if [ -x "$RPCD_SCRIPT" ]; then
            success "RPCD script is executable"
        else
            error "RPCD script is NOT executable"
            info "Fix: chmod +x $RPCD_SCRIPT"
        fi

        # Check shebang
        if head -1 "$RPCD_SCRIPT" | grep -q '^#!/bin/sh\|^#!/bin/bash'; then
            success "RPCD script has valid shebang"
        else
            error "RPCD script missing or invalid shebang"
        fi

        # Check required structure
        if grep -q 'case "\$1" in' "$RPCD_SCRIPT"; then
            success "RPCD script has case structure for method routing"
        else
            warn "RPCD script might be missing case structure"
        fi

        if grep -q 'list)' "$RPCD_SCRIPT" && grep -q 'call)' "$RPCD_SCRIPT"; then
            success "RPCD script has list and call handlers"
        else
            error "RPCD script missing list or call handlers"
        fi

        # Extract RPCD methods
        info "Extracting RPCD methods..."
        RPCD_METHODS=$(grep -A 50 'case "\$2" in' "$RPCD_SCRIPT" 2>/dev/null | grep -E '^\s+[a-z_]+\)' | sed 's/[[:space:]]*\(.*\))/\1/' | tr '\n' ' ')

        if [ -n "$RPCD_METHODS" ]; then
            info "Found methods: $RPCD_METHODS"
        else
            warn "Could not extract RPCD methods"
        fi
    fi
fi

# ============================================
# 3. Check ACL File
# ============================================
section "3. Validating ACL Permissions"

ACL_FILE="$MODULE_DIR/root/usr/share/rpcd/acl.d/${PKG_NAME}.json"

if [ ! -f "$ACL_FILE" ]; then
    error "ACL file missing: $ACL_FILE"
else
    success "ACL file exists"

    # Validate JSON syntax
    if python3 -m json.tool "$ACL_FILE" > /dev/null 2>&1; then
        success "ACL JSON is valid"
    else
        error "ACL JSON is INVALID - syntax error"
    fi

    # Check structure
    if grep -q '"read":' "$ACL_FILE" && grep -q '"write":' "$ACL_FILE"; then
        success "ACL has read and write sections"
    else
        warn "ACL might be missing read or write sections"
    fi

    # Extract ubus object from ACL
    ACL_UBUS_OBJECTS=$(grep -o '"luci\.[^"]*"' "$ACL_FILE" | sort -u | tr -d '"' | tr '\n' ' ')

    if [ -n "$ACL_UBUS_OBJECTS" ]; then
        success "ACL defines ubus objects: $ACL_UBUS_OBJECTS"

        # CRITICAL: Check if RPCD script name matches ACL ubus object
        if [ -n "$RPCD_SCRIPT" ]; then
            RPCD_NAME=$(basename "$RPCD_SCRIPT")

            MATCH_FOUND=false
            for obj in $ACL_UBUS_OBJECTS; do
                if [ "$RPCD_NAME" = "$obj" ]; then
                    success "CRITICAL: RPCD script name '$RPCD_NAME' matches ACL ubus object '$obj'"
                    MATCH_FOUND=true
                    break
                fi
            done

            if [ "$MATCH_FOUND" = false ]; then
                error "CRITICAL: RPCD script name '$RPCD_NAME' does NOT match any ACL ubus object"
                info "ACL objects: $ACL_UBUS_OBJECTS"
                info "This will cause RPC errors: 'Object not found'"
            fi
        fi
    else
        error "No ubus objects defined in ACL (must have luci.* objects)"
    fi

    # Check if RPCD methods are in ACL
    if [ -n "$RPCD_METHODS" ] && [ -n "$ACL_UBUS_OBJECTS" ]; then
        info "Checking if RPCD methods are in ACL permissions..."

        for method in $RPCD_METHODS; do
            if grep -q "\"$method\"" "$ACL_FILE"; then
                success "Method '$method' is in ACL"
            else
                warn "Method '$method' from RPCD not found in ACL"
            fi
        done
    fi
fi

# ============================================
# 4. Check Menu File
# ============================================
section "4. Validating Menu Definition"

MENU_FILE="$MODULE_DIR/root/usr/share/luci/menu.d/${PKG_NAME}.json"

if [ ! -f "$MENU_FILE" ]; then
    error "Menu file missing: $MENU_FILE"
else
    success "Menu file exists"

    # Validate JSON
    if python3 -m json.tool "$MENU_FILE" > /dev/null 2>&1; then
        success "Menu JSON is valid"
    else
        error "Menu JSON is INVALID - syntax error"
    fi

    # Extract view paths from menu
    MENU_PATHS=$(grep -o '"path":\s*"[^"]*"' "$MENU_FILE" | cut -d'"' -f4)

    if [ -n "$MENU_PATHS" ]; then
        info "Found menu paths:"
        echo "$MENU_PATHS" | while read -r path; do
            info "  - $path"

            # CRITICAL: Check if view file exists
            VIEW_FILE="$MODULE_DIR/htdocs/luci-static/resources/view/${path}.js"

            if [ -f "$VIEW_FILE" ]; then
                success "Menu path '$path' → view file EXISTS"
            else
                error "Menu path '$path' → view file NOT FOUND: $VIEW_FILE"
                info "This will cause HTTP 404 errors"
            fi
        done
    else
        warn "No view paths found in menu (might use different structure)"
    fi

    # Check if menu references ACL
    if grep -q "\"acl\".*${PKG_NAME}" "$MENU_FILE"; then
        success "Menu references ACL: $PKG_NAME"
    else
        warn "Menu might not reference ACL properly"
    fi
fi

# ============================================
# 5. Check JavaScript Views
# ============================================
section "5. Validating JavaScript Views"

VIEW_DIR="$MODULE_DIR/htdocs/luci-static/resources/view"

if [ ! -d "$VIEW_DIR" ]; then
    warn "View directory missing: $VIEW_DIR"
else
    VIEW_COUNT=$(find "$VIEW_DIR" -name "*.js" -type f 2>/dev/null | wc -l)

    if [ "$VIEW_COUNT" -eq 0 ]; then
        warn "No JavaScript view files found"
    else
        success "Found $VIEW_COUNT view file(s)"

        # Check each view file
        find "$VIEW_DIR" -name "*.js" -type f 2>/dev/null | while read -r view_file; do
            rel_path=$(echo "$view_file" | sed "s|$MODULE_DIR/htdocs/luci-static/resources/view/||" | sed 's|.js$||')

            # Check strict mode
            if head -5 "$view_file" | grep -q "'use strict'"; then
                success "View '$rel_path' has 'use strict'"
            else
                warn "View '$rel_path' missing 'use strict'"
            fi

            # Extract ubus object declarations
            VIEW_UBUS_OBJECTS=$(grep -o "object:\s*['\"][^'\"]*['\"]" "$view_file" | grep -o "['\"]luci\.[^'\"]*['\"]" | tr -d "\"'" | sort -u | tr '\n' ' ')

            if [ -n "$VIEW_UBUS_OBJECTS" ]; then
                info "View '$rel_path' uses ubus objects: $VIEW_UBUS_OBJECTS"

                # CRITICAL: Check if ubus object matches RPCD script
                if [ -n "$RPCD_SCRIPT" ]; then
                    RPCD_NAME=$(basename "$RPCD_SCRIPT")

                    for obj in $VIEW_UBUS_OBJECTS; do
                        if [ "$RPCD_NAME" = "$obj" ]; then
                            success "View ubus object '$obj' matches RPCD script '$RPCD_NAME'"
                        else
                            if [ -n "$ACL_UBUS_OBJECTS" ] && echo "$ACL_UBUS_OBJECTS" | grep -q "$obj"; then
                                success "View ubus object '$obj' is in ACL"
                            else
                                error "View ubus object '$obj' does NOT match RPCD '$RPCD_NAME' or ACL objects"
                            fi
                        fi
                    done
                fi
            fi

            # Extract RPC method calls
            VIEW_METHODS=$(grep -o "method:\s*['\"][^'\"]*['\"]" "$view_file" | cut -d"'" -f2 | cut -d'"' -f2 | sort -u | tr '\n' ' ')

            if [ -n "$VIEW_METHODS" ] && [ -n "$RPCD_METHODS" ]; then
                info "Checking if view RPC methods exist in RPCD..."

                for method in $VIEW_METHODS; do
                    if echo "$RPCD_METHODS" | grep -qw "$method"; then
                        success "Method '$method' exists in RPCD"
                    else
                        error "Method '$method' called in view but NOT in RPCD"
                    fi
                done
            fi
        done
    fi
fi

# ============================================
# 6. Check UCI Config (Optional)
# ============================================
section "6. Checking UCI Configuration (Optional)"

MODULE_UNDERSCORE=$(echo "$MODULE_NAME" | tr '-' '_')
UCI_CONFIG="$MODULE_DIR/root/etc/config/$MODULE_UNDERSCORE"

if [ -f "$UCI_CONFIG" ]; then
    success "UCI config file exists: $MODULE_UNDERSCORE"

    # Basic validation
    if grep -q '^config ' "$UCI_CONFIG"; then
        success "UCI config has valid structure"
    else
        warn "UCI config might have invalid structure"
    fi
else
    info "No UCI config file (optional for many modules)"
fi

# ============================================
# 7. Check File Permissions
# ============================================
section "7. Validating File Permissions"

# All RPCD scripts must be executable
if [ -d "$RPCD_DIR" ]; then
    NON_EXEC_RPCD=$(find "$RPCD_DIR" -type f ! -executable ! -name "*.md" 2>/dev/null)

    if [ -n "$NON_EXEC_RPCD" ]; then
        error "Found non-executable RPCD scripts:"
        echo "$NON_EXEC_RPCD" | while read -r f; do
            error "  - $f (need chmod +x)"
        done
    else
        success "All RPCD scripts are executable"
    fi
fi

# ============================================
# 8. Security Checks
# ============================================
section "8. Security Checks"

# Check for hardcoded credentials
if [ -n "$RPCD_SCRIPT" ]; then
    if grep -qi 'password\s*=\|secret\s*=' "$RPCD_SCRIPT"; then
        warn "RPCD script might contain hardcoded credentials"
    else
        success "No obvious hardcoded credentials in RPCD"
    fi
fi

# Check for dangerous commands
if [ -n "$RPCD_SCRIPT" ]; then
    DANGEROUS_CMDS="rm -rf|mkfs|dd if=|format|shutdown -h"

    if grep -E "$DANGEROUS_CMDS" "$RPCD_SCRIPT" > /dev/null 2>&1; then
        warn "RPCD script contains potentially dangerous commands - review carefully"
    else
        success "No obviously dangerous commands in RPCD"
    fi
fi

# Check for SQL injection patterns (if using sqlite/mysql)
if [ -n "$RPCD_SCRIPT" ]; then
    if grep -q 'sqlite3\|mysql' "$RPCD_SCRIPT"; then
        if grep -q '\$[A-Za-z_]*' "$RPCD_SCRIPT" | grep -q 'SELECT\|INSERT\|UPDATE'; then
            warn "Possible SQL injection risk - ensure proper escaping"
        fi
    fi
fi

# ============================================
# 9. Documentation Check
# ============================================
section "9. Documentation Check"

README="$MODULE_DIR/README.md"

if [ -f "$README" ]; then
    success "README.md exists"

    if wc -l "$README" | awk '{print $1}' | grep -q '^[0-9]\+$' && [ "$(wc -l < "$README")" -gt 10 ]; then
        success "README has substantial content ($(wc -l < "$README") lines)"
    else
        warn "README seems short or empty"
    fi
else
    warn "README.md missing (recommended for documentation)"
fi

# ============================================
# Summary
# ============================================
section "Validation Summary"

echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ ALL CHECKS PASSED - Module is ready for deployment!              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ✓ Critical checks passed with $WARNINGS warning(s)                      ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Module can be deployed, but review warnings above.${NC}"
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ VALIDATION FAILED - Found $ERRORS error(s) and $WARNINGS warning(s)        ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Please fix the errors above before deploying this module.${NC}"
    echo ""
    echo -e "${CYAN}Common fixes:${NC}"
    echo "  1. Rename RPCD script to match ubus object (must use luci. prefix)"
    echo "  2. Update menu paths to match view file locations"
    echo "  3. Add missing RPCD methods to ACL permissions"
    echo "  4. Make RPCD script executable: chmod +x"
    echo ""
    exit 1
fi
