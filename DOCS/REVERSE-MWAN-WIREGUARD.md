# Reverse MWAN WireGuard Design Specification

**Status:** Design
**Version:** 0.1.0
**Last Updated:** 2026-02-28

## Overview

Allow WireGuard mesh peers to act as backup uplinks for multi-WAN failover. When the primary WAN connection fails, traffic routes through a WireGuard tunnel to a peer that has internet connectivity.

## Use Cases

1. **Remote Site Backup:** Office router loses WAN, fails over to home user's WireGuard peer
2. **Mobile Failover:** Fixed router fails over to mobile hotspot connected via WireGuard
3. **Mesh Redundancy:** Any mesh node can provide emergency uplink to others

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │            MESH NETWORK                  │
                    │                                          │
   ┌────────────────┤                                          ├────────────────┐
   │                │   WireGuard Tunnels (always up)         │                │
   │                │                                          │                │
┌──▼──┐          ┌──▼──┐                                    ┌──▼──┐          ┌──▼──┐
│Node │◄─────────►Node │                                    │Node │◄─────────►Node │
│  A  │   wg0    │  B  │                                    │  C  │   wg0    │  D  │
└──┬──┘          └──┬──┘                                    └──┬──┘          └──┬──┘
   │WAN1            │WAN1                                      │WAN1            │WAN1
   │(Primary)       │(Primary)                                 │(Primary)       │(Primary)
   ▼                ▼                                          ▼                ▼
   🌐               🌐                                          ❌               🌐
  (UP)             (UP)                                       (DOWN)           (UP)

                              ┌─────────────────────┐
                              │    Node C Failover   │
                              │                      │
                              │  WAN1 → DOWN         │
                              │  wg0 (Node A) → UP   │
                              │  wg0 (Node B) → UP   │
                              │  wg0 (Node D) → UP   │
                              │                      │
                              │  mwan3 policy:       │
                              │  Use wg_nodeA        │
                              └─────────────────────┘
```

## Components

### 1. WireGuard Uplink Interface

New interface type in WireGuard dashboard: `uplink`

```uci
config interface 'wg_uplink_nodeA'
    option proto 'wireguard'
    option private_key '...'
    list addresses '10.0.0.100/24'
    # Mark as uplink-capable
    option secubox_uplink '1'
    option secubox_peer_id 'nodeA'

config wireguard_wg_uplink_nodeA
    option public_key '...'
    option endpoint_host 'nodeA.example.com'
    option endpoint_port '51820'
    # Full tunnel for uplink mode
    list allowed_ips '0.0.0.0/0'
    list allowed_ips '::/0'
    option persistent_keepalive '25'
```

### 2. mwan3 Integration

```uci
# /etc/config/mwan3

config interface 'wan'
    option enabled '1'
    option family 'ipv4'
    option reliability '2'
    option track_method 'ping'
    list track_ip '8.8.8.8'
    list track_ip '1.1.1.1'

config interface 'wg_uplink_nodeA'
    option enabled '1'
    option family 'ipv4'
    option reliability '1'
    option track_method 'ping'
    # Track through tunnel
    list track_ip '10.0.0.1'
    # Lower weight = backup
    option weight '10'

config member 'wan_primary'
    option interface 'wan'
    option weight '100'
    option metric '1'

config member 'wg_uplink_nodeA_backup'
    option interface 'wg_uplink_nodeA'
    option weight '10'
    option metric '10'

config policy 'balanced'
    list use_member 'wan_primary'
    list use_member 'wg_uplink_nodeA_backup'
```

### 3. Uplink Capability Advertisement

Peers advertise uplink capability via gossip:

```json
{
  "type": "uplink_offer",
  "peer_id": "nodeA",
  "timestamp": "2026-02-28T12:00:00Z",
  "capabilities": {
    "bandwidth_mbps": 100,
    "latency_ms": 20,
    "wan_type": "fiber",
    "available": true
  },
  "endpoint": {
    "host": "nodeA.example.com",
    "port": 51820,
    "public_key": "..."
  }
}
```

### 4. CLI Commands

```bash
# List available uplinks from mesh peers
wgctl uplink list

# Add peer as uplink
wgctl uplink add <peer_id>

# Remove peer uplink
wgctl uplink remove <peer_id>

# Show uplink status
wgctl uplink status

# Enable/disable mwan3 failover
wgctl uplink failover enable
wgctl uplink failover disable

# Test uplink connectivity
wgctl uplink test <peer_id>

# Set priority (lower = less preferred)
wgctl uplink priority <peer_id> <weight>
```

### 5. RPCD Methods

```
luci.wireguard-dashboard.uplink_list
luci.wireguard-dashboard.uplink_add { peer_id }
luci.wireguard-dashboard.uplink_remove { peer_id }
luci.wireguard-dashboard.uplink_status
luci.wireguard-dashboard.uplink_test { peer_id }
luci.wireguard-dashboard.uplink_set_priority { peer_id, weight }
```

## Implementation Plan

### Phase 1: Core Infrastructure

1. Add `secubox_uplink` option to WireGuard interface config
2. Create `wgctl uplink` command set
3. Implement uplink advertisement via gossip

### Phase 2: mwan3 Integration

1. Auto-generate mwan3 config for uplink interfaces
2. Implement connectivity tracking
3. Add failover policy generation

### Phase 3: LuCI Dashboard

1. Add "Uplink" column to peers view
2. Create uplink configuration modal
3. Add failover status indicator

### Phase 4: Advanced Features

1. Bandwidth-aware peer selection
2. Latency-based routing
3. Cost/metering awareness

## Configuration

### UCI Options

```uci
config wireguard-uplink 'uplink'
    option enabled '1'
    # Auto-failover when primary WAN down
    option auto_failover '1'
    # Minimum uplinks to maintain
    option min_uplinks '2'
    # Health check interval (seconds)
    option check_interval '30'
    # Failover timeout (seconds)
    option failover_timeout '10'
    # Prefer peers with lowest latency
    option prefer_latency '1'
```

## Security Considerations

1. **Trust:** Only mesh peers with valid master-link trust can be uplinks
2. **Traffic Inspection:** Uplink peers can see outbound traffic
3. **Bandwidth:** Uplinks should set rate limits to prevent abuse
4. **DNS:** DNS requests should also route through uplink tunnel

## Dependencies

- `mwan3` - Multi-WAN failover
- `wireguard-tools` - WireGuard management
- `secubox-p2p` - Gossip protocol for uplink discovery
- `secubox-master-link` - Peer trust verification

## Files

| File | Purpose |
|------|---------|
| `/usr/lib/wireguard-dashboard/uplink.sh` | Uplink management library |
| `/etc/config/wireguard-uplink` | UCI configuration |
| `/etc/mwan3.d/wireguard-uplinks.conf` | Generated mwan3 config |
| `/var/run/wireguard-uplinks.json` | Runtime uplink state |

## See Also

- [WireGuard Dashboard](../package/secubox/luci-app-wireguard-dashboard/README.md)
- [Master Link Trust](../package/secubox/secubox-master-link/README.md)
- [P2P Gossip Protocol](../package/secubox/secubox-p2p/README.md)
- [OpenWrt mwan3 Documentation](https://openwrt.org/docs/guide-user/network/wan/multiwan/mwan3)
