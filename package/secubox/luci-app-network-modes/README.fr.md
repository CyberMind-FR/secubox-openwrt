# LuCI Network Modes Dashboard

**Version :** 0.3.6
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

![Version](https://img.shields.io/badge/version-0.3.6-orange)
![Licence](https://img.shields.io/badge/license-Apache--2.0-green)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02+-blue)

Configurez votre routeur OpenWrt pour differents modes d'operation reseau avec une interface moderne et intuitive.

## Modes Reseau

### Nouveautes de la v0.3.6
- **Automatisation WireGuard :** generation de paires de cles, deploiement des interfaces `wg0`, et optimisations MTU/MSS/BBR directement depuis le panneau Relais.
- **RPCs d'optimisation :** nouvelles methodes backend exposant le clamping MTU, TCP BBR et le deploiement WireGuard a l'interface et aux agents d'automatisation.
- **Boutons d'action UI :** le mode Relais inclut maintenant des boutons en un clic pour generation de cles, deploiement d'interface et execution d'optimisations.
- **Proxies integres :** le mode routeur configure maintenant automatiquement Squid/TinyProxy/Privoxy, redirection HTTP transparente, DNS-over-HTTPS, et vhosts reverse proxy nginx avec certificats Let's Encrypt optionnels.

### Mode Sniffer Bridge (Inline / Passthrough)
Bridge Ethernet transparent sans adresse IP pour l'analyse du trafic en ligne. Tout le trafic passe par l'appareil.

**Configuration Reseau :**
- Mode **bridge transparent** (br-lan) sans attribution d'adresse IP
- **Mode promiscuous** active sur toutes les interfaces bridgees
- **Pas de serveur DHCP** - invisible sur le reseau
- **Pas de routage** - transfert pur couche 2
- **Deploiement inline** - appareil insere dans le chemin du trafic
- Point d'insertion parfait entre passerelle et peripheriques reseau

**Fonctionnalites d'Analyse du Trafic :**
- **Integration Netifyd** pour Deep Packet Inspection (DPI) en temps reel
- **Detection d'applications** (Netflix, YouTube, Zoom, torrent, etc.)
- **Identification de protocoles** (HTTP/HTTPS, DNS, QUIC, SSH, etc.)
- **Suivi de flux** avec analyse source/destination
- **Surveillance de bande passante** par application et protocole

**Cas d'Utilisation :**
- **Forensics reseau** - Capturer tout le trafic passant
- **Surveillance securite** - Detecter anomalies et menaces inline
- **Analyse de bande passante** - Identifier les consommateurs de bande passante
- **Debug de protocoles** - Debugger les problemes reseau
- **Surveillance de conformite** - Logger toute l'activite reseau

**Configuration Physique (Inline) :**
```
Routeur Internet (Passerelle)
        |
   [Port WAN] OpenWrt (Mode Bridge) [Ports LAN]
        |
   Peripheriques Reseau (Switches, APs, Clients)
```

**Avantages :**
- Voit 100% du trafic reseau
- Peut appliquer des regles pare-feu si necessaire
- Peut effectuer du traffic shaping
- Point unique de defaillance (si l'appareil echoue, le reseau est coupe)

### Mode Sniffer Passif (Out-of-band / Monitor Only)
Surveillance purement passive sans affecter le trafic reseau. L'appareil ecoute uniquement, le trafic ne passe pas par lui.

**Configuration Reseau :**
- Interface **mode moniteur** (pas de bridge, pas de forwarding)
- **Mode promiscuous** pour capture de paquets
- **Pas d'adresse IP** sur l'interface de surveillance
- **Lecture seule** - ne peut pas affecter le trafic reseau
- Connecte via **port SPAN/mirror** ou **TAP reseau**

**Fonctionnalites d'Analyse du Trafic :**
- **Integration Netifyd** pour Deep Packet Inspection
- **Capture complete de paquets** avec tcpdump/Wireshark
- **Detection d'applications et de protocoles**
- **Analyse de flux** et surveillance de bande passante
- **Zero impact reseau** - invisible pour le reseau

**Cas d'Utilisation :**
- **Forensics pur** - Surveiller sans aucun impact reseau
- **IDS/IPS** - Detection d'intrusion sans risque inline
- **Surveillance TAP reseau** - Infrastructure de surveillance dediee
- **Environnements securises** - Aucun risque de perturber le trafic de production
- **Surveillance long terme** - Observation passive continue

**Options de Configuration Physique :**

**Option 1 : Port SPAN/Mirror de Switch**
```
Routeur Internet
        |
   Switch Manage (avec port mirroring)
        |-- [Port 1-23] Trafic normal
        +-- [Port 24 SPAN] --> OpenWrt [eth0] (Monitor)
```

**Option 2 : TAP Reseau**
```
Routeur Internet --> [Appareil TAP] --> Switch
                        |
                   OpenWrt [eth0] (Monitor)
```

**Option 3 : Hub (Legacy)**
```
Routeur Internet --> [Hub] --> Switch
                      |
                 OpenWrt [eth0] (Monitor)
```

**Avantages :**
- Zero impact reseau - pas de point unique de defaillance
- Completement invisible pour le reseau
- Ne peut pas etre detecte ou attaque
- Parfait pour surveillance de conformite et securite
- Necessite port SPAN, TAP ou hub
- Peut manquer du trafic selon la configuration

**Integration avec SecuBox :**
Les deux modes fonctionnent parfaitement avec :
- **Tableau de Bord Netifyd** pour visualisation DPI
- **CrowdSec** pour detection de menaces
- **Netdata** pour metriques et graphiques
- **Client Guardian** pour decisions de controle d'acces

### Mode Point d'Acces
Point d'acces WiFi avec optimisations avancees.
- **802.11r** Fast BSS Transition (roaming)
- **802.11k** Radio Resource Management
- **802.11v** BSS Transition Management
- **Band Steering** (preference 5GHz)
- Support **Beamforming**
- Configuration canal et puissance TX

### Mode Relais / Extender
Relais reseau avec optimisation WireGuard.
- Bridge **Relayd** pour extension reseau
- Integration **VPN WireGuard**
- **Optimisation MTU** pour tunnels
- **MSS clamping** pour TCP
- Controle de congestion **TCP BBR**

### Mode Routeur
Routeur complet avec WAN, proxy et frontends HTTPS.
- **Protocoles WAN** : DHCP, Statique, PPPoE, L2TP
- **NAT/Masquerade** avec pare-feu
- **Proxy Web** : Squid, TinyProxy, Privoxy
- Option **proxy transparent**
- Support **DNS over HTTPS**
- **Reverse Proxy HTTPS** : Nginx, HAProxy, Caddy
- **Hotes virtuels multiples** avec Let's Encrypt

### Mode Routeur + DMZ
Creez un segment DMZ dedie pour les serveurs exposes tout en gardant le trafic LAN isole.
- Interface DMZ separee avec son propre sous-reseau/scope DHCP
- Isolation de zone pare-feu (DMZ -> WAN forwarding, pas DMZ -> LAN sauf si active)
- Rollback rapide utilisant le workflow backup/confirm existant
- Concu pour heberger des apps (Zigbee2MQTT, Lyrion, etc.) combine avec le gestionnaire VHost

## Fonctionnalites

- Changement de mode en un clic avec backup
- Statut des interfaces et services en temps reel
- Configurations optimisees par mode
- Gestion securisee des parametres
- Design responsive
- Theme sombre moderne

## Installation

### Prerequis

- OpenWrt 21.02 ou ulterieur
- Interface web LuCI

### Depuis les Sources

```bash
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/gkerma/luci-app-network-modes.git

cd ~/openwrt
./scripts/feeds update -a && ./scripts/feeds install -a
make menuconfig  # LuCI > Applications > luci-app-network-modes
make package/luci-app-network-modes/compile V=s
```

### Installation Manuelle

```bash
scp luci-app-network-modes_*.ipk root@192.168.1.1:/tmp/
ssh root@192.168.1.1 "opkg install /tmp/luci-app-network-modes_*.ipk"
/etc/init.d/rpcd restart
```

### Acces

**Reseau -> Modes Reseau**

## Dependances Specifiques aux Modes

### Mode Sniffer
```bash
opkg install netifyd
```

### Mode Point d'Acces
```bash
opkg install hostapd-openssl  # Pour WPA3/802.11r
```

### Mode Relais
```bash
opkg install relayd wireguard-tools
```

### Mode Routeur
```bash
# Proxy
opkg install squid  # ou tinyproxy, privoxy

# Reverse Proxy
opkg install nginx-ssl  # ou haproxy

# Let's Encrypt
opkg install acme acme-dnsapi
```

## Architecture

```
+-------------------------------------------------------------+
|                    JavaScript LuCI                           |
|  (overview.js, sniffer.js, accesspoint.js, relay.js,        |
|                      router.js)                              |
+----------------------------+--------------------------------+
                             | ubus RPC
                             v
+-------------------------------------------------------------+
|                    Backend RPCD                              |
|             /usr/libexec/rpcd/network-modes                 |
+----------------------------+--------------------------------+
                             | UCI / Shell
                             v
+-------------------------------------------------------------+
|              Configuration OpenWrt                           |
|     /etc/config/network, wireless, firewall, dhcp           |
+-------------------------------------------------------------+
```

## Methodes API

| Methode | Description |
|---------|-------------|
| `status` | Mode actuel, interfaces, statut des services |
| `modes` | Lister tous les modes avec configurations |
| `sniffer_config` | Parametres du mode Sniffer |
| `ap_config` | Parametres du mode Point d'Acces |
| `relay_config` | Parametres du mode Relais |
| `router_config` | Parametres du mode Routeur |
| `apply_mode` | Passer a un mode different |
| `update_settings` | Mettre a jour les parametres specifiques au mode |
| `add_vhost` | Ajouter un hote virtuel (mode routeur) |
| `generate_config` | Generer apercu de configuration |

## Fichier de Configuration

Les parametres sont stockes dans `/etc/config/network-modes` :

```
config network-modes 'config'
    option current_mode 'router'
    option last_change '2024-12-19 15:30:00'
    option backup_config '1'

config mode 'sniffer'
    option mode_type 'bridge'  # 'bridge' ou 'passive'
    option bridge_interface 'br-lan'
    option monitor_interface 'eth0'  # Pour mode passif
    option netifyd_enabled '1'
    option promiscuous '1'
    option pcap_capture '0'
    option pcap_path '/tmp/captures'
    option mirror_port ''
    option capture_filter ''
    option span_port_source ''  # Pour mode passif avec SPAN

config mode 'accesspoint'
    option wifi_channel 'auto'
    option wifi_htmode 'VHT80'
    option wifi_txpower '20'
    option roaming_enabled '1'

config mode 'relay'
    option wireguard_enabled '1'
    option mtu_optimization '1'
    option mss_clamping '1'

config mode 'router'
    option wan_protocol 'dhcp'
    option nat_enabled '1'
    option firewall_enabled '1'
    option proxy_enabled '0'
    option https_frontend '0'
```

## Exemples Mode Sniffer

### Configuration Basique Sniffer Bridge (Inline)

1. **Activer le Mode Sniffer Bridge** via LuCI :
   - Naviguer vers **Reseau -> Modes Reseau**
   - Selectionner **Mode Sniffer Bridge (Inline)**
   - Activer **Integration Netifyd**
   - Cliquer **Appliquer Mode**

2. **Connexion Physique** :
   ```
   Modem/ISP -> [WAN] OpenWrt [LAN1-4] -> Switch/Peripheriques
   ```

3. **Verifier la Configuration** :
   ```bash
   # Verifier statut bridge
   brctl show br-lan

   # Verifier pas d'IP sur bridge
   ip addr show br-lan

   # Verifier mode promiscuous
   ip link show br-lan | grep PROMISC

   # Verifier Netifyd en cours
   /etc/init.d/netifyd status
   ```

### Configuration Sniffer Passif (Out-of-band)

#### Option A : Utilisation du Port SPAN de Switch

1. **Configurer le Port SPAN/Mirror du Switch** :
   - Acceder a la configuration de votre switch manage
   - Configurer le port mirroring :
     - **Ports source** : Ports a surveiller (ex. port uplink)
     - **Port destination** : Port connecte a OpenWrt (ex. port 24)
     - **Direction** : Les deux (ingress + egress)

2. **Configurer OpenWrt Mode Passif** :
   ```bash
   # Via UCI
   uci set network-modes.sniffer.mode_type='passive'
   uci set network-modes.sniffer.monitor_interface='eth0'
   uci set network-modes.sniffer.netifyd_enabled='1'
   uci commit network-modes

   # Appliquer configuration
   ubus call network-modes apply_mode '{"mode":"sniffer"}'
   ```

### Configuration de Capture Avancee

**Capturer trafic HTTP vers PCAP :**
```bash
# Via UCI
uci set network-modes.sniffer.pcap_capture='1'
uci set network-modes.sniffer.pcap_path='/mnt/usb/captures'
uci set network-modes.sniffer.capture_filter='port 80 or port 443'
uci commit network-modes

# tcpdump manuel
tcpdump -i br-lan -w /tmp/capture.pcap port 80 or port 443
```

**Surveiller applications specifiques :**
```bash
# Observer trafic Netflix
tcpdump -i br-lan -n 'host nflxvideo.net or host netflix.com'

# Surveiller requetes DNS
tcpdump -i br-lan -n 'port 53'

# Capturer BitTorrent
tcpdump -i br-lan -n 'port 6881:6889'
```

**Bande passante temps reel par IP :**
```bash
# Utiliser iftop
iftop -i br-lan -P

# Utiliser nethogs (si installe)
nethogs br-lan

# Utiliser API Netifyd
ubus call luci.netifyd flows | jq '.flows[] | select(.bytes_total > 1000000)'
```

### Exemples d'Integration

**Export vers Elasticsearch :**
```bash
# Netifyd peut exporter vers Elasticsearch pour logging centralise
# Configurer dans /etc/netifyd.conf
{
  "sink": {
    "type": "elasticsearch",
    "url": "http://elastic.local:9200",
    "index": "netifyd"
  }
}
```

**Alimenter donnees vers Grafana :**
```bash
# Netifyd exporte metriques Prometheus
curl http://192.168.1.1:8081/metrics
```

**Integration avec CrowdSec :**
```bash
# CrowdSec peut parser les logs Netifyd pour detection de menaces
# Configurer dans /etc/crowdsec/acquis.yaml
filenames:
  - /var/log/netifyd.log
labels:
  type: netifyd
```

### Optimisation de Performance

**Optimiser pour reseaux haut debit (1Gbps+) :**
```bash
# Augmenter taille buffer ring
ethtool -G eth0 rx 4096 tx 4096
ethtool -G eth1 rx 4096 tx 4096

# Desactiver hardware offloading pour capture precise
ethtool -K eth0 gro off gso off tso off
ethtool -K eth1 gro off gso off tso off

# Mettre bridge en mode forwarding
echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables
```

**Stockage USB pour captures PCAP :**
```bash
# Monter cle USB
mkdir -p /mnt/usb
mount /dev/sda1 /mnt/usb

# Configurer rotation
uci set network-modes.sniffer.pcap_path='/mnt/usb/captures'
uci set network-modes.sniffer.pcap_rotation='daily'
uci set network-modes.sniffer.pcap_retention='7'
uci commit network-modes
```

### Depannage

**Pas de trafic visible :**
```bash
# Verifier membres du bridge
brctl show

# Verifier etats des interfaces
ip link show

# Tester avec tcpdump
tcpdump -i br-lan -c 10

# Verifier logs Netifyd
logread | grep netifyd
```

**Utilisation CPU elevee :**
```bash
# Desactiver DPI si pas necessaire
uci set network-modes.sniffer.netifyd_enabled='0'

# Reduire scope de capture avec filtres
tcpdump -i br-lan 'not port 22' -w /dev/null

# Verifier hardware offloading
ethtool -k eth0 | grep offload
```

## Securite

- Le changement de mode cree des backups automatiques
- Les cles privees ne sont jamais exposees via API
- Controle d'acces base sur ACL
- Auto-configuration du pare-feu

## Contribution

Contributions bienvenues ! Veuillez soumettre issues et pull requests.

## Licence

Apache License 2.0 - Voir [LICENSE](LICENSE)

## Credits

- Construit pour [OpenWrt](https://openwrt.org/)
- Developpe par [Gandalf @ CyberMind.fr](https://cybermind.fr)

---

Fait avec passion pour un reseau flexible
