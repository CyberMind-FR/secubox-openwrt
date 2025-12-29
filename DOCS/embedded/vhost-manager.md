# VHost Manager & Reverse Proxy Notes

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

SecuBox ships `luci-app-vhost-manager` (LuCI dashboard + RPC backend) and now the `scripts/vhostctl.sh` helper so apps, wizards, and profiles can declaratively publish HTTP services behind nginx with optional TLS and HTTP auth.

---

## Prerequisites

1. **Packages**: `luci-app-vhost-manager` installed (installs RPCD script + LuCI UI) and nginx with SSL (`nginx-ssl`).  
2. **Certificates**: ACME via `acme.sh` (auto) or manual PEM files for `tls manual`.  
3. **Apps**: Ensure the upstream service listens on localhost or LAN (e.g., Zigbee2MQTT UI on `http://127.0.0.1:8080`).  
4. **Firewall**: Allow inbound 80/443 on the WAN interface.

---

## CLI (`scripts/vhostctl.sh`)

This helper manipulates `/etc/config/vhosts` and can be invoked by future wizards/App Store installers.

```sh
# List existing mappings
scripts/vhostctl.sh list

# Add HTTPS reverse proxy for Zigbee2MQTT UI
scripts/vhostctl.sh add \
  --domain zigbee.home.lab \
  --upstream http://127.0.0.1:8080 \
  --tls acme \
  --websocket \
  --enable

# Enable/disable or remove later
scripts/vhostctl.sh disable --domain zigbee.home.lab
scripts/vhostctl.sh remove --domain zigbee.home.lab

# Reload nginx after edits
scripts/vhostctl.sh reload
```

Options:

| Option | Purpose |
|--------|---------|
| `--domain` | Public hostname (required). |
| `--upstream` | Local service URL (`http://127.0.0.1:8080`). |
| `--tls off|acme|manual` | TLS strategy. Use `manual` + `--cert/--key` for custom certs. |
| `--auth-user/--auth-pass` | Enable HTTP basic auth. |
| `--websocket` | Add `Upgrade` headers for WebSocket apps. |
| `--enable` / `--disable` | Toggle without deleting. |

The script is idempotent: running `add` with an existing domain updates the entry.

---

## LuCI Dashboard

Navigate to **Services → SecuBox → VHost Manager** to:
- View active/disabled vhosts, TLS status, certificate expirations.
- Edit or delete entries, request ACME certificates, tail access logs.
- Use the form to create entries (domain, upstream, TLS, auth, WebSocket).

The LuCI backend writes to the same `/etc/config/vhosts` file, so changes from `vhostctl.sh` appear immediately.

---

## Example: Publish Zigbee2MQTT

1. Install Zigbee2MQTT (Docker) and confirm the UI listens on port 8080 (see `docs/embedded/zigbee2mqtt-docker.md`).  
2. Map it behind HTTPS:
   ```sh
   scripts/vhostctl.sh add \
     --domain zigbee.secubox.local \
     --upstream http://127.0.0.1:8080 \
     --tls acme \
     --websocket
   scripts/vhostctl.sh reload
   ```
3. (Optional) Use LuCI to request certificates and monitor logs.

---

## DMZ Mode + VHost Workflow

When enabling the new **Router + DMZ** network mode (admin → SecuBox → Network → Modes → DMZ):

1. Assign `eth2` (or another physical port) as the DMZ interface and give it a subnet such as `192.168.50.1/24`.  
2. Apply the mode; the backend creates a dedicated firewall zone (`dmz`) that only forwards to WAN.  
3. Connect servers (e.g., Lyrion, Zigbee2MQTT UI) to the DMZ port so they can reach the internet but cannot reach the LAN.  
4. Use `scripts/vhostctl.sh add ... --upstream http://192.168.50.10:32400` to expose the DMZ service through nginx with TLS.  

Rollback is one click away: use the Network Modes “Confirm / Rollback” dialog within the 2‑minute window to restore the previous configs automatically.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `scripts/vhostctl.sh add ...` errors “Unknown option” | Ensure busybox `sh` is used (`/bin/sh`). |
| ACME cert missing | Confirm `acme.sh` installed, domain resolves to router, 80/443 reachable. |
| 502/504 errors | Check upstream service, firewall, or change `--upstream` to LAN IP. |
| TLS manual mode fails | Provide full paths to PEM files and verify permissions. |
| Changes not visible | Run `scripts/vhostctl.sh reload` or `ubus call luci.vhost-manager reload_nginx`. |

---

## Automation Notes

- Wizards/App Store can shell out to `scripts/vhostctl.sh` to register services as they are installed.  
- Profiles can keep declarative manifests (domain → upstream) and call `vhostctl.sh add/remove` when switching modes.  
- `/etc/config/vhosts` remains the single source of truth, consumed by the LuCI app and the RPC backend.
