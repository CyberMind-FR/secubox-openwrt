# LuCI App Master-Link

LuCI web interface for SecuBox Master-Link mesh management.

## Installation

```bash
opkg install luci-app-master-link
```

Requires `secubox-master-link` (pulled automatically as dependency).

## Access

**SecuBox > Mesh Management** in the LuCI menu.

## Tabs

### Overview

Adapts to the node's role:

- **Master**: Role badge, mesh stats (peers, depth, chain height), Generate Token button with QR-ready URL
- **Peer**: Role badge, upstream master info, own depth, sync status
- **Sub-master**: Upstream info + downstream peer count

### Join Requests (master/sub-master only)

- Table: hostname, IP, fingerprint, timestamp, status
- Actions: Approve, Reject, Promote to sub-master
- Auto-refresh every 10 seconds

### Mesh Tree

- Hierarchical view of master → peers → sub-masters → their peers
- Depth indicators and role badges
- Online/offline status per node

## RPCD Methods

All calls go through `luci.master_link` ubus object:

| Method | Description |
|--------|-------------|
| `status` | Node status and mesh stats |
| `peers` | List all peers with join details |
| `tree` | Mesh topology tree |
| `token_generate` | Create one-time join token |
| `approve` | Approve, reject, or promote a peer |
| `token_cleanup` | Remove expired tokens |

## Files

| File | Purpose |
|------|---------|
| `root/usr/share/luci/menu.d/luci-app-master-link.json` | Menu entry |
| `root/usr/share/rpcd/acl.d/luci-app-master-link.json` | ACL permissions |
| `root/usr/libexec/rpcd/luci.master_link` | RPCD endpoint |
| `htdocs/luci-static/resources/view/secubox/master-link.js` | LuCI view |

## License

Apache-2.0
