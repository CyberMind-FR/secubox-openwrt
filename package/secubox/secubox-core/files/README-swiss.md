# SecuBox Swiss

**Swiss Army Knife - Unified Management & Recovery Tool**

A single entry point for all SecuBox management, recovery, mesh networking, and security monitoring. Combines multiple tools into one cohesive interface.

```
   _____ _____ _____ _   _ ____   _____  __
  / ____| ____/ ____| | | |  _ \ / _ \ \/ /
 | (___ |  _|| |    | | | | |_) | | | \  /
  \___ \| |__| |    | |_| |  _ <| |_| /  \
  ____) |____| |____| |_| | |_) \___/_/\_\
 |_____/______\_____|_____|____/
                                    SWISS
```

## Features

- **Unified Interface** - One command for everything
- **Quick Actions** - Common tasks with simple commands
- **Tool Integration** - Seamless access to mesh, recover, console, mitm
- **Interactive Menu** - TUI for easy navigation
- **Self-Enhancing** - Auto-update from mesh network
- **KISS Philosophy** - Simple, modular, effective

## Quick Start

```bash
# Interactive menu
secubox-swiss

# Quick status
secubox-swiss status

# Create backup
secubox-swiss backup

# Generate self-revival script
secubox-swiss reborn
```

## Commands

### Quick Actions

| Command | Description |
|---------|-------------|
| `status` | System overview (mesh, recovery, services) |
| `backup [name]` | Create full system snapshot |
| `reborn [file]` | Generate self-contained recovery script |
| `sync` | Sync mesh network and catalogs |
| `health` | Full health check (disk, memory, network, security) |
| `logs [type]` | View logs (all, mitm, mesh, security) |
| `update` | Self-update from mesh peers |

### Tool Access

| Command | Tool | Description |
|---------|------|-------------|
| `mesh <cmd>` | secubox-mesh | P2P mesh management |
| `recover <cmd>` | secubox-recover | Recovery system |
| `console <cmd>` | secubox-console | Remote management (Python) |
| `mitm <cmd>` | secubox-mitm-logs | Security/MITM logs |

## Usage Examples

### System Status
```bash
secubox-swiss status
```
```
=== SecuBox Status ===

System:
  Hostname: secubox-main
  Version:  0.17.1
  Uptime:   5 days, 3:42

Mesh:
  Node ID:  1b61036323794898
  Peers:    3
  Blocks:   47

Recovery:
  Snapshots: 5
  Profiles:  2

Key Services:
  haproxy: running
  crowdsec: running
  mitmproxy: stopped
```

### Create Backup
```bash
secubox-swiss backup my-backup-name
```

### Generate Reborn Script
```bash
secubox-swiss reborn /tmp/my-reborn.sh

# Output: Self-contained 5MB script with embedded snapshot
# Copy to any machine to restore complete SecuBox
```

### Health Check
```bash
secubox-swiss health
```
```
=== Health Check ===

Disk Usage:
  /     45%  2.1G/4.7G
  /srv  23%  1.2G/5.0G

Memory:
  Total: 2048MB  Used: 512MB  Free: 1536MB

Network:
  WAN IP: 185.220.101.24
  LAN IP: 192.168.255.1

Security:
  Scan attempts: 142
  Auth attempts: 37
```

### View Security Logs
```bash
secubox-swiss logs security
```

### Access Sub-Tools
```bash
# Mesh commands
secubox-swiss mesh init
secubox-swiss mesh peer-add 192.168.1.100
secubox-swiss mesh sync

# Recovery commands
secubox-swiss recover snapshot
secubox-swiss recover profile-save production
secubox-swiss recover rollback

# MITM logs
secubox-swiss mitm stats
secubox-swiss mitm scan
```

## Interactive Menu

Run without arguments for interactive TUI:

```
╔══════════════════════════════════════════════════════════════════╗
║           SecuBox Swiss Army Knife v1.0.0                        ║
╚══════════════════════════════════════════════════════════════════╝

Quick Actions:
  1) Status       - System overview
  2) Backup       - Create snapshot
  3) Reborn       - Generate recovery script
  4) Sync         - Sync mesh & catalog
  5) Health       - Health check
  6) Logs         - View logs
  7) Update       - Self-update

Tools:
  m) Mesh         - P2P mesh management
  r) Recover      - Recovery system
  c) Console      - Remote management (Python)
  s) Security     - MITM/Security logs

  q) Quit

Choice: _
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    secubox-swiss                             │
│              Unified Entry Point                             │
├─────────────────────────────────────────────────────────────┤
│  Quick Actions  │  Tool Dispatch  │  Self-Enhancement       │
├─────────────────┼─────────────────┼─────────────────────────┤
│  status         │  → secubox-mesh │  Auto-update from mesh  │
│  backup         │  → secubox-recover                        │
│  reborn         │  → secubox-console                        │
│  sync           │  → secubox-mitm-logs                      │
│  health         │                                           │
│  logs           │                                           │
└─────────────────────────────────────────────────────────────┘
```

## Integrated Tools

### secubox-mesh
P2P distributed recovery infrastructure with blockchain-style catalog.
```bash
secubox-swiss mesh init          # Initialize node
secubox-swiss mesh peer-add IP   # Add peer
secubox-swiss mesh sync          # Sync with peers
secubox-swiss mesh discover      # Network discovery
```

### secubox-recover
Full backup, restore, profiles, and reborn script generation.
```bash
secubox-swiss recover snapshot           # Create snapshot
secubox-swiss recover restore HASH       # Restore from snapshot
secubox-swiss recover profile-save NAME  # Save profile
secubox-swiss recover profile-apply NAME # Apply profile
secubox-swiss recover reborn             # Generate reborn script
```

### secubox-console
Python remote management for multi-device control.
```bash
secubox-swiss console discover   # Find devices
secubox-swiss console status     # All devices status
secubox-swiss console dashboard  # Live TUI
```

### secubox-mitm-logs
Security analytics from MITM proxy.
```bash
secubox-swiss mitm tail      # Recent access
secubox-swiss mitm stats     # Statistics
secubox-swiss mitm scan      # Scan attempts
secubox-swiss mitm country   # By country
```

## Self-Enhancement

SecuBox Swiss can update itself from mesh peers:

```bash
secubox-swiss update
```

The tool checks connected mesh peers for newer versions, verifies hash integrity, and auto-installs updates.

## Files

| Path | Description |
|------|-------------|
| `/usr/sbin/secubox-swiss` | Main script |
| `/usr/sbin/secubox-mesh` | Mesh tool |
| `/usr/sbin/secubox-recover` | Recovery tool |
| `/usr/lib/secubox/p2p-mesh.sh` | Mesh library |
| `/srv/secubox/mesh/` | Mesh data (blocks, chain, peers) |
| `/srv/secubox/recover/` | Recovery data (archives, profiles) |

## License

MIT License - CyberMind 2026
