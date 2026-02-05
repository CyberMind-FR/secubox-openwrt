# SecuBox TODOs (Claude Edition)

_Last updated: 2026-02-05_

## Resolved

- ~~Expose cyberpunk option inside SecuBox Settings~~ — Done: `THEME_CHOICES` now includes `cyberpunk` in `settings.js`.
- ~~Glances full system monitoring~~ — Done: LXC host bind mounts, Docker socket, fs plugin patch, hostname/OS identity (2026-02-04).
- ~~Zigbee2MQTT dongle connection~~ — Done: adapter `ezsp`→`ember`, `ZIGBEE2MQTT_DATA` env var, direct `/dev/ttyUSB0` passthrough (2026-02-04).
- ~~Metablogizer Upload Failures~~ — Done: Chunked upload to bypass uhttpd 64KB JSON limit (2026-02-04).
- ~~Chip Header Layout Migration~~ — Done: client-guardian and auth-guardian ported to `sh-page-header` + `renderHeaderChip()` (2026-02-05).
- ~~SMB/CIFS Shared Remote Directories~~ — Done: `secubox-app-smbfs` (client mount manager) + `secubox-app-ksmbd` (server for mesh sharing) (2026-02-04/05).
- ~~P2P App Store Emancipation~~ — Done: P2P package distribution, packages.js view, devstatus.js widget (2026-02-04/05).
- ~~Navigation Component~~ — Done: `SecuNav.renderTabs()` now auto-inits theme+CSS, `renderCompactTabs()` for nested modules (2026-02-05).

## Open

1. ~~**Chip Header Layout Migration**~~ — Done (2026-02-05)
   - ~~Port `sh-page-header` + `renderHeaderChip()` pattern to client-guardian and auth-guardian.~~
   - ~~Both now use `sh-page-header` with chip stats.~~

2. ~~**Navigation Component**~~ — Done (2026-02-05)
   - ~~Convert `SecuNav.renderTabs()` into a reusable LuCI widget (avoid duplicating `Theme.init` in each view).~~
   - ~~Provide a compact variant for nested modules (e.g., CDN Cache, Network Modes).~~

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

10. ~~**SMB/CIFS Shared Remote Directories**~~ — Done (2026-02-04/05)
    - ~~`secubox-app-smbfs` for client-side mount management (`smbfsctl` CLI, UCI config, init script).~~
    - ~~`secubox-app-ksmbd` for server-side mesh sharing (`ksmbdctl` CLI, pre-configured shares).~~
    - ~~Integrates with Jellyfin, Lyrion media paths.~~

11. ~~**Metablogizer Upload Failures**~~ — Done (2026-02-04)
    - ~~Investigate and fix failed file uploads in Metablogizer.~~
    - ~~Fixed: Chunked upload to bypass uhttpd 64KB JSON limit (same pattern as Streamlit).~~

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

15. ~~**Domoticz IoT Integration & SecuBox Peering**~~ — Done (2026-02-04)
    - ~~`luci-app-domoticz` created with RPCD handler, LuCI overview.~~
    - ~~`domoticzctl configure-mqtt` auto-configures Mosquitto + Zigbee2MQTT bridge.~~
    - ~~P2P mesh registration, HAProxy integration, backup/restore.~~
    - ~~UCI config extended with mqtt/network/mesh sections.~~

16. ~~**App Store P2P Emancipation**~~ — Done (2026-02-04)
    - ~~P2P package distribution via mesh peers (CGI API, RPCD, CLI).~~
    - ~~`packages.js` view with LOCAL/PEER badges, fetch/install actions.~~
    - ~~`devstatus.js` widget with v1.0 progress tracking.~~
    - ~~`secubox-content-pkg` for Metablogizer/Streamlit IPK distribution.~~

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
