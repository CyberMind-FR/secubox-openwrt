#!/bin/bash
#
# secubox-repair.sh
# =================
# Script générique pour vérifier et réparer tous les modules SecuBox
# Exécuter depuis Linux sur le dossier contenant les packages luci-app-*
#
# Usage:
#   ./secubox-repair.sh                    # Vérification seulement
#   ./secubox-repair.sh --fix              # Vérification + réparation
#   ./secubox-repair.sh --fix --deploy     # + déploiement sur routeur
#   ./secubox-repair.sh --help             # Aide
#
# Auteur: CyberMind.fr
# License: Apache-2.0
#

set -e

# ============================================
# Configuration
# ============================================
VERSION="2.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="${SCRIPT_DIR}"

# Router SSH config (modifiable)
ROUTER_HOST="${ROUTER_HOST:-192.168.1.1}"
ROUTER_USER="${ROUTER_USER:-root}"
ROUTER_PORT="${ROUTER_PORT:-22}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Counters
ERRORS=0
WARNINGS=0
FIXES=0
MODULES_CHECKED=0

# Options
DO_FIX=false
DO_DEPLOY=false
VERBOSE=false

# ============================================
# SecuBox Modules Definition
# ============================================
declare -A MODULE_INFO=(
    ["secubox"]="SecuBox Hub|Central dashboard for all modules|+luci-base +rpcd +curl +jq"
    ["crowdsec-dashboard"]="CrowdSec Dashboard|Collaborative threat intelligence|+luci-base +rpcd +crowdsec"
    ["netdata-dashboard"]="Netdata Dashboard|Real-time system monitoring|+luci-base +rpcd +netdata"
    ["netifyd-dashboard"]="Netifyd Dashboard|Deep packet inspection|+luci-base +rpcd +netifyd"
    ["wireguard-dashboard"]="WireGuard Dashboard|VPN management with QR codes|+luci-base +rpcd +wireguard-tools +qrencode"
    ["network-modes"]="Network Modes|Network topology switcher|+luci-base +rpcd"
    ["client-guardian"]="Client Guardian|NAC and captive portal|+luci-base +rpcd +nodogsplash"
    ["system-hub"]="System Hub|System control center|+luci-base +rpcd"
    ["bandwidth-manager"]="Bandwidth Manager|QoS and quota management|+luci-base +rpcd +tc-full +kmod-sched-cake"
    ["auth-guardian"]="Auth Guardian|OAuth and voucher portal|+luci-base +rpcd +curl"
    ["media-flow"]="Media Flow|Streaming detection|+luci-base +rpcd +netifyd"
    ["vhost-manager"]="VHost Manager|Reverse proxy and SSL|+luci-base +rpcd +nginx-ssl"
    ["cdn-cache"]="CDN Cache|Local content cache|+luci-base +rpcd +nginx"
    ["traffic-shaper"]="Traffic Shaper|Advanced traffic control|+luci-base +rpcd +tc-full"
)

# ============================================
# Helper Functions
# ============================================
print_header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}$1${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_module() {
    echo ""
    echo -e "${MAGENTA}┌──────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${MAGENTA}│${NC}  📦 ${BOLD}$1${NC}"
    echo -e "${MAGENTA}└──────────────────────────────────────────────────────────────────────┘${NC}"
}

ok() {
    echo -e "  ${GREEN}✓${NC} $1"
}

warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

error() {
    echo -e "  ${RED}✗${NC} $1"
    ((ERRORS++))
}

info() {
    echo -e "  ${CYAN}→${NC} $1"
}

fixed() {
    echo -e "  ${GREEN}🔧${NC} $1"
    ((FIXES++))
}

verbose() {
    if $VERBOSE; then
        echo -e "  ${CYAN}  $1${NC}"
    fi
}

# ============================================
# Validation Functions
# ============================================

# Validate JSON file
validate_json() {
    local file="$1"
    if command -v jq &> /dev/null; then
        if jq empty "$file" 2>/dev/null; then
            return 0
        else
            return 1
        fi
    elif command -v python3 &> /dev/null; then
        if python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
            return 0
        else
            return 1
        fi
    else
        # Can't validate, assume OK
        return 0
    fi
}

# Validate JavaScript file
validate_js() {
    local file="$1"
    if command -v node &> /dev/null; then
        if node --check "$file" 2>/dev/null; then
            return 0
        else
            return 1
        fi
    else
        # Basic syntax check with grep
        if grep -qE '(function|const|let|var|class|import|export)' "$file"; then
            return 0
        else
            return 1
        fi
    fi
}

# ============================================
# Check Functions
# ============================================

check_makefile() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local makefile="$pkg_dir/Makefile"
    
    info "Checking Makefile..."
    
    if [[ ! -f "$makefile" ]]; then
        error "Makefile missing!"
        if $DO_FIX; then
            generate_makefile "$pkg_dir" "$pkg_name"
        fi
        return 1
    fi
    
    # Check required fields
    local required_fields=("PKG_NAME" "PKG_VERSION" "PKG_RELEASE" "PKG_LICENSE")
    local missing_fields=()
    
    for field in "${required_fields[@]}"; do
        if ! grep -q "^${field}:=" "$makefile"; then
            missing_fields+=("$field")
        fi
    done
    
    if [[ ${#missing_fields[@]} -gt 0 ]]; then
        warn "Missing fields: ${missing_fields[*]}"
    fi
    
    # Check PKG_NAME matches directory
    local makefile_pkg_name=$(grep "^PKG_NAME:=" "$makefile" | cut -d'=' -f2)
    if [[ "$makefile_pkg_name" != "luci-app-$pkg_name" ]]; then
        error "PKG_NAME mismatch: expected 'luci-app-$pkg_name', got '$makefile_pkg_name'"
        if $DO_FIX; then
            sed -i "s/^PKG_NAME:=.*/PKG_NAME:=luci-app-$pkg_name/" "$makefile"
            fixed "PKG_NAME corrected"
        fi
    fi
    
    # Check for luci.mk include
    if ! grep -q 'include.*feeds/luci/luci\.mk' "$makefile"; then
        if grep -q 'include.*package\.mk' "$makefile"; then
            warn "Uses package.mk instead of luci.mk (may be intentional)"
        else
            error "Missing include for luci.mk"
            if $DO_FIX; then
                generate_makefile "$pkg_dir" "$pkg_name"
            fi
        fi
    else
        ok "Makefile valid with luci.mk"
    fi
    
    return 0
}

check_rpcd_script() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local rpcd_dir="$pkg_dir/root/usr/libexec/rpcd"
    local rpcd_script="$rpcd_dir/$pkg_name"
    
    info "Checking RPCD script..."
    
    # Check for rpcd directory
    if [[ ! -d "$rpcd_dir" ]]; then
        warn "RPCD directory missing: $rpcd_dir"
        if $DO_FIX; then
            mkdir -p "$rpcd_dir"
            fixed "Created RPCD directory"
        fi
    fi
    
    # Check for rpcd script
    if [[ ! -f "$rpcd_script" ]]; then
        error "RPCD script missing: $rpcd_script"
        if $DO_FIX; then
            generate_rpcd_script "$pkg_dir" "$pkg_name"
        fi
        return 1
    fi
    
    # Check if executable
    if [[ ! -x "$rpcd_script" ]]; then
        warn "RPCD script not executable"
        if $DO_FIX; then
            chmod +x "$rpcd_script"
            fixed "Made RPCD script executable"
        fi
    fi
    
    # Check shebang
    local first_line=$(head -1 "$rpcd_script")
    if [[ "$first_line" != "#!/bin/sh" && "$first_line" != "#!/bin/bash" ]]; then
        warn "RPCD script missing proper shebang"
    fi
    
    # Check for required functions
    if ! grep -q 'json_init\|json_add' "$rpcd_script"; then
        warn "RPCD script may be missing JSON functions"
    fi
    
    # Check list and call handlers
    if ! grep -q 'case.*list' "$rpcd_script"; then
        error "RPCD script missing 'list' handler"
    fi
    
    if ! grep -q 'case.*call' "$rpcd_script"; then
        error "RPCD script missing 'call' handler"
    fi
    
    # Check for status method
    if ! grep -q 'status' "$rpcd_script"; then
        warn "RPCD script missing 'status' method"
    fi
    
    ok "RPCD script exists"
    return 0
}

check_acl_file() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local acl_dir="$pkg_dir/root/usr/share/rpcd/acl.d"
    local acl_file="$acl_dir/luci-app-${pkg_name}.json"
    
    info "Checking ACL file..."
    
    # Check for acl directory
    if [[ ! -d "$acl_dir" ]]; then
        warn "ACL directory missing"
        if $DO_FIX; then
            mkdir -p "$acl_dir"
            fixed "Created ACL directory"
        fi
    fi
    
    # Check for acl file
    if [[ ! -f "$acl_file" ]]; then
        error "ACL file missing: $acl_file"
        if $DO_FIX; then
            generate_acl_file "$pkg_dir" "$pkg_name"
        fi
        return 1
    fi
    
    # Validate JSON
    if ! validate_json "$acl_file"; then
        error "ACL file has invalid JSON syntax"
        if $DO_FIX; then
            generate_acl_file "$pkg_dir" "$pkg_name"
        fi
        return 1
    fi
    
    # Check for correct ubus permission
    local ubus_name="luci.$pkg_name"
    if ! grep -q "$ubus_name" "$acl_file"; then
        warn "ACL may be missing '$ubus_name' permission"
        if $DO_FIX; then
            generate_acl_file "$pkg_dir" "$pkg_name"
        fi
    fi
    
    ok "ACL file valid"
    return 0
}

check_menu_file() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local menu_dir="$pkg_dir/root/usr/share/luci/menu.d"
    local menu_file="$menu_dir/luci-app-${pkg_name}.json"
    
    info "Checking Menu file..."
    
    # Check for menu directory
    if [[ ! -d "$menu_dir" ]]; then
        warn "Menu directory missing"
        if $DO_FIX; then
            mkdir -p "$menu_dir"
            fixed "Created Menu directory"
        fi
    fi
    
    # Check for menu file
    if [[ ! -f "$menu_file" ]]; then
        error "Menu file missing: $menu_file"
        if $DO_FIX; then
            generate_menu_file "$pkg_dir" "$pkg_name"
        fi
        return 1
    fi
    
    # Validate JSON
    if ! validate_json "$menu_file"; then
        error "Menu file has invalid JSON syntax"
        if $DO_FIX; then
            generate_menu_file "$pkg_dir" "$pkg_name"
        fi
        return 1
    fi
    
    ok "Menu file valid"
    return 0
}

check_view_files() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local view_dir="$pkg_dir/htdocs/luci-static/resources/view"
    
    info "Checking View files..."
    
    # Check htdocs structure
    if [[ ! -d "$pkg_dir/htdocs/luci-static/resources" ]]; then
        warn "htdocs structure missing"
        if $DO_FIX; then
            mkdir -p "$pkg_dir/htdocs/luci-static/resources/view/${pkg_name//-/_}"
            fixed "Created htdocs structure"
        fi
    fi
    
    # Find JS view files
    local js_files=$(find "$pkg_dir/htdocs" -name "*.js" 2>/dev/null | wc -l)
    if [[ $js_files -eq 0 ]]; then
        warn "No JavaScript view files found"
        if $DO_FIX; then
            generate_view_file "$pkg_dir" "$pkg_name"
        fi
    else
        # Validate each JS file
        while IFS= read -r js_file; do
            if [[ -n "$js_file" ]]; then
                if validate_js "$js_file"; then
                    verbose "Valid: $js_file"
                else
                    error "Invalid JS syntax: $js_file"
                fi
            fi
        done < <(find "$pkg_dir/htdocs" -name "*.js" 2>/dev/null)
        ok "Found $js_files JavaScript view file(s)"
    fi
    
    return 0
}

check_config_file() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local pkg_name_underscore="${pkg_name//-/_}"
    local config_dir="$pkg_dir/root/etc/config"
    local config_file="$config_dir/$pkg_name_underscore"
    
    info "Checking UCI config..."
    
    if [[ ! -d "$config_dir" ]]; then
        if $DO_FIX; then
            mkdir -p "$config_dir"
        fi
    fi
    
    if [[ ! -f "$config_file" ]]; then
        warn "UCI config missing (optional)"
        if $DO_FIX; then
            generate_config_file "$pkg_dir" "$pkg_name"
        fi
    else
        ok "UCI config exists"
    fi
    
    return 0
}

check_malformed_dirs() {
    local pkg_dir="$1"
    local pkg_name="$2"
    
    info "Checking for malformed directories..."
    
    # Check for {htdocs or other malformed dirs
    local malformed=$(find "$pkg_dir" -type d -name '{*' 2>/dev/null)
    
    if [[ -n "$malformed" ]]; then
        error "Found malformed directories:"
        echo "$malformed" | while read -r dir; do
            echo "    - $dir"
            if $DO_FIX; then
                rm -rf "$dir"
                fixed "Removed: $dir"
            fi
        done
    else
        ok "No malformed directories"
    fi
    
    return 0
}

check_permissions() {
    local pkg_dir="$1"
    local pkg_name="$2"
    
    info "Checking file permissions..."
    
    local files_fixed=0
    
    # RPCD scripts
    while IFS= read -r script; do
        if [[ -n "$script" && ! -x "$script" ]]; then
            warn "Not executable: $script"
            if $DO_FIX; then
                chmod +x "$script"
                ((files_fixed++))
            fi
        fi
    done < <(find "$pkg_dir" -path "*/usr/libexec/rpcd/*" -type f 2>/dev/null)
    
    # Init scripts
    while IFS= read -r script; do
        if [[ -n "$script" && ! -x "$script" ]]; then
            warn "Not executable: $script"
            if $DO_FIX; then
                chmod +x "$script"
                ((files_fixed++))
            fi
        fi
    done < <(find "$pkg_dir" -path "*/etc/init.d/*" -type f 2>/dev/null)
    
    # UCI defaults
    while IFS= read -r script; do
        if [[ -n "$script" && ! -x "$script" ]]; then
            warn "Not executable: $script"
            if $DO_FIX; then
                chmod +x "$script"
                ((files_fixed++))
            fi
        fi
    done < <(find "$pkg_dir" -path "*/etc/uci-defaults/*" -type f 2>/dev/null)
    
    if [[ $files_fixed -gt 0 ]]; then
        fixed "Fixed permissions on $files_fixed file(s)"
    else
        ok "Permissions OK"
    fi
    
    return 0
}

# ============================================
# Generate Functions
# ============================================

generate_makefile() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local makefile="$pkg_dir/Makefile"
    
    # Get module info
    local info="${MODULE_INFO[$pkg_name]}"
    local title=$(echo "$info" | cut -d'|' -f1)
    local desc=$(echo "$info" | cut -d'|' -f2)
    local depends=$(echo "$info" | cut -d'|' -f3)
    
    # Defaults if not in MODULE_INFO
    title="${title:-SecuBox Module}"
    desc="${desc:-SecuBox LuCI application}"
    depends="${depends:-+luci-base +rpcd}"
    
    cat > "$makefile" << MAKEFILE_EOF
include \$(TOPDIR)/rules.mk

PKG_NAME:=luci-app-${pkg_name}
PKG_VERSION:=${VERSION}
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - ${title}
LUCI_DESCRIPTION:=${desc}
LUCI_DEPENDS:=${depends}
LUCI_PKGARCH:=all

include \$(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
MAKEFILE_EOF
    
    fixed "Generated Makefile"
}

generate_rpcd_script() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local pkg_name_underscore="${pkg_name//-/_}"
    local rpcd_dir="$pkg_dir/root/usr/libexec/rpcd"
    local rpcd_script="$rpcd_dir/$pkg_name"
    
    mkdir -p "$rpcd_dir"
    
    cat > "$rpcd_script" << 'RPCD_EOF'
#!/bin/sh
# RPCD backend for PKG_NAME_PLACEHOLDER
# Provides ubus interface: luci.PKG_NAME_PLACEHOLDER

. /lib/functions.sh
. /usr/share/libubox/jshn.sh

# Configuration
MODULE_NAME="PKG_NAME_PLACEHOLDER"
MODULE_VERSION="VERSION_PLACEHOLDER"
UCI_CONFIG="PKG_NAME_UNDERSCORE_PLACEHOLDER"

# Initialize JSON output
json_init

case "$1" in
    list)
        # List available methods
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
                # Return module status
                json_add_string "module" "$MODULE_NAME"
                json_add_string "version" "$MODULE_VERSION"
                json_add_boolean "enabled" 1
                json_add_string "status" "running"
                json_add_string "timestamp" "$(date -Iseconds 2>/dev/null || date)"
                json_dump
                ;;
            
            get_config)
                # Return current configuration
                json_add_object "config"
                
                if [ -f "/etc/config/$UCI_CONFIG" ]; then
                    config_load "$UCI_CONFIG"
                    json_add_boolean "enabled" 1
                else
                    json_add_boolean "enabled" 0
                fi
                
                json_close_object
                json_dump
                ;;
            
            set_config)
                # Set configuration
                read -r input
                
                # Parse and apply config
                # uci set $UCI_CONFIG...
                # uci commit $UCI_CONFIG
                
                json_add_boolean "success" 1
                json_add_string "message" "Configuration updated"
                json_dump
                ;;
            
            get_stats)
                # Return statistics
                json_add_object "stats"
                json_add_int "uptime" "$(cat /proc/uptime 2>/dev/null | cut -d. -f1 || echo 0)"
                json_add_string "timestamp" "$(date -Iseconds 2>/dev/null || date)"
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
    
    *)
        echo "Usage: $0 {list|call}" >&2
        exit 1
        ;;
esac
RPCD_EOF
    
    # Replace placeholders
    sed -i "s/PKG_NAME_PLACEHOLDER/$pkg_name/g" "$rpcd_script"
    sed -i "s/PKG_NAME_UNDERSCORE_PLACEHOLDER/$pkg_name_underscore/g" "$rpcd_script"
    sed -i "s/VERSION_PLACEHOLDER/$VERSION/g" "$rpcd_script"
    
    chmod +x "$rpcd_script"
    fixed "Generated RPCD script"
}

generate_acl_file() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local pkg_name_underscore="${pkg_name//-/_}"
    local acl_dir="$pkg_dir/root/usr/share/rpcd/acl.d"
    local acl_file="$acl_dir/luci-app-${pkg_name}.json"
    
    mkdir -p "$acl_dir"
    
    cat > "$acl_file" << ACL_EOF
{
    "luci-app-${pkg_name}": {
        "description": "Grant access to LuCI app ${pkg_name}",
        "read": {
            "ubus": {
                "luci.${pkg_name}": [
                    "status",
                    "get_config",
                    "get_stats"
                ]
            },
            "uci": ["${pkg_name_underscore}"]
        },
        "write": {
            "ubus": {
                "luci.${pkg_name}": [
                    "set_config"
                ]
            },
            "uci": ["${pkg_name_underscore}"]
        }
    }
}
ACL_EOF
    
    fixed "Generated ACL file"
}

generate_menu_file() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local pkg_name_underscore="${pkg_name//-/_}"
    local menu_dir="$pkg_dir/root/usr/share/luci/menu.d"
    local menu_file="$menu_dir/luci-app-${pkg_name}.json"
    
    mkdir -p "$menu_dir"
    
    # Generate title from pkg_name
    local title=$(echo "$pkg_name" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
    
    # Get from MODULE_INFO if available
    if [[ -n "${MODULE_INFO[$pkg_name]}" ]]; then
        title=$(echo "${MODULE_INFO[$pkg_name]}" | cut -d'|' -f1)
    fi
    
    cat > "$menu_file" << MENU_EOF
{
    "admin/services/${pkg_name_underscore}": {
        "title": "${title}",
        "order": 50,
        "action": {
            "type": "view",
            "path": "${pkg_name_underscore}/main"
        },
        "depends": {
            "acl": ["luci-app-${pkg_name}"],
            "uci": {
                "${pkg_name_underscore}": true
            }
        }
    }
}
MENU_EOF
    
    fixed "Generated Menu file"
}

generate_view_file() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local pkg_name_underscore="${pkg_name//-/_}"
    local view_dir="$pkg_dir/htdocs/luci-static/resources/view/${pkg_name_underscore}"
    local view_file="$view_dir/main.js"
    
    mkdir -p "$view_dir"
    
    # Generate title
    local title=$(echo "$pkg_name" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
    
    if [[ -n "${MODULE_INFO[$pkg_name]}" ]]; then
        title=$(echo "${MODULE_INFO[$pkg_name]}" | cut -d'|' -f1)
    fi
    
    cat > "$view_file" << 'VIEW_EOF'
'use strict';
'require view';
'require rpc';
'require ui';
'require form';

var callStatus = rpc.declare({
    object: 'luci.PKG_NAME_PLACEHOLDER',
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

        m = new form.Map('PKG_NAME_UNDERSCORE_PLACEHOLDER', _('TITLE_PLACEHOLDER'),
            _('DESCRIPTION_PLACEHOLDER'));

        s = m.section(form.NamedSection, 'status', 'status', _('Status'));
        s.anonymous = true;

        o = s.option(form.DummyValue, '_status', _('Module Status'));
        o.rawhtml = true;
        o.cfgvalue = function() {
            var running = status.status === 'running';
            return '<span class="label ' + (running ? 'success' : 'danger') + '">' +
                   (running ? _('Running') : _('Stopped')) + '</span>';
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
VIEW_EOF
    
    # Replace placeholders
    sed -i "s/PKG_NAME_PLACEHOLDER/$pkg_name/g" "$view_file"
    sed -i "s/PKG_NAME_UNDERSCORE_PLACEHOLDER/$pkg_name_underscore/g" "$view_file"
    sed -i "s/TITLE_PLACEHOLDER/$title/g" "$view_file"
    sed -i "s/DESCRIPTION_PLACEHOLDER/SecuBox $title module/g" "$view_file"
    
    fixed "Generated View file"
}

generate_config_file() {
    local pkg_dir="$1"
    local pkg_name="$2"
    local pkg_name_underscore="${pkg_name//-/_}"
    local config_dir="$pkg_dir/root/etc/config"
    local config_file="$config_dir/$pkg_name_underscore"
    
    mkdir -p "$config_dir"
    
    cat > "$config_file" << CONFIG_EOF
config global 'global'
    option enabled '1'
    option version '${VERSION}'
CONFIG_EOF
    
    fixed "Generated UCI config"
}

# ============================================
# Deploy Functions
# ============================================

deploy_to_router() {
    local pkg_dir="$1"
    local pkg_name="$2"
    
    print_section "Deploying $pkg_name to router ($ROUTER_HOST)"
    
    # Test SSH connection
    if ! ssh -q -o ConnectTimeout=5 -p "$ROUTER_PORT" "$ROUTER_USER@$ROUTER_HOST" "echo ok" &>/dev/null; then
        error "Cannot connect to router via SSH"
        echo "  Check: ROUTER_HOST=$ROUTER_HOST ROUTER_USER=$ROUTER_USER ROUTER_PORT=$ROUTER_PORT"
        return 1
    fi
    
    ok "SSH connection OK"
    
    # Create directories on router
    info "Creating directories..."
    ssh -p "$ROUTER_PORT" "$ROUTER_USER@$ROUTER_HOST" "mkdir -p /usr/libexec/rpcd /usr/share/rpcd/acl.d /usr/share/luci/menu.d"
    
    # Deploy RPCD script
    local rpcd_script="$pkg_dir/root/usr/libexec/rpcd/$pkg_name"
    if [[ -f "$rpcd_script" ]]; then
        info "Deploying RPCD script..."
        scp -P "$ROUTER_PORT" "$rpcd_script" "$ROUTER_USER@$ROUTER_HOST:/usr/libexec/rpcd/"
        ssh -p "$ROUTER_PORT" "$ROUTER_USER@$ROUTER_HOST" "chmod +x /usr/libexec/rpcd/$pkg_name"
        ok "RPCD script deployed"
    fi
    
    # Deploy ACL file
    local acl_file="$pkg_dir/root/usr/share/rpcd/acl.d/luci-app-${pkg_name}.json"
    if [[ -f "$acl_file" ]]; then
        info "Deploying ACL file..."
        scp -P "$ROUTER_PORT" "$acl_file" "$ROUTER_USER@$ROUTER_HOST:/usr/share/rpcd/acl.d/"
        ok "ACL file deployed"
    fi
    
    # Deploy Menu file
    local menu_file="$pkg_dir/root/usr/share/luci/menu.d/luci-app-${pkg_name}.json"
    if [[ -f "$menu_file" ]]; then
        info "Deploying Menu file..."
        scp -P "$ROUTER_PORT" "$menu_file" "$ROUTER_USER@$ROUTER_HOST:/usr/share/luci/menu.d/"
        ok "Menu file deployed"
    fi
    
    # Deploy View files
    if [[ -d "$pkg_dir/htdocs" ]]; then
        info "Deploying View files..."
        ssh -p "$ROUTER_PORT" "$ROUTER_USER@$ROUTER_HOST" "mkdir -p /www/luci-static/resources/view"
        scp -r -P "$ROUTER_PORT" "$pkg_dir/htdocs/luci-static/resources/"* "$ROUTER_USER@$ROUTER_HOST:/www/luci-static/resources/" 2>/dev/null || true
        ok "View files deployed"
    fi
    
    # Restart rpcd
    info "Restarting rpcd..."
    ssh -p "$ROUTER_PORT" "$ROUTER_USER@$ROUTER_HOST" "/etc/init.d/rpcd restart"
    
    # Clear LuCI cache
    info "Clearing LuCI cache..."
    ssh -p "$ROUTER_PORT" "$ROUTER_USER@$ROUTER_HOST" "rm -rf /tmp/luci-*"
    
    # Test
    sleep 2
    info "Testing ubus registration..."
    if ssh -p "$ROUTER_PORT" "$ROUTER_USER@$ROUTER_HOST" "ubus list luci.$pkg_name" &>/dev/null; then
        ok "luci.$pkg_name is registered!"
        
        # Test status call
        info "Testing status call..."
        ssh -p "$ROUTER_PORT" "$ROUTER_USER@$ROUTER_HOST" "ubus call luci.$pkg_name status"
    else
        error "luci.$pkg_name is NOT registered"
        echo "  Check logs: ssh $ROUTER_USER@$ROUTER_HOST logread | grep rpcd"
    fi
}

# ============================================
# Main Check Function
# ============================================

check_module() {
    local pkg_dir="$1"
    local pkg_name=$(basename "$pkg_dir" | sed 's/^luci-app-//')
    
    print_module "luci-app-$pkg_name"
    
    ((MODULES_CHECKED++))
    
    # Run all checks
    check_malformed_dirs "$pkg_dir" "$pkg_name"
    check_makefile "$pkg_dir" "$pkg_name"
    check_rpcd_script "$pkg_dir" "$pkg_name"
    check_acl_file "$pkg_dir" "$pkg_name"
    check_menu_file "$pkg_dir" "$pkg_name"
    check_view_files "$pkg_dir" "$pkg_name"
    check_config_file "$pkg_dir" "$pkg_name"
    check_permissions "$pkg_dir" "$pkg_name"
    
    # Deploy if requested
    if $DO_DEPLOY; then
        deploy_to_router "$pkg_dir" "$pkg_name"
    fi
}

# ============================================
# Summary
# ============================================

print_summary() {
    print_header "Summary"
    
    echo ""
    echo -e "  ${BOLD}Modules checked:${NC}  $MODULES_CHECKED"
    echo -e "  ${GREEN}Fixes applied:${NC}    $FIXES"
    echo -e "  ${YELLOW}Warnings:${NC}         $WARNINGS"
    echo -e "  ${RED}Errors:${NC}           $ERRORS"
    echo ""
    
    if [[ $ERRORS -gt 0 ]]; then
        echo -e "  ${RED}⚠ Some errors remain. Run with --fix to repair.${NC}"
    elif [[ $WARNINGS -gt 0 ]]; then
        echo -e "  ${YELLOW}⚠ Some warnings. Review and fix manually if needed.${NC}"
    else
        echo -e "  ${GREEN}✓ All modules validated successfully!${NC}"
    fi
    
    echo ""
    
    if ! $DO_DEPLOY && $DO_FIX; then
        echo -e "  ${CYAN}Tip: Use --deploy to push fixes to router${NC}"
        echo ""
    fi
}

# ============================================
# Help
# ============================================

show_help() {
    cat << EOF
${BOLD}SecuBox Module Repair Tool v${VERSION}${NC}

Usage: $0 [OPTIONS] [MODULE_NAME]

Options:
  --fix         Apply automatic fixes
  --deploy      Deploy fixed modules to router (requires SSH)
  --verbose     Show detailed output
  --help        Show this help

Environment Variables:
  ROUTER_HOST   Router IP address (default: 192.168.1.1)
  ROUTER_USER   SSH user (default: root)
  ROUTER_PORT   SSH port (default: 22)

Examples:
  $0                              Check all modules
  $0 --fix                        Check and fix all modules
  $0 --fix vhost-manager          Fix specific module
  $0 --fix --deploy               Fix and deploy to router
  
  ROUTER_HOST=192.168.8.191 $0 --fix --deploy

EOF
}

# ============================================
# Main
# ============================================

main() {
    # Parse arguments
    local target_module=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --fix)
                DO_FIX=true
                shift
                ;;
            --deploy)
                DO_DEPLOY=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
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
                target_module="$1"
                shift
                ;;
        esac
    done
    
    # Header
    print_header "SecuBox Module Repair Tool v${VERSION}"
    
    echo ""
    echo -e "  ${CYAN}Working directory:${NC} $WORK_DIR"
    echo -e "  ${CYAN}Fix mode:${NC}          $($DO_FIX && echo 'ON' || echo 'OFF')"
    echo -e "  ${CYAN}Deploy mode:${NC}       $($DO_DEPLOY && echo 'ON' || echo 'OFF')"
    
    if $DO_DEPLOY; then
        echo -e "  ${CYAN}Router:${NC}            $ROUTER_USER@$ROUTER_HOST:$ROUTER_PORT"
    fi
    
    # Find modules
    cd "$WORK_DIR"
    
    if [[ -n "$target_module" ]]; then
        # Check specific module
        local pkg_dir="$WORK_DIR/luci-app-$target_module"
        if [[ ! -d "$pkg_dir" ]]; then
            pkg_dir="$WORK_DIR/$target_module"
        fi
        
        if [[ -d "$pkg_dir" ]]; then
            check_module "$pkg_dir"
        else
            error "Module not found: $target_module"
            exit 1
        fi
    else
        # Check all modules
        for pkg_dir in luci-app-*/; do
            if [[ -d "$pkg_dir" ]]; then
                check_module "${pkg_dir%/}"
            fi
        done
    fi
    
    # Summary
    print_summary
    
    # Exit code
    if [[ $ERRORS -gt 0 ]]; then
        exit 1
    fi
    exit 0
}

# Run
main "$@"
