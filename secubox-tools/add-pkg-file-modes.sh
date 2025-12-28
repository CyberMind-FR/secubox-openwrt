#!/bin/bash
# Add PKG_FILE_MODES to OpenWrt Makefiles
# Automatically detects RPCD scripts and adds correct permissions
#
# Usage: ./add-pkg-file-modes.sh [module-path]
#        ./add-pkg-file-modes.sh --all (process all luci-app-* modules)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect RPCD scripts in a module
detect_rpcd_scripts() {
    local module_path="$1"
    local rpcd_dir="$module_path/root/usr/libexec/rpcd"

    if [ ! -d "$rpcd_dir" ]; then
        return
    fi

    find "$rpcd_dir" -type f -name "luci.*" 2>/dev/null | while read script; do
        basename "$script"
    done
}

# Detect helper scripts in a module
detect_helper_scripts() {
    local module_path="$1"
    local helper_dir="$module_path/root/usr/libexec"

    if [ ! -d "$helper_dir" ]; then
        return
    fi

    # Find .sh files in subdirectories (not in rpcd/)
    find "$helper_dir" -type f -name "*.sh" ! -path "*/rpcd/*" 2>/dev/null | while read script; do
        echo "$script" | sed "s|^$module_path/root||"
    done
}

# Generate PKG_FILE_MODES line
generate_pkg_file_modes() {
    local module_name="$1"
    local rpcd_scripts="$2"
    local helper_scripts="$3"

    local modes=""

    # Add RPCD scripts
    for script in $rpcd_scripts; do
        if [ -z "$modes" ]; then
            modes="/usr/libexec/rpcd/$script:755"
        else
            modes="$modes \\\\\n\\t/usr/libexec/rpcd/$script:755"
        fi
    done

    # Add helper scripts
    for script in $helper_scripts; do
        if [ -z "$modes" ]; then
            modes="$script:755"
        else
            modes="$modes \\\\\n\\t$script:755"
        fi
    done

    if [ -n "$modes" ]; then
        echo -e "# File permissions (RPCD scripts must be executable)\nPKG_FILE_MODES:=$modes"
    fi
}

# Check if Makefile already has PKG_FILE_MODES
has_pkg_file_modes() {
    local makefile="$1"
    grep -q "^PKG_FILE_MODES:=" "$makefile" 2>/dev/null
}

# Add PKG_FILE_MODES to Makefile
add_to_makefile() {
    local makefile="$1"
    local pkg_file_modes="$2"

    if [ ! -f "$makefile" ]; then
        log_error "Makefile not found: $makefile"
        return 1
    fi

    # Check if already exists
    if has_pkg_file_modes "$makefile"; then
        log_warning "PKG_FILE_MODES already exists in $makefile"
        return 0
    fi

    # Find the line with 'include $(TOPDIR)/feeds/luci/luci.mk'
    if ! grep -q "include.*luci.mk" "$makefile"; then
        log_error "Cannot find luci.mk include in $makefile"
        return 1
    fi

    # Create backup
    cp "$makefile" "$makefile.bak"

    # Insert PKG_FILE_MODES before the include line
    awk -v modes="$pkg_file_modes" '
        /^include.*luci\.mk/ {
            print ""
            print modes
            print ""
        }
        { print }
    ' "$makefile.bak" > "$makefile"

    log_success "Added PKG_FILE_MODES to $makefile"
    rm -f "$makefile.bak"
}

# Process a single module
process_module() {
    local module_path="$1"
    local module_name=$(basename "$module_path")

    log_info "Processing $module_name..."

    # Detect scripts
    local rpcd_scripts=$(detect_rpcd_scripts "$module_path")
    local helper_scripts=$(detect_helper_scripts "$module_path")

    if [ -z "$rpcd_scripts" ] && [ -z "$helper_scripts" ]; then
        log_warning "No executable scripts found in $module_name"
        return 0
    fi

    # Generate PKG_FILE_MODES
    local pkg_file_modes=$(generate_pkg_file_modes "$module_name" "$rpcd_scripts" "$helper_scripts")

    if [ -z "$pkg_file_modes" ]; then
        log_warning "Could not generate PKG_FILE_MODES for $module_name"
        return 0
    fi

    # Add to Makefile
    local makefile="$module_path/Makefile"
    add_to_makefile "$makefile" "$pkg_file_modes"

    # Show what was added
    echo ""
    echo "  Scripts found:"
    [ -n "$rpcd_scripts" ] && echo "    RPCD: $(echo $rpcd_scripts | tr '\n' ' ')"
    [ -n "$helper_scripts" ] && echo "    Helper: $(echo $helper_scripts | tr '\n' ' ')"
    echo ""
}

# Main
main() {
    echo "================================================"
    echo "  PKG_FILE_MODES Auto-Configurator v0.3.1"
    echo "================================================"
    echo ""

    if [ "$1" = "--all" ]; then
        log_info "Processing all luci-app-* modules..."
        echo ""

        find "$PROJECT_ROOT" -maxdepth 1 -type d -name "luci-app-*" | sort | while read module_path; do
            process_module "$module_path"
        done

    elif [ -n "$1" ] && [ -d "$1" ]; then
        process_module "$1"

    else
        log_error "Usage: $0 [module-path] | --all"
        log_info "Examples:"
        log_info "  $0 ../luci-app-secubox"
        log_info "  $0 --all"
        exit 1
    fi

    echo ""
    echo "================================================"
    echo "  Processing complete!"
    echo "================================================"
}

main "$@"
