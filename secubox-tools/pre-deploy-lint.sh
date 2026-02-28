#!/bin/bash
#
# SecuBox Pre-Deploy Lint Script
# Validates JavaScript, JSON, and shell syntax before deployment
#
# Usage:
#   ./secubox-tools/pre-deploy-lint.sh [package-dir|--all]
#   ./secubox-tools/pre-deploy-lint.sh luci-app-system-hub
#   ./secubox-tools/pre-deploy-lint.sh package/secubox/luci-app-cdn-cache
#   ./secubox-tools/pre-deploy-lint.sh --all
#
# Returns 0 on success, 1 on validation failure
#

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
CHECKED_FILES=0

log() { echo -e "$*"; }
error() { echo -e "${RED}❌ $*${NC}"; ((ERRORS++)); }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; ((WARNINGS++)); }
success() { echo -e "${GREEN}✓ $*${NC}"; }
info() { echo -e "${BLUE}ℹ $*${NC}"; }

# Check if we have Node.js for JavaScript validation
HAS_NODE=0
if command -v node &>/dev/null; then
    HAS_NODE=1
fi

# Check if we have shellcheck
HAS_SHELLCHECK=0
if command -v shellcheck &>/dev/null; then
    HAS_SHELLCHECK=1
fi

# Find all luci-app directories
get_luci_apps() {
    find . -maxdepth 1 -type d -name 'luci-app-*' 2>/dev/null
    find package/secubox -maxdepth 1 -type d -name 'luci-app-*' 2>/dev/null
}

# Validate JavaScript syntax
validate_js_file() {
    local file="$1"
    local result=0

    ((CHECKED_FILES++))

    if [[ $HAS_NODE -eq 1 ]]; then
        # Use Node.js --check to validate syntax
        if ! node --check "$file" 2>/dev/null; then
            error "JS syntax error: $file"
            # Get detailed error
            node --check "$file" 2>&1 | head -5 | while read -r line; do
                echo "    $line"
            done
            result=1
        fi
    else
        # Fallback: Basic pattern checks for common JS errors

        # Check for unclosed strings (simple heuristic)
        if grep -P "^[^/]*['\"][^'\"]*$" "$file" | grep -v '//' | grep -v '/*' | head -1 | grep -q .; then
            warn "Possible unclosed string in: $file (manual review needed)"
        fi

        # Check for missing semicolons after common patterns (LuCI style uses them)
        # This is just a warning as LuCI code often omits them

        # Check for common typos
        if grep -qE '\bretrun\b|\bfuntion\b|\bvat\b|\bleng th\b' "$file"; then
            warn "Possible typo detected in: $file"
        fi

        # Check for duplicate function declarations
        local dups
        dups=$(grep -oE "^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:\s*function" "$file" 2>/dev/null | \
               sed 's/:.*//' | sort | uniq -d)
        if [[ -n "$dups" ]]; then
            warn "Possible duplicate function: $dups in $file"
        fi
    fi

    # Additional checks regardless of Node availability

    # Check for console.log (should be removed in production)
    if grep -qE '\bconsole\.(log|debug|info)\b' "$file"; then
        warn "console.log found in: $file (consider removing for production)"
    fi

    # Check for debugger statements
    if grep -qE '^\s*debugger\s*;?\s*$' "$file"; then
        error "debugger statement found in: $file"
        result=1
    fi

    # Check LuCI-specific patterns

    # Check for missing 'use strict'
    if ! head -5 "$file" | grep -qE "'use strict'|\"use strict\""; then
        warn "Missing 'use strict' directive: $file"
    fi

    # Check for proper require statements (LuCI pattern)
    if grep -qE "^'require [^']+';$" "$file"; then
        # Valid LuCI require format
        :
    elif grep -qE "require\s*\(" "$file" && ! grep -qE "^'require " "$file"; then
        # Uses require() instead of LuCI string format
        warn "Non-standard require format in: $file (LuCI uses 'require module';)"
    fi

    return $result
}

# Validate JSON syntax
validate_json_file() {
    local file="$1"

    ((CHECKED_FILES++))

    if python3 -m json.tool "$file" >/dev/null 2>&1; then
        return 0
    else
        error "JSON syntax error: $file"
        # Show the error
        python3 -m json.tool "$file" 2>&1 | head -3 | while read -r line; do
            echo "    $line"
        done
        return 1
    fi
}

# Validate shell script syntax
validate_shell_file() {
    local file="$1"
    local result=0

    ((CHECKED_FILES++))

    # Basic syntax check using bash/sh
    if head -1 "$file" | grep -qE '^#!/bin/(ba)?sh'; then
        local shell_type="sh"
        head -1 "$file" | grep -q bash && shell_type="bash"

        if ! $shell_type -n "$file" 2>/dev/null; then
            error "Shell syntax error: $file"
            $shell_type -n "$file" 2>&1 | head -5 | while read -r line; do
                echo "    $line"
            done
            result=1
        fi
    fi

    # Use shellcheck if available
    if [[ $HAS_SHELLCHECK -eq 1 && $result -eq 0 ]]; then
        local sc_errors
        sc_errors=$(shellcheck -f gcc "$file" 2>/dev/null | grep -c ':error:' || true)
        if [[ "$sc_errors" -gt 0 ]]; then
            error "shellcheck errors ($sc_errors) in: $file"
            shellcheck -f gcc "$file" 2>/dev/null | grep ':error:' | head -5 | while read -r line; do
                echo "    $line"
            done
            result=1
        fi

        local sc_warnings
        sc_warnings=$(shellcheck -f gcc "$file" 2>/dev/null | grep -c ':warning:' || true)
        if [[ "$sc_warnings" -gt 0 ]]; then
            warn "shellcheck warnings ($sc_warnings) in: $file"
        fi
    fi

    # Check for common RPCD patterns
    if [[ "$file" == */usr/libexec/rpcd/* ]]; then
        # Check for proper JSON output
        if ! grep -qE 'printf.*{.*}|echo.*{.*}' "$file"; then
            warn "RPCD script may not output JSON: $file"
        fi

        # Check for case statement (method dispatcher)
        if ! grep -qE 'case\s+"\$[12]"\s+in' "$file"; then
            warn "RPCD script missing method dispatcher: $file"
        fi
    fi

    return $result
}

# Validate CSS file
validate_css_file() {
    local file="$1"

    ((CHECKED_FILES++))

    # Basic CSS validation - check for unclosed braces
    local open_braces close_braces
    open_braces=$(grep -o '{' "$file" 2>/dev/null | wc -l)
    close_braces=$(grep -o '}' "$file" 2>/dev/null | wc -l)

    if [[ "$open_braces" -ne "$close_braces" ]]; then
        error "CSS unclosed braces in: $file (open: $open_braces, close: $close_braces)"
        return 1
    fi

    # Check for common typos
    if grep -qE 'backgrond|colro|maring|paddig|widht|heigth' "$file"; then
        warn "Possible CSS typo in: $file"
    fi

    return 0
}

# Lint a single package directory
lint_package() {
    local pkg_dir="$1"
    local pkg_name
    pkg_name=$(basename "$pkg_dir")

    log ""
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "${BLUE}Linting: $pkg_name${NC}"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    local pkg_errors=0

    # Validate JavaScript files
    while IFS= read -r js_file; do
        [[ -z "$js_file" ]] && continue
        if ! validate_js_file "$js_file"; then
            ((pkg_errors++))
        fi
    done < <(find "$pkg_dir" -name "*.js" -type f 2>/dev/null)

    # Validate JSON files
    while IFS= read -r json_file; do
        [[ -z "$json_file" ]] && continue
        if ! validate_json_file "$json_file"; then
            ((pkg_errors++))
        fi
    done < <(find "$pkg_dir" -name "*.json" -type f 2>/dev/null)

    # Validate shell scripts (RPCD handlers)
    local rpcd_dir="$pkg_dir/root/usr/libexec/rpcd"
    if [[ -d "$rpcd_dir" ]]; then
        while IFS= read -r script; do
            [[ -z "$script" ]] && continue
            if ! validate_shell_file "$script"; then
                ((pkg_errors++))
            fi
        done < <(find "$rpcd_dir" -type f ! -name "*.md" 2>/dev/null)
    fi

    # Validate other shell scripts
    while IFS= read -r script; do
        [[ -z "$script" ]] && continue
        [[ "$script" == */rpcd/* ]] && continue  # Already checked
        if head -1 "$script" 2>/dev/null | grep -qE '^#!/bin/(ba)?sh'; then
            if ! validate_shell_file "$script"; then
                ((pkg_errors++))
            fi
        fi
    done < <(find "$pkg_dir/root" -type f 2>/dev/null)

    # Validate CSS files
    while IFS= read -r css_file; do
        [[ -z "$css_file" ]] && continue
        if ! validate_css_file "$css_file"; then
            ((pkg_errors++))
        fi
    done < <(find "$pkg_dir" -name "*.css" -type f 2>/dev/null)

    if [[ $pkg_errors -eq 0 ]]; then
        success "$pkg_name: All files validated"
    fi

    return $pkg_errors
}

# Resolve package path from name
resolve_package() {
    local input="$1"

    # Direct path
    if [[ -d "$input" ]]; then
        echo "$input"
        return 0
    fi

    # Try adding luci-app- prefix
    if [[ -d "luci-app-$input" ]]; then
        echo "luci-app-$input"
        return 0
    fi

    # Try in package/secubox
    if [[ -d "package/secubox/luci-app-$input" ]]; then
        echo "package/secubox/luci-app-$input"
        return 0
    fi

    if [[ -d "package/secubox/$input" ]]; then
        echo "package/secubox/$input"
        return 0
    fi

    return 1
}

# Main
main() {
    log "========================================"
    log "SecuBox Pre-Deploy Lint"
    log "========================================"

    # Check tools
    if [[ $HAS_NODE -eq 1 ]]; then
        info "Node.js available: $(node --version) - full JS syntax checking enabled"
    else
        warn "Node.js not found - using basic JS pattern checks"
        info "Install Node.js for better JavaScript validation"
    fi

    if [[ $HAS_SHELLCHECK -eq 1 ]]; then
        info "shellcheck available - enhanced shell script checking enabled"
    else
        warn "shellcheck not found - using basic shell syntax checks"
    fi

    local target="${1:-}"

    if [[ -z "$target" ]]; then
        log ""
        log "Usage: $0 <package-dir|package-name|--all>"
        log ""
        log "Examples:"
        log "  $0 luci-app-system-hub"
        log "  $0 package/secubox/luci-app-cdn-cache"
        log "  $0 --all"
        exit 1
    fi

    if [[ "$target" == "--all" ]]; then
        while IFS= read -r pkg_dir; do
            [[ ! -d "$pkg_dir" ]] && continue
            lint_package "$pkg_dir"
        done < <(get_luci_apps)
    else
        local pkg_path
        if ! pkg_path=$(resolve_package "$target"); then
            error "Package not found: $target"
            log ""
            log "Available packages:"
            get_luci_apps | while read -r d; do
                log "  - $(basename "$d")"
            done
            exit 1
        fi
        lint_package "$pkg_path"
    fi

    # Summary
    log ""
    log "========================================"
    log "Lint Summary"
    log "========================================"
    log "Files checked: $CHECKED_FILES"

    if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
        success "All checks passed!"
        exit 0
    elif [[ $ERRORS -eq 0 ]]; then
        warn "Passed with $WARNINGS warning(s)"
        exit 0
    else
        error "Failed with $ERRORS error(s) and $WARNINGS warning(s)"
        log ""
        log "Fix errors before deploying!"
        exit 1
    fi
}

main "$@"
