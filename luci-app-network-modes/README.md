# LuCI Network Modes Dashboard

**Version:** 0.3.6
**Last Updated:** 2025-12-28
**Status:** Active


![Version](https://img.shields.io/badge/version-0.3.6-orange)
![License](https://img.shields.io/badge/license-Apache--2.0-green)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02+-blue)

Configure your OpenWrt router for different network operation modes with a modern, intuitive interface.

![Dashboard Preview](screenshots/dashboard-preview.png)

## 🎯 Network Modes

### 🚀 What's New in v0.3.6
- **WireGuard automation:** generate key pairs, deploy `wg0` interfaces, and push MTU/MSS/BBR optimizations directly from the Relay panel.
- **Optimization RPCs:** new backend methods expose MTU clamping, TCP BBR, and WireGuard deployment to both UI and automation agents.
- **UI action buttons:** Relay mode now includes one-click buttons for key generation, interface deployment, and optimization runs.
- **Integrated proxies:** router mode now auto-configures Squid/TinyProxy/Privoxy, transparent HTTP redirection, DNS-over-HTTPS, and nginx reverse proxy vhosts with optional Let’s Encrypt certificates.

### 🔍 Sniffer Bridge Mode (Inline / Passthrough)
Transparent Ethernet bridge without IP address for in-line traffic analysis. All traffic passes through the device.

**Network Configuration:**
- **Transparent bridge** mode (br-lan) without IP address assignment
- **Promiscuous mode** enabled on all bridged interfaces
- **No DHCP server** - invisible on the network
- **No routing** - pure layer 2 forwarding
- **Inline deployment** - device inserted in traffic path
- Perfect insertion point between gateway and network devices

**Traffic Analysis Features:**
- **Netifyd integration** for real-time Deep Packet Inspection (DPI)
- **Application detection** (Netflix, YouTube, Zoom, torrent, etc.)
- **Protocol identification** (HTTP/HTTPS, DNS, QUIC, SSH, etc.)
- **Flow tracking** with source/destination analysis
- **Bandwidth monitoring** per application and protocol

**Use Cases:**
- 📊 **Network forensics** - Capture all traffic passing through
- 🔍 **Security monitoring** - Detect anomalies and threats inline
- 🎯 **Bandwidth analysis** - Identify bandwidth hogs
- 🧪 **Protocol debugging** - Debug network issues
- 📈 **Compliance monitoring** - Log all network activity

**Physical Setup (Inline):**
```
Internet Router (Gateway)
        ↓
   [WAN Port] OpenWrt (Bridge Mode) [LAN Ports]
        ↓
   Network Devices (Switches, APs, Clients)
```

**Advantages:**
- ✅ Sees 100% of network traffic
- ✅ Can apply firewall rules if needed
- ✅ Can perform traffic shaping
- ⚠️ Single point of failure (if device fails, network is down)

**Proxy / DoH Requirements (Router Mode):**

| Capability | Packages |
|------------|----------|
| Caching proxy | `squid` or `tinyproxy` or `privoxy` |
| Transparent proxy redirect | (iptables built-in) |
| DNS over HTTPS | `https-dns-proxy`, `ca-certificates` |
| HTTPS reverse proxy | `nginx` (HAProxy/Caddy support planned) |
| Let’s Encrypt automation | `acme`, `acme-dnsapi`, `openssl-util` |

Install these packages before enabling the associated toggles in the Router panel so the automation can write configs and restart services successfully.

---

### 👁️ Sniffer Passive Mode (Out-of-band / Monitor Only)
Pure passive monitoring without affecting network traffic. Device only listens, traffic doesn't flow through it.

**Network Configuration:**
- **Monitor mode** interface (no bridge, no forwarding)
- **Promiscuous mode** for packet capture
- **No IP address** on monitoring interface
- **Read-only** - cannot affect network traffic
- Connected via **SPAN/mirror port** or **network TAP**

**Traffic Analysis Features:**
- **Netifyd integration** for Deep Packet Inspection
- **Full packet capture** with tcpdump/Wireshark
- **Application and protocol detection**
- **Flow analysis** and bandwidth monitoring
- **Zero network impact** - invisible to network

**Use Cases:**
- 🔬 **Pure forensics** - Monitor without any network impact
- 🛡️ **IDS/IPS** - Intrusion detection without inline risk
- 📡 **Network TAP monitoring** - Dedicated monitoring infrastructure
- 🔒 **Secure environments** - No risk of disrupting production traffic
- 📊 **Long-term monitoring** - Continuous passive observation

**Physical Setup Options:**

**Option 1: Switch SPAN/Mirror Port**
```
Internet Router
        ↓
   Managed Switch (with port mirroring)
        ├─→ [Port 1-23] Normal traffic
        └─→ [Port 24 SPAN] ──→ OpenWrt [eth0] (Monitor)
```

**Option 2: Network TAP**
```
Internet Router ──→ [TAP Device] ──→ Switch
                        ↓
                   OpenWrt [eth0] (Monitor)
```

**Option 3: Hub (Legacy)**
```
Internet Router ──→ [Hub] ──→ Switch
                      ↓
                 OpenWrt [eth0] (Monitor)
```

**Advantages:**
- ✅ Zero network impact - no single point of failure
- ✅ Completely invisible to network
- ✅ Cannot be detected or attacked
- ✅ Perfect for compliance and security monitoring
- ⚠️ Requires SPAN port, TAP, or hub
- ⚠️ May miss traffic depending on setup

**Integration with SecuBox:**
Both modes work seamlessly with:
- **Netifyd Dashboard** for DPI visualization
- **CrowdSec** for threat detection
- **Netdata** for metrics and graphs
- **Client Guardian** for access control decisions

**Advanced Options:**
- Capture to PCAP files for offline analysis
- Export to SIEM (Elasticsearch, Splunk, etc.)
- Filter specific protocols or ports
- Traffic replay for testing
- Long-term packet storage on USB/NAS

### 📶 Access Point Mode
WiFi access point with advanced optimizations.
- **802.11r** Fast BSS Transition (roaming)
- **802.11k** Radio Resource Management
- **802.11v** BSS Transition Management
- **Band Steering** (prefer 5GHz)
- **Beamforming** support
- Channel and TX power configuration

### 🔄 Relay / Extender Mode
Network relay with WireGuard optimization.
- **Relayd** bridge for network extension
- **WireGuard VPN** integration
- **MTU optimization** for tunnels
- **MSS clamping** for TCP
- **TCP BBR** congestion control

### 🌐 Router Mode
Full router with WAN, proxy and HTTPS frontends.
- **WAN protocols**: DHCP, Static, PPPoE, L2TP
- **NAT/Masquerade** with firewall
- **Web Proxy**: Squid, TinyProxy, Privoxy
- **Transparent proxy** option
- **DNS over HTTPS** support
- **HTTPS Reverse Proxy**: Nginx, HAProxy, Caddy
- **Multiple virtual hosts** with Let's Encrypt

## ✨ Features

- 🎛️ One-click mode switching with backup
- 📊 Real-time interface and service status
- ⚡ Optimized configurations per mode
- 🔐 Secure settings management
- 📱 Responsive design
- 🎨 Modern dark theme

## Installation

### Prerequisites

- OpenWrt 21.02 or later
- LuCI web interface

### From Source

```bash
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/gkerma/luci-app-network-modes.git

cd ~/openwrt
./scripts/feeds update -a && ./scripts/feeds install -a
make menuconfig  # LuCI > Applications > luci-app-network-modes
make package/luci-app-network-modes/compile V=s
```

### Manual Installation

```bash
scp luci-app-network-modes_*.ipk root@192.168.1.1:/tmp/
ssh root@192.168.1.1 "opkg install /tmp/luci-app-network-modes_*.ipk"
/etc/init.d/rpcd restart
```

### Access

**Network → Network Modes**

## Mode-Specific Dependencies

### Sniffer Mode
```bash
opkg install netifyd
```

### Access Point Mode
```bash
opkg install hostapd-openssl  # For WPA3/802.11r
```

### Relay Mode
```bash
opkg install relayd wireguard-tools
```

### Router Mode
```bash
# Proxy
opkg install squid  # or tinyproxy, privoxy

# Reverse Proxy
opkg install nginx-ssl  # or haproxy

# Let's Encrypt
opkg install acme acme-dnsapi
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LuCI JavaScript                       │
│  (overview.js, sniffer.js, accesspoint.js, relay.js,    │
│                      router.js)                          │
└───────────────────────────┬─────────────────────────────┘
                            │ ubus RPC
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    RPCD Backend                          │
│             /usr/libexec/rpcd/network-modes             │
└───────────────────────────┬─────────────────────────────┘
                            │ UCI / Shell
                            ▼
┌─────────────────────────────────────────────────────────┐
│              OpenWrt Configuration                       │
│     /etc/config/network, wireless, firewall, dhcp       │
└─────────────────────────────────────────────────────────┘
```

## API Methods

| Method | Description |
|--------|-------------|
| `status` | Current mode, interfaces, services status |
| `modes` | List all modes with configurations |
| `sniffer_config` | Sniffer mode settings |
| `ap_config` | Access Point mode settings |
| `relay_config` | Relay mode settings |
| `router_config` | Router mode settings |
| `apply_mode` | Switch to a different mode |
| `update_settings` | Update mode-specific settings |
| `add_vhost` | Add virtual host (router mode) |
| `generate_config` | Generate config preview |

## Configuration File

Settings are stored in `/etc/config/network-modes`:

```
config network-modes 'config'
    option current_mode 'router'
    option last_change '2024-12-19 15:30:00'
    option backup_config '1'

config mode 'sniffer'
    option mode_type 'bridge'  # 'bridge' or 'passive'
    option bridge_interface 'br-lan'
    option monitor_interface 'eth0'  # For passive mode
    option netifyd_enabled '1'
    option promiscuous '1'
    option pcap_capture '0'
    option pcap_path '/tmp/captures'
    option mirror_port ''
    option capture_filter ''
    option span_port_source ''  # For passive mode with SPAN

config mode 'accesspoint'
    option wifi_channel 'auto'
    option wifi_htmode 'VHT80'
    option wifi_txpower '20'
    option roaming_enabled '1'

config mode 'relay'
    option wireguard_enabled '1'
    option mtu_optimization '1'
    option mss_clamping '1'

config mode 'router'
    option wan_protocol 'dhcp'
    option nat_enabled '1'
    option firewall_enabled '1'
    option proxy_enabled '0'
    option https_frontend '0'
```

## Sniffer Mode Examples

### Basic Sniffer Bridge Setup (Inline)

1. **Enable Sniffer Bridge Mode** via LuCI:
   - Navigate to **Network → Network Modes**
   - Select **Sniffer Bridge Mode (Inline)**
   - Enable **Netifyd Integration**
   - Click **Apply Mode**

2. **Physical Connection**:
   ```
   Modem/ISP → [WAN] OpenWrt [LAN1-4] → Switch/Devices
   ```

3. **Verify Configuration**:
   ```bash
   # Check bridge status
   brctl show br-lan

   # Verify no IP on bridge
   ip addr show br-lan

   # Check promiscuous mode
   ip link show br-lan | grep PROMISC

   # Verify Netifyd is running
   /etc/init.d/netifyd status
   ```

---

### Passive Sniffer Setup (Out-of-band)

#### Option A: Using Switch SPAN Port

1. **Configure Switch SPAN/Mirror Port**:
   - Access your managed switch configuration
   - Configure port mirroring:
     - **Source ports**: Ports to monitor (e.g., uplink port)
     - **Destination port**: Port connected to OpenWrt (e.g., port 24)
     - **Direction**: Both (ingress + egress)

2. **Configure OpenWrt Passive Mode**:
   ```bash
   # Via UCI
   uci set network-modes.sniffer.mode_type='passive'
   uci set network-modes.sniffer.monitor_interface='eth0'
   uci set network-modes.sniffer.netifyd_enabled='1'
   uci commit network-modes

   # Apply configuration
   ubus call network-modes apply_mode '{"mode":"sniffer"}'
   ```

3. **Configure Monitor Interface**:
   ```bash
   # Remove IP from monitoring interface
   ip addr flush dev eth0

   # Enable promiscuous mode
   ip link set eth0 promisc on

   # Bring interface up
   ip link set eth0 up

   # Verify interface state
   ip link show eth0
   ```

4. **Start Netifyd on Monitor Interface**:
   ```bash
   # Edit /etc/netifyd.conf
   {
     "interfaces": {
       "internal": [],
       "external": ["eth0"]
     },
     "enable_sink": true
   }

   # Restart Netifyd
   /etc/init.d/netifyd restart
   ```

5. **Verify Passive Capture**:
   ```bash
   # Test with tcpdump
   tcpdump -i eth0 -c 100

   # Check Netifyd is seeing traffic
   ubus call luci.netifyd status

   # Monitor live flows
   ubus call luci.netifyd flows | jq '.flows | length'
   ```

#### Option B: Using Network TAP

1. **Physical Setup**:
   ```
   Router [eth0] ──→ [TAP IN]
                         ↓
                    [TAP MONITOR] ──→ OpenWrt [eth0]
                         ↓
                     [TAP OUT] ──→ Switch
   ```

2. **Configure OpenWrt**:
   ```bash
   # Same as SPAN port configuration above
   uci set network-modes.sniffer.mode_type='passive'
   uci set network-modes.sniffer.monitor_interface='eth0'
   uci commit network-modes
   ```

3. **Advantages of TAP**:
   - ✅ Hardware-based, zero packet loss
   - ✅ Full duplex monitoring (both directions)
   - ✅ No switch configuration needed
   - ✅ Cannot be remotely disabled
   - ⚠️ Requires physical TAP device

#### Option C: Using Hub (Budget Option)

1. **Physical Setup**:
   ```
   Router ──→ [Hub Port 1]
               [Hub Port 2] ──→ Switch
               [Hub Port 3] ──→ OpenWrt [eth0]
   ```

2. **Configure OpenWrt**:
   ```bash
   # Same passive configuration
   uci set network-modes.sniffer.mode_type='passive'
   uci set network-modes.sniffer.monitor_interface='eth0'
   uci commit network-modes
   ```

3. **Limitations**:
   - ⚠️ Only works with 10/100Mbps networks
   - ⚠️ Half-duplex only
   - ⚠️ Adds latency
   - ⚠️ Not recommended for modern networks

### Advanced Capture Configuration

**Capture HTTP traffic to PCAP:**
```bash
# Via UCI
uci set network-modes.sniffer.pcap_capture='1'
uci set network-modes.sniffer.pcap_path='/mnt/usb/captures'
uci set network-modes.sniffer.capture_filter='port 80 or port 443'
uci commit network-modes

# Manual tcpdump
tcpdump -i br-lan -w /tmp/capture.pcap port 80 or port 443
```

**Monitor specific applications:**
```bash
# Watch Netflix traffic
tcpdump -i br-lan -n 'host nflxvideo.net or host netflix.com'

# Monitor DNS queries
tcpdump -i br-lan -n 'port 53'

# Capture BitTorrent
tcpdump -i br-lan -n 'port 6881:6889'
```

**Real-time bandwidth per IP:**
```bash
# Using iftop
iftop -i br-lan -P

# Using nethogs (if installed)
nethogs br-lan

# Using Netifyd API
ubus call luci.netifyd flows | jq '.flows[] | select(.bytes_total > 1000000)'
```

### Integration Examples

**Export to Elasticsearch:**
```bash
# Netifyd can export to Elasticsearch for centralized logging
# Configure in /etc/netifyd.conf
{
  "sink": {
    "type": "elasticsearch",
    "url": "http://elastic.local:9200",
    "index": "netifyd"
  }
}
```

**Feed data to Grafana:**
```bash
# Netifyd exports Prometheus metrics
curl http://192.168.1.1:8081/metrics
```

**Integrate with CrowdSec:**
```bash
# CrowdSec can parse Netifyd logs for threat detection
# Configure in /etc/crowdsec/acquis.yaml
filenames:
  - /var/log/netifyd.log
labels:
  type: netifyd
```

### Performance Tuning

**Optimize for high-bandwidth networks (1Gbps+):**
```bash
# Increase ring buffer size
ethtool -G eth0 rx 4096 tx 4096
ethtool -G eth1 rx 4096 tx 4096

# Disable hardware offloading for accurate capture
ethtool -K eth0 gro off gso off tso off
ethtool -K eth1 gro off gso off tso off

# Set bridge to forwarding mode
echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables
```

**USB Storage for PCAP captures:**
```bash
# Mount USB drive
mkdir -p /mnt/usb
mount /dev/sda1 /mnt/usb

# Configure rotation
uci set network-modes.sniffer.pcap_path='/mnt/usb/captures'
uci set network-modes.sniffer.pcap_rotation='daily'
uci set network-modes.sniffer.pcap_retention='7'
uci commit network-modes
```

### Troubleshooting

**No traffic visible:**
```bash
# Verify bridge members
brctl show

# Check interface states
ip link show

# Test with tcpdump
tcpdump -i br-lan -c 10

# Check Netifyd logs
logread | grep netifyd
```

**High CPU usage:**
```bash
# Disable DPI if not needed
uci set network-modes.sniffer.netifyd_enabled='0'

# Reduce capture scope with filters
tcpdump -i br-lan 'not port 22' -w /dev/null

# Check for hardware offloading
ethtool -k eth0 | grep offload
```

## Security

- Mode switching creates automatic backups
- Private keys never exposed via API
- ACL-based access control
- Firewall auto-configuration

## Screenshots

### Overview
![Overview](screenshots/overview.png)

### Access Point Settings
![Access Point](screenshots/accesspoint.png)

### Router with Virtual Hosts
![Router](screenshots/router.png)

## Contributing

Contributions welcome! Please submit issues and pull requests.

## License

Apache License 2.0 - See [LICENSE](LICENSE)

## Credits

- Built for [OpenWrt](https://openwrt.org/)
- Developed by [Gandalf @ CyberMind.fr](https://cybermind.fr)

---

Made with ⚙️ for flexible networking
