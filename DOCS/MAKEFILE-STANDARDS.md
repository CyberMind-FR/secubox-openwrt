# Makefile Standards for SecuBox LuCI Applications

**Version:** 1.0.0
**Last Updated:** 2025-12-28
**Status:** Active Standard

---

## Overview

This document defines the standardized structure and conventions for all `luci-app-*` Makefile configurations in the SecuBox project. Following these standards ensures consistency, maintainability, and proper functionality across all modules.

---

## File Permissions (PKG_FILE_MODES)

### Purpose
The `PKG_FILE_MODES` variable explicitly sets file ownership and permissions for files installed by the package. This is **CRITICAL** for proper module functionality.

### Standard Comment Block

All Makefiles **MUST** include this comment block before `PKG_FILE_MODES`:

```makefile
# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
```

### Format

```makefile
PKG_FILE_MODES:=<path>:<owner>:<group>:<mode>
```

### Required File Modes

#### 1. RPCD Scripts (755 - CRITICAL)

**Path Pattern:** `/usr/libexec/rpcd/luci.<module-name>`

**Mode:** `755` (rwxr-xr-x)

**Rationale:**
- RPCD scripts MUST be executable by root
- Required for ubus RPC calls from the frontend
- Without 755, the backend will fail silently
- Validation: `./secubox-tools/validate-modules.sh` checks this

**Example:**
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.system-hub:root:root:755
```

#### 2. Helper Scripts (755 - If Applicable)

**Path Pattern:** `/usr/libexec/<module-name>/*.sh`

**Mode:** `755` (rwxr-xr-x)

**Rationale:**
- Shell scripts that need execution permissions
- Used for cron jobs, maintenance tasks, or utilities

**Example:**
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.secubox:root:root:755 \
	/usr/libexec/secubox/fix-permissions.sh:root:root:755
```

#### 3. Configuration Files (644 - Default)

**Path Pattern:** `/etc/config/<module-name>`

**Mode:** `644` (rw-r--r--)

**Rationale:**
- UCI config files are world-readable
- Only root can write
- Set automatically by OpenWrt, no explicit PKG_FILE_MODES needed

#### 4. CSS/JS Files (644 - Automatic)

**Path Pattern:** `/www/luci-static/resources/**/*.{css,js}`

**Mode:** `644` (rw-r--r--)

**Rationale:**
- Web assets must be readable by all users
- Set automatically by `luci.mk`
- **DO NOT** add to PKG_FILE_MODES (redundant)

---

## Multi-Line PKG_FILE_MODES

When specifying multiple files, use backslash continuation:

```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.secubox:root:root:755 \
	/usr/libexec/secubox/fix-permissions.sh:root:root:755 \
	/usr/libexec/secubox/health-check.sh:root:root:755
```

**Rules:**
- Backslash `\` at end of line for continuation
- Indent continuation lines with TAB
- Last line has NO backslash
- One space between backslash and newline

---

## Common Errors and Solutions

### Error 1: RPCD Backend Not Responding

**Symptom:**
```
RPC call to luci.module-name/method failed with error -32000: Object not found
```

**Cause:** RPCD script not executable (missing 755 permissions)

**Solution:**
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.module-name:root:root:755
```

**Validation:**
```bash
./secubox-tools/validate-modules.sh
# OR
./secubox-tools/fix-permissions.sh --local
```

---

### Error 2: CSS/JS Files Added to PKG_FILE_MODES

**Wrong:**
```makefile
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.system-hub:root:root:755 \
	/www/luci-static/resources/system-hub/api.js:root:root:644
```

**Right:**
```makefile
# CSS/JS files are automatically set by luci.mk
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.system-hub:root:root:755
```

**Rationale:** The LuCI build system (`luci.mk`) automatically sets correct permissions for all files in `/www/`. Adding them to `PKG_FILE_MODES` is redundant and can cause conflicts.

---

### Error 3: Missing Comment Block

**Wrong:**
```makefile
LUCI_PKGARCH:=all

PKG_FILE_MODES:=/usr/libexec/rpcd/luci.system-hub:root:root:755
```

**Right:**
```makefile
LUCI_PKGARCH:=all

# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.system-hub:root:root:755
```

---

## Validation Tools

### Automated Validation

**Before Commit:**
```bash
./secubox-tools/validate-modules.sh
```

Checks:
1. RPCD script names match ubus objects
2. Menu paths match view file locations
3. View files have menu entries
4. **RPCD scripts are executable (755)**
5. JSON syntax validation
6. ubus object naming convention
7. **htdocs file permissions (644 for CSS/JS)**

**Auto-Fix Permissions:**
```bash
# Fix local files before build
./secubox-tools/fix-permissions.sh --local

# Fix deployed files on router
./secubox-tools/fix-permissions.sh --remote
```

---

## Complete Makefile Template

```makefile
include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-module-name
PKG_VERSION:=0.3.5
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Module Title - Short Description
LUCI_DESCRIPTION:=Comprehensive description of module functionality
LUCI_DEPENDS:=+luci-base +rpcd +optional-dependency
LUCI_PKGARCH:=all

# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.module-name:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# Optional: Config files to preserve on upgrade
define Package/$(PKG_NAME)/conffiles
/etc/config/module-name
endef

# call BuildPackage - OpenWrt buildroot signature
```

---

## File Mode Reference Table

| File Type | Path Pattern | Owner:Group | Mode | Reason |
|-----------|-------------|-------------|------|--------|
| RPCD script | `/usr/libexec/rpcd/luci.*` | root:root | 755 | **CRITICAL** - Must be executable for ubus calls |
| Helper script | `/usr/libexec/*/*.sh` | root:root | 755 | Executable scripts (cron, maintenance) |
| UCI config | `/etc/config/*` | root:root | 644 | World-readable, root-writable (auto-set) |
| CSS/JS files | `/www/luci-static/**/*.{css,js}` | root:root | 644 | Web assets (auto-set by luci.mk) |
| Menu JSON | `/usr/share/luci/menu.d/*.json` | root:root | 644 | LuCI menu definitions (auto-set) |
| ACL JSON | `/usr/share/rpcd/acl.d/*.json` | root:root | 644 | Access control lists (auto-set) |

---

## Best Practices

### 1. **Always Validate Before Commit**
```bash
./secubox-tools/validate-modules.sh
```

### 2. **Use Standard Comment Block**
Copy from existing Makefile or this document.

### 3. **Only Specify Executable Files**
Don't add CSS/JS/JSON files to PKG_FILE_MODES.

### 4. **Test on Real Hardware**
Deploy to test router and verify:
```bash
ls -la /usr/libexec/rpcd/luci.module-name  # Should be -rwxr-xr-x
ubus list | grep module-name               # Should appear
ubus call luci.module-name status          # Should respond
```

### 5. **Document Custom Permissions**
If adding non-standard file modes, add inline comments explaining why.

---

## Troubleshooting

### Permission Denied Errors

**Check permissions on router:**
```bash
ssh root@router "ls -la /usr/libexec/rpcd/luci.*"
```

**Fix remotely:**
```bash
./secubox-tools/fix-permissions.sh --remote
```

### Files Not Installed

**Check package contents:**
```bash
tar -tzf luci-app-module-name_*.ipk | grep rpcd
# OR (for .apk format)
tar -tzf luci-app-module-name_*.apk | grep rpcd
```

**Verify Makefile paths:**
Ensure `PKG_FILE_MODES` paths match actual file locations in the package.

---

## References

- [OpenWrt Makefile Documentation](https://openwrt.org/docs/guide-developer/packages)
- [LuCI Build System](https://github.com/openwrt/luci/blob/master/luci.mk)
- [DEVELOPMENT-GUIDELINES.md](./DEVELOPMENT-GUIDELINES.md)
- [QUICK-START.md](./QUICK-START.md)

---

## Changelog

### v1.0.0 (2025-12-28)
- Initial standardization across all 15 SecuBox modules
- Defined standard comment block format
- Documented file mode requirements
- Added validation and troubleshooting sections

---

**Next Review:** 2026-01-28 (or when adding new modules)
