# SecuBox PicoBrew Server

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Controleur de brassage PicoBrew auto-heberge fonctionnant dans un conteneur LXC. Fournit la gestion des recettes, le suivi en temps reel des sessions de brassage et la connectivite des appareils pour le materiel PicoBrew.

## Installation

```bash
opkg install secubox-app-picobrew
```

## Configuration

Fichier de configuration UCI : `/etc/config/picobrew`

```bash
uci set picobrew.main.enabled='1'
uci set picobrew.main.port='8080'
uci commit picobrew
```

## Utilisation

```bash
picobrewctl start      # Demarrer le serveur PicoBrew
picobrewctl stop       # Arreter le serveur PicoBrew
picobrewctl status     # Afficher l'etat du service
picobrewctl logs       # Voir les logs du serveur
picobrewctl update     # Mettre a jour le serveur depuis git
```

## Fonctionnalites

- Gestion et creation de recettes
- Suivi en temps reel des sessions de brassage
- Appairage et controle des appareils PicoBrew
- Historique et journalisation des brassages
- Execution isolee dans un conteneur LXC

## Dependances

- `jsonfilter`
- `wget-ssl`
- `tar`
- `lxc`
- `lxc-common`
- `git`

## Licence

Apache-2.0
