# SecuBox CrowdSec Firewall Bouncer

Enhanced wrapper package for CrowdSec Firewall Bouncer with automatic configuration and registration for SecuBox-powered OpenWrt routers.

## Overview

The CrowdSec Firewall Bouncer is a component that blocks malicious IP addresses detected by CrowdSec using nftables firewall rules. This package wraps the upstream `crowdsec-firewall-bouncer` with SecuBox-specific enhancements:

- **Automatic API key registration** with CrowdSec LAPI
- **Interface auto-detection** for LAN/WAN
- **Pre-configured defaults** optimized for routers
- **UCI configuration** for easy management via LuCI
- **Seamless integration** with SecuBox CrowdSec dashboard

## Features

- **nftables-based blocking**: Uses modern nftables instead of legacy iptables
- **IPv4 and IPv6 support**: Blocks threats on both protocol versions
- **Real-time updates**: Polls CrowdSec LAPI for new decisions (default: 10s)
- **Flexible filtering**: Configure INPUT and FORWARD chain filtering
- **Logging support**: Optional logging of blocked connections
- **Multiple deny actions**: drop, reject, or tarpit malicious traffic
- **Interface-based filtering**: Specify which interfaces to protect

## Requirements

- `crowdsec` - CrowdSec detection engine (must be installed and running)
- `crowdsec-firewall-bouncer` - Upstream firewall bouncer binary
- `nftables` - Modern Linux firewall
- Working CrowdSec Local API (LAPI) on port 8080

## Installation

### Via opkg

```bash
opkg update
opkg install secubox-app-crowdsec-bouncer
```

### From Source

```bash
./secubox-tools/local-build.sh build secubox-app-crowdsec-bouncer
opkg install /path/to/secubox-app-crowdsec-bouncer_*.ipk
```

## Initial Configuration

The package automatically configures itself on first install via the UCI defaults script:

1. **Merges configuration** into `/etc/config/crowdsec`
2. **Detects network interfaces** (LAN/WAN)
3. **Registers bouncer** with CrowdSec LAPI
4. **Generates API key** and stores in UCI
5. **Loads nftables modules**

After installation, you need to:

```bash
# Enable the bouncer
uci set crowdsec.bouncer.enabled='1'
uci commit crowdsec

# Start the service
/etc/init.d/crowdsec-firewall-bouncer enable
/etc/init.d/crowdsec-firewall-bouncer start
```

## Configuration

All configuration is done via UCI at `/etc/config/crowdsec` in the `bouncer` section:

```uci
config bouncer
	option enabled '1'              # Enable/disable bouncer
	option ipv4 '1'                 # Enable IPv4 filtering
	option ipv6 '1'                 # Enable IPv6 filtering
	option api_url 'http://127.0.0.1:8080/'  # CrowdSec LAPI URL
	option api_key '<generated>'    # API key (auto-generated)
	option update_frequency '10s'   # How often to poll for decisions
	option priority '4'             # nftables hook priority
	option deny_action 'drop'       # Action: drop|reject|tarpit
	option deny_log '1'             # Log blocked connections
	option log_prefix 'CrowdSec: '  # Kernel log prefix
	option log_level 'info'         # Log level
	option filter_input '1'         # Filter INPUT chain
	option filter_forward '1'       # Filter FORWARD chain
	option chain_name 'crowdsec-chain'   # IPv4 chain name
	option chain6_name 'crowdsec6-chain' # IPv6 chain name
	option retry_initial_connect '1'     # Retry if LAPI unavailable
	list interface 'br-lan'         # Interfaces to filter
	list interface 'eth1'
```

### Common Configuration Tasks

#### Change Update Frequency

```bash
uci set crowdsec.bouncer.update_frequency='30s'
uci commit crowdsec
/etc/init.d/crowdsec-firewall-bouncer restart
```

#### Add/Remove Protected Interfaces

```bash
# Add interface
uci add_list crowdsec.bouncer.interface='wlan0'

# Remove specific interface
uci del_list crowdsec.bouncer.interface='eth1'

# Commit and restart
uci commit crowdsec
/etc/init.d/crowdsec-firewall-bouncer restart
```

#### Change Deny Action

```bash
# Options: drop (silent), reject (send ICMP), tarpit (slow response)
uci set crowdsec.bouncer.deny_action='reject'
uci commit crowdsec
/etc/init.d/crowdsec-firewall-bouncer restart
```

#### Enable/Disable Logging

```bash
uci set crowdsec.bouncer.deny_log='1'  # Enable
uci set crowdsec.bouncer.deny_log='0'  # Disable
uci commit crowdsec
/etc/init.d/crowdsec-firewall-bouncer restart
```

## Manual Bouncer Registration

If automatic registration fails, register manually:

```bash
# Register bouncer and get API key
API_KEY=$(cscli bouncers add crowdsec-firewall-bouncer -o raw)

# Set in UCI
uci set crowdsec.bouncer.api_key="$API_KEY"
uci commit crowdsec

# Restart bouncer
/etc/init.d/crowdsec-firewall-bouncer restart
```

## Verification

### Check Bouncer Status

```bash
# Service status
/etc/init.d/crowdsec-firewall-bouncer status

# Check if running
ps | grep cs-firewall-bouncer

# Check bouncer registration
cscli bouncers list
```

### Check nftables Rules

```bash
# IPv4 table
nft list table ip crowdsec

# IPv6 table
nft list table ip6 crowdsec6

# Check blacklist set
nft list set ip crowdsec crowdsec-blacklists
```

### Verify Blocking

```bash
# Add a test decision
cscli decisions add --ip 1.2.3.4 --duration 4h --reason "Test block"

# Check if IP is in blacklist
nft list set ip crowdsec crowdsec-blacklists | grep 1.2.3.4

# Delete test decision
cscli decisions delete --ip 1.2.3.4
```

### Check Logs

```bash
# Service logs
logread | grep crowdsec-firewall-bouncer

# Kernel logs for blocked packets (if deny_log=1)
dmesg | grep CrowdSec

# Check bouncer log file
tail -f /var/log/crowdsec-firewall-bouncer.log
```

## How It Works

1. **Startup**:
   - Reads UCI configuration from `/etc/config/crowdsec`
   - Generates YAML config at `/var/etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml`
   - Creates nftables tables (`crowdsec`, `crowdsec6`)
   - Creates nftables sets for blacklists
   - Adds filter chains to INPUT/FORWARD hooks

2. **Runtime**:
   - Polls CrowdSec LAPI every `update_frequency` seconds
   - Fetches active ban decisions
   - Updates nftables sets with banned IPs
   - Sets timeout based on decision duration
   - Automatically removes expired bans

3. **Shutdown**:
   - Deletes nftables tables and chains
   - Removes YAML config
   - Cleans up resources

## Integration with CrowdSec Dashboard

The SecuBox CrowdSec dashboard (`luci-app-crowdsec-dashboard`) automatically detects the bouncer:

- **Detection**: Checks for `cs-firewall-bouncer` process
- **Display**: Shows bouncer status in Overview page
- **Decisions**: Shows blocked IPs and applies them via bouncer

Access the dashboard at: **System → CrowdSec → Overview**

## Troubleshooting

### Bouncer Not Starting

**Check CrowdSec is running**:
```bash
/etc/init.d/crowdsec status
cscli lapi status
```

**Check nftables is available**:
```bash
nft list tables
modprobe nf_tables
```

**Check API key is set**:
```bash
uci get crowdsec.bouncer.api_key
```

### No IPs Being Blocked

**Check for active decisions**:
```bash
cscli decisions list
```

**Check nftables sets**:
```bash
nft list set ip crowdsec crowdsec-blacklists
```

**Check bouncer can reach LAPI**:
```bash
# From bouncer log
logread | grep "connection refused\|timeout"
```

### Interface Not Filtered

**Check interface list**:
```bash
uci show crowdsec.bouncer.interface
```

**Verify interface exists**:
```bash
ip link show
```

**Check nftables rules reference correct interface**:
```bash
nft list chain ip crowdsec crowdsec-chain-input
```

### High CPU Usage

**Reduce update frequency**:
```bash
uci set crowdsec.bouncer.update_frequency='30s'
uci commit crowdsec
/etc/init.d/crowdsec-firewall-bouncer restart
```

**Disable logging**:
```bash
uci set crowdsec.bouncer.deny_log='0'
uci commit crowdsec
/etc/init.d/crowdsec-firewall-bouncer restart
```

## Advanced Configuration

### Using Remote LAPI

To connect to a remote CrowdSec LAPI:

```bash
# Set remote LAPI URL
uci set crowdsec.bouncer.api_url='https://crowdsec-lapi.example.com:8080/'

# Register bouncer on remote server
ssh remote-server "cscli bouncers add router-bouncer"

# Copy API key and set locally
uci set crowdsec.bouncer.api_key='<remote-api-key>'
uci commit crowdsec
/etc/init.d/crowdsec-firewall-bouncer restart
```

### Custom Chain Priority

Higher priority = earlier in filter chain:

```bash
# Default is 4 (before normal filter rules)
uci set crowdsec.bouncer.priority='10'
uci commit crowdsec
/etc/init.d/crowdsec-firewall-bouncer restart
```

### Prometheus Metrics

The bouncer can expose Prometheus metrics (requires recompilation with metrics enabled).

## Files

- `/etc/config/crowdsec` - UCI configuration
- `/etc/init.d/crowdsec-firewall-bouncer` - Init script (from upstream)
- `/var/etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml` - Generated YAML config
- `/var/log/crowdsec-firewall-bouncer.log` - Bouncer log file
- `/usr/bin/cs-firewall-bouncer` - Bouncer binary

## Links

- [CrowdSec Documentation](https://docs.crowdsec.net/)
- [Firewall Bouncer GitHub](https://github.com/crowdsecurity/cs-firewall-bouncer)
- [nftables Documentation](https://wiki.nftables.org/)
- [SecuBox Project](https://secubox.com)

## License

MIT License - See upstream package for details

## Support

For issues related to:
- **SecuBox integration**: Open issue on SecuBox GitHub
- **Bouncer functionality**: Refer to [cs-firewall-bouncer issues](https://github.com/crowdsecurity/cs-firewall-bouncer/issues)
- **CrowdSec core**: Refer to [CrowdSec documentation](https://docs.crowdsec.net/)
