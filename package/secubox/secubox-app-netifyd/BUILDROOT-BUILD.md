# Building Netifyd with OpenWrt Buildroot

## Overview

Netifyd **requires full OpenWrt buildroot** for building because it needs system libraries that are not available in the SDK.

## Automatic Build (Recommended)

The local-build.sh script automatically detects netifyd and uses OpenWrt buildroot:

```bash
./secubox-tools/local-build.sh build netifyd
```

This will:
1. Download OpenWrt 24.10.5 source (~500 MB)
2. Setup feeds
3. Copy SecuBox packages
4. Install netifyd from SecuBox feed
5. Configure and build netifyd

**Build time:**
- First build: 15-30 minutes (downloads toolchain, builds dependencies)
- Subsequent builds: 2-5 minutes (incremental)

## What Gets Built

The buildroot provides all required dependencies:
- `libmnl` - Minimal Netlink library
- `libnetfilter-conntrack` - Connection tracking
- `libpcap` - Packet capture
- `libjson-c` - JSON parsing
- `libcurl` - HTTP client
- Kernel modules: nf_conntrack, nfnetlink, etc.

## Output

After successful build:
```bash
# Package location
./build/x86-64/netifyd_5.2.1-1_x86_64.ipk

# Also findable at
./openwrt/bin/packages/x86_64/secubox/netifyd_5.2.1-1_x86_64.ipk
```

## Manual Build

If you prefer manual control:

```bash
cd openwrt/

# Configure
make menuconfig
# Select: Network > netifyd

# Build
make package/netifyd/compile V=s
```

## Why Not SDK?

The SDK cannot build netifyd because:
- SDK only includes application-level library stubs
- Netifyd needs kernel-level libraries (libmnl, libnetfilter-conntrack)
- These libraries must be compiled against the target system
- Only full buildroot provides the complete dependency chain

## Troubleshooting

### Issue: Build fails with "libmnl not found"

**Cause:** Using SDK instead of buildroot

**Fix:** The script should auto-detect and use buildroot. If not:
```bash
# Ensure you're using the build command, not compiling directly in SDK
./secubox-tools/local-build.sh build netifyd
```

### Issue: Build takes too long

**Normal:** First build downloads toolchain and compiles base libraries (15-30 min)

**Speed up:** Use faster machine or pre-compiled SDK for dependencies

### Issue: Out of disk space

**Cause:** OpenWrt buildroot needs ~10 GB

**Fix:** Free up space or use different build directory:
```bash
OPENWRT_DIR=/path/to/large/disk/openwrt ./secubox-tools/local-build.sh build netifyd
```

## Comparison: SDK vs Buildroot

| Feature | SDK | Buildroot |
|---------|-----|-----------|
| Size | ~300 MB | ~2 GB |
| Build time | Fast (2-5 min) | Slow first time (15-30 min) |
| Can build apps | ✅ Yes | ✅ Yes |
| Can build system daemons | ❌ No | ✅ Yes |
| Kernel libraries | ❌ No | ✅ Yes |
| Full dependency tree | ❌ No | ✅ Yes |

Netifyd needs: **Buildroot** ✅

## See Also

- [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md) - Detailed build instructions
- [SDK-LIMITATION.md](SDK-LIMITATION.md) - Why SDK doesn't work
- [INTEGRATION.md](INTEGRATION.md) - Integration with SecuBox
