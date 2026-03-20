# luci-app-secubox-bonus

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Package de contenu bonus SecuBox - Site web de marketing et documentation pour les modules SecuBox.

## Description

Ce package fournit la documentation officielle SecuBox, les demos et le contenu marketing sous forme de pages HTML statiques accessibles via l'interface web du routeur.

## Contenu

- **Pages de demo** (16 modules) : Demonstrations interactives des modules SecuBox
  - Auth Guardian, Bandwidth Manager, CDN Cache, Client Guardian
  - CrowdSec, KSM Manager, Media Flow, Netdata, Netifyd
  - Network Modes, SecuBox Hub, Traffic Shaper, VHost Manager, WireGuard

- **Articles de blog** : Guides d'installation et tutoriels
  - Guide d'installation Auth Guardian
  - Guide Bandwidth Manager
  - SaaS local avec VHost Manager

- **Marketing** : Pages de campagne et d'atterrissage

- **Internationalisation** : Support multilingue (13 langues)
  - Anglais, Francais, Allemand, Espagnol, Portugais, Italien
  - Neerlandais, Russe, Arabe, Chinois, Japonais, Coreen, Hindi

## Installation

### Depuis le package

```bash
opkg update
opkg install luci-app-secubox-bonus
```

### Depuis les sources

```bash
make package/luci-app-secubox-bonus/compile
```

## Acces

Apres installation, le contenu est disponible a :

```
http://<ip-routeur>/luci-static/secubox/
```

### URLs

- Page d'accueil : `/luci-static/secubox/index.html`
- Pages de demo : `/luci-static/secubox/demo-<module>.html`
- Articles de blog : `/luci-static/secubox/blog/<article>.html`
- Campagne : `/luci-static/secubox/campaign.html`

## Structure des fichiers

```
/www/luci-static/secubox/
├── index.html                    # Page d'accueil principale
├── campaign.html                 # Campagne marketing
├── demo-*.html                   # Demonstrations des modules (16 fichiers)
├── blog/                         # Tutoriels et guides
│   ├── auth-guardian-setup.html
│   ├── bandwidth-manager-guide.html
│   └── local-saas-vhost.html
└── i18n/                         # Traductions (13 langues)
    └── *.json
```

## Informations sur le package

- **Version** : 0.1.0-1
- **Licence** : Apache-2.0
- **Mainteneur** : CyberMind <contact@cybermind.fr>
- **Taille** : ~500KB (36 fichiers)
- **Dependances** : luci-base

## Developpement

Le contenu source est maintenu dans le depot `secubox-website` et synchronise avec ce package lors des builds.

### Mettre a jour le contenu

Pour mettre a jour le contenu du site web :

1. Mettre a jour les fichiers dans `~/CyberMindStudio/_files/secubox-website/`
2. Reconstruire le package ou utiliser le script de deploiement :

```bash
./secubox-tools/deploy-website.sh root@192.168.8.205 ~/CyberMindStudio/_files/secubox-website
```

## Notes

- Ce package contient uniquement des fichiers statiques (HTML, JS, JSON)
- Aucun composant backend/RPCD requis
- Pas d'integration au menu - contenu accessible via URLs directes
- Les fichiers sont en lecture seule et servis par uhttpd
- Les mises a jour de contenu necessitent une reinstallation du package ou un deploiement manuel

## Voir aussi

- `luci-app-secubox` - SecuBox Hub (panneau de controle principal)
- `luci-theme-secubox` - Theme SecuBox et composants UI
- Documentation : https://secubox.cybermood.eu/
