# LuCI Metabolizer CMS

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Tableau de bord du systeme de gestion de contenu avec integration Gitea et publication de sites statiques.

## Installation

```bash
opkg install luci-app-metabolizer
```

## Acces

Menu LuCI : **Services -> Metabolizer CMS**

## Onglets

- **Overview** -- Statut du service, nombre d'articles, etat de synchronisation Gitea
- **Settings** -- Configuration du CMS

## Methodes RPCD

Backend : `luci.metabolizer`

| Methode | Description |
|--------|-------------|
| `status` | Statut du service et statistiques de contenu |
| `list_posts` | Lister les articles publies |
| `gitea_status` | Statut de synchronisation du depot Gitea |
| `sync` | Synchroniser le contenu depuis la source |
| `build` | Construire le site statique |
| `publish` | Publier le site construit |
| `gitea_sync` | Synchroniser avec le depot Gitea |

## Dependances

- `luci-base`
- `secubox-app-metabolizer`

## Licence

Apache-2.0
