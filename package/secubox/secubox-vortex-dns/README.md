# SecuBox Vortex DNS

Meshed multi-dynamic subdomain delegation system.

## Architecture

```
MASTER (*.secubox.io)
├── SLAVE node1.secubox.io
│   └── services: git.node1.secubox.io, web.node1.secubox.io
├── SUBMASTER region1.secubox.io
│   ├── SLAVE a.region1.secubox.io
│   └── SLAVE b.region1.secubox.io
└── SLAVE node2.secubox.io
```

## Features

- **Wildcard Delegation**: Master owns `*.domain`, delegates subzones to slaves
- **First Peek**: Services auto-register when discovered on mesh
- **Gossip Sync**: Exposure configs propagate via P2P mesh
- **Submastering**: Hierarchical delegation (master → submaster → slaves)
- **Multi-Provider**: OVH, Gandi, Cloudflare via dns-provider

## CLI Reference

```bash
# Master operations
vortexctl master init secubox.io          # Initialize as master
vortexctl master delegate 192.168.1.100 node1  # Delegate subzone
vortexctl master list-slaves              # List delegated zones

# Slave operations
vortexctl slave join <master_ip> <token>  # Join master hierarchy
vortexctl slave status                    # Show slave status

# Mesh operations
vortexctl mesh status                     # Mesh DNS status
vortexctl mesh sync                       # Force sync with peers
vortexctl mesh publish <service> <domain> # Publish to mesh

# General
vortexctl status                          # Overall status
vortexctl daemon                          # Run sync daemon
```

## Configuration

```uci
config vortex 'main'
    option enabled '1'
    option mode 'master|slave|submaster|standalone'
    option sync_interval '300'

config master 'master'
    option enabled '1'
    option wildcard_domain 'secubox.io'
    option dns_provider 'ovh'
    option auto_delegate '1'

config slave 'slave'
    option enabled '0'
    option parent_master '192.168.1.1'
    option delegated_zone 'node1'

config mesh 'mesh'
    option gossip_enabled '1'
    option first_peek '1'
    option auto_register '1'
```

## Part of SecuBox v0.19 MirrorNetworking Layer
