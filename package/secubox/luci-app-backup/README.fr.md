[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI Backup Manager

Tableau de bord web pour la gestion des sauvegardes SecuBox.

## Fonctionnalites

- Vue d'ensemble du statut des sauvegardes (chemin de stockage, utilisation, dernieres sauvegardes)
- Boutons d'action rapide pour les sauvegardes completes/config/container
- Liste des containers LXC avec etat, taille et nombre de sauvegardes
- Tableau d'historique des sauvegardes avec fichier, type, taille et date
- Sauvegarde de container en un clic

## Installation

```bash
opkg install luci-app-backup
```

## Emplacement

**Systeme → Backup Manager**

## Methodes RPCD

| Methode | Parametres | Description |
|---------|------------|-------------|
| `status` | - | Obtenir le statut et les statistiques de sauvegarde |
| `list` | `type` | Lister les sauvegardes (all/config/containers/services) |
| `container_list` | - | Lister les containers LXC avec infos de sauvegarde |
| `create` | `type` | Creer une sauvegarde (full/config/containers/services) |
| `restore` | `file`, `dry_run` | Restaurer depuis un fichier de sauvegarde |
| `cleanup` | - | Supprimer les anciennes sauvegardes |
| `container_backup` | `name` | Sauvegarder un container specifique |
| `container_restore` | `name`, `file` | Restaurer un container specifique |

## Dependances

- `secubox-app-backup` - CLI backend
- `luci-base` - Framework LuCI
