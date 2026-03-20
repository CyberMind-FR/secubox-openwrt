# SecuBox MQTT IoT Bridge

**Version :** 0.5.0-1
**Statut :** Pret pour Production
**Categorie :** IoT & Integration
**Mainteneur :** CyberMind <contact@cybermind.fr>

Pont MQTT IoT avec support complet des peripheriques USB pour les routeurs SecuBox. Detecte et configure automatiquement les adaptateurs USB IoT (Zigbee, Z-Wave, ModBus, Serie) et les relie a un broker MQTT pour la domotique et les applications IoT industrielles.

---

## Fonctionnalites

### Fonctionnalites de Base
- **Integration Broker MQTT** : Connexion aux brokers MQTT locaux ou distants
- **Detection Adaptateurs USB IoT** : Detection automatique de 17 peripheriques USB connus
- **Support Multi-Protocoles** : Zigbee, Z-Wave, ModBus RTU et USB Serie generique
- **Surveillance Sante en Temps Reel** : Suivi du statut des adaptateurs (en ligne/erreur/manquant/inconnu)
- **Gestion de Configuration** : Configuration persistante basee sur UCI
- **Integration Theme SecuBox** : Interface coherente avec les themes sombre/clair/cyberpunk

### Adaptateurs USB IoT Supportes

#### Adaptateurs Zigbee (6 peripheriques)
- **Texas Instruments CC2531** (VID:PID `0451:16a8`)
- **Dresden Elektronik ConBee II** (VID:PID `1cf1:0030`)
- **Sonoff Zigbee 3.0 USB Plus** (VID:PID `1a86:55d4`)
- **Silicon Labs CP2102** (VID:PID `10c4:ea60`) - Zigbee Generique
- **SMSC USB2134B** (VID:PID `0424:2134`)
- **CH340** (VID:PID `1a86:7523`) - Sonoff Zigbee 3.0

#### Cles USB Z-Wave (3 peripheriques)
- **Aeotec Z-Stick Gen5** (VID:PID `0658:0200`)
- **Aeotec Z-Stick 7** (VID:PID `0658:0280`)
- **Z-Wave.Me UZB** (VID:PID `10c4:8a2a`)

#### Adaptateurs ModBus RTU (4 peripheriques)
- **FTDI FT232** (VID:PID `0403:6001`) - USB-Serie
- **Prolific PL2303** (VID:PID `067b:2303`)
- **CH340** (VID:PID `1a86:7523`)
- **CP210x UART Bridge** (VID:PID `10c4:ea60`)

#### Adaptateurs USB Serie Generiques
- Tout adaptateur USB vers serie detecte via `/dev/ttyUSB*` ou `/dev/ttyACM*`

---

## Vues

### 1. Vue d'Ensemble (`overview.js`)
- Statut de connexion au broker MQTT
- Nombre total de peripheriques connectes
- Statistiques des adaptateurs USB par type (Zigbee/Z-Wave/ModBus/Serie)
- Resume du statut de sante (en ligne/erreur/manquant/inconnu)
- Messages et topics MQTT recents
- Actions rapides (scanner USB, reconnecter broker)

### 2. Adaptateurs (`adapters.js`)
- **Grille des Adaptateurs Configures** : Tous les adaptateurs configures via UCI avec statut
- **Section Peripheriques Detectes** : Resultats du scan USB en temps reel
- **Assistant d'Import** : Import en un clic depuis les peripheriques detectes vers la configuration
- **Gestion des Adaptateurs** : Actions tester connexion, configurer, supprimer
- **Indicateurs de Sante** : Statut code par couleur (vert=en ligne, rouge=erreur, jaune=manquant, gris=inconnu)

---

## Methodes RPC (7 au total)

### Detection & Gestion USB

#### `get_usb_devices`
Liste tous les peripheriques USB connectes au systeme avec infos vendeur/produit.

**Parametres :** Aucun
**Retourne :**
```json
{
  "devices": [
    {
      "bus": "usb1",
      "device": "1-1",
      "vendor": "0451",
      "product": "16a8",
      "adapter_type": "zigbee",
      "device_name": "Texas Instruments CC2531",
      "port": "/dev/ttyUSB0"
    }
  ]
}
```

#### `detect_iot_adapters`
Identifie les adaptateurs IoT par correspondance VID:PID avec la base de peripheriques connus.

**Parametres :** Aucun
**Retourne :**
```json
{
  "zigbee": [
    {
      "vendor": "0451",
      "product": "16a8",
      "name": "Texas Instruments CC2531",
      "port": "/dev/ttyUSB0"
    }
  ],
  "zwave": [],
  "modbus": []
}
```

#### `get_serial_ports`
Liste tous les ports serie (`/dev/ttyUSB*`, `/dev/ttyACM*`) avec attributs.

**Parametres :** Aucun
**Retourne :**
```json
{
  "ports": [
    {
      "device": "/dev/ttyUSB0",
      "driver": "ch341",
      "vendor": "1a86",
      "product": "7523",
      "adapter_type": "zigbee"
    }
  ]
}
```

#### `get_adapter_info`
Retourne les informations detaillees pour un adaptateur specifique par ID.

**Parametres :** `{ "adapter": "zigbee_cc2531" }`
**Retourne :**
```json
{
  "id": "zigbee_cc2531",
  "enabled": true,
  "type": "zigbee",
  "vendor": "0451",
  "product": "16a8",
  "port": "/dev/ttyUSB0",
  "baud": "115200",
  "channel": "11",
  "detected": true,
  "health": "online"
}
```

#### `test_connection`
Teste l'accessibilite et la lisibilite du port serie.

**Parametres :** `{ "port": "/dev/ttyUSB0" }`
**Retourne :**
```json
{
  "success": true,
  "port": "/dev/ttyUSB0",
  "readable": true,
  "writable": true,
  "error": null
}
```

#### `configure_adapter`
Cree ou met a jour une configuration d'adaptateur UCI.

**Parametres :**
```json
{
  "adapter_id": "zigbee_usb2134",
  "type": "zigbee",
  "vendor": "0424",
  "product": "2134",
  "port": "/dev/ttyUSB1",
  "baud": "115200",
  "enabled": true
}
```
**Retourne :** `{ "success": true }`

#### `get_adapter_status`
Retourne le statut de sante en temps reel pour tous les adaptateurs configures.

**Parametres :** Aucun
**Retourne :**
```json
{
  "adapters": [
    {
      "id": "zigbee_cc2531",
      "health": "online",
      "port": "/dev/ttyUSB0",
      "detected": true,
      "last_seen": 1704046800
    }
  ]
}
```

---

## Configuration UCI

### Fichier de Configuration : `/etc/config/mqtt-bridge`

#### Exemple de Configuration

```
# Parametres Broker MQTT
config broker 'broker'
    option host '127.0.0.1'
    option port '1883'
    option username 'secubox'
    option password 'secubox'
    option client_id 'mqtt-bridge-01'

# Configuration du Pont
config bridge 'bridge'
    option base_topic 'secubox/+/state'
    option retention '7'
    option auto_discovery '1'
    option poll_interval '30'

# Surveillance USB
config monitor 'monitor'
    option interval '10'
    option usb_scan_enabled '1'
    option auto_configure '0'

# Exemple Adaptateur Zigbee
config adapter 'zigbee_cc2531'
    option enabled '1'
    option type 'zigbee'
    option title 'Texas Instruments CC2531'
    option vendor '0451'
    option product '16a8'
    option port '/dev/ttyUSB0'
    option baud '115200'
    option channel '11'
    option pan_id '0x1A62'
    option permit_join '0'
    option detected '1'
    option health 'online'

# Exemple Adaptateur Z-Wave
config adapter 'zwave_aeotec'
    option enabled '1'
    option type 'zwave'
    option title 'Aeotec Z-Stick Gen5'
    option vendor '0658'
    option product '0200'
    option port '/dev/ttyACM0'
    option baud '115200'
    option detected '0'
    option health 'unknown'

# Exemple Adaptateur ModBus RTU
config adapter 'modbus_ftdi'
    option enabled '1'
    option type 'modbus'
    option title 'Adaptateur ModBus FTDI'
    option vendor '0403'
    option product '6001'
    option port '/dev/ttyUSB1'
    option baud '9600'
    option parity 'N'
    option databits '8'
    option stopbits '1'
    option slave_id '1'
    option detected '1'
    option health 'online'
```

### Options de Configuration

#### Section Broker
- `host` : Nom d'hote ou IP du broker MQTT
- `port` : Port du broker MQTT (defaut : 1883)
- `username` : Nom d'utilisateur d'authentification
- `password` : Mot de passe d'authentification
- `client_id` : Identifiant client unique

#### Section Bridge
- `base_topic` : Topic MQTT de base pour les messages des peripheriques
- `retention` : Retention des messages en jours
- `auto_discovery` : Activer l'auto-decouverte MQTT (0/1)
- `poll_interval` : Intervalle de polling en secondes

#### Section Monitor
- `interval` : Intervalle de scan USB en secondes
- `usb_scan_enabled` : Activer le scan USB automatique (0/1)
- `auto_configure` : Auto-configurer les adaptateurs detectes (0/1)

#### Sections Adapter
- `enabled` : Activer cet adaptateur (0/1)
- `type` : Type d'adaptateur (zigbee/zwave/modbus/serial)
- `title` : Nom lisible par l'humain
- `vendor` : ID vendeur USB (VID)
- `product` : ID produit USB (PID)
- `port` : Chemin du port serie
- `baud` : Vitesse en bauds (9600, 19200, 38400, 57600, 115200, etc.)
- `detected` : Adaptateur actuellement detecte (0/1, mis a jour automatiquement)
- `health` : Statut de sante de l'adaptateur (online/error/missing/unknown, mis a jour automatiquement)

#### Options Specifiques Zigbee
- `channel` : Canal Zigbee (11-26)
- `pan_id` : ID Personal Area Network (hex)
- `permit_join` : Autoriser nouveaux peripheriques a rejoindre (0/1)

#### Options Specifiques ModBus
- `parity` : Bit de parite (N/E/O)
- `databits` : Bits de donnees (7/8)
- `stopbits` : Bits d'arret (1/2)
- `slave_id` : ID esclave ModBus

---

## Bibliotheque de Detection USB

Emplacement : `/usr/share/mqtt-bridge/usb-database.sh`

### Fonctions Cles

#### `detect_adapter_type(vid, pid)`
Fait correspondre VID:PID avec la base de peripheriques connus.

**Retourne :** `zigbee`, `zwave`, `modbus`, `serial`, ou `unknown`

#### `find_usb_tty(device_path)`
Mappe le chemin de peripherique USB vers le port serie (`/dev/ttyUSB*` ou `/dev/ttyACM*`).

**Retourne :** Chemin du peripherique ou chaine vide

#### `test_serial_port(port)`
Teste si le port serie est accessible.

**Retourne :** 0 (succes) ou 1 (echec)

#### `get_device_name(vid, pid)`
Recupere le nom lisible du peripherique depuis la base de donnees.

**Retourne :** Chaine du nom du peripherique

---

## Installation

### Dependances

```bash
# Requis
opkg update
opkg install luci-base rpcd curl mosquitto

# Optionnel (pour protocoles specifiques)
opkg install python3-pyserial  # Pour communication serie
opkg install socat              # Pour pont TCP/serie
```

### Installation du Paquet

```bash
# Telecharger depuis GitHub Releases
wget https://github.com/CyberMind-FR/secubox-openwrt/releases/download/v0.5.0/luci-app-mqtt-bridge_0.5.0-1_all.ipk

# Installer
opkg install luci-app-mqtt-bridge_0.5.0-1_all.ipk

# Redemarrer services
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

---

## Guide d'Utilisation

### 1. Configuration Initiale

1. Naviguer vers **SecuBox -> Reseau -> MQTT IoT Bridge -> Vue d'Ensemble**
2. Configurer les parametres du broker MQTT (hote, port, identifiants)
3. Cliquer sur **Sauvegarder & Appliquer**

### 2. Detection des Adaptateurs USB

1. Brancher votre adaptateur USB IoT (Zigbee, Z-Wave, etc.)
2. Aller a la vue **Adaptateurs**
3. Cliquer sur **Scanner Peripheriques USB**
4. Les peripheriques detectes apparaitront dans la section "Peripheriques Detectes"

### 3. Import des Adaptateurs

1. Dans la section **Peripheriques Detectes**, trouver votre adaptateur
2. Cliquer sur le bouton **Importer**
3. L'adaptateur sera ajoute a la configuration automatiquement
4. Modifier les parametres de l'adaptateur si necessaire (canal, vitesse en bauds, etc.)

### 4. Test de Connectivite

1. Selectionner un adaptateur dans la grille **Adaptateurs Configures**
2. Cliquer sur **Tester Connexion**
3. Verifier l'indicateur de statut (vert = succes, rouge = echec)

### 5. Surveillance de la Sante

- **En Ligne** : Adaptateur connecte et repond
- **Erreur** : Connexion echouee ou erreur de communication
- **Manquant** : Adaptateur detecte avant mais maintenant deconnecte
- **Inconnu** : Statut pas encore determine

---

## Depannage

### Problemes Courants

#### Adaptateur Non Detecte

**Symptomes :** Adaptateur USB branche mais n'apparait pas dans "Peripheriques Detectes"

**Solutions :**
1. Verifier si le peripherique USB est reconnu par le kernel :
   ```bash
   lsusb
   dmesg | grep tty
   ```
2. Verifier que le peripherique apparait dans sysfs :
   ```bash
   ls /sys/bus/usb/devices/
   ```
3. Verifier si VID:PID est dans la base de donnees :
   ```bash
   cat /usr/share/mqtt-bridge/usb-database.sh | grep <VID>:<PID>
   ```

#### Erreurs de Permission Port

**Symptomes :** "Permission denied" lors de l'acces a `/dev/ttyUSB*`

**Solutions :**
1. Verifier les permissions du script RPCD :
   ```bash
   chmod 755 /usr/libexec/rpcd/luci.mqtt-bridge
   ```
2. Verifier les permissions du noeud de peripherique :
   ```bash
   ls -l /dev/ttyUSB0
   chmod 666 /dev/ttyUSB0  # Correction temporaire
   ```

#### Statut de Sante Affiche "Manquant"

**Symptomes :** L'adaptateur fonctionnait mais affiche maintenant le statut "missing"

**Solutions :**
1. Verifier si le peripherique USB est toujours connecte :
   ```bash
   lsusb
   ```
2. Verifier que le port serie existe :
   ```bash
   ls -l /dev/ttyUSB*
   ```
3. Rebrancher l'adaptateur USB
4. Verifier dmesg pour les erreurs USB :
   ```bash
   dmesg | tail -20
   ```

### Commandes de Debug

```bash
# Lister tous les peripheriques USB
ubus call luci.mqtt-bridge get_usb_devices

# Detecter adaptateurs IoT
ubus call luci.mqtt-bridge detect_iot_adapters

# Obtenir statut adaptateurs
ubus call luci.mqtt-bridge get_adapter_status

# Tester port serie
ubus call luci.mqtt-bridge test_connection '{"port":"/dev/ttyUSB0"}'

# Voir configuration pont MQTT
uci show mqtt-bridge

# Verifier logs RPCD
logread | grep mqtt-bridge
```

---

## Reference API

### Module API JavaScript

Emplacement : `htdocs/luci-static/resources/mqtt-bridge/api.js`

```javascript
// Importer le module API
'require mqtt-bridge/api as API';

// Obtenir peripheriques USB
API.getUSBDevices().then(function(devices) {
    console.log('Peripheriques USB:', devices);
});

// Detecter adaptateurs IoT
API.detectIoTAdapters().then(function(adapters) {
    console.log('Zigbee:', adapters.zigbee);
    console.log('Z-Wave:', adapters.zwave);
    console.log('ModBus:', adapters.modbus);
});

// Configurer adaptateur
API.configureAdapter({
    adapter_id: 'zigbee_cc2531',
    type: 'zigbee',
    vendor: '0451',
    product: '16a8',
    port: '/dev/ttyUSB0',
    baud: '115200',
    enabled: true
}).then(function(result) {
    console.log('Configure:', result.success);
});

// Obtenir statut adaptateurs
API.getAdapterStatus().then(function(status) {
    console.log('Statut adaptateurs:', status.adapters);
});
```

---

## Exemples d'Integration

### Home Assistant

```yaml
# configuration.yaml
mqtt:
  broker: <openwrt-router-ip>
  port: 1883
  username: secubox
  password: secubox
  discovery: true
  discovery_prefix: homeassistant
```

### Zigbee2MQTT

```yaml
# configuration.yaml
homeassistant: true
permit_join: false
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://<openwrt-router-ip>
serial:
  port: /dev/ttyUSB0
  adapter: zstack
```

### Node-RED

```javascript
// Configuration noeud MQTT In
{
    "server": "<openwrt-router-ip>:1883",
    "topic": "secubox/+/state",
    "qos": "0",
    "username": "secubox",
    "password": "secubox"
}
```

---

## Developpement

### Structure du Projet

```
luci-app-mqtt-bridge/
|-- Makefile
|-- README.md
|-- htdocs/
|   +-- luci-static/
|       +-- resources/
|           |-- mqtt-bridge/
|           |   +-- api.js          # Module API
|           +-- view/
|               +-- mqtt-bridge/
|                   |-- overview.js  # Tableau de bord Vue d'Ensemble
|                   +-- adapters.js  # Gestion adaptateurs USB
|-- root/
    |-- etc/
    |   +-- config/
    |       +-- mqtt-bridge         # Config UCI
    +-- usr/
        |-- libexec/
        |   +-- rpcd/
        |       +-- luci.mqtt-bridge  # Backend RPCD
        +-- share/
            |-- luci/
            |   +-- menu.d/
            |       +-- luci-app-mqtt-bridge.json
            |-- rpcd/
            |   +-- acl.d/
            |       +-- luci-app-mqtt-bridge.json
            +-- mqtt-bridge/
                +-- usb-database.sh  # Bibliotheque detection USB
```

### Ajout de Nouveaux Peripheriques USB

Pour ajouter le support d'un nouvel adaptateur USB IoT :

1. Editer `/usr/share/mqtt-bridge/usb-database.sh`
2. Ajouter VID:PID a la base de donnees appropriee :
   ```bash
   ZIGBEE_DEVICES="
   ...
   <VID>:<PID>:Nom de Votre Peripherique
   "
   ```
3. Redemarrer RPCD : `/etc/init.d/rpcd restart`

---

## Licence

Apache License 2.0

---

## Mainteneur

**CyberMind.fr**
GitHub: @gkerma
Email: contact@cybermind.fr

---

## Historique des Versions

### v0.5.0 (2025-12-30)
- Support complet adaptateurs USB IoT
- Ajout de 17 peripheriques connus a la base VID:PID
- Creation de la vue adapters.js pour gestion USB
- Overview.js ameliore avec statistiques adaptateurs
- Implementation de 7 nouvelles methodes RPCD pour operations USB
- Ajout surveillance sante en temps reel
- Integration theme SecuBox (sombre/clair/cyberpunk)

### v0.4.0 (2025-11)
- Integration broker MQTT initiale
- Gestion basique des peripheriques
- Configuration des parametres

---

## Ressources

- **Depot GitHub** : https://github.com/CyberMind-FR/secubox-openwrt
- **Documentation** : https://gkerma.github.io/secubox-openwrt/
- **Suivi des Issues** : https://github.com/CyberMind-FR/secubox-openwrt/issues
- **Demo Live** : https://secubox.cybermood.eu

---

*Derniere mise a jour : 2025-12-30*
