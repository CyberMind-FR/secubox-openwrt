# SecuBox DPI Dual-Stream

:globe_with_meridians: **Langues:** [English](README.md) | Français | [中文](README.zh.md)

Architecture d'inspection approfondie des paquets (DPI) à double flux combinant l'inspection MITM active avec l'analyse TAP passive pour une sécurité réseau complète.

## Architecture

```
                    +-------------------------------------+
                    |            WAN INTERFACE            |
                    +-----------------+-------------------+
                                      |
           +--------------------------+---------------------------+
           |                          |                           |
           v                          v                           |
 +---------------------+    +---------------------+               |
 |   STREAM 1: MITM    |    |  STREAM 2: TAP/DPI  |               |
 |   (Chemin actif)    |    |   (Miroir passif)   |               |
 +---------+-----------+    +---------+-----------+               |
           |                          |                           |
           v                          v                           |
 +---------------------+    +---------------------+               |
 |  HAProxy + MITM     |    |   tc mirred/TAP     |               |
 | (Terminaison SSL)   |    |  (Port Mirroring)   |               |
 +---------+-----------+    +---------+-----------+               |
           |                          |                           |
           v                          v                           |
 +---------------------+    +---------------------+               |
 |   Double Buffer     |    |     netifyd         |               |
 |  (Analyse async)    |    |   (Moteur nDPI)     |               |
 +---------+-----------+    +---------+-----------+               |
           |                          |                           |
           +------------+-------------+                           |
                        |                                         |
                        v                                         |
           +-------------------------------------+                 |
           |        MOTEUR DE CORRÉLATION       |                 |
           |  (Réputation IP + Correspondance)  |                 |
           +-------------------------------------+
```

## Fonctionnalités

### Stream 1 : MITM (Inspection active)
- Inspection complète du contenu avec terminaison SSL/TLS
- Application des règles WAF via mitmproxy
- Analyse des requêtes avec double tampon
- Détection de patterns de menaces (XSS, SQLi, LFI, RCE, SSRF, Path Traversal)
- Détection de scanners (sqlmap, nikto, nmap, etc.)
- Blocage optionnel des requêtes pour les menaces à score élevé

### Stream 2 : TAP (Analyse passive)
- Impact zéro sur la latence du trafic en direct
- Identification de protocoles via nDPI (300+ protocoles)
- Statistiques de flux et analyse de bande passante
- Fonctionne avec le trafic chiffré (analyse des métadonnées)
- Mirroring de port logiciel (tc mirred) ou matériel

### Moteur de corrélation
- Suivi de réputation IP avec décroissance du score
- Correspondance d'événements entre les deux flux
- Intégration CrowdSec (surveillance des décisions, auto-ban)
- Collecte complète du contexte (requêtes MITM, alertes WAF, flux DPI)
- Notifications de menaces de haute sévérité

### Analyse passive des flux LAN
- **Surveillance en temps réel** sur l'interface br-lan
- **Pas de MITM, pas de cache** - analyse nDPI purement passive
- Suivi du trafic par client (octets, flux, protocoles)
- Surveillance des destinations externes
- Détection de protocoles/applications (300+ via nDPI)
- Faible surcharge de ressources

## Installation

```bash
opkg update
opkg install secubox-dpi-dual luci-app-dpi-dual
```

## Utilisation CLI

```bash
# Démarrer/Arrêter/Redémarrer
dpi-dualctl start
dpi-dualctl stop
dpi-dualctl restart

# Vérifier le statut
dpi-dualctl status

# Voir les statistiques de flux
dpi-dualctl flows

# Voir les menaces récentes
dpi-dualctl threats 20

# Contrôle du miroir
dpi-dualctl mirror status
dpi-dualctl mirror start
dpi-dualctl mirror stop
```

### Commandes du corrélateur

```bash
# Corrélation manuelle
dpi-correlator correlate 192.168.1.100 waf_alert "suspicious_request" 75

# Obtenir la réputation IP
dpi-correlator reputation 192.168.1.100

# Obtenir le contexte complet pour une IP
dpi-correlator context 192.168.1.100

# Rechercher des corrélations
dpi-correlator search 192.168.1.100 50

# Afficher les statistiques
dpi-correlator stats
```

### Commandes des flux LAN

```bash
# Afficher le résumé des flux LAN
dpi-dualctl lan

# Lister les clients LAN actifs
dpi-dualctl clients

# Afficher les destinations externes accédées
dpi-dualctl destinations

# Afficher les protocoles détectés
dpi-dualctl protocols
```

## Configuration

Éditez `/etc/config/dpi-dual` :

```
config global 'settings'
    option enabled '1'
    option mode 'dual'           # dual|mitm-only|tap-only
    option correlation '1'

config mitm 'mitm'
    option enabled '1'
    option buffer_size '1000'    # requêtes dans le double tampon
    option async_analysis '1'

config tap 'tap'
    option enabled '1'
    option interface 'tap0'
    option mirror_source 'eth0'
    option mirror_mode 'software' # software|hardware

config correlation 'correlation'
    option enabled '1'
    option watch_crowdsec '1'
    option auto_ban '0'
    option auto_ban_threshold '80'
    option notifications '1'

# Analyse passive des flux LAN (pas de MITM, pas de cache)
config lan 'lan'
    option enabled '1'
    option interface 'br-lan'
    option realtime '1'
    option track_clients '1'
    option track_destinations '1'
    option track_protocols '1'
    option aggregate_interval '5'
    option client_retention '3600'
```

## Tableau de bord LuCI

Naviguez vers **SecuBox > DPI Dual-Stream** :

- **Aperçu** : Statut des flux, métriques, tableau des menaces
- **Timeline de corrélation** : Cartes d'événements avec contexte IP
- **Flux LAN** : Surveillance en temps réel des clients LAN (clients, protocoles, destinations)
- **Paramètres** : Interface de configuration complète

## Fichiers

| Fichier | Objectif |
|---------|----------|
| `/usr/sbin/dpi-dualctl` | Outil CLI principal |
| `/usr/sbin/dpi-flow-collector` | Service d'agrégation des flux |
| `/usr/sbin/dpi-correlator` | Moteur de corrélation |
| `/usr/sbin/dpi-lan-collector` | Collecteur passif de flux LAN |
| `/usr/lib/dpi-dual/mirror-setup.sh` | Mirroring de port tc mirred |
| `/usr/lib/dpi-dual/correlation-lib.sh` | Fonctions de corrélation partagées |
| `/srv/mitmproxy/addons/dpi_buffer.py` | Addon mitmproxy double tampon |
| `/etc/config/dpi-dual` | Configuration UCI |
| `/etc/init.d/dpi-dual` | Service procd |

## Fichiers de sortie

| Fichier | Contenu |
|---------|---------|
| `/tmp/secubox/dpi-flows.json` | Statistiques de flux du flux TAP |
| `/tmp/secubox/dpi-buffer.json` | Statistiques du tampon MITM |
| `/tmp/secubox/waf-alerts.json` | Alertes de menaces WAF |
| `/tmp/secubox/correlated-threats.json` | Journal des menaces corrélées (JSONL) |
| `/tmp/secubox/ip-reputation.json` | Base de données de réputation IP |
| `/tmp/secubox/notifications.json` | Notifications de menaces de haute sévérité |
| `/tmp/secubox/lan-flows.json` | Statistiques résumées des flux LAN |
| `/tmp/secubox/lan-clients.json` | Données des clients LAN actifs |
| `/tmp/secubox/lan-destinations.json` | Destinations externes accédées |
| `/tmp/secubox/lan-protocols.json` | Protocoles/applications détectés |

## Dépendances

- `netifyd` - Analyseur de flux basé sur nDPI
- `iproute2-tc` - Contrôle du trafic pour le port mirroring
- `jsonfilter` - Analyse JSON (libubox)
- `coreutils-stat` - Statistiques de fichiers

## Performance

| Aspect | Stream MITM | Stream TAP | LAN passif |
|--------|-------------|------------|------------|
| Latence | +5-20ms | 0ms | 0ms |
| CPU | Élevé (SSL, WAF) | Faible (nDPI) | Faible (nDPI) |
| Mémoire | Dépend du tampon | Minimal | Minimal |
| Visibilité | Contenu complet | Métadonnées seules | Métadonnées seules |
| Cas d'usage | WAF/Détection de menaces | Analyse WAN | Surveillance LAN |

## Notes de sécurité

1. **Le flux TAP est en lecture seule** — ne peut pas bloquer, seulement observer
2. **Le flux MITM nécessite la confiance CA** — les utilisateurs doivent accepter le certificat
3. **Les données du tampon sont sensibles** — rétention limitée, nettoyage automatique
4. **Les logs de corrélation contiennent des données personnelles** — suivre les réglementations de protection des données

## Licence

GPL-3.0

## Auteur

SecuBox Team <secubox@gk2.net>
