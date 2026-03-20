# Module Pont MQTT

> **Languages:** [English](../DOCS/MQTT_BRIDGE.md) | Francais | [中文](../DOCS-zh/MQTT_BRIDGE.md)

**Version:** 0.4.0
**Statut:** Brouillon

Le Pont MQTT SecuBox expose les dongles USB et les capteurs IoT a travers une interface LuCI avec theme.

## Composants

- **Apercu** - sante du broker, adaptateurs connectes, payloads recents.
- **Appareils** - appareils USB apparies avec etat (en ligne/hors ligne).
- **Parametres** - identifiants du broker, modeles de topics de base, retention.

## API RPC (`luci.mqtt-bridge`)

| Methode | Description |
|---------|-------------|
| `status` | Metriques du broker, payloads stockes et parametres actuels. |
| `list_devices` | Enumere les noeuds USB/capteur apparies. |
| `trigger_pairing` | Ouvre la fenetre d'appairage (2 minutes). |
| `apply_settings` | Persiste la configuration broker/pont. |

`status` inclut maintenant aussi un tableau `profiles` decrivant les presets USB/Zigbee detectes. Chaque entree expose:

| Champ | Description |
|-------|-------------|
| `id` | Identifiant interne du preset (ex: `zigbee_usb2134`). |
| `label` | Nom convivial de l'adaptateur depuis les descripteurs USB. |
| `vendor` / `product` | Paire VID:PID USB. |
| `bus` / `device` | Numeros bus/device Linux comme vus dans `dmesg`/`lsusb`. |
| `port` | Chemin `/dev/tty*` resolu quand disponible. |
| `detected` | Flag booleen (`true` quand le dongle est actuellement attache). |
| `notes` | Indices lisibles par l'humain rendus dans la vue Appareils. |

## Fichiers

```
luci-app-mqtt-bridge/
 ├── htdocs/luci-static/resources/view/mqtt-bridge/*.js
 ├── htdocs/luci-static/resources/mqtt-bridge/common.css
 ├── root/usr/libexec/rpcd/luci.mqtt-bridge
 ├── root/usr/share/luci/menu.d/luci-app-mqtt-bridge.json
 ├── root/usr/share/rpcd/acl.d/luci-app-mqtt-bridge.json
└── root/etc/config/mqtt-bridge
```

## Profil Zigbee / SMSC USB2134B

L'onglet Appareils affiche maintenant un preset pour le pont "Bus 003 Device 002: ID 0424:2134 SMSC USB2134B" qui est communement flashe avec le firmware de coordinateur Zigbee. La vue LuCI consomme le tableau `profiles` explique ci-dessus et affiche l'etat de detection actuel avec l'indice tty.

Pour verifier le dongle manuellement:

```bash
dmesg | tail -n 40 | grep -E '0424:2134|usb 3-1'
lsusb -d 0424:2134
ls /dev/ttyACM* /dev/ttyUSB* 2>/dev/null
```

Log kernel typique:

```
[ 6456.735692] usb 3-1.1: USB disconnect, device number 3
[ 6459.021458] usb 3-1.1: new full-speed USB device number 4 using xhci-hcd
```

Faire correspondre les numeros Bus/Device reportes avec `/sys/bus/usb/devices/*/busnum` et `/sys/bus/usb/devices/*/devnum`; l'assistant RPC inspecte ces fichiers et publie le chemin `/dev/tty*` resolu (quand exporte sous `/sys/bus/usb/devices/*/tty`). Si l'adaptateur n'est pas branche, l'UI rend quand meme le preset pour que les operateurs sachent exactement quelle paire VID/PID chercher.

Une fois le noeud tty confirme, mettre a jour `/etc/config/mqtt-bridge` et redemarrer le service pont pour lier le trafic Zigbee aux topics MQTT definis dans l'onglet Parametres.

## Daemon moniteur d'adaptateur

Le package installe maintenant un observateur leger (`/usr/sbin/mqtt-bridge-monitor`) qui garde SecuBox informe des adaptateurs attaches:

- Configure via `config monitor 'monitor'` (intervalle en secondes) et sections `config adapter '...'` dans `/etc/config/mqtt-bridge`.
- Gere avec le script init standard: `service mqtt-bridge start|stop|status`.
- Ecrit les transitions d'etat dans le log systeme (`logread -e mqtt-bridge-monitor`).
- Met a jour chaque section adaptateur avec `detected`, `port`, `bus`, `device`, `health`, et `last_seen`, que l'onglet Appareils LuCI affiche maintenant.
- La vue Parametres MQTT expose les memes entrees d'adaptateur pour pouvoir activer/desactiver les presets, renommer les labels, ou surcharger les assignations `/dev/tty*` sans quitter l'UI.
- Les boutons dans la vue Parametres permettent de declencher un rescan (`API.rescanAdapters`) ou effacer les donnees en cache pour un adaptateur specifique (`API.resetAdapter`), utile apres re-flashage des dongles ou changement de ports USB.

Utiliser `uci show mqtt-bridge.adapter` pour inspecter les metadonnees persistees, ou `ubus call luci.mqtt-bridge status` pour voir le payload JSON consomme par l'UI.

## Templates & regles d'automatisation

`/etc/config/mqtt-bridge` inclut maintenant des definitions `config template` pour les appareils Zigbee et Modbus:

```uci
config template 'zigbee_default'
	option device_type 'zigbee'
	option topic 'secubox/zigbee/{id}/state'
	option qos '1'
	option retain '1'
```

Ceux-ci sont exportes a travers le RPC `status` (tableau `templates`) pour que LuCI ou les clients externes puissent suggerer des motifs de topics par type d'appareil. Ajouter vos propres sections pour couvrir d'autres bus ou schemas de nommage.

Les regles d'automatisation (`config rule`) peuvent reagir aux transitions d'etat des adaptateurs:

```uci
config rule 'zigbee_disconnect'
	option type 'adapter_status'
	option adapter 'zigbee_usb2134'
	option when 'missing'
	option action 'alert'
	option message 'Pont USB Zigbee deconnecte'
	option topic 'alerts/mqtt/zigbee'
```

Quand le daemon remarque que l'adaptateur passe a `missing` ou `online`, les regles correspondantes ecrivent dans syslog et `/tmp/mqtt-bridge-alerts.log`, facilitant le transfert des evenements vers SecuBox Alerts ou tout autre pipeline.

## Prochaines etapes

- Ajouter une vraie integration daemon avec Mosquitto.
- Supporter TLS et les topics par appareil.
- Emettre des alertes SecuBox sur les seuils des capteurs.

Voir `.codex/apps/mqtt-bridge/TODO.md` pour le backlog evolutif.
