# SecuBox - Suite de Sécurité pour OpenWrt

**Version :** 1.0.0-beta
**Dernière mise à jour :** 2026-03-15
**Statut :** Beta — Prêt pour Pen Testing & Bug Bounty
**Modules :** 86 Applications LuCI

[![Build OpenWrt Packages](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml/badge.svg)](https://github.com/CyberMind-FR/secubox-openwrt/actions/workflows/build-openwrt-packages.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/CyberMind-FR/secubox-openwrt?include_prereleases&label=release)](https://github.com/CyberMind-FR/secubox-openwrt/releases)

🌐 **Langues :** [English](README.md) | Français | [中文](README.zh.md)

---

## Présentation

SecuBox est une suite complète de sécurité et de gestion réseau pour OpenWrt, offrant un écosystème unifié de 86 tableaux de bord et outils spécialisés. La plateforme implémente une **Architecture à Quatre Couches** pour une défense en profondeur, avec analyse des menaces par IA, réseau mesh P2P et exposition multi-canal des services.

**Site Web :** [secubox.maegia.tv](https://secubox.maegia.tv)
**Éditeur :** [CyberMind.fr](https://cybermind.fr)

---

## Architecture à Quatre Couches

```
+============================================================+
|              COUCHE 4 : RÉSEAU MESH                         |
|              MirrorNet / Hub P2P / Miroirs de Services      |
|  +--------------------------------------------------------+ |
|  |           COUCHE 3 : PASSERELLE IA                     | |
|  |           Serveur MCP / Analyste Menaces / Garde DNS   | |
|  |  +----------------------------------------------------+ | |
|  |  |         COUCHE 2 : TACTIQUE                        | | |
|  |  |         CrowdSec / WAF / Scénarios                 | | |
|  |  |  +------------------------------------------------+ | | |
|  |  |  |       COUCHE 1 : OPÉRATIONNELLE                | | | |
|  |  |  |       fw4 / DPI / Bouncer / HAProxy            | | | |
|  |  |  +------------------------------------------------+ | | |
|  |  +----------------------------------------------------+ | |
|  +--------------------------------------------------------+ |
+============================================================+
```

| Couche | Fonction | Échelle de temps | Composants SecuBox |
|--------|----------|------------------|-------------------|
| **Couche 1** | Blocage temps réel | ms → secondes | nftables/fw4, netifyd DPI, CrowdSec Bouncer |
| **Couche 2** | Corrélation de motifs | minutes → heures | Agent/LAPI CrowdSec, WAF mitmproxy, Scénarios |
| **Couche 3** | Analyse IA | minutes → heures | Serveur MCP, Analyste Menaces, Garde DNS |
| **Couche 4** | Réseau mesh | continu | Hub P2P, MirrorBox, Registre de Services |

---

## Fonctionnalités Clés

### Sécurité

- **Intégration CrowdSec** — Renseignement sur les menaces en temps réel, inscription CAPI, bannissement automatique
- **WAF mitmproxy** — Inspection HTTPS avec détection CVE, bannissement automatique basé sur la sensibilité
- **Inspection Profonde des Paquets** — Analyse de protocoles netifyd/nDPId
- **Gardien MAC** — Détection de spoofing MAC WiFi avec intégration CrowdSec
- **Garde DNS** — Détection d'anomalies DNS par IA (DGA, tunneling)

### Passerelle IA

- **Serveur MCP** — Protocole Model Context pour intégration Claude Desktop
- **Analyste Menaces** — Agent IA autonome pour l'analyse des menaces et génération de règles
- **LocalAI** — LLM auto-hébergé avec gestion des modèles

### Réseau Mesh

- **Hub P2P** — Découverte décentralisée des pairs avec visualisation globe
- **MirrorBox** — Catalogue de services distribué avec synchronisation automatique
- **App Store** — Distribution P2P des paquets entre pairs mesh
- **Master Link** — Intégration mesh sécurisée avec génération IPK dynamique

### Exposition de Services

- **Punk Exposure** — Émancipation multi-canal des services (Tor + DNS/SSL + Mesh)
- **HAProxy** — Répartiteur de charge avec ACME webroot, SSL automatique
- **Tor Shield** — Services cachés .onion avec routage séparé

### Médias & Contenus

- **Jellyfin** — Serveur multimédia LXC avec assistant de configuration
- **Lyrion** — Serveur musical avec intégration CIFS
- **Zigbee2MQTT** — Conteneur LXC Alpine pour IoT
- **Domoticz** — Domotique avec pont MQTT

---

## Modules SecuBox (86 au total)

### Cœur (6 modules)

| Module | Description |
|--------|-------------|
| luci-app-secubox | Tableau de bord central/Hub |
| luci-app-secubox-portal | Point d'entrée unifié avec onglets |
| luci-app-secubox-admin | Centre de contrôle admin |
| secubox-app-bonus | App store et documentation |
| luci-app-system-hub | Contrôle système avec sauvegarde |
| luci-theme-secubox | Thème KISS UI |

### Sécurité (15 modules)

| Module | Description |
|--------|-------------|
| luci-app-crowdsec-dashboard | Monitoring CrowdSec |
| luci-app-security-threats | Netifyd + CrowdSec unifiés |
| luci-app-client-guardian | Portail captif, contrôle parental |
| luci-app-auth-guardian | OAuth2/OIDC, vouchers |
| luci-app-exposure | Gestionnaire d'exposition de services |
| luci-app-tor-shield | Anonymisation Tor |
| luci-app-mitmproxy | WAF inspection HTTPS |
| luci-app-mac-guardian | Sécurité MAC WiFi |
| luci-app-dns-guard | Anomalies DNS par IA |
| luci-app-waf | Pare-feu Applicatif Web |
| luci-app-threat-analyst | Analyse des menaces par IA |
| luci-app-ksm-manager | Gestion clés/HSM |
| luci-app-master-link | Intégration mesh |
| luci-app-routes-status | Vérificateur de routes VHosts |
| secubox-mcp-server | Serveur protocole MCP |

### Réseau (12 modules)

| Module | Description |
|--------|-------------|
| luci-app-haproxy | Répartiteur de charge avec SSL |
| luci-app-wireguard-dashboard | VPN WireGuard |
| luci-app-vhost-manager | Proxy inverse Nginx |
| luci-app-network-modes | Sniffer/AP/Relais/Routeur |
| luci-app-network-tweaks | Contrôles DNS & proxy |
| luci-app-dns-provider | API fournisseur DNS |
| luci-app-cdn-cache | Optimisation CDN |
| luci-app-bandwidth-manager | QoS et quotas |
| luci-app-traffic-shaper | Mise en forme TC/CAKE |
| luci-app-mqtt-bridge | USB vers MQTT IoT |
| luci-app-media-flow | Détection de streaming |
| luci-app-netdiag | Diagnostics réseau |

### DPI (2 modules)

| Module | Description |
|--------|-------------|
| luci-app-ndpid | Inspection profonde nDPId |
| luci-app-netifyd | Monitoring de flux netifyd |

### Mesh P2P (4 modules)

| Module | Description |
|--------|-------------|
| luci-app-p2p | Hub P2P avec MirrorBox |
| luci-app-service-registry | Catalogue de services |
| luci-app-device-intel | Intelligence appareil |
| secubox-content-pkg | Distribution de contenu |

### IA/LLM (4 modules)

| Module | Description |
|--------|-------------|
| luci-app-localai | LocalAI v3.9.0 |
| luci-app-ollama | Ollama LLM |
| luci-app-glances | Monitoring système |
| luci-app-netdata-dashboard | Netdata temps réel |

### Médias (7 modules)

| Module | Description |
|--------|-------------|
| luci-app-jellyfin | Serveur multimédia (LXC) |
| luci-app-lyrion | Serveur musical |
| luci-app-zigbee2mqtt | Passerelle Zigbee (LXC) |
| luci-app-domoticz | Domotique (LXC) |
| luci-app-ksmbd | Partages SMB/CIFS |
| luci-app-smbfs | Gestionnaire montages distants |
| luci-app-magicmirror2 | Affichage intelligent |

### Plateformes de Contenu (6 modules)

| Module | Description |
|--------|-------------|
| luci-app-gitea | Plateforme Git |
| luci-app-hexojs | Générateur de sites statiques |
| luci-app-metablogizer | CMS Metabolizer |
| luci-app-streamlit | Applications Streamlit |
| luci-app-picobrew | Serveur PicoBrew |
| luci-app-jitsi | Vidéoconférence |

### Accès Distant (3 modules)

| Module | Description |
|--------|-------------|
| luci-app-rustdesk | Relais RustDesk |
| luci-app-guacamole | Bureau sans client |
| luci-app-simplex | SimpleX Chat |

### *Plus 27 paquets de support supplémentaires...*

---

## Architectures Supportées

| Architecture | Cibles | Exemples d'Appareils |
|--------------|--------|----------------------|
| **ARM64** | aarch64-cortex-a53/a72, mediatek-filogic, rockchip-armv8 | MOCHAbin, NanoPi R4S/R5S, GL.iNet MT3000, Raspberry Pi 4 |
| **ARM32** | arm-cortex-a7/a9-neon, qualcomm-ipq40xx | Turris Omnia, Google WiFi |
| **MIPS** | mips-24kc, mipsel-24kc | TP-Link Archer, Xiaomi |
| **x86** | x86-64 | PC, VMs, Docker, Proxmox |

---

## Installation

### Depuis les Paquets Pré-compilés

```bash
opkg update
opkg install luci-app-secubox-portal_*.ipk
opkg install luci-app-crowdsec-dashboard_*.ipk
```

### Compilation depuis les Sources

```bash
# Cloner dans le SDK OpenWrt
cd ~/openwrt-sdk/package/
git clone https://github.com/CyberMind-FR/secubox-openwrt.git secubox

# Compiler
make package/secubox/luci-app-secubox-portal/compile V=s
```

### Ajouter comme Feed

```
src-git secubox https://github.com/CyberMind-FR/secubox-openwrt.git
```

---

## Intégration MCP (Claude Desktop)

SecuBox inclut un serveur MCP pour l'intégration IA :

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

**Outils disponibles :** `crowdsec.alerts`, `crowdsec.decisions`, `waf.logs`, `dns.queries`, `network.flows`, `system.metrics`, `wireguard.status`, `ai.analyze_threats`, `ai.cve_lookup`, `ai.suggest_waf_rules`

---

## Feuille de Route

| Version | Statut | Focus |
|---------|--------|-------|
| **v0.17** | Publiée | Mesh de base, 38 modules |
| **v0.18** | Publiée | Hub P2P, Passerelle IA, 86 modules |
| **v0.19** | Publiée | Intelligence P2P complète |
| **v1.0** | **Beta** | Pen testing, bug bounty, préparation ANSSI |
| **v1.1** | Planifiée | Certification ANSSI, version GA |

### Version Beta

Voir [BETA-RELEASE.md](BETA-RELEASE.md) pour les directives de tests de sécurité et le périmètre du bug bounty.

### Identifiants par Défaut (Appliance VM)

- **Nom d'utilisateur :** root
- **Mot de passe :** c3box (à changer à la première connexion !)

---

## Liens

- **Site Web** : [secubox.maegia.tv](https://secubox.maegia.tv)
- **GitHub** : [github.com/CyberMind-FR/secubox-openwrt](https://github.com/CyberMind-FR/secubox-openwrt)
- **Éditeur** : [CyberMind.fr](https://cybermind.fr)
- **Issues** : [GitHub Issues](https://github.com/CyberMind-FR/secubox-openwrt/issues)

---

## Licence

Apache-2.0 © 2024-2026 CyberMind.fr

---

## Auteur

**Gandalf** - [CyberMind.fr](https://cybermind.fr)

**Ex Tenebris, Lux Securitas**

Fabriqué en France
