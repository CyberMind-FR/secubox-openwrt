# Docker Zigbee2MQTT sur OpenWrt ARM64

> **Languages:** [English](../../DOCS/embedded/zigbee2mqtt-docker.md) | Francais | [中文](../../DOCS-zh/embedded/zigbee2mqtt-docker.md)

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Ce guide explique comment deployer l'application SecuBox Zigbee2MQTT (basee sur Docker) sur les cibles OpenWrt ARM64. Il utilise le paquet `secubox-app-zigbee2mqtt` (installateur, CLI, service procd) avec l'interface LuCI (`luci-app-zigbee2mqtt`).

---

## Prerequis

1. **OpenWrt 24.10.x ARM64** (ESPRESSObin, MOCHAbin, RPi4, etc.) avec >= 256 Mo de stockage libre (image Docker + repertoire de donnees).
2. **Fonctionnalites du noyau** : cgroups (`/sys/fs/cgroup`), USB CDC ACM (`kmod-usb-acm`).
3. **Materiel** : Coordinateur Zigbee presente comme `/dev/ttyACM0` (ex., SONOFF ZBDongle-E/MG21).
4. **Reseau** : Broker MQTT accessible (Mosquitto local ou distant `mqtt://host:1883`).
5. **Flux de paquets** : `docker`, `dockerd`, `containerd` disponibles (`opkg update`).

---

## Etapes d'installation

```sh
opkg update
opkg install secubox-app-zigbee2mqtt luci-app-zigbee2mqtt
```

1. **Executer l'installateur de prerequis** (verifie le stockage, les cgroups, l'USB, installe Docker, telecharge l'image, active le service) :
   ```sh
   zigbee2mqttctl install
   ```
2. **Demarrer le service** :
   ```sh
   /etc/init.d/zigbee2mqtt start   # active automatiquement via l'installateur
   ```
3. **Configuration LuCI** (flux optionnel via interface) : Services -> SecuBox -> Zigbee2MQTT. Ajustez le port serie, l'hote/identifiants MQTT, les topics de base, etc., puis cliquez sur "Appliquer".

L'installateur ecrit les donnees persistantes sous `/srv/zigbee2mqtt/data` (config + base de donnees) et expose l'interface web Zigbee2MQTT sur le port `8080` par defaut.

---

## Reference de ligne de commande (`/usr/sbin/zigbee2mqttctl`)

| Commande | Description |
|----------|-------------|
| `install` | Configuration complete des prerequis (paquets Docker, repertoire de donnees, telechargement d'image, activation du service). |
| `check` | Relancer les verifications de prerequis (stockage, cgroups, module USB, peripherique serie). |
| `update` | Telecharger la derniere image Zigbee2MQTT et redemarrer le service active. |
| `status` | Afficher l'etat du conteneur Docker (filtre `docker ps`). |
| `logs [-f]` | Afficher les logs Docker du conteneur en continu. |
| `service-run` / `service-stop` | Commandes internes utilisees par le script init procd ; pas pour invocation manuelle. |

Toutes les commandes doivent etre executees en tant que root.

---

## Configuration UCI (`/etc/config/zigbee2mqtt`)

```uci
config zigbee2mqtt 'main'
	option enabled '1'
	option serial_port '/dev/ttyACM0'
	option mqtt_host 'mqtt://127.0.0.1:1883'
	option mqtt_username ''
	option mqtt_password ''
	option base_topic 'zigbee2mqtt'
	option frontend_port '8080'
	option channel '11'
	option image 'ghcr.io/koenkk/zigbee2mqtt:latest'
	option data_path '/srv/zigbee2mqtt'
	option timezone 'UTC'
```

Editez via `uci` ou le formulaire LuCI ; validez les modifications pour redemarrer automatiquement :
```sh
uci set zigbee2mqtt.main.mqtt_host='mqtt://192.168.1.10:1883'
uci commit zigbee2mqtt
/etc/init.d/zigbee2mqtt restart
```

---

## Validation et tests de fumee

- Verification rapide des prerequis :
  ```sh
  zigbee2mqttctl check
  ```
- Test de fumee du depot (execute le demarrage/arret du service + pub/sub MQTT optionnel) :
  ```sh
  ./scripts/smoke_test.sh
  ```
- Bundle de diagnostics (SecuBox general) :
  ```sh
  ./scripts/diagnose.sh
  ```

---

## Depannage

| Symptome | Resolution |
|----------|------------|
| `zigbee2mqttctl install` signale "/sys/fs/cgroup missing" | Activez les cgroups dans la configuration du noyau ou mettez a niveau vers une build avec support cgroup. |
| Coordinateur USB non detecte | Assurez-vous que `kmod-usb-acm` est installe, que le module `cdc_acm` est charge (`lsmod | grep cdc_acm`), et que le peripherique apparait sous `/dev/ttyACM*`. Rebranchez le dongle. |
| Docker ne demarre pas | Verifiez `/etc/init.d/dockerd status`. Si `docker info` echoue, inspectez `/var/log/messages` pour les erreurs du pilote de stockage. |
| Echecs d'authentification MQTT | Definissez `mqtt_username`/`mqtt_password` via UCI ou LuCI et redemarrez le service. |
| Port 8080 deja utilise | Changez `frontend_port` dans UCI, validez, redemarrez le service. Mettez a jour les mappages vhost en consequence. |

---

## Desinstallation / Nettoyage

```sh
/etc/init.d/zigbee2mqtt stop
/etc/init.d/zigbee2mqtt disable
docker rm -f secbx-zigbee2mqtt 2>/dev/null
opkg remove luci-app-zigbee2mqtt secubox-app-zigbee2mqtt
rm -rf /srv/zigbee2mqtt
```

---

## Prochaines etapes

- Utilisez `luci-app-vhost-manager` pour publier l'interface Zigbee2MQTT sous HTTPS (voir `luci-app-vhost-manager/README.md`).
- Integrez avec le futur App Store SecuBox en ajoutant une entree de manifeste referencant cet installateur.
- Combinez avec les profils/assistants une fois ces composants introduits selon la feuille de route du projet.
