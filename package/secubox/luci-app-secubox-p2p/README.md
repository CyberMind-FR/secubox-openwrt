# LuCI SecuBox P2P Hub

LuCI web interface for SecuBox peer-to-peer mesh management, peer discovery, and distributed services.

## Installation

```bash
opkg install luci-app-secubox-p2p
```

## Access

LuCI > SecuBox > MirrorBox

## Tabs

- **Overview** -- P2P network status summary
- **P2P Hub** -- Central hub management and connectivity
- **Peers** -- Discovered peers and connection status
- **Services** -- Distributed services across the mesh
- **Profiles** -- Peer identity and profile configuration
- **Mesh Network** -- Mesh topology and routing
- **Factory** -- Device provisioning and Gitea backup integration
- **Settings** -- P2P network configuration

## Dependencies

- `luci-base`
- `secubox-p2p`

## License

Apache-2.0
