# Docker Zigbee2MQTT on OpenWrt ARM64

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

This guide explains how to deploy the SecuBox Zigbee2MQTT “app” (Docker-based) on OpenWrt ARM64 targets. It uses the `secubox-app-zigbee2mqtt` package (installer, CLI, procd service) together with the LuCI frontend (`luci-app-zigbee2mqtt`).

---

## Prerequisites

1. **OpenWrt 24.10.x ARM64** (ESPRESSObin, MOCHAbin, RPi4, etc.) with ≥ 256 MB free storage (Docker image + data dir).  
2. **Kernel features**: cgroups (`/sys/fs/cgroup`), USB CDC ACM (`kmod-usb-acm`).  
3. **Hardware**: Zigbee coordinator presented as `/dev/ttyACM0` (e.g., SONOFF ZBDongle-E/MG21).  
4. **Network**: Reachable MQTT broker (local Mosquitto or remote `mqtt://host:1883`).  
5. **Package feeds**: `docker`, `dockerd`, `containerd` available (`opkg update`).

---

## Installation Steps

```sh
opkg update
opkg install secubox-app-zigbee2mqtt luci-app-zigbee2mqtt
```

1. **Run prerequisite installer** (checks storage, cgroups, USB, installs Docker, pulls image, enables service):
   ```sh
   zigbee2mqttctl install
   ```
2. **Start the service**:
   ```sh
   /etc/init.d/zigbee2mqtt start   # enable automatically via installer
   ```
3. **LuCI configuration** (optional UI flow): Services → SecuBox → Zigbee2MQTT. Adjust serial port, MQTT host/credentials, base topics, etc., then click “Apply”.

The installer writes persistent data under `/srv/zigbee2mqtt/data` (config + DB) and exposes the Zigbee2MQTT web UI on port `8080` by default.

---

## Command-Line Reference (`/usr/sbin/zigbee2mqttctl`)

| Command | Description |
|---------|-------------|
| `install` | Full prerequisite setup (Docker packages, data dir, image pull, enable service). |
| `check` | Rerun prerequisite checks (storage, cgroups, USB module, serial device). |
| `update` | Pull the latest Zigbee2MQTT image and restart the enabled service. |
| `status` | Show Docker container status (`docker ps` filter). |
| `logs [-f]` | Stream Docker logs for the container. |
| `service-run` / `service-stop` | Internal commands used by the procd init script; not for manual invocation. |

All commands must be run as root.

---

## UCI Configuration (`/etc/config/zigbee2mqtt`)

```uci
config zigbee2mqtt 'main'
	option enabled '1'
	option serial_port '/dev/ttyACM0'
	option mqtt_host 'mqtt://127.0.0.1:1883'
	option mqtt_username ''
	option mqtt_password ''
	option base_topic 'zigbee2mqtt'
	option frontend_port '8080'
	option channel '11'
	option image 'ghcr.io/koenkk/zigbee2mqtt:latest'
	option data_path '/srv/zigbee2mqtt'
	option timezone 'UTC'
```

Edit via `uci` or the LuCI form; commit changes to restart automatically:
```sh
uci set zigbee2mqtt.main.mqtt_host='mqtt://192.168.1.10:1883'
uci commit zigbee2mqtt
/etc/init.d/zigbee2mqtt restart
```

---

## Validation & Smoke Tests

- Quick prerequisite check:
  ```sh
  zigbee2mqttctl check
  ```
- Repository smoke test (runs service start/stop + optional MQTT pub/sub):
  ```sh
  ./scripts/smoke_test.sh
  ```
- Diagnostics bundle (general SecuBox):
  ```sh
  ./scripts/diagnose.sh
  ```

---

## Troubleshooting

| Symptom | Resolution |
|---------|------------|
| `zigbee2mqttctl install` reports “/sys/fs/cgroup missing” | Enable cgroups in kernel config or upgrade to a build with cgroup support. |
| USB coordinator not detected | Ensure `kmod-usb-acm` is installed, `cdc_acm` module loaded (`lsmod | grep cdc_acm`), and device appears under `/dev/ttyACM*`. Replug the dongle. |
| Docker not starting | Check `/etc/init.d/dockerd status`. If `docker info` fails, inspect `/var/log/messages` for storage driver errors. |
| MQTT authentication failures | Set `mqtt_username`/`mqtt_password` via UCI or LuCI and restart the service. |
| Port 8080 already used | Change `frontend_port` in UCI, commit, restart service. Update vhost mappings accordingly. |

---

## Uninstall / Cleanup

```sh
/etc/init.d/zigbee2mqtt stop
/etc/init.d/zigbee2mqtt disable
docker rm -f secbx-zigbee2mqtt 2>/dev/null
opkg remove luci-app-zigbee2mqtt secubox-app-zigbee2mqtt
rm -rf /srv/zigbee2mqtt
```

---

## Next Steps

- Use `luci-app-vhost-manager` to publish the Zigbee2MQTT UI under HTTPS (see `luci-app-vhost-manager/README.md`).  
- Integrate with the forthcoming SecuBox App Store by adding a manifest entry referencing this installer.  
- Combine with profiles/wizards once those components are introduced per the project roadmap.
