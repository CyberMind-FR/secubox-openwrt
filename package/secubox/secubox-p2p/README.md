# SecuBox P2P Mesh Network

Distributed peer-to-peer mesh networking for SecuBox appliances with integrated backup, recovery, and federation capabilities.

## Overview

SecuBox P2P enables multiple SecuBox appliances to form a distributed mesh network for:

- **Service Discovery**: Automatically discover and connect to peer SecuBox nodes
- **Configuration Sync**: Share and synchronize configurations across the mesh
- **Distributed Backup**: Version-controlled backups via Gitea integration
- **Self-Recovery**: Bootstrap new appliances from existing backups
- **MaaS Federation**: Mesh-as-a-Service for distributed security infrastructure

## Architecture

```
                    ┌─────────────────┐
                    │   Gitea Server  │
                    │  (Version Ctrl) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ SecuBox │◄────────►│ SecuBox │◄────────►│ SecuBox │
   │  Node A │          │  Node B │          │  Node C │
   │ (Leader)│          │ (Peer)  │          │ (Peer)  │
   └─────────┘          └─────────┘          └─────────┘
        │                    │                    │
   WireGuard            WireGuard            WireGuard
    Tunnel               Tunnel               Tunnel
```

## Features

### Mesh Networking

| Feature | Description |
|---------|-------------|
| **Peer Discovery** | mDNS/DNS-SD based automatic peer discovery |
| **WireGuard VPN** | Encrypted mesh tunnels between nodes |
| **HAProxy LB** | Load balancing across mesh services |
| **DNS Integration** | Mesh-aware DNS resolution |

### Backup & Recovery

| Feature | Description |
|---------|-------------|
| **Gitea Integration** | Git-based versioned backups |
| **15 Component Types** | Comprehensive appliance backup |
| **Bootstrap Script** | One-command recovery for new boxes |
| **Historical Tracking** | Full audit trail of changes |

### Topology Modes

- **Full Mesh**: Every node connects to every other node
- **Star**: Central hub with spoke connections
- **Ring**: Circular topology with neighbor connections
- **Tree**: Hierarchical parent-child structure

## Installation

```bash
opkg update
opkg install secubox-p2p luci-app-secubox-p2p
```

## Configuration

### UCI Configuration

```bash
# /etc/config/secubox-p2p

config p2p 'settings'
    option enabled '1'
    option node_name 'secubox-node'
    option discovery_enabled '1'
    option sync_interval '300'

config gitea 'gitea'
    option enabled '1'
    option server_url 'http://localhost:3000'
    option repo_owner 'admin'
    option repo_name 'secubox-backup'
    option access_token 'your-token-here'
    option auto_backup '1'
    option backup_interval '3600'
```

### Manual Configuration

```bash
# Enable P2P mesh
uci set secubox-p2p.settings.enabled='1'
uci set secubox-p2p.settings.node_name='my-secubox'
uci commit secubox-p2p

# Configure Gitea backup
uci set secubox-p2p.gitea.enabled='1'
uci set secubox-p2p.gitea.server_url='http://gitea.local:3000'
uci set secubox-p2p.gitea.repo_owner='admin'
uci set secubox-p2p.gitea.repo_name='secubox-backup'
uci set secubox-p2p.gitea.access_token='your-token'
uci commit secubox-p2p

# Restart service
/etc/init.d/secubox-p2p restart
```

## Usage

### Command Line

```bash
# Peer management
secubox-p2p peers              # List connected peers
secubox-p2p discover           # Discover new peers
secubox-p2p add-peer <addr>    # Add peer manually

# Service management
secubox-p2p services           # List local services
secubox-p2p shared-services    # List mesh-shared services

# Sync operations
secubox-p2p sync               # Sync with all peers
```

### RPCD API

All functions are available via ubus:

```bash
# Peer operations
ubus call luci.secubox-p2p get_peers
ubus call luci.secubox-p2p discover '{"timeout":5}'
ubus call luci.secubox-p2p add_peer '{"address":"10.0.0.2","name":"peer1"}'

# Gitea backup
ubus call luci.secubox-p2p push_gitea_backup '{"message":"Daily backup"}'
ubus call luci.secubox-p2p pull_gitea_backup '{"commit_sha":"abc123"}'
ubus call luci.secubox-p2p list_gitea_repos
ubus call luci.secubox-p2p get_gitea_commits '{"limit":10}'

# Local backup
ubus call luci.secubox-p2p create_local_backup '{"name":"pre-upgrade"}'
ubus call luci.secubox-p2p list_local_backups
ubus call luci.secubox-p2p restore_local_backup '{"backup_id":"20260130-120000"}'
```

## Backup Components

The backup system captures 15 component categories:

| Component | Path | Description |
|-----------|------|-------------|
| `configs` | `/etc/config/` | UCI configuration files |
| `profiles` | `/usr/share/secubox/profiles/` | Deployment profiles |
| `presets` | `/etc/secubox/presets/` | Settings presets |
| `manifests` | `/etc/secubox/manifests/` | App manifests |
| `scripts` | `/usr/share/secubox/scripts/` | Custom scripts |
| `macros` | `/etc/secubox/macros/` | Automation macros |
| `workflows` | `/etc/secubox/workflows/` | CI/CD workflows |
| `packages` | - | Installed package list |
| `services` | - | Service states |
| `cron` | `/etc/crontabs/` | Scheduled tasks |
| `ssh` | `/etc/dropbear/` | SSH keys & config |
| `certificates` | `/etc/acme/`, `/etc/ssl/` | TLS certificates |
| `haproxy` | `/etc/haproxy/` | Load balancer config |
| `dns` | `/etc/dnsmasq.d/` | DNS configuration |
| `device` | - | Hardware/system info |

## Self-Recovery

### Quick Bootstrap

Deploy SecuBox to a new OpenWrt box with one command:

```bash
# From the Gitea repository
wget -qO- http://gitea.local:3000/user/repo/raw/branch/main/bootstrap.sh | sh

# Or using curl
curl -sL http://gitea.local:3000/user/repo/raw/branch/main/bootstrap.sh | sh
```

### Manual Recovery

```bash
# Interactive mode
secubox-restore -i

# Direct restore
secubox-restore http://gitea.local:3000 admin secubox-backup [token]

# Restore from specific branch
secubox-restore -b develop http://gitea.local:3000 admin secubox-backup
```

### Recovery Options

```
secubox-restore [options] <server-url> <repo-owner> <repo-name> [token]

Options:
  -i, --interactive      Interactive mode with prompts
  -b, --branch <name>    Git branch to restore from (default: main)
  --include-network      Also restore network/wireless/firewall configs
  -h, --help             Show help message
```

## LuCI Web Interface

Access the P2P Hub at: **SecuBox > P2P Mesh > Hub**

### Dashboard Features

- **Globe Visualization**: Interactive mesh topology view
- **Status Indicators**: System, DNS, WireGuard, Load Balancer status
- **Peer Counters**: Connected peers, online nodes, shared services
- **Quick Actions**: Discover, Sync All, Add Peer, Self Peer

### Gitea Integration Tab

- **Repository Setup**: Configure Gitea server and credentials
- **Auto-Backup**: Enable scheduled backups
- **Commit History**: View backup history with restore options
- **Token Generation**: Create access tokens with proper scopes

## Security

### Authentication

- Gitea tokens require specific scopes:
  - `write:repository` - Push backups
  - `read:user` - Verify identity
  - `write:user` - Create tokens (for auto-setup)

### Encryption

- All mesh traffic encrypted via WireGuard
- Gitea communication over HTTPS (recommended)
- SSH keys backed up securely

### Access Control

- RPCD ACL controls API access
- Per-user Gitea permissions
- Network-level firewall rules

## Troubleshooting

### Common Issues

**Peer discovery not working:**
```bash
# Check mDNS/avahi
/etc/init.d/avahi-daemon status

# Verify firewall allows mDNS (port 5353/udp)
uci show firewall | grep mdns
```

**Gitea backup fails:**
```bash
# Test API connectivity
curl -s http://gitea:3000/api/v1/user \
  -H "Authorization: token YOUR_TOKEN"

# Check token scopes
ubus call luci.secubox-p2p get_gitea_config
```

**WireGuard tunnel not establishing:**
```bash
# Check WireGuard status
wg show

# Verify peer keys
uci show wireguard
```

### Logs

```bash
# P2P service logs
logread | grep secubox-p2p

# RPCD logs
logread | grep rpcd
```

## API Reference

### Peer Management

| Method | Parameters | Description |
|--------|------------|-------------|
| `get_peers` | - | List all peers |
| `add_peer` | `address`, `name` | Add new peer |
| `remove_peer` | `peer_id` | Remove peer |
| `discover` | `timeout` | Discover peers |

### Gitea Operations

| Method | Parameters | Description |
|--------|------------|-------------|
| `get_gitea_config` | - | Get Gitea settings |
| `set_gitea_config` | `config` | Update settings |
| `create_gitea_repo` | `name`, `description`, `private` | Create repository |
| `list_gitea_repos` | - | List repositories |
| `get_gitea_commits` | `limit` | Get commit history |
| `push_gitea_backup` | `message`, `components` | Push backup |
| `pull_gitea_backup` | `commit_sha` | Restore from commit |

### Local Backup

| Method | Parameters | Description |
|--------|------------|-------------|
| `create_local_backup` | `name`, `components` | Create backup |
| `list_local_backups` | - | List backups |
| `restore_local_backup` | `backup_id` | Restore backup |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on OpenWrt device
5. Submit a pull request

## License

GPL-2.0 - See LICENSE file for details.

## Related Projects

- [SecuBox Core](../secubox-core/) - Core SecuBox functionality
- [LuCI App SecuBox](../luci-app-secubox/) - Main dashboard
- [LuCI App SecuBox P2P](../luci-app-secubox-p2p/) - P2P web interface
- [SecuBox Gitea](../luci-app-gitea/) - Gitea container management
