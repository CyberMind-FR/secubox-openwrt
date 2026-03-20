# nDPId - Deep Packet Inspection Daemon

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Daemon d'inspection approfondie des paquets de couche 7 base sur nDPI. Identifie les protocoles applicatifs et classifie le trafic reseau en utilisant une architecture microservice avec libndpi 5.x integre.

## Installation

```bash
opkg install secubox-app-ndpid
```

## Configuration

Fichier de configuration UCI : `/etc/config/ndpid`
Configuration native : `/etc/ndpid.conf`

```bash
uci set ndpid.main.enabled='1'
uci set ndpid.main.interface='br-lan'
uci commit ndpid
```

## Binaires

| Binaire | Description |
|---------|-------------|
| `/usr/sbin/ndpid` | Daemon de capture DPI |
| `/usr/sbin/ndpisrvd` | Service de distribution JSON |

## Architecture

```
Trafic reseau --> ndpid (capture + classification) --> ndpisrvd (distributeur JSON) --> consommateurs
```

ndpid capture les paquets, classifie les protocoles via libndpi, et envoie les evenements de detection a ndpisrvd. Les consommateurs se connectent a ndpisrvd pour obtenir les donnees de flux en temps reel.

## Gestion du service

```bash
/etc/init.d/ndpid start
/etc/init.d/ndpid stop
/etc/init.d/ndpid status
```

## Dependances

- `libpcap`
- `libjson-c`
- `libpthread`
- `zlib`
- `libstdcpp`

## Licence

GPL-3.0
