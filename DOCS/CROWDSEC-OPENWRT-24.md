# CrowdSec Integration for OpenWrt 24.10+ (SecuBox)

## Overview

This documentation covers the complete CrowdSec security solution integration for OpenWrt 24.10+ with fw4/nftables support. The integration consists of two packages:

1. **secubox-crowdsec-setup**: Automated installation script
2. **luci-app-secubox-crowdsec**: LuCI web interface dashboard

## Requirements

### Hardware
- Minimum 256MB RAM
- Minimum 50MB available flash storage
- ARM64, ARMv7, x86_64, or MIPS architecture

### Software
- OpenWrt 24.10 or later
- fw4 with nftables (default in OpenWrt 24.10+)
- Internet connectivity for initial setup

## Quick Installation

### Method 1: Using the Setup Script

```bash
# Install dependencies
opkg update
opkg install secubox-crowdsec-setup

# Run the automated setup
secubox-crowdsec-setup --install
```

### Method 2: Manual Installation

```bash
# Update package lists
opkg update

# Install required packages
opkg install crowdsec crowdsec-firewall-bouncer syslog-ng

# Install LuCI dashboard (optional)
opkg install luci-app-secubox-crowdsec
```

## Architecture

```
                    +-----------------------+
                    |    OpenWrt System     |
                    +-----------------------+
                             |
              +--------------+--------------+
              |                             |
      +-------v-------+           +---------v---------+
      |   syslog-ng  |           |   logread -f      |
      | (UDP 5140)    |           |   (fallback)      |
      +-------+-------+           +---------+---------+
              |                             |
              +-------------+---------------+
                            |
                    +-------v-------+
                    |   CrowdSec    |
                    | (LAPI :8080)  |
                    +-------+-------+
                            |
              +-------------+-------------+
              |                           |
      +-------v-------+          +--------v--------+
      |  Local CAPI   |          |   CrowdSec      |
      |  (blocklists) |          |   Hub (parsers, |
      +---------------+          |   scenarios)    |
                                 +-----------------+
                                          |
                            +-------------v-------------+
                            | crowdsec-firewall-bouncer |
                            |    (nftables mode)        |
                            +-------------+-------------+
                                          |
                                 +--------v--------+
                                 |  nftables fw4   |
                                 |  (crowdsec/     |
                                 |   crowdsec6)    |
                                 +-----------------+
```

## Components

### 1. syslog-ng Configuration

Located at `/etc/syslog-ng/syslog-ng.conf`, this configuration:
- Captures all system logs via Unix socket
- Forwards logs to CrowdSec via UDP port 5140
- Writes local copies to `/tmp/log/` for debugging

Key sources monitored:
- System logs (`/dev/log`)
- Kernel messages (`/proc/kmsg`)
- Authentication logs (SSH, login attempts)

### 2. CrowdSec Engine

Configuration directory: `/etc/crowdsec/`

Main components:
- **config.yaml**: Main configuration file
- **acquis.d/**: Acquisition configuration files
- **parsers/**: Log parsing rules
- **scenarios/**: Attack detection scenarios
- **hub/**: Downloaded hub content

Data storage: `/srv/crowdsec/data/`

### 3. Firewall Bouncer

Configuration: `/etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml`

Creates nftables tables:
- `ip crowdsec`: IPv4 blocking
- `ip6 crowdsec6`: IPv6 blocking

### 4. LuCI Dashboard

Accessible via: **Services > CrowdSec**

Features:
- Dashboard with service status
- Active decisions (bans) management
- Security alerts viewer
- Collections management
- Settings configuration

## UCI Configuration

The UCI configuration file `/etc/config/crowdsec` contains:

```uci
config crowdsec 'crowdsec'
    option enabled '1'
    option data_dir '/srv/crowdsec/data'
    option db_path '/srv/crowdsec/data/crowdsec.db'

config acquisition 'acquisition'
    option syslog_enabled '1'
    option firewall_enabled '1'
    option ssh_enabled '1'
    option http_enabled '0'

config hub 'hub'
    option auto_install '1'
    option collections 'crowdsecurity/linux crowdsecurity/sshd crowdsecurity/iptables'
    option update_interval '7'

config bouncer 'bouncer'
    option enabled '1'
    option ipv4 '1'
    option ipv6 '1'
    option deny_action 'drop'
    option deny_log '1'
    option update_frequency '10s'
```

## Default Collections

The following collections are installed by default:

| Collection | Description |
|------------|-------------|
| `crowdsecurity/linux` | Linux system security |
| `crowdsecurity/sshd` | SSH brute-force protection |
| `crowdsecurity/iptables` | Firewall logs parsing |
| `crowdsecurity/http-cve` | HTTP CVE exploits |

## Command Reference

### Service Management

```bash
# CrowdSec service
/etc/init.d/crowdsec start|stop|restart|enable|disable

# Firewall bouncer
/etc/init.d/crowdsec-firewall-bouncer start|stop|restart|enable|disable

# Syslog-ng
/etc/init.d/syslog-ng start|stop|restart|enable|disable
```

### cscli Commands

```bash
# View status
cscli lapi status
cscli capi status

# Decision management
cscli decisions list
cscli decisions add --ip <IP> --duration 24h --reason "Manual ban"
cscli decisions delete --ip <IP>

# Alert management
cscli alerts list
cscli alerts list --since 24h

# Collection management
cscli collections list
cscli collections install crowdsecurity/nginx
cscli collections remove crowdsecurity/nginx

# Hub management
cscli hub update
cscli hub upgrade

# Bouncer management
cscli bouncers list

# Metrics
cscli metrics
```

### nftables Commands

```bash
# List CrowdSec tables
nft list tables | grep crowdsec

# Show blocked IPs (IPv4)
nft list set ip crowdsec crowdsec-blacklists

# Show blocked IPs (IPv6)
nft list set ip6 crowdsec6 crowdsec6-blacklists
```

## Troubleshooting

### CrowdSec not starting

```bash
# Check logs
logread | grep crowdsec
cat /var/log/crowdsec.log

# Verify configuration
cscli config show
```

### LAPI unavailable

```bash
# Check if CrowdSec is running
pgrep crowdsec

# Repair machine registration
cscli machines add localhost --auto --force
/etc/init.d/crowdsec restart
```

### Bouncer not blocking

```bash
# Check bouncer status
pgrep -f crowdsec-firewall-bouncer

# Verify nftables tables
nft list tables

# Check bouncer API key
cat /etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml | grep api_key
```

### syslog-ng issues

```bash
# Check if running
pgrep syslog-ng

# Test configuration
syslog-ng -s

# Check UDP listener
netstat -uln | grep 5140
```

### No alerts being generated

```bash
# Check acquisition
cscli metrics show acquisition

# Test log parsing
echo "Failed password for root from 192.168.1.100 port 22222 ssh2" | \
  cscli parsers inspect crowdsecurity/sshd-logs
```

## Uninstallation

```bash
# Using setup script
secubox-crowdsec-setup --uninstall

# Manual removal
/etc/init.d/crowdsec-firewall-bouncer stop
/etc/init.d/crowdsec stop
/etc/init.d/syslog-ng stop

opkg remove luci-app-secubox-crowdsec
opkg remove crowdsec-firewall-bouncer
opkg remove crowdsec
opkg remove syslog-ng

# Clean nftables
nft delete table ip crowdsec
nft delete table ip6 crowdsec6

# Re-enable logd
/etc/init.d/log enable
/etc/init.d/log start
```

## Security Considerations

### Whitelist Local Networks

The default configuration includes a whitelist for RFC1918 private networks:
- 10.0.0.0/8
- 172.16.0.0/12
- 192.168.0.0/16
- 127.0.0.0/8

This prevents accidental blocking of local management access.

### Bouncer API Key

The bouncer API key is automatically generated during setup and stored in:
- `/etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml`
- UCI config: `crowdsec.bouncer.api_key`

### Log Retention

Logs in `/tmp/log/` are stored in tmpfs and cleared on reboot. For persistent logging, configure syslog-ng to write to overlay storage.

## Performance Optimization

For resource-constrained devices:

1. **Reduce update frequency**:
   ```bash
   uci set crowdsec.bouncer.update_frequency='30s'
   uci commit crowdsec
   ```

2. **Disable IPv6 if not used**:
   ```bash
   uci set crowdsec.bouncer.ipv6='0'
   uci commit crowdsec
   ```

3. **Limit collections**:
   Only install collections relevant to your setup.

## Integration with SecuBox

This CrowdSec integration is part of the SecuBox security suite for OpenWrt. It works alongside other SecuBox components:

- SecuBox Firewall
- SecuBox VPN
- SecuBox DNS filtering
- SecuBox Monitoring

## License

MIT License - Copyright (C) 2025 CyberMind.fr

## Support

- GitHub Issues: https://github.com/secubox/secubox-openwrt
- Documentation: https://secubox.cybermood.eu/docs
- CrowdSec Docs: https://docs.crowdsec.net
