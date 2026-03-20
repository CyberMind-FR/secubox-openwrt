# SecuBox CrowdSec Firewall Bouncer

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Bouncer firewall CrowdSec avec integration nftables native pour IPv4 et IPv6 sur OpenWrt. Binaire Go, version 0.0.31.

## Installation

```sh
opkg install secubox-app-cs-firewall-bouncer
```

## Configuration

Fichier de configuration UCI : `/etc/config/crowdsec`

Le bouncer s'enregistre aupres de l'API locale CrowdSec (LAPI) et gere les ensembles nftables pour bloquer les IP malveillantes.

## Utilisation

```sh
# Demarrer / arreter le service
/etc/init.d/crowdsec-firewall-bouncer start
/etc/init.d/crowdsec-firewall-bouncer stop

# Verifier le statut du bouncer
cs-firewall-bouncer -version
```

## Fichiers

- `/etc/config/crowdsec` -- Configuration UCI
- `/etc/init.d/crowdsec-firewall-bouncer` -- Script d'initialisation
- `/usr/sbin/cs-firewall-bouncer` -- Binaire Go

## Notes de compilation

Il s'agit d'un paquet Go avec CGO. Il doit etre compile avec la toolchain complete OpenWrt, pas le SDK :

```sh
cd secubox-tools/openwrt
make package/secubox-app-cs-firewall-bouncer/compile V=s
```

## Dependances

- `nftables`

## Licence

MIT
