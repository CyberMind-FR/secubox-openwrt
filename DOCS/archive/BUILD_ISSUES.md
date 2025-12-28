# Build Issues & Solutions

**Version:** 1.0.0
**Last Updated:** 2025-12-28
**Status:** Active

## Current Problem: No IPK Generated on GitHub Actions

### Root Cause

The OpenWrt **SDK** cannot compile LuCI core dependencies (`lucihttp`, `cgi-io`) because it lacks the necessary `ubus` development headers. When building SecuBox packages, the SDK tries to compile all dependencies from source, which fails with:

```
ERROR: package/feeds/luci/lucihttp failed to build.
ubus_include_dir-NOTFOUND
```

###Why This Works Locally

Locally, you likely have one of these setups:
1. **Full OpenWrt build tree** - Has all headers and can compile everything
2. **ImageBuilder** - Uses pre-compiled packages, doesn't compile from source
3. **Pre-installed dependencies** - lucihttp/cgi-io already exist

### Why It Fails on GitHub Actions

GitHub Actions uses the **OpenWrt SDK** which:
- ✅ Can compile packages with compiled code
- ❌ Cannot compile certain LuCI core packages (missing headers)
- ❌ Tries to rebuild all dependencies from source

## Solutions

### Option 1: Use OpenWrt ImageBuilder (Recommended)

**Best for:** Creating firmware images with SecuBox pre-installed

ImageBuilder uses pre-compiled packages and doesn't require compilation:

```yaml
# New workflow using ImageBuilder
- name: Download ImageBuilder
  run: |
    wget https://downloads.openwrt.org/releases/${VERSION}/targets/${TARGET}/${SUBTARGET}/openwrt-imagebuilder-*.tar.xz
    tar xf openwrt-imagebuilder-*.tar.xz

- name: Add custom packages
  run: |
    mkdir -p imagebuilder/packages/custom
    cp *.ipk imagebuilder/packages/custom/

- name: Build image
  run: |
    cd imagebuilder
    make image PACKAGES="luci luci-app-secubox luci-app-*-dashboard"
```

**Pros:**
- ✅ No compilation issues
- ✅ Creates complete firmware images
- ✅ Fast builds (uses binaries)

**Cons:**
- ❌ Requires specifying target device
- ❌ Not suitable for multi-architecture package builds

### Option 2: Use Full OpenWrt Build System

**Best for:** Complete control, custom kernels, or when you need to modify core packages

Clone and build complete OpenWrt:

```yaml
- name: Clone OpenWrt
  run: |
    git clone https://github.com/openwrt/openwrt.git
    cd openwrt
    ./scripts/feeds update -a
    ./scripts/feeds install -a

- name: Add SecuBox packages
  run: |
    cp -r ../luci-app-* openwrt/package/

- name: Build
  run: |
    cd openwrt
    make defconfig
    make -j$(nproc)
```

**Pros:**
- ✅ Can compile everything
- ✅ Full control over build
- ✅ Can modify core packages

**Cons:**
- ❌ Very slow (1-2 hours per architecture)
- ❌ Requires significant disk space (30-50GB)
- ❌ Complex configuration

### Option 3: Package-Only Repository (Alternative)

**Best for:** Distributing packages that users install on existing OpenWrt systems

Create a custom package feed:

```bash
# On your server/GitHub Pages
mkdir -p packages/${ARCH}/secubox
cp *.ipk packages/${ARCH}/secubox/
scripts/ipkg-make-index packages/${ARCH}/secubox > Packages
gzip -c Packages > Packages.gz
```

Users add to `/etc/opkg/customfeeds.conf`:
```
src/gz secubox https://yourdomain.com/packages/${ARCH}/secubox
```

**Pros:**
- ✅ No build needed (distribute sources)
- ✅ Users compile locally or use binaries
- ✅ Easy updates

**Cons:**
- ❌ Users need to manually install
- ❌ Doesn't provide firmware images

### Option 4: Fix SDK Build (Current Attempt)

The current workflow attempts workarounds:
1. Download package indices
2. Configure SDK to prefer binaries (CONFIG_BUILDBOT=y)
3. Fallback to direct packaging if compile fails

**Status:** Experimental, may not work reliably

**Pros:**
- ✅ Keeps existing workflow structure
- ✅ Multi-architecture builds

**Cons:**
- ❌ Fragile, depends on SDK quirks
- ❌ May break with OpenWrt updates
- ❌ Not officially supported

## Recommended Approach

### For Package Distribution
Use **Option 3** (Package Repository) combined with **Option 1** (ImageBuilder for sample firmwares):

1. **Distribute source packages** via GitHub releases
2. **Provide pre-built .ipk** for common architectures (x86-64, ARM)
3. **Create sample firmwares** with ImageBuilder for popular devices
4. **Document installation** for users who want to install on existing OpenWrt

### Implementation Steps

1. **Create package feed workflow** (replaces current SDK build)
2. **Add ImageBuilder workflow** for sample firmwares (ESPRESSObin, x86-64, etc.)
3. **Update README** with installation instructions
4. **Tag releases** with both source and binaries

## Next Steps

To implement the recommended solution:

```bash
# 1. Create new workflow for ImageBuilder
cp .github/workflows/build-secubox-images.yml .github/workflows/build-imagebuilder.yml
# Edit to use ImageBuilder instead of full build

# 2. Update package build workflow to create feed instead of compiling
# (Keep source distribution, skip compilation)

# 3. Update documentation
# Add INSTALL.md with instructions for different scenarios
```

## Temporary Workaround

Until the proper solution is implemented, users can:

1. **Download source** from GitHub
2. **Build locally** using local-build.sh (requires SDK setup)
3. **Or use existing firmware builds** (when available)

## References

- OpenWrt SDK: https://openwrt.org/docs/guide-developer/toolchain/using_the_sdk
- OpenWrt ImageBuilder: https://openwrt.org/docs/guide-user/additional-software/imagebuilder
- Package Feeds: https://openwrt.org/docs/guide-developer/feeds
