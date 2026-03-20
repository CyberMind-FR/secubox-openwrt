[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# mitmproxy - Proxy d'Interception HTTPS

Proxy HTTPS interactif pour le debogage, les tests et l'analyse de securite avec support du mode transparent et inspection du trafic via interface web.

## Fonctionnalites

| Fonctionnalite | Description |
|----------------|-------------|
| **Inspection du Trafic** | Voir et analyser les requetes HTTP/HTTPS en temps reel |
| **Interface Web** | Interface mitmweb integree avec token d'authentification automatique |
| **Mode Transparent** | Intercepter le trafic automatiquement via nftables |
| **Detection de Menaces** | Detecter les injections SQL, XSS, injections de commandes, Log4Shell |
| **Integration HAProxy** | Inspecter tous les backends vhost avec detection de menaces |
| **Certificat CA** | Generer et gerer les certificats d'interception SSL |
| **Logging CrowdSec** | Journaliser les menaces vers CrowdSec pour blocage automatique |
| **Filtrage** | Filtrer et suivre CDN, media, publicites et trackers |
| **Liste Blanche** | Contourner l'interception pour des IPs/domaines specifiques |

## Demarrage Rapide

### Modes Proxy

| Mode | Description | Cas d'Utilisation |
|------|-------------|-------------------|
| **Regular** | Configurer les clients manuellement | Tester des apps specifiques |
| **Transparent** | Interception auto via pare-feu | Inspection reseau globale |
| **Upstream** | Transmettre a un autre proxy | Chainage de proxies |
| **Reverse** | Mode reverse proxy | Analyse de backends |

### Activer le Mode Transparent

1. Aller dans **Securite -> mitmproxy -> Parametres**
2. Definir **Mode Proxy** sur `Transparent`
3. Activer **Pare-feu Transparent**
4. Cliquer **Sauvegarder & Appliquer**

### Installer le Certificat CA

Pour l'interception HTTPS, installer le CA mitmproxy sur les peripheriques clients :

1. Configurer le peripherique pour utiliser le proxy (ou utiliser le mode transparent)
2. Naviguer vers `http://mitm.it` depuis le peripherique
3. Telecharger et installer le certificat pour votre OS
4. Faire confiance au certificat dans les parametres systeme

## Tableau de Bord

```
+--------------------------------------------------------------+
|  mitmproxy                                     En cours       |
+--------------------------------------------------------------+
|                                                              |
|  +------------+  +------------+  +------------+  +--------+  |
|  | 12.5K      |  | 245        |  | 45 Mo      |  | 8080   |  |
|  | Requetes   |  | Hotes      |  | Flux       |  | Port   |  |
|  +------------+  +------------+  +------------+  +--------+  |
|                                                              |
|  Top Hotes                        Certificat CA              |
|  +------------------------------+ +-------------------------+|
|  | api.example.com       1,234  | | mitmproxy CA            ||
|  | cdn.cloudflare.com      890  | | Certificat installe     ||
|  | www.google.com          567  | | Expire: 2026-01-28      ||
|  | analytics.google.com    432  | | [Telecharger]           ||
|  +------------------------------+ +-------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

## Capture de Requetes

### Visualiseur de Requetes en Direct

L'onglet Requetes affiche le trafic HTTP capture en temps reel :

```
+--------------------------------------------------------------+
|  Requetes Capturees                             Pause         |
+--------------------------------------------------------------+
|                                                              |
|  [GET]  api.example.com/users         200  application/json  |
|  [POST] auth.example.com/login        201  application/json  |
|  [GET]  cdn.cloudflare.com/script.js  200  text/javascript   |
|  [GET]  www.google.com/search         200  text/html         |
|  [PUT]  api.example.com/user/123      204  -                 |
|                                                              |
+--------------------------------------------------------------+
```

### Voir les Details d'une Requete

Cliquer sur n'importe quelle requete pour voir :
- En-tetes de requete complets
- En-tetes de reponse
- Cookies
- Corps de requete/reponse (si capture)

## Mode Transparent

### Architecture

```
  Peripherique Client              Routeur SecuBox
+----------------+               +------------------------+
|                |               |                        |
|  Navigateur    |<-- HTTP/S -->|  nftables REDIRECT     |
|                |               |         |              |
+----------------+               |         v              |
                                 |  +------------------+  |
                                 |  |    mitmproxy     |  |
                                 |  |   (port 8080)    |  |
                                 |  +--------+---------+  |
                                 |           |            |
                                 |           v            |
                                 |     Internet           |
                                 +------------------------+
```

### Configuration Pare-feu

Quand le mode transparent est active, mitmproxy cree automatiquement les regles nftables :

```bash
# Redirection HTTP (port 80 -> 8080)
nft add rule inet fw4 prerouting tcp dport 80 redirect to :8080

# Redirection HTTPS (port 443 -> 8080)
nft add rule inet fw4 prerouting tcp dport 443 redirect to :8080
```

## Inspection Backend HAProxy

Router tout le trafic vhost HAProxy via mitmproxy pour la detection de menaces.

### Architecture

```
Internet -> HAProxy (terminaison SSL) -> mitmproxy :8890 -> Backends Reels
                                              |
                                        Detection Menaces
                                              |
                                        Logging CrowdSec
```

### Activer l'Inspection HAProxy

```bash
# Via CLI
mitmproxyctl haproxy-enable

# Ce que ca fait :
# 1. Synchronise les backends HAProxy vers les routes mitmproxy
# 2. Met a jour tous les vhosts pour router via mitmproxy
# 3. Redemarre les deux services
```

### Desactiver l'Inspection HAProxy

```bash
# Restaurer les backends originaux
mitmproxyctl haproxy-disable
```

### Synchronisation Manuelle des Routes

```bash
# Synchroniser les routes depuis HAProxy UCI sans activer l'inspection
mitmproxyctl sync-routes
```

### Commandes HAProxy Inspector

| Commande | Description |
|----------|-------------|
| `mitmproxyctl haproxy-enable` | Activer l'inspection des backends |
| `mitmproxyctl haproxy-disable` | Restaurer les backends originaux |
| `mitmproxyctl sync-routes` | Synchroniser les routes depuis HAProxy UCI |

## Detection de Menaces

L'addon analytics detecte plus de 90 patterns d'attaque incluant :

| Categorie | Exemples |
|-----------|----------|
| **Injection SQL** | UNION SELECT, OR 1=1, time-based blind |
| **XSS** | balises script, gestionnaires d'evenements, javascript: |
| **Injection de Commandes** | commandes shell, injection pipe |
| **Traversee de Chemin** | ../../../etc/passwd |
| **SSRF** | acces IP interne, endpoints metadata |
| **Log4Shell** | ${jndi:ldap://...} |
| **Scanners Admin** | /wp-admin, /phpmyadmin, /.env |

### Voir les Menaces

Les menaces sont affichees dans le tableau de bord LuCI avec :
- Niveau de severite (critique/haute/moyenne/basse)
- Type de pattern d'attaque
- IP source et pays
- Chemin de requete et methode

### Integration CrowdSec

Les menaces detectees sont journalisees dans `/var/log/crowdsec/mitmproxy-threats.log` pour :
- Blocage automatique des IP via le bouncer CrowdSec
- Partage de renseignements sur les menaces
- Analytique de securite

## Configuration

### Parametres UCI

```bash
# /etc/config/mitmproxy

config mitmproxy 'main'
    option enabled '1'
    option mode 'transparent'        # regular | transparent | upstream | reverse
    option proxy_port '8080'
    option web_host '0.0.0.0'
    option web_port '8081'
    option data_path '/srv/mitmproxy'
    option memory_limit '256M'
    option ssl_insecure '0'          # Accepter les certs upstream invalides
    option anticache '0'             # Supprimer les en-tetes cache
    option anticomp '0'              # Desactiver la compression
    option flow_detail '1'           # Niveau de detail des logs (0-4)

config transparent 'transparent'
    option enabled '1'
    option interface 'br-lan'
    option redirect_http '1'
    option redirect_https '1'
    option http_port '80'
    option https_port '443'

config whitelist 'whitelist'
    option enabled '1'
    list bypass_ip '192.168.255.0/24'
    list bypass_domain 'banking.com'

config filtering 'filtering'
    option enabled '1'
    option log_requests '1'
    option filter_cdn '0'
    option filter_media '0'
    option block_ads '0'
    option addon_script '/data/addons/secubox_analytics.py'

config haproxy_router 'haproxy_router'
    option enabled '0'
    option listen_port '8889'
    option threat_detection '1'
    option routes_file '/srv/mitmproxy/haproxy-routes.json'

config capture 'capture'
    option save_flows '0'
    option capture_request_headers '1'
    option capture_response_headers '1'
    option capture_request_body '0'
    option capture_response_body '0'
```

## API RPCD

### Controle du Service

| Methode | Description |
|---------|-------------|
| `status` | Obtenir le statut du service (inclut le token auth) |
| `start` | Demarrer mitmproxy |
| `stop` | Arreter mitmproxy |
| `restart` | Redemarrer le service |
| `install` | Installer le conteneur mitmproxy |

### Configuration

| Methode | Description |
|---------|-------------|
| `settings` | Obtenir tous les parametres |
| `save_settings` | Sauvegarder la configuration |
| `set_mode` | Definir le mode proxy |

### Detection de Menaces

| Methode | Description |
|---------|-------------|
| `alerts` | Obtenir les menaces detectees |
| `threat_stats` | Obtenir les statistiques de menaces |
| `clear_alerts` | Effacer toutes les alertes |

### Integration HAProxy

| Methode | Description |
|---------|-------------|
| `haproxy_enable` | Activer l'inspection des backends |
| `haproxy_disable` | Restaurer les backends originaux |
| `sync_routes` | Synchroniser les routes depuis HAProxy |

### Pare-feu

| Methode | Description |
|---------|-------------|
| `setup_firewall` | Configurer les regles du mode transparent |
| `clear_firewall` | Supprimer les regles pare-feu |

### Exemple d'Utilisation

```bash
# Obtenir le statut (inclut le token auth pour l'interface Web)
ubus call luci.mitmproxy status

# Reponse :
{
  "enabled": true,
  "running": true,
  "installed": true,
  "web_port": 8081,
  "proxy_port": 8888,
  "mode": "regular",
  "token": "abc123xyz...",
  "haproxy_router_enabled": false,
  "haproxy_listen_port": 8889
}

# Obtenir les menaces detectees
ubus call luci.mitmproxy alerts

# Reponse :
{
  "success": true,
  "alerts": [
    {
      "time": "2026-01-31T12:00:00",
      "severity": "high",
      "pattern": "sql_injection",
      "method": "GET",
      "path": "/api?id=1' OR 1=1--",
      "ip": "192.168.1.100"
    }
  ]
}

# Activer l'inspection backend HAProxy
ubus call luci.mitmproxy haproxy_enable

# Reponse :
{
  "success": true,
  "message": "Inspection backend HAProxy activee"
}
```

## Acces Interface Web

L'interface mitmweb necessite une authentification via token.

### Auto-Auth via LuCI

Le tableau de bord LuCI affiche le lien Web UI avec le token inclus :
```
http://192.168.255.1:8081/?token=abc123xyz
```

### Acces Manuel au Token

```bash
# Le token est stocke dans le repertoire de donnees
cat /srv/mitmproxy/.mitmproxy_token

# Ou via RPCD
ubus call luci.mitmproxy status | jsonfilter -e '@.token'
```

## Certificat CA

### Generer un Nouveau Certificat

```bash
# Le certificat est auto-genere au premier demarrage
# Situe dans : /srv/mitmproxy/mitmproxy-ca-cert.pem
```

### Telecharger le Certificat

1. Acceder a l'interface mitmweb (utiliser le token du tableau de bord LuCI)
2. Ou naviguer vers `http://mitm.it` depuis un peripherique proxifie
3. Telecharger le certificat pour votre plateforme

### Emplacements des Certificats

| Chemin | Description |
|--------|-------------|
| `/srv/mitmproxy/certs/mitmproxy-ca.pem` | Cle privee CA + certificat |
| `/srv/mitmproxy/certs/mitmproxy-ca-cert.pem` | Certificat CA uniquement |
| `/srv/mitmproxy/certs/mitmproxy-ca-cert.cer` | Certificat (format DER) |

## Filtrage & Analytique

### Suivi CDN

Suivre le trafic vers les principaux fournisseurs CDN :
- Cloudflare
- Akamai
- Fastly
- AWS CloudFront
- Google Cloud CDN

### Suivi Streaming Media

Suivre les services de streaming :
- YouTube
- Netflix
- Spotify
- Twitch
- Amazon Prime Video

### Blocage de Publicites

Bloquer les domaines de publicite et de tracking connus avec l'addon de filtrage integre.

## Emplacements des Fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/mitmproxy` | Configuration UCI |
| `/srv/mitmproxy/` | Repertoire de donnees |
| `/srv/mitmproxy/certs/` | Certificats CA |
| `/srv/mitmproxy/flows/` | Fichiers de flux captures |
| `/var/lib/lxc/mitmproxy/` | Racine conteneur LXC |
| `/usr/libexec/rpcd/luci.mitmproxy` | Backend RPCD |

## Depannage

### Le Service Ne Demarre Pas

```bash
# Verifier le statut du conteneur
lxc-info -n mitmproxy

# Verifier les logs
logread | grep mitmproxy

# Verifier si Docker est disponible
docker ps
```

### Pas de Trafic Capture

1. **Mode regular** : Verifier que les parametres proxy du client pointent vers `192.168.255.1:8080`
2. **Mode transparent** : Verifier les regles pare-feu avec `nft list ruleset | grep redirect`
3. Verifier que mitmproxy ecoute : `netstat -tln | grep 8080`

### L'Interception HTTPS Ne Fonctionne Pas

1. Installer le certificat CA sur le peripherique client
2. Faire confiance au certificat dans les parametres systeme
3. Certaines apps utilisent le certificate pinning et ne peuvent pas etre interceptees

### Interface Web Inaccessible

```bash
# Verifier que le port web ecoute
netstat -tln | grep 8081

# Verifier depuis le routeur
curl -I http://127.0.0.1:8081

# Verifier que le pare-feu autorise l'acces
uci show firewall | grep mitmproxy
```

### Problemes de Memoire

```bash
# Augmenter la limite memoire
uci set mitmproxy.main.memory_limit='512M'
uci commit mitmproxy
/etc/init.d/mitmproxy restart
```

## Notes de Securite

1. **Outil Sensible** - mitmproxy peut intercepter tout le trafic reseau incluant les mots de passe. Utiliser de maniere responsable.
2. **Certificat CA** - Proteger la cle privee CA. Toute personne y ayant acces peut intercepter le trafic.
3. **Liste Blanche Banques** - Ajouter les sites bancaires et financiers a la liste de contournement.
4. **Desactiver Quand Non Utilise** - Desactiver le mode transparent quand vous ne debuguez pas activement.
5. **Piste d'Audit** - Toutes les requetes capturees peuvent contenir des donnees sensibles.

## Licence

MIT License - Copyright (C) 2025-2026 CyberMind.fr
