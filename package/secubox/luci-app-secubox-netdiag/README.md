# SecuBox Network Diagnostics

Real-time DSA switch port statistics and network error monitoring dashboard for OpenWrt.

## Features

- **Switch Port Status Panel**: Visual representation of DSA switch ports with link state, speed, and duplex indicators
- **Error Monitoring Widget**: Real-time error tracking with alert thresholds (normal/warning/critical)
- **Interface Details**: Full ethtool output, driver statistics, and kernel message logs
- **Auto-refresh**: Configurable polling interval (5s, 10s, 30s, or manual)
- **Responsive Design**: Mobile-friendly interface with SecuBox dark theme

## Supported Hardware

- MOCHAbin (Marvell Armada 8040) with mvpp2 driver
- Any OpenWrt device with DSA switch topology
- Standalone Ethernet interfaces (non-DSA)

## Installation

```bash
# Build with SDK
cd secubox-tools/sdk
make package/luci-app-secubox-netdiag/compile V=s

# Install on device
opkg install luci-app-secubox-netdiag_*.ipk
```

## Dependencies

- luci-base
- ethtool

## Menu Location

SecuBox > Network Diagnostics

## Error Metrics Monitored

| Metric | Description |
|--------|-------------|
| rx_crc_errors | CRC/FCS checksum errors |
| rx_frame_errors | Framing errors |
| rx_fifo_errors | FIFO overrun errors |
| rx_missed_errors | Missed packets (buffer full) |
| tx_aborted_errors | TX aborts |
| tx_carrier_errors | Carrier sense errors |
| collisions | Ethernet collisions |
| rx_dropped | Receive drops |
| tx_dropped | Transmit drops |

## Alert Thresholds

| Level | Condition | Indicator |
|-------|-----------|-----------|
| Normal | 0 errors/minute | Green |
| Warning | 1-10 errors/minute | Yellow |
| Critical | >10 errors/minute | Red (pulsing) |

## RPCD API

### Methods

```
luci.secubox-netdiag
  get_switch_status   - All interfaces with DSA topology
  get_interface_details { interface: string } - Full ethtool/dmesg details
  get_error_history { interface: string, minutes: int } - Error timeline
  get_topology - DSA switch structure
  clear_counters { interface: string } - Clear error history
```

### Example ubus call

```bash
ubus call luci.secubox-netdiag get_switch_status
```

## Data Sources

- `/sys/class/net/*/statistics/*` - Kernel statistics
- `/sys/class/net/*/carrier` - Link state
- `/sys/class/net/*/master` - DSA topology
- `ethtool <iface>` - Link parameters
- `ethtool -S <iface>` - Driver statistics
- `dmesg` - Kernel messages

## UI Components

### Port Card
```
+----------+
|  eth0    |
| [*] Up   |
| 1G FD    |
| OK       |
+----------+
```

### Error Monitor
```
eth2 - CRC Errors (last 5 min)
[sparkline graph] 123/min (CRITICAL)
```

## Files

```
luci-app-secubox-netdiag/
  Makefile
  htdocs/luci-static/resources/
    view/secubox-netdiag/
      overview.js          # Main LuCI view
    secubox-netdiag/
      netdiag.css          # SecuBox theme styles
  root/usr/
    libexec/rpcd/
      luci.secubox-netdiag # RPCD backend script
    share/
      luci/menu.d/
        luci-app-secubox-netdiag.json
      rpcd/acl.d/
        luci-app-secubox-netdiag.json
```

## Screenshots

### Main Dashboard
- DSA switch ports in grid layout
- Standalone interfaces below
- Error monitor at bottom

### Port Detail Modal
- Link status (speed, duplex, autoneg)
- Traffic statistics (bytes, packets)
- Error counters with deltas
- Recent kernel messages
- Clear History / Export Log buttons

## License

MIT
