# SecuBox API Reference

RPCD/ubus API documentation for SecuBox OpenWrt modules.

---

## Overview

SecuBox modules expose APIs via OpenWrt's RPCD (Remote Procedure Call Daemon) system. These APIs are accessible via:

- **ubus** - Direct CLI access
- **HTTP** - LuCI JSON-RPC endpoint
- **JavaScript** - LuCI rpc.declare()

## Authentication

Most APIs require LuCI authentication. The `luci-app-secubox-*` ACL files define read/write permissions.

```bash
# Check available methods
ubus list | grep luci.secubox

# List methods for a service
ubus -v list luci.secubox-mesh
```

---

## Core APIs

### luci.secubox-mesh

Mesh network management.

| Method | Params | Description |
|--------|--------|-------------|
| `status` | - | Get mesh daemon status |
| `peers` | - | List connected peers |
| `topology` | - | Get mesh topology graph |
| `nodes` | - | List all known nodes |
| `node_info` | `did` | Get node details |
| `node_rotate` | - | Rotate node identity |
| `telemetry` | - | Get system telemetry |
| `ping` | `target` | Ping a mesh peer |
| `get_config` | - | Get mesh configuration |
| `set_config` | `key`, `value` | Update configuration |
| `restart` | - | Restart mesh daemon |

**Example:**

```bash
# Get mesh status
ubus call luci.secubox-mesh status

# Response:
{
    "running": true,
    "node_did": "did:plc:abc123...",
    "role": "peer",
    "mesh_state": "connected",
    "peer_count": 3,
    "uptime": 86400
}
```

### luci.secubox

Core SecuBox management.

| Method | Params | Description |
|--------|--------|-------------|
| `status` | - | System status overview |
| `version` | - | Version information |
| `apps_list` | - | Installed apps catalog |
| `apps_install` | `name` | Install an app |
| `apps_remove` | `name` | Remove an app |
| `first_run` | - | First run wizard status |

---

## Security APIs

### luci.crowdsec-dashboard

CrowdSec IDS/IPS integration.

| Method | Params | Description |
|--------|--------|-------------|
| `status` | - | CrowdSec service status |
| `get_overview` | - | Cached stats overview |
| `refresh_overview_cache` | - | Force cache refresh |
| `get_alerts` | `limit` | Recent alerts |
| `get_decisions` | - | Active ban decisions |
| `get_bouncers` | - | Registered bouncers |
| `ban_ip` | `ip`, `duration` | Manually ban an IP |
| `unban_ip` | `ip` | Remove ban decision |

### luci.mitmproxy

WAF/TLS proxy management.

| Method | Params | Description |
|--------|--------|-------------|
| `status` | - | Proxy status |
| `get_requests` | `limit` | Recent requests |
| `get_threats` | - | Detected threats |
| `get_stats` | - | Traffic statistics |
| `clear_cache` | - | Clear request cache |

---

## Network APIs

### luci.haproxy

Load balancer management.

| Method | Params | Description |
|--------|--------|-------------|
| `status` | - | HAProxy status |
| `get_vhosts` | - | List virtual hosts |
| `vhost_add` | `domain`, `backend` | Add vhost |
| `vhost_remove` | `domain` | Remove vhost |
| `get_backends` | - | List backends |
| `get_stats` | - | Connection stats |
| `reload` | - | Reload configuration |

### luci.wireguard-dashboard

WireGuard VPN management.

| Method | Params | Description |
|--------|--------|-------------|
| `status` | - | WireGuard status |
| `get_interfaces` | - | List WG interfaces |
| `get_peers` | `interface` | List peers |
| `add_peer` | `interface`, `pubkey`, `endpoint` | Add peer |
| `remove_peer` | `interface`, `pubkey` | Remove peer |
| `generate_keys` | - | Generate keypair |
| `get_qr` | `interface`, `peer` | Get QR code config |

---

## Monitoring APIs

### luci.netdata-dashboard

System monitoring integration.

| Method | Params | Description |
|--------|--------|-------------|
| `status` | - | Netdata status |
| `get_metrics` | `chart` | Get chart data |
| `get_alarms` | - | Active alarms |

### luci.metrics-dashboard

Quick metrics overview.

| Method | Params | Description |
|--------|--------|-------------|
| `get_cached_status` | - | Cached system metrics |
| `refresh_cache` | - | Force cache update |

---

## Publishing APIs

### luci.metablogizer

Static site generator.

| Method | Params | Description |
|--------|--------|-------------|
| `status` | - | Service status |
| `list_sites` | - | List all sites |
| `get_site` | `name` | Get site details |
| `create_site` | `name`, `domain`, `template` | Create site |
| `delete_site` | `name` | Delete site |
| `publish` | `name` | Publish to HAProxy |
| `upload` | `name`, `file`, `content` | Upload file |

### luci.streamlit-forge

Streamlit app management.

| Method | Params | Description |
|--------|--------|-------------|
| `status` | - | Forge status |
| `list_apps` | - | List all apps |
| `create_app` | `name`, `template` | Create app |
| `start_app` | `name` | Start app |
| `stop_app` | `name` | Stop app |
| `delete_app` | `name` | Delete app |
| `expose` | `name`, `domain` | Expose via HAProxy |

---

## JavaScript Usage

In LuCI views:

```javascript
'use strict';
'require rpc';

var callMeshStatus = rpc.declare({
    object: 'luci.secubox-mesh',
    method: 'status',
    expect: {}  // Return full response
});

return view.extend({
    load: function() {
        return callMeshStatus();
    },
    render: function(data) {
        // data contains the mesh status
        return E('div', {}, [
            E('span', {}, 'Peer count: ' + data.peer_count)
        ]);
    }
});
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `-32002` | Access denied (check ACL) |
| `-32600` | Invalid request |
| `-32601` | Method not found |
| `-32602` | Invalid params |
| `-32700` | Parse error |

---

## ACL Configuration

ACL files: `/usr/share/rpcd/acl.d/luci-app-*.json`

```json
{
    "luci-app-example": {
        "description": "Example module",
        "read": {
            "ubus": {
                "luci.example": ["status", "list"]
            }
        },
        "write": {
            "ubus": {
                "luci.example": ["create", "delete"]
            }
        }
    }
}
```

---

*SecuBox API Reference v1.0*
