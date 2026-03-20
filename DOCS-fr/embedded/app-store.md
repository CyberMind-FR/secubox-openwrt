# App Store SecuBox et Manifestes

> **Languages:** [English](../../DOCS/embedded/app-store.md) | Francais | [中文](../../DOCS-zh/embedded/app-store.md)

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Ce guide decrit le format du registre "SecuBox Apps" et l'assistant CLI `secubox-app`. L'App Store fournit actuellement des manifestes pour Zigbee2MQTT, Lyrion Media Server et Domoticz, avec un workflow pret pour des services Docker/LXC/natifs supplementaires.

---

## Structure des manifestes (`plugins/catalog/<app>.json`)

Chaque application dispose maintenant d'un manifeste JSON normalise sous `plugins/catalog/<app-id>.json` (les anciennes entrees `plugins/<app>/manifest.json` restent pour la compatibilite ascendante). Exemple (Zigbee2MQTT) :

```json
{
  "id": "zigbee2mqtt",
  "name": "Zigbee2MQTT",
  "category": "home-automation",
  "runtime": "docker",
  "maturity": "stable",
  "description": "Passerelle Zigbee dockerisee reliant les coordinateurs Zigbee aux brokers MQTT.",
  "source": {
    "homepage": "https://www.zigbee2mqtt.io/",
    "github": "https://github.com/CyberMind-FR/secubox-openwrt/tree/main/secubox-app-zigbee2mqtt"
  },
  "packages": ["secubox-app-zigbee2mqtt", "luci-app-zigbee2mqtt"],
  "capabilities": ["zigbee-gateway", "mqtt", "docker-runner"],
  "requirements": {
    "arch": ["arm64"],
    "min_ram_mb": 256,
    "min_storage_mb": 512
  },
  "hardware": { "usb": true, "serial": true },
  "network": {
    "inbound_ports": [8080],
    "protocols": ["http", "mqtt"],
    "outbound_only": false
  },
  "privileges": {
    "needs_usb": true,
    "needs_serial": true,
    "needs_net_admin": false
  },
  "ports": [{ "name": "frontend", "protocol": "http", "port": 8080 }],
  "volumes": ["/srv/zigbee2mqtt"],
  "wizard": {
    "uci": { "config": "zigbee2mqtt", "section": "main" },
    "fields": [
      { "id": "serial_port", "label": "Port serie", "type": "text", "uci_option": "serial_port" },
      { "id": "mqtt_host", "label": "Hote MQTT", "type": "text", "uci_option": "mqtt_host" },
      { "id": "mqtt_username", "label": "Nom d'utilisateur MQTT", "type": "text", "uci_option": "mqtt_username" },
      { "id": "mqtt_password", "label": "Mot de passe MQTT", "type": "password", "uci_option": "mqtt_password" },
      { "id": "base_topic", "label": "Topic de base", "type": "text", "uci_option": "base_topic" },
      { "id": "frontend_port", "label": "Port frontend", "type": "number", "uci_option": "frontend_port" }
    ]
  },
  "profiles": { "recommended": ["home", "lab", "iot"] },
  "actions": {
    "install": "zigbee2mqttctl install",
    "check": "zigbee2mqttctl check",
    "update": "zigbee2mqttctl update",
    "status": "/etc/init.d/zigbee2mqtt status"
  }
}
```

**Cles obligatoires**

| Cle | Description |
|-----|-------------|
| `id` | Identifiant unique utilise par le CLI (`secubox-app install <id>`). |
| `name` / `description` | Metadonnees d'affichage. |
| `category` | Une parmi : home-automation, networking, security, media, monitoring, storage, development, system, iot, radio, misc. |
| `runtime` | `docker`, `lxc`, `native`, ou `hybrid`. |
| `packages` | Liste des paquets OpenWrt a installer/supprimer. |
| `requirements.arch` | Architectures supportees par l'application/runtime. |
| `requirements.min_ram_mb` / `requirements.min_storage_mb` | Guide de ressources conservateur pour les filtres de l'interface. |
| `actions.install/update/check/status` | Commandes shell optionnelles executees apres les operations opkg. |

**Cles optionnelles**

- `ports` : Documenter les services exposes pour l'interface App Store.
- `volumes` : Repertoires persistants (ex., `/srv/zigbee2mqtt`).
- `network` : Indications de connexion (protocoles, ports entrants, flag outbound-only).
- `hardware` / `privileges` : Indications USB/serie/net_admin pour les assistants.
- `wizard` : Cible UCI plus la liste declarative de champs consommee par l'assistant LuCI.
- `profiles` : Tags a precharger lors de l'application de profils de type OS (ex., tableau `profiles.recommended`).
- `capabilities`, `maturity`, `source`, `update.strategy` : Metadonnees supplementaires pour les filtres et instructions CLI.

---

## Utilisation CLI (`secubox-app`)

`secubox-app` est distribue comme un paquet OpenWrt autonome (voir `package/secubox/secubox-app`) et installe le CLI a `/usr/sbin/secubox-app`. Commandes :

```bash
# Lister les manifestes
secubox-app list

# Inspecter le manifeste brut
secubox-app show zigbee2mqtt

# Installer les paquets + executer l'action d'installation
secubox-app install zigbee2mqtt

# Executer la commande de statut (si definie)
secubox-app status zigbee2mqtt

# Mettre a jour ou supprimer
secubox-app update zigbee2mqtt
secubox-app remove zigbee2mqtt

# Valider les manifestes (schema + exigences)
secubox-app validate
```

Variables d'environnement :
- `SECUBOX_PLUGINS_DIR` : remplacer le repertoire des manifestes (defaut `../plugins`).

Le CLI s'appuie sur `opkg` et `jsonfilter`, donc executez-le sur le routeur (ou dans le SDK OpenWrt). Il est idempotent : reinstaller une application deja installee confirme simplement l'etat des paquets et reexecute les hooks d'installation optionnels.

---

## Applications SecuBox empaquetees

Les paquets `secubox-app-*` fournissent les pieces runtime derriere chaque manifeste (scripts init, helpers et configs par defaut). Ils sont copies automatiquement par `secubox-tools/local-build.sh` dans les builds firmware et le feed SDK, donc les developpeurs obtiennent les memes artefacts que l'assistant LuCI et le CLI.

| Paquet | ID Manifeste | Description |
|--------|--------------|-------------|
| `secubox-app-zigbee2mqtt` | `zigbee2mqtt` | Installe le runner Docker + `zigbee2mqttctl`, expose les helpers splash/log, et distribue la config UCI par defaut. |
| `secubox-app-lyrion` | `lyrion` | Deploie le conteneur Lyrion Media Server, CLI (`lyrionctl`), et hooks de profil pour la publication HTTPS. |
| `secubox-app-domoticz` | `domoticz` | Fournit l'automatisation Docker Domoticz (`domoticzctl`) et la structure de donnees/service de base consommee par l'assistant. |

Les trois paquets declarent leurs dependances (Docker, gestionnaire vhost, etc.) donc `secubox-app install <id>` n'a qu'a orchestrer les actions, pas a deviner les feeds requis.

- **QA des manifestes** : executez `secubox-app validate` avant les commits/releases pour detecter les IDs, runtimes ou paquets manquants.
- **Actualisation des specs** : `python scripts/refresh-manifest-specs.py` reapplique les heuristiques d'architecture/specs minimales partagees pour que les fichiers JSON individuels restent synchronises.

---

## Integration future

- La page App Store LuCI consommera le meme repertoire de manifestes pour afficher les cartes, filtres et boutons d'installation.
- Les assistants liront les metadonnees `wizard.steps` pour presenter des formulaires guides.
- Les profils peuvent regrouper des manifestes avec des modes reseau specifiques (ex., DMZ + Zigbee2MQTT + Lyrion).

Pour l'instant, Zigbee2MQTT demontre le format. Les manifestes supplementaires doivent suivre le meme schema pour assurer la coherence du CLI et des futures interfaces.
