# LuCI App - Zigbee2MQTT

[English](README.md) | Francais | [中文](README.zh.md)

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Interface LuCI pour la gestion du service Zigbee2MQTT base sur Docker, fourni par `secubox-app-zigbee2mqtt`.

## Fonctionnalites

- Affiche le statut du service/conteneur, l'activation et les actions rapides (demarrer/arreter/redemarrer/mettre a jour).
- Execute les verifications de prerequis et l'installation complete de Docker (dockerd/containerd/pull d'image) via les boutons LuCI.
- Fournit un formulaire pour editer `/etc/config/zigbee2mqtt` (port serie, hote MQTT, identifiants, topic de base, port frontend, canal, chemin des donnees, image docker, fuseau horaire).
- Diffuse les logs Docker directement dans LuCI.
- Utilise le systeme de design SecuBox et le backend RPCD (`luci.zigbee2mqtt`).

## Prerequis

- Package `secubox-app-zigbee2mqtt` installe (fournit le CLI + service procd).
- Runtime Docker (`dockerd`, `docker`, `containerd`) disponible sur le routeur.
- Coordinateur Zigbee connecte (ex. `/dev/ttyACM0`).

## Installation

```sh
opkg update
opkg install secubox-app-zigbee2mqtt luci-app-zigbee2mqtt
```

Acces via LuCI : **Services -> SecuBox -> Zigbee2MQTT**.

## Fichiers

| Chemin | Fonction |
|--------|----------|
| `htdocs/luci-static/resources/view/zigbee2mqtt/overview.js` | Vue LuCI principale. |
| `htdocs/luci-static/resources/zigbee2mqtt/api.js` | Liaisons RPC. |
| `root/usr/libexec/rpcd/luci.zigbee2mqtt` | Backend RPC interagissant avec UCI et `zigbee2mqttctl`. |
| `root/usr/share/luci/menu.d/luci-app-zigbee2mqtt.json` | Entree de menu. |
| `root/usr/share/rpcd/acl.d/luci-app-zigbee2mqtt.json` | ACL par defaut. |

## Methodes RPC

- `status` - Retourne la configuration UCI, l'etat d'activation/fonctionnement du service, la liste des conteneurs Docker.
- `apply` - Met a jour les champs UCI, valide et redemarre le service.
- `logs` - Affiche les logs du conteneur.
- `control` - Demarrer/arreter/redemarrer le service via le script init.
- `update` - Telecharger la derniere image et redemarrer.

## Notes de developpement

- Suivre les tokens de design SecuBox (voir `DOCS/DEVELOPMENT-GUIDELINES.md`).
- Garder les noms de fichiers RPC alignes avec le nom d'objet ubus (`luci.zigbee2mqtt`).
- Valider avec `./secubox-tools/validate-modules.sh`.

## Documentation

- Guide de deploiement : [`docs/embedded/zigbee2mqtt-docker.md`](../docs/embedded/zigbee2mqtt-docker.md)
- L'assistant CLI (`zigbee2mqttctl`) est fourni par `secubox-app-zigbee2mqtt`.
