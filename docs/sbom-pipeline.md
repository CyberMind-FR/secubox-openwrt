# SecuBox SBOM Pipeline Documentation

## Overview

The SecuBox SBOM (Software Bill of Materials) pipeline generates CycloneDX 1.6 and
SPDX 2.3 compliant SBOMs for EU Cyber Resilience Act (CRA) Annex I compliance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SecuBox SBOM Pipeline                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │   Source A  │    │   Source B  │    │   Source C  │    │   Source D  │  │
│   │  OpenWrt    │    │   SecuBox   │    │   Rootfs    │    │  Firmware   │  │
│   │  Native     │    │   Feed      │    │   Scan      │    │   Image     │  │
│   │             │    │             │    │             │    │             │  │
│   │ Packages    │    │ Makefiles   │    │ Syft scan   │    │ Syft scan   │  │
│   │ .manifest   │    │ PKG_* vars  │    │ dir:rootfs  │    │ file:*.bin  │  │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│          │                  │                  │                  │         │
│          └──────────────────┴──────────────────┴──────────────────┘         │
│                                    │                                         │
│                                    ▼                                         │
│                          ┌─────────────────┐                                 │
│                          │   Merge & Dedup │                                 │
│                          │   (jq fusion)   │                                 │
│                          └────────┬────────┘                                 │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌─────────────────┐                                 │
│                          │    Validate     │                                 │
│                          │ cyclonedx-cli   │                                 │
│                          └────────┬────────┘                                 │
│                                   │                                          │
│                    ┌──────────────┼──────────────┐                           │
│                    ▼              ▼              ▼                           │
│             ┌───────────┐  ┌───────────┐  ┌───────────┐                      │
│             │ CVE Scan  │  │ CRA Report│  │ Checksums │                      │
│             │  (grype)  │  │  Summary  │  │ sha256sum │                      │
│             └───────────┘  └───────────┘  └───────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Output Files:
├── secubox-VERSION.cdx.json          # CycloneDX 1.6 (primary)
├── secubox-VERSION.spdx.json         # SPDX 2.3 (alternative)
├── secubox-VERSION-cve-report.json   # Grype CVE scan results
├── secubox-VERSION-cve-table.txt     # Human-readable CVE table
├── secubox-VERSION-cra-summary.txt   # CRA compliance summary
├── sbom-warnings.txt                 # Missing metadata warnings
└── checksums.sha256                  # File integrity checksums
```

## Prerequisites

### Minimum Versions

| Tool | Minimum Version | Purpose |
|------|-----------------|---------|
| OpenWrt | 22.03 | Native SBOM support |
| Perl | 5.26+ | package-metadata.pl |
| jq | 1.6+ | JSON processing |
| Syft | 0.100+ | Filesystem scanning |
| Grype | 0.70+ | CVE scanning |
| cyclonedx-cli | 0.25+ | SBOM validation |

### Environment Setup

```bash
# Check prerequisites
./scripts/check-sbom-prereqs.sh

# Install SBOM tools (if not present)
# Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ~/.local/bin

# Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b ~/.local/bin

# cyclonedx-cli
curl -sSfL -o ~/.local/bin/cyclonedx-cli \
  https://github.com/CycloneDX/cyclonedx-cli/releases/latest/download/cyclonedx-linux-x64
chmod +x ~/.local/bin/cyclonedx-cli

# Add to PATH
export PATH="$HOME/.local/bin:$PATH"
```

### OpenWrt Kconfig

Enable native SBOM generation in `.config`:

```
CONFIG_JSON_CYCLONEDX_SBOM=y
CONFIG_COLLECT_KERNEL_DEBUG=n
```

## Usage

### Daily Development

```bash
# Full SBOM generation (all 4 sources)
./scripts/sbom-generate.sh

# Quick SBOM from existing artifacts (no rebuild)
./scripts/sbom-generate.sh --version 0.20

# Offline mode (no network, uses cached databases)
./scripts/sbom-generate.sh --offline

# Skip CVE scan (faster)
./scripts/sbom-generate.sh --no-cve
```

### Using Makefile Targets

```bash
# Full build + SBOM
make sbom

# SBOM only (no rebuild)
make sbom-quick

# Validate existing SBOM
make sbom-validate

# CVE scan only
make sbom-scan

# Clean SBOM outputs
make sbom-clean

# Show help
make sbom-help
```

### Audit Feed Packages

```bash
# Check all SecuBox feed packages for missing metadata
./scripts/sbom-audit-feed.sh

# Output: feeds/secubox/MANIFEST.md
```

## Adding a New Package

When adding a new package to the SecuBox feed, ensure SBOM compatibility:

### Checklist

- [ ] **PKG_NAME** defined
- [ ] **PKG_VERSION** defined
- [ ] **PKG_LICENSE** defined (SPDX identifier)
- [ ] **PKG_HASH** defined (sha256)
- [ ] **PKG_SOURCE_URL** defined (optional but recommended)

### Example Makefile

```makefile
include $(TOPDIR)/rules.mk

PKG_NAME:=my-package
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_SOURCE_URL:=https://github.com/example/my-package/archive
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_HASH:=a1b2c3d4e5f6...  # sha256sum of the source tarball

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

PKG_MAINTAINER:=Your Name <email@example.com>
```

### Compute PKG_HASH

```bash
# Download and hash the source
wget https://example.com/package-1.0.0.tar.gz
sha256sum package-1.0.0.tar.gz

# Or use the OpenWrt download helper
make package/my-package/download V=s
sha256sum dl/my-package-1.0.0.tar.gz
```

## CRA Annex I Mapping

| CRA Requirement | SBOM Implementation |
|-----------------|---------------------|
| Art. 13(5) - Component identification | `components[].purl` (Package URL) |
| Art. 13(5) - Supplier identification | `metadata.component.supplier` |
| Art. 13(5) - Version information | `components[].version` |
| Art. 13(5) - Dependencies | `dependencies[]` array |
| Art. 13(5) - License information | `components[].licenses[]` |
| Art. 13(6) - Machine-readable format | CycloneDX 1.6 JSON + SPDX 2.3 |
| Art. 13(6) - Vulnerability disclosure | SECURITY.md + VEX documents |
| Art. 13(7) - Unique identification | PURL + `serialNumber` UUID |
| Annex I(2) - Integrity verification | `hashes[]` with SHA-256 |

## ANSSI CSPN Submission

For CSPN certification, include the following in your dossier:

### Required Documents

1. **SBOM Files**
   - `secubox-VERSION.cdx.json` (primary)
   - `secubox-VERSION.spdx.json` (alternative)

2. **Provenance**
   - `checksums.sha256` (integrity verification)
   - Git commit hash from metadata

3. **Vulnerability Analysis**
   - `secubox-VERSION-cve-report.json`
   - `secubox-VERSION-cra-summary.txt`

4. **Process Documentation**
   - This document (`docs/sbom-pipeline.md`)
   - `SECURITY.md` (vulnerability disclosure policy)

### Submission Checklist

- [ ] All components have PKG_HASH and PKG_LICENSE
- [ ] SBOM validates with cyclonedx-cli
- [ ] No unaddressed Critical CVEs
- [ ] VEX document explains any accepted risks
- [ ] SOURCE_DATE_EPOCH reproducibility verified

## Troubleshooting

### Common Errors

#### "OpenWrt version < 22.03"

The native CycloneDX SBOM support requires OpenWrt 22.03 or later.

**Solution:** Upgrade your OpenWrt fork or use `sbom-generate.sh` without native support
(it will fall back to Makefile parsing).

#### "package-metadata.pl not found"

The SBOM generation script is missing from your OpenWrt checkout.

**Solution:**
```bash
git checkout origin/master -- scripts/package-metadata.pl
```

#### "syft: command not found"

Syft is not installed or not in PATH.

**Solution:**
```bash
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"
```

#### "SBOM validation failed"

The generated SBOM has schema errors.

**Solution:**
1. Check `sbom-warnings.txt` for missing metadata
2. Fix Makefiles with missing PKG_HASH or PKG_LICENSE
3. Regenerate SBOM

#### "Grype database update failed"

Network connectivity issue or rate limiting.

**Solution:**
- Use `--offline` mode with cached database
- Or manually update: `grype db update`

### Debug Mode

```bash
# Verbose output
DEBUG=1 ./scripts/sbom-generate.sh

# Keep intermediate files
KEEP_TEMP=1 ./scripts/sbom-generate.sh
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-04 | Initial pipeline implementation |

---

_Maintained by CyberMind Produits SASU_
_Contact: secubox@cybermind.fr_
