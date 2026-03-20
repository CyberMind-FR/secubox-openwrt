# VHost Manager - Gestion du Proxy Inverse et des Certificats SSL

**Version :** 2.0.0
**Derniere mise a jour :** 2026-01-01
**Statut :** Actif

Application LuCI pour la gestion des hotes virtuels nginx en proxy inverse et des certificats SSL via Let's Encrypt, avec des modeles de services integres et une gestion des redirections.

## Fonctionnalites

### Catalogue de Services Internes (v2.0+)
- **Modeles de Services Preconfigures** - 19 services internes prets a deployer
- **Activation en Un Clic** - Deployer des services avec SSL, authentification et WebSocket optimaux
- **Statut en Temps Reel** - Tableau de bord avec rafraichissement automatique affichant les services actifs/configures
- **Detection Intelligente des Fonctionnalites** - Configuration automatique SSL, authentification et WebSocket
- **Organisation par Categories** - Services groupes par type (IoT, Media, Securite, Productivite, etc.)
- **Rafraichissement Automatique** - Mises a jour en direct toutes les 10 secondes
- **Interface Grille Moderne** - Disposition responsive basee sur des cartes avec badges de fonctionnalites

### Gestion des Regles de Redirection (v2.0+)
- **Modeles de Redirection Preconstruits** - 6 motifs de redirection courants (cache CDN, redirections de confidentialite, basculement)
- **Codes de Redirection HTTP** - Support pour 301 (permanent), 302 (temporaire), 307 (temporaire, conservation de methode)
- **Activation de Modeles** - Deploiement en un clic des regles de redirection
- **Tableau de Bord des Redirections Actives** - Statut en temps reel des redirections configurees
- **Organisation par Categories** - Modeles groupes par cas d'utilisation (Productivite, Media, Securite, Reseau)
- **Rafraichissement Automatique** - Mises a jour en direct toutes les 10 secondes

### Gestion des Hotes Virtuels (v1.0+)
- Creer et gerer les configurations de proxy inverse nginx
- Support des hotes virtuels HTTP et HTTPS
- Test de connectivite backend avant deploiement
- Support du protocole WebSocket
- Authentification HTTP Basic
- Rechargement automatique de nginx lors des changements de configuration
- **Bouton Activer/Desactiver** - Controle rapide du service sans suppression
- **Bouton Supprimer** - Suppression propre du VHost avec confirmation

### Gestion des Certificats SSL (v1.0+)
- Provisionnement de certificats Let's Encrypt via acme.sh
- Surveillance du statut des certificats avec suivi d'expiration
- Avertissements d'expiration codes par couleur (rouge < 7 jours, orange < 30 jours)
- Visionneur de details des certificats
- Support du renouvellement automatique des certificats

### Surveillance des Logs d'Acces (v1.0+)
- Visionneur de logs d'acces nginx en temps reel
- Filtrage des logs par domaine
- Affichage configurable du nombre de lignes (50-500 lignes)
- Affichage des logs style terminal

### Systeme d'Activation de Profils (v2.0+)
- **Deploiement Base sur Modeles** - Creer des VHosts a partir de modeles preconfigures
- **Configuration Intelligente des Fonctionnalites** - Configuration automatique SSL/Auth/WebSocket selon les besoins du service
- **Notes de Modele** - Informations contextuelles affichees lors de l'activation
- **Modals de Confirmation** - Revision des parametres avant deploiement
- **Activer/Desactiver** - Gestion facile des modeles avec retour visuel

## Installation

```bash
opkg update
opkg install luci-app-vhost-manager
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Dependances

- **luci-base** : Framework LuCI
- **rpcd** : Daemon RPC pour la communication backend
- **nginx-ssl** : Serveur web Nginx avec support SSL
- **acme** : Client ACME pour les certificats Let's Encrypt
- **curl** : Client HTTP pour les tests backend

## Configuration

### Configuration UCI (`/etc/config/vhosts`)

Les hotes virtuels resident maintenant dans `/etc/config/vhosts`, permettant aux autres composants SecuBox d'installer des proxys de maniere declarative. Un fichier par defaut est depose lors de l'installation ; editez-le comme n'importe quelle autre config UCI :

```bash
config global 'global'
	option enabled '1'
	option auto_reload '1'

config vhost 'myapp'
	option domain 'app.example.com'
	option upstream 'http://127.0.0.1:8080'
	option tls 'acme'          # off|acme|manual
	option cert_path '/etc/custom/fullchain.pem'   # utilise quand tls=manual
	option key_path '/etc/custom/privkey.pem'
	option auth '1'
	option auth_user 'admin'
	option auth_pass 'secretpassword'
	option websocket '1'
	option enabled '1'
```

> Les installations legacy peuvent encore livrer `/etc/config/vhost_manager` pour la retrocompatibilite, mais le backend RPC genere desormais `/etc/nginx/conf.d/*.conf` exclusivement depuis `/etc/config/vhosts`.

### Options

#### Section Globale
- `enabled` : Activer/desactiver VHost Manager (defaut : 1)
- `auto_reload` : Recharger automatiquement nginx lors des changements de config (defaut : 1)
- `log_retention` : Jours de retention des logs d'acces (defaut : 30)

#### Section VHost
- `domain` : Nom de domaine pour cet hote virtuel (requis)
- `upstream` : URL backend vers laquelle proxifier (requis, ex. http://192.168.1.100:8080)
- `tls` : Strategie TLS (`off`, `acme`, ou `manual`)
- `cert_path` / `key_path` : Requis quand `tls=manual` pour pointer vers les fichiers PEM
- `auth` : Activer l'authentification HTTP Basic (defaut : 0)
- `auth_user` / `auth_pass` : Identifiants utilises quand `auth=1`
- `websocket` : Activer les en-tetes WebSocket (defaut : 0)
- `enabled` : Desactiver le vhost sans le supprimer (defaut : 1)

## Utilisation

### Interface Web

Naviguer vers **Services -> VHost Manager** dans LuCI.

#### Onglet Vue d'Ensemble
- Statut systeme (Nginx en cours, disponibilite ACME)
- Statistiques des hotes virtuels (SSL active, auth protege, WebSocket)
- Nombre de certificats et statut d'expiration
- Liste des hotes virtuels recents

#### Onglet Hotes Virtuels
- Ajouter de nouveaux hotes virtuels
- Modifier les configurations existantes
- Tester la connectivite backend avant sauvegarde
- Activer/desactiver SSL, authentification, WebSocket
- Supprimer des hotes virtuels

#### Onglet Certificats
- Demander de nouveaux certificats Let's Encrypt
- Voir les certificats installes avec dates d'expiration
- Visionneur de details des certificats
- Avertissements d'expiration codes par couleur

#### Onglet Logs
- Voir les logs d'acces nginx par domaine
- Selectionner le nombre de lignes a afficher (50-500)
- Streaming de logs en temps reel

#### Onglet Services Internes (v2.0+)

L'onglet Services Internes fournit un catalogue de 19 modeles de services preconfigures pour les applications auto-hebergees populaires.

**Metriques du Tableau de Bord :**
- **Actifs** - Services actuellement actives et en cours d'execution
- **Configures** - Total des services avec entrees VHost
- **Disponibles** - Total des modeles dans le catalogue

**Grille des Services Actifs :**

Chaque service configure affiche :
- Icone et nom du service
- Badge de statut (Actif/Desactive)
- Categorie et description
- Domaine, URL backend et port
- Badges de fonctionnalites (SSL, Auth, WebSocket)
- Trois boutons d'action :
  - **Modifier** - Naviguer vers la configuration VHost
  - **Activer/Desactiver** - Basculer le statut du service
  - **Supprimer** - Supprimer la configuration VHost (avec confirmation)

**Modeles de Services :**

Les modeles sont organises par categorie :

| Categorie | Services |
|-----------|----------|
| **Services de Base** | LuCI UI |
| **Surveillance** | Netdata |
| **Securite** | CrowdSec, Vaultwarden |
| **Reseau** | NoDogSplash, AdGuard Home, Uptime Kuma |
| **IoT & Domotique** | Domoticz, Zigbee2MQTT, Home Assistant, MagicMirror |
| **Media** | Lyrion Music Server, Jellyfin |
| **IA & Machine Learning** | LocalAI |
| **Productivite** | Citadel, ISPConfig, Mail-in-a-Box, Nextcloud, Gitea |
| **Hebergement & Panneaux de Controle** | Portainer |

**Workflow d'Activation de Modele :**

1. Cliquer sur **Activer** sur n'importe quel modele
2. Reviser le modal d'activation affichant :
   - Nom et icone du service
   - Domaine et URL backend
   - Fonctionnalites requises (SSL, Auth, WebSocket)
   - Notes speciales (ex. "Nextcloud gere sa propre authentification")
3. Cliquer sur **Activer** pour creer le VHost
4. Service automatiquement configure avec les parametres optimaux

**Exemple : Activation de Nextcloud**

Configuration du modele :
```
Icone: Nuage
Nom: Nextcloud
Domaine: cloud.local
Backend: http://127.0.0.1:80
Port: 80
Categorie: Productivite
Fonctionnalites:
  - SSL/TLS requis
  - Support WebSocket
Notes: "Nextcloud gere sa propre authentification. Configurez les domaines de confiance dans config.php."
```

Apres activation :
- VHost cree a `cloud.local`
- SSL automatiquement configure (mode ACME)
- En-tetes WebSocket actives
- Backend proxifie vers le port 80
- Service marque comme "Actif" dans le tableau de bord

#### Onglet Redirections (v2.0+)

L'onglet Redirections gere les regles de redirection HTTP nginx avec des modeles preconstruits pour les cas d'utilisation courants.

**Metriques du Tableau de Bord :**
- **Actives** - Regles de redirection actuellement activees
- **Total** - Toutes les redirections configurees
- **Modeles** - Modeles de redirection disponibles

**Grille des Redirections Actives :**

Chaque redirection configuree affiche :
- Icone de redirection
- Nom de domaine
- Badge de statut (Active/Desactivee)
- Domaine source
- URL de destination
- Badge de code HTTP (301, 302, 307)
- Trois boutons d'action :
  - **Modifier** - Naviguer vers la configuration VHost
  - **Activer/Desactiver** - Basculer le statut de la redirection
  - **Supprimer** - Supprimer la regle de redirection (avec confirmation)

**Modeles de Redirection :**

| Modele | Code HTTP | Categorie | Cas d'Utilisation |
|--------|-----------|-----------|-------------------|
| **Nextcloud vers LAN** | 301 | Productivite | Forcer les utilisateurs distants vers Nextcloud heberge en LAN |
| **Cache CDN Steam** | 302 | Media | Rediriger les telechargements vers le cache local |
| **YouTube vers Invidious** | 307 | Media | Redirection YouTube respectueuse de la vie privee |
| **Basculement Mail** | 302 | Productivite | Basculement vers un service mail alternatif |
| **Redirection Bloqueur de Pubs** | 301 | Securite | Rediriger les serveurs publicitaires vers localhost |
| **CDN vers Cache Local** | 302 | Reseau | Cacher les ressources CDN localement |

**Codes de Redirection HTTP :**

- **301 (Permanent)** - Le navigateur met en cache la redirection, utiliser pour les deplacements permanents
- **302 (Temporaire)** - Le navigateur ne met pas en cache, utiliser pour les redirections temporaires
- **307 (Temporaire, Conservation de Methode)** - Comme 302 mais preserve la methode HTTP (POST/GET)

### Ligne de Commande

#### Lister les Hotes Virtuels

```bash
ubus call luci.vhost-manager list_vhosts
```

#### Obtenir le Statut de VHost Manager

```bash
ubus call luci.vhost-manager status
```

#### Ajouter un Hote Virtuel

```bash
ubus call luci.vhost-manager add_vhost '{
  "domain": "app.example.com",
  "backend": "http://192.168.1.100:8080",
  "tls_mode": "acme",
  "auth": true,
  "auth_user": "admin",
  "auth_pass": "secret",
  "websocket": true,
  "enabled": true
}'
```

#### Tester la Connectivite Backend

```bash
ubus call luci.vhost-manager test_backend '{
  "backend": "http://192.168.1.100:8080"
}'
```

#### Demander un Certificat SSL

```bash
ubus call luci.vhost-manager request_cert '{
  "domain": "app.example.com",
  "email": "admin@example.com"
}'
```

#### Lister les Certificats

```bash
ubus call luci.vhost-manager list_certs
```

#### Recharger Nginx

```bash
ubus call luci.vhost-manager reload_nginx
```

#### Obtenir les Logs d'Acces

```bash
ubus call luci.vhost-manager get_access_logs '{
  "domain": "app.example.com",
  "lines": 100
}'
```

## Configuration Nginx

VHost Manager genere les fichiers de configuration nginx dans `/etc/nginx/conf.d/`.

### Exemple de Configuration Generee (HTTP Uniquement)

```nginx
server {
    listen 80;
    server_name app.example.com;

    access_log /var/log/nginx/app.example.com.access.log;
    error_log /var/log/nginx/app.example.com.error.log;

    location / {
        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Exemple de Configuration Generee (HTTPS avec WebSocket)

```nginx
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/acme/app.example.com/fullchain.cer;
    ssl_certificate_key /etc/acme/app.example.com/app.example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log /var/log/nginx/app.example.com.access.log;
    error_log /var/log/nginx/app.example.com.error.log;

    location / {
        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Support WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### Exemple avec Authentification

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/acme/app.example.com/fullchain.cer;
    ssl_certificate_key /etc/acme/app.example.com/app.example.com.key;

    location / {
        auth_basic "Acces Restreint";
        auth_basic_user_file /etc/nginx/htpasswd/app.example.com;

        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Workflow des Certificats SSL

1. **Configuration DNS** : Assurez-vous que votre domaine pointe vers l'IP publique de votre routeur
2. **Transfert de Port** : Transferer les ports 80 et 443 vers votre routeur
3. **Demande de Certificat** : Utiliser l'onglet Certificats pour demander un certificat Let's Encrypt
4. **Configurer VHost** : Activer SSL pour votre hote virtuel
5. **Surveiller l'Expiration** : Les certificats expirent apres 90 jours, surveiller dans l'onglet Certificats

### Emplacements des Certificats ACME

- Certificats : `/etc/acme/{domain}/fullchain.cer`
- Cles privees : `/etc/acme/{domain}/{domain}.key`
- Compte ACME : `/etc/acme/account.conf`

## Reference API ubus

### status()

Obtenir le statut de VHost Manager et nginx.

**Retourne :**
```json
{
  "nginx_running": true,
  "nginx_version": "1.23.3",
  "acme_available": true,
  "acme_version": "3.0.5",
  "vhost_count": 5
}
```

### list_vhosts()

Lister tous les hotes virtuels configures.

**Retourne :**
```json
{
  "vhosts": [
    {
      "domain": "app.example.com",
      "backend": "http://192.168.1.100:8080",
      "upstream": "http://192.168.1.100:8080",
      "tls_mode": "acme",
      "ssl": true,
      "cert_file": "/etc/acme/app.example.com/fullchain.cer",
      "cert_expires": "2025-03-15",
      "auth": true,
      "auth_user": "admin",
      "websocket": true,
      "enabled": true,
      "config_file": "/etc/nginx/conf.d/app.example.com.conf"
    }
  ]
}
```

### get_vhost(domain)

Obtenir les details d'un hote virtuel specifique.

**Parametres :**
- `domain` : Nom de domaine

### add_vhost(payload)

Ajouter un nouvel hote virtuel.

**Parametres :**
- `domain` : Nom de domaine (requis)
- `backend` : URL backend (requis)
- `tls_mode` : `off`, `acme`, ou `manual` (requis)
- `auth` : Activer l'authentification (booleen)
- `auth_user` / `auth_pass` : Identifiants quand auth est active
- `websocket` : Activer WebSocket (booleen)
- `enabled` : Desactiver le vhost sans supprimer (booleen)
- `cert_path` / `key_path` : Requis quand `tls_mode=manual`

### update_vhost(payload)

Mettre a jour un hote virtuel existant.

**Parametres :** Identiques a `add_vhost`. Les champs omis conservent leur valeur precedente.

### delete_vhost(domain)

Supprimer un hote virtuel.

### test_backend(backend)

Tester la connectivite vers un serveur backend.

### request_cert(domain, email)

Demander un certificat SSL Let's Encrypt.

### list_certs()

Lister tous les certificats SSL installes.

### reload_nginx()

Recharger la configuration nginx.

### get_access_logs(domain, lines)

Obtenir les logs d'acces nginx pour un domaine.

## Depannage

### Nginx Ne Demarre Pas

Verifier la syntaxe de configuration nginx :
```bash
nginx -t
```

Voir le log d'erreur nginx :
```bash
logread | grep nginx
```

### La Demande de Certificat Echoue

Verifiez :
1. Le DNS du domaine pointe vers votre IP publique
2. Les ports 80 et 443 sont transferes vers votre routeur
3. Le pare-feu autorise les connexions entrantes sur les ports 80 et 443
4. Aucun autre service n'utilise le port 80 (acme.sh en a besoin pour la validation)

Verifier les logs ACME :
```bash
cat /var/log/acme.log
```

### Backend Injoignable

Tester le backend manuellement :
```bash
curl -I http://192.168.1.100:8080
```

Verifier si le backend ecoute :
```bash
netstat -tuln | grep 8080
```

### WebSocket Ne Fonctionne Pas

Verifiez :
1. Le support WebSocket est active dans la configuration de l'hote virtuel
2. L'application backend supporte WebSocket
3. Les timeouts du proxy ne sont pas trop courts (defaut : 86400s)

### L'Authentification Ne Fonctionne Pas

Verifier que le fichier htpasswd existe :
```bash
ls -l /etc/nginx/.luci-app-vhost-manager_{domain}
```

## Considerations de Securite

1. **Certificats SSL** : Toujours utiliser HTTPS pour les services en production
2. **Mots de Passe Forts** : Utiliser des mots de passe forts pour l'authentification HTTP Basic
3. **Securite Backend** : S'assurer que les services backend ne sont pas directement accessibles depuis Internet
4. **Regles de Pare-feu** : Configurer le pare-feu pour n'autoriser que les ports necessaires
5. **Surveillance des Logs** : Revoir regulierement les logs d'acces pour detecter les activites suspectes
6. **Renouvellement des Certificats** : Surveiller l'expiration des certificats et s'assurer que le renouvellement automatique fonctionne

## Licence

Apache-2.0

## Mainteneur

SecuBox Project <support@secubox.com>

## Version

2.0.0
