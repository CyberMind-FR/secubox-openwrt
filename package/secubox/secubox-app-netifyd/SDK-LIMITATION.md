# SDK Build Limitation for Netifyd

## Issue

Netifyd **cannot be built using the OpenWrt SDK** because it requires base system libraries that are not available in the SDK environment:

- `libmnl` (Minimal Netlink library)
- `libnetfilter-conntrack`
- `libpcap`
- `libjson-c`
- Various kernel modules

## Why This Happens

The OpenWrt SDK is designed for building **application packages** that depend on already-compiled system libraries. Net

ifyd is a **system-level daemon** with deep integration into the kernel networking stack, requiring libraries that must be compiled as part of the base system.

## Solution

### Build netifyd as part of firmware

```bash
# Build full SecuBox firmware with netifyd included
./secubox-tools/local-build.sh build-firmware mochabin
```

Netifyd will be automatically included in firmware builds as it's configured in the firmware package list.

### Alternative: Use Pre-Built Packages

If you need standalone `.ipk` files, build them from a full firmware build:

```bash
# After firmware build completes
find openwrt/bin/packages -name "netifyd*.ipk"
find openwrt/bin/packages -name "luci-app-secubox-netifyd*.ipk"
```

## Why SDK Builds Fail

When you try `./secubox-tools/local-build.sh build netifyd`, it fails with:

```
configure: error: Package requirements (libmnl >= 1.0.3) were not met
```

This is because:
1. SDK doesn't include kernel-level libraries
2. SDK can't compile these libraries (they require full buildroot)
3. Netifyd's configure script can't find the required dependencies

## Recommended Workflow

**For Development:**
- Build firmware with netifyd: `./secubox-tools/local-build.sh build-firmware x86-64`
- Extract netifyd IPK from `openwrt/bin/packages`
- Install on device for testing

**For Production:**
- Always include netifyd in firmware images
- Distributed as part of complete SecuBox firmware

## Technical Details

Netifyd requires these system components:
- **Kernel modules:** nf_conntrack, nfnetlink, etc.
- **System libraries:** Built against specific libc (musl/glibc)
- **Headers:** Kernel headers for netlink/conntrack
- **Build tools:** Full autotools, pkg-config with system library paths

The SDK provides none of these - it only provides a cross-compilation toolchain and application-level library stubs.

## See Also

- [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md) - Full build instructions
- [INTEGRATION.md](INTEGRATION.md) - Integration with SecuBox
- OpenWrt docs on SDK limitations: https://openwrt.org/docs/guide-developer/toolchain/using_the_sdk
