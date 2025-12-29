# SecuBox Wizard & Profiles

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

The SecuBox hub now includes a guided setup wizard (LuCI → SecuBox → Wizard) and profile system. Use them to finish the first-run checklist, review app manifests, and apply predefined OS-like configurations (Home, Lab, Hardened, Gateway + DMZ).

---

## First-Run Checklist

The wizard queries `luci.secubox`’s `first_run_status` ubus method to determine whether critical items are configured:

1. **Administrator password** – links to the LuCI password page.  
2. **Timezone** – dropdown populated with common timezones; applying calls `apply_first_run` with `{ timezone: "Europe/Paris" }`.  
3. **Storage path** – defaults to `/srv/secubox`; prepares the directory and stores it in `uci set secubox.main.storage_path`.  
4. **Network mode** – uses the existing Network Modes RPC to switch between `router` and `dmz` presets.

Each action can be run independently and is idempotent.

---

## App Wizards (Manifests)

Apps ship manifests under `/usr/share/secubox/plugins/<id>/manifest.json`. `secubox-app` (installed at `/usr/sbin/secubox-app`) uses the same manifests for CLI installs, and the wizard consumes the `wizard.fields` section to build forms. Example snippet:

```json
{
  "id": "zigbee2mqtt",
  "wizard": {
    "uci": { "config": "zigbee2mqtt", "section": "main" },
    "fields": [
      { "id": "serial_port", "label": "Serial Port", "uci_option": "serial_port" },
      { "id": "mqtt_host", "label": "MQTT Host", "uci_option": "mqtt_host" }
    ]
  }
}
```

Clicking “Configure” opens a modal that writes the provided values into the specified UCI section.

---

## Profiles

Profiles are stored as JSON in `/usr/share/secubox/profiles/` and can bundle:

- `network_mode`: target SecuBox network mode (`router`, `dmz`, …)  
- `apps`: manifest IDs to install via `secubox-app install <id>`  
- `packages`: additional packages to ensure via opkg/apk  
- `uci`: array of `{config, section, option, value}` entries applied via UCI

Baseline profiles:

| ID | Description | Highlights |
|----|-------------|------------|
| `home` | Home router + Zigbee2MQTT | Router mode, installs Zigbee2MQTT + Netdata |
| `lab` | Monitoring lab | Router mode, ensures Netifyd & Bandwidth Manager |
| `hardened` | Security-focused | Enables CrowdSec + Client Guardian |
| `gateway_dmz` | Router + DMZ segment | Switches to DMZ mode and enables VHost manager |
| `lxc_base` | (Upcoming) baseline LXC container | Reserved for future `secubox-lxc` integrations |

`apply_profile` automatically tars `/etc/config` to `/etc/secubox-profiles/backups/` before modifying settings, so the **Rollback last profile** button (or `rollback_profile` RPC) instantly restores prior UCI files.

---

## CLI References

- `secubox-app list|install|status` – manage app manifests (installed by `luci-app-secubox`).  
- `ubus call luci.secubox list_profiles` – enumerate available profile manifests.  
- `ubus call luci.secubox apply_profile '{"profile_id":"home"}'` – apply a preset programmatically.  
- `secubox-app` respects `SECUBOX_PLUGINS_DIR` if you need to point to custom manifest trees.

Combine the wizard UI with these commands to automate deployments or build higher-level orchestration (e.g., App Store pages, onboarding scripts).
