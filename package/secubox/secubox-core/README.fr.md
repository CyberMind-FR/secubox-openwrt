[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# Framework SecuBox Core

**Version** : 1.0.0
**Licence** : GPL-2.0
**Categorie** : Administration

## Apercu

SecuBox Core est le framework fondamental du systeme modulaire SecuBox. Il fournit une infrastructure unifiee pour gerer les appliances de securite basees sur OpenWrt via une architecture a plugins.

## Fonctionnalites

### Capacites de Base

- **AppStore Modulaire** : Decouverte, installation et gestion de modules basees sur plugins
- **Systeme de Profils** : Profils de configuration declaratifs, templates et macros
- **CLI Unifie** : Commande unique `secubox` pour toutes les operations
- **Surveillance de Sante** : Diagnostics et verifications de sante complets
- **Systeme de Recuperation** : Snapshots automatiques, rollback et reprise apres sinistre
- **Integration ubus** : API RPC complete pour LuCI et integration tierce

### Architecture

```
secubox-core
├── Services de Base
│   ├── daemon secubox-core (procd)
│   ├── interface RPC ubus
│   └── Surveillance de sante
│
├── Gestion des Modules
│   ├── Catalogue AppStore
│   ├── Decouverte de modules
│   ├── Resolution des dependances
│   └── Hooks de cycle de vie
│
├── Configuration
│   ├── Moteur de profils
│   ├── Rendu de templates
│   └── Execution de macros
│
└── Operations
    ├── Diagnostics
    ├── Snapshot/recuperation
    └── Verification
```

## Installation

### Depuis un Package

```bash
opkg update
opkg install secubox-core
```

### Depuis les Sources

```bash
# Dans le buildroot OpenWrt
make package/secubox/secubox-core/compile
make package/secubox/secubox-core/install
```

## Demarrage Rapide

### 1. Verifier le Statut du Systeme

```bash
secubox device status
```

Sortie :
```
Version: 0.8.0
Uptime: 1 day, 3:42
CPU Load: 0.45
Memory: 45%
Storage: 12%
WAN: 192.0.2.1 (eth0)
LAN: 192.168.1.1
```

### 2. Parcourir les Modules Disponibles

```bash
secubox app list
```

### 3. Installer un Module

```bash
secubox app install wireguard-vpn
```

### 4. Executer une Verification de Sante

```bash
secubox diag health
```

## Reference CLI

### Commandes Principales

```bash
secubox <commande> [sous-commande] [options]
```

| Commande  | Description                              |
|-----------|------------------------------------------|
| `app`     | Gerer les modules et l'AppStore          |
| `profile` | Gerer les profils et templates           |
| `device`  | Informations et gestion de l'appareil    |
| `net`     | Gestion reseau                           |
| `diag`    | Diagnostics et verifications de sante    |
| `ai`      | Copilote IA (optionnel, experimental)    |

### Commandes App

```bash
secubox app list                 # Lister tous les modules
secubox app search <requete>     # Rechercher des modules
secubox app info <module>        # Afficher les details du module
secubox app install <module>     # Installer un module
secubox app remove <module>      # Supprimer un module
secubox app update [module]      # Mettre a jour le(s) module(s)
secubox app health               # Verifier la sante des modules
```

### Commandes Profil

```bash
secubox profile list                  # Lister les profils disponibles
secubox profile show <profil>         # Afficher les details du profil
secubox profile apply <profil>        # Appliquer un profil
secubox profile validate <profil>     # Valider la syntaxe du profil
secubox profile export [fichier]      # Exporter la config actuelle
```

### Commandes Appareil

```bash
secubox device info           # Afficher les infos de l'appareil
secubox device status         # Afficher le statut systeme
secubox device reboot         # Redemarrer l'appareil
secubox device factory-reset  # Reinitialisation usine
secubox device backup [fichier]  # Sauvegarder la configuration
```

### Commandes Diagnostics

```bash
secubox diag health           # Executer une verification de sante
secubox diag logs [service]   # Voir les logs systeme
secubox diag trace <cible>    # Trace reseau
secubox diag report           # Generer un rapport de diagnostic
```

## Configuration

### Configuration UCI

**Fichier** : `/etc/config/secubox`

```
config core 'main'
    option enabled '1'
    option log_level 'info'
    option appstore_url 'https://repo.secubox.org/catalog'
    option health_check_interval '300'
    option ai_enabled '0'

config security 'enforcement'
    option sandboxing '1'
    option module_signature_check '0'
    option auto_update_check '1'

config diagnostics 'settings'
    option health_threshold_cpu '80'
    option health_threshold_memory '90'
    option health_threshold_storage '85'
```

### Repertoires

| Chemin                                  | Objectif                        |
|-----------------------------------------|---------------------------------|
| `/etc/config/secubox`                   | Configuration UCI               |
| `/etc/secubox/profiles/`                | Definitions de profils          |
| `/etc/secubox/templates/`               | Templates de configuration      |
| `/etc/secubox/macros/`                  | Macros reutilisables            |
| `/usr/share/secubox/plugins/catalog/`   | Catalogue de modules            |
| `/usr/share/secubox/modules/`           | Metadonnees de modules          |
| `/var/run/secubox/`                     | Etat d'execution                |
| `/var/log/secubox/`                     | Fichiers de log                 |
| `/overlay/secubox-backups/`             | Snapshots de configuration      |

## Systeme de Modules

### Catalogue de Modules

Les modules sont decouverts via des entrees de catalogue au format JSON :

**Emplacement** : `/usr/share/secubox/plugins/catalog/<module-id>.json`

Exemple :
```json
{
  "id": "wireguard-vpn",
  "name": "WireGuard VPN Manager",
  "version": "1.0.0",
  "category": "networking",
  "runtime": "native",
  "packages": {
    "required": ["luci-app-wireguard-vpn", "wireguard-tools"]
  },
  "capabilities": ["vpn-server", "vpn-client"],
  "requirements": {
    "min_ram_mb": 64,
    "min_storage_mb": 10
  }
}
```

### Cycle de Vie des Modules

1. **Decouverte** : Catalogue scanne pour les modules disponibles
2. **Validation** : Manifeste et dependances verifies
3. **Pre-installation** : Hooks de pre-installation executes
4. **Installation** : Packages opkg installes
5. **Post-installation** : Configuration post-installation
6. **Verification de Sante** : Sante du module verifiee

### Hooks

Les modules peuvent definir des hooks de cycle de vie :

- `pre_install` : Execute avant l'installation
- `post_install` : Execute apres l'installation
- `pre_remove` : Execute avant la suppression
- `post_remove` : Execute apres la suppression

## Systeme de Profils

### Structure des Profils

Les profils sont des configurations declaratives YAML/JSON :

```yaml
profile:
  id: home-office
  name: "Reseau Bureau a Domicile"

modules:
  required:
    - wireguard-vpn
    - dns-filter
    - bandwidth-manager

uci_overrides:
  network:
    lan:
      ipaddr: "192.168.10.1"
      netmask: "255.255.255.0"
```

### Application des Profils

```bash
# Simulation d'abord
secubox profile apply home-office --dryrun

# Appliquer le profil
secubox profile apply home-office
```

## Recuperation et Snapshots

### Snapshots Automatiques

Les snapshots sont automatiquement crees :
- Avant l'application d'un profil
- Avant l'installation d'un module
- Au premier demarrage

### Snapshots Manuels

```bash
# Creer un snapshot
secubox-recovery snapshot "mon-snapshot"

# Lister les snapshots
secubox-recovery list

# Restaurer depuis un snapshot
secubox-recovery restore mon-snapshot
```

### Mode Recuperation

```bash
secubox-recovery enter
```

## API ubus

### Objets Disponibles

```bash
ubus list luci.secubox
```

Objets :
- `luci.secubox` - Operations de base
- `luci.secubox.appstore` - Gestion des modules (legacy)
- `luci.secubox.profile` - Gestion des profils (legacy)
- `luci.secubox.diagnostics` - Verifications de sante (legacy)

### Exemple d'Utilisation

```bash
# Obtenir le statut systeme
ubus call luci.secubox getStatus

# Lister les modules
ubus call luci.secubox getModules

# Installer un module
ubus call luci.secubox installModule '{"module":"wireguard-vpn"}'

# Executer des diagnostics
ubus call luci.secubox runDiagnostics '{"target":"all"}'
```

## Surveillance de Sante

### Verifications de Sante

Le systeme surveille :
- Charge CPU
- Utilisation memoire
- Capacite de stockage
- Connectivite reseau
- Statut des modules
- Sante des services

### Seuils

Configurer dans `/etc/config/secubox` :

```
config diagnostics 'settings'
    option health_threshold_cpu '80'
    option health_threshold_memory '90'
    option health_threshold_storage '85'
```

### Verifications Automatisees

Les verifications de sante s'executent automatiquement toutes les 5 minutes (configurable) :

```
uci set secubox.main.health_check_interval='300'
uci commit secubox
```

## Securite

### Verification des Modules

Activer la verification des signatures :

```bash
uci set secubox.enforcement.module_signature_check='1'
uci commit secubox
```

### Sandboxing

Les modules s'executent avec des limites de ressources (quand supporte par le kernel) :

```
procd_set_param cgroup.memory.limit_in_bytes 134217728  # 128 MB
```

### Integration ACL

Toutes les methodes ubus sont protegees par le systeme ACL de LuCI.

## Depannage

### Verifier le Statut du Service

```bash
/etc/init.d/secubox-core status
```

### Voir les Logs

```bash
logread | grep secubox
```

ou

```bash
tail -f /var/log/secubox/core.log
```

### Redemarrer le Service

```bash
/etc/init.d/secubox-core restart
```

### Reinitialiser aux Valeurs par Defaut

```bash
uci revert secubox
/etc/init.d/secubox-core restart
```

### Recuperation

Si le systeme ne repond plus :

```bash
secubox-recovery enter
```

## Dependances

**Requises** :
- `libubox`
- `libubus`
- `libuci`
- `rpcd`
- `bash`
- `coreutils-base64`
- `jsonfilter`

**Optionnelles** :
- `python3` (pour le support des profils YAML)
- `signify-openbsd` ou `openssl` (pour la verification des signatures)

## Fichiers

### Executables

- `/usr/sbin/secubox` - Point d'entree CLI principal
- `/usr/sbin/secubox-core` - Daemon de base
- `/usr/sbin/secubox-appstore` - Gestionnaire AppStore
- `/usr/sbin/secubox-profile` - Moteur de profils
- `/usr/sbin/secubox-diagnostics` - Systeme de diagnostics
- `/usr/sbin/secubox-recovery` - Outils de recuperation
- `/usr/sbin/secubox-verify` - Outils de verification

### Scripts RPCD

- `/usr/libexec/rpcd/luci.secubox` - Interface ubus principale

### Scripts d'Init

- `/etc/init.d/secubox-core` - Service procd
- `/etc/uci-defaults/99-secubox-firstboot` - Provisioning au premier demarrage

## Licence

GPL-2.0

## Support

- Documentation : https://docs.secubox.org
- Issues : https://github.com/CyberMind-FR/secubox-openwrt/issues
- Communaute : https://forum.secubox.org
