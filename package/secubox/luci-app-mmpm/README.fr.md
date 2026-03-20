[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI MMPM Dashboard

Interface web LuCI pour gerer les modules MagicMirror via MMPM (MagicMirror Package Manager).

## Installation

```bash
opkg install luci-app-mmpm
```

## Acces

LuCI > Services > MMPM

## Onglets

- **Tableau de Bord** -- Statut du service et apercu de MagicMirror
- **Modules** -- Rechercher, installer, mettre a jour et supprimer les modules MagicMirror
- **Interface Web** -- Interface web MMPM integree
- **Parametres** -- Configuration MMPM et MagicMirror

## Methodes RPCD

Service : `luci.mmpm`

## Dependances

- `luci-base`
- `secubox-app-mmpm`

## Licence

Apache-2.0
