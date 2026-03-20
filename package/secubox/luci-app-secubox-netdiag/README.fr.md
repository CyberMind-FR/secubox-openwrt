[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox Network Diagnostics

Statistiques de ports de switch DSA en temps reel et tableau de bord de surveillance des erreurs reseau pour OpenWrt.

## Fonctionnalites

- **Panneau d'Etat des Ports Switch** : Representation visuelle des ports de switch DSA avec indicateurs d'etat de liaison, vitesse et duplex
- **Widget de Surveillance des Erreurs** : Suivi des erreurs en temps reel avec seuils d'alerte (normal/avertissement/critique)
- **Details des Interfaces** : Sortie complete ethtool, statistiques du pilote et journaux de messages kernel
- **Rafraichissement Auto** : Intervalle de polling configurable (5s, 10s, 30s ou manuel)
- **Design Responsive** : Interface adaptee mobile avec theme sombre SecuBox

## Materiel Supporte

- MOCHAbin (Marvell Armada 8040) avec pilote mvpp2
- Tout appareil OpenWrt avec topologie de switch DSA
- Interfaces Ethernet autonomes (non-DSA)

## Installation

```bash
# Compiler avec le SDK
cd secubox-tools/sdk
make package/luci-app-secubox-netdiag/compile V=s

# Installer sur l'appareil
opkg install luci-app-secubox-netdiag_*.ipk
```

## Dependances

- luci-base
- ethtool

## Emplacement Menu

SecuBox > Diagnostics Reseau

## Metriques d'Erreurs Surveillees

| Metrique | Description |
|----------|-------------|
| rx_crc_errors | Erreurs de checksum CRC/FCS |
| rx_frame_errors | Erreurs de tramage |
| rx_fifo_errors | Erreurs de depassement FIFO |
| rx_missed_errors | Paquets manques (buffer plein) |
| tx_aborted_errors | Abandons TX |
| tx_carrier_errors | Erreurs de detection de porteuse |
| collisions | Collisions Ethernet |
| rx_dropped | Rejets en reception |
| tx_dropped | Rejets en transmission |

## Seuils d'Alerte

| Niveau | Condition | Indicateur |
|--------|-----------|------------|
| Normal | 0 erreurs/minute | Vert |
| Avertissement | 1-10 erreurs/minute | Jaune |
| Critique | >10 erreurs/minute | Rouge (pulsant) |

## API RPCD

### Methodes

```
luci.secubox-netdiag
  get_switch_status   - Toutes les interfaces avec topologie DSA
  get_interface_details { interface: string } - Details complets ethtool/dmesg
  get_error_history { interface: string, minutes: int } - Timeline des erreurs
  get_topology - Structure du switch DSA
  clear_counters { interface: string } - Effacer l'historique des erreurs
```

### Exemple d'appel ubus

```bash
ubus call luci.secubox-netdiag get_switch_status
```

## Sources de Donnees

- `/sys/class/net/*/statistics/*` - Statistiques kernel
- `/sys/class/net/*/carrier` - Etat de liaison
- `/sys/class/net/*/master` - Topologie DSA
- `ethtool <iface>` - Parametres de liaison
- `ethtool -S <iface>` - Statistiques du pilote
- `dmesg` - Messages kernel

## Composants UI

### Carte de Port
```
+----------+
|  eth0    |
| [*] Up   |
| 1G FD    |
| OK       |
+----------+
```

### Moniteur d'Erreurs
```
eth2 - Erreurs CRC (5 dernieres minutes)
[graphique sparkline] 123/min (CRITIQUE)
```

## Fichiers

```
luci-app-secubox-netdiag/
  Makefile
  htdocs/luci-static/resources/
    view/secubox-netdiag/
      overview.js          # Vue principale LuCI
    secubox-netdiag/
      netdiag.css          # Styles theme SecuBox
  root/usr/
    libexec/rpcd/
      luci.secubox-netdiag # Script backend RPCD
    share/
      luci/menu.d/
        luci-app-secubox-netdiag.json
      rpcd/acl.d/
        luci-app-secubox-netdiag.json
```

## Captures d'Ecran

### Tableau de Bord Principal
- Ports de switch DSA en disposition grille
- Interfaces autonomes en dessous
- Moniteur d'erreurs en bas

### Modal de Detail de Port
- Etat de liaison (vitesse, duplex, autoneg)
- Statistiques de trafic (octets, paquets)
- Compteurs d'erreurs avec deltas
- Messages kernel recents
- Boutons Effacer Historique / Exporter Log

## Licence

MIT
