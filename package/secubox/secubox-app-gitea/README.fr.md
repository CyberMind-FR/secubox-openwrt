[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Gitea Platform

Service Git leger auto-heberge fonctionnant dans un conteneur LXC sur les systemes OpenWrt SecuBox.

## Installation

```sh
opkg install secubox-app-gitea
```

## Configuration

Fichier de configuration UCI : `/etc/config/gitea`

```
config gitea 'main'
    option enabled '0'
    option http_port '3000'
    option ssh_port '2222'
```

## Utilisation

```sh
# Demarrer / arreter le service
/etc/init.d/gitea start
/etc/init.d/gitea stop

# CLI du controleur
giteactl status
giteactl install
giteactl remove
giteactl backup
giteactl restore
```

## Fonctionnalites

- Acces Git HTTP et SSH
- Gestion des depots et utilisateurs via interface web
- Base de donnees SQLite (embarquee)
- Support sauvegarde et restauration
- Fonctionne dans un conteneur LXC Alpine Linux

## Fichiers

- `/etc/config/gitea` -- Configuration UCI
- `/usr/sbin/giteactl` -- CLI du controleur

## Dependances

- `jsonfilter`
- `wget-ssl`
- `tar`
- `lxc`
- `lxc-common`
- `git`

## Licence

MIT
