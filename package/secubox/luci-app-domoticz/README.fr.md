# luci-app-domoticz

[English](README.md) | Francais | [中文](README.zh.md)

Interface web LuCI pour la gestion de la plateforme domotique Domoticz sur SecuBox.

## Installation

```bash
opkg install luci-app-domoticz
```

Necessite `secubox-app-domoticz` (installe comme dependance).

## Fonctionnalites

- **Statut du service** : Statut du conteneur, disponibilite LXC, utilisation memoire/disque, peripheriques USB
- **Integration IoT** : Statut du broker Mosquitto, statut Zigbee2MQTT, configuration du pont MQTT
- **Configuration automatique MQTT** : Installation de Mosquitto et configuration du broker en un clic
- **Reseau** : Integration du reverse proxy HAProxy, controle d'acces WAN, configuration du domaine
- **Mesh P2P** : Enregistrer Domoticz dans le mesh P2P SecuBox pour la decouverte multi-noeuds
- **Actions** : Installer, demarrer, arreter, redemarrer, mettre a jour, sauvegarder, desinstaller
- **Journaux** : Visualiseur de logs du conteneur en temps reel

## Methodes RPCD

| Methode | Params | Description |
|---------|--------|-------------|
| `status` | - | Statut du conteneur, MQTT, Z2M, HAProxy, mesh |
| `start` | - | Demarrer le service Domoticz |
| `stop` | - | Arreter le service Domoticz |
| `restart` | - | Redemarrer le service Domoticz |
| `install` | - | Creer le conteneur LXC et telecharger Domoticz |
| `uninstall` | - | Supprimer le conteneur (conserve les donnees) |
| `update` | - | Telecharger la derniere version de Domoticz et redemarrer |
| `configure_mqtt` | - | Configurer automatiquement Mosquitto et le pont MQTT |
| `configure_haproxy` | - | Enregistrer le vhost HAProxy |
| `backup` | - | Creer une sauvegarde des donnees |
| `restore` | path | Restaurer depuis un fichier de sauvegarde |
| `logs` | lines | Recuperer les logs du conteneur |

## Emplacement du menu

Services > Domoticz

## Fichiers

- `/usr/libexec/rpcd/luci.domoticz` - Gestionnaire RPCD
- `/usr/share/rpcd/acl.d/luci-app-domoticz.json` - Permissions ACL
- `/usr/share/luci/menu.d/luci-app-domoticz.json` - Entree de menu
- `/www/luci-static/resources/view/domoticz/overview.js` - Vue LuCI

## Dependances

- `secubox-app-domoticz`

## Licence

Apache-2.0
