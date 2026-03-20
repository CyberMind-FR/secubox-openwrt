[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Domoticz

Plateforme domotique fonctionnant dans un conteneur LXC Debian avec pont MQTT, integration Zigbee2MQTT et support mesh P2P.

## Installation

```sh
opkg install secubox-app-domoticz
domoticzctl install
/etc/init.d/domoticz start
```

## Configuration

Fichier de configuration UCI : `/etc/config/domoticz`

```
config domoticz 'main'
    option enabled '0'
    option data_path '/srv/domoticz'
    option devices_path '/srv/devices'
    option port '8080'
    option timezone 'UTC'

config domoticz 'mqtt'
    option enabled '0'
    option broker '127.0.0.1'
    option broker_port '1883'
    option topic_prefix 'domoticz'
    option z2m_topic 'zigbee2mqtt'

config domoticz 'network'
    option domain 'domoticz.secubox.local'
    option haproxy '0'
    option firewall_wan '0'

config domoticz 'mesh'
    option enabled '0'
```

## Utilisation

```sh
domoticzctl install           # Creer un conteneur LXC, telecharger Domoticz
domoticzctl uninstall         # Supprimer le conteneur (donnees conservees)
domoticzctl update            # Telecharger le dernier Domoticz, redemarrer
domoticzctl status            # Afficher le statut du conteneur
domoticzctl logs [-f]         # Logs du conteneur
domoticzctl configure-mqtt    # Auto-configurer Mosquitto + pont MQTT
domoticzctl configure-haproxy # Enregistrer le vhost HAProxy
domoticzctl backup [path]     # Sauvegarder les donnees
domoticzctl restore <path>    # Restaurer depuis une sauvegarde
domoticzctl mesh-register     # Enregistrer dans le mesh P2P
```

## Pont MQTT

La commande `configure-mqtt` auto-configure :
1. Installe `mosquitto-nossl` si absent
2. Configure le listener Mosquitto sur le port 1883
3. Detecte les parametres du broker Zigbee2MQTT pour compatibilite
4. Stocke la config MQTT dans UCI pour persistance

Apres configuration, ajoutez le hardware MQTT dans l'interface Domoticz : Configuration > Hardware > MQTT Client Gateway.

## Integration Zigbee

Quand `secubox-app-zigbee2mqtt` est installe :
- Les deux services partagent le meme broker Mosquitto
- Les appareils Zigbee publient sur le topic `zigbee2mqtt/#`
- Domoticz s'abonne via le hardware MQTT Client Gateway

## Fichiers

- `/etc/config/domoticz` -- Configuration UCI
- `/etc/init.d/domoticz` -- Script init (procd)
- `/usr/sbin/domoticzctl` -- CLI du controleur

## Dependances

- `lxc`, `lxc-common`
- Optionnel : `mosquitto-nossl`, `secubox-app-zigbee2mqtt`

## Licence

Apache-2.0
