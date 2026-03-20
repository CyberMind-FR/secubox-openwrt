[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Portal

Point d'entree unifie de l'interface web pour toutes les applications SecuBox -- fournit la navigation de niveau superieur SecuBox et le tableau de bord a onglets.

## Installation

```bash
opkg install luci-app-secubox-portal
```

## Acces

LuCI > SecuBox (menu de niveau superieur)

## Sections

- **Tableau de bord** -- Vue d'ensemble agregee de tous les services SecuBox
- **Services** -- Conteneur pour les sous-menus de services
- **Apps** -- Lanceur d'applications et catalogue
- **Parametres** -- Parametres globaux SecuBox

### Pages publiques (sans connexion requise)

- Bug Bounty
- Campagne de financement participatif
- Statut de developpement

## Dependances

- `luci-base`
- `luci-theme-secubox`

## Licence

Apache-2.0
