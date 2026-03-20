# Tableau de bord LuCI PicoBrew

[English](README.md) | Francais | [中文](README.zh.md)

Interface web LuCI pour la gestion des controleurs de brassage PicoBrew -- surveillance des recettes et des sessions.

## Installation

```bash
opkg install luci-app-picobrew
```

## Acces

LuCI > Services > PicoBrew

## Onglets

- **Tableau de bord** -- Statut de la session de brassage, apercu des recettes et etat du controleur
- **Parametres** -- Configuration du service PicoBrew

## Methodes RPCD

Service : `luci.picobrew`

## Dependances

- `luci-base`
- `secubox-app-picobrew`

## Licence

Apache-2.0
