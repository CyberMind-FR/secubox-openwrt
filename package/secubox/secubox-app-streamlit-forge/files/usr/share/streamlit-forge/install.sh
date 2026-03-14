#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════════
#  SecuBox Module Installer v1.0
#  Universal installer script for Streamlit/MetaBlog applications
#
#  This script reads README.nfo manifest and configures the application.
#  Can be bundled with apps or used standalone.
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NFO_FILE="${SCRIPT_DIR}/README.nfo"
INSTALL_LOG="/tmp/secubox-install-$$.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ─────────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────────
log() { printf "${GREEN}[+]${NC} %s\n" "$*"; echo "[$(date)] $*" >> "$INSTALL_LOG"; }
warn() { printf "${YELLOW}[!]${NC} %s\n" "$*"; echo "[$(date)] WARN: $*" >> "$INSTALL_LOG"; }
error() { printf "${RED}[x]${NC} %s\n" "$*"; echo "[$(date)] ERROR: $*" >> "$INSTALL_LOG"; exit 1; }
info() { printf "${CYAN}[i]${NC} %s\n" "$*"; }

# ─────────────────────────────────────────────────────────────────────────────────
# Banner
# ─────────────────────────────────────────────────────────────────────────────────
show_banner() {
    cat << 'EOF'
 ╔═══════════════════════════════════════════════════════════════════════════╗
 ║   ███████╗███████╗ ██████╗██╗   ██╗██████╗  ██████╗ ██╗  ██╗              ║
 ║   ██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗██╔═══██╗╚██╗██╔╝              ║
 ║   ███████╗█████╗  ██║     ██║   ██║██████╔╝██║   ██║ ╚███╔╝               ║
 ║   ╚════██║██╔══╝  ██║     ██║   ██║██╔══██╗██║   ██║ ██╔██╗               ║
 ║   ███████║███████╗╚██████╗╚██████╔╝██████╔╝╚██████╔╝██╔╝ ██╗              ║
 ║   ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝              ║
 ║                                                                           ║
 ║               Module Installer v1.0 - SecuBox Platform                    ║
 ╚═══════════════════════════════════════════════════════════════════════════╝
EOF
}

# ─────────────────────────────────────────────────────────────────────────────────
# Load NFO parser
# ─────────────────────────────────────────────────────────────────────────────────
load_parser() {
    local parser_paths="
        /usr/share/streamlit-forge/lib/nfo-parser.sh
        /usr/share/metablogizer/lib/nfo-parser.sh
        ${SCRIPT_DIR}/lib/nfo-parser.sh
        ${SCRIPT_DIR}/nfo-parser.sh
    "

    for path in $parser_paths; do
        if [ -f "$path" ]; then
            . "$path"
            return 0
        fi
    done

    error "NFO parser not found. Install secubox-app-streamlit-forge or include nfo-parser.sh"
}

# ─────────────────────────────────────────────────────────────────────────────────
# Check prerequisites
# ─────────────────────────────────────────────────────────────────────────────────
check_prerequisites() {
    log "Checking prerequisites..."

    # Must have NFO file
    [ ! -f "$NFO_FILE" ] && error "README.nfo not found in $SCRIPT_DIR"

    # Parse and validate NFO
    nfo_parse "$NFO_FILE" || error "Failed to parse README.nfo"

    APP_ID=$(nfo_get identity id)
    APP_NAME=$(nfo_get identity name)
    APP_VERSION=$(nfo_get identity version)
    APP_TYPE=$(nfo_get runtime type)

    [ -z "$APP_ID" ] && error "Missing [identity] id in README.nfo"
    [ -z "$APP_TYPE" ] && error "Missing [runtime] type in README.nfo"

    info "Module: $APP_NAME v$APP_VERSION ($APP_TYPE)"
}

# ─────────────────────────────────────────────────────────────────────────────────
# Install system dependencies
# ─────────────────────────────────────────────────────────────────────────────────
install_system_deps() {
    local opkg_deps=$(nfo_get dependencies opkg)
    local sys_deps=$(nfo_get dependencies system)

    if [ -n "$opkg_deps" ]; then
        log "Installing system packages: $opkg_deps"
        echo "$opkg_deps" | tr ',' '\n' | while read pkg; do
            [ -z "$pkg" ] && continue
            opkg list-installed | grep -q "^$pkg " || opkg install "$pkg" 2>/dev/null || warn "Failed to install: $pkg"
        done
    fi
}

# ─────────────────────────────────────────────────────────────────────────────────
# Install Python dependencies
# ─────────────────────────────────────────────────────────────────────────────────
install_python_deps() {
    local py_deps=$(nfo_get dependencies python)
    local pip_extra=$(nfo_get dependencies pip_extra)

    # Check for requirements.txt
    if [ -f "${SCRIPT_DIR}/requirements.txt" ]; then
        log "Installing from requirements.txt..."
        pip3 install -q -r "${SCRIPT_DIR}/requirements.txt" 2>/dev/null || warn "Some pip packages failed"
    elif [ -n "$py_deps" ]; then
        log "Installing Python packages: $py_deps"
        echo "$py_deps" | tr ',' '\n' | while read pkg; do
            [ -z "$pkg" ] && continue
            pip3 install -q "$pkg" 2>/dev/null || warn "Failed to install: $pkg"
        done
    fi

    if [ -n "$pip_extra" ]; then
        log "Installing extra pip packages: $pip_extra"
        pip3 install -q $pip_extra 2>/dev/null || warn "Some extra packages failed"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────────
# Configure Streamlit app
# ─────────────────────────────────────────────────────────────────────────────────
configure_streamlit() {
    local apps_dir="/srv/streamlit/apps"
    local target_dir="${apps_dir}/${APP_ID}"

    log "Configuring Streamlit app: $APP_ID"

    # Create app directory
    mkdir -p "$target_dir"

    # Copy source files
    if [ -d "${SCRIPT_DIR}/src" ]; then
        cp -r "${SCRIPT_DIR}/src/"* "$target_dir/"
    elif [ -f "${SCRIPT_DIR}/app.py" ]; then
        cp "${SCRIPT_DIR}/app.py" "$target_dir/"
        [ -f "${SCRIPT_DIR}/requirements.txt" ] && cp "${SCRIPT_DIR}/requirements.txt" "$target_dir/"
    fi

    # Copy NFO
    cp "$NFO_FILE" "$target_dir/README.nfo"

    # Get runtime settings
    local port=$(nfo_get runtime port "auto")
    local memory=$(nfo_get runtime memory "512M")
    local entrypoint=$(nfo_get runtime entrypoint "app.py")

    # Auto-assign port if needed
    if [ "$port" = "auto" ]; then
        port=$(slforge _next_port 2>/dev/null || echo "8501")
    fi

    # Configure UCI
    log "Creating UCI configuration..."
    uci -q batch << EOF
set streamlit-forge.${APP_ID}=app
set streamlit-forge.${APP_ID}.name='${APP_NAME}'
set streamlit-forge.${APP_ID}.enabled='1'
set streamlit-forge.${APP_ID}.port='${port}'
set streamlit-forge.${APP_ID}.entrypoint='${entrypoint}'
set streamlit-forge.${APP_ID}.memory='${memory}'
commit streamlit-forge
EOF

    # Launcher settings
    local on_demand=$(nfo_get launcher on_demand "1")
    local priority=$(nfo_get launcher priority "50")
    local always_on=$(nfo_get launcher always_on "0")

    if [ -f /etc/config/streamlit-launcher ]; then
        uci -q batch << EOF
set streamlit-launcher.${APP_ID}=priority
set streamlit-launcher.${APP_ID}.app='${APP_ID}'
set streamlit-launcher.${APP_ID}.value='${priority}'
set streamlit-launcher.${APP_ID}.always_on='${always_on}'
commit streamlit-launcher
EOF
    fi

    # Exposure settings
    local auto_expose=$(nfo_get exposure auto_expose "0")
    local domain_prefix=$(nfo_get exposure domain_prefix "$APP_ID")

    if [ "$auto_expose" = "1" ]; then
        log "Auto-exposing app..."
        slforge expose "$APP_ID" 2>/dev/null || warn "Failed to expose app"
    fi

    info "Streamlit app installed at: $target_dir"
    info "Port: $port"
}

# ─────────────────────────────────────────────────────────────────────────────────
# Configure MetaBlog site
# ─────────────────────────────────────────────────────────────────────────────────
configure_metablog() {
    local sites_dir="/srv/metablogizer/sites"
    local target_dir="${sites_dir}/${APP_ID}"

    log "Configuring MetaBlog site: $APP_ID"

    # Create site directory
    mkdir -p "$target_dir"

    # Copy source files
    if [ -d "${SCRIPT_DIR}/content" ]; then
        cp -r "${SCRIPT_DIR}/content" "$target_dir/"
    fi
    if [ -d "${SCRIPT_DIR}/templates" ]; then
        cp -r "${SCRIPT_DIR}/templates" "$target_dir/"
    fi

    # Copy NFO
    cp "$NFO_FILE" "$target_dir/README.nfo"

    # Get settings
    local domain_prefix=$(nfo_get exposure domain_prefix "$APP_ID")

    # Configure UCI
    log "Creating UCI configuration..."
    uci -q batch << EOF
set metablogizer.${APP_ID}=site
set metablogizer.${APP_ID}.name='${APP_NAME}'
set metablogizer.${APP_ID}.enabled='1'
commit metablogizer
EOF

    info "MetaBlog site installed at: $target_dir"
}

# ─────────────────────────────────────────────────────────────────────────────────
# Post-install hooks
# ─────────────────────────────────────────────────────────────────────────────────
run_post_install() {
    local hooks_post=$(nfo_get dynamics hooks_post)

    if [ -n "$hooks_post" ]; then
        log "Running post-install hooks..."
        echo "$hooks_post" | tr ',' '\n' | while read hook; do
            [ -z "$hook" ] && continue
            if [ -f "${SCRIPT_DIR}/$hook" ]; then
                sh "${SCRIPT_DIR}/$hook" || warn "Hook failed: $hook"
            fi
        done
    fi

    # Run custom post-install script if exists
    if [ -f "${SCRIPT_DIR}/post-install.sh" ]; then
        log "Running post-install.sh..."
        sh "${SCRIPT_DIR}/post-install.sh" || warn "post-install.sh failed"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────────
# Generate catalog entry
# ─────────────────────────────────────────────────────────────────────────────────
generate_catalog_entry() {
    local catalog_dir="/usr/share/secubox/plugins/catalog"
    local entry_file="${catalog_dir}/${APP_TYPE}-${APP_ID}.json"

    mkdir -p "$catalog_dir"

    log "Generating catalog entry..."

    local category=$(nfo_get tags category "apps")
    local short_desc=$(nfo_get description short "$APP_NAME")
    local keywords=$(nfo_get tags keywords | tr ',' ' ')

    cat > "$entry_file" << EOF
{
    "id": "${APP_TYPE}-${APP_ID}",
    "name": "${APP_NAME}",
    "version": "${APP_VERSION}",
    "type": "${APP_TYPE}",
    "category": "${category}",
    "description": "${short_desc}",
    "keywords": "${keywords}",
    "runtime": "${APP_TYPE}",
    "actions": {
        "start": "slforge start ${APP_ID}",
        "stop": "slforge stop ${APP_ID}",
        "status": "slforge status ${APP_ID}"
    },
    "installed": "$(date -Iseconds)"
}
EOF

    info "Catalog entry: $entry_file"
}

# ─────────────────────────────────────────────────────────────────────────────────
# Uninstall
# ─────────────────────────────────────────────────────────────────────────────────
do_uninstall() {
    load_parser
    check_prerequisites

    log "Uninstalling: $APP_NAME ($APP_ID)"

    case "$APP_TYPE" in
        streamlit)
            slforge stop "$APP_ID" 2>/dev/null
            slforge delete "$APP_ID" 2>/dev/null
            rm -rf "/srv/streamlit/apps/${APP_ID}"
            uci -q delete "streamlit-forge.${APP_ID}"
            uci -q delete "streamlit-launcher.${APP_ID}"
            uci commit
            ;;
        metablog)
            metablogizerctl delete "$APP_ID" 2>/dev/null
            rm -rf "/srv/metablogizer/sites/${APP_ID}"
            uci -q delete "metablogizer.${APP_ID}"
            uci commit
            ;;
    esac

    rm -f "/usr/share/secubox/plugins/catalog/${APP_TYPE}-${APP_ID}.json"

    log "Uninstall complete"
}

# ─────────────────────────────────────────────────────────────────────────────────
# Show info
# ─────────────────────────────────────────────────────────────────────────────────
do_info() {
    load_parser
    [ ! -f "$NFO_FILE" ] && error "README.nfo not found"

    nfo_parse "$NFO_FILE"
    nfo_summary
}

# ─────────────────────────────────────────────────────────────────────────────────
# Main install
# ─────────────────────────────────────────────────────────────────────────────────
do_install() {
    show_banner
    load_parser
    check_prerequisites

    log "Installing: $APP_NAME v$APP_VERSION"

    # Install dependencies
    install_system_deps
    install_python_deps

    # Configure based on type
    case "$APP_TYPE" in
        streamlit)
            configure_streamlit
            ;;
        metablog)
            configure_metablog
            ;;
        *)
            warn "Unknown runtime type: $APP_TYPE - attempting generic install"
            ;;
    esac

    # Generate catalog entry
    generate_catalog_entry

    # Post-install hooks
    run_post_install

    # Regenerate hub
    if command -v hub-generator >/dev/null 2>&1; then
        log "Regenerating hub..."
        hub-generator 2>/dev/null &
    fi

    echo ""
    log "Installation complete!"
    info "Log file: $INSTALL_LOG"

    # Show summary
    nfo_summary
}

# ─────────────────────────────────────────────────────────────────────────────────
# Usage
# ─────────────────────────────────────────────────────────────────────────────────
usage() {
    cat << EOF
SecuBox Module Installer

Usage: $0 [command]

Commands:
    install     Install the module (default)
    uninstall   Remove the module
    info        Show module information
    validate    Validate README.nfo
    help        Show this help

The installer reads README.nfo from the same directory and:
- Installs system and Python dependencies
- Configures UCI settings
- Sets up launcher priorities
- Creates catalog entry
- Optionally exposes the service

EOF
}

# ─────────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────────
case "${1:-install}" in
    install)   do_install ;;
    uninstall) do_uninstall ;;
    info)      do_info ;;
    validate)
        load_parser
        nfo_validate "$NFO_FILE" && log "NFO is valid"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        usage
        exit 1
        ;;
esac
