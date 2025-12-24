# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SecuBox is a comprehensive security and network management suite for OpenWrt. The repository contains 13 LuCI application packages that provide dashboards for security monitoring, network intelligence, access control, bandwidth management, and system administration.

## Build Commands

### OpenWrt SDK Build

```bash
# Build a single package
make package/luci-app-<module-name>/compile V=s

# Clean build for a package
make package/luci-app-<module-name>/clean
make package/luci-app-<module-name>/compile V=s

# Install package to staging directory
make package/luci-app-<module-name>/install
```

### Testing Packages

```bash
# Transfer to router
scp bin/packages/*/base/luci-app-*.ipk root@192.168.1.1:/tmp/

# Install on router
ssh root@192.168.1.1
opkg install /tmp/luci-app-*.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### Validation

```bash
# Run comprehensive module validation (RECOMMENDED)
./secubox-tools/validate-modules.sh

# Validate shell scripts (RPCD backends)
shellcheck luci-app-*/root/usr/libexec/rpcd/*

# Validate JSON files
find . -name "*.json" -exec jsonlint {} \;

# Run automated repair tool
./secubox-tools/secubox-repair.sh

# Run diagnostics
./secubox-tools/secubox-debug.sh luci-app-<module-name>
```

## Architecture

### LuCI Package Structure

All SecuBox modules follow a standard LuCI application structure:

```
luci-app-<module-name>/
├── Makefile                              # OpenWrt package definition
├── README.md                             # Module documentation
├── htdocs/luci-static/resources/
│   ├── view/<module-name>/               # JavaScript UI views
│   │   ├── overview.js                   # Main dashboard view
│   │   └── *.js                          # Additional views
│   └── <module-name>/
│       ├── api.js                        # RPC API client module
│       └── dashboard.css                 # Module-specific styles
└── root/
    ├── etc/config/<module-name>          # UCI configuration (optional)
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.<module-name>        # RPCD backend script (MUST use luci. prefix!)
        └── share/
            ├── luci/menu.d/              # Menu JSON definition
            │   └── luci-app-<module-name>.json
            └── rpcd/acl.d/               # ACL permissions JSON
                └── luci-app-<module-name>.json
```

### Frontend-Backend Communication

1. **Frontend (JavaScript)**: Located in `htdocs/luci-static/resources/`
   - Views use LuCI's `form` and `view` classes
   - API calls via `api.js` module using `L.resolveDefault()`
   - UI components from `ui.js` (Dropdown, Checkbox, Combobox, etc.)

2. **Backend (RPCD)**: Located in `root/usr/libexec/rpcd/`
   - Shell scripts that implement RPC methods
   - Must output JSON to stdout
   - Methods are called via ubus: `ubus call <module> <method>`

3. **Menu Definition**: `root/usr/share/luci/menu.d/luci-app-<module>.json`
   - Defines menu structure and navigation
   - Specifies view paths and dependencies

4. **ACL Definition**: `root/usr/share/rpcd/acl.d/luci-app-<module>.json`
   - Defines access control for ubus methods
   - Maps read/write permissions to user groups

### Critical Naming Conventions

**IMPORTANT**: The following naming rules are MANDATORY for modules to work correctly:

#### 1. RPCD Script Must Match ubus Object Name

The RPCD script filename MUST exactly match the ubus object name used in JavaScript:

```javascript
// In JavaScript (htdocs/luci-static/resources/view/*/):
var callStatus = rpc.declare({
    object: 'luci.cdn-cache',  // ← This object name
    method: 'status'
});
```

```bash
# RPCD script filename MUST match:
root/usr/libexec/rpcd/luci.cdn-cache  # ← Must be exactly 'luci.cdn-cache'
```

**Common Error**: If the names don't match, you'll get:
- `RPC call to luci.cdn-cache/status failed with error -32000: Object not found`
- `Command failed: Method not found`

**Solution**: All RPCD scripts MUST use the `luci.` prefix:
- ✅ Correct: `luci.cdn-cache`, `luci.system-hub`, `luci.wireguard-dashboard`
- ❌ Wrong: `cdn-cache`, `system-hub`, `wireguard-dashboard`

#### 2. Menu Paths Must Match View File Locations

Menu JSON path entries MUST correspond to actual view files:

```json
// In menu.d/luci-app-netifyd-dashboard.json:
{
    "action": {
        "type": "view",
        "path": "netifyd-dashboard/overview"  // ← Must match file location
    }
}
```

```bash
# View file MUST exist at:
htdocs/luci-static/resources/view/netifyd-dashboard/overview.js
#                                  ↑ Same path as menu ↑
```

**Common Error**: If paths don't match:
- `HTTP error 404 while loading class file '/luci-static/resources/view/netifyd/overview.js'`

**Solution**: Ensure menu paths match directory structure:
- ✅ Correct: Menu path `netifyd-dashboard/overview` → file `view/netifyd-dashboard/overview.js`
- ❌ Wrong: Menu path `netifyd/overview` → file `view/netifyd-dashboard/overview.js`

#### 3. ubus Object Naming Convention

All ubus objects MUST start with `luci.` prefix:

```javascript
// ✅ Correct:
object: 'luci.cdn-cache'
object: 'luci.system-hub'
object: 'luci.wireguard-dashboard'

// ❌ Wrong:
object: 'cdn-cache'
object: 'systemhub'
```

#### 4. Validation Before Deployment

**ALWAYS** run validation before deploying:

```bash
./secubox-tools/validate-modules.sh
```

This script checks:
- RPCD script names match ubus objects
- Menu paths match view file locations
- View files have corresponding menu entries
- RPCD scripts are executable
- JSON files are valid syntax
- ubus objects follow naming convention

### Makefile Structure

Each package Makefile must define:
- `PKG_NAME`: Package name (must match directory)
- `PKG_VERSION`: Version number
- `PKG_RELEASE`: Package release number
- `LUCI_TITLE`: Display title in LuCI
- `LUCI_DEPENDS`: Package dependencies (e.g., `+luci-base +rpcd`)
- `LUCI_DESCRIPTION`: Brief description
- `PKG_MAINTAINER`: Maintainer name and email
- `PKG_LICENSE`: License (typically Apache-2.0)

The Makefile includes `luci.mk` from the LuCI build system which handles installation.

## Common Development Patterns

### Creating a New Module

1. Copy template: `cp -r templates/luci-app-template luci-app-newmodule`
2. Update Makefile with new PKG_NAME, LUCI_TITLE, etc.
3. Create directory structure under `htdocs/` and `root/`
4. Implement RPCD backend in shell
5. Create JavaScript views
6. Define menu and ACL JSON files

### RPCD Backend Pattern

RPCD backends are shell scripts that:
- Parse `$1` for the method name
- Output valid JSON using `printf` or `echo`
- Use `case` statements for method routing
- Source UCI config if needed: `. /lib/functions.sh`

Example:
```bash
#!/bin/sh
case "$1" in
    list)
        echo '{ "status": {}, "stats": {} }'
        ;;
    call)
        case "$2" in
            status)
                # Output JSON
                printf '{"running": true, "version": "1.0.0"}\n'
                ;;
        esac
        ;;
esac
```

### JavaScript View Pattern

Views extend `L.view` and implement `load()` and `render()`:

```javascript
'use strict';
'require view';
'require form';
'require <module>/api as API';

return L.view.extend({
    load: function() {
        return Promise.all([
            API.getStatus(),
            API.getStats()
        ]);
    },

    render: function(data) {
        var m, s, o;
        m = new form.Map('config', _('Title'));
        s = m.section(form.TypedSection, 'section');
        // Add form fields...
        return m.render();
    }
});
```

## Module Categories

1. **Core Control** (2 modules)
   - luci-app-secubox: Central hub
   - luci-app-system-hub: System control center

2. **Security & Monitoring** (2 modules)
   - luci-app-crowdsec-dashboard: CrowdSec security
   - luci-app-netdata-dashboard: System monitoring

3. **Network Intelligence** (2 modules)
   - luci-app-netifyd-dashboard: Deep packet inspection
   - luci-app-network-modes: Network mode configuration

4. **VPN & Access Control** (3 modules)
   - luci-app-wireguard-dashboard: WireGuard VPN
   - luci-app-client-guardian: NAC & captive portal
   - luci-app-auth-guardian: Authentication system

5. **Bandwidth & Traffic** (2 modules)
   - luci-app-bandwidth-manager: QoS & quotas
   - luci-app-media-flow: Media traffic detection

6. **Performance & Services** (2 modules)
   - luci-app-cdn-cache: CDN proxy cache
   - luci-app-vhost-manager: Virtual host manager

## CI/CD Integration

### GitHub Actions Workflows

1. **build-openwrt-packages.yml**: Compiles packages for all architectures
   - Triggers on push, PR, and tags
   - Matrix build for 13 architectures
   - Uploads artifacts per architecture

2. **build-secubox-images.yml**: Builds custom OpenWrt images
   - Creates complete firmware images with SecuBox pre-installed

3. **test-validate.yml**: Validation and testing
   - Validates Makefile structure
   - Checks JSON syntax
   - Runs shellcheck on scripts
   - Verifies file permissions

### Supported Architectures

ARM64: aarch64-cortex-a53, aarch64-cortex-a72, aarch64-generic, mediatek-filogic, rockchip-armv8, bcm27xx-bcm2711

ARM32: arm-cortex-a7-neon, arm-cortex-a9-neon, qualcomm-ipq40xx, qualcomm-ipq806x

MIPS: mips-24kc, mipsel-24kc, mipsel-74kc

x86: x86-64, x86-generic

## Key Files and Directories

- `makefiles/`: Reference Makefiles for modules (backup/templates)
- `secubox-tools/`: Repair and debugging utilities
  - `secubox-repair.sh`: Auto-fixes Makefile and RPCD issues
  - `secubox-debug.sh`: Validates package structure
- `templates/`: Package templates for creating new modules
- `.github/workflows/`: CI/CD automation scripts

## Common Issues and Solutions

### RPC Errors: "Object not found" or "Method not found"

**Error**: `RPC call to luci.cdn-cache/status failed with error -32000: Object not found`

**Cause**: RPCD script name doesn't match ubus object name in JavaScript

**Solution**:
1. Check JavaScript files for ubus object name:
   ```bash
   grep -r "object:" luci-app-*/htdocs --include="*.js"
   ```
2. Rename RPCD script to match exactly (including `luci.` prefix):
   ```bash
   mv root/usr/libexec/rpcd/cdn-cache root/usr/libexec/rpcd/luci.cdn-cache
   ```
3. Restart RPCD on router:
   ```bash
   /etc/init.d/rpcd restart
   ```

### HTTP 404 Errors: View Files Not Found

**Error**: `HTTP error 404 while loading class file '/luci-static/resources/view/netifyd/overview.js'`

**Cause**: Menu path doesn't match actual view file location

**Solution**:
1. Check menu JSON for path:
   ```bash
   grep '"path":' root/usr/share/luci/menu.d/*.json
   ```
2. Verify view file exists at matching location:
   ```bash
   ls htdocs/luci-static/resources/view/
   ```
3. Update menu path to match file location OR move file to match menu path

### RPCD Not Responding

After installing/updating a package:
```bash
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### Menu Not Appearing

Check that:
1. Menu JSON is valid: `jsonlint root/usr/share/luci/menu.d/*.json`
2. ACL grants access: Check `root/usr/share/rpcd/acl.d/*.json`
3. Dependencies are installed: Check Makefile `LUCI_DEPENDS`
4. Menu path matches view file location (see above)

### Build Failures

Common causes:
1. Missing fields in Makefile (PKG_NAME, LUCI_TITLE, etc.)
2. Invalid JSON syntax in menu.d or acl.d
3. RPCD script not executable (chmod +x needed)
4. Wrong include path (should be `include ../../luci.mk`)
5. RPCD script name doesn't match ubus object (must use `luci.` prefix)

Use repair tool: `./secubox-tools/secubox-repair.sh`

### Quick Diagnosis

Run the validation script to check all naming conventions:
```bash
./secubox-tools/validate-modules.sh
```

## Development Workflow

1. Make changes to module files
2. **Run validation checks** (CRITICAL):
   ```bash
   ./secubox-tools/validate-modules.sh
   ```
3. Test JSON syntax: `jsonlint <file>.json`
4. Test shell scripts: `shellcheck <script>`
5. Build package: `make package/luci-app-<name>/compile V=s`
6. Install on test router and verify functionality
7. Run repair tool if needed: `./secubox-tools/secubox-repair.sh`
8. Commit changes and push (triggers CI validation)
9. Create tag for release: `git tag -a v1.0.0 -m "Release 1.0.0"`

## Important Notes

- **CRITICAL**: RPCD script names MUST match ubus object names (use `luci.` prefix)
- **CRITICAL**: Menu paths MUST match view file directory structure
- **CRITICAL**: Always run `./secubox-tools/validate-modules.sh` before committing
- All modules use Apache-2.0 license
- RPCD backends must be executable (chmod +x)
- JavaScript files use strict mode: `'use strict';`
- Menu entries require proper dependency chain
- ACL must grant both ubus call and luci-cgi access
- UCI config files are optional (many modules don't need them)
- All packages build as architecture `all` (no compiled code)
