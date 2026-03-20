# CyberFeed - Agregateur de flux RSS

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Agregateur de flux RSS pour OpenWrt/SecuBox avec support RSS-Bridge pour les flux de reseaux sociaux.

## Installation

```sh
opkg install secubox-app-cyberfeed
```

## Configuration

Fichier de configuration UCI : `/etc/config/cyberfeed`

Liste des flux : `/etc/cyberfeed/feeds.conf`

```
config cyberfeed 'main'
    option enabled '1'
    option refresh_interval '3600'
```

## Utilisation

```sh
# Recuperer et mettre a jour les flux
cyberfeed update

# Lister les flux en cache
cyberfeed list

# Configurer RSS-Bridge pour les flux de reseaux sociaux
rss-bridge-setup
```

L'actualisation des flux s'execute automatiquement via cron lorsqu'elle est activee.

## Fichiers

- `/etc/config/cyberfeed` -- Configuration UCI
- `/etc/cyberfeed/feeds.conf` -- Liste des URL de flux
- `/usr/bin/cyberfeed` -- CLI principal
- `/usr/bin/rss-bridge-setup` -- Installateur RSS-Bridge

## Dependances

- `wget-ssl`
- `jsonfilter`
- `coreutils-stat`

## Licence

MIT
