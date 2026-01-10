# Netifyd 5.2.1 SecuBox Integration Guide

## Quick Integration Steps

### 1. Build Both Packages

```bash
# From SecuBox OpenWrt root
cd /path/to/secubox-openwrt

# Build netifyd
make package/secubox/secubox-app-netifyd/compile V=s

# Build LuCI app
make package/secubox/luci-app-secubox-netifyd/compile V=s
```

### 2. Install on Device

```bash
# Copy packages to device
scp bin/packages/*/secubox/netifyd_5.2.1-*.ipk root@192.168.1.1:/tmp/
scp bin/packages/*/secubox/luci-app-secubox-netifyd_*.ipk root@192.168.1.1:/tmp/

# On device
opkg update
opkg install /tmp/netifyd_5.2.1-*.ipk
opkg install /tmp/luci-app-secubox-netifyd_*.ipk
```

### 3. Configure and Start

```bash
# On device
# Start netifyd
/etc/init.d/netifyd start
/etc/init.d/netifyd enable

# Reload LuCI RPCD
/etc/init.d/rpcd reload

# Clear browser cache and access web interface
# Navigate to: Services > Netifyd Dashboard
```

## Integration Points

### 1. LuCI App Integration

The `luci-app-secubox-netifyd` package integrates with netifyd through:

- **RPCD Backend:** `/usr/libexec/rpcd/luci.secubox-netifyd`
  - Reads from `/var/run/netifyd/status.json`
  - Provides API for dashboard data

- **Web Interface:** `/usr/share/luci/menu.d/`
  - Dashboard, flows, devices, applications views
  - Real-time statistics
  - Service control

### 2. Data Flow

```
netifyd service
    ↓
/var/run/netifyd/status.json  (status data)
/var/run/netifyd/netifyd.sock (Unix socket)
    ↓
RPCD Backend (luci.secubox-netifyd)
    ↓
LuCI Web Interface
    ↓
User Browser
```

### 3. Configuration Files

**Netifyd:**
- `/etc/config/netifyd` - UCI configuration
- `/etc/netifyd.conf` - Netifyd native config
- `/etc/netify.d/` - Persistent data directory

**LuCI App:**
- `/etc/config/secubox-netifyd` - Dashboard settings
- Socket configuration (TCP/Unix)
- Analytics settings

## Dependencies

### Required by netifyd

```
+libcurl +libmnl +libnetfilter-conntrack +libpcap
+zlib +libpthread +libstdcpp +libjson-c +ca-bundle
```

### Required by luci-app-secubox-netifyd

```
+luci-base +rpcd +netifyd +jq +secubox-core
```

## Testing Integration

### 1. Verify Netifyd is Running

```bash
# Check service status
/etc/init.d/netifyd status

# Check netifyd process
ps | grep netifyd

# View netifyd status
netifyd -s
```

### 2. Verify Data Files

```bash
# Check status file
cat /var/run/netifyd/status.json | jq .

# Check socket
ls -la /var/run/netifyd/netifyd.sock

# Check PID file
cat /var/run/netifyd/netifyd.pid
```

### 3. Test RPCD Backend

```bash
# Test RPC calls
ubus list | grep netifyd

# Get service status
ubus call luci.secubox-netifyd get_service_status

# Get dashboard data
ubus call luci.secubox-netifyd get_dashboard

# Get detected devices
ubus call luci.secubox-netifyd get_detected_devices
```

### 4. Test Web Interface

```bash
# Access LuCI
http://192.168.1.1/cgi-bin/luci/admin/secubox/netifyd/dashboard

# Check for JavaScript errors in browser console
# Verify data is loading
```

## Troubleshooting Integration

### Issue: LuCI Dashboard Shows No Data

**Cause:** Netifyd not running or no status file

**Solution:**
```bash
# Start netifyd
/etc/init.d/netifyd start

# Wait a few seconds
sleep 5

# Check status file
cat /var/run/netifyd/status.json

# Reload page
```

### Issue: RPCD Calls Fail

**Cause:** ACL permissions not set

**Solution:**
```bash
# Reload RPCD
/etc/init.d/rpcd reload

# Check ACL file
cat /usr/share/rpcd/acl.d/luci-app-secubox-netifyd.json

# Clear browser cache
```

### Issue: Service Won't Start

**Cause:** Interface configuration issues

**Solution:**
```bash
# Enable auto-detection
uci set netifyd.default.autoconfig='1'
uci commit netifyd

# Or configure manually
uci add_list netifyd.default.internal_if='br-lan'
uci add_list netifyd.default.external_if='br-wan'
uci commit netifyd

# Restart
/etc/init.d/netifyd restart
```

## Advanced Integration

### Custom Data Export

To export flow data for custom processing:

```bash
# Enable local JSON export in netifyd
uci add_list netifyd.default.options='-j /tmp/netifyd-flows.json'
uci commit netifyd
/etc/init.d/netifyd restart

# Configure LuCI app to read from file
uci set secubox-netifyd.settings.flow_export='/tmp/netifyd-flows.json'
uci commit secubox-netifyd
```

### Cloud Integration

```bash
# Enable cloud sink
netifyd --enable-sink

# Check sink status
netifyd -s | grep sink

# Agent UUID (for cloud dashboard)
netifyd -p
```

### API Integration

Example: Read data from RPCD backend in custom script:

```bash
#!/bin/sh
# Get dashboard data
DATA=$(ubus call luci.secubox-netifyd get_dashboard)

# Parse with jq
FLOWS=$(echo "$DATA" | jq -r '.stats.active_flows')
DEVICES=$(echo "$DATA" | jq -r '.stats.unique_devices')

echo "Active Flows: $FLOWS"
echo "Devices: $DEVICES"
```

## Upgrade Path

### Upgrading Netifyd

```bash
# Build new version
make package/secubox/secubox-app-netifyd/clean
make package/secubox/secubox-app-netifyd/compile V=s

# Install on device
opkg remove netifyd
opkg install /tmp/netifyd_*.ipk

# Configuration is preserved
/etc/init.d/netifyd start
```

### Upgrading LuCI App

```bash
# Build new version
make package/secubox/luci-app-secubox-netifyd/clean
make package/secubox/luci-app-secubox-netifyd/compile V=s

# Install on device
opkg upgrade /tmp/luci-app-secubox-netifyd_*.ipk

# Reload services
/etc/init.d/rpcd reload
/etc/init.d/uhttpd reload
```

## Performance Considerations

### Resource Usage

Typical resource usage on embedded device:

- **CPU:** 0.5-2% (idle), 5-10% (active traffic)
- **Memory:** 20-40 MB RSS
- **Disk:** < 1 MB for package, ~2-5 MB for runtime data

### Tuning for Low-End Devices

```bash
# Reduce threads
uci add_list netifyd.default.options='--thread-detection-cores=1'
uci add_list netifyd.default.options='-t'

# Lower limits in /etc/netifyd.conf:
# flow-max = 5000
# flow-expiry = 60
```

### Tuning for High-Traffic Networks

```bash
# Increase threads
uci add_list netifyd.default.options='--thread-detection-cores=4'

# Higher limits in /etc/netifyd.conf:
# flow-max = 65536
# flow-expiry = 300
```

## Security Considerations

1. **Packet Capture:** Netifyd requires root privileges for packet capture
2. **Data Privacy:** Flow metadata includes IP addresses, ports, protocols
3. **Cloud Sync:** Optional - can be disabled if data privacy is a concern
4. **Local Access:** Unix socket is accessible by root only
5. **Web Interface:** Protected by LuCI authentication

## Support and Documentation

- **Package Issues:** https://github.com/your-repo/issues
- **Netifyd Upstream:** https://github.com/eglooca/netifyd
- **Netify.ai Docs:** https://www.netify.ai/resources
- **OpenWrt Wiki:** https://openwrt.org/

## License

- Netifyd: GPL-3.0-or-later
- LuCI App: MIT
- Integration Code: MIT
