#!/bin/bash
# SecuBox Repository Deployment Script
# Deploys all built packages to repo.secubox.in (c3box.local)
# Unifies secubox-app-bonus and secubox-app-repo into one repository

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
REPO_HOST="${REPO_HOST:-root@c3box.local}"
REPO_PATH="${REPO_PATH:-/srv/repo.secubox.in}"
SDK_PATH="${SDK_PATH:-$SCRIPT_DIR/sdk}"
LOCAL_STAGING="${LOCAL_STAGING:-/tmp/secubox-repo-staging}"

# SSH multiplexing
SSH_CONTROL_PATH="/tmp/ssh-repo-%r@%h:%p"
SSH_OPTS="-o RequestTTY=no -o ForwardX11=no -o StrictHostKeyChecking=no -o ControlMaster=auto -o ControlPath=$SSH_CONTROL_PATH -o ControlPersist=600"

# Architectures to include
ARCHS=(
    "aarch64_cortex-a72"
    "aarch64_cortex-a53"
    "aarch64_generic"
    "x86_64"
    "mips_24kc"
    "mipsel_24kc"
)

usage() {
    cat <<'USAGE'
Usage: repo-deploy.sh [command] [options]

Commands:
  stage                 Prepare packages locally (default)
  deploy [host]         Deploy to remote host (default: c3box.local)
  local <path>          Deploy to local directory
  index                 Generate Packages indexes only
  status                Show staging status

Options:
  --sdk <path>          SDK path (default: secubox-tools/sdk)
  --staging <path>      Local staging directory (default: /tmp/secubox-repo-staging)
  --arch <arch>         Process only specific architecture
  --clean               Clean staging before processing
  -h, --help            Show this message

Examples:
  ./repo-deploy.sh stage              # Stage packages from SDK build
  ./repo-deploy.sh deploy             # Deploy to c3box.local
  ./repo-deploy.sh deploy root@192.168.255.1  # Deploy to specific host
  ./repo-deploy.sh local /srv/repo    # Deploy to local path
USAGE
    exit 1
}

log() {
    echo -e "[$(date +'%H:%M:%S')] $*"
}

error() {
    echo -e "[ERROR] $*" >&2
    exit 1
}

remote_exec() {
    ssh $SSH_OPTS "$REPO_HOST" "$@"
}

# Find all built packages
find_packages() {
    local arch="$1"
    local sdk_pkg_dir="$SDK_PATH/bin/packages/$arch"

    if [[ -d "$sdk_pkg_dir" ]]; then
        find "$sdk_pkg_dir" -type f -name "*.ipk" 2>/dev/null
    fi
}

# Generate Packages index for a directory
generate_index() {
    local dir="$1"

    if [[ ! -d "$dir" ]]; then
        log "  Skipping $dir (not found)"
        return
    fi

    local pkg_count=0

    # Generate Packages file
    rm -f "$dir/Packages" "$dir/Packages.gz"

    for ipk in "$dir"/*.ipk; do
        [[ -f "$ipk" ]] || continue
        pkg_count=$((pkg_count + 1))

        local filename=$(basename "$ipk")
        local size=$(stat -c%s "$ipk" 2>/dev/null || ls -l "$ipk" | awk '{print $5}')
        local md5=$(md5sum "$ipk" | cut -d' ' -f1)
        local sha256=$(sha256sum "$ipk" | cut -d' ' -f1)

        # Extract package info from ipk
        local pkg_name=$(echo "$filename" | sed 's/_.*//g')
        local version=$(echo "$filename" | sed 's/^[^_]*_//; s/_[^_]*$//')
        local arch_name=$(echo "$filename" | sed 's/.*_//; s/\.ipk$//')

        cat >> "$dir/Packages" <<EOF
Package: $pkg_name
Version: $version
Architecture: $arch_name
Filename: $filename
Size: $size
MD5Sum: $md5
SHA256sum: $sha256

EOF
    done

    if [[ $pkg_count -gt 0 ]]; then
        gzip -9c "$dir/Packages" > "$dir/Packages.gz"
        log "  Generated index: $pkg_count packages"
    else
        log "  No packages found"
    fi
}

# Stage packages locally
cmd_stage() {
    log "Staging packages to $LOCAL_STAGING"

    if [[ "$CLEAN" == "1" ]]; then
        log "Cleaning staging directory..."
        rm -rf "$LOCAL_STAGING"
    fi

    mkdir -p "$LOCAL_STAGING/luci" "$LOCAL_STAGING/packages"

    local total_luci=0
    local total_pkg=0
    local source_arch=""

    # First pass: find which architectures have actual build output
    for arch in "${ARCHS[@]}"; do
        local sdk_pkg_dir="$SDK_PATH/bin/packages/$arch"
        if [[ -d "$sdk_pkg_dir" ]]; then
            source_arch="$arch"
            break
        fi
    done

    if [[ -z "$source_arch" ]]; then
        error "No SDK build output found for any architecture"
    fi

    log "Source architecture: $source_arch"
    log "Will replicate _all.ipk packages to all architectures"

    # Collect architecture-independent packages (all.ipk)
    local all_luci_pkgs=()
    local all_other_pkgs=()
    local arch_specific_pkgs=()

    local secubox_dir="$SDK_PATH/bin/packages/$source_arch/secubox"
    if [[ -d "$secubox_dir" ]]; then
        for ipk in "$secubox_dir"/*.ipk; do
            [[ -f "$ipk" ]] || continue
            local name=$(basename "$ipk")
            if [[ "$name" == *_all.ipk ]]; then
                if [[ "$name" == luci-* ]]; then
                    all_luci_pkgs+=("$ipk")
                else
                    all_other_pkgs+=("$ipk")
                fi
            else
                arch_specific_pkgs+=("$ipk")
            fi
        done
    fi

    local deps_dir="$SDK_PATH/bin/packages/$source_arch/packages"
    if [[ -d "$deps_dir" ]]; then
        for ipk in "$deps_dir"/*.ipk; do
            [[ -f "$ipk" ]] || continue
            local name=$(basename "$ipk")
            if [[ "$name" == *_all.ipk ]]; then
                all_other_pkgs+=("$ipk")
            else
                arch_specific_pkgs+=("$ipk")
            fi
        done
    fi

    # Process each target architecture
    for arch in "${ARCHS[@]}"; do
        if [[ -n "$SINGLE_ARCH" && "$arch" != "$SINGLE_ARCH" ]]; then
            continue
        fi

        log "Processing architecture: $arch"
        mkdir -p "$LOCAL_STAGING/luci/$arch"
        mkdir -p "$LOCAL_STAGING/packages/$arch"

        # Copy architecture-independent LuCI packages
        for ipk in "${all_luci_pkgs[@]}"; do
            cp "$ipk" "$LOCAL_STAGING/luci/$arch/"
            total_luci=$((total_luci + 1))
        done

        # Copy architecture-independent other packages
        for ipk in "${all_other_pkgs[@]}"; do
            cp "$ipk" "$LOCAL_STAGING/packages/$arch/"
            total_pkg=$((total_pkg + 1))
        done

        # Copy architecture-specific packages only to matching arch
        if [[ "$arch" == "$source_arch" ]]; then
            for ipk in "${arch_specific_pkgs[@]}"; do
                local name=$(basename "$ipk")
                if [[ "$name" == luci-* ]]; then
                    cp "$ipk" "$LOCAL_STAGING/luci/$arch/"
                    total_luci=$((total_luci + 1))
                else
                    cp "$ipk" "$LOCAL_STAGING/packages/$arch/"
                    total_pkg=$((total_pkg + 1))
                fi
            done
        fi

        # Generate indexes
        log "  Generating indexes..."
        generate_index "$LOCAL_STAGING/luci/$arch"
        generate_index "$LOCAL_STAGING/packages/$arch"
    done

    # Create index.html landing page
    create_landing_page

    log ""
    log "Staging complete:"
    log "  LuCI packages: $total_luci"
    log "  Other packages: $total_pkg"
    log "  Location: $LOCAL_STAGING"
}

# Create landing page
create_landing_page() {
    cat > "$LOCAL_STAGING/index.html" <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SecuBox Package Repository</title>
    <style>
        :root {
            --bg: #0d1117;
            --fg: #c9d1d9;
            --accent: #58a6ff;
            --border: #30363d;
            --code-bg: #161b22;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--fg);
            max-width: 900px;
            margin: 0 auto;
            padding: 2em 1em;
            line-height: 1.6;
        }
        h1 { color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 0.5em; }
        h2 { color: var(--fg); margin-top: 2em; }
        a { color: var(--accent); text-decoration: none; }
        a:hover { text-decoration: underline; }
        code, pre {
            background: var(--code-bg);
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
        }
        pre { padding: 1em; overflow-x: auto; }
        .arch-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1em;
            margin: 1em 0;
        }
        .arch-card {
            background: var(--code-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1em;
        }
        .arch-card h3 { margin: 0 0 0.5em 0; color: var(--accent); }
        .arch-card ul { margin: 0; padding-left: 1.2em; }
        .stats { color: #8b949e; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>SecuBox Package Repository</h1>
    <p>Official package repository for <a href="https://secubox.cybermood.eu">SecuBox</a> - Security modules for OpenWrt.</p>

    <h2>Quick Setup</h2>
    <p>Add to <code>/etc/opkg/customfeeds.conf</code>:</p>
    <pre>src/gz secubox_luci https://repo.secubox.in/luci/{ARCH}
src/gz secubox_packages https://repo.secubox.in/packages/{ARCH}</pre>
    <p>Replace <code>{ARCH}</code> with your architecture below.</p>

    <h2>Available Architectures</h2>
    <div class="arch-grid">
        <div class="arch-card">
            <h3>aarch64_cortex-a72</h3>
            <p>Raspberry Pi 4, MochaBin</p>
            <ul>
                <li><a href="luci/aarch64_cortex-a72/">LuCI Packages</a></li>
                <li><a href="packages/aarch64_cortex-a72/">Core Packages</a></li>
            </ul>
        </div>
        <div class="arch-card">
            <h3>aarch64_cortex-a53</h3>
            <p>EspressoBin, Sheeva64</p>
            <ul>
                <li><a href="luci/aarch64_cortex-a53/">LuCI Packages</a></li>
                <li><a href="packages/aarch64_cortex-a53/">Core Packages</a></li>
            </ul>
        </div>
        <div class="arch-card">
            <h3>aarch64_generic</h3>
            <p>NanoPi R4S/R5S, Rockchip</p>
            <ul>
                <li><a href="luci/aarch64_generic/">LuCI Packages</a></li>
                <li><a href="packages/aarch64_generic/">Core Packages</a></li>
            </ul>
        </div>
        <div class="arch-card">
            <h3>x86_64</h3>
            <p>VMs, x86-64 devices</p>
            <ul>
                <li><a href="luci/x86_64/">LuCI Packages</a></li>
                <li><a href="packages/x86_64/">Core Packages</a></li>
            </ul>
        </div>
        <div class="arch-card">
            <h3>mips_24kc</h3>
            <p>Atheros/QCA routers</p>
            <ul>
                <li><a href="luci/mips_24kc/">LuCI Packages</a></li>
                <li><a href="packages/mips_24kc/">Core Packages</a></li>
            </ul>
        </div>
        <div class="arch-card">
            <h3>mipsel_24kc</h3>
            <p>MT7621 (Xiaomi, etc)</p>
            <ul>
                <li><a href="luci/mipsel_24kc/">LuCI Packages</a></li>
                <li><a href="packages/mipsel_24kc/">Core Packages</a></li>
            </ul>
        </div>
    </div>

    <h2>Installation Example</h2>
    <pre># Update feeds
opkg update

# Install SecuBox Hub
opkg install luci-app-secubox

# Install CrowdSec WAF
opkg install luci-app-secubox-crowdsec secubox-app-crowdsec

# Install bandwidth manager
opkg install luci-app-bandwidth-manager</pre>

    <h2>Documentation</h2>
    <ul>
        <li><a href="https://secubox.cybermood.eu/docs/">SecuBox Documentation</a></li>
        <li><a href="https://github.com/gkerma/secubox-openwrt">GitHub Repository</a></li>
    </ul>

    <p class="stats">Updated: __TIMESTAMP__</p>
</body>
</html>
HTML

    # Replace timestamp
    sed -i "s/__TIMESTAMP__/$(date -Iseconds)/" "$LOCAL_STAGING/index.html"
}

# Deploy to remote host
cmd_deploy() {
    local target="${1:-$REPO_HOST}"
    REPO_HOST="$target"

    log "Deploying to $REPO_HOST:$REPO_PATH"

    # Check if staging exists
    if [[ ! -d "$LOCAL_STAGING" || ! -f "$LOCAL_STAGING/index.html" ]]; then
        log "Staging directory not found. Running stage first..."
        cmd_stage
    fi

    # Test SSH connection
    log "Testing connection..."
    if ! remote_exec "echo ok" >/dev/null 2>&1; then
        error "Cannot connect to $REPO_HOST"
    fi

    # Create target directory
    remote_exec "mkdir -p '$REPO_PATH'"

    # Sync using rsync or scp+tar fallback
    log "Syncing packages..."

    if command -v rsync >/dev/null 2>&1; then
        rsync -avz --delete \
            -e "ssh $SSH_OPTS" \
            "$LOCAL_STAGING/" \
            "$REPO_HOST:$REPO_PATH/"
    else
        # Fallback: tar and scp
        local archive="/tmp/secubox-repo-$(date +%s).tar.gz"
        tar -czf "$archive" -C "$LOCAL_STAGING" .
        scp -o "ControlPath=$SSH_CONTROL_PATH" "$archive" "$REPO_HOST:/tmp/"
        remote_exec "cd '$REPO_PATH' && tar -xzf /tmp/$(basename "$archive") && rm -f /tmp/$(basename "$archive")"
        rm -f "$archive"
    fi

    # Sign packages on router (regenerates indexes with signatures)
    log "Signing packages on router..."
    if remote_exec "/usr/libexec/rpcd/luci.repo call refresh" >/dev/null 2>&1; then
        log "Package indexes signed successfully"
    else
        log "Warning: Could not sign packages. Run manually:"
        log "  /usr/libexec/rpcd/luci.repo call refresh"
    fi

    log ""
    log "Deployment complete to $REPO_HOST:$REPO_PATH"
    log "Repository URL: https://repo.secubox.in/"
}

# Deploy to local directory
cmd_local() {
    local target="${1:-}"

    if [[ -z "$target" ]]; then
        error "Local path required: repo-deploy.sh local /path/to/repo"
    fi

    log "Deploying to local path: $target"

    # Check if staging exists
    if [[ ! -d "$LOCAL_STAGING" || ! -f "$LOCAL_STAGING/index.html" ]]; then
        log "Staging directory not found. Running stage first..."
        cmd_stage
    fi

    mkdir -p "$target"

    # Copy with rsync or cp
    if command -v rsync >/dev/null 2>&1; then
        rsync -av --delete "$LOCAL_STAGING/" "$target/"
    else
        rm -rf "$target"/*
        cp -r "$LOCAL_STAGING"/* "$target/"
    fi

    log "Deployed to $target"
}

# Show status
cmd_status() {
    log "SecuBox Repository Staging Status"
    log "=================================="
    log ""
    log "SDK Path: $SDK_PATH"
    log "Staging: $LOCAL_STAGING"
    log ""

    if [[ ! -d "$LOCAL_STAGING" ]]; then
        log "Staging directory not found. Run 'repo-deploy.sh stage' first."
        return
    fi

    log "Staged packages:"
    for arch in "${ARCHS[@]}"; do
        local luci_count=0
        local pkg_count=0

        if [[ -d "$LOCAL_STAGING/luci/$arch" ]]; then
            luci_count=$(ls "$LOCAL_STAGING/luci/$arch"/*.ipk 2>/dev/null | wc -l || echo 0)
        fi
        if [[ -d "$LOCAL_STAGING/packages/$arch" ]]; then
            pkg_count=$(ls "$LOCAL_STAGING/packages/$arch"/*.ipk 2>/dev/null | wc -l || echo 0)
        fi

        if [[ $luci_count -gt 0 || $pkg_count -gt 0 ]]; then
            log "  $arch: $luci_count LuCI, $pkg_count packages"
        fi
    done
}

# Parse arguments
COMMAND="${1:-stage}"
shift || true

CLEAN=0
SINGLE_ARCH=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --sdk)
            SDK_PATH="$2"; shift 2 ;;
        --staging)
            LOCAL_STAGING="$2"; shift 2 ;;
        --arch)
            SINGLE_ARCH="$2"; shift 2 ;;
        --clean)
            CLEAN=1; shift ;;
        -h|--help)
            usage ;;
        *)
            # Pass remaining args to command
            break ;;
    esac
done

case "$COMMAND" in
    stage|index)
        cmd_stage ;;
    deploy)
        cmd_deploy "$@" ;;
    local)
        cmd_local "$@" ;;
    status)
        cmd_status ;;
    *)
        usage ;;
esac
