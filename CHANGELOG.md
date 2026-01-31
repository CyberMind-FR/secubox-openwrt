# Changelog

All notable changes to the SecuBox project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.17.0] - 2026-01-31 🎉 First Public Release

### Highlights

This release marks the **First Public Release** of SecuBox. All core features are now stable and production-ready.

### Added

- **Three-Loop Security Architecture** documentation (`DOCS/THREE-LOOP-ARCHITECTURE.md`)
  - Loop 1 (Operational): Real-time threat detection and blocking
  - Loop 2 (Tactical): Pattern correlation and adaptive response
  - Loop 3 (Strategic): Threat intelligence aggregation and evolution
- Architecture mapping showing how 38 modules integrate into the three-loop model
- Roadmap section in README with 5-phase plan toward ANSSI certification
- Release badge in README header
- P2P Hub vision documentation for v0.18+ development
- did:plc identity model analysis for decentralized node trust

### Changed

- README.md restructured with First Public Release announcement
- Status changed from "Active Development" to "Production Ready"
- Website URL updated to secubox.maegia.tv
- Added Three-Loop Architecture diagram to README overview

### Security

- Documented complete Loop 1 implementation:
  - nftables/fw4 packet filtering (< 1ms latency)
  - netifyd DPI classification (< 10ms)
  - CrowdSec Bouncer enforcement (< 1s propagation)
- Documented complete Loop 2 implementation:
  - CrowdSec Agent log parsing
  - LAPI local decision engine
  - Custom OpenWrt scenarios
  - Netdata metrics correlation

### Roadmap

| Phase | Version | Status |
|-------|---------|--------|
| Core Mesh | v0.17 | ✅ Released |
| Service Mesh | v0.18 | 🔵 Next |
| Intelligence Mesh | v0.19 | ⚪ Planned |
| AI Mesh | v0.20 | ⚪ Planned |
| Certification | v1.0 | ⚪ Planned |

---

## [0.16.0] - 2026-01-27

### Added
- Documentation for SDK vs full toolchain build requirements
- Build requirement table in README.md distinguishing SDK and toolchain builds
- ARM64 LSE atomics compatibility notes for MochaBin/Cortex-A72

### Changed
- README.md updated with all 38 modules categorized by function
- secubox-tools/README.md updated to v1.1.0 with toolchain guidance
- CLAUDE.md updated with critical toolchain build rules

### Fixed
- Documented SIGILL crash fix for Go CGO packages on ARM64 (use full toolchain)

## [0.15.4] - 2026-01-21

### Added
- HexoJS Build & Publish LuCI interface for Gitea workflow integration
- Multi-instance management for Streamlit platform

### Fixed
- CrowdSec LAPI port configuration for multi-instance deployments

## [0.15.3] - 2026-01-14

### Added
- HAProxy enhanced instance management and ACME cron support
- Streamlit instance-specific configuration options

### Fixed
- Streamlit settings page value loading issue

## [0.15.0] - 2025-12-29

### Added
- SecuNav unified navigation component across all modules
- Theme synchronization with dark/light/cyberpunk support
- Quick Deploy tooling with profiles and verification

### Changed
- All views now call Theme.init() for consistent theming
- Monitoring menu simplified (no /overview shim)
- Dashboard, Modules, Monitoring views use SecuNav styling

### Fixed
- System Hub ACL compliance for diagnostics and remote RPC methods
- Validator improvements for cross-module LuCI menus
- CSS/JS asset permissions reset to 644

## [0.14.0] - 2025-12-28

### Added
- Theme selector with live preview in Settings
- Shared design tokens in secubox/common.css

### Changed
- Alerts page mirrors dashboard style with dynamic header chips
- Settings view adopted SecuNav tabs and shared design language

## [0.13.0] - 2025-12-24

### Changed
- Modules view with filter tabs, responsive cards, and live stats
- Monitoring view with SVG sparkline charts and auto-refresh

## [0.12.0] - 2025-12-20

### Added
- Dashboard hero stats and SecuNav top tabs
- Unified sh-page-header layout component

---

## Module Inventory (38 modules as of 0.17.0)

### SecuBox Core (5)
- luci-app-secubox
- luci-app-secubox-portal
- luci-app-secubox-admin
- luci-app-secubox-bonus
- luci-app-system-hub

### Security & Threat Management (9)
- luci-app-crowdsec-dashboard
- luci-app-secubox-security-threats
- luci-app-client-guardian
- luci-app-auth-guardian
- luci-app-exposure
- luci-app-tor-shield
- luci-app-mitmproxy
- luci-app-cyberfeed
- luci-app-ksm-manager

### Deep Packet Inspection (2)
- luci-app-ndpid
- luci-app-secubox-netifyd

### Network & Connectivity (8)
- luci-app-vhost-manager
- luci-app-haproxy
- luci-app-wireguard-dashboard
- luci-app-network-modes
- luci-app-network-tweaks
- luci-app-mqtt-bridge
- luci-app-cdn-cache
- luci-app-media-flow

### Bandwidth & Traffic Management (2)
- luci-app-bandwidth-manager
- luci-app-traffic-shaper

### Content & Web Platforms (5)
- luci-app-gitea
- luci-app-hexojs
- luci-app-metabolizer
- luci-app-magicmirror2
- luci-app-mmpm

### AI/LLM & Analytics (4)
- luci-app-localai
- luci-app-ollama
- luci-app-glances
- luci-app-netdata-dashboard

### Streaming & Data Processing (2)
- luci-app-streamlit
- luci-app-picobrew

### IoT & Smart Devices (1)
- luci-app-zigbee2mqtt
