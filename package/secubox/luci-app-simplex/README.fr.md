# LuCI SimpleX Chat Server

[English](README.md) | Francais | [中文](README.zh.md)

Interface web LuCI pour la gestion d'un relais SimpleX Chat auto-heberge -- messagerie orientee confidentialite avec serveurs SMP et XFTP.

## Installation

```bash
opkg install luci-app-simplex
```

## Acces

LuCI > Services > SimpleX Chat

## Fonctionnalites

- Gestion du serveur SMP (SimpleX Messaging Protocol)
- Gestion du serveur de transfert de fichiers XFTP
- Affichage de l'adresse du serveur et de l'empreinte
- Controles demarrer/arreter/redemarrer du service
- Surveillance de l'etat des connexions

## Methodes RPCD

Service : `luci.simplex`

## Dependances

- `secubox-app-simplex`

## Licence

Apache-2.0
