# SecuBox Development Tools

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

This directory contains utilities for validating, debugging, and maintaining SecuBox modules.

---

## See Also

- **Quick Commands & Rules:** [DOCS/QUICK-START.md](../DOCS/QUICK-START.md)
- **Automation Guardrails:** [DOCS/CODEX.md](../DOCS/CODEX.md)
- **Validation Guide:** [DOCS/VALIDATION-GUIDE.md](../DOCS/VALIDATION-GUIDE.md)
- **Deployment Procedures:** [DOCS/DEVELOPMENT-GUIDELINES.md §9](../DOCS/DEVELOPMENT-GUIDELINES.md#deployment-procedures)

## Tools Overview

### Build and Test Tools

#### local-build.sh

**NEW!** Local build system that replicates GitHub Actions workflows.

Build and test packages locally without pushing to GitHub. Automatically downloads and configures the OpenWrt SDK, builds packages, and collects artifacts.

**Usage:**
```bash
# Validate all packages
./secubox-tools/local-build.sh validate

# Build all packages (x86_64)
./secubox-tools/local-build.sh build

# Build single package
./secubox-tools/local-build.sh build luci-app-system-hub

# Build for specific architecture
./secubox-tools/local-build.sh build --arch aarch64-cortex-a72

# Build firmware image for MOCHAbin
./secubox-tools/local-build.sh build-firmware mochabin

# Build firmware image for ESPRESSObin V7
./secubox-tools/local-build.sh build-firmware espressobin-v7

# Full validation + build
./secubox-tools/local-build.sh full

# Clean build artifacts
./secubox-tools/local-build.sh clean

# Clean everything including OpenWrt source
./secubox-tools/local-build.sh clean-all
```

**Supported Architectures (for package building):**
- `x86-64` - PC, VMs (default)
- `aarch64-cortex-a53` - ARM Cortex-A53 (ESPRESSObin)
- `aarch64-cortex-a72` - ARM Cortex-A72 (MOCHAbin, RPi4)
- `aarch64-generic` - Generic ARM64
- `mips-24kc` - MIPS 24Kc (TP-Link)
- `mipsel-24kc` - MIPS LE (Xiaomi, GL.iNet)

**Supported Devices (for firmware building):**
- `espressobin-v7` - ESPRESSObin V7 (1-2GB DDR4)
- `espressobin-ultra` - ESPRESSObin Ultra (PoE, WiFi)
- `sheeva64` - Sheeva64 (Plug computer)
- `mochabin` - MOCHAbin (Quad-core A72, 10G)
- `x86-64` - x86_64 Generic PC

**Environment Variables:**
- `OPENWRT_VERSION` - OpenWrt version (default: 24.10.5, also supports: 25.12.0-rc1, 23.05.5, SNAPSHOT)
- `SDK_DIR` - SDK directory (default: ./sdk)
- `BUILD_DIR` - Build output directory (default: ./build)
- `CACHE_DIR` - Download cache directory (default: ./cache)
- `OPENWRT_DIR` - OpenWrt source directory for firmware builds (default: ./openwrt)

**Output:**
- Built packages are placed in `build/<arch>/` with SHA256 checksums
- Firmware images are placed in `build/firmware/<device>/` with checksums and build info

**Dependencies:**
```bash
# Required for building
sudo apt-get install -y build-essential clang flex bison g++ gawk \
    gcc-multilib g++-multilib gettext git libncurses5-dev \
    libssl-dev python3-setuptools python3-dev rsync \
    swig unzip zlib1g-dev file wget curl jq ninja-build

# Optional for validation
sudo apt-get install -y shellcheck nodejs
```

**Features:**
- **Package Building**: Downloads and caches OpenWrt SDK for faster builds
- **Firmware Building**: Downloads full OpenWrt source and builds custom firmware images
- Configures feeds (packages, luci) automatically
- Validates packages before building
- Builds .ipk packages with verbose output
- Builds complete firmware images (.img.gz, *sysupgrade.bin, etc.)
- Collects artifacts with checksums
- Supports single package or all packages
- Multiple architecture and device support
- Device profile verification before building

**Example Workflow - Package Building:**
```bash
# 1. Make changes to a module
vim luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/overview.js

# 2. Validate and build locally
./secubox-tools/local-build.sh full

# 3. Test on router
scp build/x86-64/*.ipk root@192.168.1.1:/tmp/
ssh root@192.168.1.1
opkg install /tmp/luci-app-system-hub*.ipk
/etc/init.d/rpcd restart
```

**Example Workflow - Firmware Building:**
```bash
# 1. Build firmware for MOCHAbin with SecuBox pre-installed
./secubox-tools/local-build.sh build-firmware mochabin

# 2. Flash to device
# Firmware images are in: build/firmware/mochabin/
# - openwrt-*-sysupgrade.bin (for upgrading existing OpenWrt)
# - openwrt-*-factory.bin (for initial installation)
# - SHA256SUMS (checksums for verification)
# - BUILD_INFO.txt (build details)
# - packages/ (SecuBox .ipk files)

# 3. Clean up after building (optional)
./secubox-tools/local-build.sh clean-all  # Removes OpenWrt source (saves ~20GB)
```

### Validation Tools

#### validate-modules.sh

Fast validation of all modules in the repository.

**Usage:**
```bash
./secubox-tools/validate-modules.sh
```

**Checks performed:**
1. **RPCD script names vs ubus objects** - Ensures RPCD script filenames match JavaScript ubus object declarations
2. **Menu paths vs view files** - Verifies menu.d JSON paths correspond to actual view files
3. **View files have menu entries** - Checks that all view files are referenced in menus
4. **RPCD script permissions** - Ensures scripts are executable
5. **JSON syntax validation** - Validates all menu.d and acl.d JSON files
6. **ubus naming convention** - Verifies all ubus objects use the `luci.` prefix

**Exit codes:**
- `0` - All checks passed (or only warnings)
- `1` - Critical errors found

**Example output:**
```
✓ luci-app-cdn-cache: RPCD script 'luci.cdn-cache' matches ubus object 'luci.cdn-cache'
✓ luci-app-cdn-cache: Menu path 'cdn-cache/overview' → file exists
❌ ERROR: luci-app-example: RPCD script 'example' does not match ubus object 'luci.example'
```

#### validate-module-generation.sh

**NEW!** Comprehensive validation for a single module during/after generation.

**Usage:**
```bash
./secubox-tools/validate-module-generation.sh luci-app-cdn-cache
```

**Checks performed:**
- Makefile completeness (all required fields)
- RPCD script naming convention (luci.* prefix)
- RPCD script structure and handlers
- ACL permissions coverage
- Menu path validation
- JavaScript view validation
- RPC method declarations vs RPCD implementations
- Security scans (hardcoded credentials, dangerous commands)
- Documentation presence

**When to use:**
- After generating a new module
- Before committing changes to a module
- When debugging module integration issues

#### pre-push-validation.sh

**NEW!** Git pre-push hook that validates all modules before allowing push.

**Usage:**
```bash
# Automatic (via git hook):
git push  # validation runs automatically

# Manual:
./secubox-tools/pre-push-validation.sh
```

**Checks performed:**
- All validation from validate-modules.sh
- Git staged changes analysis
- Modified module detection
- Comprehensive security scans
- Full module validation on modified modules

**Exit codes:**
- `0` - Push allowed
- `1` - Push blocked (critical errors found)

**Installation:**
```bash
./secubox-tools/install-git-hooks.sh
```

### Maintenance Tools

#### secubox-repair.sh

Auto-repair tool that fixes common issues in Makefiles and RPCD scripts.

**Usage:**
```bash
./secubox-tools/secubox-repair.sh
```

#### secubox-debug.sh

Validates individual package structure and dependencies on OpenWrt device.

**Usage:**
```bash
./secubox-tools/secubox-debug.sh luci-app-<module-name>
```

#### install-git-hooks.sh

**NEW!** Installs git hooks for automatic validation.

**Usage:**
```bash
./secubox-tools/install-git-hooks.sh
```

This creates a symbolic link from `.git/hooks/pre-push` to `pre-push-validation.sh`.

## Recommended Workflow

### When Generating a New Module

1. **Generate module files** (use Claude with module-prompts.md)

2. **Validate the module:**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module-name>
   ```

3. **Fix all ERRORS** (critical)

4. **Review and fix WARNINGS** (recommended)

5. **Build and test locally** (recommended):
   ```bash
   ./secubox-tools/local-build.sh build luci-app-<module-name>
   # Test on router if needed
   ```

6. **Commit changes:**
   ```bash
   git add luci-app-<module-name>
   git commit -m "feat: implement <module-name> module"
   git push  # Pre-push validation runs automatically
   ```

### When Modifying Existing Modules

1. **Make your changes**

2. **Run quick validation:**
   ```bash
   ./secubox-tools/validate-modules.sh
   ```

3. **For complex changes, run full validation:**
   ```bash
   ./secubox-tools/validate-module-generation.sh luci-app-<module-name>
   ```

4. **Build and test locally** (recommended):
   ```bash
   ./secubox-tools/local-build.sh build luci-app-<module-name>
   ```

5. **Commit and push** (validation runs automatically)

### Before Committing Changes

Always run at least one validation tool before committing:

1. **Run validation** (CRITICAL):
   ```bash
   ./secubox-tools/validate-modules.sh
   # Or use local-build.sh for validation + build:
   ./secubox-tools/local-build.sh full
   ```

2. Fix any errors reported

3. Run shellcheck on RPCD scripts:
   ```bash
   shellcheck luci-app-*/root/usr/libexec/rpcd/*
   ```

4. **Test build locally** (recommended):
   ```bash
   ./secubox-tools/local-build.sh build
   ```

5. Commit changes

## Common Fixes

### Fix RPCD naming mismatch

If validation reports RPCD script name doesn't match ubus object:

```bash
# Rename the script to include luci. prefix
cd luci-app-example/root/usr/libexec/rpcd
mv example luci.example
```

### Fix menu path mismatch

If validation reports menu path doesn't match view file:

```bash
# Option 1: Update menu.d JSON to match file location
# Edit: root/usr/share/luci/menu.d/luci-app-example.json
# Change: "path": "example/view" → "path": "example-dashboard/view"

# Option 2: Move view files to match menu path
mv htdocs/luci-static/resources/view/example-dashboard \
   htdocs/luci-static/resources/view/example
```

### Fix non-executable RPCD script

```bash
chmod +x luci-app-example/root/usr/libexec/rpcd/luci.example
```

## Integration with CI/CD

The validation script can be integrated into GitHub Actions workflows:

```yaml
- name: Validate modules
  run: |
    chmod +x secubox-tools/validate-modules.sh
    ./secubox-tools/validate-modules.sh
```

## Critical Naming Rules

**These rules are MANDATORY** - violations will cause runtime errors:

1. **RPCD scripts** must be named `luci.<module-name>`
   - ✅ `luci.cdn-cache`
   - ❌ `cdn-cache`

2. **Menu paths** must match view file locations
   - Menu: `"path": "cdn-cache/overview"`
   - File: `view/cdn-cache/overview.js`

3. **ubus objects** must use `luci.` prefix
   - ✅ `object: 'luci.cdn-cache'`
   - ❌ `object: 'cdn-cache'`

See `CLAUDE.md` for complete documentation.
