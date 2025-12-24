#!/bin/bash
#
# pre-push-validation.sh
# ======================
# Git pre-push hook for SecuBox repository
# Validates all modules before allowing push to remote
#
# Installation:
#   ln -s ../../secubox-tools/pre-push-validation.sh .git/hooks/pre-push
#   chmod +x .git/hooks/pre-push
#
# Or run manually:
#   ./secubox-tools/pre-push-validation.sh
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}SecuBox Pre-Push Validation${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

error() {
    echo -e "${RED}✗ $1${NC}"
    ((ERRORS++))
}

warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

info() {
    echo -e "${CYAN}→ $1${NC}"
}

section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

cd "$REPO_ROOT"

# ============================================
# 1. Check Git Status
# ============================================
section "1. Git Status Check"

if git diff --cached --quiet; then
    warn "No staged changes to commit"
else
    success "Staged changes detected"
fi

# Get list of modified module directories
MODIFIED_MODULES=$(git diff --cached --name-only | grep '^luci-app-' | cut -d'/' -f1 | sort -u)

if [ -z "$MODIFIED_MODULES" ]; then
    info "No module files modified in this commit"
else
    info "Modified modules in this commit:"
    echo "$MODIFIED_MODULES" | while read -r mod; do
        echo "  - $mod"
    done
fi

# ============================================
# 2. Critical Naming Convention Checks
# ============================================
section "2. Critical Naming Conventions"

info "Checking RPCD script names match ubus object names..."
echo ""

for module_dir in luci-app-*/; do
    [ -d "$module_dir" ] || continue

    module_name=$(basename "$module_dir")
    rpcd_dir="$module_dir/root/usr/libexec/rpcd"

    if [ -d "$rpcd_dir" ]; then
        rpcd_script=$(find "$rpcd_dir" -type f ! -name "*.md" 2>/dev/null | head -1)

        if [ -n "$rpcd_script" ]; then
            rpcd_name=$(basename "$rpcd_script")

            # Extract ubus object from JavaScript
            js_objects=$(find "$module_dir/htdocs" -name "*.js" -type f 2>/dev/null | \
                xargs grep -h "object:" 2>/dev/null | \
                grep -o "'[^']*'" | grep "luci\." | tr -d "'" | sort -u)

            if [ -n "$js_objects" ]; then
                match_found=false

                for obj in $js_objects; do
                    if [ "$rpcd_name" = "$obj" ]; then
                        success "$module_name: RPCD '$rpcd_name' matches ubus object '$obj'"
                        match_found=true
                        break
                    fi
                done

                if [ "$match_found" = false ]; then
                    error "$module_name: RPCD '$rpcd_name' does NOT match ubus objects: $js_objects"
                    info "  Fix: Rename $rpcd_script to one of: $js_objects"
                fi
            fi

            # Check naming convention
            if [[ ! $rpcd_name == luci.* ]]; then
                error "$module_name: RPCD script '$rpcd_name' missing 'luci.' prefix"
                info "  All RPCD scripts MUST start with 'luci.'"
            fi
        fi
    fi
done

# ============================================
# 3. Menu Path Validation
# ============================================
section "3. Menu Path vs View File Validation"

info "Checking menu paths match view file locations..."
echo ""

for module_dir in luci-app-*/; do
    [ -d "$module_dir" ] || continue

    module_name=$(basename "$module_dir")
    menu_file="$module_dir/root/usr/share/luci/menu.d/${module_name}.json"

    if [ -f "$menu_file" ]; then
        # Extract paths from menu
        menu_paths=$(grep -o '"path":\s*"[^"]*"' "$menu_file" | cut -d'"' -f4)

        for path in $menu_paths; do
            view_file="$module_dir/htdocs/luci-static/resources/view/${path}.js"

            if [ -f "$view_file" ]; then
                success "$module_name: Menu path '$path' → file exists"
            else
                error "$module_name: Menu path '$path' → file NOT FOUND"
                info "  Expected: $view_file"
            fi
        done
    fi
done

# ============================================
# 4. JSON Validation
# ============================================
section "4. JSON Syntax Validation"

info "Validating all JSON files..."
echo ""

find . -name "*.json" -path "*/luci-app-*" ! -path "*/.git/*" | while read -r json_file; do
    if python3 -m json.tool "$json_file" > /dev/null 2>&1; then
        success "$(echo "$json_file" | cut -d'/' -f1-2): $(basename "$json_file") is valid"
    else
        error "Invalid JSON: $json_file"
    fi
done

# ============================================
# 5. RPCD Executable Check
# ============================================
section "5. RPCD Script Permissions"

info "Checking RPCD scripts are executable..."
echo ""

for module_dir in luci-app-*/; do
    [ -d "$module_dir" ] || continue

    module_name=$(basename "$module_dir")
    rpcd_dir="$module_dir/root/usr/libexec/rpcd"

    if [ -d "$rpcd_dir" ]; then
        find "$rpcd_dir" -type f ! -name "*.md" 2>/dev/null | while read -r script; do
            if [ -x "$script" ]; then
                success "$module_name: $(basename "$script") is executable"
            else
                error "$module_name: $(basename "$script") is NOT executable"
                info "  Fix: chmod +x $script"
            fi
        done
    fi
done

# ============================================
# 6. ACL Method Coverage
# ============================================
section "6. ACL Method Coverage"

info "Checking ACL permissions cover RPCD methods..."
echo ""

for module_dir in luci-app-*/; do
    [ -d "$module_dir" ] || continue

    module_name=$(basename "$module_dir")
    rpcd_dir="$module_dir/root/usr/libexec/rpcd"
    acl_file="$module_dir/root/usr/share/rpcd/acl.d/${module_name}.json"

    if [ -d "$rpcd_dir" ] && [ -f "$acl_file" ]; then
        rpcd_script=$(find "$rpcd_dir" -type f ! -name "*.md" 2>/dev/null | head -1)

        if [ -n "$rpcd_script" ]; then
            # Extract methods from RPCD
            rpcd_methods=$(grep -A 50 'case "\$2" in' "$rpcd_script" 2>/dev/null | \
                grep -E '^\s+[a-z_]+\)' | \
                sed 's/[[:space:]]*\(.*\))/\1/' | \
                grep -v '^\*')

            # Check each method is in ACL
            for method in $rpcd_methods; do
                if grep -q "\"$method\"" "$acl_file"; then
                    success "$module_name: Method '$method' is in ACL"
                else
                    warn "$module_name: Method '$method' from RPCD not in ACL"
                fi
            done
        fi
    fi
done

# ============================================
# 7. Makefile Validation
# ============================================
section "7. Makefile Validation"

info "Checking Makefiles have required fields..."
echo ""

for module_dir in luci-app-*/; do
    [ -d "$module_dir" ] || continue

    module_name=$(basename "$module_dir")
    makefile="$module_dir/Makefile"

    if [ ! -f "$makefile" ]; then
        error "$module_name: Makefile missing"
        continue
    fi

    # Check required fields
    required_fields=("PKG_NAME" "PKG_VERSION" "PKG_RELEASE" "PKG_LICENSE" "LUCI_TITLE")
    missing=()

    for field in "${required_fields[@]}"; do
        if ! grep -q "^${field}" "$makefile"; then
            missing+=("$field")
        fi
    done

    if [ ${#missing[@]} -eq 0 ]; then
        success "$module_name: Makefile has all required fields"
    else
        error "$module_name: Makefile missing fields: ${missing[*]}"
    fi

    # Check PKG_NAME matches directory
    if grep -q "^PKG_NAME.*${module_name}" "$makefile"; then
        success "$module_name: PKG_NAME matches directory"
    else
        warn "$module_name: PKG_NAME might not match directory"
    fi
done

# ============================================
# 8. Security Checks
# ============================================
section "8. Security Checks"

info "Scanning for potential security issues..."
echo ""

# Check for hardcoded secrets
SECRET_PATTERNS="password\s*=\s*['\"][^'\"]*['\"]|api_key\s*=|secret\s*=\s*['\"][^'\"]*['\"]|token\s*=\s*['\"][^'\"]*['\"]"

for module_dir in luci-app-*/; do
    [ -d "$module_dir" ] || continue

    module_name=$(basename "$module_dir")

    # Check RPCD scripts
    if [ -d "$module_dir/root/usr/libexec/rpcd" ]; then
        if find "$module_dir/root/usr/libexec/rpcd" -type f -exec grep -iE "$SECRET_PATTERNS" {} \; 2>/dev/null | grep -v '^#' | head -1 > /dev/null; then
            warn "$module_name: Possible hardcoded credentials in RPCD scripts"
        fi
    fi

    # Check JavaScript files
    if [ -d "$module_dir/htdocs" ]; then
        if find "$module_dir/htdocs" -name "*.js" -type f -exec grep -iE "$SECRET_PATTERNS" {} \; 2>/dev/null | grep -v '^//' | grep -v '^\*' | head -1 > /dev/null; then
            warn "$module_name: Possible hardcoded credentials in JS files"
        fi
    fi
done

success "Security scan complete"

# ============================================
# 9. Run Full Module Validation (if modified)
# ============================================
if [ -n "$MODIFIED_MODULES" ] && [ -f "$SCRIPT_DIR/validate-modules.sh" ]; then
    section "9. Full Module Validation"

    info "Running comprehensive validation on modified modules..."
    echo ""

    if "$SCRIPT_DIR/validate-modules.sh" 2>&1 | tail -20; then
        success "Full validation passed"
    else
        error "Full validation found issues"
    fi
fi

# ============================================
# Summary
# ============================================
section "Validation Summary"

echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ ALL CHECKS PASSED - Push is allowed                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠ Passed with $WARNINGS warning(s) - Push is allowed                    ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Consider fixing warnings before pushing.${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ VALIDATION FAILED - Push is BLOCKED                               ║${NC}"
    echo -e "${RED}║    Found $ERRORS error(s) and $WARNINGS warning(s)                                    ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Fix the errors above before pushing:${NC}"
    echo ""
    echo "  1. Rename RPCD scripts to match ubus objects (use luci. prefix)"
    echo "  2. Update menu paths to match view file locations"
    echo "  3. Add missing RPCD methods to ACL permissions"
    echo "  4. Fix Makefile missing fields"
    echo "  5. Make RPCD scripts executable: chmod +x"
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "  git push --no-verify"
    echo ""
    exit 1
fi
