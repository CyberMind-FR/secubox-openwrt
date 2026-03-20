[English](README.md) | Francais | [中文](README.zh.md)

# RezApp Forge

Convertisseur d'applications Docker vers SecuBox LXC.

## Presentation

RezApp Forge convertit les images Docker en conteneurs LXC et genere des packages addon SecuBox. Parcourez les catalogues Docker Hub, GHCR et LinuxServer.io, convertissez les images en LXC et publiez sur le store d'applications SecuBox.

## Fonctionnalites

- **Gestion de Catalogue** - Support Docker Hub, LinuxServer.io, GHCR
- **Recherche Docker** - Rechercher des images dans tous les catalogues actives
- **Info Image** - Voir les tags et architectures disponibles
- **Docker vers LXC** - Convertir les images Docker en conteneurs LXC
- **Generation de Package** - Auto-generer des packages addon SecuBox
- **Publication Catalogue** - Ajouter les applications converties au catalogue SecuBox

## Installation

```bash
opkg install secubox-app-rezapp
```

## Utilisation CLI

```bash
# Gestion du catalogue
rezappctl catalog list              # Lister les catalogues actives
rezappctl catalog add <name> <url>  # Ajouter un catalogue personnalise
rezappctl catalog remove <name>     # Supprimer un catalogue

# Rechercher des images Docker
rezappctl search <query>            # Rechercher dans tous les catalogues
rezappctl search heimdall           # Exemple : rechercher heimdall
rezappctl info <image>              # Afficher les details de l'image

# Convertir Docker en LXC
rezappctl convert <image> [options]
  --name <app-name>     # Nom d'application personnalise
  --tag <version>       # Tag de l'image (defaut : latest)
  --memory <limit>      # Limite memoire (defaut : 512M)

# Generer un package SecuBox
rezappctl package <app-name>        # Creer un package depuis l'application convertie

# Publier au catalogue
rezappctl publish <app-name>        # Ajouter le manifeste au catalogue SecuBox

# Lister les applications converties
rezappctl list                      # Afficher toutes les applications converties
```

## Exemple de Workflow

```bash
# 1. Rechercher une application
rezappctl search heimdall

# 2. Verifier les tags disponibles
rezappctl info linuxserver/heimdall

# 3. Convertir en LXC
rezappctl convert linuxserver/heimdall --name heimdall --memory 512M

# 4. Generer le package SecuBox
rezappctl package heimdall

# 5. Publier au catalogue
rezappctl publish heimdall
```

## Configuration

Config UCI : `/etc/config/rezapp`

```
config main 'main'
    option cache_dir '/srv/rezapp/cache'
    option output_dir '/srv/rezapp/generated'
    option apps_dir '/srv/rezapp/apps'
    option lxc_dir '/srv/lxc'
    option default_memory '512M'

config catalog 'dockerhub'
    option name 'Docker Hub'
    option type 'dockerhub'
    option enabled '1'

config catalog 'linuxserver'
    option name 'LinuxServer.io'
    option type 'dockerhub'
    option namespace 'linuxserver'
    option enabled '1'
```

## Processus de Conversion

1. **Pull** - Telecharger l'image Docker
2. **Export** - Creer un conteneur et exporter le systeme de fichiers
3. **Extract** - Decompresser vers le rootfs LXC
4. **Configure** - Generer la config LXC depuis les metadonnees Docker
5. **Wrap** - Creer un script de demarrage pour l'execution LXC

## Structure du Package Genere

```
/srv/rezapp/generated/secubox-app-<name>/
|-- Makefile              # Makefile du package OpenWrt
|-- files/
|   |-- etc/config/<name> # Configuration UCI
|   |-- etc/init.d/<name> # Script init Procd
|   +-- usr/sbin/<name>ctl # CLI de gestion
+-- README.md
```

## Interface LuCI

Installez `luci-app-rezapp` pour l'interface web dans **Services > RezApp Forge**.

## Dependances

- docker
- lxc, lxc-common
- curl, wget-ssl
- jsonfilter

## Emplacements des Fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/rezapp` | Configuration UCI |
| `/usr/sbin/rezappctl` | Outil CLI |
| `/srv/rezapp/cache/` | Images telechargees |
| `/srv/rezapp/apps/` | Metadonnees des applications converties |
| `/srv/rezapp/generated/` | Packages generes |
| `/srv/lxc/<app>/` | Rootfs du conteneur LXC |
| `/usr/share/rezapp/templates/` | Templates de packages |

## Templates

Templates dans `/usr/share/rezapp/templates/` :

- `Makefile.tpl` - Makefile du package
- `init.d.tpl` - Script init Procd
- `ctl.tpl` - CLI de gestion
- `config.tpl` - Defauts UCI
- `start-lxc.tpl` - Wrapper de demarrage LXC
- `lxc-config.tpl` - Configuration LXC
- `manifest.tpl` - Manifeste du catalogue d'applications
