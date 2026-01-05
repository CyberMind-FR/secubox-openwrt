# Netifyd Flow Data Configuration Guide

## Understanding Netifyd Data Export

### Current Status
SecuBox Netifyd Dashboard can display:
- ✅ Service status (running/stopped, uptime, version)
- ✅ Active flow count (from netifyd status)
- ✅ Detected devices (MAC/IP addresses)
- ✅ DNS cache size (application hints)
- ❌ Detailed flow information (source/dest, protocols, bytes per flow)

### Why Detailed Flow Data is Not Available

Netifyd's `/var/run/netifyd/status.json` file only contains **summary statistics**, not detailed flow records. The status file includes:
- Flow count (number of active flows)
- Device MAC/IP mappings
- Interface statistics
- CPU/memory usage
- DNS cache entries

It does NOT include:
- Individual flow details (IP pairs, ports)
- Per-flow byte/packet counters
- Protocol/application per flow
- Flow timestamps and durations

## Solutions for Detailed Flow Data

### Option 1: Netifyd Cloud Dashboard (Easiest)
Your netifyd agent is already configured to upload to Netify.ai cloud.

**Access your data:**
1. Go to: https://dashboard.netify.ai
2. Sign in with your Netify.ai account
3. Find your agent by UUID: `MC-AH-LR-90`
4. View detailed flows, applications, and analytics

**Pros:**
- Already working, no configuration needed
- Professional dashboard with analytics
- Historical data retention
- No local storage required

**Cons:**
- Data stored in cloud
- Requires internet connection
- May have costs for large data volumes

### Option 2: Local Flow Export (Advanced)

To get detailed flow data in SecuBox dashboard, you need to configure netifyd to export flow data locally.

#### Method A: Using netifyd-sink Plugin

Check if local sink plugin is available:
```bash
ls /usr/lib/netifyd/ | grep sink
netifyd --help | grep -i sink
```

If available, configure in `/etc/netifyd.conf`:
```
# Add local JSON sink
sink-path = /tmp/netifyd-flows.json
sink-format = json
sink-max-size = 10M
```

#### Method B: Using netifyd Socket Output

Configure netifyd to output to a local socket that we can read:
```bash
# Edit /etc/config/netifyd
uci set netifyd.@netifyd[0].options='-j /tmp/netifyd-flows.json'
uci commit netifyd
/etc/init.d/netifyd restart
```

#### Method C: Custom Flow Collector Script

The package includes `/usr/bin/netifyd-collector` which attempts to collect flow data. Enable it:
```bash
# Install cron job
cat > /etc/crontabs/root << 'EOF'
* * * * * /usr/bin/netifyd-collector
EOF
/etc/init.d/cron restart
```

### Option 3: Configure Local Flow Storage

If netifyd supports local export, configure these settings in SecuBox:

1. Go to **Settings** page
2. Under **General Settings**, ensure socket is configured:
   - Socket Type: Unix
   - Unix Socket Path: `/var/run/netifyd/netifyd.sock`
3. Enable all monitoring features:
   - ✅ Flow Tracking
   - ✅ Application Detection
   - ✅ Protocol Detection
   - ✅ Device Tracking

## Troubleshooting

### Check Netifyd Capabilities
```bash
# Check version and features
netifyd -V

# Check running status
netifyd -s

# Check command line options
ps | grep netifyd

# List available plugins
ls -la /usr/lib/netifyd/
```

### Verify Data Files
```bash
# Check status file (has summary stats)
cat /var/run/netifyd/status.json | jq .

# Check for flow export files
ls -la /tmp/netifyd-*.json
ls -la /var/run/netifyd/

# Check netifyd logs
logread | grep netifyd
```

### Test Data Collection
```bash
# Run RPCD methods directly
ubus call luci.secubox-netifyd get_dashboard
ubus call luci.secubox-netifyd get_realtime_flows
ubus call luci.secubox-netifyd get_detected_devices
```

## Current Workaround

Until local flow export is configured, the dashboard displays:
- **Summary statistics** from status.json (flow count, device count)
- **Device list** with MAC/IP addresses from netifyd's device tracking
- **Placeholders** for detailed flow/application/protocol views

## Recommendations

**For Home/Small Office:**
- Use Netify.ai cloud dashboard for detailed analytics
- Use SecuBox dashboard for quick status overview and service control

**For Enterprise/Privacy Sensitive:**
- Configure local flow export using one of the methods above
- Consider implementing custom netifyd sink plugin
- Store flow data locally in database for historical analysis

## Support Resources

- Netifyd Documentation: https://www.netify.ai/resources
- Netifyd GitHub: https://github.com/eglooca/netifyd
- OpenWrt Netifyd Package: https://github.com/openwrt/packages/tree/master/net/netifyd
- SecuBox Issues: [Your GitHub repo]

## Future Enhancements

Planned features for full local flow data support:
- [ ] Automatic netifyd plugin configuration
- [ ] Local flow database storage
- [ ] Historical flow data retention
- [ ] Custom flow export formats
- [ ] Integration with external analytics tools
