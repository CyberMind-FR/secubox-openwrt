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
        ├── libexec/rpcd/<module-name>    # RPCD backend script
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

### RPCD Not Responding

After installing/updating a package:
```bash
/etc/init.d/rpcd restart
```

### Menu Not Appearing

Check that:
1. Menu JSON is valid: `jsonlint root/usr/share/luci/menu.d/*.json`
2. ACL grants access: Check `root/usr/share/rpcd/acl.d/*.json`
3. Dependencies are installed: Check Makefile `LUCI_DEPENDS`

### Build Failures

Common causes:
1. Missing fields in Makefile (PKG_NAME, LUCI_TITLE, etc.)
2. Invalid JSON syntax in menu.d or acl.d
3. RPCD script not executable
4. Wrong include path (should be `include ../../luci.mk`)

Use repair tool: `./secubox-tools/secubox-repair.sh`

## Development Workflow

1. Make changes to module files
2. Test JSON syntax: `jsonlint <file>.json`
3. Test shell scripts: `shellcheck <script>`
4. Build package: `make package/luci-app-<name>/compile V=s`
5. Install on test router and verify functionality
6. Run repair tool if needed: `./secubox-tools/secubox-repair.sh`
7. Commit changes and push (triggers CI validation)
8. Create tag for release: `git tag -a v1.0.0 -m "Release 1.0.0"`

## Important Notes

- All modules use Apache-2.0 license
- RPCD backends must be executable (chmod +x)
- JavaScript files use strict mode: `'use strict';`
- Menu entries require proper dependency chain
- ACL must grant both ubus call and luci-cgi access
- UCI config files are optional (many modules don't need them)
- All packages build as architecture `all` (no compiled code)
