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
- `SecuBox_MirrorNetworking_Paradigm_Reversal.html` — EnigmaBox autopsy → MirrorNet zero-central-authority architecture. Dual transport (WireGuard + Yggdrasil), VoIP E2E (Asterisk), Matrix/Conduit messaging, did:plc identity, P2P gossip threat intel, Mirror concepts (Threat Intel, AI Inference, Reputation, Config & Updates). New packages: secubox-mirrornet (v0.19), secubox-identity (v0.19), secubox-voip (v1.0), secubox-matrix (v1.0), secubox-p2p-intel (v0.19), yggdrasil-secubox (v1.1+), luci-app-secubox-mirror (v0.19). Crowdfunding target: 2027.

- **Domoticz IoT Integration**
  Status: DONE (2026-02-04)
  Notes: `luci-app-domoticz` created with RPCD handler, LuCI overview (status, MQTT, Z2M, HAProxy, mesh, logs).
  `domoticzctl` enhanced with `configure-mqtt`, `configure-haproxy`, `backup/restore`, `mesh-register`, `uninstall`.
  UCI config extended with mqtt, network, mesh sections. Catalog updated with LuCI package and IoT tags.

## Next Up

1. **Metablogizer Upload Fixes** — Investigate failed uploads.
2. **App Store P2P Emancipation** — Remote P2P/torrent endpoint, generative IPK distribution.
3. Port chip header layout to client-guardian, auth-guardian.
4. Rebuild bonus feed with all 2026-02-04 changes.
5. Commit uncommitted working tree changes.

## Known Bugs (Deferred)

- **Tor Shield / opkg conflict**: opkg downloads fail (`wget returned 4`) when Tor Shield is active. Direct `wget` to full URL works. Likely DNS/routing interference from Tor split-routing. To be fixed later.

## Blockers / Risks

- No automated regression tests for LuCI views; manual verification required after each SCP deploy.
- Glances + Zigbee2MQTT + SMB/CIFS source changes uncommitted in working tree.
- Strategic AI + MirrorNetworking documents noted but not yet implemented (v0.18+ roadmap).
