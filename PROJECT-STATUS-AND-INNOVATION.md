# SecuBox v1.0.0-beta — Project Status & Innovation

**Version:** 1.0.0-beta
**Status:** Beta Release — Pen Testing & Bug Bounty Ready
**Date:** 2026-03-15
**Publisher:** [CyberMind.fr](https://cybermind.fr)

---

## Executive Summary

SecuBox is a **production-ready** security and mesh networking platform for OpenWrt, featuring 86 LuCI modules, AI-powered threat analysis, and a unique three-channel service exposure model. The v1.0.0-beta release is ready for security testing and bug bounty programs.

### Key Achievements

| Metric | Value |
|--------|-------|
| **LuCI Modules** | 86 |
| **Total Packages** | 123+ |
| **RPCD Methods** | 400+ |
| **JavaScript Views** | 150+ |
| **Architectures** | x86-64, ARM64, MIPS, MediaTek |

### Release Artifacts

- **Source Code:** [github.com/CyberMind-FR/secubox-openwrt](https://github.com/CyberMind-FR/secubox-openwrt)
- **VM Appliance:** SecuBox-v1.0.0-beta.tar.gz (69 MB)
- **Documentation:** BETA-RELEASE.md, SECURITY.md

---

## Four-Layer Security Architecture

```
+============================================================+
|              LAYER 4: MESH NETWORKING                       |
|              MirrorNet / P2P Hub / Services Mirrors         |
|  +--------------------------------------------------------+ |
|  |           LAYER 3: AI GATEWAY                          | |
|  |           MCP Server / Threat Analyst / DNS Guard      | |
|  |  +----------------------------------------------------+ | |
|  |  |         LAYER 2: TACTICAL                          | | |
|  |  |         CrowdSec / WAF / Scenarios                 | | |
|  |  |  +------------------------------------------------+ | | |
|  |  |  |       LAYER 1: OPERATIONAL                     | | | |
|  |  |  |       fw4 / DPI / Bouncer / HAProxy            | | | |
|  |  |  +------------------------------------------------+ | | |
|  |  +----------------------------------------------------+ | |
|  +--------------------------------------------------------+ |
+============================================================+
```

| Layer | Function | Time Scale | Components |
|-------|----------|------------|------------|
| **Layer 1** | Real-time blocking | ms → seconds | nftables/fw4, netifyd DPI, CrowdSec Bouncer |
| **Layer 2** | Pattern correlation | minutes → hours | CrowdSec Agent/LAPI, mitmproxy WAF, Scenarios |
| **Layer 3** | AI analysis | minutes → hours | MCP Server, Threat Analyst, DNS Guard |
| **Layer 4** | Mesh networking | continuous | P2P Hub, MirrorBox, Services Registry |

---

## Punk Exposure — Three-Channel Service Publishing

The **Peek / Poke / Emancipate** model enables decentralized service exposure:

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR CONTENT/SERVICE                      │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │   TOR   │        │   DNS   │        │  MESH   │
    │ .onion  │        │  /SSL   │        │  P2P    │
    └─────────┘        └─────────┘        └─────────┘
    Anonymous          Classical          Tribal
    Hidden Service     HTTPS              Gossip Network
```

| Channel | Use Case | Status |
|---------|----------|--------|
| **Tor** | Anonymous hidden services | ✅ Implemented |
| **DNS/SSL** | Classical HTTPS with auto-SSL | ✅ Implemented |
| **Mesh** | Tribal gossip network | ✅ Implemented |

### Emancipate CLI

```bash
# Full emancipation (Tor + DNS + Mesh)
secubox-exposure emancipate myblog 8080 blog.example.com --all

# Selective channels
secubox-exposure emancipate myapp 8080 myapp.secubox.in --dns --mesh
```

---

## Innovation Highlights

### 1. AI Gateway (Implemented)

**Data Classification & Routing:**
- **LOCAL_ONLY:** Sensitive data stays on device
- **SANITIZED:** PII scrubbed before EU cloud processing
- **CLOUD_DIRECT:** Generic queries to opted-in providers

**Provider Priority:** LocalAI → Mistral EU → Claude → OpenAI → Gemini

### 2. MCP Server (Implemented)

Model Context Protocol integration for Claude Desktop:

```json
{
  "mcpServers": {
    "secubox": {
      "command": "ssh",
      "args": ["root@192.168.255.1", "/usr/bin/secubox-mcp"]
    }
  }
}
```

**Available Tools:** `crowdsec.alerts`, `waf.logs`, `dns.queries`, `network.flows`, `ai.analyze_threats`, `ai.suggest_waf_rules`

### 3. Dual-Stream DPI (Implemented)

**Phase 1 — TAP Stream:** tc mirred passive monitoring
**Phase 2 — MITM Double Buffer:** Enhanced correlation
**Phase 3 — Correlation Engine:** Auto-ban for high-reputation IPs
**Phase 4 — LAN Passive Flow:** Zero-MITM LAN observation

### 4. Threat Analyst (Implemented)

Autonomous AI agent for:
- Real-time threat analysis
- CrowdSec scenario generation
- WAF rule suggestions
- CVE lookups and context enrichment

### 5. Configuration Vault (Implemented)

Git-based config versioning with:
- Auto-commit and auto-push
- 9 configuration modules
- Export/import clone tarballs
- Device provisioning workflows

### 6. Unified SMTP Relay (Implemented)

Centralized SMTP configuration:
- Modes: external (Gmail, SendGrid), local (auto-detect), direct
- Shared library: `send_mail()` function
- All SecuBox apps use unified relay

---

## Module Categories

### Core (6 modules)
- luci-app-secubox, luci-app-secubox-portal, luci-app-secubox-admin
- secubox-app-bonus, luci-app-system-hub, luci-theme-secubox

### Security (15 modules)
- CrowdSec, mitmproxy WAF, MAC Guardian, DNS Guard
- Threat Analyst, KSM Manager, Master Link
- Auth Guardian, Client Guardian, Exposure Manager

### Network (12 modules)
- HAProxy, WireGuard, Network Modes, DNS Provider
- Bandwidth Manager, Traffic Shaper, CDN Cache

### AI/LLM (4 modules)
- LocalAI, Ollama, AI Gateway, MCP Server

### Media (7 modules)
- Jellyfin, Lyrion, PhotoPrism, Zigbee2MQTT, Domoticz

### Content Platforms (6 modules)
- Gitea, MetaBlogizer, HexoJS, Streamlit, Jitsi

### P2P Mesh (4 modules)
- P2P Hub, Service Registry, Device Intel, Content Package

---

## Roadmap

| Version | Status | Focus |
|---------|--------|-------|
| v0.17 | ✅ Released | Core Mesh, 38 modules |
| v0.18 | ✅ Released | P2P Hub, AI Gateway, 86 modules |
| v0.19 | ✅ Released | Full P2P intelligence |
| **v1.0.0-beta** | **Current** | Pen testing, bug bounty, documentation |
| v1.1 | Planned | ANSSI certification, GA release |

### v1.1 Targets

1. **ANSSI CSPN Certification** — French security certification
2. **CRA Compliance** — EU Cyber Resilience Act readiness
3. **SBOM Pipeline** — Automated vulnerability scanning
4. **Enterprise Features** — Multi-tenant, SSO, audit logging

---

## Security Testing

The v1.0.0-beta release is specifically prepared for:

### Attack Surface

| Layer | Components | Risk Areas |
|-------|------------|------------|
| **Network Edge** | HAProxy, mitmproxy WAF | WAF bypass, header injection |
| **Applications** | LuCI, RPCD | Shell injection, XSS, CSRF |
| **Containers** | LXC services | Container escape, privilege escalation |
| **Mesh/P2P** | WireGuard, gossip | Key theft, peer impersonation |

### Bug Bounty Scope

| Severity | Category |
|----------|----------|
| **Critical** | RCE, Auth Bypass |
| **High** | Privilege Escalation, WAF Bypass |
| **Medium** | Information Disclosure |
| **Low** | DoS, XSS |

**Report:** security@cybermind.fr

---

## Distribution

### Virtual Appliance

| File | Format | Use |
|------|--------|-----|
| C3Box-SecuBox.ova | OVA | VMware, VirtualBox |
| C3Box-SecuBox.vdi | VDI | VirtualBox |
| C3Box-SecuBox.vmdk | VMDK | VMware |
| C3Box-SecuBox.qcow2 | QCOW2 | Proxmox/KVM |

**Default Login:** root / c3box

### Package Feed

```
src/gz secubox https://secubox.in/feed
```

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| **OS** | OpenWrt 24.10.x / 25.12 |
| **Frontend** | LuCI JavaScript, KISS Theme |
| **Backend** | RPCD/ubus, Shell, Lua |
| **Security** | CrowdSec, mitmproxy, nftables |
| **Containers** | LXC (Alpine/Debian) |
| **AI** | LocalAI, Claude API, Mistral |
| **P2P** | WireGuard, Gossip Protocol |

---

## Contributors

- **Lead:** Gandalf — [CyberMind.fr](https://cybermind.fr)
- **AI Assistance:** Claude (Anthropic)

---

## Links

- **Website:** [secubox.maegia.tv](https://secubox.maegia.tv)
- **GitHub:** [github.com/CyberMind-FR/secubox-openwrt](https://github.com/CyberMind-FR/secubox-openwrt)
- **Security:** [BETA-RELEASE.md](BETA-RELEASE.md) | [SECURITY.md](SECURITY.md)
- **Issues:** [GitHub Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)

---

**Ex Tenebris, Lux Securitas**

© 2024-2026 CyberMind.fr — Apache-2.0 License
