# SecuBox Nextcloud

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Plateforme de synchronisation de fichiers et de collaboration auto-hebergee fonctionnant dans un conteneur LXC Debian sur OpenWrt. Comprend une base de donnees MariaDB, un cache Redis et un serveur web Nginx.

## Installation

```bash
opkg install secubox-app-nextcloud luci-app-nextcloud
```

## Demarrage rapide

```bash
# Installer Nextcloud (cree le conteneur LXC)
nextcloudctl install

# Demarrer le service
/etc/init.d/nextcloud start

# Acceder a l'interface web
# http://router-ip:8080
```

## Configuration

Fichier de configuration UCI : `/etc/config/nextcloud`

```bash
uci set nextcloud.main.enabled='1'
uci set nextcloud.main.domain='cloud.example.com'
uci set nextcloud.main.http_port='8080'
uci set nextcloud.main.admin_user='admin'
uci set nextcloud.main.memory_limit='1G'
uci set nextcloud.main.upload_max='512M'
uci commit nextcloud
```

## Commandes CLI

```bash
nextcloudctl install          # Creer un LXC Debian, installer la pile Nextcloud
nextcloudctl uninstall        # Supprimer le conteneur (conserve les donnees)
nextcloudctl update           # Mettre a jour Nextcloud vers la derniere version
nextcloudctl start            # Demarrer le service Nextcloud
nextcloudctl stop             # Arreter le service Nextcloud
nextcloudctl restart          # Redemarrer le service Nextcloud
nextcloudctl status           # Afficher l'etat du service (JSON)
nextcloudctl logs [-f]        # Afficher les logs du conteneur
nextcloudctl shell            # Ouvrir un shell dans le conteneur

nextcloudctl occ <cmd>        # Executer une commande OCC Nextcloud
nextcloudctl backup [name]    # Creer une sauvegarde des donnees et de la base
nextcloudctl restore <name>   # Restaurer a partir d'une sauvegarde
nextcloudctl list-backups     # Lister les sauvegardes disponibles

nextcloudctl ssl-enable <domain>  # Enregistrer avec HAProxy pour SSL
nextcloudctl ssl-disable          # Supprimer l'enregistrement HAProxy
```

## Architecture

```
+---------------------------------------------------------+
|                     Hote OpenWrt                         |
|  +---------------------------------------------------+  |
|  |              LXC: nextcloud (Debian 12)           |  |
|  |  +---------+  +---------+  +---------+  +-------+ |  |
|  |  | Nginx   |  |Nextcloud|  | MariaDB |  | Redis | |  |
|  |  | :8080   |->| PHP-FPM |->| :3306   |  | :6379 | |  |
|  |  +---------+  +---------+  +---------+  +-------+ |  |
|  |                    |                              |  |
|  |         /srv/nextcloud (montage bind)             |  |
|  +---------------------------------------------------+  |
|                          |                               |
|  +---------------------------------------------------+  |
|  |           HAProxy (terminaison SSL optionnelle)   |  |
|  |      cloud.example.com:443 -> nextcloud:8080      |  |
|  +---------------------------------------------------+  |
+---------------------------------------------------------+
```

## Fonctionnalites

- Synchronisation et partage de fichiers avec clients web, bureau et mobile
- Calendrier et contacts (CalDAV/CardDAV)
- Edition collaborative de documents
- Support du chiffrement de bout en bout
- Conteneur LXC Debian avec PHP 8.2
- Base de donnees MariaDB avec parametres optimises
- Cache Redis pour des performances ameliorees
- Nginx avec configuration optimisee pour Nextcloud
- Integration HAProxy pour SSL/HTTPS
- Sauvegarde et restauration automatisees
- Limite de memoire via cgroups
- Demarrage automatique au boot

## Emplacements des donnees

```
/srv/nextcloud/
├── data/           # Donnees utilisateur Nextcloud
├── config/         # config.php Nextcloud
└── backups/        # Sauvegardes automatisees
```

## SSL avec HAProxy

```bash
# Activer HTTPS via HAProxy avec Let's Encrypt
nextcloudctl ssl-enable cloud.example.com

# Acceder via HTTPS
https://cloud.example.com
```

## Dependances

- `lxc` - Runtime de conteneur
- `lxc-common` - Utilitaires LXC
- `tar`, `wget-ssl`, `unzip`, `xz` - Outils d'archivage
- `jsonfilter` - Analyse JSON
- `openssl-util` - Utilitaires SSL

## Licence

Apache-2.0
