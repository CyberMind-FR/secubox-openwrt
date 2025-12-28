# Bandwidth Manager - QoS & Traffic Control

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active


Advanced bandwidth management for OpenWrt with QoS rules, client quotas, and SQM/CAKE integration.

## Features

### QoS Traffic Shaping
- Rule-based traffic control by application, port, IP, or MAC
- Per-rule download/upload limits
- 8-level priority system (1=highest, 8=lowest)
- Time-based scheduling support
- Real-time rule enable/disable

### Client Quotas
- Monthly data quotas per MAC address
- Usage tracking with iptables counters
- Configurable actions: throttle, block, or notify
- Automatic monthly reset (configurable day)
- Real-time quota usage monitoring

### SQM/CAKE Integration
- Smart Queue Management with CAKE qdisc
- Automatic bandwidth shaping
- NAT-aware configuration
- Link overhead compensation (Ethernet, PPPoE, VLAN)
- Alternative FQ_CoDel and HTB support

### Real-time Monitoring
- Live client bandwidth usage (auto-refresh every 5s)
- Per-client RX/TX statistics
- Quota progress visualization
- Historical usage tracking

## Installation

```bash
opkg update
opkg install luci-app-bandwidth-manager
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Dependencies

- **tc**: Traffic control utility
- **kmod-sched-core**: Kernel traffic scheduler
- **kmod-sched-cake**: CAKE qdisc module
- **kmod-ifb**: Intermediate Functional Block device
- **sqm-scripts**: SQM scripts
- **iptables**: For traffic tracking
- **iptables-mod-conntrack-extra**: Connection tracking extensions

## Configuration

### UCI Configuration

Edit `/etc/config/bandwidth`:

```bash
config global 'global'
	option enabled '1'
	option interface 'br-lan'
	option sqm_enabled '1'

config sqm 'sqm'
	option download_speed '100000'    # kbit/s
	option upload_speed '50000'       # kbit/s
	option qdisc 'cake'
	option nat '1'
	option overhead '22'              # PPPoE overhead

config rule 'rule_youtube'
	option name 'Limit YouTube'
	option type 'application'
	option target 'youtube'
	option limit_down '5000'          # kbit/s
	option limit_up '1000'            # kbit/s
	option priority '6'
	option enabled '1'

config quota 'quota_phone'
	option mac 'AA:BB:CC:DD:EE:FF'
	option name 'iPhone Jean'
	option limit_mb '10240'           # 10 GB
	option action 'throttle'
	option reset_day '1'
	option enabled '1'
```

### Configuration Options

#### Global Section
- `enabled`: Enable/disable bandwidth manager
- `interface`: Network interface to manage (default: br-lan)
- `sqm_enabled`: Enable SQM/CAKE

#### SQM Section
- `download_speed`: Download speed in kbit/s
- `upload_speed`: Upload speed in kbit/s
- `qdisc`: Queue discipline (cake, fq_codel, htb)
- `nat`: NAT mode (1=enabled, 0=disabled)
- `overhead`: Link overhead in bytes (0, 18, 22, 40)

#### Rule Section
- `name`: Rule name
- `type`: Rule type (application, port, ip, mac)
- `target`: Target value (app name, port number, IP, or MAC)
- `limit_down`: Download limit in kbit/s (0=unlimited)
- `limit_up`: Upload limit in kbit/s (0=unlimited)
- `priority`: Priority level (1-8)
- `schedule`: Optional time schedule (e.g., "Mon-Fri 08:00-18:00")
- `enabled`: Enable/disable rule

#### Quota Section
- `mac`: Client MAC address
- `name`: Friendly name
- `limit_mb`: Monthly limit in MB
- `action`: Action when exceeded (throttle, block, notify)
- `reset_day`: Day of month to reset (1-28)
- `enabled`: Enable/disable quota

## Usage

### Web Interface

Navigate to **Network → Bandwidth Manager** in LuCI.

#### Overview Tab
- System status (QoS active, interface, SQM)
- Traffic statistics (RX/TX bytes and packets)
- Active rules summary
- Client quotas with progress bars

#### QoS Rules Tab
- Create/edit/delete traffic shaping rules
- Configure type, target, limits, and priority
- Enable/disable rules individually
- Set time-based schedules

#### Client Quotas Tab
- Manage monthly data quotas per MAC
- Set limits and actions
- Reset quota counters
- View current usage

#### Real-time Usage Tab
- Live bandwidth usage per client
- Auto-refresh every 5 seconds
- Download/upload breakdown
- Quota progress for monitored clients

#### Settings Tab
- Global enable/disable
- Interface selection
- SQM/CAKE configuration
- Traffic tracking settings
- Alert configuration

### Command Line

#### Get Status

```bash
ubus call luci.bandwidth-manager status
```

#### List QoS Rules

```bash
ubus call luci.bandwidth-manager list_rules
```

#### Add QoS Rule

```bash
ubus call luci.bandwidth-manager add_rule '{
  "name": "Limit Torrent",
  "type": "port",
  "target": "6881-6889",
  "limit_down": 3000,
  "limit_up": 500,
  "priority": 7
}'
```

#### Delete Rule

```bash
ubus call luci.bandwidth-manager delete_rule '{
  "rule_id": "rule_1234567890"
}'
```

#### List Client Quotas

```bash
ubus call luci.bandwidth-manager list_quotas
```

#### Set Quota

```bash
ubus call luci.bandwidth-manager set_quota '{
  "mac": "AA:BB:CC:DD:EE:FF",
  "name": "iPhone John",
  "limit_mb": 10240,
  "action": "throttle",
  "reset_day": 1
}'
```

#### Get Quota Details

```bash
ubus call luci.bandwidth-manager get_quota '{
  "mac": "AA:BB:CC:DD:EE:FF"
}'
```

#### Reset Quota Counter

```bash
ubus call luci.bandwidth-manager reset_quota '{
  "mac": "AA:BB:CC:DD:EE:FF"
}'
```

#### Get Real-time Usage

```bash
ubus call luci.bandwidth-manager get_usage_realtime
```

#### Get Usage History

```bash
ubus call luci.bandwidth-manager get_usage_history '{
  "timeframe": "24h",
  "mac": "AA:BB:CC:DD:EE:FF"
}'
```

Timeframe options: `1h`, `6h`, `24h`, `7d`, `30d`

## ubus API Reference

### status()

Get system status and global statistics.

**Returns:**
```json
{
  "enabled": true,
  "interface": "br-lan",
  "sqm_enabled": true,
  "qos_active": true,
  "stats": {
    "rx_bytes": 1234567890,
    "tx_bytes": 987654321,
    "rx_packets": 1234567,
    "tx_packets": 987654
  },
  "rule_count": 5,
  "quota_count": 3
}
```

### list_rules()

List all QoS rules.

**Returns:**
```json
{
  "rules": [
    {
      "id": "rule_youtube",
      "name": "Limit YouTube",
      "type": "application",
      "target": "youtube",
      "limit_down": 5000,
      "limit_up": 1000,
      "priority": 6,
      "enabled": true,
      "schedule": ""
    }
  ]
}
```

### add_rule(name, type, target, limit_down, limit_up, priority)

Add a new QoS rule.

**Returns:**
```json
{
  "success": true,
  "rule_id": "rule_1234567890",
  "message": "Rule created successfully"
}
```

### delete_rule(rule_id)

Delete a QoS rule.

**Returns:**
```json
{
  "success": true,
  "message": "Rule deleted successfully"
}
```

### list_quotas()

List all client quotas with current usage.

**Returns:**
```json
{
  "quotas": [
    {
      "id": "quota_phone",
      "mac": "AA:BB:CC:DD:EE:FF",
      "name": "iPhone Jean",
      "limit_mb": 10240,
      "used_mb": 7850,
      "percent": 76,
      "action": "throttle",
      "reset_day": 1,
      "enabled": true
    }
  ]
}
```

### get_quota(mac)

Get detailed quota information for a specific MAC.

**Returns:**
```json
{
  "success": true,
  "quota_id": "quota_phone",
  "mac": "AA:BB:CC:DD:EE:FF",
  "name": "iPhone Jean",
  "limit_mb": 10240,
  "used_mb": 7850,
  "remaining_mb": 2390,
  "percent": 76,
  "action": "throttle",
  "reset_day": 1
}
```

### set_quota(mac, name, limit_mb, action, reset_day)

Create or update a client quota.

**Returns:**
```json
{
  "success": true,
  "quota_id": "quota_1234567890",
  "message": "Quota created successfully"
}
```

### reset_quota(mac)

Reset quota counter for a client.

**Returns:**
```json
{
  "success": true,
  "message": "Quota counter reset for AA:BB:CC:DD:EE:FF"
}
```

### get_usage_realtime()

Get real-time bandwidth usage for all active clients.

**Returns:**
```json
{
  "clients": [
    {
      "mac": "AA:BB:CC:DD:EE:FF",
      "ip": "192.168.1.100",
      "hostname": "iPhone",
      "rx_bytes": 1234567,
      "tx_bytes": 987654,
      "has_quota": true,
      "limit_mb": 10240,
      "used_mb": 7850
    }
  ]
}
```

### get_usage_history(timeframe, mac)

Get historical usage data.

**Parameters:**
- `timeframe`: "1h", "6h", "24h", "7d", "30d"
- `mac`: MAC address (optional, empty for all clients)

**Returns:**
```json
{
  "history": [
    {
      "mac": "AA:BB:CC:DD:EE:FF",
      "timestamp": 1640000000,
      "rx_bytes": 1234567,
      "tx_bytes": 987654
    }
  ]
}
```

## Traffic Tracking

Bandwidth Manager uses iptables for per-client traffic accounting:

```bash
# Create tracking chain
iptables -N BW_TRACKING

# Add rules for each MAC
iptables -A BW_TRACKING -m mac --mac-source AA:BB:CC:DD:EE:FF
iptables -A BW_TRACKING -m mac --mac-source BB:CC:DD:EE:FF:00

# Insert into FORWARD chain
iptables -I FORWARD -j BW_TRACKING

# View counters
iptables -L BW_TRACKING -n -v -x
```

Usage data is stored in `/tmp/bandwidth_usage.db` in pipe-delimited format:
```
MAC|Timestamp|RX_Bytes|TX_Bytes
```

## QoS Implementation

### CAKE (Recommended)

```bash
tc qdisc add dev br-lan root cake bandwidth 100000kbit
```

Benefits:
- Active Queue Management (AQM)
- Flow-based fair queuing
- NAT-aware
- Low latency

### HTB (Manual Control)

```bash
tc qdisc add dev br-lan root handle 1: htb default 10
tc class add dev br-lan parent 1: classid 1:1 htb rate 100mbit
tc class add dev br-lan parent 1:1 classid 1:10 htb rate 50mbit ceil 100mbit prio 5
```

## Troubleshooting

### QoS Not Working

Check if QoS is active:
```bash
tc qdisc show dev br-lan
```

Check iptables rules:
```bash
iptables -L BW_TRACKING -n -v
```

### Quota Tracking Not Accurate

Reset iptables counters:
```bash
iptables -Z BW_TRACKING
```

Check usage database:
```bash
cat /tmp/bandwidth_usage.db
```

### High CPU Usage

Reduce tracking frequency or use hardware flow offloading if available:
```bash
echo 1 > /sys/class/net/br-lan/offload/tx_offload
```

## Best Practices

1. **Set Realistic Limits**: Configure download/upload speeds to 85-95% of your actual connection speed
2. **Use CAKE**: Prefer CAKE qdisc for best performance and lowest latency
3. **Monitor First**: Use real-time usage view to understand traffic patterns before setting quotas
4. **Regular Resets**: Configure monthly resets on quota day 1 to align with ISP billing
5. **Priority Wisely**: Reserve priority 1-2 for VoIP/gaming, use 5 (normal) for most traffic

## Security Considerations

- MAC addresses can be spoofed - use in conjunction with other security measures
- Quota tracking requires iptables access - secure your router
- Alert emails may contain sensitive information - use encrypted connections
- Traffic shaping rules are visible to network administrator only

## License

Apache-2.0

## Maintainer

SecuBox Project <support@secubox.com>

## Version

1.0.0
