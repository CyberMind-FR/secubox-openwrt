#!/bin/bash
# LocalAI Cross-Compile Script for OpenWrt SDK
# Copyright (C) 2025 CyberMind.fr
#
# Run this on your build machine (Linux x86_64) with OpenWrt SDK
# The resulting binary can be copied to your ARM64 OpenWrt device

set -e

LOCALAI_VERSION="${LOCALAI_VERSION:-v2.25.0}"
BUILD_DIR="${BUILD_DIR:-/tmp/localai-build}"
OUTPUT_DIR="${OUTPUT_DIR:-./output}"

# Target architecture (default: aarch64 for ARM64)
TARGET_ARCH="${TARGET_ARCH:-aarch64}"
TARGET_OS="linux"

# OpenWrt SDK path (set this to your SDK location)
SDK_PATH="${SDK_PATH:-}"

usage() {
    cat <<EOF
LocalAI Cross-Compile Script for OpenWrt

Usage: $0 [options]

Options:
  --sdk PATH        Path to OpenWrt SDK (required for cross-compile)
  --arch ARCH       Target architecture: aarch64, x86_64 (default: aarch64)
  --version VER     LocalAI version (default: $LOCALAI_VERSION)
  --output DIR      Output directory (default: ./output)
  --native          Build natively (no cross-compile)
  --help            Show this help

Examples:
  # Cross-compile for ARM64 using OpenWrt SDK
  $0 --sdk /path/to/openwrt-sdk --arch aarch64

  # Build natively on current machine
  $0 --native

  # Build specific version
  $0 --native --version v2.24.0

Requirements:
  - Go 1.21+
  - Git
  - GCC/G++ (or cross-compiler from SDK)
  - CMake
  - Make

EOF
}

log_info() { echo -e "\033[0;32m[INFO]\033[0m $*"; }
log_warn() { echo -e "\033[0;33m[WARN]\033[0m $*"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $*"; }

check_deps() {
    log_info "Checking dependencies..."

    local missing=0

    if ! command -v go &>/dev/null; then
        log_error "Go not found. Install Go 1.21+"
        missing=1
    else
        log_info "Go: $(go version | head -1)"
    fi

    if ! command -v git &>/dev/null; then
        log_error "Git not found"
        missing=1
    fi

    if ! command -v make &>/dev/null; then
        log_error "Make not found"
        missing=1
    fi

    if ! command -v cmake &>/dev/null; then
        log_warn "CMake not found (may be needed for some backends)"
    fi

    [ $missing -eq 1 ] && exit 1
}

setup_cross_compile() {
    if [ -z "$SDK_PATH" ]; then
        log_error "SDK_PATH not set. Use --sdk option or set SDK_PATH environment variable"
        exit 1
    fi

    if [ ! -d "$SDK_PATH" ]; then
        log_error "SDK path does not exist: $SDK_PATH"
        exit 1
    fi

    log_info "Setting up cross-compile environment..."

    # Find toolchain
    local toolchain_dir=$(find "$SDK_PATH" -type d -name "toolchain-*" | head -1)
    if [ -z "$toolchain_dir" ]; then
        log_error "Toolchain not found in SDK"
        exit 1
    fi

    local bin_dir="$toolchain_dir/bin"

    # Detect cross-compiler prefix
    local cc_prefix=""
    case "$TARGET_ARCH" in
        aarch64)
            cc_prefix=$(ls "$bin_dir"/*-linux-*-gcc 2>/dev/null | head -1 | xargs basename | sed 's/-gcc$//')
            ;;
        x86_64)
            cc_prefix=$(ls "$bin_dir"/*-linux-*-gcc 2>/dev/null | head -1 | xargs basename | sed 's/-gcc$//')
            ;;
    esac

    if [ -z "$cc_prefix" ]; then
        log_error "Cross-compiler not found for $TARGET_ARCH"
        exit 1
    fi

    export PATH="$bin_dir:$PATH"
    export CC="${cc_prefix}-gcc"
    export CXX="${cc_prefix}-g++"
    export AR="${cc_prefix}-ar"
    export STRIP="${cc_prefix}-strip"

    log_info "Cross-compiler: $CC"

    # Set Go cross-compile vars
    export CGO_ENABLED=1
    export GOOS="$TARGET_OS"

    case "$TARGET_ARCH" in
        aarch64) export GOARCH="arm64" ;;
        x86_64) export GOARCH="amd64" ;;
        *) log_error "Unknown arch: $TARGET_ARCH"; exit 1 ;;
    esac

    log_info "Target: $GOOS/$GOARCH"
}

setup_native() {
    log_info "Setting up native build..."
    export CGO_ENABLED=1
    export CC=gcc
    export CXX=g++

    # Detect native arch
    case "$(uname -m)" in
        x86_64) export GOARCH="amd64" ;;
        aarch64) export GOARCH="arm64" ;;
        *) export GOARCH="amd64" ;;
    esac
    export GOOS="linux"

    log_info "Building for: $GOOS/$GOARCH (native)"
}

clone_repo() {
    log_info "Preparing LocalAI source..."
    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"

    if [ -d "LocalAI" ]; then
        log_info "Updating existing repository..."
        cd LocalAI
        git fetch --all
        git checkout "$LOCALAI_VERSION" 2>/dev/null || git checkout main
    else
        log_info "Cloning LocalAI $LOCALAI_VERSION..."
        git clone --depth 1 --branch "$LOCALAI_VERSION" https://github.com/mudler/LocalAI.git 2>/dev/null || \
        git clone https://github.com/mudler/LocalAI.git
        cd LocalAI
        git checkout "$LOCALAI_VERSION" 2>/dev/null || true
    fi

    log_info "Source ready at $BUILD_DIR/LocalAI"
}

build_localai() {
    cd "$BUILD_DIR/LocalAI"

    log_info "Building LocalAI with llama-cpp backend..."
    log_info "This may take 15-30 minutes..."
    echo ""

    # Build with llama-cpp backend
    BUILD_GRPC_FOR_BACKEND_LLAMA=true \
    GRPC_BACKENDS="backend-assets/grpc/llama-cpp" \
    BUILD_TYPE=generic \
    make build 2>&1 | tee "$BUILD_DIR/build.log"

    if [ -f "local-ai" ]; then
        log_info "Build successful!"

        # Strip binary to reduce size
        if [ -n "$STRIP" ] && command -v "$STRIP" &>/dev/null; then
            log_info "Stripping binary..."
            $STRIP local-ai || true
        fi

        # Copy to output
        mkdir -p "$OUTPUT_DIR"
        cp local-ai "$OUTPUT_DIR/local-ai-${GOARCH}"

        local size=$(ls -lh "$OUTPUT_DIR/local-ai-${GOARCH}" | awk '{print $5}')
        log_info ""
        log_info "Output: $OUTPUT_DIR/local-ai-${GOARCH} ($size)"
        log_info ""
        log_info "Copy to OpenWrt device:"
        log_info "  scp $OUTPUT_DIR/local-ai-${GOARCH} root@<router>:/opt/localai/bin/local-ai"
        log_info "  ssh root@<router> chmod +x /opt/localai/bin/local-ai"
    else
        log_error "Build failed! Check $BUILD_DIR/build.log"
        exit 1
    fi
}

# Parse arguments
NATIVE_BUILD=0

while [ $# -gt 0 ]; do
    case "$1" in
        --sdk)
            SDK_PATH="$2"
            shift 2
            ;;
        --arch)
            TARGET_ARCH="$2"
            shift 2
            ;;
        --version)
            LOCALAI_VERSION="$2"
            shift 2
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --native)
            NATIVE_BUILD=1
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       LocalAI Cross-Compile for OpenWrt                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

check_deps

if [ $NATIVE_BUILD -eq 1 ]; then
    setup_native
else
    setup_cross_compile
fi

clone_repo
build_localai

log_info "Done!"
