# SecuBox IoT Guard

:globe_with_meridians: **Langues:** [English](README.md) | Français | [中文](README.zh.md)

Isolation, classification et surveillance de sécurité des appareils IoT pour OpenWrt.

## Aperçu

IoT Guard fournit une gestion automatisée des appareils IoT :

- **Classification automatique** - Identifie les appareils IoT par OUI du vendeur et comportement
- **Score de risque** - Calcule le risque de sécurité par appareil (échelle 0-100)
- **Isolation automatique** - Met automatiquement en quarantaine les appareils à haut risque
- **Détection d'anomalies** - Surveille les patterns de trafic pour les anomalies comportementales
- **Cartographie cloud** - Suit les services cloud contactés par chaque appareil

IoT Guard **orchestre les modules SecuBox existants** plutôt que de les réimplémenter :

| Module | Intégration |
|--------|-------------|
| Client Guardian | Assignation de zone (zone IoT) |
| MAC Guardian | Blocage/confiance L2 |
| Vortex Firewall | Filtrage DNS (flux malware IoT) |
| Bandwidth Manager | Limitation de débit |

## Installation

```bash
opkg install secubox-iot-guard luci-app-iot-guard
```

## Utilisation CLI

```bash
# Statut général
iot-guardctl status

# Scanner le réseau pour les appareils IoT
iot-guardctl scan

# Lister tous les appareils
iot-guardctl list
iot-guardctl list --json

# Détails d'un appareil
iot-guardctl show AA:BB:CC:DD:EE:FF

# Isoler dans la zone IoT
iot-guardctl isolate AA:BB:CC:DD:EE:FF

# Faire confiance à l'appareil (ajouter à la liste autorisée)
iot-guardctl trust AA:BB:CC:DD:EE:FF

# Bloquer l'appareil
iot-guardctl block AA:BB:CC:DD:EE:FF

# Voir les anomalies
iot-guardctl anomalies

# Carte des dépendances cloud
iot-guardctl cloud-map AA:BB:CC:DD:EE:FF
```

## Configuration

Éditez `/etc/config/iot-guard` :

```
config iot-guard 'main'
    option enabled '1'
    option scan_interval '300'        # Intervalle de scan réseau (secondes)
    option auto_isolate '1'           # Isoler automatiquement les appareils à haut risque
    option auto_isolate_threshold '80' # Seuil de score de risque pour l'isolation automatique
    option anomaly_detection '1'      # Activer la détection d'anomalies
    option anomaly_sensitivity 'medium' # low/medium/high

config zone_policy 'isolation'
    option target_zone 'iot'          # Zone cible pour les appareils isolés
    option block_lan '1'              # Bloquer l'accès LAN
    option allow_internet '1'         # Autoriser l'accès internet
    option bandwidth_limit '10'       # Limite de débit (Mbps)

config vendor_rule 'ring'
    option vendor_pattern 'Ring|Amazon Ring'
    option oui_prefix '40:B4:CD'
    option device_class 'camera'
    option risk_level 'medium'
    option auto_isolate '1'

config allowlist 'trusted'
    list mac 'AA:BB:CC:DD:EE:FF'

config blocklist 'banned'
    list mac 'AA:BB:CC:DD:EE:FF'
```

## Classes d'appareils

| Classe | Description | Risque par défaut |
|--------|-------------|-------------------|
| camera | Caméras IP, sonnettes vidéo | medium |
| thermostat | Thermostats intelligents, HVAC | low |
| lighting | Ampoules intelligentes, rubans LED | low |
| plug | Prises intelligentes | medium |
| assistant | Assistants vocaux | medium |
| media | TV, appareils de streaming | medium |
| lock | Serrures intelligentes | high |
| sensor | Capteurs de mouvement, portes/fenêtres | low |
| diy | ESP32, Raspberry Pi | high |
| mixed | Appareils multi-fonctions | high |

## Score de risque

Le score de risque est calculé comme suit :

```
score = base_risk + anomaly_penalty + cloud_penalty
```

- **base_risk** : 20 (low), 50 (medium), 80 (high) selon vendeur/classe
- **anomaly_penalty** : +10 par anomalie non résolue
- **cloud_penalty** : +10 si >10 dépendances cloud, +20 si >20 dépendances cloud

## Types d'anomalies

| Type | Sévérité | Description |
|------|----------|-------------|
| bandwidth_spike | high | Trafic Nx au-dessus de la ligne de base |
| new_destination | low | Première connexion à un domaine |
| port_scan | high | A contacté de nombreux ports rapidement |
| time_anomaly | medium | Activité à des heures inhabituelles |
| protocol_anomaly | medium | Utilisation de protocole inattendue |

## Base de données OUI

IoT Guard inclut une base de données OUI pour ~100 fabricants IoT courants :

- Ring, Nest, Wyze, Eufy (caméras)
- Philips Hue, Lifx, Wiz (éclairage)
- TP-Link Kasa/Tapo, Tuya (prises)
- Amazon Echo, Google Home (assistants)
- Espressif, Raspberry Pi (DIY)
- Samsung, LG, Roku (médias)

Ajoutez des OUI personnalisés à `/usr/lib/secubox/iot-guard/iot-oui.tsv` :

```
AA:BB:CC	MyVendor	camera	medium
```

## Fichiers

```
/etc/config/iot-guard                  # Configuration
/usr/sbin/iot-guardctl                 # Contrôleur CLI
/usr/lib/secubox/iot-guard/            # Scripts de bibliothèque
/usr/share/iot-guard/baseline-profiles/ # Lignes de base du trafic
/var/lib/iot-guard/iot-guard.db        # Base de données SQLite
```

## Dépendances

- secubox-core
- sqlite3-cli
- jsonfilter

## Licence

GPL-3.0
