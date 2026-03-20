[English](README.md) | Francais | [中文](README.zh.md)

# LuCI CrowdSec Dashboard

**Version :** 0.4.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Un tableau de bord moderne, reactif et dynamique pour surveiller la securite CrowdSec sur les routeurs OpenWrt.

![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02%2B-blue)
![CrowdSec](https://img.shields.io/badge/CrowdSec-1.4%2B-green)

<p align="center">
  <img src="screenshots/overview.png" alt="Apercu du tableau de bord" width="800">
</p>

## Fonctionnalites

- **Vue d'ensemble en temps reel** - Surveillez les bannissements actifs, alertes et statut des bouncers en un coup d'oeil
- **Gestion des decisions** - Visualisez, recherchez, filtrez et gerez les bannissements IP directement depuis l'interface
- **Historique des alertes** - Parcourez et analysez les alertes de securite avec des informations detaillees sur les evenements
- **Tableau de bord des metriques** - Vue complete des metriques du moteur CrowdSec, parseurs et scenarios
- **Design reactif** - Fonctionne parfaitement sur ordinateur, tablette et mobile
- **Actualisation automatique** - Les donnees se mettent a jour automatiquement toutes les 30-60 secondes
- **Theme sombre** - Esthetique industrielle de cybersecurite optimisee pour les environnements a faible luminosite

## Installation

### Depuis le depot de paquets OpenWrt (recommande)

```bash
opkg update
opkg install luci-app-crowdsec-dashboard
```

### Installation manuelle

1. Telechargez la derniere version depuis la page [Releases](https://github.com/YOUR_USERNAME/luci-app-crowdsec-dashboard/releases)

2. Transferez vers votre appareil OpenWrt :
```bash
scp luci-app-crowdsec-dashboard_*.ipk root@router:/tmp/
```

3. Installez le paquet :
```bash
opkg install /tmp/luci-app-crowdsec-dashboard_*.ipk
```

4. Redemarrez uhttpd :
```bash
/etc/init.d/uhttpd restart
/etc/init.d/rpcd restart
```

### Compilation depuis les sources

1. Clonez dans votre environnement de compilation OpenWrt :
```bash
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/YOUR_USERNAME/luci-app-crowdsec-dashboard.git
```

2. Mettez a jour les feeds et selectionnez le paquet :
```bash
cd ~/openwrt
./scripts/feeds update -a
./scripts/feeds install -a
make menuconfig
# Naviguez vers LuCI → Applications → luci-app-crowdsec-dashboard
```

3. Compilez :
```bash
make package/luci-app-crowdsec-dashboard/compile V=s
```

## Pre-requis

- OpenWrt 21.02 ou ulterieur
- Moteur de securite CrowdSec installe et en cours d'execution
- CrowdSec Firewall Bouncer (recommande)
- Interface web LuCI

### Paquets CrowdSec recommandes :
```bash
opkg install crowdsec crowdsec-firewall-bouncer
```

## Captures d'ecran

### Tableau de bord principal
Statistiques en temps reel, scenarios principaux et visualisation des pays.

### Gestionnaire de decisions
Tableau complet avec recherche, tri, actions groupees et capacite de bannissement manuel.

### Historique des alertes
Vue chronologique de tous les evenements de securite avec options de filtrage.

### Vue des metriques
Metriques detaillees du moteur, statut des bouncers et composants du hub.

## Architecture

```
luci-app-crowdsec-dashboard/
├── Makefile                          # Instructions de compilation OpenWrt
├── htdocs/
│   └── luci-static/resources/
│       ├── crowdsec-dashboard/
│       │   ├── api.js               # Module API RPC
│       │   └── dashboard.css        # Styles du theme cybersecurite
│       └── view/crowdsec-dashboard/
│           ├── overview.js          # Vue principale du tableau de bord
│           ├── decisions.js         # Gestion des decisions
│           ├── alerts.js            # Historique des alertes
│           └── metrics.js           # Affichage des metriques
├── root/
│   ├── usr/libexec/rpcd/
│   │   └── crowdsec                 # Backend RPCD (script shell)
│   └── usr/share/
│       ├── luci/menu.d/             # Configuration du menu
│       └── rpcd/acl.d/              # Permissions ACL
└── po/                              # Traductions
```

## Points d'acces API

Le tableau de bord utilise des appels RPC ubus via le module RPCD `crowdsec` :

| Methode | Description |
|---------|-------------|
| `decisions` | Obtenir toutes les decisions actives |
| `alerts` | Obtenir l'historique des alertes avec limite |
| `metrics` | Obtenir les metriques Prometheus |
| `bouncers` | Lister les bouncers enregistres |
| `machines` | Lister les machines enregistrees |
| `hub` | Obtenir le statut du hub (collections, parseurs, scenarios) |
| `status` | Obtenir le statut du service |
| `stats` | Obtenir les statistiques agregees du tableau de bord |
| `ban` | Ajouter un bannissement IP manuel |
| `unban` | Supprimer un bannissement IP |

## Personnalisation

### Modifier le theme

Editez `/htdocs/luci-static/resources/crowdsec-dashboard/dashboard.css` :

```css
:root {
    --cs-bg-primary: #0a0e14;
    --cs-accent-green: #00d4aa;
    /* ... modifiez les couleurs selon vos besoins */
}
```

### Ajouter de nouvelles metriques

1. Ajoutez la methode RPC dans `/root/usr/libexec/rpcd/crowdsec`
2. Declarez l'appel RPC dans `/htdocs/luci-static/resources/crowdsec-dashboard/api.js`
3. Creez le composant UI dans le fichier de vue approprie

## Contribuer

Les contributions sont les bienvenues ! N'hesitez pas a soumettre une Pull Request.

1. Forkez le depot
2. Creez votre branche de fonctionnalite (`git checkout -b feature/SuperFonctionnalite`)
3. Committez vos modifications (`git commit -m 'Ajoute SuperFonctionnalite'`)
4. Poussez vers la branche (`git push origin feature/SuperFonctionnalite`)
5. Ouvrez une Pull Request

## Licence

Ce projet est sous licence Apache License 2.0 - voir le fichier [LICENSE](LICENSE) pour les details.

## Remerciements

- [CrowdSec](https://crowdsec.net/) - Le moteur de securite open-source
- [OpenWrt](https://openwrt.org/) - La liberte de faire de votre reseau le votre
- [LuCI](https://github.com/openwrt/luci) - Interface de configuration OpenWrt

## Contact

**Gandalf** - CyberMind.fr

- Site web : [https://cybermind.fr](https://cybermind.fr)
- GitHub : [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

<p align="center">
  Fait avec passion pour les communautes OpenWrt et CrowdSec
</p>
