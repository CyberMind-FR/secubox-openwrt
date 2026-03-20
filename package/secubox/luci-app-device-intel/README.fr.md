[English](README.md) | Francais | [中文](README.zh.md)

# luci-app-device-intel

Interface web LuCI pour SecuBox Device Intelligence.

## Apercu

Tableau de bord unifie des appareils agregeant les donnees de tous les sous-systemes SecuBox. Cinq vues : Tableau de bord, Appareils, Emulateurs, Maillage, Parametres.

## Vues

### Tableau de Bord (`device-intel/dashboard`)
- Cartes de statistiques resumees : Total, En ligne, Pairs Maillage, A Risque
- Puces de statut des sources de donnees : MAC Guardian, Client Guardian, DHCP, P2P
- Puces de statut des emulateurs : USB, MQTT, Zigbee
- Grille de distribution des types d'appareils (cartes avec compte et couleur)
- Barre de distribution des zones
- Tableau des appareils recents (5 derniers par last_seen)

### Appareils (`device-intel/devices`)
- Barre de filtre : recherche textuelle, liste deroulante type, statut en ligne/hors ligne
- Tableau complet des appareils : point de statut, nom, MAC, IP, fabricant, type, zone, source, actions
- Modal d'edition : changer l'etiquette et le type d'appareil personnalise
- Modal de detail : tous les attributs de l'appareil
- Mises a jour du filtre en temps reel sans rechargement de page

### Emulateurs (`device-intel/emulators`)
- Carte USB : nombre d'appareils systeme, peripheriques decouverts, mini tableau
- Carte MQTT : hote/port du broker, statut en cours d'execution, clients decouverts
- Carte Zigbee : type d'adaptateur, chemin du dongle, dongle present, appareils appaires
- Lien vers les parametres pour la configuration

### Maillage (`device-intel/mesh`)
- Cartes de pairs : nom, IP, statut en ligne/hors ligne
- Tableau des appareils distants : appareils rapportes par les pairs du maillage
- Colonne du noeud source pour l'attribution inter-maillage

### Parametres (`device-intel/settings`)
- General : activer, TTL du cache, auto-classifier, intervalle de classification, timeout du maillage
- Affichage : vue par defaut, grouper par, afficher hors ligne, afficher pairs du maillage, auto-rafraichissement
- Emulateur USB : activer, intervalle de scan, suivre le stockage, suivre les ports serie
- Emulateur MQTT : activer, hote/port du broker, topic de decouverte, intervalle de scan
- Emulateur Zigbee : activer, appareil coordinateur, type d'adaptateur, port API, topic du bridge

## Methodes RPCD

| Methode | Parametres | Description |
|---------|------------|-------------|
| `get_devices` | — | Inventaire complet des appareils (mis en cache) |
| `get_device` | mac | Details d'un appareil unique |
| `get_summary` | — | Stats + statut source/emulateur |
| `get_mesh_devices` | — | Pairs du maillage et appareils distants |
| `get_emulators` | — | Statut des modules emulateurs |
| `get_device_types` | — | Definitions des types d'appareils enregistres |
| `classify_device` | mac | Executer la classification (unique ou tous) |
| `set_device_meta` | mac, type, label | Mettre a jour les personnalisations d'appareil |
| `refresh` | — | Invalider le cache |

## Fichiers

```
root/usr/libexec/rpcd/luci.device-intel                Gestionnaire RPCD
root/usr/share/luci/menu.d/luci-app-device-intel.json  Menu (5 onglets)
root/usr/share/rpcd/acl.d/luci-app-device-intel.json   ACL
htdocs/.../resources/device-intel/api.js               API RPC partagee
htdocs/.../resources/device-intel/common.css            CSS du tableau de bord
htdocs/.../resources/view/device-intel/dashboard.js     Vue tableau de bord
htdocs/.../resources/view/device-intel/devices.js       Tableau des appareils
htdocs/.../resources/view/device-intel/emulators.js     Cartes des emulateurs
htdocs/.../resources/view/device-intel/mesh.js          Pairs du maillage
htdocs/.../resources/view/device-intel/settings.js      Formulaire de parametres
```

## Dependances

- `luci-base`
- `secubox-app-device-intel`
