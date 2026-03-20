[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# Netifyd 5.2.1 pour OpenWrt / SecuBox

Package OpenWrt complet pour Netify Agent (netifyd) version 5.2.1 - Moteur d'inspection approfondie des paquets.

## Apercu

Ce package fournit le dernier Netify Agent officiel compile pour OpenWrt/SecuBox avec support d'integration complet.

### Fonctionnalites

- **Inspection Approfondie des Paquets (DPI)** - Detecte plus de 300 protocoles et applications
- **Classification des Flux** - Analyse des flux reseau en temps reel
- **Detection de Protocoles** - Identifie HTTP, HTTPS, SSH, DNS, BitTorrent, etc.
- **Detection d'Applications** - Reconnait des applications specifiques (YouTube, Netflix, WhatsApp, etc.)
- **Suivi des Appareils** - Surveille tous les appareils sur le reseau
- **Integration Cloud** - Upload optionnel vers le cloud Netify.ai pour l'analyse
- **Export Local** - Peut exporter les donnees localement pour traitement personnalise
- **Faible Utilisation de Ressources** - Build "lean and mean" optimise pour les systemes embarques

### Informations de Version

- **Version Netifyd :** 5.2.1 (Derniere Version Officielle)
- **Source :** https://download.netify.ai/source/netifyd-5.2.1.tar.gz
- **Licence :** GPL-3.0-or-later
- **Mainteneur :** CyberMind <contact@cybermind.fr>

## Installation

### Prerequis

Les dependances requises sont automatiquement installees :
- libcurl
- libmnl
- libnetfilter-conntrack
- libpcap
- zlib
- libpthread
- libstdcpp
- libjson-c
- ca-bundle

### Compilation depuis les Sources

```bash
# Depuis le buildroot OpenWrt
cd /path/to/secubox-openwrt

# Selectionner le package
make menuconfig
# Naviguer vers : Network > netifyd
# Selectionner : <M> ou <*>

# Compiler le package
make package/secubox/secubox-app-netifyd/compile V=s

# Le package sera dans : bin/packages/*/secubox/netifyd_5.2.1-1_*.ipk
```

### Installation sur l'Appareil

```bash
# Copier le package vers l'appareil
scp netifyd_5.2.1-1_*.ipk root@192.168.1.1:/tmp/

# Sur l'appareil
opkg install /tmp/netifyd_5.2.1-1_*.ipk
```

## Configuration

### Demarrage Rapide

```bash
# Editer la configuration
vi /etc/config/netifyd

# Activer l'auto-configuration (recommande)
uci set netifyd.default.enabled='1'
uci set netifyd.default.autoconfig='1'
uci commit netifyd

# Demarrer le service
/etc/init.d/netifyd start
/etc/init.d/netifyd enable

# Verifier le statut
netifyd -s
```

### Configuration Manuelle des Interfaces

Si l'auto-detection ne fonctionne pas, configurez les interfaces manuellement :

```bash
# Configurer l'interface interne (LAN)
uci add_list netifyd.default.internal_if='br-lan'

# Configurer l'interface externe (WAN)
uci add_list netifyd.default.external_if='br-wan'

# Valider et redemarrer
uci commit netifyd
/etc/init.d/netifyd restart
```

### Configuration Avancee

Editez `/etc/netifyd.conf` pour les parametres avances :

```ini
[netifyd]
# Activer/desactiver les fonctionnalites
enable-conntrack = yes
enable-netlink = yes

# Configuration socket
socket-host = 127.0.0.1
socket-port = 7150

# Parametres de flux
flow-expiry = 180
flow-max = 65536

# Configuration sink (upload cloud)
sink-url = https://sink.netify.ai/
```

## Utilisation

### Ligne de Commande

```bash
# Afficher la version et les fonctionnalites
netifyd -V

# Afficher le statut en cours
netifyd -s

# Afficher l'UUID de l'agent
netifyd -p

# Tester la configuration
netifyd -t

# Activer le sink cloud
netifyd --enable-sink

# Desactiver le sink cloud
netifyd --disable-sink
```

### Controle du Service

```bash
# Demarrer le service
/etc/init.d/netifyd start

# Arreter le service
/etc/init.d/netifyd stop

# Redemarrer le service
/etc/init.d/netifyd restart

# Verifier le statut
/etc/init.d/netifyd status

# Activer le demarrage auto
/etc/init.d/netifyd enable

# Desactiver le demarrage auto
/etc/init.d/netifyd disable
```

### Surveillance

```bash
# Voir le JSON de statut
cat /var/run/netifyd/status.json | jq .

# Verifier le processus en cours
ps | grep netifyd

# Voir les logs
logread | grep netifyd

# Verifier le socket
ls -la /var/run/netifyd/
```

## Integration avec SecuBox

Ce package s'integre parfaitement avec `luci-app-secubox-netifyd` :

```bash
# Installer les deux packages
opkg install netifyd luci-app-secubox-netifyd

# Acceder a l'interface web
# Naviguer vers : Services > Netifyd Dashboard
```

## Emplacements des Fichiers

- **Binaire :** `/usr/sbin/netifyd`
- **Configuration :** `/etc/netifyd.conf`
- **Config UCI :** `/etc/config/netifyd`
- **Script Init :** `/etc/init.d/netifyd`
- **Donnees Runtime :** `/var/run/netifyd/`
- **Donnees Persistantes :** `/etc/netify.d/`
- **Fichier Statut :** `/var/run/netifyd/status.json`
- **Socket :** `/var/run/netifyd/netifyd.sock`

## Licence

Ce package est sous licence GPL-3.0-or-later, comme netifyd amont.

## Credits

- **Amont :** eGloo Incorporated (Netify.ai)
- **Package OpenWrt :** CyberMind.fr (Integration SecuBox)
- **Package OpenWrt Original :** Equipe OpenWrt Packages
