# LuCI CyberFeed Dashboard

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Agregateur de flux RSS avec support des reseaux sociaux via l'integration RSS-Bridge.

## Installation

```bash
opkg install luci-app-cyberfeed
```

## Acces

Menu LuCI : **Services -> CyberFeed**

## Onglets

- **Dashboard** -- Statut des flux, nombre d'elements, heure de derniere synchronisation
- **Feeds** -- Ajouter, supprimer et gerer les sources de flux RSS/Atom
- **Preview** -- Parcourir les elements de flux recuperes
- **Settings** -- Intervalle de rafraichissement, duree de vie du cache, configuration RSS-Bridge

## Methodes RPCD

Backend : `luci.cyberfeed`

| Methode | Description |
|--------|-------------|
| `get_status` | Statut du service et statistiques des flux |
| `get_feeds` | Lister les flux configures |
| `get_items` | Obtenir les elements de flux recuperes |
| `add_feed` | Ajouter une nouvelle source de flux |
| `delete_feed` | Supprimer un flux |
| `sync_feeds` | Declencher la synchronisation des flux |
| `get_config` | Obtenir les parametres actuels |
| `save_config` | Sauvegarder les parametres |
| `rssbridge_status` | Statut du service RSS-Bridge |
| `rssbridge_install` | Installer RSS-Bridge |
| `rssbridge_control` | Demarrer/arreter RSS-Bridge |

## Dependances

- `secubox-app-cyberfeed`

## Licence

Apache-2.0
