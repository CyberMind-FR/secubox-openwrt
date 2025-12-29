# Domoticz on SecuBox (Docker)

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

This guide documents the Domoticz (home automation) “app” packaged as `secubox-app-domoticz` plus its manifest-driven wizard entry.

---

## Installation

```sh
opkg update
opkg install secubox-app-domoticz luci-app-vhost-manager
/domoticzctl install
/etc/init.d/domoticz start
```

Then open **SecuBox → Wizard → App Wizards → Domoticz** to set data/devices paths or custom ports.

---

## UCI Config (`/etc/config/domoticz`)

```uci
config domoticz 'main'
    option enabled '1'
    option image 'domoticz/domoticz:latest'
    option data_path '/srv/domoticz'
    option devices_path '/srv/devices'
    option port '8080'
    option timezone 'UTC'
```

Adjust via `uci` or the wizard:
```sh
uci set domoticz.main.port='8181'
uci commit domoticz
/etc/init.d/domoticz restart
```

---

## CLI Helper (`/usr/sbin/domoticzctl`)

- `domoticzctl install` – checks Docker, prepares `/srv/domoticz`, pulls `domoticz/domoticz` image, enables service.  
- `domoticzctl check` – rerun storage/cgroup/Docker validation.  
- `domoticzctl update` – pull new image and restart if enabled.  
- `domoticzctl status/logs` – interact with the Docker container.  

---

## VHost & Profiles

- Use `scripts/vhostctl.sh add --domain ha.secubox.local --upstream http://127.0.0.1:<port>` to publish the web UI via HTTPS.  
- The manifest tags Domoticz for the **Gateway + DMZ** profile, ensuring DMZ isolation by default.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Container fails to start | Check `/srv/domoticz/config` permissions; ensure Docker is running. |
| No devices under `/srv/devices` | Mount your serial/Zigbee USB adapter and bind-mount it into the container as needed. |
| LuCI wizard fields empty | Confirm manifest at `/usr/share/secubox/plugins/domoticz/manifest.json` and rerun SecuBox wizard. |

Domoticz now follows the same manifest-driven workflow as Lyrion/Zigbee2MQTT, paving the way for a full “SecuBox Apps Store.”
