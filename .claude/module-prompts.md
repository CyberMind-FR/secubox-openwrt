# 🚀 Prompts d'Implémentation SecuBox

Copie-colle ces prompts dans Claude pour implémenter chaque module.

---

## 📊 1. SecuBox Hub (secubox)

```
Implémente le module central SecuBox Hub qui agrège tous les autres modules.

**Fonctionnalités**:
1. Dashboard avec statut de tous les modules installés
2. Indicateurs de santé système (CPU, RAM, Disk, Network)
3. Actions rapides (redémarrer services, vider cache, backup)
4. Notifications/alertes agrégées
5. Détection automatique des modules installés

**Méthodes RPCD** (script: /usr/libexec/rpcd/secubox):
- status: État du hub
- get_modules: Liste des modules SecuBox installés avec leur statut
- get_system_health: CPU%, RAM%, Disk%, Uptime, Load
- get_alerts: Alertes agrégées de tous les modules
- quick_action: Exécuter une action rapide (restart_rpcd, clear_cache, etc.)
- get_dashboard_data: Toutes les données dashboard en un appel

**Détection des modules**:
Parcourir /usr/libexec/rpcd/ pour trouver les scripts SecuBox:
crowdsec-dashboard, netdata-dashboard, netifyd-dashboard, wireguard-dashboard,
network-modes, client-guardian, system-hub, bandwidth-manager, auth-guardian,
media-flow, vhost-manager, cdn-cache, traffic-shaper

Pour chaque module trouvé, appeler sa méthode "status" via ubus.

**View JS**:
- Grid de cards pour chaque module (icône, nom, statut, lien)
- Section santé système avec gauges
- Liste des alertes récentes
- Boutons actions rapides

Génère tous les fichiers complets: Makefile, RPCD, ACL, Menu, View, UCI config.
```

---

## 🛡️ 2. CrowdSec Dashboard (crowdsec-dashboard)

```
Implémente le dashboard CrowdSec pour la visualisation des menaces.

**Fonctionnalités**:
1. Afficher les décisions actives (bans IP)
2. Afficher les alertes récentes
3. Statistiques de blocage (par pays, par scénario)
4. Gestion des bouncers
5. Ajouter/supprimer manuellement des décisions
6. Configuration de l'agent CrowdSec

**Méthodes RPCD** (script: /usr/libexec/rpcd/crowdsec-dashboard):
- status: État de CrowdSec et du bouncer
- get_decisions: Liste des décisions actives (cscli decisions list -o json)
- get_alerts: Alertes récentes (cscli alerts list -o json)
- get_bouncers: Liste des bouncers (cscli bouncers list -o json)
- get_metrics: Métriques Prometheus de CrowdSec
- add_decision: Ajouter un ban (cscli decisions add -i IP -d DURATION)
- delete_decision: Supprimer un ban (cscli decisions delete -i IP)
- get_scenarios: Scénarios actifs

**Parsing**:
- Utiliser cscli avec -o json pour avoir du JSON
- Parser les métriques Prometheus pour les stats

**View JS**:
- Tableau des décisions avec actions (delete)
- Carte du monde avec IPs bloquées (optionnel)
- Graphique temporel des alertes
- Formulaire pour ajouter une décision manuelle
- Liste des scénarios actifs

Génère tous les fichiers complets.
```

---

## 📈 3. Netdata Dashboard (netdata-dashboard)

```
Implémente l'intégration du dashboard Netdata.

**Fonctionnalités**:
1. Iframe intégré du dashboard Netdata local
2. Contrôle du service (start/stop/restart)
3. Configuration basique (port, retention)
4. Alertes Netdata récentes
5. Métriques clés en preview

**Méthodes RPCD** (script: /usr/libexec/rpcd/netdata-dashboard):
- status: État du service Netdata, port, version
- get_config: Configuration actuelle
- set_config: Modifier la configuration
- restart: Redémarrer le service
- get_alarms: Alertes actives (via API Netdata /api/v1/alarms)
- get_info: Infos système (via API Netdata /api/v1/info)

**Configuration UCI** (/etc/config/netdata_dashboard):
config global
    option enabled '1'
    option port '19999'
    option bind '127.0.0.1'

**View JS**:
- Iframe pleine largeur vers http://127.0.0.1:19999
- Panneau de contrôle du service
- Indicateurs d'alertes
- Configuration port/bind

Génère tous les fichiers complets.
```

---

## 🔍 4. Netifyd Dashboard (netifyd-dashboard)

```
Implémente le dashboard DPI Netifyd.

**Fonctionnalités**:
1. Flux réseau en temps réel
2. Applications détectées (Netflix, YouTube, etc.)
3. Protocoles utilisés
4. Statistiques par client
5. Historique des connexions

**Méthodes RPCD** (script: /usr/libexec/rpcd/netifyd-dashboard):
- status: État du service netifyd
- get_flows: Flux actifs (parser /var/run/netifyd/status.json ou socket)
- get_applications: Applications détectées avec bande passante
- get_protocols: Protocoles détectés
- get_hosts: Liste des hosts avec leurs apps
- get_stats: Statistiques globales

**Parsing netifyd**:
Le fichier status peut être à /var/run/netifyd/status.json
Ou via socket: echo "status" | nc -U /var/run/netifyd/netifyd.sock

**View JS**:
- Tableau des flux en temps réel (polling 5s)
- Graphique donut par application
- Liste des clients avec leur trafic
- Filtres par app/protocole/client

Génère tous les fichiers complets.
```

---

## 🔐 5. WireGuard Dashboard (wireguard-dashboard)

```
Implémente le gestionnaire WireGuard avec QR codes.

**Fonctionnalités**:
1. Liste des interfaces WireGuard
2. Liste des peers avec statut (online/offline, last handshake)
3. Ajouter/modifier/supprimer des peers
4. Générer QR code pour configuration client
5. Statistiques de transfert
6. Export de configuration

**Méthodes RPCD** (script: /usr/libexec/rpcd/wireguard-dashboard):
- status: État global WireGuard
- list_interfaces: Toutes les interfaces wg (wg show interfaces)
- get_interface: Détails d'une interface (wg show wg0 dump)
- list_peers: Peers d'une interface avec stats
- add_peer: Ajouter un peer (générer clés, configurer UCI)
- delete_peer: Supprimer un peer
- generate_config: Générer config client (.conf)
- generate_qr: Générer QR code PNG (base64) avec qrencode

**Génération de peer**:
1. wg genkey | tee privatekey | wg pubkey > publickey
2. Allouer une IP dans le range
3. Créer section UCI
4. Générer config client avec endpoint, clés, allowed IPs

**QR Code**:
qrencode -t PNG -o - "config_content" | base64

**View JS**:
- Liste des interfaces avec toggle
- Tableau des peers avec statut temps réel
- Modal création peer avec formulaire
- Affichage QR code dans modal
- Bouton télécharger .conf
- Stats transfert (rx/tx) par peer

Génère tous les fichiers complets.
```

---

## 🔄 6. Network Modes (network-modes)

```
Implémente le switcher de mode réseau.

**Modes supportés**:
1. Router (défaut) - NAT, DHCP server, firewall
2. Access Point - Bridge, pas de NAT
3. Repeater - Client WiFi + AP
4. Bridge - Pur bridge L2

**Méthodes RPCD** (script: /usr/libexec/rpcd/network-modes):
- status: Mode actuel et état
- get_current_mode: Détails du mode actif
- get_available_modes: Liste des modes avec description
- set_mode: Changer de mode (reconfigure network/wireless/firewall)
- preview_changes: Prévisualiser les changements avant application
- apply_mode: Appliquer la configuration
- rollback: Revenir au mode précédent (si échec)

**Logique par mode**:
Router: wan=dhcp, lan=static+dhcp_server, firewall zones
AP: br-lan bridge wan+lan, pas de dhcp, pas de firewall
Repeater: sta0 client, ap0 répéteur, relay
Bridge: tout en bridge, dhcp client

**Sécurité**:
- Backup config avant changement
- Timer de rollback automatique (2 min) si pas de confirmation
- Confirmation via nouvelle IP

**View JS**:
- Cards pour chaque mode (icône, description)
- Mode actuel surligné
- Bouton "Switch to..." avec confirmation
- Progress bar pendant application
- Instructions post-switch

Génère tous les fichiers complets.
```

---

## 👥 7. Client Guardian (client-guardian)

```
Implémente le contrôle d'accès réseau avec portail captif.

**Fonctionnalités**:
1. Liste des clients connectés (MAC, IP, hostname)
2. Autoriser/bloquer des clients
3. Sessions actives du portail captif
4. Politiques d'accès par défaut
5. Intégration nodogsplash
6. Temps de session configurable

**Méthodes RPCD** (script: /usr/libexec/rpcd/client-guardian):
- status: État du service
- list_clients: Tous les clients DHCP/ARP avec statut auth
- get_client: Détails d'un client (MAC)
- authorize_client: Autoriser via ndsctl (ndsctl auth MAC)
- deauthorize_client: Révoquer (ndsctl deauth MAC)
- block_client: Bloquer définitivement (firewall)
- unblock_client: Débloquer
- list_sessions: Sessions captive portal actives
- get_policy: Politique par défaut
- set_policy: Définir politique (open/captive/whitelist)

**Sources de données**:
- /tmp/dhcp.leases pour DHCP
- ip neigh pour ARP
- ndsctl status pour sessions nodogsplash
- iptables/nftables pour blocks

**View JS**:
- Tableau des clients avec badges (authorized/blocked/pending)
- Actions inline (authorize/block)
- Filtres par statut
- Compteur de sessions actives
- Configuration politique

Génère tous les fichiers complets.
```

---

## ⚙️ 8. System Hub (system-hub)

```
Implémente le centre de contrôle système.

**Fonctionnalités**:
1. Informations système (hostname, version, uptime, etc.)
2. Santé système (CPU, RAM, disk, température)
3. Gestion des services (start/stop/restart/enable)
4. Logs système filtrés
5. Backup/restore configuration
6. Reboot/shutdown

**Méthodes RPCD** (script: /usr/libexec/rpcd/system-hub):
- status: Vue d'ensemble système
- get_system_info: Hostname, model, version OpenWrt, kernel
- get_health: CPU%, RAM%, Disk%, Temp, Load
- list_services: Services avec statut (enabled/running)
- service_action: start/stop/restart/enable/disable un service
- get_logs: Dernières lignes de logread avec filtre
- backup_config: Créer backup sysupgrade (base64)
- restore_config: Restaurer backup
- reboot: Redémarrer le routeur
- get_storage: Espace disque par mount point

**Données système**:
- /proc/cpuinfo, /proc/meminfo, /proc/loadavg
- df -h pour disk
- cat /sys/class/thermal/thermal_zone*/temp pour temp
- /etc/init.d/* pour services

**View JS**:
- Dashboard avec gauges (CPU, RAM, Disk)
- Info système en cards
- Tableau des services avec actions
- Console de logs avec filtre
- Boutons backup/restore/reboot

Génère tous les fichiers complets.
```

---

## 📶 9. Bandwidth Manager (bandwidth-manager)

```
Implémente la gestion de bande passante et QoS.

**Fonctionnalités**:
1. Règles QoS par application/port/IP
2. Quotas mensuels par client (MAC)
3. Scheduling (horaires de limitation)
4. Stats de consommation temps réel
5. Alertes de dépassement
6. Intégration SQM/CAKE

**Méthodes RPCD** (script: /usr/libexec/rpcd/bandwidth-manager):
- status: État QoS et stats globales
- list_rules: Règles QoS actives
- add_rule: Ajouter règle (type, target, limit_down, limit_up, priority)
- delete_rule: Supprimer règle
- list_quotas: Quotas par MAC
- get_quota: Quota + usage d'un client
- set_quota: Créer/modifier quota
- reset_quota: Reset compteur
- get_usage_realtime: Usage temps réel par client
- get_usage_history: Historique de consommation

**Tracking usage**:
iptables avec compteurs par MAC dans chain dédiée
ou nftables avec sets/maps

**Configuration UCI**:
config rule 'rule1'
    option name 'Limit YouTube'
    option type 'application'
    option target 'youtube'
    option limit_down '5000'
    option limit_up '1000'
    option priority 'low'

config quota 'quota1'
    option mac 'AA:BB:CC:DD:EE:FF'
    option name 'iPhone Jean'
    option limit_mb '10240'
    option action 'throttle'
    option reset_day '1'

**View JS**:
- Tableau des règles avec CRUD
- Tableau des quotas avec barres de progression
- Graphique usage temps réel
- Configuration SQM intégrée

Génère tous les fichiers complets.
```

---

## 🔑 10. Auth Guardian (auth-guardian)

```
Implémente l'authentification OAuth et système de vouchers.

**Fonctionnalités**:
1. OAuth2 avec Google, GitHub, Microsoft
2. Système de vouchers (codes d'accès temporaires)
3. Portail captif personnalisable
4. Gestion des sessions authentifiées
5. Logs d'authentification

**Méthodes RPCD** (script: /usr/libexec/rpcd/auth-guardian):
- status: État du système d'auth
- list_providers: Providers OAuth configurés
- set_provider: Configurer un provider (client_id, secret, etc.)
- delete_provider: Supprimer un provider
- list_vouchers: Tous les vouchers
- create_voucher: Créer voucher (durée, data_limit, note)
- delete_voucher: Supprimer voucher
- validate_voucher: Vérifier un code voucher
- list_sessions: Sessions auth actives
- revoke_session: Révoquer une session
- get_logs: Logs d'authentification

**OAuth Flow**:
1. Redirect vers provider avec callback URL
2. CGI script reçoit le token
3. Valide avec API provider
4. Si OK, autorise le MAC via nodogsplash

**Vouchers**:
config voucher 'v_abc123'
    option code 'ABC-123-XYZ'
    option duration_hours '24'
    option data_limit_mb '1000'
    option created '2024-01-15T10:00:00Z'
    option used '0'
    option note 'Visiteur Jean'

**View JS**:
- Onglets: OAuth | Vouchers | Sessions | Logs
- Config providers OAuth avec test
- Générateur de vouchers avec QR code
- Tableau des sessions actives
- Timeline des authentifications

Génère tous les fichiers complets.
```

---

## 📺 11. Media Flow (media-flow)

```
Implémente la détection et monitoring des services de streaming.

**Services détectés**:
- Video: Netflix, YouTube, Disney+, Prime Video, Twitch
- Audio: Spotify, Apple Music, Deezer
- Visio: Zoom, Teams, Meet, Discord

**Fonctionnalités**:
1. Flux streaming actifs en temps réel
2. Historique des sessions
3. Stats par service et par client
4. Qualité estimée (SD/HD/4K)
5. Alertes configurables

**Méthodes RPCD** (script: /usr/libexec/rpcd/media-flow):
- status: Vue d'ensemble
- get_active_streams: Streams en cours (via netifyd)
- get_stream_history: Dernières 24h
- get_stats_by_service: Agrégé par service
- get_stats_by_client: Agrégé par client
- get_service_details: Détails d'un service
- set_alert: Configurer alerte (ex: si Netflix > 2h)
- list_alerts: Alertes configurées

**Parsing netifyd**:
Identifier les applications streaming dans les flux netifyd:
- detected_application contient le nom
- Calculer la bande passante pour estimer la qualité

**View JS**:
- Dashboard temps réel avec icônes services
- Graphique donut répartition par service
- Timeline des sessions du jour
- Top clients par consommation
- Configuration alertes

Génère tous les fichiers complets.
```

---

## 🌐 12. VHost Manager (vhost-manager)

```
Implémente le gestionnaire de reverse proxy et SSL.

**Fonctionnalités**:
1. Créer des vhosts nginx
2. Certificats SSL via Let's Encrypt (ACME)
3. Authentification basique optionnelle
4. Support WebSocket
5. Test de connectivité backend

**Méthodes RPCD** (script: /usr/libexec/rpcd/vhost-manager):
- status: État nginx et stats
- list_vhosts: Tous les vhosts configurés
- get_vhost: Détails d'un vhost
- add_vhost: Créer vhost (domain, backend, ssl, auth)
- update_vhost: Modifier vhost
- delete_vhost: Supprimer vhost
- test_backend: Tester connectivité backend
- request_cert: Demander certificat Let's Encrypt
- list_certs: Certificats avec dates expiration
- reload_nginx: Recharger configuration

**Génération nginx** (/etc/nginx/conf.d/{domain}.conf):
server {
    listen 80;
    server_name example.com;
    location / {
        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

**ACME**:
Utiliser acme.sh ou uacme pour les certificats

**View JS**:
- Tableau des vhosts avec status (up/down/ssl)
- Modal création/édition vhost
- Indicateur expiration SSL
- Bouton test backend
- Logs d'accès récents

Génère tous les fichiers complets.
```

---

## 💾 13. CDN Cache (cdn-cache)

```
Implémente le cache local de contenu.

**Fonctionnalités**:
1. Cache nginx pour contenu statique
2. Stats de cache (hit/miss ratio)
3. Règles de cache par domaine/type
4. Purge manuelle
5. Limite de taille configurable

**Méthodes RPCD** (script: /usr/libexec/rpcd/cdn-cache):
- status: État du cache, taille utilisée
- get_stats: Hit ratio, requêtes, économies bande passante
- list_rules: Règles de cache
- add_rule: Ajouter règle (domain pattern, ttl, types)
- delete_rule: Supprimer règle
- get_cached_objects: Liste objets en cache
- purge_cache: Vider le cache (tout ou pattern)
- set_limits: Configurer limites (max_size, inactive)

**Configuration nginx**:
proxy_cache_path /tmp/nginx-cache levels=1:2 keys_zone=cdn:10m max_size=1g;

**View JS**:
- Dashboard avec stats (hit ratio gauge, taille)
- Tableau des règles de cache
- Liste des domaines cachés
- Bouton purge avec confirmation
- Configuration taille max

Génère tous les fichiers complets.
```

---

## 🚦 14. Traffic Shaper (traffic-shaper)

```
Implémente le contrôle de trafic avancé.

**Fonctionnalités**:
1. Classes de trafic avec priorités
2. Règles de classification (port, IP, DSCP)
3. Limites par classe
4. Stats temps réel par classe
5. Presets (Gaming, Streaming, Work from Home)

**Méthodes RPCD** (script: /usr/libexec/rpcd/traffic-shaper):
- status: État global TC
- list_classes: Classes de trafic
- add_class: Créer classe (name, priority, rate, ceil)
- update_class: Modifier classe
- delete_class: Supprimer classe
- list_rules: Règles de classification
- add_rule: Ajouter règle (match, class)
- delete_rule: Supprimer règle
- get_stats: Stats par classe (packets, bytes, drops)
- apply_preset: Appliquer un preset
- list_presets: Presets disponibles

**TC/CAKE**:
Utiliser tc avec qdisc CAKE ou HTB
tc qdisc add dev eth0 root cake bandwidth 100mbit

**View JS**:
- Diagramme des classes avec flux
- Tableau CRUD classes
- Tableau CRUD règles
- Stats temps réel par classe
- Boutons presets rapides

Génère tous les fichiers complets.
```

---

## 🔄 Prompt de Continuation

Après avoir généré un module, utilise ce prompt pour continuer :

```
Le module {MODULE} est généré. Maintenant:

1. Vérifie la cohérence entre tous les fichiers
2. Assure-toi que toutes les méthodes RPCD sont dans l'ACL
3. Vérifie que les appels RPC dans le JS correspondent aux méthodes RPCD
4. Génère un script de test pour valider le module
5. Liste les dépendances système à installer
```

---

## ✅ Prompt de Validation Finale

```
Pour le module {MODULE}, fais une revue complète:

1. **Makefile**: PKG_NAME, LUCI_DEPENDS corrects?
2. **RPCD**: Toutes les méthodes ont json_dump? Erreurs gérées?
3. **ACL**: Toutes les méthodes listées? Read/write séparés?
4. **Menu**: Chemin view correct? ACL référencé?
5. **View**: RPC declares matchent RPCD? Gestion erreurs?
6. **Config UCI**: Structure valide? Valeurs par défaut?

Corrige les problèmes trouvés et génère les fichiers finaux.
```
