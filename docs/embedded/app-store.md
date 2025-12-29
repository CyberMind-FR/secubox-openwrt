# SecuBox App Store & Manifests

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

This guide outlines the initial “SecuBox Apps” registry format and the `secubox-app` CLI helper. It currently ships with manifests for Zigbee2MQTT and Lyrion, and easily scales to other Docker/LXC/native services.

---

## Manifest Layout (`plugins/<app>/manifest.json`)

Each plugin folder contains a `manifest.json`. Example (Zigbee2MQTT):

```json
{
  "id": "zigbee2mqtt",
  "name": "Zigbee2MQTT",
  "type": "docker",
  "description": "Dockerized Zigbee gateway",
  "packages": ["secubox-app-zigbee2mqtt", "luci-app-zigbee2mqtt"],
  "ports": [{ "name": "frontend", "protocol": "http", "port": 8080 }],
  "volumes": ["/srv/zigbee2mqtt"],
  "network": { "default_mode": "lan", "dmz_supported": true },
  "wizard": {
    "uci": { "config": "zigbee2mqtt", "section": "main" },
    "fields": [
      { "id": "serial_port", "label": "Serial Port", "type": "text", "uci_option": "serial_port", "placeholder": "/dev/ttyACM0" },
      { "id": "mqtt_host", "label": "MQTT Host", "type": "text", "uci_option": "mqtt_host", "placeholder": "mqtt://127.0.0.1:1883" },
      { "id": "mqtt_username", "label": "MQTT Username", "type": "text", "uci_option": "mqtt_username" },
      { "id": "mqtt_password", "label": "MQTT Password", "type": "password", "uci_option": "mqtt_password" },
      { "id": "base_topic", "label": "Base Topic", "type": "text", "uci_option": "base_topic" },
      { "id": "frontend_port", "label": "Frontend Port", "type": "number", "uci_option": "frontend_port" }
    ]
  },
  "profiles": ["home", "lab"],
  "actions": {
    "install": "zigbee2mqttctl install",
    "check": "zigbee2mqttctl check",
    "update": "zigbee2mqttctl update",
    "status": "/etc/init.d/zigbee2mqtt status"
  }
}
```

**Required keys**

| Key | Purpose |
|-----|---------|
| `id` | Unique identifier used by the CLI (`secubox-app install <id>`). |
| `name` / `description` | Display metadata. |
| `type` | `docker`, `lxc`, or `native`. |
| `packages` | List of OpenWrt packages to install/remove. |
| `actions.install/update/check/status` | Optional shell commands executed after opkg operations. |

**Optional keys**

- `ports`: Document exposed services for the App Store UI.
- `volumes`: Persistent directories (e.g., `/srv/zigbee2mqtt`).
- `network`: Defaults + whether DMZ mode is supported.
- `wizard`: Declarative form metadata (`uci.config`, `uci.section`, `fields[*].uci_option`).
- `profiles`: Tags to pre-load when applying OS-like profiles.

---

## CLI Usage (`secubox-app`)

`luci-app-secubox` installs the CLI as `/usr/sbin/secubox-app` (also available under `secubox-tools/` for development). Commands:

```bash
# List manifests
secubox-app list

# Inspect raw manifest
secubox-app show zigbee2mqtt

# Install packages + run install action
secubox-app install zigbee2mqtt

# Run status command (if defined)
secubox-app status zigbee2mqtt

# Update or remove
secubox-app update zigbee2mqtt
secubox-app remove zigbee2mqtt
```

Environment variables:
- `SECUBOX_PLUGINS_DIR`: override manifest directory (default `../plugins`).

The CLI relies on `opkg` and `jsonfilter`, so run it on the router (or within the OpenWrt SDK). It is idempotent: reinstalling an already-installed app simply confirms package state and reruns optional install hooks.

---

## Future Integration

- LuCI App Store page will consume the same manifest directory to render cards, filters, and install buttons.
- Wizards will read the `wizard.steps` metadata to present guided forms.
- Profiles can bundle manifests with specific network modes (e.g., DMZ + Zigbee2MQTT + Lyrion).

For now, Zigbee2MQTT demonstrates the format. Additional manifests should follow the same schema to ensure the CLI and future UIs remain consistent.
