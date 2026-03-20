[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Zigbee2MQTT - Passerelle Zigbee vers MQTT

Passerelle Zigbee2MQTT basee sur Docker pour OpenWrt. Connecte les appareils Zigbee a votre broker MQTT via un adaptateur USB Zigbee, permettant l'integration domotique sans dependance au cloud des fabricants.

## Installation

```bash
opkg install secubox-app-zigbee2mqtt
```

## Configuration

Fichier de configuration UCI : `/etc/config/zigbee2mqtt`

```bash
uci set zigbee2mqtt.main.enabled='1'
uci set zigbee2mqtt.main.port='8099'
uci set zigbee2mqtt.main.serial_port='/dev/ttyACM0'
uci set zigbee2mqtt.main.mqtt_server='mqtt://localhost:1883'
uci commit zigbee2mqtt
```

## Utilisation

```bash
zigbee2mqttctl start       # Demarrer le conteneur Zigbee2MQTT
zigbee2mqttctl stop        # Arreter le conteneur Zigbee2MQTT
zigbee2mqttctl status      # Afficher le statut du service
zigbee2mqttctl logs        # Voir les logs du conteneur
zigbee2mqttctl permit      # Ouvrir le reseau pour l'appairage d'appareils
```

## Fonctionnalites

- Frontend web pour la gestion et l'appairage des appareils
- Support des adaptateurs USB Zigbee (CC2531, CC2652, SONOFF, etc.)
- Controle des appareils base sur les topics MQTT
- Mises a jour OTA du firmware des appareils Zigbee
- Isolation via conteneur Docker

## Dependances

- `kmod-usb-acm`
- `dockerd`
- `docker`
- `containerd`

## Licence

Apache-2.0
