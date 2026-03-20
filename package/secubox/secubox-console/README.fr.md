[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox Console et Reference des Outils CLI

**Point de Gestion a Distance pour les Appareils SecuBox**

Architecture modulaire KISS auto-ameliorante.

## Apercu

Deux applications pour la gestion centralisee de plusieurs appareils SecuBox :

1. **secubox-console** - Outil de gestion oriente CLI (natif OpenWrt)
2. **secubox-frontend** - Tableau de bord TUI moderne avec Textual (Linux/PC)

## Installation Rapide

### Sur SecuBox (OpenWrt)
```bash
opkg install secubox-console
```

### Sur n'importe quel PC Linux
```bash
pip install textual paramiko httpx rich
python3 secubox_frontend.py
```

### Installateur en Une Ligne
```bash
curl -sL https://feed.maegia.tv/install-console.sh | bash
```

---

## Lexique des Outils CLI SecuBox

Reference complete de tous les outils en ligne de commande `secubox-*`.

### Outils Systeme de Base

#### secubox-core
CLI du centre de controle principal SecuBox.
```bash
secubox-core status      # Statut du deploiement et sante des services
secubox-core info        # Informations systeme et SecuBox
secubox-core config      # Gerer les parametres de configuration
secubox-core services    # Lister les services installes
secubox-core version     # Informations de version
```

#### secubox-swiss
Utilitaire couteau suisse multi-usage.
```bash
secubox-swiss            # Menu interactif
secubox-swiss mesh       # Operations maillage
secubox-swiss recover    # Outils de recuperation
secubox-swiss console    # Console distante
secubox-swiss mitm       # Logs proxy MITM
```

#### secubox-state
Gestion de l'etat systeme et persistance.
```bash
secubox-state get <cle>        # Interroger l'etat
secubox-state set <cle> <val>  # Mettre a jour l'etat
secubox-state list             # Lister tout l'etat
```

#### secubox-component
Gestion du cycle de vie des composants.
```bash
secubox-component list        # Lister les composants
secubox-component status      # Statut des composants
secubox-component update      # Mettre a jour les composants
```

---

### Recuperation et Sauvegarde

#### secubox-recover
Systeme complet de sauvegarde/restauration avec profils et snapshots.
```bash
secubox-recover snapshot [nom]      # Creer un snapshot
secubox-recover list                # Lister les snapshots
secubox-recover restore <nom>       # Restaurer un snapshot
secubox-recover profile save <nom>  # Sauvegarder un profil
secubox-recover profile apply <nom> # Appliquer un profil
secubox-recover apps sync           # Synchroniser les configs d'apps
secubox-recover reborn              # Generer un script de renaissance
```

#### secubox-recovery
Sauvegarde et rollback de configuration.
```bash
secubox-recovery snapshot [nom]    # Creer un snapshot de config
secubox-recovery list [--json]     # Lister les snapshots
secubox-recovery restore <nom>     # Restaurer depuis un snapshot
secubox-recovery rollback          # Rollback au dernier
secubox-recovery enter             # Mode de recuperation interactif
```

#### secubox-restore
Bootstrap d'auto-recuperation depuis Gitea.
```bash
secubox-restore --interactive
secubox-restore <serveur> <owner> <repo> [token]
secubox-restore --branch dev --include-network
```

---

### Reseau Maille et P2P

#### secubox-mesh
Configuration du reseau maille P2P.
```bash
secubox-mesh status      # Statut du maillage
secubox-mesh peers       # Lister les pairs
secubox-mesh sync        # Synchroniser les catalogues
secubox-mesh discover    # Decouvrir les pairs
```

#### secubox-p2p
Gestionnaire de Hub P2P pour la decouverte de pairs et la federation.
```bash
secubox-p2p daemon              # Executer le daemon de decouverte
secubox-p2p discover [timeout]  # Decouverte mDNS des pairs
secubox-p2p peers               # Lister les pairs connus
secubox-p2p add-peer <ip> [nom] # Ajouter un pair manuellement
secubox-p2p remove-peer <id>    # Supprimer un pair
secubox-p2p services            # Lister les services locaux
secubox-p2p shared-services     # Agreger depuis les pairs
secubox-p2p sync                # Synchroniser le catalogue de services
secubox-p2p broadcast <cmd>     # Executer sur tous les pairs
secubox-p2p settings            # Afficher la config P2P
```

---

### Registre de Services et Exposition

#### secubox-registry
Gestion unifiee des services avec integration HAProxy/Tor.
```bash
secubox-registry list                  # Lister les services publies
secubox-registry show <service>        # Details du service
secubox-registry publish <svc> --domain example.com --tor
secubox-registry unpublish <service>   # Retirer du registre
secubox-registry landing               # Statut de la page d'accueil
secubox-registry categories            # Lister les categories
```

#### secubox-exposure
Gestion des ports, services caches Tor, backends HAProxy.
```bash
secubox-exposure scan               # Decouvrir les ports en ecoute
secubox-exposure conflicts          # Identifier les conflits de ports
secubox-exposure fix-port <svc>     # Auto-assigner un port libre
secubox-exposure status             # Statut d'exposition
secubox-exposure tor add <svc>      # Ajouter un service cache Tor
secubox-exposure tor list           # Lister les adresses .onion
secubox-exposure ssl add <svc> <dom># Ajouter un backend SSL HAProxy
```

---

### Gestion des Applications

#### secubox-app
CLI des Apps pour les manifestes de plugins et installations.
```bash
secubox-app list              # Afficher tous les plugins
secubox-app show <plugin>     # Details du manifeste
secubox-app install <plugin>  # Installer avec dependances
secubox-app remove <plugin>   # Desinstaller le plugin
secubox-app status <plugin>   # Statut du plugin
secubox-app update <plugin>   # Mettre a jour vers la derniere version
secubox-app validate          # Valider tous les manifestes
```

#### secubox-appstore
Decouverte et gestion des packages d'applications.
```bash
secubox-appstore list         # Applications disponibles
secubox-appstore search <q>   # Rechercher des apps
secubox-appstore install <app># Installer une application
secubox-appstore info <app>   # Details de l'app
```

---

### Gestion du Feed de Packages

#### secubox-feed
Gestionnaire de feed de packages local et distant.
```bash
secubox-feed update           # Regenerer l'index Packages
secubox-feed sync             # Synchroniser vers opkg-lists
secubox-feed fetch <url>      # Telecharger un IPK depuis une URL
secubox-feed list             # Lister les packages du feed
secubox-feed info <pkg>       # Metadonnees du package
secubox-feed install <pkg>    # Installer depuis le feed
secubox-feed install all      # Installer tous les packages
secubox-feed clean            # Supprimer les anciennes versions
```

---

### Diagnostics et Surveillance

#### secubox-diagnostics
Diagnostics systeme complets.
```bash
secubox-diagnostics health       # Verifications de sante
secubox-diagnostics report       # Rapport de diagnostic
secubox-diagnostics logs         # Collecter les logs
secubox-diagnostics performance  # Utilisation des ressources
secubox-diagnostics network      # Diagnostics reseau
```

#### secubox-log
Outil d'agregation centrale des logs.
```bash
secubox-log --message "Evenement survenu"
secubox-log --tag security --message "Alerte"
secubox-log --payload '{"cle":"valeur"}'
secubox-log --snapshot           # Snapshot de diagnostic systeme
secubox-log --tail 50            # 50 dernieres lignes
```

---

## Application Frontend TUI

### Fonctionnalites
- Tableau de bord multi-appareils avec statut en temps reel
- Decouverte d'appareils (scan reseau, mDNS, API maillage)
- Execution de commandes a distance via SSH
- Orchestration de sauvegardes sur tous les appareils
- Interface a onglets : Tableau de bord, Alertes, Maillage, Parametres
- Degradation gracieuse : Textual -> Rich -> CLI simple

### Raccourcis Clavier
| Touche | Action |
|--------|--------|
| `q` | Quitter |
| `r` | Rafraichir le statut |
| `s` | Synchroniser tous les appareils |
| `d` | Lancer la decouverte |
| `b` | Sauvegarder la selection |
| `Tab` | Changer d'onglet |

### Configuration
```
~/.secubox-console/
├── devices.json      # Appareils sauvegardes
├── plugins/          # Plugins personnalises
├── cache/            # Donnees en cache
└── console.log       # Fichier de log
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SecuBox Console/Frontend                  │
├─────────────────────────────────────────────────────────────┤
│  Commandes Core  │  Systeme Plugins │  Gestionnaire SSH │TUI │
├──────────────────┼─────────────────┼───────────────────┼────┤
│  Stockage Appar. │  Client Maillage │  Decouverte       │Text│
└─────────────────────────────────────────────────────────────┘
         │                  │                 │
         ▼                  ▼                 ▼
   ┌──────────┐       ┌──────────┐      ┌──────────┐
   │ SecuBox  │  ...  │ SecuBox  │ ...  │ SecuBox  │
   │  Noeud 1 │       │  Noeud 2 │      │  Noeud N │
   └──────────┘       └──────────┘      └──────────┘
```

### Infrastructure Cle
- **Configuration** : Basee sur UCI (`/etc/config/secubox-*`)
- **Communication** : UBUS JSON-RPC
- **Serveur Web** : uhttpd + LuCI
- **Exposition** : HAProxy (domaines, SSL), Tor (.onion)
- **Packages** : opkg avec feed personnalise
- **Sauvegarde** : Basee sur Git via Gitea
- **Maillage** : Decouverte P2P, synchronisation, federation
- **Parsing JSON** : `jsonfilter` (pas jq)

### Emplacements de Stockage
- Configs UCI : `/etc/config/`
- Sauvegardes : `/overlay/secubox-backups/`
- Feed de packages : `/www/secubox-feed/`
- Etat P2P : `/tmp/secubox-p2p-*.json`
- Logs : `/var/log/secubox.log`

---

## Developpement de Plugins

Creez des plugins dans `~/.secubox-console/plugins/` :

```python
# mon_plugin.py
PLUGIN_INFO = {
    "name": "mon-plugin",
    "version": "1.0.0",
    "description": "Mon plugin personnalise",
    "author": "Votre Nom",
    "commands": ["macommande"]
}

def register_commands(console):
    console.register_command("macommande", cmd_macommande, "Description")

def cmd_macommande(args):
    print("Bonjour depuis le plugin !")
```

---

## Prerequis

- Python 3.8+
- `textual>=0.40.0` - Framework TUI moderne
- `paramiko>=3.0.0` - Connexions SSH
- `httpx>=0.25.0` - Appels HTTP/API
- `rich>=13.0.0` - Console riche (fallback)

---

## Licence

Licence MIT - CyberMind 2026
