[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI SecuBox P2P Hub

Interface web LuCI pour la gestion du mesh pair-a-pair SecuBox, la decouverte de pairs et les services distribues.

## Installation

```bash
opkg install luci-app-secubox-p2p
```

## Acces

LuCI > SecuBox > MirrorBox

## Onglets

- **Vue d'ensemble** -- Resume du statut du reseau P2P
- **Hub P2P** -- Gestion du hub central et connectivite
- **Pairs** -- Pairs decouverts et statut de connexion
- **Services** -- Services distribues a travers le mesh
- **Profils** -- Configuration de l'identite et du profil des pairs
- **Reseau Mesh** -- Topologie et routage du mesh
- **Factory** -- Provisionnement d'appareils et integration de sauvegarde Gitea
- **Parametres** -- Configuration du reseau P2P

## Dependances

- `luci-base`
- `secubox-p2p`

## Licence

Apache-2.0
