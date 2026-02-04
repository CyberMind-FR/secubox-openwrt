# Work In Progress (Claude)

## Active Threads

- **SMB/CIFS Remote Mount Manager**
  Status: DONE — package created (2026-02-04)
  Notes: New `secubox-app-smbfs` package with `smbfsctl` CLI, UCI config, init script, catalog entry.
  Integrates with Jellyfin and Lyrion media paths.

- **Jellyfin README**
  Status: DONE (2026-02-04)
  Notes: KISS READMEs created for both `secubox-app-jellyfin` and `luci-app-jellyfin`.

- **Glances Full System Monitoring**
  Status: COMPLETE (2026-02-04)
  Notes: LXC host bind mounts, Docker socket, fs plugin patch, hostname/OS identity.

- **Zigbee2mqtt LXC Rewrite**
  Status: COMPLETE (2026-02-04)
  Notes: Direct `/dev/ttyUSB0` passthrough, adapter `ezsp`→`ember`, `ZIGBEE2MQTT_DATA` env var.

## Strategic Documents Received

- `SecuBox_LocalAI_Strategic_Analysis.html` — AI Management Layer roadmap (LocalAI 3.9 + LocalAGI + MCP).
- `SecuBox_AI_Gateway_Hybrid_Architecture.html` — Hybrid Local/Cloud architecture (LiteLLM + Data Classifier + multi-provider).

## Next Up

1. **Domoticz IoT Integration** — LuCI app, MQTT auto-bridge, zigbee2mqtt integration, P2P mesh.
2. **Metablogizer Upload Fixes** — Investigate failed uploads.
3. **App Store P2P Emancipation** — Remote P2P/torrent endpoint, generative IPK distribution.
4. Port chip header layout to client-guardian, auth-guardian.
5. Rebuild bonus feed with all 2026-02-04 changes.
6. Commit uncommitted working tree changes (bonus-feed IPKs, glancesctl, zigbee2mqttctl, smbfs, jellyfin READMEs).

## Blockers / Risks

- No automated regression tests for LuCI views; manual verification required after each SCP deploy.
- Glances + Zigbee2MQTT + SMB/CIFS source changes uncommitted in working tree.
- Strategic AI documents noted but not yet implemented (v0.18+ roadmap).
