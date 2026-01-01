# SecuBox Core Framework

**Version**: 0.8.0
**License**: GPL-2.0
**Category**: Administration

## Overview

SecuBox Core is the foundational framework for the modular SecuBox system. It provides a unified infrastructure for managing OpenWrt-based security appliances through a plugin-based architecture.

## Features

### Core Capabilities

- **Modular AppStore**: Plugin-based module discovery, installation, and management
- **Profile System**: Declarative configuration profiles, templates, and macros
- **Unified CLI**: Single `secubox` command for all operations
- **Health Monitoring**: Comprehensive diagnostics and health checks
- **Recovery System**: Automatic snapshots, rollback, and disaster recovery
- **ubus Integration**: Full RPC API for LuCI and third-party integration

### Architecture

```
secubox-core
├── Core Services
│   ├── secubox-core daemon (procd)
│   ├── ubus RPC interface
│   └── Health monitoring
│
├── Module Management
│   ├── AppStore catalog
│   ├── Module discovery
│   ├── Dependency resolution
│   └── Lifecycle hooks
│
├── Configuration
│   ├── Profile engine
│   ├── Template rendering
│   └── Macro execution
│
└── Operations
    ├── Diagnostics
    ├── Snapshot/recovery
    └── Verification
```

## Installation

### From Package

```bash
opkg update
opkg install secubox-core
```

### From Source

```bash
# In OpenWrt buildroot
make package/secubox/secubox-core/compile
make package/secubox/secubox-core/install
```

## Quick Start

### 1. Check System Status

```bash
secubox device status
```

Output:
```
Version: 0.8.0
Uptime: 1 day, 3:42
CPU Load: 0.45
Memory: 45%
Storage: 12%
WAN: 192.0.2.1 (eth0)
LAN: 192.168.1.1
```

### 2. Browse Available Modules

```bash
secubox app list
```

### 3. Install a Module

```bash
secubox app install wireguard-vpn
```

### 4. Run Health Check

```bash
secubox diag health
```

## CLI Reference

### Main Commands

```bash
secubox <command> [subcommand] [options]
```

| Command   | Description                          |
|-----------|--------------------------------------|
| `app`     | Manage modules and AppStore          |
| `profile` | Manage profiles and templates        |
| `device`  | Device information and management    |
| `net`     | Network management                   |
| `diag`    | Diagnostics and health checks        |
| `ai`      | AI copilot (optional, experimental)  |

### App Commands

```bash
secubox app list                 # List all modules
secubox app search <query>       # Search for modules
secubox app info <module>        # Show module details
secubox app install <module>     # Install a module
secubox app remove <module>      # Remove a module
secubox app update [module]      # Update module(s)
secubox app health               # Check module health
```

### Profile Commands

```bash
secubox profile list                  # List available profiles
secubox profile show <profile>        # Show profile details
secubox profile apply <profile>       # Apply a profile
secubox profile validate <profile>    # Validate profile syntax
secubox profile export [file]         # Export current config
```

### Device Commands

```bash
secubox device info           # Show device information
secubox device status         # Show system status
secubox device reboot         # Reboot device
secubox device factory-reset  # Factory reset
secubox device backup [file]  # Backup configuration
```

### Diagnostics Commands

```bash
secubox diag health           # Run health check
secubox diag logs [service]   # View system logs
secubox diag trace <target>   # Network trace
secubox diag report           # Generate diagnostic report
```

## Configuration

### UCI Configuration

**File**: `/etc/config/secubox`

```
config core 'main'
    option enabled '1'
    option log_level 'info'
    option appstore_url 'https://repo.secubox.org/catalog'
    option health_check_interval '300'
    option ai_enabled '0'

config security 'enforcement'
    option sandboxing '1'
    option module_signature_check '0'
    option auto_update_check '1'

config diagnostics 'settings'
    option health_threshold_cpu '80'
    option health_threshold_memory '90'
    option health_threshold_storage '85'
```

### Directories

| Path                                    | Purpose                         |
|-----------------------------------------|---------------------------------|
| `/etc/config/secubox`                   | UCI configuration               |
| `/etc/secubox/profiles/`                | Profile definitions             |
| `/etc/secubox/templates/`               | Configuration templates         |
| `/etc/secubox/macros/`                  | Reusable macros                 |
| `/usr/share/secubox/plugins/catalog/`   | Module catalog                  |
| `/usr/share/secubox/modules/`           | Module metadata                 |
| `/var/run/secubox/`                     | Runtime state                   |
| `/var/log/secubox/`                     | Log files                       |
| `/overlay/secubox-backups/`             | Configuration snapshots         |

## Module System

### Module Catalog

Modules are discovered through catalog entries in JSON format:

**Location**: `/usr/share/secubox/plugins/catalog/<module-id>.json`

Example:
```json
{
  "id": "wireguard-vpn",
  "name": "WireGuard VPN Manager",
  "version": "1.0.0",
  "category": "networking",
  "runtime": "native",
  "packages": {
    "required": ["luci-app-wireguard-vpn", "wireguard-tools"]
  },
  "capabilities": ["vpn-server", "vpn-client"],
  "requirements": {
    "min_ram_mb": 64,
    "min_storage_mb": 10
  }
}
```

### Module Lifecycle

1. **Discovery**: Catalog scanned for available modules
2. **Validation**: Manifest and dependencies checked
3. **Pre-install**: Pre-install hooks executed
4. **Installation**: opkg packages installed
5. **Post-install**: Post-install configuration
6. **Health Check**: Module health verified

### Hooks

Modules can define lifecycle hooks:

- `pre_install`: Run before installation
- `post_install`: Run after installation
- `pre_remove`: Run before removal
- `post_remove`: Run after removal

## Profile System

### Profile Structure

Profiles are declarative YAML/JSON configurations:

```yaml
profile:
  id: home-office
  name: "Home Office Network"

modules:
  required:
    - wireguard-vpn
    - dns-filter
    - bandwidth-manager

uci_overrides:
  network:
    lan:
      ipaddr: "192.168.10.1"
      netmask: "255.255.255.0"
```

### Applying Profiles

```bash
# Dry-run first
secubox profile apply home-office --dryrun

# Apply profile
secubox profile apply home-office
```

## Recovery and Snapshots

### Automatic Snapshots

Snapshots are automatically created:
- Before profile application
- Before module installation
- On first boot

### Manual Snapshots

```bash
# Create snapshot
secubox-recovery snapshot "my-snapshot"

# List snapshots
secubox-recovery list

# Restore from snapshot
secubox-recovery restore my-snapshot
```

### Recovery Mode

```bash
secubox-recovery enter
```

## ubus API

### Available Objects

```bash
ubus list luci.secubox
```

Objects:
- `luci.secubox` - Core operations
- `luci.secubox.appstore` - Module management (legacy, use luci.secubox)
- `luci.secubox.profile` - Profile management (legacy, use luci.secubox)
- `luci.secubox.diagnostics` - Health checks (legacy, use luci.secubox)

### Example Usage

```bash
# Get system status
ubus call luci.secubox getStatus

# List modules
ubus call luci.secubox getModules

# Install module
ubus call luci.secubox installModule '{"module":"wireguard-vpn"}'

# Run diagnostics
ubus call luci.secubox runDiagnostics '{"target":"all"}'
```

## Health Monitoring

### Health Checks

The system monitors:
- CPU load
- Memory usage
- Storage capacity
- Network connectivity
- Module status
- Service health

### Thresholds

Configure in `/etc/config/secubox`:

```
config diagnostics 'settings'
    option health_threshold_cpu '80'
    option health_threshold_memory '90'
    option health_threshold_storage '85'
```

### Automated Checks

Health checks run automatically every 5 minutes (configurable):

```
uci set secubox.main.health_check_interval='300'
uci commit secubox
```

## Security

### Module Verification

Enable signature verification:

```bash
uci set secubox.enforcement.module_signature_check='1'
uci commit secubox
```

### Sandboxing

Modules run with resource limits (when supported by kernel):

```
procd_set_param cgroup.memory.limit_in_bytes 134217728  # 128 MB
```

### ACL Integration

All ubus methods are protected by LuCI ACL system.

## Troubleshooting

### Check Service Status

```bash
/etc/init.d/secubox-core status
```

### View Logs

```bash
logread | grep secubox
```

or

```bash
tail -f /var/log/secubox/core.log
```

### Restart Service

```bash
/etc/init.d/secubox-core restart
```

### Reset to Defaults

```bash
uci revert secubox
/etc/init.d/secubox-core restart
```

### Recovery

If system becomes unresponsive:

```bash
secubox-recovery enter
```

## Development

### Adding New Modules

1. Create module catalog entry:
   ```bash
   /usr/share/secubox/plugins/catalog/my-module.json
   ```

2. Define manifest with required fields:
   - `id`, `name`, `version`
   - `category`, `runtime`
   - `packages`, `capabilities`

3. (Optional) Add lifecycle hooks

4. Test installation:
   ```bash
   secubox app install my-module
   ```

### Custom Profiles

1. Create profile YAML/JSON in `/etc/secubox/profiles/`

2. Validate:
   ```bash
   secubox profile validate my-profile
   ```

3. Test with dry-run:
   ```bash
   secubox profile apply my-profile --dryrun
   ```

4. Apply:
   ```bash
   secubox profile apply my-profile
   ```

## Dependencies

**Required**:
- `libubox`
- `libubus`
- `libuci`
- `rpcd`
- `bash`
- `coreutils-base64`
- `jsonfilter`

**Optional**:
- `python3` (for YAML profile support)
- `signify-openbsd` or `openssl` (for signature verification)

## Files

### Executables

- `/usr/sbin/secubox` - Main CLI entrypoint
- `/usr/sbin/secubox-core` - Core daemon
- `/usr/sbin/secubox-appstore` - AppStore manager
- `/usr/sbin/secubox-profile` - Profile engine
- `/usr/sbin/secubox-diagnostics` - Diagnostics system
- `/usr/sbin/secubox-recovery` - Recovery tools
- `/usr/sbin/secubox-verify` - Verification tools

### RPCD Scripts

- `/usr/libexec/rpcd/luci.secubox` - Main ubus interface

### Init Scripts

- `/etc/init.d/secubox-core` - procd service
- `/etc/uci-defaults/99-secubox-firstboot` - First-boot provisioning

## License

GPL-2.0

## Support

- Documentation: https://docs.secubox.org
- Issues: https://github.com/gkerma/secubox-openwrt/issues
- Community: https://forum.secubox.org

## Version History

### 0.8.0 (Current)
- Initial framework implementation
- Core module system
- Profile engine
- Health monitoring
- Recovery system
- CLI interface
- ubus API

## Roadmap

### 0.9.0
- LuCI WebUI integration
- Enhanced profile templating
- Remote catalog support
- AI copilot integration

### 1.0.0
- Production-ready release
- Complete module ecosystem
- Advanced security features
- Performance optimizations
