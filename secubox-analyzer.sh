#!/bin/bash
#
# secubox-analyzer.sh
# ====================
# Outil complet de debug, analyse et correction des sources SecuBox
# Analyse en profondeur le code source, détecte les problèmes et les corrige
#
# Usage:
#   ./secubox-analyzer.sh                     # Analyse complète
#   ./secubox-analyzer.sh --fix               # Analyse + correction
#   ./secubox-analyzer.sh --module NAME       # Analyser un module spécifique
#   ./secubox-analyzer.sh --report            # Générer rapport HTML
#   ./secubox-analyzer.sh --test-rpc          # Tester les scripts RPCD localement
#
# Auteur: CyberMind.fr
# License: Apache-2.0
#

set -e

# ============================================
# Configuration
# ============================================
VERSION="2.1.0"
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="${WORK_DIR:-$SCRIPT_DIR}"
REPORT_DIR="${REPORT_DIR:-$WORK_DIR/.secubox-reports}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Counters
declare -A STATS=(
    [modules]=0
    [errors]=0
    [warnings]=0
    [fixes]=0
    [files_checked]=0
    [issues_found]=0
)

# Options
DO_FIX=false
DO_REPORT=false
DO_TEST_RPC=false
DO_VERBOSE=false
DO_DEEP=false
TARGET_MODULE=""

# Issue tracking
declare -a ISSUES=()
declare -a FIXES_APPLIED=()

# ============================================
# Module Registry
# ============================================
declare -A MODULES=(
    [secubox]="SecuBox Hub|+luci-base +rpcd +curl +jq"
    [crowdsec-dashboard]="CrowdSec Dashboard|+luci-base +rpcd +crowdsec"
    [netdata-dashboard]="Netdata Dashboard|+luci-base +rpcd +netdata"
    [netifyd-dashboard]="Netifyd Dashboard|+luci-base +rpcd +netifyd"
    [wireguard-dashboard]="WireGuard Dashboard|+luci-base +rpcd +wireguard-tools +qrencode"
    [network-modes]="Network Modes|+luci-base +rpcd"
    [client-guardian]="Client Guardian|+luci-base +rpcd +nodogsplash"
    [system-hub]="System Hub|+luci-base +rpcd"
    [bandwidth-manager]="Bandwidth Manager|+luci-base +rpcd +tc-full +kmod-sched-cake"
    [auth-guardian]="Auth Guardian|+luci-base +rpcd +curl"
    [media-flow]="Media Flow|+luci-base +rpcd +netifyd"
    [vhost-manager]="VHost Manager|+luci-base +rpcd +nginx-ssl"
    [cdn-cache]="CDN Cache|+luci-base +rpcd +nginx"
    [traffic-shaper]="Traffic Shaper|+luci-base +rpcd +tc-full"
)

# ============================================
# Logging & Output
# ============================================
log_file=""

init_logging() {
    mkdir -p "$REPORT_DIR"
    log_file="$REPORT_DIR/analyze_${TIMESTAMP}.log"
    exec > >(tee -a "$log_file") 2>&1
}

print_banner() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                                                                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}${WHITE}SecuBox Source Analyzer${NC}                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${DIM}Debug • Analyze • Fix${NC}                                     ${DIM}v${VERSION}${NC}   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                           ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NC}"
    echo -e "${BLUE}┃${NC}  ${BOLD}$1${NC}"
    echo -e "${BLUE}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NC}"
}

print_module_header() {
    local name="$1"
    local title="${MODULES[$name]%%|*}"
    echo ""
    echo -e "${MAGENTA}╭───────────────────────────────────────────────────────────────────────────╮${NC}"
    echo -e "${MAGENTA}│${NC}  📦 ${BOLD}luci-app-${name}${NC}"
    [[ -n "$title" ]] && echo -e "${MAGENTA}│${NC}     ${DIM}$title${NC}"
    echo -e "${MAGENTA}╰───────────────────────────────────────────────────────────────────────────╯${NC}"
}

print_subsection() {
    echo -e "  ${CYAN}▸ $1${NC}"
}

ok() { echo -e "    ${GREEN}✓${NC} $1"; }
warn() { 
    echo -e "    ${YELLOW}⚠${NC} $1"
    ((STATS[warnings]++))
    ISSUES+=("WARN|$current_module|$1")
}
error() { 
    echo -e "    ${RED}✗${NC} $1"
    ((STATS[errors]++))
    ISSUES+=("ERROR|$current_module|$1")
}
info() { echo -e "    ${CYAN}→${NC} $1"; }
debug() { $DO_VERBOSE && echo -e "    ${GRAY}  $1${NC}"; }
fixed() { 
    echo -e "    ${GREEN}🔧${NC} $1"
    ((STATS[fixes]++))
    FIXES_APPLIED+=("$current_module|$1")
}

# ============================================
# Utility Functions
# ============================================

# Check if command exists
has_cmd() {
    command -v "$1" &>/dev/null
}

# Get module name from directory
get_module_name() {
    basename "$1" | sed 's/^luci-app-//'
}

# Convert module-name to module_name
to_underscore() {
    echo "$1" | tr '-' '_'
}

# Validate JSON syntax
validate_json() {
    local file="$1"
    local errors=""
    
    if has_cmd jq; then
        errors=$(jq empty "$file" 2>&1) && return 0
    elif has_cmd python3; then
        errors=$(python3 -c "import json; json.load(open('$file'))" 2>&1) && return 0
    elif has_cmd node; then
        errors=$(node -e "JSON.parse(require('fs').readFileSync('$file'))" 2>&1) && return 0
    else
        return 0  # Can't validate
    fi
    
    echo "$errors"
    return 1
}

# Validate JavaScript syntax
validate_js() {
    local file="$1"
    local errors=""
    
    if has_cmd node; then
        errors=$(node --check "$file" 2>&1) && return 0
    elif has_cmd eslint; then
        errors=$(eslint --no-eslintrc "$file" 2>&1) && return 0
    fi
    
    # Basic check
    if grep -qE "^'use strict'|require\('view'\)|return view\.extend" "$file" 2>/dev/null; then
        return 0
    fi
    
    echo "$errors"
    return 1
}

# Validate shell script
validate_shell() {
    local file="$1"
    local errors=""
    
    # Check shebang
    local shebang=$(head -1 "$file")
    if [[ ! "$shebang" =~ ^#! ]]; then
        echo "Missing shebang"
        return 1
    fi
    
    # Shellcheck if available
    if has_cmd shellcheck; then
        errors=$(shellcheck -s sh -f gcc "$file" 2>&1)
        local exit_code=$?
        if [[ $exit_code -ne 0 ]]; then
            echo "$errors"
            return 1
        fi
    fi
    
    # Basic syntax check
    if has_cmd sh; then
        errors=$(sh -n "$file" 2>&1) && return 0
        echo "$errors"
        return 1
    fi
    
    return 0
}

# ============================================
# Analysis Functions
# ============================================

# Analyze directory structure
analyze_structure() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    
    print_subsection "Directory Structure"
    
    # Required directories
    local required_dirs=(
        "root/usr/libexec/rpcd"
        "root/usr/share/rpcd/acl.d"
        "root/usr/share/luci/menu.d"
        "htdocs/luci-static/resources/view"
    )
    
    local missing=0
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$pkg_dir/$dir" ]]; then
            debug "OK: $dir"
        else
            warn "Missing directory: $dir"
            ((missing++))
            
            if $DO_FIX; then
                mkdir -p "$pkg_dir/$dir"
                fixed "Created: $dir"
            fi
        fi
    done
    
    [[ $missing -eq 0 ]] && ok "All required directories present"
    
    # Check for malformed directories
    local malformed=$(find "$pkg_dir" -type d -name '{*' -o -name '*}' 2>/dev/null)
    if [[ -n "$malformed" ]]; then
        error "Found malformed directories"
        echo "$malformed" | while read -r dir; do
            info "  $dir"
            if $DO_FIX; then
                rm -rf "$dir"
                fixed "Removed: $dir"
            fi
        done
    fi
    
    ((STATS[files_checked]++))
}

# Analyze Makefile
analyze_makefile() {
    local pkg_dir="$1"
    local name="$2"
    local makefile="$pkg_dir/Makefile"
    
    print_subsection "Makefile Analysis"
    
    if [[ ! -f "$makefile" ]]; then
        error "Makefile missing"
        if $DO_FIX; then
            generate_makefile "$pkg_dir" "$name"
        fi
        return 1
    fi
    
    ((STATS[files_checked]++))
    
    # Check required fields
    local required_fields=("PKG_NAME" "PKG_VERSION" "PKG_RELEASE" "PKG_LICENSE")
    local missing_fields=()
    
    for field in "${required_fields[@]}"; do
        if grep -q "^${field}:=" "$makefile"; then
            local value=$(grep "^${field}:=" "$makefile" | cut -d'=' -f2)
            debug "$field = $value"
        else
            missing_fields+=("$field")
        fi
    done
    
    if [[ ${#missing_fields[@]} -gt 0 ]]; then
        warn "Missing fields: ${missing_fields[*]}"
        if $DO_FIX; then
            generate_makefile "$pkg_dir" "$name"
        fi
    fi
    
    # Check PKG_NAME matches directory
    local pkg_name=$(grep "^PKG_NAME:=" "$makefile" | cut -d'=' -f2)
    if [[ "$pkg_name" != "luci-app-$name" ]]; then
        error "PKG_NAME mismatch: expected 'luci-app-$name', got '$pkg_name'"
        if $DO_FIX; then
            sed -i "s/^PKG_NAME:=.*/PKG_NAME:=luci-app-$name/" "$makefile"
            fixed "Corrected PKG_NAME"
        fi
    else
        ok "PKG_NAME correct"
    fi
    
    # Check include statement
    if grep -q 'include.*feeds/luci/luci\.mk' "$makefile"; then
        ok "Uses luci.mk (correct)"
    elif grep -q 'include.*package\.mk' "$makefile"; then
        warn "Uses package.mk (should use luci.mk for LuCI apps)"
        if $DO_FIX; then
            generate_makefile "$pkg_dir" "$name"
        fi
    else
        error "Missing include statement"
        if $DO_FIX; then
            generate_makefile "$pkg_dir" "$name"
        fi
    fi
    
    # Check LUCI_TITLE
    if ! grep -q "^LUCI_TITLE:=" "$makefile"; then
        warn "Missing LUCI_TITLE"
    fi
    
    # Check LUCI_DEPENDS
    if ! grep -q "^LUCI_DEPENDS:=" "$makefile"; then
        warn "Missing LUCI_DEPENDS"
    fi
}

# Analyze RPCD script
analyze_rpcd() {
    local pkg_dir="$1"
    local name="$2"
    local rpcd_dir="$pkg_dir/root/usr/libexec/rpcd"
    local rpcd_script="$rpcd_dir/$name"
    
    print_subsection "RPCD Script Analysis"
    
    # Check if script exists
    if [[ ! -f "$rpcd_script" ]]; then
        # Try alternative names
        local alt_scripts=(
            "$rpcd_dir/luci.$name"
            "$rpcd_dir/luci-$name"
            "$rpcd_dir/${name//-/_}"
        )
        
        local found=false
        for alt in "${alt_scripts[@]}"; do
            if [[ -f "$alt" ]]; then
                warn "RPCD script at non-standard location: $(basename "$alt")"
                if $DO_FIX; then
                    cp "$alt" "$rpcd_script"
                    fixed "Copied to standard location"
                fi
                found=true
                break
            fi
        done
        
        if ! $found; then
            error "RPCD script missing: $name"
            info "Expected: $rpcd_script"
            if $DO_FIX; then
                generate_rpcd "$pkg_dir" "$name"
            fi
            return 1
        fi
    fi
    
    ((STATS[files_checked]++))
    
    # Check permissions
    if [[ ! -x "$rpcd_script" ]]; then
        warn "RPCD script not executable"
        if $DO_FIX; then
            chmod +x "$rpcd_script"
            fixed "Made executable"
        fi
    else
        ok "Script is executable"
    fi
    
    # Validate shell syntax
    local shell_errors=$(validate_shell "$rpcd_script")
    if [[ -n "$shell_errors" ]]; then
        error "Shell syntax errors:"
        echo "$shell_errors" | head -5 | while read -r line; do
            info "  $line"
        done
    else
        ok "Shell syntax valid"
    fi
    
    # Check shebang
    local shebang=$(head -1 "$rpcd_script")
    if [[ "$shebang" != "#!/bin/sh" && "$shebang" != "#!/bin/bash" ]]; then
        warn "Non-standard shebang: $shebang"
        if $DO_FIX; then
            sed -i '1s|^.*$|#!/bin/sh|' "$rpcd_script"
            fixed "Fixed shebang"
        fi
    fi
    
    # Check for required components
    local components=(
        "json_init:JSON initialization"
        "json_add:JSON building"
        "json_dump:JSON output"
        'case.*list:list handler'
        'case.*call:call handler'
    )
    
    for comp in "${components[@]}"; do
        local pattern="${comp%%:*}"
        local desc="${comp##*:}"
        
        if grep -qE "$pattern" "$rpcd_script"; then
            debug "Has $desc"
        else
            warn "Missing $desc ($pattern)"
        fi
    done
    
    # Check for status method
    if grep -q 'status)' "$rpcd_script" || grep -q '"status"' "$rpcd_script"; then
        ok "Has 'status' method"
    else
        error "Missing 'status' method (required for LuCI)"
        if $DO_FIX; then
            # This is complex - regenerate the whole script
            generate_rpcd "$pkg_dir" "$name"
        fi
    fi
    
    # Extract and display methods
    if $DO_VERBOSE; then
        info "Methods found:"
        grep -oE '\b[a-z_]+\)' "$rpcd_script" 2>/dev/null | tr -d ')' | sort -u | while read -r method; do
            [[ -n "$method" ]] && debug "  - $method"
        done
    fi
    
    # Check ubus object name consistency
    local ubus_name=$(grep -oE "luci\.$name|luci\.${name//-/_}" "$rpcd_script" | head -1)
    if [[ -z "$ubus_name" ]]; then
        warn "Cannot determine ubus object name from script"
    else
        debug "ubus name: $ubus_name"
    fi
}

# Analyze ACL file
analyze_acl() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    local acl_dir="$pkg_dir/root/usr/share/rpcd/acl.d"
    
    print_subsection "ACL File Analysis"
    
    # Find ACL file
    local acl_file=""
    local acl_patterns=(
        "$acl_dir/luci-app-${name}.json"
        "$acl_dir/luci-${name}.json"
        "$acl_dir/${name}.json"
        "$acl_dir/luci-app-${name_u}.json"
    )
    
    for pattern in "${acl_patterns[@]}"; do
        if [[ -f "$pattern" ]]; then
            acl_file="$pattern"
            break
        fi
    done
    
    if [[ -z "$acl_file" ]]; then
        error "ACL file missing"
        info "Expected: $acl_dir/luci-app-${name}.json"
        if $DO_FIX; then
            generate_acl "$pkg_dir" "$name"
        fi
        return 1
    fi
    
    ((STATS[files_checked]++))
    
    # Check filename
    local expected_name="luci-app-${name}.json"
    local actual_name=$(basename "$acl_file")
    if [[ "$actual_name" != "$expected_name" ]]; then
        warn "ACL filename should be: $expected_name (got: $actual_name)"
        if $DO_FIX; then
            mv "$acl_file" "$acl_dir/$expected_name"
            acl_file="$acl_dir/$expected_name"
            fixed "Renamed ACL file"
        fi
    fi
    
    # Validate JSON
    local json_errors=$(validate_json "$acl_file")
    if [[ -n "$json_errors" ]]; then
        error "Invalid JSON syntax"
        echo "$json_errors" | head -3 | while read -r line; do
            info "  $line"
        done
        if $DO_FIX; then
            generate_acl "$pkg_dir" "$name"
        fi
        return 1
    else
        ok "JSON syntax valid"
    fi
    
    # Check ubus permissions
    local ubus_name="luci.$name"
    if grep -q "\"$ubus_name\"" "$acl_file"; then
        ok "Contains ubus permission for $ubus_name"
    else
        error "Missing ubus permission for $ubus_name"
        if $DO_FIX; then
            generate_acl "$pkg_dir" "$name"
        fi
    fi
    
    # Check for status method permission
    if grep -q '"status"' "$acl_file"; then
        ok "Has 'status' method permission"
    else
        warn "Missing 'status' method in ACL"
    fi
    
    # Deep analysis
    if $DO_DEEP && has_cmd jq; then
        info "ACL structure:"
        jq -r 'keys[]' "$acl_file" 2>/dev/null | while read -r key; do
            debug "  Section: $key"
        done
    fi
}

# Analyze Menu file
analyze_menu() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    local menu_dir="$pkg_dir/root/usr/share/luci/menu.d"
    
    print_subsection "Menu File Analysis"
    
    # Find menu file
    local menu_file=""
    local menu_patterns=(
        "$menu_dir/luci-app-${name}.json"
        "$menu_dir/luci-${name}.json"
        "$menu_dir/${name}.json"
    )
    
    for pattern in "${menu_patterns[@]}"; do
        if [[ -f "$pattern" ]]; then
            menu_file="$pattern"
            break
        fi
    done
    
    if [[ -z "$menu_file" ]]; then
        error "Menu file missing"
        if $DO_FIX; then
            generate_menu "$pkg_dir" "$name"
        fi
        return 1
    fi
    
    ((STATS[files_checked]++))
    
    # Validate JSON
    local json_errors=$(validate_json "$menu_file")
    if [[ -n "$json_errors" ]]; then
        error "Invalid JSON syntax"
        if $DO_FIX; then
            generate_menu "$pkg_dir" "$name"
        fi
        return 1
    else
        ok "JSON syntax valid"
    fi
    
    # Check menu path
    if has_cmd jq; then
        local menu_path=$(jq -r 'keys[0]' "$menu_file" 2>/dev/null)
        local view_path=$(jq -r '.[keys[0]].action.path // empty' "$menu_file" 2>/dev/null)
        
        debug "Menu path: $menu_path"
        debug "View path: $view_path"
        
        # Check if view file exists
        if [[ -n "$view_path" ]]; then
            local view_file="$pkg_dir/htdocs/luci-static/resources/view/${view_path}.js"
            if [[ -f "$view_file" ]]; then
                ok "View file exists: ${view_path}.js"
            else
                warn "View file not found: ${view_path}.js"
            fi
        fi
    fi
    
    ok "Menu file valid"
}

# Analyze View files (JavaScript)
analyze_views() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    local view_base="$pkg_dir/htdocs/luci-static/resources/view"
    
    print_subsection "View Files Analysis"
    
    # Find JavaScript files
    local js_files=$(find "$pkg_dir/htdocs" -name "*.js" 2>/dev/null)
    local js_count=$(echo "$js_files" | grep -c . 2>/dev/null || echo 0)
    
    if [[ $js_count -eq 0 ]]; then
        warn "No JavaScript view files found"
        if $DO_FIX; then
            generate_view "$pkg_dir" "$name"
        fi
        return 1
    fi
    
    info "Found $js_count JavaScript file(s)"
    
    echo "$js_files" | while read -r js_file; do
        [[ -z "$js_file" ]] && continue
        
        ((STATS[files_checked]++))
        local filename=$(basename "$js_file")
        
        # Validate syntax
        local js_errors=$(validate_js "$js_file")
        if [[ -n "$js_errors" ]]; then
            error "Syntax error in $filename"
            echo "$js_errors" | head -3 | while read -r line; do
                info "  $line"
            done
        else
            ok "Valid: $filename"
        fi
        
        # Check for required patterns
        if ! grep -q "'require view'" "$js_file" && ! grep -q '"require view"' "$js_file"; then
            if ! grep -q "require('view')" "$js_file"; then
                warn "$filename: Missing 'require view'"
            fi
        fi
        
        # Check RPC declaration
        if grep -q "rpc.declare" "$js_file"; then
            local rpc_object=$(grep -oE "object:\s*['\"][^'\"]+['\"]" "$js_file" | head -1)
            debug "$filename uses RPC: $rpc_object"
            
            # Check if RPC object matches module
            if ! echo "$rpc_object" | grep -qE "luci\.$name|luci\.${name_u}"; then
                warn "RPC object may not match module name"
            fi
        fi
        
        # Check for view.extend
        if ! grep -q "view.extend" "$js_file"; then
            warn "$filename: Missing view.extend"
        fi
    done
}

# Analyze UCI config
analyze_config() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    local config_dir="$pkg_dir/root/etc/config"
    local config_file="$config_dir/$name_u"
    
    print_subsection "UCI Config Analysis"
    
    if [[ ! -f "$config_file" ]]; then
        info "No UCI config file (optional)"
        return 0
    fi
    
    ((STATS[files_checked]++))
    
    # Basic validation
    if head -1 "$config_file" | grep -q "^config "; then
        ok "UCI config format valid"
    else
        warn "UCI config may have invalid format"
    fi
    
    # Check for global section
    if grep -q "config global" "$config_file"; then
        ok "Has 'global' section"
    else
        info "No 'global' section (may be intentional)"
    fi
}

# Analyze init script
analyze_init() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    local init_dir="$pkg_dir/root/etc/init.d"
    
    print_subsection "Init Script Analysis"
    
    # Find init script
    local init_script=""
    for pattern in "$init_dir/$name" "$init_dir/$name_u" "$init_dir/luci-app-$name"; do
        if [[ -f "$pattern" ]]; then
            init_script="$pattern"
            break
        fi
    done
    
    if [[ -z "$init_script" ]]; then
        info "No init script (optional for LuCI apps)"
        return 0
    fi
    
    ((STATS[files_checked]++))
    
    # Check permissions
    if [[ ! -x "$init_script" ]]; then
        warn "Init script not executable"
        if $DO_FIX; then
            chmod +x "$init_script"
            fixed "Made init script executable"
        fi
    else
        ok "Init script executable"
    fi
    
    # Check for required functions
    local required_funcs=("start" "stop")
    for func in "${required_funcs[@]}"; do
        if grep -q "${func}()" "$init_script" || grep -q "${func}_service" "$init_script"; then
            debug "Has $func function"
        else
            warn "Missing $func function"
        fi
    done
}

# Cross-reference check
analyze_cross_references() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    
    print_subsection "Cross-Reference Check"
    
    local issues=0
    
    # Check RPCD <-> ACL consistency
    local rpcd_script="$pkg_dir/root/usr/libexec/rpcd/$name"
    local acl_file="$pkg_dir/root/usr/share/rpcd/acl.d/luci-app-${name}.json"
    
    if [[ -f "$rpcd_script" && -f "$acl_file" ]]; then
        # Extract methods from RPCD
        local rpcd_methods=$(grep -oE '\b[a-z_]+\)' "$rpcd_script" 2>/dev/null | tr -d ')' | sort -u)
        
        # Check if they're in ACL
        for method in $rpcd_methods; do
            [[ "$method" == "list" || "$method" == "call" || "$method" == "esac" ]] && continue
            
            if ! grep -q "\"$method\"" "$acl_file" 2>/dev/null; then
                warn "Method '$method' in RPCD but not in ACL"
                ((issues++))
            fi
        done
    fi
    
    # Check Menu <-> View consistency
    local menu_file="$pkg_dir/root/usr/share/luci/menu.d/luci-app-${name}.json"
    
    if [[ -f "$menu_file" ]] && has_cmd jq; then
        local view_path=$(jq -r '.[keys[0]].action.path // empty' "$menu_file" 2>/dev/null)
        
        if [[ -n "$view_path" ]]; then
            local view_file="$pkg_dir/htdocs/luci-static/resources/view/${view_path}.js"
            
            if [[ ! -f "$view_file" ]]; then
                error "Menu references non-existent view: $view_path"
                ((issues++))
            fi
        fi
    fi
    
    # Check View <-> RPCD consistency
    local view_files=$(find "$pkg_dir/htdocs" -name "*.js" 2>/dev/null)
    
    for view_file in $view_files; do
        [[ -z "$view_file" ]] && continue
        
        # Extract RPC object names
        local rpc_objects=$(grep -oE "object:\s*['\"][^'\"]+['\"]" "$view_file" 2>/dev/null | grep -oE "'[^']+'" | tr -d "'")
        
        for obj in $rpc_objects; do
            local expected_rpcd="${obj#luci.}"
            local rpcd_path="$pkg_dir/root/usr/libexec/rpcd/$expected_rpcd"
            
            if [[ ! -f "$rpcd_path" ]]; then
                warn "View uses RPC object '$obj' but RPCD script '$expected_rpcd' not found"
                ((issues++))
            fi
        done
    done
    
    if [[ $issues -eq 0 ]]; then
        ok "All cross-references valid"
    fi
}

# ============================================
# Generator Functions
# ============================================

generate_makefile() {
    local pkg_dir="$1"
    local name="$2"
    local makefile="$pkg_dir/Makefile"
    
    local title="${MODULES[$name]%%|*}"
    local depends="${MODULES[$name]##*|}"
    
    [[ -z "$title" ]] && title="SecuBox Module"
    [[ -z "$depends" ]] && depends="+luci-base +rpcd"
    
    cat > "$makefile" << EOF
include \$(TOPDIR)/rules.mk

PKG_NAME:=luci-app-${name}
PKG_VERSION:=${VERSION}
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - ${title}
LUCI_DEPENDS:=${depends}
LUCI_PKGARCH:=all

include \$(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
EOF
    
    fixed "Generated Makefile"
}

generate_rpcd() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    local rpcd_dir="$pkg_dir/root/usr/libexec/rpcd"
    local rpcd_script="$rpcd_dir/$name"
    
    mkdir -p "$rpcd_dir"
    
    cat > "$rpcd_script" << 'RPCD_EOF'
#!/bin/sh
# RPCD backend for __NAME__
# Provides ubus interface: luci.__NAME__

. /lib/functions.sh
. /usr/share/libubox/jshn.sh

MODULE_NAME="__NAME__"
MODULE_VERSION="__VERSION__"
UCI_CONFIG="__NAME_U__"

json_init

case "$1" in
    list)
        json_add_object "status"
        json_close_object
        json_add_object "get_config"
        json_close_object
        json_add_object "set_config"
            json_add_string "config" "object"
        json_close_object
        json_add_object "get_stats"
        json_close_object
        json_dump
        ;;
    
    call)
        case "$2" in
            status)
                json_add_string "module" "$MODULE_NAME"
                json_add_string "version" "$MODULE_VERSION"
                json_add_boolean "enabled" 1
                json_add_string "status" "running"
                json_add_string "timestamp" "$(date -Iseconds 2>/dev/null || date)"
                json_dump
                ;;
            
            get_config)
                json_add_object "config"
                if [ -f "/etc/config/$UCI_CONFIG" ]; then
                    json_add_boolean "enabled" 1
                else
                    json_add_boolean "enabled" 0
                fi
                json_close_object
                json_dump
                ;;
            
            set_config)
                read -r input
                json_add_boolean "success" 1
                json_add_string "message" "Configuration updated"
                json_dump
                ;;
            
            get_stats)
                json_add_object "stats"
                json_add_int "uptime" "$(cat /proc/uptime 2>/dev/null | cut -d. -f1 || echo 0)"
                json_close_object
                json_dump
                ;;
            
            *)
                json_add_int "error" -32601
                json_add_string "message" "Method not found: $2"
                json_dump
                ;;
        esac
        ;;
esac
RPCD_EOF
    
    sed -i "s/__NAME__/$name/g" "$rpcd_script"
    sed -i "s/__NAME_U__/$name_u/g" "$rpcd_script"
    sed -i "s/__VERSION__/$VERSION/g" "$rpcd_script"
    
    chmod +x "$rpcd_script"
    fixed "Generated RPCD script"
}

generate_acl() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    local acl_dir="$pkg_dir/root/usr/share/rpcd/acl.d"
    local acl_file="$acl_dir/luci-app-${name}.json"
    
    mkdir -p "$acl_dir"
    
    cat > "$acl_file" << EOF
{
    "luci-app-${name}": {
        "description": "Grant access to LuCI app ${name}",
        "read": {
            "ubus": {
                "luci.${name}": ["status", "get_config", "get_stats"]
            },
            "uci": ["${name_u}"]
        },
        "write": {
            "ubus": {
                "luci.${name}": ["set_config"]
            },
            "uci": ["${name_u}"]
        }
    }
}
EOF
    
    fixed "Generated ACL file"
}

generate_menu() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    local menu_dir="$pkg_dir/root/usr/share/luci/menu.d"
    local menu_file="$menu_dir/luci-app-${name}.json"
    
    mkdir -p "$menu_dir"
    
    local title="${MODULES[$name]%%|*}"
    [[ -z "$title" ]] && title=$(echo "$name" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
    
    cat > "$menu_file" << EOF
{
    "admin/services/${name_u}": {
        "title": "${title}",
        "order": 50,
        "action": {
            "type": "view",
            "path": "${name_u}/main"
        },
        "depends": {
            "acl": ["luci-app-${name}"],
            "uci": {
                "${name_u}": true
            }
        }
    }
}
EOF
    
    fixed "Generated Menu file"
}

generate_view() {
    local pkg_dir="$1"
    local name="$2"
    local name_u=$(to_underscore "$name")
    local view_dir="$pkg_dir/htdocs/luci-static/resources/view/${name_u}"
    local view_file="$view_dir/main.js"
    
    mkdir -p "$view_dir"
    
    local title="${MODULES[$name]%%|*}"
    [[ -z "$title" ]] && title="$name"
    
    cat > "$view_file" << EOF
'use strict';
'require view';
'require rpc';
'require ui';
'require form';

var callStatus = rpc.declare({
    object: 'luci.${name}',
    method: 'status',
    expect: { }
});

return view.extend({
    load: function() {
        return Promise.all([
            callStatus()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var m, s, o;

        m = new form.Map('${name_u}', _('${title}'),
            _('SecuBox ${title} module'));

        s = m.section(form.NamedSection, 'global', 'global', _('Status'));
        s.anonymous = true;

        o = s.option(form.DummyValue, '_status', _('Module Status'));
        o.rawhtml = true;
        o.cfgvalue = function() {
            var running = status.status === 'running';
            return '<span style="color:' + (running ? 'green' : 'red') + '">' +
                   (running ? '● Running' : '○ Stopped') + '</span>';
        };

        o = s.option(form.DummyValue, '_version', _('Version'));
        o.cfgvalue = function() {
            return status.version || 'Unknown';
        };

        return m.render();
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
EOF
    
    fixed "Generated View file"
}

# ============================================
# RPC Testing
# ============================================

test_rpc_local() {
    local pkg_dir="$1"
    local name="$2"
    local rpcd_script="$pkg_dir/root/usr/libexec/rpcd/$name"
    
    print_subsection "Local RPC Testing"
    
    if [[ ! -f "$rpcd_script" ]]; then
        error "RPCD script not found"
        return 1
    fi
    
    if [[ ! -x "$rpcd_script" ]]; then
        chmod +x "$rpcd_script"
    fi
    
    # Create mock environment
    local mock_dir=$(mktemp -d)
    
    # Mock /lib/functions.sh
    cat > "$mock_dir/functions.sh" << 'EOF'
config_load() { :; }
config_get() { :; }
config_set() { :; }
EOF
    
    # Mock jshn.sh
    cat > "$mock_dir/jshn.sh" << 'EOF'
json_init() { JSON_OUTPUT="{"; JSON_FIRST=1; }
json_add_string() { 
    [ "$JSON_FIRST" = 1 ] && JSON_FIRST=0 || JSON_OUTPUT="$JSON_OUTPUT,"
    JSON_OUTPUT="$JSON_OUTPUT\"$1\":\"$2\""
}
json_add_boolean() {
    [ "$JSON_FIRST" = 1 ] && JSON_FIRST=0 || JSON_OUTPUT="$JSON_OUTPUT,"
    JSON_OUTPUT="$JSON_OUTPUT\"$1\":$2"
}
json_add_int() {
    [ "$JSON_FIRST" = 1 ] && JSON_FIRST=0 || JSON_OUTPUT="$JSON_OUTPUT,"
    JSON_OUTPUT="$JSON_OUTPUT\"$1\":$2"
}
json_add_object() {
    [ "$JSON_FIRST" = 1 ] && JSON_FIRST=0 || JSON_OUTPUT="$JSON_OUTPUT,"
    JSON_OUTPUT="$JSON_OUTPUT\"$1\":{"
    JSON_FIRST=1
}
json_add_array() {
    [ "$JSON_FIRST" = 1 ] && JSON_FIRST=0 || JSON_OUTPUT="$JSON_OUTPUT,"
    JSON_OUTPUT="$JSON_OUTPUT\"$1\":["
    JSON_FIRST=1
}
json_close_object() { JSON_OUTPUT="$JSON_OUTPUT}"; JSON_FIRST=0; }
json_close_array() { JSON_OUTPUT="$JSON_OUTPUT]"; JSON_FIRST=0; }
json_dump() { echo "$JSON_OUTPUT}"; }
json_load() { :; }
json_get_var() { :; }
EOF
    
    # Create wrapper script
    local wrapper="$mock_dir/wrapper.sh"
    cat > "$wrapper" << EOF
#!/bin/sh
. "$mock_dir/functions.sh"
. "$mock_dir/jshn.sh"
EOF
    
    # Append the original script (without shebang and includes)
    tail -n +2 "$rpcd_script" | grep -v '^\. /lib\|^\. /usr/share' >> "$wrapper"
    chmod +x "$wrapper"
    
    # Test 'list' command
    info "Testing 'list' command..."
    local list_output=$("$wrapper" list 2>&1)
    
    if echo "$list_output" | grep -q '"status"'; then
        ok "list command works"
        if $DO_VERBOSE; then
            echo "$list_output" | head -5 | while read -r line; do
                debug "  $line"
            done
        fi
    else
        warn "list command may have issues"
        debug "Output: $list_output"
    fi
    
    # Test 'call status' command
    info "Testing 'call status' command..."
    local status_output=$("$wrapper" call status 2>&1)
    
    if echo "$status_output" | grep -qE '"status"|"module"|"version"'; then
        ok "status method works"
        if $DO_VERBOSE; then
            echo "$status_output" | while read -r line; do
                debug "  $line"
            done
        fi
    else
        warn "status method may have issues"
        debug "Output: $status_output"
    fi
    
    # Cleanup
    rm -rf "$mock_dir"
}

# ============================================
# Report Generation
# ============================================

generate_html_report() {
    local report_file="$REPORT_DIR/report_${TIMESTAMP}.html"
    
    print_section "Generating HTML Report"
    
    cat > "$report_file" << 'HTML_HEADER'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SecuBox Analysis Report</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --border: #334155; --text: #f1f5f9; --green: #22c55e; --yellow: #eab308; --red: #ef4444; --blue: #3b82f6; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .subtitle { color: #94a3b8; margin-bottom: 2rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; text-align: center; }
        .stat-value { font-size: 2rem; font-weight: bold; }
        .stat-label { font-size: 0.875rem; color: #94a3b8; }
        .stat-value.green { color: var(--green); }
        .stat-value.yellow { color: var(--yellow); }
        .stat-value.red { color: var(--red); }
        .section { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
        .section h2 { font-size: 1.25rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .issue { padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; display: flex; align-items: flex-start; gap: 0.5rem; }
        .issue.error { background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--red); }
        .issue.warn { background: rgba(234, 179, 8, 0.1); border-left: 3px solid var(--yellow); }
        .issue .icon { flex-shrink: 0; }
        .issue .module { color: var(--blue); font-weight: 500; }
        .issue .message { color: #cbd5e1; }
        .fix { padding: 0.75rem; background: rgba(34, 197, 94, 0.1); border-left: 3px solid var(--green); border-radius: 4px; margin-bottom: 0.5rem; }
        .timestamp { color: #64748b; font-size: 0.875rem; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ SecuBox Analysis Report</h1>
        <p class="subtitle">Generated: TIMESTAMP_PLACEHOLDER</p>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">MODULES_COUNT</div>
                <div class="stat-label">Modules</div>
            </div>
            <div class="stat">
                <div class="stat-value">FILES_COUNT</div>
                <div class="stat-label">Files Checked</div>
            </div>
            <div class="stat">
                <div class="stat-value red">ERRORS_COUNT</div>
                <div class="stat-label">Errors</div>
            </div>
            <div class="stat">
                <div class="stat-value yellow">WARNINGS_COUNT</div>
                <div class="stat-label">Warnings</div>
            </div>
            <div class="stat">
                <div class="stat-value green">FIXES_COUNT</div>
                <div class="stat-label">Fixes Applied</div>
            </div>
        </div>
HTML_HEADER
    
    # Issues section
    if [[ ${#ISSUES[@]} -gt 0 ]]; then
        echo '<div class="section"><h2>⚠️ Issues Found</h2>' >> "$report_file"
        
        for issue in "${ISSUES[@]}"; do
            local type="${issue%%|*}"
            local rest="${issue#*|}"
            local module="${rest%%|*}"
            local message="${rest#*|}"
            
            local class="warn"
            local icon="⚠️"
            [[ "$type" == "ERROR" ]] && class="error" && icon="❌"
            
            echo "<div class=\"issue $class\"><span class=\"icon\">$icon</span><span class=\"module\">$module:</span><span class=\"message\">$message</span></div>" >> "$report_file"
        done
        
        echo '</div>' >> "$report_file"
    fi
    
    # Fixes section
    if [[ ${#FIXES_APPLIED[@]} -gt 0 ]]; then
        echo '<div class="section"><h2>🔧 Fixes Applied</h2>' >> "$report_file"
        
        for fix in "${FIXES_APPLIED[@]}"; do
            local module="${fix%%|*}"
            local message="${fix#*|}"
            echo "<div class=\"fix\">✅ <strong>$module:</strong> $message</div>" >> "$report_file"
        done
        
        echo '</div>' >> "$report_file"
    fi
    
    # Footer
    cat >> "$report_file" << 'HTML_FOOTER'
        <p class="timestamp">SecuBox Analyzer v__VERSION__</p>
    </div>
</body>
</html>
HTML_FOOTER
    
    # Replace placeholders
    sed -i "s/TIMESTAMP_PLACEHOLDER/$(date)/g" "$report_file"
    sed -i "s/MODULES_COUNT/${STATS[modules]}/g" "$report_file"
    sed -i "s/FILES_COUNT/${STATS[files_checked]}/g" "$report_file"
    sed -i "s/ERRORS_COUNT/${STATS[errors]}/g" "$report_file"
    sed -i "s/WARNINGS_COUNT/${STATS[warnings]}/g" "$report_file"
    sed -i "s/FIXES_COUNT/${STATS[fixes]}/g" "$report_file"
    sed -i "s/__VERSION__/$VERSION/g" "$report_file"
    
    ok "Report generated: $report_file"
    
    # Try to open in browser
    if has_cmd xdg-open; then
        xdg-open "$report_file" 2>/dev/null &
    elif has_cmd open; then
        open "$report_file" 2>/dev/null &
    fi
}

# ============================================
# Main Analysis
# ============================================

analyze_module() {
    local pkg_dir="$1"
    local name=$(get_module_name "$pkg_dir")
    
    current_module="$name"
    ((STATS[modules]++))
    
    print_module_header "$name"
    
    # Run all analyses
    analyze_structure "$pkg_dir" "$name"
    analyze_makefile "$pkg_dir" "$name"
    analyze_rpcd "$pkg_dir" "$name"
    analyze_acl "$pkg_dir" "$name"
    analyze_menu "$pkg_dir" "$name"
    analyze_views "$pkg_dir" "$name"
    analyze_config "$pkg_dir" "$name"
    analyze_init "$pkg_dir" "$name"
    analyze_cross_references "$pkg_dir" "$name"
    
    # Optional RPC testing
    if $DO_TEST_RPC; then
        test_rpc_local "$pkg_dir" "$name"
    fi
}

print_summary() {
    print_section "Analysis Summary"
    
    echo ""
    echo -e "  ${BOLD}Modules analyzed:${NC}  ${STATS[modules]}"
    echo -e "  ${BOLD}Files checked:${NC}     ${STATS[files_checked]}"
    echo ""
    echo -e "  ${RED}Errors:${NC}            ${STATS[errors]}"
    echo -e "  ${YELLOW}Warnings:${NC}          ${STATS[warnings]}"
    echo -e "  ${GREEN}Fixes applied:${NC}     ${STATS[fixes]}"
    echo ""
    
    if [[ ${STATS[errors]} -gt 0 ]]; then
        echo -e "  ${RED}✗ Some errors need attention${NC}"
        if ! $DO_FIX; then
            echo -e "    ${DIM}Run with --fix to attempt automatic repairs${NC}"
        fi
    elif [[ ${STATS[warnings]} -gt 0 ]]; then
        echo -e "  ${YELLOW}⚠ Some warnings to review${NC}"
    else
        echo -e "  ${GREEN}✓ All modules look good!${NC}"
    fi
    
    echo ""
    
    if [[ -n "$log_file" ]]; then
        echo -e "  ${DIM}Log file: $log_file${NC}"
    fi
}

# ============================================
# CLI
# ============================================

show_help() {
    cat << EOF
${BOLD}SecuBox Source Analyzer v${VERSION}${NC}

Analyze, debug, and fix SecuBox LuCI module sources.

${BOLD}USAGE:${NC}
    $SCRIPT_NAME [OPTIONS] [MODULE]

${BOLD}OPTIONS:${NC}
    --fix           Apply automatic fixes for detected issues
    --report        Generate HTML report
    --test-rpc      Test RPCD scripts locally (mock environment)
    --deep          Enable deep analysis
    --verbose, -v   Show detailed output
    --help, -h      Show this help

${BOLD}EXAMPLES:${NC}
    $SCRIPT_NAME                        Analyze all modules
    $SCRIPT_NAME --fix                  Analyze and fix all modules
    $SCRIPT_NAME --module vhost-manager Analyze specific module
    $SCRIPT_NAME --fix --report         Fix and generate report
    $SCRIPT_NAME --test-rpc             Test RPC scripts locally

${BOLD}ENVIRONMENT:${NC}
    WORK_DIR        Directory containing luci-app-* packages
    REPORT_DIR      Directory for reports (default: .secubox-reports)

EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --fix)
                DO_FIX=true
                shift
                ;;
            --report)
                DO_REPORT=true
                shift
                ;;
            --test-rpc)
                DO_TEST_RPC=true
                shift
                ;;
            --deep)
                DO_DEEP=true
                shift
                ;;
            --verbose|-v)
                DO_VERBOSE=true
                shift
                ;;
            --module)
                TARGET_MODULE="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            -*)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                TARGET_MODULE="$1"
                shift
                ;;
        esac
    done
}

main() {
    parse_args "$@"
    
    print_banner
    init_logging
    
    echo -e "  ${CYAN}Working directory:${NC} $WORK_DIR"
    echo -e "  ${CYAN}Fix mode:${NC}          $($DO_FIX && echo 'ON' || echo 'OFF')"
    echo -e "  ${CYAN}Test RPC:${NC}          $($DO_TEST_RPC && echo 'ON' || echo 'OFF')"
    echo -e "  ${CYAN}Report:${NC}            $($DO_REPORT && echo 'ON' || echo 'OFF')"
    
    cd "$WORK_DIR" || exit 1
    
    # Find and analyze modules
    if [[ -n "$TARGET_MODULE" ]]; then
        local pkg_dir="$WORK_DIR/luci-app-$TARGET_MODULE"
        [[ ! -d "$pkg_dir" ]] && pkg_dir="$WORK_DIR/$TARGET_MODULE"
        
        if [[ -d "$pkg_dir" ]]; then
            analyze_module "$pkg_dir"
        else
            error "Module not found: $TARGET_MODULE"
            exit 1
        fi
    else
        for pkg_dir in luci-app-*/; do
            [[ -d "$pkg_dir" ]] && analyze_module "${pkg_dir%/}"
        done
    fi
    
    # Generate report if requested
    $DO_REPORT && generate_html_report
    
    # Print summary
    print_summary
    
    # Exit code
    [[ ${STATS[errors]} -gt 0 ]] && exit 1
    exit 0
}

main "$@"
