# Work In Progress (Claude)

## Active Threads

- **Zigbee2mqtt LXC Rewrite**
  Status: COMPLETE (2026-02-04)
  Notes: Rewritten from Docker to LXC Alpine container. Feed rebuilt.
  Deploy fix (2026-02-04): adapter `ezsp`→`ember` (z2m 2.x rename), added `ZIGBEE2MQTT_DATA` env var to start script, added `mosquitto-nossl` dependency. Direct `/dev/ttyUSB0` passthrough works; socat TCP bridge does NOT work (ASH RSTACK timeout).

- **Jellyfin Media Server**
  Status: COMPLETE (2026-02-04)
  Notes: New secubox-app-jellyfin + luci-app-jellyfin with LXC, HAProxy integration, uninstall/update/backup.

- **Device Intel & DNS Provider**
  Status: COMPLETE (2026-02-04)
  Notes: New packages added. BusyBox compatibility, OUI emoji display, SDK build pattern aligned.

- **Exposure KISS Redesign**
  Status: COMPLETE (2026-02-04)
  Notes: Enriched service names, vhost integration, DNS domain sorting, toggle switch fix.

- **Streamlit Upload Fixes**
  Status: COMPLETE (2026-02-04)
  Notes: Chunked upload (uhttpd 64KB limit), UTF-8 fix, ZIP requirements auto-install, rename support.

## Next Up

- Port the chip header layout to remaining SecuBox derivative apps (client-guardian, auth-guardian) — still pending, neither has `sh-page-header` pattern.
- Rebuild bonus feed with all 2026-02-04 changes (partially done — zigbee2mqtt and device-intel included, verify completeness).
- Commit uncommitted working tree changes (bonus-feed IPKs, zigbee2mqttctl).

## Blockers / Risks

- Cyberpunk theme is now exposed in Settings UI (dark/light/system/cyberpunk) — previous blocker resolved.
- No automated regression tests for LuCI views; manual verification required after each SCP deploy.
- `zigbee2mqttctl` has uncommitted changes in working tree.
