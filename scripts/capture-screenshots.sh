#!/bin/bash
# SecuBox Screenshot Capture Script
# Captures screenshots of all LuCI modules using headless Chrome

set -e

ROUTER="192.168.255.1"
BASE_URL="https://${ROUTER}/cgi-bin/luci"
OUTPUT_DIR="$(dirname "$0")/../docs/screenshots/router"
USERNAME="${LUCI_USER:-root}"
PASSWORD="${LUCI_PASS:-c3box}"
WINDOW_SIZE="1920,1080"
DELAY=3  # seconds to wait for page load

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[-]${NC} $1"; }

# Get auth token via curl
get_auth_token() {
    log "Authenticating to LuCI..."

    # Get the initial token from login page
    local login_page=$(curl -sk "${BASE_URL}/")
    local token=$(echo "$login_page" | grep -oP 'name="token" value="\K[^"]+' | head -1)

    if [ -z "$token" ]; then
        # Try alternative method - get sysauth cookie directly
        local response=$(curl -sk -c - -X POST "${BASE_URL}/" \
            -d "luci_username=${USERNAME}" \
            -d "luci_password=${PASSWORD}" \
            -L 2>&1)

        SYSAUTH=$(echo "$response" | grep sysauth | awk '{print $NF}')
    else
        # Login with token
        local response=$(curl -sk -c - -X POST "${BASE_URL}/" \
            -d "token=${token}" \
            -d "luci_username=${USERNAME}" \
            -d "luci_password=${PASSWORD}" \
            -L 2>&1)

        SYSAUTH=$(echo "$response" | grep sysauth | awk '{print $NF}')
    fi

    if [ -z "$SYSAUTH" ]; then
        error "Failed to get auth token"
        return 1
    fi

    log "Got auth token: ${SYSAUTH:0:20}..."
    echo "$SYSAUTH"
}

# Capture screenshot using headless Chrome
capture() {
    local name="$1"
    local path="$2"
    local output="${OUTPUT_DIR}/${name}.png"
    local url="${BASE_URL}${path}"

    log "Capturing: $name -> $output"

    # Use chromium headless with cookie
    google-chrome --headless --disable-gpu --screenshot="$output" \
        --window-size="$WINDOW_SIZE" \
        --ignore-certificate-errors \
        --disable-web-security \
        --user-data-dir=/tmp/chrome-secubox-$$ \
        "$url" 2>/dev/null || \
    chromium-browser --headless --disable-gpu --screenshot="$output" \
        --window-size="$WINDOW_SIZE" \
        --ignore-certificate-errors \
        --disable-web-security \
        --user-data-dir=/tmp/chrome-secubox-$$ \
        "$url" 2>/dev/null || \
    chromium --headless --disable-gpu --screenshot="$output" \
        --window-size="$WINDOW_SIZE" \
        --ignore-certificate-errors \
        --disable-web-security \
        --user-data-dir=/tmp/chrome-secubox-$$ \
        "$url" 2>/dev/null

    if [ -f "$output" ]; then
        local size=$(du -h "$output" | cut -f1)
        log "  Saved: $output ($size)"
        return 0
    else
        error "  Failed to capture: $name"
        return 1
    fi
}

# Capture with puppeteer for better auth handling
capture_with_puppeteer() {
    local name="$1"
    local path="$2"
    local output="${OUTPUT_DIR}/${name}.png"
    local url="${BASE_URL}${path}"

    log "Capturing: $name"

    node - <<EOF
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--ignore-certificate-errors',
            '--disable-web-security',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Login first
    await page.goto('${BASE_URL}/', { waitUntil: 'networkidle2' });
    await page.type('input[name="luci_username"]', '${USERNAME}');
    await page.type('input[name="luci_password"]', '${PASSWORD}');
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Navigate to target page
    await page.goto('${url}', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, ${DELAY}000));

    // Take screenshot
    await page.screenshot({ path: '${output}', fullPage: false });

    await browser.close();
    console.log('Captured: ${output}');
})();
EOF
}

# Module definitions: name -> LuCI path
declare -A MODULES=(
    # Core & Dashboard
    ["hub"]="/admin/status/overview"
    ["portal"]="/admin/secubox/portal"
    ["metrics"]="/admin/secubox/metrics"
    ["admin"]="/admin/secubox/admin"
    ["login"]="/"

    # Security
    ["crowdsec"]="/admin/secubox/crowdsec"
    ["waf"]="/admin/secubox/mitmproxy"
    ["threats"]="/admin/secubox/threats"
    ["threat-analyst"]="/admin/secubox/threat-analyst"
    ["dnsguard"]="/admin/secubox/dnsguard"
    ["auth"]="/admin/secubox/auth-guardian"
    ["clients"]="/admin/secubox/client-guardian"
    ["mac"]="/admin/secubox/mac-guardian"
    ["iot"]="/admin/secubox/iot-guard"
    ["ipblocklist"]="/admin/secubox/ipblocklist"
    ["zkp"]="/admin/secubox/zkp"
    ["cve"]="/admin/secubox/cve-triage"
    ["cookies"]="/admin/secubox/cookie-tracker"
    ["avatar-tap"]="/admin/secubox/avatar-tap"
    ["interceptor"]="/admin/secubox/interceptor"

    # Network
    ["netmodes"]="/admin/secubox/network-modes"
    ["bandwidth"]="/admin/secubox/bandwidth"
    ["traffic"]="/admin/secubox/traffic-shaper"
    ["haproxy"]="/admin/secubox/haproxy"
    ["vhost"]="/admin/secubox/vhost-manager"
    ["cdn"]="/admin/secubox/cdn-cache"
    ["tweaks"]="/admin/secubox/network-tweaks"
    ["routes"]="/admin/secubox/routes-status"
    ["netdiag"]="/admin/secubox/netdiag"

    # Monitoring
    ["netdata"]="/admin/secubox/netdata"
    ["dpi"]="/admin/secubox/netifyd"
    ["dpi-dual"]="/admin/secubox/dpi-dual"
    ["device-intel"]="/admin/secubox/device-intel"
    ["mediaflow"]="/admin/secubox/media-flow"
    ["watchdog"]="/admin/secubox/watchdog"
    ["glances"]="/admin/secubox/glances"
    ["anomaly"]="/admin/secubox/network-anomaly"

    # VPN & Mesh
    ["wireguard"]="/admin/secubox/wireguard"
    ["mesh"]="/admin/secubox/mesh"
    ["p2p"]="/admin/secubox/p2p"
    ["mirror"]="/admin/secubox/mirror"
    ["master-link"]="/admin/secubox/master-link"

    # DNS
    ["dns"]="/admin/secubox/dns-master"
    ["vortex-dns"]="/admin/secubox/vortex-dns"
    ["meshname"]="/admin/secubox/meshname-dns"
    ["dns-provider"]="/admin/secubox/dns-provider"

    # Privacy
    ["tor"]="/admin/secubox/tor-shield"
    ["exposure"]="/admin/secubox/exposure"

    # Publishing
    ["metablogizer"]="/admin/secubox/metablogizer"
    ["droplet"]="/admin/secubox/droplet"
    ["streamforge"]="/admin/secubox/streamlit-forge"
    ["streamlit"]="/admin/secubox/streamlit"
    ["metacatalog"]="/admin/secubox/metacatalog"

    # Apps
    ["jellyfin"]="/admin/secubox/jellyfin"
    ["lyrion"]="/admin/secubox/lyrion"
    ["nextcloud"]="/admin/secubox/nextcloud"
    ["gitea"]="/admin/secubox/gitea"
    ["peertube"]="/admin/secubox/peertube"
    ["photoprism"]="/admin/secubox/photoprism"
    ["jitsi"]="/admin/secubox/jitsi"
    ["matrix"]="/admin/secubox/matrix"
    ["domoticz"]="/admin/secubox/domoticz"
    ["zigbee"]="/admin/secubox/zigbee2mqtt"

    # System
    ["settings"]="/admin/secubox/settings"
    ["config-vault"]="/admin/secubox/config-vault"
    ["config-advisor"]="/admin/secubox/config-advisor"
    ["smtp"]="/admin/secubox/smtp-relay"
    ["reporter"]="/admin/secubox/reporter"
    ["rtty"]="/admin/secubox/rtty-remote"
    ["backup"]="/admin/secubox/backup"
    ["users"]="/admin/secubox/users"

    # AI
    ["ai-gateway"]="/admin/secubox/ai-gateway"
    ["ai-insights"]="/admin/secubox/ai-insights"
    ["localai"]="/admin/secubox/localai"
    ["ollama"]="/admin/secubox/ollama"
    ["localrecall"]="/admin/secubox/localrecall"

    # Theme
    ["theme"]="/admin/system/system"
)

# Main
main() {
    log "SecuBox Screenshot Capture"
    log "Router: $ROUTER"
    log "Output: $OUTPUT_DIR"
    log "Modules: ${#MODULES[@]}"
    echo

    # Check if puppeteer is available
    if command -v node &>/dev/null && node -e "require('puppeteer')" 2>/dev/null; then
        log "Using Puppeteer for capture"
        USE_PUPPETEER=1
    else
        log "Using headless Chrome directly"
        USE_PUPPETEER=0
    fi

    # Capture specific module or all
    if [ -n "$1" ]; then
        if [ -n "${MODULES[$1]}" ]; then
            if [ "$USE_PUPPETEER" = "1" ]; then
                capture_with_puppeteer "$1" "${MODULES[$1]}"
            else
                capture "$1" "${MODULES[$1]}"
            fi
        else
            error "Unknown module: $1"
            echo "Available modules:"
            printf '%s\n' "${!MODULES[@]}" | sort | column
            exit 1
        fi
    else
        # Capture all modules
        local count=0
        local total=${#MODULES[@]}

        for name in $(printf '%s\n' "${!MODULES[@]}" | sort); do
            ((count++))
            echo
            log "[$count/$total] $name"

            if [ "$USE_PUPPETEER" = "1" ]; then
                capture_with_puppeteer "$name" "${MODULES[$name]}" || true
            else
                capture "$name" "${MODULES[$name]}" || true
            fi

            sleep 1
        done

        echo
        log "Screenshot capture complete!"
        log "Output directory: $OUTPUT_DIR"
        ls -la "$OUTPUT_DIR"/*.png 2>/dev/null | wc -l | xargs -I{} log "Captured: {} screenshots"
    fi
}

main "$@"
