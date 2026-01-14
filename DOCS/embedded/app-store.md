# SecuBox App Store & Manifests

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

This guide outlines the “SecuBox Apps” registry format and the `secubox-app` CLI helper. The App Store currently ships manifests for Zigbee2MQTT, Lyrion Media Server, and Domoticz, with the workflow ready for additional Docker/LXC/native services.

---

## Manifest Layout (`plugins/catalog/<app>.json`)

Each app now ships a normalized JSON manifest under `plugins/catalog/<app-id>.json` (legacy `plugins/<app>/manifest.json` entries remain for backward compatibility). Example (Zigbee2MQTT):

```json
{
  "id": "zigbee2mqtt",
  "name": "Zigbee2MQTT",
  "category": "home-automation",
  "runtime": "docker",
  "maturity": "stable",
  "description": "Dockerized Zigbee gateway bridging Zigbee coordinators with MQTT brokers.",
  "source": {
    "homepage": "https://www.zigbee2mqtt.io/",
    "github": "https://github.com/CyberMind-FR/secubox-openwrt/tree/main/secubox-app-zigbee2mqtt"
  },
  "packages": ["secubox-app-zigbee2mqtt", "luci-app-zigbee2mqtt"],
  "capabilities": ["zigbee-gateway", "mqtt", "docker-runner"],
  "requirements": {
    "arch": ["arm64"],
    "min_ram_mb": 256,
    "min_storage_mb": 512
  },
  "hardware": { "usb": true, "serial": true },
  "network": {
    "inbound_ports": [8080],
    "protocols": ["http", "mqtt"],
    "outbound_only": false
  },
  "privileges": {
    "needs_usb": true,
    "needs_serial": true,
    "needs_net_admin": false
  },
  "ports": [{ "name": "frontend", "protocol": "http", "port": 8080 }],
  "volumes": ["/srv/zigbee2mqtt"],
  "wizard": {
    "uci": { "config": "zigbee2mqtt", "section": "main" },
    "fields": [
      { "id": "serial_port", "label": "Serial Port", "type": "text", "uci_option": "serial_port" },
      { "id": "mqtt_host", "label": "MQTT Host", "type": "text", "uci_option": "mqtt_host" },
      { "id": "mqtt_username", "label": "MQTT Username", "type": "text", "uci_option": "mqtt_username" },
      { "id": "mqtt_password", "label": "MQTT Password", "type": "password", "uci_option": "mqtt_password" },
      { "id": "base_topic", "label": "Base Topic", "type": "text", "uci_option": "base_topic" },
      { "id": "frontend_port", "label": "Frontend Port", "type": "number", "uci_option": "frontend_port" }
    ]
  },
  "profiles": { "recommended": ["home", "lab", "iot"] },
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
| `category` | One of: home-automation, networking, security, media, monitoring, storage, development, system, iot, radio, misc. |
| `runtime` | `docker`, `lxc`, `native`, or `hybrid`. |
| `packages` | List of OpenWrt packages to install/remove. |
| `requirements.arch` | Architectures supported by the app/runtime. |
| `requirements.min_ram_mb` / `requirements.min_storage_mb` | Conservative resource guidance for UI filters. |
| `actions.install/update/check/status` | Optional shell commands executed after opkg operations. |

**Optional keys**

- `ports`: Document exposed services for the App Store UI.
- `volumes`: Persistent directories (e.g., `/srv/zigbee2mqtt`).
- `network`: Connection hints (protocols, inbound ports, outbound-only flag).
- `hardware` / `privileges`: USB/serial/net_admin hints for wizards.
- `wizard`: UCI target plus the declarative field list consumed by the LuCI wizard.
- `profiles`: Tags to pre-load when applying OS-like profiles (e.g., `profiles.recommended` array).
- `capabilities`, `maturity`, `source`, `update.strategy`: Additional metadata for filter chips and CLI instructions.

---

## CLI Usage (`secubox-app`)

`secubox-app` is shipped as a standalone OpenWrt package (see `package/secubox/secubox-app`) and installs the CLI at `/usr/sbin/secubox-app`. Commands:

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

# Validate manifests (schema + requirements)
secubox-app validate
```

Environment variables:
- `SECUBOX_PLUGINS_DIR`: override manifest directory (default `../plugins`).

The CLI relies on `opkg` and `jsonfilter`, so run it on the router (or within the OpenWrt SDK). It is idempotent: reinstalling an already-installed app simply confirms package state and reruns optional install hooks.

---

## Packaged SecuBox Apps

`secubox-app-*` packages provide the runtime pieces behind each manifest (init scripts, helpers, and default configs). They are copied automatically by `secubox-tools/local-build.sh` into both firmware builds and the SDK feed, so developers get the same artifacts as the LuCI wizard and CLI.

| Package | Manifest ID | Purpose |
|---------|-------------|---------|
| `secubox-app-zigbee2mqtt` | `zigbee2mqtt` | Installs Docker runner + `zigbee2mqttctl`, exposes splash/log helpers, and ships default UCI config. |
| `secubox-app-lyrion` | `lyrion` | Deploys the Lyrion Media Server container, CLI (`lyrionctl`), and profile hooks for HTTPS publishing. |
| `secubox-app-domoticz` | `domoticz` | Provides Domoticz Docker automation (`domoticzctl`) and the base data/service layout consumed by the wizard. |

All three packages declare their dependencies (Docker, vhost manager, etc.) so `secubox-app install <id>` only has to orchestrate actions, not guess at required feeds.

- **Manifest QA**: run `secubox-app validate` before commits/releases to catch missing IDs, runtimes, or packages.
- **Specs refresh**: `python scripts/refresh-manifest-specs.py` re-applies shared architecture/min-spec heuristics so individual JSON files stay in sync.

---

## Future Integration

- LuCI App Store page will consume the same manifest directory to render cards, filters, and install buttons.
- Wizards will read the `wizard.steps` metadata to present guided forms.
- Profiles can bundle manifests with specific network modes (e.g., DMZ + Zigbee2MQTT + Lyrion).

For now, Zigbee2MQTT demonstrates the format. Additional manifests should follow the same schema to ensure the CLI and future UIs remain consistent.
