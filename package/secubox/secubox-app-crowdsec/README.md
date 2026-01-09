# SecuBox App - CrowdSec

## Version
- **Package**: secubox-app-crowdsec
- **CrowdSec Core**: v1.7.4
- **Release**: 3
- **Last Updated**: January 2025

## Description
CrowdSec is an open-source, lightweight security engine that detects and responds to malicious behaviors. This SecuBox package provides CrowdSec for OpenWrt routers with automatic log acquisition configuration.

## Key Features (v1.7.4)
- WAF capability with DropRequest helper for request blocking
- Refactored syslog acquisition using RestartableStreamer
- Optional pure-go SQLite driver for better compatibility
- Enhanced logging configuration with syslog media support
- Configurable usage metrics export (api.server.disable_usage_metrics_export)
- Fixed LAPI metrics cardinality issues with Prometheus
- Data race prevention in Docker acquisition
- Database query optimization for decision streams
- **Automatic OpenWrt log acquisition configuration**
- **UCI-based acquisition management**

## Package Contents
- **Makefile**: OpenWrt package definition for CrowdSec v1.7.4
- **files/**: Configuration and init scripts
  - `crowdsec.initd`: Init script for service management
  - `crowdsec.config`: UCI configuration (with acquisition settings)
  - `crowdsec.defaults`: Default configuration with auto-detection
  - `acquis.d/`: Acquisition configuration templates
    - `openwrt-syslog.yaml`: System syslog logs
    - `openwrt-dropbear.yaml`: SSH/Dropbear logs
    - `openwrt-firewall.yaml`: iptables/nftables firewall logs
    - `openwrt-uhttpd.yaml`: uHTTPd web server logs

## Installation
```bash
# From SecuBox build environment
cd /home/reepost/CyberMindStudio/_files/secubox-openwrt
make package/secubox/secubox-app-crowdsec/compile V=s

# Install on router
opkg install crowdsec_1.7.4-3_*.ipk
```

## Configuration

### UCI Configuration
CrowdSec uses UCI for configuration in `/etc/config/crowdsec`:

```bash
# View current configuration
uci show crowdsec

# Main settings
uci set crowdsec.crowdsec.data_dir='/srv/crowdsec/data'
uci set crowdsec.crowdsec.db_path='/srv/crowdsec/data/crowdsec.db'

# Acquisition settings
uci set crowdsec.acquisition.syslog_enabled='1'
uci set crowdsec.acquisition.firewall_enabled='1'
uci set crowdsec.acquisition.ssh_enabled='1'
uci set crowdsec.acquisition.http_enabled='0'
uci set crowdsec.acquisition.syslog_path='/var/log/messages'

# Hub settings
uci set crowdsec.hub.auto_install='1'
uci set crowdsec.hub.collections='crowdsecurity/linux crowdsecurity/iptables'
uci set crowdsec.hub.update_interval='7'

uci commit crowdsec
```

### File Locations
- Main config: `/etc/crowdsec/config.yaml`
- Acquisition directory: `/etc/crowdsec/acquis.d/`
- Legacy acquisition: `/etc/crowdsec/acquis.yaml`
- Profiles: `/etc/crowdsec/profiles.yaml`
- Local API: `/etc/crowdsec/local_api_credentials.yaml`
- Data directory: `/srv/crowdsec/data/`

## Log Acquisition Configuration

### Automatic Detection
On first boot, the defaults script automatically:
1. Detects OpenWrt log file configuration
2. Identifies installed services (Dropbear, firewall)
3. Generates appropriate acquisition configs
4. Installs recommended Hub collections

### Supported Log Sources
| Log Source | Default | Collection Required |
|------------|---------|---------------------|
| System Syslog | Enabled | crowdsecurity/linux |
| SSH/Dropbear | Enabled | crowdsecurity/linux |
| Firewall (iptables/nftables) | Enabled | crowdsecurity/iptables |
| HTTP (uHTTPd/nginx) | Disabled | crowdsecurity/http-cve |

### Custom Acquisition
Add custom acquisition configs to `/etc/crowdsec/acquis.d/`:

```yaml
# /etc/crowdsec/acquis.d/custom.yaml
filenames:
  - /var/log/custom-app/*.log
labels:
  type: syslog
```

### Syslog Service Mode
To run CrowdSec as a syslog server (receive logs from other devices):

```bash
uci set crowdsec.acquisition.syslog_listen_addr='0.0.0.0'
uci set crowdsec.acquisition.syslog_listen_port='514'
uci commit crowdsec
/etc/init.d/crowdsec restart
```

## Service Management
```bash
# Start CrowdSec
/etc/init.d/crowdsec start

# Stop CrowdSec
/etc/init.d/crowdsec stop

# Restart CrowdSec
/etc/init.d/crowdsec restart

# Check status
/etc/init.d/crowdsec status
```

## CLI Usage
CrowdSec CLI is available via `cscli`:
```bash
# Check version
cscli version

# Check acquisition status
cscli metrics show acquisition

# List decisions
cscli decisions list

# View alerts
cscli alerts list

# Manage collections
cscli collections list
cscli collections install crowdsecurity/nginx

# Manage Hub
cscli hub update
cscli hub upgrade

# Manage bouncers
cscli bouncers list
cscli bouncers add firewall-bouncer
```

## Hub Collections for OpenWrt

### Recommended Collections
```bash
# Core Linux detection (SSH brute-force, etc.)
cscli collections install crowdsecurity/linux

# Firewall log analysis (port scan detection)
cscli collections install crowdsecurity/iptables

# Syslog parsing
cscli parsers install crowdsecurity/syslog-logs

# Whitelists for reducing false positives
cscli parsers install crowdsecurity/whitelists
```

### Optional Collections
```bash
# HTTP attack detection
cscli collections install crowdsecurity/http-cve

# nginx logs
cscli collections install crowdsecurity/nginx

# Smb/Samba
cscli collections install crowdsecurity/smb
```

## Integration with SecuBox
This package integrates with:
- **luci-app-crowdsec-dashboard** v0.5.0+
- **secubox-app-crowdsec-bouncer** - Firewall bouncer
- **SecuBox Theme System**
- **SecuBox Logging** (`secubox-log`)

## Dependencies
- Go compiler (build-time)
- SQLite3
- OpenWrt base system

## References
- Upstream: https://github.com/crowdsecurity/crowdsec
- Documentation: https://docs.crowdsec.net/
- Hub: https://hub.crowdsec.net/
- Acquisition Docs: https://docs.crowdsec.net/docs/next/log_processor/data_sources/intro/
- SecuBox Project: https://cybermind.fr

## Changelog

### v1.7.4-3 (2025-01)
- Added automatic log acquisition configuration
- Added UCI-based acquisition management
- Added acquis.d directory with OpenWrt-specific templates
- Improved Hub collection auto-installation
- Added acquisition for syslog, SSH/Dropbear, firewall, HTTP
- Enhanced defaults script with detection logic

### v1.7.4-2 (2024-12)
- Updated from v1.6.2 to v1.7.4
- Added WAF/AppSec support
- Improved syslog acquisition
- Enhanced metrics export configuration
- Fixed Prometheus cardinality issues

### v1.6.2-1 (Previous)
- Initial SecuBox integration
- Basic OpenWrt compatibility patches

## License
MIT License

## Maintainer
CyberMind.fr - Gandalf <gandalf@gk2.net>
