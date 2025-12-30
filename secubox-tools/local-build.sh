#!/bin/bash
#
# local-build.sh - Local build script for SecuBox packages
# Replicates GitHub Actions workflows for local testing
#
# Usage:
#   ./local-build.sh validate                    # Run validation only
#   ./local-build.sh build                       # Build all packages (x86_64)
#   ./local-build.sh build luci-app-system-hub   # Build single package
#   ./local-build.sh build --arch aarch64        # Build for specific architecture
#   ./local-build.sh full                        # Validate + Build
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
# Available versions: 25.12.0-rc1 (default), 24.10.5 (stable LTS), 23.05.5, SNAPSHOT
OPENWRT_VERSION="${OPENWRT_VERSION:-24.10.5}"
SDK_DIR="${SDK_DIR:-./sdk}"
BUILD_DIR="${BUILD_DIR:-./build}"
CACHE_DIR="${CACHE_DIR:-./cache}"
OPENWRT_DIR="${OPENWRT_DIR:-./openwrt}"

# Default architecture
ARCH="x86-64"
ARCH_NAME="x86_64"
SDK_PATH="x86/64"

# Device profiles for firmware building
declare -A DEVICE_PROFILES=(
    ["espressobin-v7"]="mvebu:cortexa53:globalscale_espressobin:ESPRESSObin V7 (1-2GB DDR4)"
    ["espressobin-ultra"]="mvebu:cortexa53:globalscale_espressobin-ultra:ESPRESSObin Ultra (PoE, WiFi)"
    ["sheeva64"]="mvebu:cortexa53:globalscale_sheeva64:Sheeva64 (Plug computer)"
    ["mochabin"]="mvebu:cortexa72:globalscale_mochabin:MOCHAbin (Quad-core A72, 10G)"
    ["x86-64"]="x86:64:generic:x86_64 Generic PC"
)

# Helper functions
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Architecture mapping
set_architecture() {
    case "$1" in
        x86-64|x86_64)
            ARCH="x86-64"
            ARCH_NAME="x86_64"
            SDK_PATH="x86/64"
            ;;
        aarch64-cortex-a53|aarch64_cortex-a53)
            ARCH="aarch64-cortex-a53"
            ARCH_NAME="aarch64_cortex-a53"
            SDK_PATH="mvebu/cortexa53"
            ;;
        aarch64-cortex-a72|aarch64_cortex-a72)
            ARCH="aarch64-cortex-a72"
            ARCH_NAME="aarch64_cortex-a72"
            SDK_PATH="mvebu/cortexa72"
            ;;
        aarch64-generic|aarch64_generic)
            ARCH="aarch64-generic"
            ARCH_NAME="aarch64_generic"
            SDK_PATH="armsr/armv8"
            ;;
        mips-24kc|mips_24kc)
            ARCH="mips-24kc"
            ARCH_NAME="mips_24kc"
            SDK_PATH="ath79/generic"
            ;;
        mipsel-24kc|mipsel_24kc)
            ARCH="mipsel-24kc"
            ARCH_NAME="mipsel_24kc"
            SDK_PATH="ramips/mt7621"
            ;;
        *)
            print_error "Unknown architecture: $1"
            print_info "Supported architectures: x86-64, aarch64-cortex-a53, aarch64-cortex-a72, aarch64-generic, mips-24kc, mipsel-24kc"
            exit 1
            ;;
    esac
    print_info "Architecture: $ARCH ($ARCH_NAME) - SDK: $SDK_PATH"
}

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"

    local missing_deps=()

    # Build tools
    for cmd in make gcc g++ git wget curl tar xz jq ninja; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done

    # Validation tools
    for cmd in shellcheck node; do
        if ! command -v "$cmd" &> /dev/null; then
            print_warning "$cmd not found (optional, needed for validation)"
        fi
    done

    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo ""
        echo "Install them with:"
        echo "  sudo apt-get install -y build-essential clang flex bison g++ gawk \\"
        echo "    gcc-multilib g++-multilib gettext git libncurses5-dev \\"
        echo "    libssl-dev python3-setuptools python3-dev rsync \\"
        echo "    swig unzip zlib1g-dev file wget curl jq ninja-build"
        echo ""
        echo "For validation tools:"
        echo "  sudo apt-get install -y shellcheck nodejs"
        exit 1
    fi

    print_success "All required dependencies found"
}

# Validation functions (from test-validate.yml)
validate_makefiles() {
    print_header "Validating Makefiles"

    local errors=0

    # Validate luci-app-* packages
    for makefile in ../luci-app-*/Makefile; do
        if [[ -f "$makefile" ]]; then
            local pkg=$(dirname "$makefile" | xargs basename)
            echo "  🔍 Checking $pkg..."

            # Required fields
            local required_fields=("PKG_NAME" "PKG_VERSION" "PKG_RELEASE" "PKG_LICENSE")

            for field in "${required_fields[@]}"; do
                if ! grep -q "^${field}:=" "$makefile"; then
                    print_error "Missing: $field in $pkg"
                    errors=$((errors + 1))
                fi
            done

            # Check for include statements
            if ! grep -q "include.*luci.mk\|include.*package.mk" "$makefile"; then
                print_error "Missing include statement in $pkg"
                errors=$((errors + 1))
            fi
        fi
    done

    # Validate luci-theme-* packages
    for makefile in ../luci-theme-*/Makefile; do
        if [[ -f "$makefile" ]]; then
            local pkg=$(dirname "$makefile" | xargs basename)
            echo "  🔍 Checking $pkg..."

            # Required fields
            local required_fields=("PKG_NAME" "PKG_VERSION" "PKG_RELEASE" "PKG_LICENSE")

            for field in "${required_fields[@]}"; do
                if ! grep -q "^${field}:=" "$makefile"; then
                    print_error "Missing: $field in $pkg"
                    errors=$((errors + 1))
                fi
            done

            # Check for include statements
            if ! grep -q "include.*luci.mk\|include.*package.mk" "$makefile"; then
                print_error "Missing include statement in $pkg"
                errors=$((errors + 1))
            fi
        fi
    done

    if [[ $errors -gt 0 ]]; then
        print_error "Found $errors Makefile errors"
        return 1
    fi

    print_success "All Makefiles valid"
    return 0
}

validate_json() {
    print_header "Validating JSON Files"

    local errors=0

    while IFS= read -r jsonfile; do
        echo "  🔍 Checking $(basename "$jsonfile")..."
        if ! jq empty "$jsonfile" 2>/dev/null; then
            print_error "Invalid JSON: $jsonfile"
            errors=$((errors + 1))
        fi
    done < <(find .. -name "*.json" -type f ! -path "*/node_modules/*" ! -path "*/sdk/*" ! -path "*/build/*")

    if [[ $errors -gt 0 ]]; then
        print_error "Found $errors JSON errors"
        return 1
    fi

    print_success "All JSON files valid"
    return 0
}

validate_javascript() {
    print_header "Validating JavaScript Files"

    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found, skipping JavaScript validation"
        return 0
    fi

    local errors=0

    while IFS= read -r jsfile; do
        echo "  🔍 Checking $(basename "$jsfile")..."
        if ! node --check "$jsfile" 2>/dev/null; then
            print_error "Syntax error in: $jsfile"
            errors=$((errors + 1))
        fi
    done < <(find .. -name "*.js" -type f ! -path "*/node_modules/*" ! -path "*/sdk/*" ! -path "*/build/*")

    if [[ $errors -gt 0 ]]; then
        print_error "Found $errors JavaScript errors"
        return 1
    fi

    print_success "All JavaScript files valid"
    return 0
}

validate_shellscripts() {
    print_header "Validating Shell Scripts"

    if ! command -v shellcheck &> /dev/null; then
        print_warning "shellcheck not found, skipping shell script validation"
        return 0
    fi

    local warnings=0

    # Check RPCD scripts
    while IFS= read -r script; do
        echo "  🔍 Checking $(basename "$script")..."
        if ! shellcheck -s sh "$script" 2>/dev/null; then
            warnings=$((warnings + 1))
        fi
    done < <(find .. -path "*/rpcd/*" -type f ! -path "*/sdk/*" ! -path "*/build/*" 2>/dev/null)

    # Check init scripts
    while IFS= read -r script; do
        echo "  🔍 Checking $(basename "$script")..."
        if ! shellcheck -s sh "$script" 2>/dev/null; then
            warnings=$((warnings + 1))
        fi
    done < <(find .. -path "*/init.d/*" -type f ! -path "*/sdk/*" ! -path "*/build/*" 2>/dev/null)

    if [[ $warnings -gt 0 ]]; then
        print_warning "Found $warnings shellcheck warnings (non-blocking)"
    fi

    print_success "Shell script validation complete"
    return 0
}

check_file_permissions() {
    print_header "Checking File Permissions"

    local errors=0

    # RPCD scripts should be executable
    while IFS= read -r script; do
        if [[ ! -x "$script" ]]; then
            print_warning "Not executable: $script (fixing...)"
            chmod +x "$script"
            errors=$((errors + 1))
        fi
    done < <(find .. -path "*/usr/libexec/rpcd/*" -type f ! -path "*/sdk/*" ! -path "*/build/*" 2>/dev/null)

    # Init scripts should be executable
    while IFS= read -r script; do
        if [[ ! -x "$script" ]]; then
            print_warning "Not executable: $script (fixing...)"
            chmod +x "$script"
            errors=$((errors + 1))
        fi
    done < <(find .. -path "*/etc/init.d/*" -type f ! -path "*/sdk/*" ! -path "*/build/*" 2>/dev/null)

    if [[ $errors -gt 0 ]]; then
        print_warning "Fixed $errors permission issues"
    fi

    print_success "File permissions checked"
    return 0
}

# Download and setup SDK
download_sdk() {
    print_header "Downloading OpenWrt SDK"

    local base_url="https://downloads.openwrt.org/releases/${OPENWRT_VERSION}/targets/${SDK_PATH}"

    print_info "OpenWrt version: $OPENWRT_VERSION"
    print_info "Architecture: $ARCH"
    print_info "SDK URL: $base_url"

    # Check cache
    if [[ -d "$SDK_DIR" && -f "$SDK_DIR/.sdk_ready" ]]; then
        local cached_version=$(cat "$SDK_DIR/.sdk_ready")
        if [[ "$cached_version" == "${OPENWRT_VERSION}-${ARCH}" ]]; then
            print_success "Using cached SDK: ${OPENWRT_VERSION}-${ARCH}"
            return 0
        else
            print_info "Cached SDK version mismatch, re-downloading..."
            rm -rf "$SDK_DIR"
        fi
    fi

    # Find SDK filename
    echo "  📥 Fetching SDK list..."
    local sdk_file
    sdk_file=$(curl -sL --retry 3 --retry-delay 5 "$base_url/" | grep -oP 'openwrt-sdk[^"<>]+\.tar\.(xz|zst)' | head -1)

    if [[ -z "$sdk_file" ]]; then
        print_error "Could not find SDK at $base_url"
        return 1
    fi

    print_info "Downloading: $sdk_file"

    # Download SDK
    mkdir -p "$CACHE_DIR"
    local sdk_archive="$CACHE_DIR/$sdk_file"

    if [[ ! -f "$sdk_archive" ]]; then
        echo "  Downloading SDK (this may take several minutes)..."
        if wget --retry-connrefused --waitretry=5 --timeout=60 --progress=dot:mega \
            "${base_url}/${sdk_file}" -O "$sdk_archive" 2>&1 | grep --line-buffered '%'; then
            print_success "Download complete"
        else
            # Fallback for older wget versions
            wget --retry-connrefused --waitretry=5 --timeout=60 \
                "${base_url}/${sdk_file}" -O "$sdk_archive"
        fi
    else
        print_info "Using cached archive: $sdk_file"
    fi

    # Extract SDK
    print_info "Extracting SDK..."
    rm -rf "$SDK_DIR"
    mkdir -p "$SDK_DIR"
    tar -xf "$sdk_archive" -C "$SDK_DIR" --strip-components=1

    # Mark SDK as ready
    echo "${OPENWRT_VERSION}-${ARCH}" > "$SDK_DIR/.sdk_ready"

    print_success "SDK downloaded and extracted"
    return 0
}

# Setup SDK feeds
setup_sdk_feeds() {
    print_header "Setting up SDK Feeds"

    cd "$SDK_DIR"

    # Remove unwanted feeds from feeds.conf.default
    if [[ -f "feeds.conf.default" ]]; then
        sed -i '/telephony/d' feeds.conf.default
        sed -i '/routing/d' feeds.conf.default
        print_success "Removed telephony and routing from feeds.conf.default"
    fi

    # Create local feed for SecuBox packages outside of SDK
    local local_feed_dir="$(pwd)/../local-feed"
    mkdir -p "$local_feed_dir"

    # Determine correct branch based on OpenWrt version
    local branch
    if [[ "$OPENWRT_VERSION" == "SNAPSHOT" ]]; then
        branch="master"
    elif [[ "$OPENWRT_VERSION" =~ ^25\. ]]; then
        branch="openwrt-25.12"
    elif [[ "$OPENWRT_VERSION" =~ ^24\. ]]; then
        branch="openwrt-24.10"
    elif [[ "$OPENWRT_VERSION" =~ ^23\. ]]; then
        branch="openwrt-23.05"
    else
        branch="openwrt-23.05"  # fallback
    fi

    print_info "Using branch: $branch for OpenWrt $OPENWRT_VERSION"

    # Use GitHub mirrors + local feed
    cat > feeds.conf << FEEDS
src-git packages https://github.com/openwrt/packages.git;$branch
src-git luci https://github.com/openwrt/luci.git;$branch
src-link secubox $local_feed_dir
FEEDS

    print_info "feeds.conf configured with local SecuBox feed at $local_feed_dir"

    # Update feeds
    echo "🔄 Updating feeds..."
    local feeds_ok=0
    local required_feeds=3

    for feed in packages luci secubox; do
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Updating feed: $feed"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        local feed_success=0
        for attempt in 1 2 3; do
            echo "Attempt $attempt of 3..."
            if ./scripts/feeds update "$feed" 2>&1 | tee "feed-update-${feed}.log"; then
                if [[ -d "feeds/$feed" ]]; then
                    print_success "$feed updated successfully"
                    feeds_ok=$((feeds_ok + 1))
                    feed_success=1
                    break
                else
                    print_warning "Feed directory not created, retrying..."
                fi
            else
                print_warning "Update command failed, retrying..."
            fi
            sleep $((10 * attempt))
        done

        if [[ $feed_success -eq 0 ]]; then
            print_error "Failed to update $feed after 3 attempts"
            return 1
        fi
    done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Feeds Status: $feeds_ok/$required_feeds updated"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ $feeds_ok -lt $required_feeds ]]; then
        print_error "Not all required feeds were updated successfully"
        return 1
    fi

    # Install feeds
    echo ""
    echo "📦 Installing feeds..."
    if ! ./scripts/feeds install -a 2>&1 | tee feed-install.log; then
        print_warning "Feed installation had errors, checking if critical..."
    fi

    # Note: We skip manual dependency installation as it causes hangs
    # The feeds install -a command above already installed all available packages
    # lucihttp and cgi-io will be disabled in .config to prevent compilation failures
    # Our SecuBox packages are PKGARCH:=all (scripts) so they don't need compiled dependencies

    echo ""
    echo "ℹ️  Dependencies will be handled via .config (pre-built packages preferred)"
    echo "   lucihttp and cgi-io will be disabled (fail to compile: missing lua.h)"

    # Verify feeds
    echo ""
    echo "🔍 Verifying feed installation..."
    for feed in packages luci secubox; do
        if [[ -d "feeds/$feed" ]]; then
            local feed_size=$(du -sh "feeds/$feed" 2>/dev/null | cut -f1)
            print_success "feeds/$feed exists ($feed_size)"
        else
            if [[ "$feed" == "secubox" ]]; then
                print_warning "feeds/$feed is empty (will be populated)"
            else
                print_error "feeds/$feed is missing!"
                return 1
            fi
        fi
    done

    # Verify luci.mk
    if [[ ! -f "feeds/luci/luci.mk" ]]; then
        print_warning "luci.mk not found, creating fallback..."
        mkdir -p feeds/luci
        cat > feeds/luci/luci.mk << 'LUCI_MK'
# Minimal LuCI build system fallback
LUCI_PKGARCH:=all

define Package/Default
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  PKGARCH:=all
endef
LUCI_MK
    fi

    # Final cleanup
    rm -f feeds/telephony.index feeds/routing.index 2>/dev/null || true
    rm -rf feeds/telephony feeds/routing 2>/dev/null || true

    make defconfig

    cd - > /dev/null

    print_success "SDK feeds configured"
    return 0
}

# Copy packages to SDK feed
copy_packages() {
    local single_package="$1"

    print_header "Copying Packages to SecuBox Feed"

    cd "$SDK_DIR"

    # Use the local feed directory (outside SDK)
    local feed_dir="../local-feed"
    mkdir -p "$feed_dir"
    local -a core_pkg_names=()

    if [[ -n "$single_package" ]]; then
        print_info "Copying single package: $single_package"

        if [[ -d "../../$single_package" && -f "../../${single_package}/Makefile" ]]; then
            echo "  📁 $single_package"
            cp -r "../../$single_package" "$feed_dir/"

            # Fix Makefile include path for feed structure
            sed -i 's|include.*luci\.mk|include $(TOPDIR)/feeds/luci/luci.mk|' "$feed_dir/$single_package/Makefile"
            echo "    ✓ Fixed Makefile include path"
        else
            print_error "Package $single_package not found or missing Makefile"
            cd - > /dev/null
            return 1
        fi
    else
        print_info "Copying all packages"

        # Copy luci-app-* packages
        for pkg in ../../luci-app-*/; do
            if [[ -d "$pkg" && -f "${pkg}Makefile" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "  📁 $pkg_name"
                cp -r "$pkg" "$feed_dir/"

                # Fix Makefile include path for feed structure
                sed -i 's|include.*luci\.mk|include $(TOPDIR)/feeds/luci/luci.mk|' "$feed_dir/$pkg_name/Makefile"
                echo "    ✓ Fixed Makefile include path"
            fi
        done

        # Copy luci-theme-* packages
        for pkg in ../../luci-theme-*/; do
            if [[ -d "$pkg" && -f "${pkg}Makefile" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "  📁 $pkg_name"
                cp -r "$pkg" "$feed_dir/"

                # Fix Makefile include path for feed structure
                sed -i 's|include.*luci\.mk|include $(TOPDIR)/feeds/luci/luci.mk|' "$feed_dir/$pkg_name/Makefile"
                echo "    ✓ Fixed Makefile include path"
            fi
        done

        # Copy secubox-app-* helper packages
        for pkg in ../../package/secubox/secubox-app-*/; do
            if [[ -d "$pkg" && -f "${pkg}Makefile" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "  📁 $pkg_name"
                cp -r "$pkg" "$feed_dir/"
            fi
        done

        # Copy core packages (non-LuCI)
        for pkg in ../../package/secubox/*/; do
            if [[ -d "$pkg" && -f "${pkg}Makefile" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "  📁 $pkg_name"
                cp -r "$pkg" "$feed_dir/"
                core_pkg_names+=("$pkg_name")
            fi
        done
    fi

    echo ""
    print_info "Packages in feed:"
    ls -d "$feed_dir/luci-app-"*/ 2>/dev/null || true
    ls -d "$feed_dir/luci-theme-"*/ 2>/dev/null || true
    ls -d "$feed_dir/secubox-app-"*/ 2>/dev/null || true

    # Update the secubox feed
    echo ""
    echo "🔄 Updating SecuBox feed index..."
    ./scripts/feeds update secubox

    # Install packages from secubox feed
    echo ""
    echo "📦 Installing packages from SecuBox feed..."
    if [[ -n "$single_package" ]]; then
        echo "  Installing $single_package..."
        ./scripts/feeds install "$single_package"
    else
        # Install luci-app-* packages
        for pkg in "$feed_dir"/luci-app-*/; do
            if [[ -d "$pkg" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "  Installing $pkg_name..."
                ./scripts/feeds install "$pkg_name" 2>&1 | grep -v "WARNING:" || true
            fi
        done

        # Install luci-theme-* packages
        for pkg in "$feed_dir"/luci-theme-*/; do
            if [[ -d "$pkg" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "  Installing $pkg_name..."
                ./scripts/feeds install "$pkg_name" 2>&1 | grep -v "WARNING:" || true
            fi
        done

        # Install secubox-app-* packages
        for pkg in "$feed_dir"/secubox-app-*/; do
            if [[ -d "$pkg" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "  Installing $pkg_name..."
                ./scripts/feeds install "$pkg_name" 2>&1 | grep -v "WARNING:" || true
            fi
        done

        # Install secubox core packages
        for pkg_name in "${core_pkg_names[@]}"; do
            local pkg_path="$feed_dir/$pkg_name"
            if [[ -d "$pkg_path" ]]; then
                echo "  Installing $pkg_name..."
                ./scripts/feeds install "$pkg_name" 2>&1 | grep -v "WARNING:" || true
            fi
        done
    fi

    cd - > /dev/null

    print_success "Packages copied and installed to feed"
    return 0
}

# Configure packages
configure_packages() {
    local single_package="$1"

    print_header "Configuring Packages"

    cd "$SDK_DIR"

    echo "⚙️ Enabling packages..."

    if [[ -n "$single_package" ]]; then
        # Enable only the specified package
        if [[ -d "feeds/secubox/$single_package" ]]; then
            echo "CONFIG_PACKAGE_${single_package}=m" >> .config
            print_success "$single_package enabled"
        else
            print_error "Package $single_package not found in feed"
            cd - > /dev/null
            return 1
        fi
    else
        # Enable all SecuBox packages from feed (luci-app-*)
        for pkg in feeds/secubox/luci-app-*/; do
            if [[ -d "$pkg" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "CONFIG_PACKAGE_${pkg_name}=m" >> .config
                print_success "$pkg_name enabled"
            fi
        done

        # Enable all SecuBox theme packages from feed (luci-theme-*)
        for pkg in feeds/secubox/luci-theme-*/; do
            if [[ -d "$pkg" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "CONFIG_PACKAGE_${pkg_name}=m" >> .config
                print_success "$pkg_name enabled"
            fi
        done

        # Enable all SecuBox app packages from feed (secubox-app-*)
        for pkg in feeds/secubox/secubox-app-*/; do
            if [[ -d "$pkg" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "CONFIG_PACKAGE_${pkg_name}=m" >> .config
                print_success "$pkg_name enabled"
            fi
        done
    fi

    # Disable problematic packages that fail to compile in SDK
    # Our SecuBox packages are PKGARCH:=all (scripts) so they don't need these
    echo ""
    echo "⚠️  Disabling packages that fail in SDK environment..."
    echo "# CONFIG_PACKAGE_lucihttp is not set" >> .config
    echo "# CONFIG_PACKAGE_cgi-io is not set" >> .config
    print_info "lucihttp and cgi-io disabled (fail to compile: missing lua.h)"

    # Enable use of pre-built packages from feeds
    echo "CONFIG_DEVEL=y" >> .config
    echo "CONFIG_AUTOREBUILD=y" >> .config
    echo "CONFIG_AUTOREMOVE=y" >> .config
    echo "CONFIG_FEED_packages=y" >> .config
    echo "CONFIG_FEED_luci=y" >> .config

    make defconfig

    cd - > /dev/null

    print_success "Packages configured"
    return 0
}

# Build packages
build_packages() {
    local single_package="$1"

    print_header "Building Packages"

    cd "$SDK_DIR"

    # Detect package format based on OpenWrt version
    local pkg_ext
    if [[ "$OPENWRT_VERSION" =~ ^25\. ]] || [[ "$OPENWRT_VERSION" == "SNAPSHOT" ]]; then
        pkg_ext="apk"
        print_info "Building for OpenWrt $OPENWRT_VERSION (apk format)"
    else
        pkg_ext="ipk"
        print_info "Building for OpenWrt $OPENWRT_VERSION (ipk format)"
    fi

    # Export for later use
    export PKG_EXT="$pkg_ext"

    local built=0
    local failed=0
    local built_list=""
    local failed_list=""

    # Determine which packages to build
    local packages_to_build=()
    if [[ -n "$single_package" ]]; then
        if [[ -d "feeds/secubox/$single_package" ]]; then
            packages_to_build=("$single_package")
        else
            print_error "Package $single_package not found in feed"
            cd - > /dev/null
            return 1
        fi
    else
        # Build luci-app-* packages
        for pkg in feeds/secubox/luci-app-*/; do
            [[ -d "$pkg" ]] && packages_to_build+=("$(basename "$pkg")")
        done

        # Build luci-theme-* packages
        for pkg in feeds/secubox/luci-theme-*/; do
            [[ -d "$pkg" ]] && packages_to_build+=("$(basename "$pkg")")
        done

        # Build core secubox packages (secubox-app, nodogsplash, etc.)
        for pkg in feeds/secubox/secubox-*/; do
            [[ -d "$pkg" ]] && packages_to_build+=("$(basename "$pkg")")
        done
        for pkg in feeds/secubox/nodogsplash/; do
            [[ -d "$pkg" ]] && packages_to_build+=("$(basename "$pkg")")
        done
    fi

    # Build packages
    for pkg_name in "${packages_to_build[@]}"; do
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📦 Building: $pkg_name"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        # Show package contents for debugging
        echo "📁 Package contents:"
        ls -la "feeds/secubox/$pkg_name"

        # Build with timeout (10 minutes per package)
        local build_log="/tmp/build-${pkg_name}.log"

        # Build from feed (skip dependency checks for architecture-independent packages)
        # These packages are just JavaScript/shell scripts - no compilation needed
        if timeout 600 make "package/feeds/secubox/${pkg_name}/compile" V=s -j1 NO_DEPS=1 > "$build_log" 2>&1; then
            # Check if package was created (.apk or .ipk)
            local pkg_file=$(find bin -name "${pkg_name}*.${pkg_ext}" 2>/dev/null | head -1)

            if [[ -n "$pkg_file" ]]; then
                print_success "Built: $pkg_name"
                echo "   → $pkg_file"
                built=$((built + 1))
                built_list="${built_list}${pkg_name},"
            else
                print_warning "No .${pkg_ext} generated for $pkg_name"
                echo "📋 Last 50 lines of build log:"
                tail -50 "$build_log"
                failed=$((failed + 1))
                failed_list="${failed_list}${pkg_name},"
            fi
        else
            print_error "Build failed: $pkg_name"
            echo "📋 Last 100 lines of build log:"
            tail -100 "$build_log"
            failed=$((failed + 1))
            failed_list="${failed_list}${pkg_name},"
        fi

        echo ""
    done

    cd - > /dev/null

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Build Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_success "Built: $built packages"
    if [[ $failed -gt 0 ]]; then
        print_error "Failed: $failed packages"
    fi
    echo ""
    echo "Built: $built_list"
    if [[ -n "$failed_list" ]]; then
        echo "Failed: $failed_list"
    fi

    return 0
}

# Collect artifacts
collect_artifacts() {
    print_header "Collecting Artifacts"

    mkdir -p "$BUILD_DIR/$ARCH"

    # Use package extension from build step
    local pkg_ext="${PKG_EXT:-ipk}"
    print_info "Package format: .${pkg_ext}"

    # Find and copy package files (.apk or .ipk)
    find "$SDK_DIR/bin" -name "luci-app-*.${pkg_ext}" -exec cp {} "$BUILD_DIR/$ARCH/" \; 2>/dev/null || true
    find "$SDK_DIR/bin" -name "luci-theme-*.${pkg_ext}" -exec cp {} "$BUILD_DIR/$ARCH/" \; 2>/dev/null || true

    # Also collect any SecuBox related packages
    find "$SDK_DIR/bin" -name "*secubox*.${pkg_ext}" -exec cp {} "$BUILD_DIR/$ARCH/" \; 2>/dev/null || true

    # Count
    local pkg_count=$(find "$BUILD_DIR/$ARCH" -name "*.${pkg_ext}" 2>/dev/null | wc -l)

    echo ""
    print_info "Built packages for $ARCH:"
    ls -la "$BUILD_DIR/$ARCH/" 2>/dev/null || echo "No packages"

    # Create checksums
    if [[ $pkg_count -gt 0 ]]; then
        cd "$BUILD_DIR/$ARCH"
        sha256sum ./*.${pkg_ext} > SHA256SUMS
        cd - > /dev/null
    fi

    echo ""
    print_success "Total: $pkg_count packages"

    return 0
}

# Run validation
run_validation() {
    print_header "Running Validation"

    local failed=0

    validate_makefiles || failed=$((failed + 1))
    validate_json || failed=$((failed + 1))
    validate_javascript || failed=$((failed + 1))
    validate_shellscripts || failed=$((failed + 1))
    check_file_permissions || failed=$((failed + 1))

    if [[ $failed -gt 0 ]]; then
        print_error "Validation failed with $failed error(s)"
        return 1
    fi

    print_success "All validations passed!"
    return 0
}

# Run build
run_build() {
    local single_package="$1"

    check_dependencies
    download_sdk || return 1
    setup_sdk_feeds || return 1
    copy_packages "$single_package" || return 1
    configure_packages "$single_package" || return 1
    build_packages "$single_package" || return 1
    collect_artifacts || return 1

    print_header "Build Complete!"
    print_success "Packages available in: $BUILD_DIR/$ARCH/"

    return 0
}

# ============================================
# Firmware Image Building Functions
# ============================================

# Parse device profile
parse_device_profile() {
    local device="$1"

    if [[ -z "${DEVICE_PROFILES[$device]}" ]]; then
        print_error "Unknown device: $device"
        print_info "Available devices: ${!DEVICE_PROFILES[*]}"
        return 1
    fi

    local profile="${DEVICE_PROFILES[$device]}"
    IFS=':' read -r TARGET SUBTARGET PROFILE_NAME DESCRIPTION <<< "$profile"

    export FW_TARGET="$TARGET"
    export FW_SUBTARGET="$SUBTARGET"
    export FW_PROFILE="$PROFILE_NAME"
    export FW_DESCRIPTION="$DESCRIPTION"
    export FW_DEVICE="$device"

    return 0
}

# Download OpenWrt source
download_openwrt_source() {
    print_header "Downloading OpenWrt Source"

    if [[ -d "$OPENWRT_DIR/.git" ]]; then
        print_info "OpenWrt source already exists, checking version..."
        cd "$OPENWRT_DIR"
        local current_version=$(git describe --tags 2>/dev/null || echo "unknown")
        if [[ "$current_version" == "v${OPENWRT_VERSION}" ]]; then
            print_success "Using existing OpenWrt $OPENWRT_VERSION"
            cd - > /dev/null
            return 0
        else
            print_info "Version mismatch (current: $current_version), re-cloning..."
            cd - > /dev/null
            rm -rf "$OPENWRT_DIR"
        fi
    fi

    print_info "Cloning OpenWrt $OPENWRT_VERSION..."

    if [[ "$OPENWRT_VERSION" == "SNAPSHOT" ]]; then
        git clone --depth 1 https://github.com/openwrt/openwrt.git "$OPENWRT_DIR"
    else
        git clone --depth 1 --branch "v${OPENWRT_VERSION}" \
            https://github.com/openwrt/openwrt.git "$OPENWRT_DIR"
    fi

    print_success "OpenWrt source downloaded"
    return 0
}

# Setup OpenWrt feeds for firmware build
setup_openwrt_feeds() {
    print_header "Setting up OpenWrt Feeds"

    cd "$OPENWRT_DIR"

    # Remove unwanted feeds
    if [[ -f "feeds.conf.default" ]]; then
        sed -i '/telephony/d' feeds.conf.default
        sed -i '/routing/d' feeds.conf.default
        print_success "Removed telephony and routing from feeds.conf.default"
    fi

    # Update feeds
    print_info "Updating feeds (this may take a few minutes)..."
    if ! ./scripts/feeds update -a 2>&1 | tee feed-update.log; then
        print_warning "Feed update had errors, continuing..."
    fi

    # Install feeds
    print_info "Installing feeds..."
    if ! ./scripts/feeds install -a 2>&1 | tee feed-install.log; then
        print_warning "Feed install had warnings, checking directories..."
    fi

    # Verify feeds
    for feed in packages luci; do
        if [[ -d "feeds/$feed" ]]; then
            local feed_size=$(du -sh "feeds/$feed" 2>/dev/null | cut -f1)
            print_success "feeds/$feed ($feed_size)"
        else
            print_error "feeds/$feed missing!"
            cd - > /dev/null
            return 1
        fi
    done

    cd - > /dev/null
    print_success "OpenWrt feeds configured"
    return 0
}

# Copy SecuBox packages to OpenWrt
copy_secubox_to_openwrt() {
    print_header "Copying SecuBox Packages to OpenWrt"

    cd "$OPENWRT_DIR"

    mkdir -p package/secubox

    local pkg_count=0

    # Copy luci-app-* packages
    for pkg in ../../luci-app-*/; do
        if [[ -d "$pkg" ]]; then
            local pkg_name=$(basename "$pkg")
            echo "  ✅ $pkg_name"
            cp -r "$pkg" package/secubox/

            # Fix Makefile include path
            if [[ -f "package/secubox/$pkg_name/Makefile" ]]; then
                sed -i 's|include.*luci\.mk|include $(TOPDIR)/feeds/luci/luci.mk|' \
                    "package/secubox/$pkg_name/Makefile"
            fi

            pkg_count=$((pkg_count + 1))
        fi
    done

    # Copy luci-theme-* packages
    for pkg in ../../luci-theme-*/; do
        if [[ -d "$pkg" ]]; then
            local pkg_name=$(basename "$pkg")
            echo "  ✅ $pkg_name"
            cp -r "$pkg" package/secubox/

            # Fix Makefile include path
            if [[ -f "package/secubox/$pkg_name/Makefile" ]]; then
                sed -i 's|include.*luci\.mk|include $(TOPDIR)/feeds/luci/luci.mk|' \
                    "package/secubox/$pkg_name/Makefile"
            fi

            pkg_count=$((pkg_count + 1))
        fi
    done

    # Copy secubox-app-* helper packages
    for pkg in ../../package/secubox/secubox-app-*/; do
        if [[ -d "$pkg" ]]; then
            local pkg_name=$(basename "$pkg")
            echo "  ✅ $pkg_name"
            cp -r "$pkg" package/secubox/
            pkg_count=$((pkg_count + 1))
        fi
    done

    # Copy additional core packages (non-LuCI / non-app store)
    for pkg in ../../package/secubox/*/; do
        if [[ -d "$pkg" ]]; then
            local pkg_name=$(basename "$pkg")
            echo "  ✅ $pkg_name"
            cp -r "$pkg" package/secubox/
            pkg_count=$((pkg_count + 1))
        fi
    done

    cd - > /dev/null

    print_success "Copied $pkg_count SecuBox packages"
    return 0
}

# Generate firmware configuration
generate_firmware_config() {
    print_header "Generating Firmware Configuration"

    cd "$OPENWRT_DIR"

    print_info "Device: $FW_DESCRIPTION"
    print_info "Target: $FW_TARGET/$FW_SUBTARGET"
    print_info "Profile: $FW_PROFILE"

    # Base configuration
    cat > .config << EOF
# Target
CONFIG_TARGET_${FW_TARGET}=y
CONFIG_TARGET_${FW_TARGET}_${FW_SUBTARGET}=y
CONFIG_TARGET_${FW_TARGET}_${FW_SUBTARGET}_DEVICE_${FW_PROFILE}=y

# Image building (REQUIRED for firmware generation)
CONFIG_TARGET_MULTI_PROFILE=n
CONFIG_TARGET_ALL_PROFILES=n
CONFIG_TARGET_PER_DEVICE_ROOTFS=y

# Image settings
CONFIG_TARGET_ROOTFS_SQUASHFS=y
CONFIG_TARGET_ROOTFS_EXT4FS=y
CONFIG_TARGET_KERNEL_PARTSIZE=32
CONFIG_TARGET_ROOTFS_PARTSIZE=512

# Disable GDB in toolchain (fixes build issues)
# CONFIG_GDB is not set
CONFIG_BUILD_LOG=y

# Base packages
CONFIG_PACKAGE_luci=y
CONFIG_PACKAGE_luci-ssl=y
CONFIG_PACKAGE_luci-app-opkg=y
CONFIG_PACKAGE_luci-theme-openwrt-2020=y

# Networking essentials
CONFIG_PACKAGE_curl=y
CONFIG_PACKAGE_wget-ssl=y
CONFIG_PACKAGE_iptables=y
CONFIG_PACKAGE_ip6tables=y

# USB support
CONFIG_PACKAGE_kmod-usb-core=y
CONFIG_PACKAGE_kmod-usb3=y
CONFIG_PACKAGE_kmod-usb-storage=y

# Filesystem
CONFIG_PACKAGE_kmod-fs-ext4=y
CONFIG_PACKAGE_kmod-fs-vfat=y

# SecuBox packages - Core
CONFIG_PACKAGE_luci-app-secubox=y
CONFIG_PACKAGE_luci-app-system-hub=y

# SecuBox packages - Security & Monitoring
CONFIG_PACKAGE_luci-app-crowdsec-dashboard=y
CONFIG_PACKAGE_luci-app-netdata-dashboard=y

# SecuBox packages - Network Intelligence
CONFIG_PACKAGE_luci-app-netifyd-dashboard=y
CONFIG_PACKAGE_luci-app-network-modes=y

# SecuBox packages - VPN & Access Control
CONFIG_PACKAGE_luci-app-wireguard-dashboard=y
CONFIG_PACKAGE_luci-app-client-guardian=y
CONFIG_PACKAGE_luci-app-auth-guardian=y

# SecuBox packages - Bandwidth & Traffic
CONFIG_PACKAGE_luci-app-bandwidth-manager=y
CONFIG_PACKAGE_luci-app-media-flow=y

# SecuBox packages - Performance & Services
CONFIG_PACKAGE_luci-app-cdn-cache=y
CONFIG_PACKAGE_luci-app-vhost-manager=y

# WireGuard
CONFIG_PACKAGE_wireguard-tools=y
CONFIG_PACKAGE_kmod-wireguard=y
CONFIG_PACKAGE_qrencode=y
EOF

    # Device-specific packages
    case "$FW_DEVICE" in
        mochabin)
            cat >> .config << EOF

# MOCHAbin specific - 10G networking
CONFIG_PACKAGE_kmod-sfp=y
CONFIG_PACKAGE_kmod-phy-marvell-10g=y
EOF
            ;;
        espressobin-ultra|sheeva64)
            cat >> .config << EOF

# WiFi support
CONFIG_PACKAGE_kmod-mt76=y
CONFIG_PACKAGE_kmod-mac80211=y
EOF
            ;;
    esac

    # Run defconfig
    make defconfig

    cd - > /dev/null

    print_success "Configuration generated"
    return 0
}

# Verify firmware configuration
verify_firmware_config() {
    print_header "Verifying Firmware Configuration"

    cd "$OPENWRT_DIR"

    # Check device profile
    if grep -q "CONFIG_TARGET_${FW_TARGET}_${FW_SUBTARGET}_DEVICE_${FW_PROFILE}=y" .config; then
        print_success "Device profile correctly configured"
    else
        print_error "Device profile not found in .config!"
        print_info "Searching for available profiles..."
        find "target/$FW_TARGET/$FW_SUBTARGET" -name "*.mk" -exec grep -l "DEVICE_NAME" {} \; 2>/dev/null | head -5
        cd - > /dev/null
        return 1
    fi

    # Check image generation
    if grep -q "CONFIG_TARGET_ROOTFS_SQUASHFS=y" .config; then
        print_success "SQUASHFS image generation enabled"
    fi

    if grep -q "CONFIG_TARGET_ROOTFS_EXT4FS=y" .config; then
        print_success "EXT4 image generation enabled"
    fi

    # Show relevant config
    echo ""
    print_info "Device configuration:"
    grep "^CONFIG_TARGET_" .config | head -10

    cd - > /dev/null

    print_success "Configuration verified"
    return 0
}

# Build firmware image
build_firmware_image() {
    print_header "Building Firmware Image"

    cd "$OPENWRT_DIR"

    print_info "Device: $FW_DESCRIPTION"
    print_info "Target: $FW_TARGET/$FW_SUBTARGET"
    print_info "Profile: $FW_PROFILE"
    print_info "CPU Cores: $(nproc)"
    echo ""

    local start_time=$(date +%s)

    # Download packages first
    print_info "Downloading packages..."
    if ! make download -j$(nproc) V=s; then
        print_warning "Parallel download failed, retrying single-threaded..."
        make download -j1 V=s
    fi

    echo ""
    print_header "Compiling Firmware (This may take 1-2 hours)"
    echo ""

    # Create necessary directories to avoid opkg lock file errors
    # Find all root directories and ensure tmp subdirectories exist
    find build_dir -type d -name "root.orig-*" -exec mkdir -p {}/tmp \; 2>/dev/null || true
    find build_dir -type d -name "root-*" -exec mkdir -p {}/tmp \; 2>/dev/null || true

    # Build with explicit PROFILE
    if make -j$(nproc) PROFILE="$FW_PROFILE" V=s 2>&1 | tee build.log; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local minutes=$((duration / 60))
        local seconds=$((duration % 60))

        print_success "Build completed in ${minutes}m ${seconds}s"
    else
        print_error "Parallel build failed, retrying single-threaded..."

        # Ensure staging directories exist before retry
        find build_dir -type d -name "root.orig-*" -exec mkdir -p {}/tmp \; 2>/dev/null || true
        find build_dir -type d -name "root-*" -exec mkdir -p {}/tmp \; 2>/dev/null || true

        if make -j1 PROFILE="$FW_PROFILE" V=s 2>&1 | tee build-retry.log; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            local minutes=$((duration / 60))
            local seconds=$((duration % 60))

            print_success "Build completed in ${minutes}m ${seconds}s (after retry)"
        else
            print_error "Build failed!"
            echo ""
            echo "Last 50 lines of build log:"
            tail -50 build-retry.log
            cd - > /dev/null
            return 1
        fi
    fi

    cd - > /dev/null
    return 0
}

# Collect firmware artifacts
collect_firmware_artifacts() {
    print_header "Collecting Firmware Artifacts"

    local target_dir="$OPENWRT_DIR/bin/targets/$FW_TARGET/$FW_SUBTARGET"
    local output_dir="$BUILD_DIR/firmware/$FW_DEVICE"

    mkdir -p "$output_dir"

    # Find and copy firmware images
    local img_count=0
    if [[ -d "$target_dir" ]]; then
        echo "🔍 Target directory: $target_dir"
        echo ""
        echo "📂 All files in target directory:"
        ls -lh "$target_dir" 2>/dev/null | grep -v "^total" || echo "  (empty)"
        echo ""

        echo "📦 Copying firmware images..."
        while IFS= read -r file; do
            case "$(basename "$file")" in
                *.ipk|*.manifest|*.json|sha256sums|*.buildinfo|packages)
                    continue
                    ;;
                *)
                    cp "$file" "$output_dir/"
                    print_success "$(basename "$file") ($(du -h "$file" | cut -f1))"
                    img_count=$((img_count + 1))
                    ;;
            esac
        done < <(find "$target_dir" -maxdepth 1 -type f 2>/dev/null)
    else
        print_error "Target directory not found: $target_dir"
    fi

    if [[ $img_count -eq 0 ]]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print_warning "No firmware images found!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""

        # Diagnostic information
        echo "🔍 Diagnostic Information:"
        echo ""

        if [[ -d "$OPENWRT_DIR/bin/targets" ]]; then
            echo "📂 Available targets:"
            find "$OPENWRT_DIR/bin/targets" -type d -mindepth 2 -maxdepth 2 2>/dev/null | sed 's|.*/bin/targets/||' || echo "  (none)"
            echo ""
        fi

        if [[ -f "$OPENWRT_DIR/build.log" ]]; then
            echo "📋 Checking build log for errors..."
            if grep -i "error\|failed\|cannot" "$OPENWRT_DIR/build.log" | tail -10 | grep -v "warning" > /tmp/fw-errors.txt 2>/dev/null && [[ -s /tmp/fw-errors.txt ]]; then
                echo "Recent errors found:"
                cat /tmp/fw-errors.txt
                rm -f /tmp/fw-errors.txt
            else
                echo "  No obvious errors in build log"
            fi
            echo ""
        fi

        if [[ -d "$target_dir" ]]; then
            local all_files=$(find "$target_dir" -type f 2>/dev/null | wc -l)
            echo "🎯 Target directory analysis:"
            echo "  Total files: $all_files"
            if [[ $all_files -gt 0 ]]; then
                echo "  File types:"
                find "$target_dir" -type f 2>/dev/null -exec basename {} \; | sed 's/.*\./  ./' | sort -u
            fi
        fi

        echo ""
        print_warning "This usually means:"
        echo "  1. Device profile was not properly selected"
        echo "  2. Build completed but only packages were built, not images"
        echo "  3. Device profile name doesn't match OpenWrt $OPENWRT_VERSION"
        echo ""
        print_info "To debug:"
        echo "  1. Check: $OPENWRT_DIR/.config for CONFIG_TARGET settings"
        echo "  2. Review: $OPENWRT_DIR/build.log for errors"
        echo "  3. Verify profile exists: find $OPENWRT_DIR/target/$FW_TARGET/$FW_SUBTARGET -name '*.mk'"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi

    # Copy packages
    mkdir -p "$output_dir/packages"
    find "$OPENWRT_DIR/bin/packages" -name "luci-app-*.ipk" -exec cp {} "$output_dir/packages/" \; 2>/dev/null || true

    local pkg_count=$(find "$output_dir/packages" -name "*.ipk" 2>/dev/null | wc -l)

    # Generate checksums
    cd "$output_dir"
    sha256sum *.* > SHA256SUMS 2>/dev/null || true
    if [[ -d packages && -n "$(ls -A packages 2>/dev/null)" ]]; then
        (cd packages && sha256sum *.ipk > SHA256SUMS 2>/dev/null || true)
    fi
    cd - > /dev/null

    # Create build info
    cat > "$output_dir/BUILD_INFO.txt" << EOF
SecuBox Firmware Build
======================
Device: $FW_DESCRIPTION
Profile: $FW_PROFILE
Target: $FW_TARGET/$FW_SUBTARGET
OpenWrt: $OPENWRT_VERSION
Built: $(date -u +%Y-%m-%dT%H:%M:%SZ)

Firmware Images: $img_count
SecuBox Packages: $pkg_count
EOF

    echo ""
    print_success "Firmware images: $img_count"
    print_success "SecuBox packages: $pkg_count"
    print_success "Artifacts saved to: $output_dir"

    echo ""
    print_info "Contents:"
    ls -lh "$output_dir"

    return 0
}

# Debug firmware configuration
debug_firmware_build() {
    local device="$1"

    if [[ -z "$device" ]]; then
        print_error "Device not specified"
        print_info "Usage: $0 debug-firmware <device>"
        print_info "Available devices: ${!DEVICE_PROFILES[*]}"
        return 1
    fi

    # Parse device profile
    parse_device_profile "$device" || return 1

    print_header "Firmware Build Debug Information"

    echo "Device Configuration:"
    echo "  Device: $FW_DEVICE"
    echo "  Description: $FW_DESCRIPTION"
    echo "  Target: $FW_TARGET"
    echo "  Subtarget: $FW_SUBTARGET"
    echo "  Profile: $FW_PROFILE"
    echo ""

    if [[ -d "$OPENWRT_DIR" ]]; then
        print_info "OpenWrt source exists at: $OPENWRT_DIR"

        if [[ -f "$OPENWRT_DIR/.config" ]]; then
            echo ""
            echo "Current .config settings:"
            grep "^CONFIG_TARGET_" "$OPENWRT_DIR/.config" | head -20

            echo ""
            echo "Checking device profile..."
            if grep -q "CONFIG_TARGET_${FW_TARGET}_${FW_SUBTARGET}_DEVICE_${FW_PROFILE}=y" "$OPENWRT_DIR/.config"; then
                print_success "Device profile is configured"
            else
                print_error "Device profile NOT configured!"
            fi

            echo ""
            echo "Available device profiles for $FW_TARGET/$FW_SUBTARGET:"
            find "$OPENWRT_DIR/target/$FW_TARGET/$FW_SUBTARGET" -name "*.mk" 2>/dev/null | \
                xargs grep -l "DEVICE_NAME" 2>/dev/null | head -10
        else
            print_warning "No .config file found - run build-firmware first"
        fi

        echo ""
        if [[ -d "$OPENWRT_DIR/bin/targets/$FW_TARGET/$FW_SUBTARGET" ]]; then
            echo "Build output directory exists:"
            echo "  Path: $OPENWRT_DIR/bin/targets/$FW_TARGET/$FW_SUBTARGET"
            echo "  Files:"
            ls -lh "$OPENWRT_DIR/bin/targets/$FW_TARGET/$FW_SUBTARGET" 2>/dev/null | grep -v "^total" | head -20
        else
            print_warning "Build output directory doesn't exist yet"
        fi
    else
        print_warning "OpenWrt source not downloaded yet"
        print_info "Run: $0 build-firmware $device"
    fi

    return 0
}

# Run firmware build
run_firmware_build() {
    local device="$1"

    if [[ -z "$device" ]]; then
        print_error "Device not specified"
        print_info "Usage: $0 build-firmware <device>"
        print_info "Available devices: ${!DEVICE_PROFILES[*]}"
        return 1
    fi

    # Parse device profile
    parse_device_profile "$device" || return 1

    # Check dependencies
    check_dependencies

    # Build firmware
    download_openwrt_source || return 1
    setup_openwrt_feeds || return 1
    copy_secubox_to_openwrt || return 1
    generate_firmware_config || return 1
    verify_firmware_config || return 1
    build_firmware_image || return 1
    collect_firmware_artifacts || return 1

    print_header "Firmware Build Complete!"
    print_success "Device: $FW_DESCRIPTION"
    print_success "Location: $BUILD_DIR/firmware/$FW_DEVICE/"

    return 0
}

# Show usage
show_usage() {
    cat << EOF
SecuBox Local Build Tool
Replicates GitHub Actions workflows for local development

USAGE:
    $0 <command> [options]

COMMANDS:
    validate                    Run validation only (lint, syntax checks)
    build                       Build all packages for x86_64
    build <package>             Build single package (luci-app-*, luci-theme-*, secubox-app-*)
    build --arch <arch>         Build for specific architecture
    build-firmware <device>     Build full firmware image for device
    debug-firmware <device>     Debug firmware build (check config without building)
    full                        Run validation then build
    clean                       Clean build directories
    clean-all                   Clean all build directories including OpenWrt source
    help                        Show this help message

ARCHITECTURES (for package building):
    x86-64                      PC, VMs (default)
    aarch64-cortex-a53          ARM Cortex-A53 (ESPRESSObin)
    aarch64-cortex-a72          ARM Cortex-A72 (MOCHAbin, RPi4)
    aarch64-generic             Generic ARM64
    mips-24kc                   MIPS 24Kc (TP-Link)
    mipsel-24kc                 MIPS LE (Xiaomi, GL.iNet)

DEVICES (for firmware building):
    espressobin-v7              ESPRESSObin V7 (1-2GB DDR4)
    espressobin-ultra           ESPRESSObin Ultra (PoE, WiFi)
    sheeva64                    Sheeva64 (Plug computer)
    mochabin                    MOCHAbin (Quad-core A72, 10G)
    x86-64                      x86_64 Generic PC

EXAMPLES:
    # Validate all packages
    $0 validate

    # Build all packages for x86_64
    $0 build

    # Build single LuCI package
    $0 build luci-app-system-hub

    # Build single SecuBox app package
    $0 build secubox-app-nodogsplash

    # Build for specific architecture
    $0 build --arch aarch64-cortex-a72

    # Build firmware image for MOCHAbin
    $0 build-firmware mochabin

    # Build firmware image for ESPRESSObin V7
    $0 build-firmware espressobin-v7

    # Debug firmware build configuration
    $0 debug-firmware mochabin

    # Full validation and build
    $0 full

    # Clean build artifacts
    $0 clean

    # Clean everything including OpenWrt source
    $0 clean-all

ENVIRONMENT VARIABLES:
OPENWRT_VERSION             OpenWrt version (default: 24.10.5)
    SDK_DIR                     SDK directory (default: ./sdk)
    BUILD_DIR                   Build output directory (default: ./build)
    CACHE_DIR                   Download cache directory (default: ./cache)
    OPENWRT_DIR                 OpenWrt source directory for firmware builds (default: ./openwrt)

EOF
}

# Main script
main() {
    # Change to script directory
    cd "$(dirname "$0")"

    local command="${1:-help}"
    shift || true

    case "$command" in
        validate)
            run_validation
            ;;

        build)
            local single_package=""
            local arch_specified=false

            while [[ $# -gt 0 ]]; do
                case "$1" in
                    --arch)
                        set_architecture "$2"
                        arch_specified=true
                        shift 2
                        ;;
                    luci-app-*|luci-theme-*|secubox-app-*)
                        single_package="$1"
                        shift
                        ;;
                    *)
                        print_error "Unknown option: $1"
                        show_usage
                        exit 1
                        ;;
                esac
            done

            run_build "$single_package"
            ;;

        build-firmware)
            local device="$1"
            if [[ -z "$device" ]]; then
                print_error "Device not specified"
                print_info "Usage: $0 build-firmware <device>"
                print_info "Available devices: ${!DEVICE_PROFILES[*]}"
                exit 1
            fi
            run_firmware_build "$device"
            ;;

        debug-firmware)
            local device="$1"
            if [[ -z "$device" ]]; then
                print_error "Device not specified"
                print_info "Usage: $0 debug-firmware <device>"
                print_info "Available devices: ${!DEVICE_PROFILES[*]}"
                exit 1
            fi
            debug_firmware_build "$device"
            ;;

        full)
            run_validation && run_build
            ;;

        clean)
            print_header "Cleaning Build Directories"
            rm -rf "$SDK_DIR" "$BUILD_DIR"
            print_success "Build directories cleaned"
            ;;

        clean-all)
            print_header "Cleaning All Build Directories"
            rm -rf "$SDK_DIR" "$BUILD_DIR" "$OPENWRT_DIR" "$CACHE_DIR"
            print_success "All build directories cleaned (SDK, build, OpenWrt source, cache)"
            ;;

        help|--help|-h)
            show_usage
            ;;

        *)
            print_error "Unknown command: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main
main "$@"
