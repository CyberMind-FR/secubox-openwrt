[English](README.md) | Francais | [中文](README.zh.md)

# Moniteur Systeme Glances SecuBox

Outil de surveillance systeme multiplateforme fonctionnant dans un conteneur LXC, avec interface web et API RESTful.

## Installation

```sh
opkg install secubox-app-glances
```

## Configuration

Fichier de configuration UCI : `/etc/config/glances`

```
config glances 'main'
    option enabled '0'
    option port '61208'
```

## Utilisation

```sh
# Demarrer / arreter le service
/etc/init.d/glances start
/etc/init.d/glances stop

# CLI du controleur
glancesctl status
glancesctl install
glancesctl remove
```

## Fonctionnalites

- Surveillance en temps reel du CPU, memoire, disque et reseau
- Liste des processus avec utilisation des ressources
- Surveillance des conteneurs Docker/Podman
- Interface web accessible depuis n'importe quel appareil
- API JSON RESTful pour les integrations
- Systeme d'alertes pour la surveillance des seuils

## Fichiers

- `/etc/config/glances` -- Configuration UCI
- `/usr/sbin/glancesctl` -- CLI du controleur

## Dependances

- `wget`
- `tar`

## Licence

LGPL-3.0
