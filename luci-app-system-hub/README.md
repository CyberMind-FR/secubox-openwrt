# luci-app-system-hub

**Central Control & Remote Assistance Dashboard for OpenWrt**

🎛️ System Hub est un méta-dashboard centralisé pour OpenWrt permettant de gérer tous vos composants, surveiller la santé du système, et offrir une assistance à distance via RustDesk.

![System Hub Dashboard](https://cybermind.fr/images/system-hub-hero.png)

## ✨ Fonctionnalités

### 🧩 Gestion des Composants
- **Vue unifiée** de tous les composants installés
- **Actions rapides** : Start, Stop, Restart, Enable, Disable
- **État en temps réel** : Running, Stopped, Issues
- **Roadmap** : Composants planifiés pour le futur
- **Catégories** : Sécurité, Monitoring, Réseau, VPN, Automation

### 💚 Rapports de Santé
- **Score global** : 0-100 avec status healthy/warning/critical
- **Métriques** : CPU, RAM, Disque, Température, Réseau, Services
- **Seuils configurables** : Warning et Critical par métrique
- **Recommandations** automatiques basées sur l'état
- **Génération de rapports** PDF/Email
- **Historique** des health checks

### 🖥️ Assistance Remote (RustDesk)
- **ID unique** pour le support à distance
- **Approbation requise** pour chaque connexion
- **Session timeout** configurable
- **Notifications** de connexion
- **Accès sans surveillance** (optionnel)
- **Contact support** intégré

### 🔍 Collecte de Diagnostics
- **Logs système** : syslog, kernel, composants
- **Configuration** : network, wireless, firewall
- **Infos réseau** : interfaces, routes, ARP, connexions
- **Hardware** : CPU, mémoire, stockage
- **Anonymisation** des données sensibles
- **Archive compressée** (.tar.gz)
- **Envoi au support** en un clic

### 📋 Logs Unifiés
- **Agrégation** de tous les logs composants
- **Filtres** : source, niveau, recherche texte
- **Export CSV** pour analyse externe
- **Temps réel** avec rafraîchissement auto
- **Niveaux** : info, warning, error

### 📅 Tâches Planifiées
- **Rapport santé quotidien** (6h00)
- **Sauvegarde hebdomadaire** (dimanche 3h00)
- **Nettoyage logs** (retention 30 jours)
- **Cron jobs** personnalisables

## 🧩 Composants Supportés

### Installés (Actuels)

| Composant | Description | Catégorie |
|-----------|-------------|-----------|
| **CrowdSec** | Cybersécurité collaborative | 🔒 Security |
| **Netdata** | Monitoring temps réel | 📊 Monitoring |
| **Netifyd** | Deep Packet Inspection | 🌐 Network |
| **WireGuard** | VPN moderne | 🔐 VPN |
| **Network Modes** | Multi-mode réseau | 🔀 Network |
| **Client Guardian** | NAC & Portail Captif | 🛡️ Security |

### Roadmap (Planifiés)

| Composant | Description | Prévu |
|-----------|-------------|-------|
| **AdGuard Home** | Blocage publicités DNS | Q1 2025 |
| **Prometheus** | Métriques & Alerting | Q1 2025 |
| **Tailscale** | Mesh VPN zero-config | Q1 2025 |
| **Grafana** | Visualisation avancée | Q2 2025 |
| **Home Assistant** | Domotique intégrée | Q2 2025 |
| **ntopng** | Analyse trafic avancée | Q2 2025 |

## 📦 Installation

### Prérequis

```bash
opkg update
opkg install luci-base rpcd luci-lib-jsonc
```

### Installation optionnelle

```bash
# Pour RustDesk
opkg install rustdesk

# Pour les emails
opkg install msmtp

# Pour les diagnostics avancés
opkg install curl
```

### Installation du package

```bash
# Depuis les sources
git clone https://github.com/gkerma/luci-app-system-hub.git
cd luci-app-system-hub
make install

# Redémarrer rpcd
/etc/init.d/rpcd restart
```

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       System Hub Dashboard                        │
│  ┌──────────┬──────────┬────────┬───────────┬──────────┬──────┐ │
│  │ Overview │Components│ Health │ Assistance│Diagnostic│ Logs │ │
│  └──────────┴──────────┴────────┴───────────┴──────────┴──────┘ │
├──────────────────────────────────────────────────────────────────┤
│                          RPCD Backend                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ status | components | health | remote | diagnostics | logs │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                      Component Integration                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐   │
│  │ CrowdSec │ Netdata  │ Netifyd  │WireGuard │Client Guardian│   │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                      Remote Assistance                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   RustDesk Integration                      │  │
│  │            ID: 847 293 156 | Session Control                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Fichier UCI `/etc/config/system-hub`

```bash
# Configuration globale
config system-hub 'config'
    option enabled '1'
    option dashboard_refresh '30'
    option auto_health_check '1'
    option health_check_interval '3600'
    option debug_mode '0'

# Remote Assistance
config remote 'remote'
    option enabled '1'
    option rustdesk_enabled '1'
    option rustdesk_id '847293156'
    option require_approval '1'
    option notify_on_connect '1'

# Seuils de santé
config health 'health'
    option enabled '1'
    option cpu_warning '80'
    option cpu_critical '95'
    option memory_warning '80'
    option memory_critical '95'
    option disk_warning '80'
    option disk_critical '95'

# Diagnostics
config diagnostics 'diagnostics'
    option collect_logs '1'
    option collect_config '1'
    option anonymize_sensitive '1'
    option upload_enabled '0'

# Support
config support 'support'
    option provider 'CyberMind.fr'
    option email 'support@cybermind.fr'
    option ticket_url 'https://cybermind.fr/support'

# Composant
config component 'crowdsec'
    option name 'CrowdSec'
    option service 'crowdsec'
    option status 'installed'
    option category 'security'
```

## 📊 API RPCD

| Méthode | Description | Paramètres |
|---------|-------------|------------|
| `status` | État global du système | - |
| `components` | Liste tous les composants | - |
| `health` | Rapport de santé complet | - |
| `remote` | Config assistance remote | - |
| `logs` | Logs unifiés | `limit`, `source`, `level` |
| `schedules` | Tâches planifiées | - |
| `collect_diagnostics` | Générer archive | `include_logs`, `anonymize` |
| `generate_report` | Créer rapport santé | - |
| `start_remote_session` | Démarrer RustDesk | `type` |
| `manage_component` | Contrôler un service | `component`, `action` |
| `upload_diagnostic` | Envoyer au support | `file` |

## 🎨 Thème

- **Couleur principale** : Indigo gradient (#6366f1 → #8b5cf6)
- **Fond** : Dark mode (#0a0a0f, #12121a)
- **Status** : Green (ok), Amber (warning), Red (critical)
- **Font** : Inter (UI), JetBrains Mono (données)

## 📁 Structure du Package

```
luci-app-system-hub/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── system-hub/
│   │   ├── api.js
│   │   └── dashboard.css
│   └── view/system-hub/
│       ├── overview.js
│       ├── components.js
│       ├── health.js
│       ├── remote.js
│       ├── diagnostics.js
│       ├── logs.js
│       └── settings.js
└── root/
    ├── etc/
    │   ├── config/system-hub
    │   └── system-hub/
    │       ├── reports/
    │       └── diagnostics/
    └── usr/
        ├── libexec/rpcd/system-hub
        └── share/
            ├── luci/menu.d/luci-app-system-hub.json
            └── rpcd/acl.d/luci-app-system-hub.json
```

## 🔐 Sécurité

- **Approbation requise** pour sessions remote
- **Anonymisation** des configs dans les diagnostics
- **Logs sensibles** masqués (passwords, keys)
- **ACL** granulaires par méthode API
- **Timeout** des sessions remote

## 🛣️ Roadmap

- [x] Vue d'ensemble système
- [x] Gestion des composants
- [x] Rapports de santé
- [x] Intégration RustDesk
- [x] Collecte diagnostics
- [x] Logs unifiés
- [ ] Application mobile
- [ ] API REST externe
- [ ] Webhooks/Alertes
- [ ] Backup/Restore auto
- [ ] Multi-routeurs

## 📄 Licence

Apache-2.0 - Voir [LICENSE](LICENSE)

## 👤 Auteur

**Gandalf** - [CyberMind.fr](https://cybermind.fr)

---

*Votre centre de contrôle OpenWrt* 🎛️
