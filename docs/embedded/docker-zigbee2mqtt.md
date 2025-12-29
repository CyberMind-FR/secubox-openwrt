# Docker Zigbee2MQTT on OpenWrt ARM64

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

This guide explains how to deploy Zigbee2MQTT on SecuBox (OpenWrt ARM64) using the new `secubox-app-zigbee2mqtt` package. The workflow follows upstream guidance from zigbee2mqtt.io while respecting OpenWrt storage constraints, UCI configuration, and procd supervision.

---

## Prerequisites

- OpenWrt 24.10.x (or newer) ARM64 build with SecuBox feeds.
- Internet connectivity to fetch Docker images.
- USB coordinator exposed as `/dev/ttyACM0` (e.g., Sonoff Zigbee 3.0 dongle). Load `kmod-usb-acm`.
- At least 200 MB free on overlay or external storage mounted at `/srv`.
- Cgroups v1/v2 enabled (verify `/sys/fs/cgroup` exists). Run `scripts/diagnose.sh` for sanity checks.

---

## Installation Steps

1. **Install the package:**
   ```sh
   opkg update
   opkg install secubox-app-zigbee2mqtt
   ```

2. **Bootstrap prerequisites (Docker, storage, config):**
   ```sh
   zigbee2mqttctl install
   ```
   This command will:
   - verify kernel modules, cgroups, USB device, and storage
   - install `dockerd`, `docker`, `containerd`, and `kmod-usb-acm`
   - create `/srv/zigbee2mqtt/data` with `configuration.yaml`
   - pull `ghcr.io/koenkk/zigbee2mqtt:latest`
   - enable `/etc/init.d/zigbee2mqtt`

3. **Configure UCI (optional adjustments):**
   ```sh
   uci set zigbee2mqtt.main.serial_port='/dev/ttyACM0'
   uci set zigbee2mqtt.main.mqtt_host='mqtt://192.168.8.10:1883'
   uci set zigbee2mqtt.main.mqtt_username='secubox'
   uci set zigbee2mqtt.main.mqtt_password='secret'
   uci commit zigbee2mqtt
   ```

4. **Start the service:**
   ```sh
   /etc/init.d/zigbee2mqtt start
   ```
   The procd service executes `docker run` in foreground mode and respawns automatically.

5. **Check logs and status:**
   ```sh
   zigbee2mqttctl status
   zigbee2mqttctl logs -f
   ```

6. **Upgrade to the latest image:**
   ```sh
   zigbee2mqttctl update
   ```
   This pulls the latest container and restarts the service if enabled.

---

## Files & Services

| Path | Purpose |
|------|---------|
| `/etc/config/zigbee2mqtt` | UCI configuration (serial port, MQTT, base topic, frontend port, data path). |
| `/etc/init.d/zigbee2mqtt` | procd wrapper that invokes `zigbee2mqttctl service-run`. |
| `/usr/sbin/zigbee2mqttctl` | Management CLI for install/check/update/status/logs. |
| `/srv/zigbee2mqtt/data` | Persistent Zigbee2MQTT state (configuration.yaml, database). |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `zigbee2mqttctl install` reports missing cgroups | Ensure `/sys/fs/cgroup` exists and cgroups are enabled in kernel config. |
| `/dev/ttyACM0` not found | Load `kmod-usb-acm` and reconnect the Zigbee dongle; verify with `ls -l /dev/ttyACM*`. |
| Docker fails to start due to low space | Move `/srv/zigbee2mqtt` to an external drive or free overlay space (`df -h`). |
| MQTT authentication errors | Update `mqtt_username`/`mqtt_password` via UCI and restart service. |
| Port conflict on 8080 | Change `frontend_port` in UCI, then `/etc/init.d/zigbee2mqtt restart`. |

Run `scripts/diagnose.sh` for aggregated checks (storage, cgroups, firewall sanity). Use `scripts/smoke_test.sh` to quickly start/stop the Zigbee2MQTT service and verify Docker state.

---

## Rollback / Uninstall

1. Stop and disable the service:
   ```sh
   /etc/init.d/zigbee2mqtt stop
   /etc/init.d/zigbee2mqtt disable
   ```
2. Remove the container image (optional):
   ```sh
   docker rm -f secbx-zigbee2mqtt 2>/dev/null
   docker rmi ghcr.io/koenkk/zigbee2mqtt:latest
   ```
3. Remove package:
   ```sh
   opkg remove secubox-app-zigbee2mqtt
   ```
4. Clean data directory if no longer needed:
   ```sh
   rm -rf /srv/zigbee2mqtt
   ```

Reinstall later by reinstalling the package and rerunning `zigbee2mqttctl install`.
