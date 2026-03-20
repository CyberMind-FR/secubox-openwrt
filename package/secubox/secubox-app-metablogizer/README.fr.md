[English](README.md) | Francais | [中文](README.zh.md)

# MetaBlogizer - Editeur de Sites Statiques

Editeur de sites statiques avec creation automatique d'hotes virtuels. Supporte les backends uhttpd (natif) et nginx (LXC).

## Installation

```bash
opkg install secubox-app-metablogizer
```

## Configuration

Fichier de configuration UCI : `/etc/config/metablogizer`

```bash
uci set metablogizer.main.enabled='1'
uci set metablogizer.main.backend='uhttpd'
uci set metablogizer.main.web_root='/srv/www'
uci commit metablogizer
```

## Utilisation

```bash
metablogizerctl create <site>        # Creer un nouveau site
metablogizerctl deploy <site>        # Deployer/publier un site
metablogizerctl list                 # Lister les sites geres
metablogizerctl remove <site>        # Supprimer un site
metablogizerctl vhost add <domain>   # Ajouter un hote virtuel
metablogizerctl status               # Afficher le statut
```

## Fonctionnalites

- Creation automatique d'hotes virtuels pour les nouveaux sites
- Backends uhttpd (OpenWrt natif) et nginx (LXC)
- Deploiement de contenu base sur Git

## Dependances

- `git`
- `uhttpd`

## Licence

Apache-2.0
