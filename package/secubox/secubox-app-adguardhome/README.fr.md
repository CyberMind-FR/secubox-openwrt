# SecuBox AdGuard Home

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Bloqueur de publicites a l'echelle du reseau fonctionnant dans Docker sur les systemes OpenWrt alimentes par SecuBox, avec support DNS-over-HTTPS/TLS et analyses detaillees.

## Installation

```sh
opkg install secubox-app-adguardhome
```

## Configuration

Fichier de configuration UCI : `/etc/config/adguardhome`

```
config adguardhome 'main'
    option enabled '0'
    option port '3000'
```

## Utilisation

```sh
# Demarrer / arreter le service
/etc/init.d/adguardhome start
/etc/init.d/adguardhome stop

# CLI du controleur
adguardhomectl status
adguardhomectl install
adguardhomectl remove
```

## Fichiers

- `/etc/config/adguardhome` -- Configuration UCI
- `/etc/init.d/adguardhome` -- Script init
- `/usr/sbin/adguardhomectl` -- CLI du controleur

## Dependances

- `dockerd`
- `docker`
- `containerd`

## Licence

Apache-2.0
