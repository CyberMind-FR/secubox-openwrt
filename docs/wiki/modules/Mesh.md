# Mesh Network Modules

SecuBox provides decentralized mesh networking through 7 integrated modules.

---

## Overview

| Layer | Components |
|-------|------------|
| **Transport** | WireGuard VPN tunnels |
| **Discovery** | mDNS, Yggdrasil, subnet scanning |
| **Topology** | Mesh daemon, gate election |
| **Services** | P2P registry, MirrorNet |
| **Identity** | DID:plc, ZKP verification |

---

## SecuBox Mesh

**Package**: `secubox-mesh` + `luci-app-secubox-mesh`

Core mesh daemon with topology management and automatic gate election.

![Mesh Dashboard](../../screenshots/router/mesh.png)

### Features

- Peer discovery (mDNS, ARP, WireGuard)
- Topology management
- Gate election (weighted scoring)
- Cross-node telemetry
- Device/VM/container discovery

### Discovery Methods

| Method | Description |
|--------|-------------|
| mDNS | `_secubox._udp.local` service discovery |
| ARP | Network neighbor scanning |
| WireGuard | Peer configuration scanning |
| Docker | Container discovery via socket |
| LXC | Container discovery via lxc-ls |
| libvirt | VM discovery via virsh |

### CLI

```bash
secuboxctl status             # Mesh status
secuboxctl peers              # List peers
secuboxctl topology           # Show topology
secuboxctl telemetry          # Node metrics
secuboxctl scan               # Trigger discovery
```

### RPCD Methods

| Method | Description |
|--------|-------------|
| `status` | Mesh daemon status |
| `peers` | List mesh peers |
| `topology` | Network topology |
| `nodes` | All known nodes |
| `devices` | Discovered devices |
| `scan_full` | Full network scan |
| `scan_containers` | Container/VM scan |

---

## WireGuard Dashboard

**Package**: `luci-app-wireguard-dashboard`

WireGuard VPN management with QR code generation.

![WireGuard](../../screenshots/router/wireguard.png)

### Features

- Interface management
- Peer configuration
- QR code generation
- Traffic monitoring
- Mobile client export

### CLI

```bash
wgctl status                  # VPN status
wgctl peers                   # List peers
wgctl add-peer <name> <ip>    # Add peer
wgctl qr <peer>               # Generate QR
```

---

## P2P Network

**Package**: `secubox-p2p` + `luci-app-secubox-p2p`

Decentralized gossip protocol with blockchain sync.

![P2P](../../screenshots/router/p2p.png)

### Features

- Gossip protocol
- Service registry
- Threat intelligence sharing
- Configuration sync
- Blockchain-based consensus

### Gossip Topics

| Topic | Description |
|-------|-------------|
| `services` | Service announcements |
| `threats` | IoC sharing |
| `config` | Configuration sync |
| `peers` | Peer discovery |

### CLI

```bash
p2pctl status                 # P2P status
p2pctl peers                  # Connected peers
p2pctl publish <service>      # Publish service
p2pctl subscribe <topic>      # Subscribe to topic
```

---

## MirrorNet

**Package**: `secubox-mirrornet` + `luci-app-secubox-mirror`

Service mirroring and CDN capabilities.

![MirrorNet](../../screenshots/router/mirror.png)

### Features

- Service mirroring
- Load balancing
- CDN distribution
- Failover routing
- Gossip-based sync

### Modes

| Mode | Description |
|------|-------------|
| Master | Primary service provider |
| Slave | Mirror/replica |
| Submaster | Hierarchical replication |

### CLI

```bash
mirrorctl status              # Mirror status
mirrorctl list                # List mirrors
mirrorctl add <service> <peer> # Add mirror
mirrorctl sync                # Force sync
```

---

## Master Link

**Package**: `secubox-master-link` + `luci-app-master-link`

Node onboarding and mesh joining.

![Master Link](../../screenshots/router/master-link.png)

### Features

- Easy node onboarding
- Join token generation
- Automatic configuration
- Trust establishment
- IPK package generation

### Onboarding Flow

```
1. Master: Generate join token
2. New node: Install join IPK
3. Automatic: WireGuard config
4. Automatic: Trust verification
5. Complete: Node joins mesh
```

### CLI

```bash
master-linkctl status         # Link status
master-linkctl generate       # Generate join token
master-linkctl join <token>   # Join mesh
master-linkctl nodes          # List nodes
```

---

## Identity

**Package**: `secubox-identity`

DID:plc generation and trust management.

### Features

- DID:plc generation
- Key rotation
- Trust scoring
- Cross-node verification
- Reputation system

### CLI

```bash
identityctl status            # Identity status
identityctl did               # Show DID
identityctl rotate            # Rotate keys
identityctl trust <peer>      # Trust peer
identityctl verify <peer>     # Verify peer
```

---

## OpenClaw

**Package**: `luci-app-openclaw`

OpenClaw VPN integration.

![OpenClaw](../../screenshots/router/openclaw.png)

### Features

- OpenClaw server connection
- NAT traversal
- Firewall bypass
- Automatic reconnection

---

## Configuration

### Enable Mesh Network

```bash
# Enable mesh daemon
uci set secubox-mesh.main.enabled='1'
uci set secubox-mesh.main.node_name='mynode'
uci commit secubox-mesh

# Start daemon
/etc/init.d/secuboxd enable
/etc/init.d/secuboxd start
```

### Configure WireGuard Mesh

```bash
# Create mesh interface
uci set network.wgmesh=interface
uci set network.wgmesh.proto='wireguard'
uci set network.wgmesh.private_key="$(wg genkey)"
uci set network.wgmesh.addresses='10.10.10.1/24'
uci commit network

# Add peer
wgctl add-peer node2 10.10.10.2
```

### Join Existing Mesh

```bash
# On master node
master-linkctl generate > join-token.txt

# On new node
master-linkctl join "$(cat join-token.txt)"
```

---

## Gate Election

The mesh automatically elects a "gate" node for internet access:

### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Bandwidth | 30% | Available bandwidth |
| Latency | 25% | Internet latency |
| Uptime | 20% | Node stability |
| Resources | 15% | CPU/RAM availability |
| Manual | 10% | Admin preference |

### Manual Override

```bash
# Force node as gate
secuboxctl set-gate <node>

# Disable gate election
uci set secubox-mesh.election.enabled='0'
uci commit secubox-mesh
```

---

## Troubleshooting

### Peer not discovered

```bash
# Check mDNS
avahi-browse -a | grep secubox

# Check WireGuard
wg show

# Force scan
secuboxctl scan
```

### Gate election failing

```bash
# Check election status
secuboxctl election status

# View scoring
secuboxctl election scores
```

---

See also:
- [Security Modules](Security.md)
- [Network Modules](Network.md)
- [Architecture](../Architecture.md)

---

*SecuBox v1.0.0*
