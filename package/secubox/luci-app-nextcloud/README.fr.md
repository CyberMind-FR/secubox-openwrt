[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI Nextcloud

Interface web LuCI pour gerer une instance Nextcloud auto-hebergee -- synchronisation de fichiers, calendrier et contacts.

## Installation

```bash
opkg install luci-app-nextcloud
```

## Acces

LuCI > Services > Nextcloud

## Onglets

- **Vue d'ensemble** -- Statut du service Nextcloud et informations sur l'instance
- **Parametres** -- Configuration et gestion de l'instance

## Methodes RPCD

Service : `luci.nextcloud`

## Dependances

- `luci-base`

## Licence

Apache-2.0
