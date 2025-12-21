# SecuBox OpenWrt CI/CD

[![Build OpenWrt Packages](https://github.com/gkerma/secubox/actions/workflows/build-openwrt-packages.yml/badge.svg)](https://github.com/gkerma/secubox/actions/workflows/build-openwrt-packages.yml)
[![Test & Validate](https://github.com/gkerma/secubox/actions/workflows/test-validate.yml/badge.svg)](https://github.com/gkerma/secubox/actions/workflows/test-validate.yml)

## 🎯 Overview

Ce dépôt contient les workflows GitHub Actions pour compiler automatiquement les packages SecuBox LuCI pour **toutes les architectures OpenWrt supportées**.

## 📦 Packages Compilés

| Package | Description |
|---------|-------------|
| `luci-app-crowdsec-dashboard` | Dashboard CrowdSec |
| `luci-app-netdata-dashboard` | Dashboard Netdata |
| `luci-app-netifyd-dashboard` | Dashboard Netifyd DPI |
| `luci-app-wireguard-dashboard` | Dashboard WireGuard VPN |
| `luci-app-network-modes` | Modes réseau (Router/Bridge/AP) |
| `luci-app-client-guardian` | NAC & Portail Captif |
| `luci-app-system-hub` | Centre de contrôle unifié |

## 🏗️ Architectures Supportées

### ARM 64-bit (AArch64)

| Target | Architecture | Devices |
|--------|--------------|---------|
| `aarch64-cortex-a53` | Cortex-A53 | **ESPRESSObin**, **Sheeva64**, BananaPi R64 |
| `aarch64-cortex-a72` | Cortex-A72 | **MOCHAbin**, Raspberry Pi 4, NanoPi R4S |
| `aarch64-generic` | Generic ARMv8 | Rock64, Pine64, QEMU ARM64 |
| `mediatek-filogic` | MT7981/MT7986 | GL.iNet MT3000, BananaPi R3 |
| `rockchip-armv8` | RK3328/RK3399 | NanoPi R4S, R5S, FriendlyARM |
| `bcm27xx-bcm2711` | BCM2711 | Raspberry Pi 4, Compute Module 4 |

### ARM 32-bit

| Target | Architecture | Devices |
|--------|--------------|---------|
| `arm-cortex-a7-neon` | Cortex-A7 | Orange Pi, BananaPi, Allwinner |
| `arm-cortex-a9-neon` | Cortex-A9 | Linksys WRT, Turris Omnia |
| `arm-cortex-a15-neon` | Cortex-A15 | QEMU ARM |
| `qualcomm-ipq40xx` | IPQ40xx | Google WiFi, Zyxel NBG6617 |
| `qualcomm-ipq806x` | IPQ806x | Netgear R7800, R7500 |

### MIPS

| Target | Architecture | Devices |
|--------|--------------|---------|
| `mips-24kc` | MIPS 24Kc | TP-Link Archer, Ubiquiti |
| `mipsel-24kc` | MIPS LE 24Kc | Xiaomi, GL.iNet, Netgear |
| `mipsel-74kc` | MIPS LE 74Kc | Broadcom BCM47xx |

### x86

| Target | Architecture | Devices |
|--------|--------------|---------|
| `x86-64` | x86_64 | PC, VMs, Docker, Proxmox |
| `x86-generic` | i386 | Legacy PC, old Atom |

## 🚀 Utilisation

### Compilation Automatique

Les packages sont compilés automatiquement lors de :

1. **Push sur `main`/`master`** : Compilation de test
2. **Pull Request** : Validation et test
3. **Tag `v*`** : Création de release avec tous les packages

### Compilation Manuelle

1. Aller dans **Actions** → **Build OpenWrt Packages**
2. Cliquer sur **Run workflow**
3. Sélectionner :
   - **OpenWrt version** : 23.05.5, 22.03.7, ou SNAPSHOT
   - **Architectures** : `all` ou liste séparée par virgules

```
# Exemples d'architectures
all                                    # Toutes les architectures
x86-64                                 # Uniquement x86_64
aarch64-cortex-a53,aarch64-cortex-a72  # GlobalScale devices
mips-24kc,mipsel-24kc                  # MIPS routeurs
```

### Téléchargement des Artifacts

1. Aller dans **Actions** → Sélectionner un workflow
2. Cliquer sur le run souhaité
3. Télécharger les **Artifacts** en bas de page

Les artifacts sont organisés par architecture :
```
packages-x86-64/
  ├── luci-app-crowdsec-dashboard_1.0.0-1_all.ipk
  ├── luci-app-netdata-dashboard_1.0.0-1_all.ipk
  ├── ...
  └── SHA256SUMS
```

## 📁 Structure du Dépôt

```
secubox/
├── .github/
│   └── workflows/
│       ├── build-openwrt-packages.yml    # Build principal
│       └── test-validate.yml              # Tests & validation
├── luci-app-crowdsec-dashboard/
│   ├── Makefile
│   ├── htdocs/luci-static/resources/
│   │   ├── view/crowdsec/                # JavaScript views
│   │   └── crowdsec/                     # API & CSS
│   └── root/
│       ├── etc/config/                   # UCI config
│       └── usr/
│           ├── libexec/rpcd/             # RPCD backend
│           └── share/
│               ├── luci/menu.d/          # Menu JSON
│               └── rpcd/acl.d/           # ACL JSON
├── luci-app-netdata-dashboard/
├── luci-app-netifyd-dashboard/
├── luci-app-wireguard-dashboard/
├── luci-app-network-modes/
├── luci-app-client-guardian/
├── luci-app-system-hub/
└── README.md
```

## 🔧 Créer un Nouveau Package

1. Copier le template :
```bash
cp -r templates/luci-app-template luci-app-nouveau
```

2. Éditer `Makefile` :
```makefile
PKG_NAME:=luci-app-nouveau
PKG_VERSION:=1.0.0
LUCI_TITLE:=Mon Nouveau Dashboard
LUCI_DEPENDS:=+luci-base +nouveau-backend
```

3. Créer les fichiers requis :
```bash
luci-app-nouveau/
├── Makefile
├── htdocs/luci-static/resources/
│   ├── view/nouveau/
│   │   └── overview.js
│   └── nouveau/
│       ├── api.js
│       └── dashboard.css
└── root/
    └── usr/share/
        ├── luci/menu.d/luci-app-nouveau.json
        └── rpcd/acl.d/luci-app-nouveau.json
```

4. Commit et push :
```bash
git add luci-app-nouveau/
git commit -m "feat: add luci-app-nouveau"
git push
```

## 🏷️ Créer une Release

```bash
# Créer un tag versionné
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0
```

La release sera créée automatiquement avec :
- Archives `.tar.gz` par architecture
- Archive globale toutes architectures
- Checksums SHA256
- Notes de release générées

## ⚙️ Configuration CI

### Variables d'Environnement

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENWRT_VERSION` | `23.05.5` | Version OpenWrt SDK |

### Secrets Requis

Aucun secret requis pour la compilation. Le `GITHUB_TOKEN` par défaut suffit pour créer les releases.

### Cache

Le SDK OpenWrt est mis en cache par architecture pour accélérer les builds suivants.

## 🧪 Tests & Validation

Le workflow `test-validate.yml` vérifie :

- ✅ Structure des Makefiles (champs requis)
- ✅ Syntaxe JSON (menu, ACL)
- ✅ Syntaxe JavaScript (views)
- ✅ Scripts shell (shellcheck)
- ✅ Permissions des fichiers
- ✅ Build test sur x86_64

## 📊 Matrice de Compatibilité

| OpenWrt | Status | Notes |
|---------|--------|-------|
| 24.10.x | 🔜 Prévu | En attente release |
| 23.05.x | ✅ Supporté | Recommandé |
| 22.03.x | ✅ Supporté | LTS |
| 21.02.x | ⚠️ Partiel | Fin de support |
| SNAPSHOT | ✅ Supporté | Instable |

## 🔗 Liens

- [OpenWrt SDK Documentation](https://openwrt.org/docs/guide-developer/using_the_sdk)
- [LuCI Development Guide](https://github.com/openwrt/luci/wiki)
- [CyberMind.fr](https://cybermind.fr)
- [SecuBox Project](https://cybermind.fr/secubox)

## 📄 License

Apache-2.0 © 2025 CyberMind.fr

---

**Made with ❤️ in France 🇫🇷**
