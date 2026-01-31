# SecuBox Console & CLI Tools Reference

**Remote Management Point for SecuBox Devices**

KISS modular self-enhancing architecture.

## Overview

Two applications for centralized management of multiple SecuBox devices:

1. **secubox-console** - CLI-focused management tool (OpenWrt native)
2. **secubox-frontend** - Modern TUI dashboard with Textual (Linux/PC)

## Quick Install

### On SecuBox (OpenWrt)
```bash
opkg install secubox-console
```

### On Any Linux PC
```bash
pip install textual paramiko httpx rich
python3 secubox_frontend.py
```

### One-Line Installer
```bash
curl -sL https://feed.maegia.tv/install-console.sh | bash
```

---

## SecuBox CLI Tools Lexical

Complete reference of all `secubox-*` command-line tools.

### Core System Tools

#### secubox-core
Primary SecuBox control center CLI.
```bash
secubox-core status      # Deployment status and service health
secubox-core info        # System and SecuBox information
secubox-core config      # Manage configuration settings
secubox-core services    # List installed services
secubox-core version     # Version information
```

#### secubox-swiss
Multi-purpose Swiss Army knife utility.
```bash
secubox-swiss            # Interactive menu
secubox-swiss mesh       # Mesh operations
secubox-swiss recover    # Recovery tools
secubox-swiss console    # Remote console
secubox-swiss mitm       # MITM proxy logs
```

#### secubox-state
System state management and persistence.
```bash
secubox-state get <key>       # Query state
secubox-state set <key> <val> # Update state
secubox-state list            # List all state
```

#### secubox-component
Component lifecycle management.
```bash
secubox-component list        # List components
secubox-component status      # Component status
secubox-component update      # Update components
```

---

### Recovery & Backup

#### secubox-recover
Full backup/restore system with profiles and snapshots.
```bash
secubox-recover snapshot [name]     # Create snapshot
secubox-recover list                # List snapshots
secubox-recover restore <name>      # Restore snapshot
secubox-recover profile save <name> # Save profile
secubox-recover profile apply <name># Apply profile
secubox-recover apps sync           # Sync app configs
secubox-recover reborn              # Generate reborn script
```

#### secubox-recovery
Configuration backup and rollback.
```bash
secubox-recovery snapshot [name]    # Create config snapshot
secubox-recovery list [--json]      # List snapshots
secubox-recovery restore <name>     # Restore from snapshot
secubox-recovery rollback           # Rollback to latest
secubox-recovery enter              # Interactive recovery mode
```

#### secubox-restore
Self-recovery bootstrap from Gitea.
```bash
secubox-restore --interactive
secubox-restore <server> <owner> <repo> [token]
secubox-restore --branch dev --include-network
```

---

### Mesh & P2P Networking

#### secubox-mesh
P2P mesh networking configuration.
```bash
secubox-mesh status      # Mesh status
secubox-mesh peers       # List peers
secubox-mesh sync        # Sync catalogs
secubox-mesh discover    # Discover peers
```

#### secubox-p2p
P2P Hub Manager for peer discovery and federation.
```bash
secubox-p2p daemon              # Run discovery daemon
secubox-p2p discover [timeout]  # mDNS peer discovery
secubox-p2p peers               # List known peers
secubox-p2p add-peer <ip> [name]# Add peer manually
secubox-p2p remove-peer <id>    # Remove peer
secubox-p2p services            # List local services
secubox-p2p shared-services     # Aggregate from peers
secubox-p2p sync                # Sync service catalog
secubox-p2p broadcast <cmd>     # Execute on all peers
secubox-p2p settings            # Show P2P config
```

#### secubox-sync-registry
Service registry synchronization across mesh.
```bash
secubox-sync-registry sync      # Sync with peers
secubox-sync-registry status    # Sync status
```

#### secubox-catalog-sync
Application catalog synchronization.
```bash
secubox-catalog-sync update     # Sync catalog
secubox-catalog-sync list       # List catalog
```

---

### Service Registry & Exposure

#### secubox-registry
Unified service management with HAProxy/Tor integration.
```bash
secubox-registry list                  # List published services
secubox-registry show <service>        # Service details
secubox-registry publish <svc> --domain example.com --tor
secubox-registry unpublish <service>   # Remove from registry
secubox-registry landing               # Landing page status
secubox-registry categories            # List categories
```

#### secubox-landing-gen
Multi-theme landing page generator.
```bash
secubox-landing-gen                    # Generate with default theme
secubox-landing-gen --theme cyberpunk  # Neon synthwave
secubox-landing-gen --theme terminal   # Green terminal
secubox-landing-gen --theme minimal    # Clean flat design
secubox-landing-gen --theme light      # Bright professional
```

#### secubox-exposure
Port management, Tor hidden services, HAProxy backends.
```bash
secubox-exposure scan               # Discover listening ports
secubox-exposure conflicts          # Identify port conflicts
secubox-exposure fix-port <svc>     # Auto-assign free port
secubox-exposure status             # Exposure status
secubox-exposure tor add <svc>      # Add Tor hidden service
secubox-exposure tor list           # List .onion addresses
secubox-exposure ssl add <svc> <dom># Add HAProxy SSL backend
```

#### secubox-wan-access
External WAN access configuration.
```bash
secubox-wan-access enable       # Enable remote access
secubox-wan-access disable      # Disable remote access
secubox-wan-access status       # Current status
```

---

### Application Management

#### secubox-app
Apps CLI for plugin manifests and installations.
```bash
secubox-app list              # Show all plugins
secubox-app show <plugin>     # Plugin manifest details
secubox-app install <plugin>  # Install with dependencies
secubox-app remove <plugin>   # Uninstall plugin
secubox-app status <plugin>   # Plugin status
secubox-app update <plugin>   # Update to latest
secubox-app validate          # Validate all manifests
```

#### secubox-appstore
Application package discovery and management.
```bash
secubox-appstore list         # Available applications
secubox-appstore search <q>   # Search apps
secubox-appstore install <app># Install application
secubox-appstore info <app>   # App details
```

#### secubox-skill
Skills/Plugins management system.
```bash
secubox-skill list            # List skills
secubox-skill enable <skill>  # Enable skill
secubox-skill disable <skill> # Disable skill
secubox-skill install <skill> # Install skill
```

#### secubox-profile
User and role profile management.
```bash
secubox-profile list          # List profiles
secubox-profile create <name> # Create profile
secubox-profile apply <name>  # Apply profile
secubox-profile export <name> # Export profile
```

---

### Package Feed Management

#### secubox-feed
Local and remote package feed manager.
```bash
secubox-feed update           # Regenerate Packages index
secubox-feed sync             # Sync to opkg-lists
secubox-feed fetch <url>      # Download IPK from URL
secubox-feed fetch-release <p># Fetch from GitHub/Gitea
secubox-feed list             # List packages in feed
secubox-feed info <pkg>       # Package metadata
secubox-feed install <pkg>    # Install from feed
secubox-feed install all      # Install all packages
secubox-feed clean            # Remove old versions
secubox-feed serve [port]     # Show feed URL config
```

#### secubox-feed-health
Feed health monitoring for HAProxy.
```bash
secubox-feed-health           # JSON health status
secubox-feed-health simple    # Single word status
secubox-feed-health nagios    # Nagios-compatible format
```

#### secubox-feed-manager
Package feed management and distribution.
```bash
secubox-feed-manager create   # Create feed
secubox-feed-manager publish  # Publish packages
secubox-feed-manager sync     # Sync with remote
```

---

### Diagnostics & Monitoring

#### secubox-diagnostics
Comprehensive system diagnostics.
```bash
secubox-diagnostics health       # Health checks
secubox-diagnostics report       # Diagnostic report
secubox-diagnostics logs         # Collect logs
secubox-diagnostics performance  # Resource usage
secubox-diagnostics network      # Network diagnostics
```

#### secubox-log
Central log aggregation tool.
```bash
secubox-log --message "Event occurred"
secubox-log --tag security --message "Alert"
secubox-log --payload '{"key":"value"}'
secubox-log --snapshot           # System diagnostic snapshot
secubox-log --tail 50            # Last 50 lines
```

#### secubox-stats
Quick security stats overview.
```bash
secubox-stats                    # JSON security statistics
```

#### secubox-verify
Configuration and package integrity verification.
```bash
secubox-verify config            # Verify configs
secubox-verify packages          # Check signatures
secubox-verify system            # System consistency
```

---

### Specialized Tools

#### secubox-webapp-setup
Dashboard configuration utility.
```bash
secubox-webapp-setup status      # Dashboard config
secubox-webapp-setup enable      # Enable CORS/ubus
secubox-webapp-setup disable     # Disable access
secubox-webapp-setup check       # Verify dependencies
```

#### secubox-netifyd-configure
Netifyd configuration helper.
```bash
secubox-netifyd-configure        # Interactive setup
```

#### secubox-mitm-logs
MITM proxy analytics viewer.
```bash
secubox-mitm-logs                # View analytics
secubox-mitm-logs --tail 100     # Last 100 entries
secubox-mitm-logs --country      # By country
secubox-mitm-logs --scans        # Scan attempts
```

#### secubox-feedback
Feedback collection and telemetry.
```bash
secubox-feedback send "message"  # Send feedback
secubox-feedback status          # Telemetry status
```

---

## Frontend TUI Application

### Features
- Multi-device dashboard with real-time status
- Device discovery (network scan, mDNS, mesh API)
- SSH-based remote command execution
- Backup orchestration across devices
- Tabbed interface: Dashboard, Alerts, Mesh, Settings
- Graceful degradation: Textual -> Rich -> Simple CLI

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Refresh status |
| `s` | Sync all devices |
| `d` | Run discovery |
| `b` | Backup selected |
| `Tab` | Switch tabs |

### Configuration
```
~/.secubox-console/
├── devices.json      # Saved devices
├── plugins/          # Custom plugins
├── cache/            # Cached data
└── console.log       # Log file
```

### devices.json
```json
{
  "devices": {
    "main-router": {
      "name": "main-router",
      "host": "192.168.255.1",
      "port": 22,
      "user": "root",
      "node_id": "1b61036323",
      "mesh_enabled": true
    }
  }
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SecuBox Console/Frontend                  │
├─────────────────────────────────────────────────────────────┤
│  Core Commands   │  Plugin System  │  SSH Manager  │  TUI   │
├──────────────────┼─────────────────┼───────────────┼────────┤
│  Device Store    │  Mesh Client    │  Discovery    │ Textual│
└─────────────────────────────────────────────────────────────┘
         │                  │                 │
         ▼                  ▼                 ▼
   ┌──────────┐       ┌──────────┐      ┌──────────┐
   │ SecuBox  │  ...  │ SecuBox  │ ...  │ SecuBox  │
   │  Node 1  │       │  Node 2  │      │  Node N  │
   └──────────┘       └──────────┘      └──────────┘
```

### Key Infrastructure
- **Configuration**: UCI-based (`/etc/config/secubox-*`)
- **Communication**: UBUS JSON-RPC
- **Web Server**: uhttpd + LuCI
- **Exposure**: HAProxy (domains, SSL), Tor (.onion)
- **Packages**: opkg with custom feed
- **Backup**: Git-based via Gitea
- **Mesh**: P2P discovery, sync, federation
- **JSON Parsing**: `jsonfilter` (not jq)

### Storage Locations
- UCI configs: `/etc/config/`
- Backups: `/overlay/secubox-backups/`
- Package feed: `/www/secubox-feed/`
- P2P state: `/tmp/secubox-p2p-*.json`
- Logs: `/var/log/secubox.log`

---

## Plugin Development

Create plugins in `~/.secubox-console/plugins/`:

```python
# my_plugin.py
PLUGIN_INFO = {
    "name": "my-plugin",
    "version": "1.0.0",
    "description": "My custom plugin",
    "author": "Your Name",
    "commands": ["mycommand"]
}

def register_commands(console):
    console.register_command("mycommand", cmd_mycommand, "Description")

def cmd_mycommand(args):
    print("Hello from plugin!")
```

---

## Requirements

- Python 3.8+
- `textual>=0.40.0` - Modern TUI framework
- `paramiko>=3.0.0` - SSH connections
- `httpx>=0.25.0` - HTTP/API calls
- `rich>=13.0.0` - Rich console (fallback)

---

## License

MIT License - CyberMind 2026
