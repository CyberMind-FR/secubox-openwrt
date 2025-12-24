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
OPENWRT_VERSION="${OPENWRT_VERSION:-23.05.5}"
SDK_DIR="${SDK_DIR:-./sdk}"
BUILD_DIR="${BUILD_DIR:-./build}"
CACHE_DIR="${CACHE_DIR:-./cache}"

# Default architecture
ARCH="x86-64"
ARCH_NAME="x86_64"
SDK_PATH="x86/64"

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
    for cmd in make gcc g++ git wget curl tar xz jq; do
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
        echo "    swig unzip zlib1g-dev file wget curl jq"
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

    # Use GitHub mirrors + local feed
    cat > feeds.conf << FEEDS
src-git packages https://github.com/openwrt/packages.git;openwrt-23.05
src-git luci https://github.com/openwrt/luci.git;openwrt-23.05
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

    # Install critical dependencies explicitly
    echo ""
    echo "📦 Installing LuCI and build dependencies..."
    for dep in lua liblua luci-base lucihttp rpcd rpcd-mod-rrdns cgi-io libiwinfo ucode libucode rpcd-mod-luci; do
        echo "  Installing $dep..."
        ./scripts/feeds install "$dep" 2>&1 | grep -v "WARNING:" || true
    done

    # Build essential dependencies first
    echo ""
    echo "🔨 Building essential dependencies..."
    for dep in lua liblua lucihttp rpcd cgi-io; do
        echo "  Building $dep..."
        make package/feeds/*/${dep}/compile V=s -j1 2>&1 | tail -5 || true
    done

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
    fi

    echo ""
    print_info "Packages in feed:"
    ls -d "$feed_dir/luci-app-"*/ 2>/dev/null || echo "None"

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
        for pkg in "$feed_dir"/luci-app-*/; do
            if [[ -d "$pkg" ]]; then
                local pkg_name=$(basename "$pkg")
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
        # Enable all SecuBox packages from feed
        for pkg in feeds/secubox/luci-app-*/; do
            if [[ -d "$pkg" ]]; then
                local pkg_name=$(basename "$pkg")
                echo "CONFIG_PACKAGE_${pkg_name}=m" >> .config
                print_success "$pkg_name enabled"
            fi
        done
    fi

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
        for pkg in feeds/secubox/luci-app-*/; do
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
            # Check if .ipk was created
            local ipk_file=$(find bin -name "${pkg_name}*.ipk" 2>/dev/null | head -1)

            if [[ -n "$ipk_file" ]]; then
                print_success "Built: $pkg_name"
                echo "   → $ipk_file"
                built=$((built + 1))
                built_list="${built_list}${pkg_name},"
            else
                print_warning "No .ipk generated for $pkg_name"
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

    # Find and copy .ipk files
    find "$SDK_DIR/bin" -name "luci-app-*.ipk" -exec cp {} "$BUILD_DIR/$ARCH/" \; 2>/dev/null || true

    # Also collect any SecuBox related packages
    find "$SDK_DIR/bin" -name "*secubox*.ipk" -exec cp {} "$BUILD_DIR/$ARCH/" \; 2>/dev/null || true

    # Count
    local pkg_count=$(find "$BUILD_DIR/$ARCH" -name "*.ipk" 2>/dev/null | wc -l)

    echo ""
    print_info "Built packages for $ARCH:"
    ls -la "$BUILD_DIR/$ARCH/" 2>/dev/null || echo "No packages"

    # Create checksums
    if [[ $pkg_count -gt 0 ]]; then
        cd "$BUILD_DIR/$ARCH"
        sha256sum ./*.ipk > SHA256SUMS
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
    build <package>             Build single package
    build --arch <arch>         Build for specific architecture
    full                        Run validation then build
    clean                       Clean build directories
    help                        Show this help message

ARCHITECTURES:
    x86-64                      PC, VMs (default)
    aarch64-cortex-a53          ARM Cortex-A53 (ESPRESSObin)
    aarch64-cortex-a72          ARM Cortex-A72 (MOCHAbin, RPi4)
    aarch64-generic             Generic ARM64
    mips-24kc                   MIPS 24Kc (TP-Link)
    mipsel-24kc                 MIPS LE (Xiaomi, GL.iNet)

EXAMPLES:
    # Validate all packages
    $0 validate

    # Build all packages for x86_64
    $0 build

    # Build single package
    $0 build luci-app-system-hub

    # Build for specific architecture
    $0 build --arch aarch64-cortex-a72

    # Full validation and build
    $0 full

    # Clean build artifacts
    $0 clean

ENVIRONMENT VARIABLES:
    OPENWRT_VERSION             OpenWrt version (default: 23.05.5)
    SDK_DIR                     SDK directory (default: ./sdk)
    BUILD_DIR                   Build output directory (default: ./build)
    CACHE_DIR                   Download cache directory (default: ./cache)

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
                    luci-app-*)
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

        full)
            run_validation && run_build
            ;;

        clean)
            print_header "Cleaning Build Directories"
            rm -rf "$SDK_DIR" "$BUILD_DIR"
            print_success "Build directories cleaned"
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
