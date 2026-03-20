# SecuBox v1.0.0 Beta Release

🌐 **Languages:** English | [Français](BETA-RELEASE.fr.md) | [中文](BETA-RELEASE.zh.md)

**Release Date:** 2026-03-15
**Status:** Beta — Ready for Pen Testing & Bug Bounty
**Publisher:** [CyberMind.fr](https://cybermind.fr)

---

## Quick Start for Security Researchers

### Get the Code

```bash
git clone https://github.com/CyberMind-FR/secubox-openwrt.git
cd secubox-openwrt
```

### Build for Testing

```bash
# Option 1: Use pre-built packages (recommended)
./secubox-tools/local-build.sh build all

# Option 2: Build with OpenWrt SDK
cd ~/openwrt-sdk/package/
ln -s /path/to/secubox-openwrt secubox
make package/secubox/luci-app-secubox-portal/compile V=s
```

### Deploy to Test Router

```bash
scp bin/packages/*/secubox/*.ipk root@192.168.255.1:/tmp/
ssh root@192.168.255.1 'opkg install /tmp/luci-app-*.ipk'
```

---

## Attack Surface Overview

### Layer 1: Network Edge

| Component | Port | Protocol | Attack Vectors |
|-----------|------|----------|----------------|
| HAProxy | 80, 443 | HTTP/S | Header injection, SNI attacks, SSL stripping |
| mitmproxy WAF | 22222 | HTTP | WAF bypass, rule evasion, memory exhaustion |
| CrowdSec Bouncer | - | nftables | Rule bypass, IP spoofing |
| fw4/nftables | - | L3/L4 | Firewall evasion, fragmentation attacks |

### Layer 2: Application Proxies

| Component | Port | Protocol | Attack Vectors |
|-----------|------|----------|----------------|
| LuCI (uhttpd) | 443 | HTTPS | Auth bypass, XSS, CSRF, path traversal |
| RPCD (ubus) | Unix | JSON-RPC | Privilege escalation, injection |
| Tor Shield | 9050 | SOCKS5 | Deanonymization, circuit analysis |

### Layer 3: LXC Containers

| Container | Port | Service | Attack Vectors |
|-----------|------|---------|----------------|
| Jellyfin | 8096 | Media | Path traversal, transcoding exploits |
| Nextcloud | 8080 | Cloud | SSRF, file upload, WebDAV abuse |
| Gitea | 3000 | Git | RCE via hooks, repo injection |
| Streamlit | 8501+ | Python | Code execution, pickle deserialization |
| PhotoPrism | 2342 | Photos | AI model poisoning, EXIF injection |

### Layer 4: Mesh/P2P

| Component | Port | Protocol | Attack Vectors |
|-----------|------|----------|----------------|
| P2P Hub | 8333 | WebSocket | Message injection, peer impersonation |
| Master Link | 51820 | WireGuard | Key theft, MITM on onboarding |
| Vortex DNS | 53 | DNS | Cache poisoning, zone transfer |

---

## High-Value Targets

### Critical Files (Write Access = Root)

```
/etc/config/network          # Network configuration
/etc/config/firewall         # Firewall rules
/etc/config/haproxy          # Reverse proxy routes
/etc/config/crowdsec         # CrowdSec agent config
/etc/shadow                  # Password hashes
/etc/dropbear/authorized_keys
```

### RPCD Handlers (Shell Code)

```
/usr/libexec/rpcd/luci.*     # LuCI backend scripts
/usr/sbin/*ctl               # CLI tools (crowdsecctl, haproxyctl, etc.)
/usr/lib/secubox/            # Shared libraries
```

### Secrets

```
/etc/config/smtp-relay       # SMTP credentials (option password)
/etc/config/wireguard        # WireGuard private keys
/etc/config/dns-provider     # DNS API keys (Gandi, OVH, Cloudflare)
/srv/mitmproxy/*.pem         # TLS certificates
/etc/crowdsec/local_api_credentials.yaml
```

---

## Known Weak Points (Intentional Disclosure)

### 1. RPCD Shell Injection Risk

Many RPCD handlers use shell scripts with UCI data:
```sh
# Example pattern (potentially vulnerable)
local value=$(uci get config.section.option)
eval "command $value"  # ← Shell injection if UCI value contains $(...)
```

**Check:** All `luci.*` handlers in `/usr/libexec/rpcd/`

### 2. WAF Bypass Opportunities

mitmproxy WAF uses pattern matching:
- Large request bodies may exhaust memory
- Chunked encoding edge cases
- Multipart form parsing quirks
- WebSocket upgrade handling

**Check:** `/srv/mitmproxy/haproxy_router.py`

### 3. LXC Container Escapes

Containers run with limited privileges but:
- Some have bind mounts to host paths
- cgroup v2 limits may be bypassable
- Namespace isolation varies per container

**Check:** `/srv/lxc/*/config`

### 4. P2P Mesh Trust

Master Link uses first-contact trust:
- Initial WireGuard key exchange may be interceptable
- Gossip messages are signed but trust chain is shallow

**Check:** `/usr/sbin/master-linkctl`, `/usr/sbin/secubox-p2p`

### 5. Cross-Site Scripting (XSS)

LuCI views render user-controlled data:
- Hostname, MAC addresses, user comments
- Log entries displayed in dashboards
- Report content in HTML emails

**Check:** All `htdocs/luci-static/resources/view/*/` JavaScript files

---

## Bug Bounty Scope

### In Scope

| Severity | Category | Examples |
|----------|----------|----------|
| **Critical** | RCE, Auth Bypass | Shell injection in RPCD, hardcoded credentials |
| **High** | Privilege Escalation | LXC escape, WAF bypass with RCE |
| **Medium** | Information Disclosure | Credential leakage, path traversal |
| **Low** | DoS, XSS | Memory exhaustion, stored XSS in logs |

### Out of Scope

- Self-DoS attacks (user crashing their own router)
- Social engineering
- Physical access attacks
- Third-party software bugs (OpenWrt core, upstream packages)
- Rate limiting bypasses without impact

---

## Reporting

### Contact

- **Email:** security@cybermind.fr
- **GPG Key:** Available on request
- **GitHub Issues:** [github.com/CyberMind-FR/secubox-openwrt/security](https://github.com/CyberMind-FR/secubox-openwrt/security)

### Report Format

```
## Summary
[One-line description]

## Severity
[Critical/High/Medium/Low]

## Affected Component
[Package name, file path, RPCD method]

## Steps to Reproduce
1. ...
2. ...
3. ...

## Proof of Concept
[Code, screenshots, or video]

## Impact
[What can an attacker achieve?]

## Suggested Fix
[Optional]
```

### Response Timeline

| Phase | Time |
|-------|------|
| Acknowledgment | 24 hours |
| Triage | 72 hours |
| Fix (Critical) | 7 days |
| Fix (High/Medium) | 30 days |
| Public Disclosure | 90 days |

---

## Test Environment Setup

### VirtualBox Appliance

```bash
# Build VM image
./secubox-tools/c3box-vm-builder.sh full

# Import to VirtualBox
VBoxManage import secubox-v1.0.0-beta.ova
```

### Docker (Limited)

```bash
# LuCI-only testing
docker run -p 8080:80 ghcr.io/cybermind-fr/secubox-luci:beta
```

### Real Hardware

Recommended: x86-64 mini PC or ARM64 SBC (NanoPi R4S, Raspberry Pi 4)

---

## Legal

This is an authorized security research program. By participating, you agree to:

1. Only test against systems you own or have permission to test
2. Not access, modify, or delete data beyond what's necessary to demonstrate the vulnerability
3. Report vulnerabilities responsibly before public disclosure
4. Not use discovered vulnerabilities for malicious purposes

**License:** Apache-2.0
**© 2024-2026 CyberMind.fr**

---

## Acknowledgments

Security researchers who report valid vulnerabilities will be credited in:
- `SECURITY.md` Hall of Fame
- Release notes
- Project website

**Ex Tenebris, Lux Securitas**
