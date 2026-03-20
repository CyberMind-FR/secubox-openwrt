# secubox-app-device-intel

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Inventaire unifie des appareils agregeant les donnees de tous les sous-systemes SecuBox. Fait partie de l'ecosysteme SecuBox.

## Apercu

Couche d'agregation pure qui fusionne les donnees de mac-guardian, client-guardian, DHCP, mesh P2P, scanner d'exposition et modules d'emulation en un inventaire unique d'appareils avec classification heuristique, remplacements utilisateur et visibilite inter-mesh.

## Architecture

```
device-intelctl (CLI)
  └── functions.sh (bibliotheque d'agregation)
        ├── di_collect_mac_guardian()    → /var/run/mac-guardian/clients.db
        ├── di_collect_client_guardian() → UCI client-guardian
        ├── di_collect_dhcp()           → /tmp/dhcp.leases
        ├── di_collect_p2p_peers()      → ubus luci.secubox-p2p
        ├── di_collect_exposure()       → /proc/net/tcp
        └── di_collect_emulators()      → emulators/*.sh
              ├── usb.sh    → /sys/bus/usb/devices/
              ├── mqtt.sh   → mosquitto broker
              └── zigbee.sh → zigbee2mqtt / deCONZ API
```

## Flux de donnees

1. **Collecter** — Interroger chaque source de donnees en parallele
2. **Fusionner** — Indexer par adresse MAC, combiner les champs de toutes les sources
3. **Classifier** — Appliquer la chaine heuristique (utilisateur > emulateur > mesh > port > vendeur > hostname)
4. **Mettre en cache** — Stocker dans `/tmp/device-intel/cache-devices.json` (TTL configurable)
5. **Servir** — CLI ou RPCD retourne du JSON unifie

## Priorite de classification

| Priorite | Source | Exemple |
|---|---|---|
| 1 | Remplacement utilisateur | UCI `device-intel.<mac>.type` |
| 2 | Source emulateur | Client MQTT → mqtt_device |
| 3 | Correspondance peer mesh | IP peer P2P → mesh_peer |
| 4 | Base sur le port | Port 445 → storage |
| 5 | Base sur le vendeur | Synology → storage |
| 6 | Base sur le hostname | `.*sensor.*` → iot_sensor |
| 7 | Par defaut | unknown |

## Modules d'emulation

Decouverte d'appareils extensible de style KISS :

- **usb.sh** — Parcourt `/sys/bus/usb/devices/`, classifie par bDeviceClass (storage, serial, HID, camera, audio, printer, wireless)
- **mqtt.sh** — Interroge le broker mosquitto via les topics `$SYS` ou les logs
- **zigbee.sh** — Interroge l'API HTTP zigbee2mqtt ou l'API REST deCONZ

Chacun exporte `emulate_<type>()` retournant des entrees d'appareils delimitees par des pipes.

## Utilisation CLI

```bash
device-intelctl status                                    # Apercu
device-intelctl list table                                # Vue tabulaire
device-intelctl list json                                 # Sortie JSON
device-intelctl show aa:bb:cc:dd:ee:ff                    # Detail de l'appareil
device-intelctl classify                                  # Classification par lot
device-intelctl set-type aa:bb:cc:dd:ee:ff iot_sensor     # Remplacer le type
device-intelctl set-label aa:bb:cc:dd:ee:ff "Temp Sensor" # Label personnalise
device-intelctl emulators                                 # Statut des modules
device-intelctl mesh-list                                 # Appareils peers mesh
device-intelctl export json > inventory.json              # Export complet
```

## Configuration UCI

```
/etc/config/device-intel
  config device-intel 'main'     → enabled, cache_ttl, classify_interval
  config display 'display'       → view mode, grouping, refresh
  config emulator 'mqtt'         → broker_host, port, discovery_topic
  config emulator 'zigbee'       → coordinator, adapter, api_port
  config emulator 'usb'          → scan_interval, track_storage, track_serial
  config device_type '<id>'      → name, icon, color, regles de correspondance vendor/hostname/port
  config device '<mac_clean>'    → remplacements utilisateur (type, label, capabilities, notes)
```

## Fichiers

```
/etc/config/device-intel                          Configuration UCI
/etc/init.d/device-intel                          Script d'initialisation procd
/usr/sbin/device-intelctl                         Controleur CLI
/usr/lib/secubox/device-intel/functions.sh        Bibliotheque d'agregation principale
/usr/lib/secubox/device-intel/classify.sh         Moteur de classification heuristique
/usr/lib/secubox/device-intel/emulators/usb.sh    Emulateur de peripheriques USB
/usr/lib/secubox/device-intel/emulators/mqtt.sh   Emulateur de broker MQTT
/usr/lib/secubox/device-intel/emulators/zigbee.sh Emulateur de coordinateur Zigbee
```

## Dependances

- `jsonfilter` (natif OpenWrt)
- `curl` (pour les appels API des emulateurs)
- Optionnel : `secubox-app-mac-guardian`, `secubox-app-client-guardian`, `secubox-p2p`
