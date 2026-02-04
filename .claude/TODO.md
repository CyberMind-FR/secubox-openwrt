# SecuBox TODOs (Claude Edition)

_Last updated: 2026-02-04_

## Resolved

- ~~Expose cyberpunk option inside SecuBox Settings~~ — Done: `THEME_CHOICES` now includes `cyberpunk` in `settings.js`.
- ~~Glances full system monitoring~~ — Done: LXC host bind mounts, Docker socket, fs plugin patch, hostname/OS identity (2026-02-04).
- ~~Zigbee2MQTT dongle connection~~ — Done: adapter `ezsp`→`ember`, `ZIGBEE2MQTT_DATA` env var, direct `/dev/ttyUSB0` passthrough (2026-02-04).

## Open

1. **Chip Header Layout Migration**
   - Port `sh-page-header` + `renderHeaderChip()` pattern to client-guardian and auth-guardian.
   - Both still use legacy header layouts (`cg-header`, `ag-hdr`).

2. **Navigation Component**
   - Convert `SecuNav.renderTabs()` into a reusable LuCI widget (avoid duplicating `Theme.init` in each view).
   - Provide a compact variant for nested modules (e.g., CDN Cache, Network Modes).

3. **Monitoring UX**
   - Add empty-state copy while charts warm up.
   - Display bandwidth units dynamically (Kbps/Mbps/Gbps) based on rate.

4. **MAC Guardian Feed Integration**
   - Build and include mac-guardian IPK in bonus feed (new package from 2026-02-03, not yet in feed).

5. **Mesh Onboarding Testing**
   - master-link dynamic join IPK generation needs end-to-end testing on multi-node mesh.
   - P2P decentralized threat intelligence sharing needs validation with real CrowdSec alerts.

6. **WAF Auto-Ban Tuning**
   - Sensitivity thresholds may need adjustment based on real traffic patterns.
   - CVE detection patterns (including CVE-2025-15467) need false-positive analysis.

7. **Image Builder Validation**
   - `secubox-tools/` image builder and sysupgrade scripts (added 2026-02-03) need testing on physical hardware.

8. **Docs & Tooling**
   - Document deployment scripts in `README.md` (what each script copies).
   - Add lint/upload pre-check (LuCI `lua -l luci.dispatcher`) to prevent syntax errors before SCP.

9. **Testing**
   - Capture screenshot baselines for dark/light/cyberpunk themes.
   - Automate browser cache busting (append `?v=<git sha>` to view URLs).

10. **SMB/CIFS Shared Remote Directories**
    - Implement smbfs/cifs mount management for shared remote directories.
    - Media handling: backups, sources, Lyrion music library, Jellyfin media paths.
    - UCI config + LuCI UI for mount management (credentials, auto-mount, mount points).
    - Integration hooks for media apps (Jellyfin, Lyrion, backup scripts).

11. **Metablogizer Upload Failures**
    - Investigate and fix failed file uploads in Metablogizer.
    - May be related to uhttpd 64KB JSON limit (similar to Streamlit fix).

12. **SecuBox v2 Roadmap & Objectives**
    - EnigmaBox integration evaluation (community vote?).
    - VoIP integration (SIP/WebRTC).
    - Domoticz home automation integration.
    - SSMTP / mail host / MX record management.
    - Reverse MWAN WireGuard peers (multi-WAN failover over mesh).
    - Nextcloud self-hosted cloud storage.
    - Version v2 release planning and feature prioritization.

    **AI Management Layer** (ref: `SecuBox_LocalAI_Strategic_Analysis.html`):
    - Phase 1 (v0.18): Upgrade LocalAI → 3.9, MCP Server, Threat Analyst agent, DNS Guard migration.
    - Phase 2 (v0.19): CVE Triage + Network Anomaly agents, LocalRecall memory, AI Insights dashboard.
    - Phase 3 (v1.0): Config Advisor (ANSSI prep), P2P Mesh Intelligence, Factory auto-provisioning.
    - Hybrid approach: Ollama (inference) + LocalAI (orchestrator) + LocalAGI (agents) + LocalRecall (memory).
    - MCP tools: crowdsec.alerts, waf.logs, dns.queries, network.flows, system.metrics, wireguard.status, uci.config.

    **AI Gateway Hybrid Architecture** (ref: `SecuBox_AI_Gateway_Hybrid_Architecture.html`):
    - `secubox-ai-gateway` package: LiteLLM Proxy (port 4000) + Data Classifier + MCP Server.
    - Data classification: LOCAL ONLY (raw network data) / SANITIZED (IPs scrubbed) / CLOUD DIRECT (generic).
    - Providers: Mistral (EU sovereign, priority 1) > Claude > GPT > Gemini > xAI (all opt-in).
    - Offline resilience: Local tier always active, cloud is bonus not dependency.
    - Budget cap: configurable monthly cloud spend limit via LiteLLM.
    - ANSSI CSPN: Data Classifier + Mistral EU + offline mode = triple sovereignty proof.

13. **Punk Exposure Multi-Domain DNS**
    - Multi-domain DNS with P2P exposure and Tor endpoints.
    - Classical HTTPS endpoint (DNS provider API: OVH, Gandi, Cloudflare).
    - Administrable DNS provider API integration via `dnsctl`.
    - Mapped to local services, mesh-federated, locally tweakable.
    - Follows Peek / Poke / Emancipate model (see `PUNK-EXPOSURE.md`).

14. **Jellyfin Post-Install**
    - Complete startup wizard (media library configuration).
    - ~~README documentation~~ — Done (2026-02-04).

15. **Domoticz IoT Integration & SecuBox Peering**
    - Create dedicated `luci-app-domoticz` (currently no LuCI app — only generic vhost-manager).
    - MQTT auto-bridge: auto-configure Domoticz ↔ zigbee2mqtt via Mosquitto broker.
    - Zigbee device discovery: expose z2m device list in Domoticz setup wizard.
    - SecuBox P2P mesh: register Domoticz as a mesh service (`secubox-p2p register-service`).
    - Tor/DNS exposure channels: add to exposure scanner and Punk Exposure model.
    - USB device passthrough: document `/srv/devices` for additional IoT dongles.
    - Backup integration: include `/srv/domoticz/config` in secubox-recovery.
    - Service registry: add Domoticz to `secubox-p2p` catalog and health checks.

16. **App Store P2P Emancipation**
    - Emancipate the app store WebUI as a remote P2P/torrent endpoint.
    - Generative remote IPK distribution (like master-link dynamic join IPK generation).
    - Decentralized package distribution across mesh nodes.
    - Compatible with existing bonus-feed and secubox-feed infrastructure.
    - Torrent-style swarming for large IPK downloads across mesh peers.

17. **MirrorNetworking Stack** (ref: `SecuBox_MirrorNetworking_Paradigm_Reversal.html`)
    - EnigmaBox paradigm reversal: zero central authority, each box is the network.
    - Dual transport: WireGuard (tier 1, known peers) + Yggdrasil (tier 2, discovery/extended mesh, optional).
    - New packages roadmap:
      - `secubox-mirrornet` (v0.19): Core mesh orchestration, gossip protocol, peer management.
      - `secubox-identity` (v0.19): did:plc generation, key rotation, trust scoring.
      - `secubox-p2p-intel` (v0.19): IoC signed gossip, threat intelligence sharing.
      - `luci-app-secubox-mirror` (v0.19): Dashboard for peers, trust, services, comms.
      - `secubox-voip` (v1.0): Asterisk micro-PBX, SIP/SRTP direct over WireGuard mesh.
      - `secubox-matrix` (v1.0): Conduit Matrix server (Rust, ~15MB RAM), federation on mesh.
      - `secubox-factory` (v1.0): Auto-provisioning new box via mesh P2P.
      - `yggdrasil-secubox` (v1.1+): Yggdrasil overlay + meshname DNS.
    - Mirror concepts: Threat Intel sharing, AI Inference distribution, Reputation scoring, Config & Updates P2P.
    - Communication: VoIP E2E (Asterisk/SRTP, no exit server), Matrix E2EE, optional mesh email.
    - ANSSI CSPN: Zero central authority = verifiable sovereignty.
    - Crowdfunding target: 2027.

18. **Tor Shield / opkg Bug** (deferred)
    - opkg downloads fail (`wget returned 4`) when Tor Shield is active.
    - Direct `wget` to full URL works — likely DNS/routing interference.
    - Investigate: opkg proxy settings, Tor split-routing exclusions for package repos.
