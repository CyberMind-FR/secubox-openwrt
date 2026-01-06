# Building CrowdSec Firewall Bouncer Binary

This document explains how to build the real `crowdsec-firewall-bouncer` binary package from the upstream OpenWrt feeds.

## Overview

The `secubox-app-crowdsec-bouncer` package is a lightweight wrapper that provides enhanced configuration and auto-registration. However, it depends on the actual binary package `crowdsec-firewall-bouncer` which must be built separately.

## Build Environment

- **OpenWrt SDK**: Version 24.10.5
- **Architecture**: aarch64_cortex-a72 (MOCHAbin platform)
- **Build System**: OpenWrt SDK with golang support
- **Source**: GitHub `crowdsecurity/cs-firewall-bouncer` v0.0.31

## Prerequisites

1. OpenWrt SDK set up at `secubox-tools/sdk/`
2. Feeds updated (packages feed must be available)
3. Golang build dependencies installed

## Build Process

### Step 1: Install Golang Dependencies

```bash
cd secubox-tools/sdk
./scripts/feeds install -p packages golang
```

This installs the Go compiler and build framework needed for cross-compilation.

### Step 2: Install Package from Feed

```bash
./scripts/feeds install crowdsec-firewall-bouncer
```

This creates a symlink in `package/feeds/packages/crowdsec-firewall-bouncer/` pointing to the upstream package in `feeds/packages/net/crowdsec-firewall-bouncer/`.

### Step 3: Build Package

```bash
make package/feeds/packages/crowdsec-firewall-bouncer/compile V=s -j1
```

Build options:
- `V=s`: Verbose output (useful for debugging)
- `-j1`: Single-threaded build (more stable for Go compilation)

Build time: ~50-60 seconds on a modern system

### Step 4: Locate Built Package

The IPK package is created at:
```
bin/packages/aarch64_cortex-a72/packages/crowdsec-firewall-bouncer_0.0.31-r2_aarch64_cortex-a72.ipk
```

## Package Details

### Binary Information
- **Size**: ~4.9MB (compressed IPK), ~14MB (binary)
- **Binary Path**: `/usr/bin/cs-firewall-bouncer`
- **Architecture**: ELF 64-bit LSB executable, ARM aarch64
- **Linked**: Dynamically linked with musl libc
- **Go Version**: 1.23.12
- **Stripped**: Yes (to reduce size)

### Package Contents
- Binary: `/usr/bin/cs-firewall-bouncer`
- Init Script: `/etc/init.d/crowdsec-firewall-bouncer`
- Config Template: `/etc/config/crowdsec`

## Deployment

### Upload to Router

```bash
scp bin/packages/aarch64_cortex-a72/packages/crowdsec-firewall-bouncer_0.0.31-r2_aarch64_cortex-a72.ipk root@192.168.8.191:/tmp/
```

### Install on Router

```bash
ssh root@192.168.8.191
opkg install --force-reinstall /tmp/crowdsec-firewall-bouncer_0.0.31-r2_aarch64_cortex-a72.ipk
```

Use `--force-reinstall` to upgrade existing installations.

### Verify Installation

```bash
/usr/bin/cs-firewall-bouncer --version
/etc/init.d/crowdsec-firewall-bouncer restart
cscli bouncers list
```

Expected output:
- Service running
- Active API pulls to CrowdSec LAPI
- nftables tables created (crowdsec, crowdsec6)

## Integration with SecuBox Wrapper

The `secubox-app-crowdsec-bouncer` wrapper package:
1. Depends on `+crowdsec-firewall-bouncer` (this binary package)
2. Provides enhanced UCI configuration with router-optimized defaults
3. Adds automatic API key registration via uci-defaults script
4. Configures network interfaces automatically

When installed together:
```bash
opkg install crowdsec-firewall-bouncer_*.ipk
opkg install secubox-app-crowdsec-bouncer_*.ipk
```

The wrapper will detect the binary and configure it automatically.

## Updating to Newer Versions

When upstream releases a new version:

1. Update feeds:
   ```bash
   ./scripts/feeds update packages
   ```

2. Check new version:
   ```bash
   cat feeds/packages/net/crowdsec-firewall-bouncer/Makefile | grep PKG_VERSION
   ```

3. Rebuild:
   ```bash
   make package/feeds/packages/crowdsec-firewall-bouncer/clean
   make package/feeds/packages/crowdsec-firewall-bouncer/compile V=s -j1
   ```

4. Test on router before deploying to production

## Troubleshooting

### Build Fails - Golang Not Found
**Solution**: Install golang dependencies first
```bash
./scripts/feeds install -a -f golang
```

### Out of Memory During Build
**Solution**: Ensure at least 2GB RAM available or use swap
```bash
free -h  # Check memory
```

### Download Timeout
**Solution**: Manually download source
```bash
cd dl/
wget https://codeload.github.com/crowdsecurity/cs-firewall-bouncer/tar.gz/v0.0.31 -O cs-firewall-bouncer-0.0.31.tar.gz
cd ..
make package/feeds/packages/crowdsec-firewall-bouncer/compile V=s
```

### Binary Size Too Large
This is expected - Go binaries include the runtime and dependencies. The 14MB binary is normal for a Go application with networking and nftables integration.

## Build System Details

The build process:
1. Downloads source from GitHub
2. Verifies SHA256 checksum
3. Sets up Go workspace with proper GOPATH
4. Downloads Go module dependencies
5. Cross-compiles using OpenWrt toolchain
6. Injects version info via LDFLAGS
7. Strips binary symbols
8. Creates IPK package with control files

Go build flags:
```makefile
GO_PKG_LDFLAGS_X:=
    github.com/crowdsecurity/cs-firewall-bouncer/pkg/version.Version=v0.0.31
    github.com/crowdsecurity/cs-firewall-bouncer/pkg/version.BuildDate=<timestamp>
    github.com/crowdsecurity/cs-firewall-bouncer/pkg/version.Tag=openwrt-0.0.31-2
    github.com/crowdsecurity/cs-firewall-bouncer/pkg/version.GoVersion=1.23.12
```

## CI/CD Integration

For GitHub Actions or automated builds:

```yaml
- name: Build CrowdSec Firewall Bouncer
  run: |
    cd secubox-tools/sdk
    ./scripts/feeds install -p packages golang
    ./scripts/feeds install crowdsec-firewall-bouncer
    make package/feeds/packages/crowdsec-firewall-bouncer/compile V=s -j$(nproc)

- name: Upload Package
  uses: actions/upload-artifact@v3
  with:
    name: crowdsec-firewall-bouncer
    path: bin/packages/aarch64_cortex-a72/packages/crowdsec-firewall-bouncer_*.ipk
```

## Version History

- **0.0.31-r2** (2026-01-06): First build with OpenWrt SDK, Go 1.23.12
- Built from upstream: `https://github.com/crowdsecurity/cs-firewall-bouncer/releases/tag/v0.0.31`

## References

- Upstream Package: `secubox-tools/sdk/feeds/packages/net/crowdsec-firewall-bouncer/`
- OpenWrt Golang Framework: `feeds/packages/lang/golang/golang-package.mk`
- CrowdSec Documentation: https://docs.crowdsec.net/
- Firewall Bouncer Repo: https://github.com/crowdsecurity/cs-firewall-bouncer
