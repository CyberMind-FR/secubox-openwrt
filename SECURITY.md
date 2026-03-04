# Security Policy

## SecuBox Security Disclosure Policy

This document describes the security policy for SecuBox firmware, in compliance with
**EU Cyber Resilience Act (CRA) Article 13 §6** requirements for Class I products.

**Manufacturer:** CyberMind Produits SASU
**Contact:** Gérald Kerma, Notre-Dame-du-Cruet, Savoie, France
**Website:** https://cybermind.fr | https://secubox.in

---

## Supported Versions

| Version | Support Status | End of Support |
|---------|---------------|----------------|
| 0.20.x  | ✅ Current    | Active development |
| 0.19.x  | ✅ LTS        | March 2027 |
| 0.18.x  | ⚠️ Security only | September 2026 |
| < 0.18  | ❌ EOL        | Unsupported |

**Support policy:**
- **Current:** All bug fixes and security patches
- **LTS (Long Term Support):** Critical security patches only, 18 months
- **Security only:** Critical vulnerabilities only, 6 months after next major release
- **EOL (End of Life):** No updates, upgrade strongly recommended

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue,
please report it responsibly.

### Primary Contact

**Email:** security@cybermind.fr

**PGP Key:** [0xABCD1234](https://secubox.in/pgp/security-key.asc)
**Fingerprint:** `1234 5678 9ABC DEF0 1234 5678 9ABC DEF0 1234 5678`

### Alternative Contact

For critical vulnerabilities requiring immediate attention:
- **Phone:** +33 (0)4 79 XX XX XX (French business hours)
- **Signal:** Available upon request via email

### Encrypted Communication

We **strongly recommend** using PGP encryption for vulnerability reports.
Our public key is available at:
- https://secubox.in/pgp/security-key.asc
- https://keys.openpgp.org (search: security@cybermind.fr)

### What to Include

Please provide:
1. **Description:** Clear description of the vulnerability
2. **Impact:** Potential security impact (confidentiality, integrity, availability)
3. **Affected versions:** Which SecuBox versions are affected
4. **Reproduction steps:** Step-by-step instructions to reproduce
5. **Proof of concept:** Code, logs, or screenshots if applicable
6. **Suggested fix:** If you have one (optional)

### Response Timeline

| Phase | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial triage | Within 5 business days |
| Status update | Every 7 days during investigation |
| Fix development | Depends on severity (see below) |
| Public disclosure | 90 days after fix, or coordinated |

**Severity-based fix timeline:**
- **Critical (CVSS 9.0+):** 7 days
- **High (CVSS 7.0-8.9):** 30 days
- **Medium (CVSS 4.0-6.9):** 60 days
- **Low (CVSS < 4.0):** Next regular release

---

## Software Bill of Materials (SBOM)

As required by CRA Annex I, we publish machine-readable SBOMs for all releases.

### SBOM Location

SBOMs are attached to each GitHub Release:
- **CycloneDX 1.6:** `secubox-VERSION.cdx.json`
- **SPDX 2.3:** `secubox-VERSION.spdx.json`
- **CVE Report:** `secubox-VERSION-cve-report.json`
- **Checksums:** `checksums.sha256`

**Direct link:** https://github.com/cybermind/secubox/releases/latest

### SBOM Contents

Our SBOM includes:
- All OpenWrt base packages
- SecuBox custom packages and dependencies
- Kernel modules and firmware blobs
- Cryptographic libraries and versions
- License information (SPDX identifiers)
- PURL (Package URL) identifiers for each component

### Verifying SBOM Integrity

```bash
# Download SBOM and checksums
wget https://github.com/cybermind/secubox/releases/latest/download/secubox-0.20.cdx.json
wget https://github.com/cybermind/secubox/releases/latest/download/checksums.sha256

# Verify checksum
sha256sum -c checksums.sha256 --ignore-missing
```

---

## Vulnerability Disclosure (VEX)

We use **Vulnerability Exploitability eXchange (VEX)** documents to communicate
the status of CVEs affecting SecuBox components.

### VEX Policy

See [docs/vex-policy.md](docs/vex-policy.md) for our full VEX handling policy.

**Status definitions:**
- `not_affected`: CVE does not affect SecuBox (component not used, conditions not met)
- `affected`: CVE affects SecuBox, fix in progress
- `fixed`: CVE fixed in specified version
- `under_investigation`: Analysis ongoing

VEX documents are published alongside releases:
- `secubox-VERSION.vex.json` (CycloneDX VEX format)

---

## CRA Compliance Statement

### EU Cyber Resilience Act — Class I Declaration

SecuBox is a **Class I product** under the EU Cyber Resilience Act (Regulation 2024/XXX),
as it is a router/VPN appliance with network connectivity functions.

**Compliance status:**
- ✅ SBOM published in machine-readable format (CycloneDX + SPDX)
- ✅ Vulnerability disclosure contact established
- ✅ Security update mechanism implemented (opkg + secubox-update)
- ✅ Default secure configuration
- ⏳ ANSSI CSPN certification: In progress (target Q3 2026)

### Certification Path

We are pursuing **ANSSI CSPN (Certification de Sécurité de Premier Niveau)**
certification for SecuBox, targeting completion in Q3 2026.

**Certification scope:**
- Firewall functionality
- VPN (WireGuard) implementation
- Intrusion detection (CrowdSec integration)
- Secure boot chain
- Update integrity verification

---

## Security Architecture

### Defense in Depth

SecuBox implements multiple security layers:

1. **Network Segmentation:** VLAN isolation, guest network separation
2. **WAF Protection:** mitmproxy-based web application firewall
3. **Intrusion Detection:** CrowdSec community threat intelligence
4. **Encrypted VPN:** WireGuard with modern cryptography
5. **Access Control:** SSO portal with MFA support
6. **Audit Logging:** Comprehensive security event logging

### Data Sovereignty

SecuBox includes an **AI Gateway** that enforces data classification:
- **LOCAL_ONLY:** Sensitive data (IPs, credentials) never leaves device
- **SANITIZED:** PII scrubbed before EU cloud processing (Mistral)
- **CLOUD_DIRECT:** Generic queries to opted-in providers

See [AI Gateway documentation](docs/ai-gateway.md) for details.

---

## Third-Party Components

SecuBox builds upon:
- **OpenWrt:** GPL-2.0, https://openwrt.org
- **CrowdSec:** MIT, https://crowdsec.net
- **WireGuard:** GPL-2.0, https://wireguard.com
- **mitmproxy:** MIT, https://mitmproxy.org

We monitor upstream security advisories and integrate patches promptly.

---

## Secure Development Practices

- **Code review:** All changes require peer review
- **Dependency scanning:** Automated CVE scanning in CI/CD
- **SBOM generation:** Automated with each release
- **Reproducible builds:** SOURCE_DATE_EPOCH enforced
- **Signed releases:** (Planned) cosign signatures for releases

---

## Contact

- **General security:** security@cybermind.fr
- **Support:** support@cybermind.fr
- **Commercial:** contact@cybermind.fr

**Address:**
CyberMind Produits SASU
Notre-Dame-du-Cruet
73130 Savoie, France

---

_Last updated: 2026-03-04_
_Document version: 1.0_
