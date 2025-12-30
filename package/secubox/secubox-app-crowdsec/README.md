# SecuBox App - CrowdSec

## Version
- **Package**: secubox-app-crowdsec
- **CrowdSec Core**: v1.7.4
- **Release**: 1
- **Last Updated**: December 30, 2024

## Description
CrowdSec is an open-source, lightweight security engine that detects and responds to malicious behaviors. This SecuBox package provides CrowdSec for OpenWrt routers.

## Key Features (v1.7.4)
- ✅ WAF capability with DropRequest helper for request blocking
- ✅ Refactored syslog acquisition using RestartableStreamer
- ✅ Optional pure-go SQLite driver for better compatibility
- ✅ Enhanced logging configuration with syslog media support
- ✅ Configurable usage metrics export (api.server.disable_usage_metrics_export)
- ✅ Fixed LAPI metrics cardinality issues with Prometheus
- ✅ Data race prevention in Docker acquisition
- ✅ Database query optimization for decision streams

## Package Contents
- **Makefile**: OpenWrt package definition for CrowdSec v1.7.4
- **files/**: Configuration and init scripts
  - `crowdsec.initd`: Init script for service management
  - `crowdsec.config`: UCI configuration
  - `crowdsec.defaults`: Default configuration (uci-defaults)
- **patches/**: Patches for OpenWrt compatibility
  - `001-fix_config_data_dir.patch`: Fix data directory path for OpenWrt

## Installation
```bash
# From SecuBox build environment
cd /home/reepost/CyberMindStudio/_files/secubox-openwrt
make package/secubox/secubox-app-crowdsec/compile V=s

# Install on router
opkg install crowdsec_1.7.4-1_*.ipk
```

## Configuration
CrowdSec configuration files are located at:
- Main config: `/etc/crowdsec/config.yaml`
- Acquisition: `/etc/crowdsec/acquis.yaml`
- Profiles: `/etc/crowdsec/profiles.yaml`
- Local API: `/etc/crowdsec/local_api_credentials.yaml`

Data directory: `/srv/crowdsec/data/`

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

# List decisions
cscli decisions list

# View alerts
cscli alerts list

# Manage collections
cscli collections list
cscli collections install crowdsecurity/nginx

# Manage bouncers
cscli bouncers list
cscli bouncers add firewall-bouncer
```

## Integration with SecuBox
This package integrates with:
- **luci-app-crowdsec-dashboard** v0.5.0+
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
- SecuBox Project: https://cybermind.fr

## Changelog

### v1.7.4-1 (2024-12-30)
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
