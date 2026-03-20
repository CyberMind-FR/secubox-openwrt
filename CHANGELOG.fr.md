# Journal des modifications

**Langues:** [English](CHANGELOG.md) | Francais | [中文](CHANGELOG.zh.md)

Tous les changements notables apportes au projet SecuBox seront documentes dans ce fichier.

Le format est base sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet respecte le [Versionnage Semantique](https://semver.org/lang/fr/).

## [0.17.0] - 2026-01-31 - Premiere Version Publique

### Points forts

Cette version marque la **Premiere Version Publique** de SecuBox. Toutes les fonctionnalites principales sont desormais stables et pretes pour la production.

### Ajoute

- **Documentation de l'Architecture de Securite a Trois Boucles** (`DOCS/THREE-LOOP-ARCHITECTURE.md`)
  - Boucle 1 (Operationnelle) : Detection et blocage des menaces en temps reel
  - Boucle 2 (Tactique) : Correlation de motifs et reponse adaptive
  - Boucle 3 (Strategique) : Agregation du renseignement sur les menaces et evolution
- Cartographie de l'architecture montrant comment 38 modules s'integrent dans le modele a trois boucles
- Section feuille de route dans le README avec un plan en 5 phases vers la certification ANSSI
- Badge de version dans l'en-tete du README
- Documentation de la vision P2P Hub pour le developpement v0.18+
- Analyse du modele d'identite did:plc pour la confiance decentralisee des noeuds

### Modifie

- README.md restructure avec l'annonce de la Premiere Version Publique
- Statut change de "Developpement Actif" a "Pret pour la Production"
- URL du site web mise a jour vers secubox.maegia.tv
- Ajout du diagramme de l'Architecture a Trois Boucles dans l'apercu du README

### Securite

- Documentation complete de l'implementation de la Boucle 1 :
  - Filtrage de paquets nftables/fw4 (latence < 1ms)
  - Classification DPI netifyd (< 10ms)
  - Application CrowdSec Bouncer (propagation < 1s)
- Documentation complete de l'implementation de la Boucle 2 :
  - Analyse des journaux par l'Agent CrowdSec
  - Moteur de decision local LAPI
  - Scenarios OpenWrt personnalises
  - Correlation des metriques Netdata

### Feuille de route

| Phase | Version | Statut |
|-------|---------|--------|
| Maillage Principal | v0.17 | Publie |
| Maillage de Services | v0.18 | Suivant |
| Maillage d'Intelligence | v0.19 | Planifie |
| Maillage IA | v0.20 | Planifie |
| Certification | v1.0 | Planifie |

---

## [0.16.0] - 2026-01-27

### Ajoute
- Documentation des exigences de compilation SDK vs toolchain complet
- Tableau des exigences de compilation dans README.md distinguant les compilations SDK et toolchain
- Notes de compatibilite ARM64 LSE atomics pour MochaBin/Cortex-A72

### Modifie
- README.md mis a jour avec les 38 modules categorises par fonction
- secubox-tools/README.md mis a jour en v1.1.0 avec les recommandations toolchain
- CLAUDE.md mis a jour avec les regles critiques de compilation toolchain

### Corrige
- Documentation de la correction du crash SIGILL pour les packages Go CGO sur ARM64 (utiliser le toolchain complet)

## [0.15.4] - 2026-01-21

### Ajoute
- Interface LuCI de compilation et publication HexoJS pour l'integration du workflow Gitea
- Gestion multi-instances pour la plateforme Streamlit

### Corrige
- Configuration du port LAPI CrowdSec pour les deploiements multi-instances

## [0.15.3] - 2026-01-14

### Ajoute
- Gestion amelioree des instances HAProxy et support cron ACME
- Options de configuration specifiques aux instances Streamlit

### Corrige
- Probleme de chargement des valeurs de la page de parametres Streamlit

## [0.15.0] - 2025-12-29

### Ajoute
- Composant de navigation unifie SecuNav sur tous les modules
- Synchronisation des themes avec support sombre/clair/cyberpunk
- Outillage Quick Deploy avec profils et verification

### Modifie
- Toutes les vues appellent maintenant Theme.init() pour une thematisation coherente
- Menu Surveillance simplifie (sans shim /overview)
- Les vues Dashboard, Modules, Surveillance utilisent le style SecuNav

### Corrige
- Conformite ACL du System Hub pour les diagnostics et methodes RPC distantes
- Ameliorations du validateur pour les menus LuCI inter-modules
- Permissions des assets CSS/JS reinitialises a 644

## [0.14.0] - 2025-12-28

### Ajoute
- Selecteur de theme avec apercu en direct dans les Parametres
- Jetons de design partages dans secubox/common.css

### Modifie
- La page Alertes reprend le style du tableau de bord avec des puces d'en-tete dynamiques
- La vue Parametres adopte les onglets SecuNav et le langage de design partage

## [0.13.0] - 2025-12-24

### Modifie
- Vue Modules avec onglets de filtre, cartes responsives et statistiques en direct
- Vue Surveillance avec graphiques sparkline SVG et actualisation automatique

## [0.12.0] - 2025-12-20

### Ajoute
- Statistiques hero du tableau de bord et onglets superieurs SecuNav
- Composant de mise en page unifie sh-page-header

---

## Inventaire des Modules (38 modules a partir de 0.17.0)

### Coeur SecuBox (5)
- luci-app-secubox
- luci-app-secubox-portal
- luci-app-secubox-admin
- luci-app-secubox-bonus
- luci-app-system-hub

### Securite et Gestion des Menaces (9)
- luci-app-crowdsec-dashboard
- luci-app-secubox-security-threats
- luci-app-client-guardian
- luci-app-auth-guardian
- luci-app-exposure
- luci-app-tor-shield
- luci-app-mitmproxy
- luci-app-cyberfeed
- luci-app-ksm-manager

### Inspection Approfondie des Paquets (2)
- luci-app-ndpid
- luci-app-secubox-netifyd

### Reseau et Connectivite (8)
- luci-app-vhost-manager
- luci-app-haproxy
- luci-app-wireguard-dashboard
- luci-app-network-modes
- luci-app-network-tweaks
- luci-app-mqtt-bridge
- luci-app-cdn-cache
- luci-app-media-flow

### Gestion de la Bande Passante et du Trafic (2)
- luci-app-bandwidth-manager
- luci-app-traffic-shaper

### Plateformes de Contenu et Web (5)
- luci-app-gitea
- luci-app-hexojs
- luci-app-metabolizer
- luci-app-magicmirror2
- luci-app-mmpm

### IA/LLM et Analytique (4)
- luci-app-localai
- luci-app-ollama
- luci-app-glances
- luci-app-netdata-dashboard

### Streaming et Traitement de Donnees (2)
- luci-app-streamlit
- luci-app-picobrew

### IoT et Appareils Connectes (1)
- luci-app-zigbee2mqtt
