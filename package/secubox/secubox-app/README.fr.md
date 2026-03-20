[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox App Store CLI

Assistant en ligne de commande pour la gestion des manifestes du SecuBox App Store.

## Installation

```sh
opkg install secubox-app
```

## Utilisation

```sh
# Lister les apps disponibles
secubox-app list

# Afficher les details du manifeste d'une app
secubox-app info <app-name>

# Installer une app
secubox-app install <app-name>
```

Les manifestes de plugins par defaut sont livres sous `/usr/share/secubox/plugins/`.

## Fichiers

- `/usr/sbin/secubox-app` -- CLI principal
- `/usr/share/secubox/plugins/` -- manifestes d'apps

## Dependances

- `jsonfilter`

## Licence

Apache-2.0
