# LuCI Media Flow - Detection et surveillance du streaming

[English](README.md) | Francais | [中文](README.zh.md)

**Version :** 0.4.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

Detection et surveillance en temps reel des services de streaming avec estimation de qualite et alertes configurables.

## Fonctionnalites

### Detection des services de streaming

Detection et surveillance automatiques :

**Streaming video :**
- Netflix, YouTube, Disney+, Prime Video, Twitch
- HBO, Hulu, Vimeo

**Streaming audio :**
- Spotify, Apple Music, Deezer
- SoundCloud, Tidal, Pandora

**Visioconference :**
- Zoom, Microsoft Teams, Google Meet
- Discord, Skype, WebEx

### Estimation de qualite

Estime la qualite du streaming basee sur la consommation de bande passante :
- **SD** (Definition standard) : < 1 Mbps
- **HD** (Haute definition) : 1-3 Mbps
- **FHD** (Full HD 1080p) : 3-8 Mbps
- **4K** (Ultra HD) : > 8 Mbps

### Surveillance en temps reel

- Tableau de bord des flux actifs avec mises a jour en direct
- Consommation de bande passante par flux
- Suivi des IP clients
- Categorisation des services (video/audio/visio)

### Donnees historiques

- Historique des sessions avec horodatages
- Statistiques d'utilisation par service
- Statistiques d'utilisation par client
- Periode de retention configurable

### Alertes

Configurer des alertes basees sur :
- Seuils d'utilisation specifiques aux services
- Limites quotidiennes/hebdomadaires
- Actions automatiques (notifier, limiter, bloquer)

## Dependances

- **netifyd** : Moteur de Deep Packet Inspection pour la detection d'applications
- **luci-app-netifyd-dashboard** : Integration Netifyd pour OpenWrt
- **jq** : Traitement JSON (pour les donnees historiques)

## Installation

```bash
opkg update
opkg install luci-app-media-flow
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Configuration

### Configuration UCI

Fichier : `/etc/config/media_flow`

```
config global 'global'
    option enabled '1'
    option history_retention '7'    # Jours de conservation de l'historique
    option refresh_interval '5'     # Secondes entre les mises a jour

config alert 'netflix_limit'
    option service 'Netflix'
    option threshold_hours '4'      # Heures par jour
    option action 'notify'          # notify|limit|block
    option enabled '1'
```

### Ajouter des alertes

Via LuCI :
1. Naviguer vers Monitoring -> Media Flow -> Alertes
2. Cliquer sur "Ajouter"
3. Configurer le nom du service, le seuil et l'action
4. Sauvegarder et appliquer

Via CLI :
```bash
uci set media_flow.youtube_alert=alert
uci set media_flow.youtube_alert.service='YouTube'
uci set media_flow.youtube_alert.threshold_hours='3'
uci set media_flow.youtube_alert.action='notify'
uci set media_flow.youtube_alert.enabled='1'
uci commit media_flow
```

## API ubus

### Methodes

```bash
# Obtenir le statut du module
ubus call luci.media-flow status

# Obtenir les sessions de streaming actives
ubus call luci.media-flow get_active_streams

# Obtenir les donnees historiques (24 dernieres heures)
ubus call luci.media-flow get_stream_history '{"hours": 24}'

# Obtenir les statistiques par service
ubus call luci.media-flow get_stats_by_service

# Obtenir les statistiques par client
ubus call luci.media-flow get_stats_by_client

# Obtenir les details pour un service specifique
ubus call luci.media-flow get_service_details '{"service": "Netflix"}'

# Definir une alerte
ubus call luci.media-flow set_alert '{"service": "Netflix", "threshold_hours": 4, "action": "notify"}'

# Lister les alertes configurees
ubus call luci.media-flow list_alerts
```

## Stockage des donnees

### Fichier historique
- Emplacement : `/tmp/media-flow-history.json`
- Format : Tableau JSON d'entrees de session
- Retention : 1000 dernieres entrees
- Rotation automatique

### Cache des statistiques
- Emplacement : `/tmp/media-flow-stats/`
- Statistiques agregees par service/client
- Mise a jour a chaque intervalle de rafraichissement

## Comment ca fonctionne

1. **Detection** : S'integre avec le moteur DPI netifyd pour detecter les protocoles d'application
2. **Classification** : Fait correspondre les applications detectees aux patterns des services de streaming
3. **Estimation de qualite** : Analyse la consommation de bande passante pour estimer la qualite du flux
4. **Enregistrement** : Sauvegarde les donnees de session dans l'historique pour analyse
5. **Alertes** : Surveille l'utilisation par rapport aux seuils configures

## Vues du tableau de bord

### Tableau de bord principal
- Statut de streaming actuel
- Flux actifs avec indicateurs de qualite
- Top des services par utilisation
- Rafraichissement automatique toutes les 5 secondes

### Vue services
- Statistiques detaillees par service
- Sessions totales, duree, bande passante
- Modal de details du service

### Vue clients
- Statistiques d'utilisation par IP client
- Top service par client
- Consommation totale

### Vue historique
- Liste chronologique des sessions
- Filtrer par periode
- Indicateurs de qualite et duree

### Vue alertes
- Configurer les alertes basees sur les services
- Definir les seuils et actions
- Activer/desactiver les alertes

## Depannage

### Aucun flux detecte

1. Verifier que netifyd fonctionne :
   ```bash
   /etc/init.d/netifyd status
   ```

2. Verifier la configuration netifyd :
   ```bash
   uci show netifyd
   ```

3. Verifier les flux netifyd :
   ```bash
   ubus call luci.netifyd-dashboard get_flows
   ```

### Estimation de qualite imprecise

L'estimation de qualite est basee sur la bande passante instantanee et peut ne pas refleter la qualite reelle du flux. Facteurs :
- Streaming adaptatif
- Congestion reseau
- Flux concurrents multiples

### Historique non sauvegarde

1. Verifier les permissions :
   ```bash
   ls -la /tmp/media-flow-history.json
   ```

2. Verifier la disponibilite de jq :
   ```bash
   which jq
   opkg install jq
   ```

## Performance

- **Utilisation CPU** : Minimale (parsing uniquement, netifyd fait le DPI)
- **Memoire** : ~2-5 MB pour le stockage de l'historique
- **Disque** : Aucun (tmpfs)
- **Reseau** : Pas de surcharge supplementaire

## Confidentialite

- Toutes les donnees stockees localement sur l'appareil
- Pas de telemetrie ou rapports externes
- L'historique peut etre desactive ou purge a tout moment

## Licence

Apache-2.0

## Auteur

CyberMind.fr
