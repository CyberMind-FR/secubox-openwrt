# SecuBox MagicMirror2

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Plateforme d'affichage intelligent modulaire open-source fonctionnant dans un conteneur LXC sur les systemes OpenWrt equipes de SecuBox.

## Installation

```sh
opkg install secubox-app-magicmirror2
```

## Configuration

Fichier de configuration UCI : `/etc/config/magicmirror2`

```
config magicmirror2 'main'
    option enabled '0'
    option port '8080'
```

## Utilisation

```sh
# Demarrer / arreter le service
/etc/init.d/magicmirror2 start
/etc/init.d/magicmirror2 stop

# CLI du controleur
mm2ctl status
mm2ctl install
mm2ctl remove
```

## Fonctionnalites

- Architecture modulaire avec des centaines de modules disponibles
- Gestionnaire de modules integre pour une installation facile
- Widgets meteo, calendrier, actualites et personnalises
- Interface de configuration web
- Mode kiosk pour les ecrans dedies

## Fichiers

- `/etc/config/magicmirror2` -- Configuration UCI
- `/usr/sbin/mm2ctl` -- CLI du controleur

## Dependances

- `wget`
- `tar`
- `jq`
- `zstd`

## Licence

Apache-2.0
