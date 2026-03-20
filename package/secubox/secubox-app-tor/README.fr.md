[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Tor Shield

Integration Tor pour OpenWrt fournissant un proxy transparent, un proxy SOCKS, DNS via Tor, un kill switch, des services caches et le support des bridges.

## Installation

```bash
opkg install secubox-app-tor
```

## Configuration

Fichier de configuration UCI : `/etc/config/tor-shield`

```bash
uci set tor-shield.main.enabled='1'
uci set tor-shield.main.mode='transparent'
uci set tor-shield.main.dns_over_tor='1'
uci set tor-shield.main.kill_switch='0'
uci commit tor-shield
```

## Utilisation

```bash
torctl start           # Demarrer le service Tor
torctl stop            # Arreter le service Tor
torctl status          # Afficher le statut et les circuits Tor
torctl newnym          # Demander une nouvelle identite Tor
torctl bridges         # Gerer les relais bridge
torctl hidden add      # Creer un service cache
torctl hidden list     # Lister les services caches
torctl killswitch on   # Activer le kill switch (bloquer le trafic non-Tor)
torctl killswitch off  # Desactiver le kill switch
```

## Modes

- **Proxy transparent** -- Tout le trafic LAN est route via Tor avec iptables
- **Proxy SOCKS** -- Point d'acces SOCKS5 pour usage Tor par application
- **DNS via Tor** -- Les requetes DNS sont resolues via le reseau Tor
- **Kill switch** -- Bloque tout le trafic non-Tor si Tor tombe en panne

## Domaines Exclus (Contournement des Services Systeme)

Quand Tor Shield est actif, certains services systeme (opkg, NTP, ACME) necessitent
un acces internet direct. Ces domaines contournent le DNS et le routage Tor :

- Depots de paquets OpenWrt (`downloads.openwrt.org`, miroirs)
- Serveurs de temps NTP (`pool.ntp.org`, `time.google.com`)
- Let's Encrypt ACME (`acme-v02.api.letsencrypt.org`)
- APIs de fournisseurs DNS (Gandi, OVH, Cloudflare)

Configurez des exclusions supplementaires dans UCI :

```bash
uci add_list tor-shield.trans.excluded_domains='my.example.com'
uci commit tor-shield
/etc/init.d/tor-shield restart
```

Les exclusions sont implementees a deux niveaux :
1. **Contournement dnsmasq** -- Les requetes DNS pour les domaines exclus vont directement a l'upstream
2. **RETURN iptables** -- Le trafic vers les IPs resolues contourne le proxy transparent Tor

## Dependances

- `iptables`
- `curl`
- `jsonfilter`
- `socat`

## Licence

Apache-2.0
