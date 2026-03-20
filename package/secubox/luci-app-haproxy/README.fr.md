[English](README.md) | Francais | [中文](README.zh.md)

# HAProxy Manager - Tableau de bord de proxy inverse

Gestion de proxy inverse de niveau entreprise avec certificats SSL automatiques, configuration de vhosts et surveillance de la sante des backends.

## Fonctionnalites

| Fonctionnalite | Description |
|----------------|-------------|
| **Gestion des Vhosts** | Creer et gerer les hotes virtuels |
| **ACME SSL** | Certificats Let's Encrypt automatiques |
| **Equilibrage de charge** | Round-robin, least-conn, source |
| **Health Checks** | Surveillance des serveurs backend |
| **Statistiques** | Tableau de bord de trafic en temps reel |
| **Generateur de config** | Generation automatique de config HAProxy |
| **Conteneur LXC** | Fonctionne isole dans un conteneur |

## Demarrage rapide

### Creer un Vhost

1. Allez dans **Services -> HAProxy -> Vhosts**
2. Cliquez sur **+ Ajouter Vhost**
3. Remplissez :
   - **Domaine** : `app.example.com`
   - **Backend** : Selectionnez ou creez
   - **SSL** : Activer
   - **ACME** : Certificat automatique
4. Cliquez sur **Enregistrer et appliquer**

### Architecture

```
                    +-------------------------------------+
   Internet         |         Conteneur HAProxy          |
       |            |  +-----------------------------+   |
       v            |  |      Frontend               |   |
  +---------+       |  |  :80 -> redirection :443   |   |
  | Port 80 |------>|  |  :443 -> terminaison SSL   |   |
  |Port 443 |       |  +-------------+---------------+   |
  +---------+       |                |                   |
                    |                v                   |
                    |  +-----------------------------+   |
                    |  |      Backends               |   |
                    |  |  app.example.com ->:8080    |   |
                    |  |  api.example.com ->:3000    |   |
                    |  |  blog.example.com->:4000    |   |
                    |  +-----------------------------+   |
                    +-------------------------------------+
```

## Tableau de bord

```
+------------------------------------------------------+
|  HAProxy                              En cours       |
+------------------------------------------------------+
|                                                      |
|  Statistiques                                        |
|  +- Vhosts : 5 actifs                               |
|  +- Backends : 8 configures                         |
|  +- Certificats : 5 valides                         |
|  +- Requetes : 12.5K/min                            |
|                                                      |
|  Sante des backends                                  |
|  +------------+--------+--------+---------+          |
|  | Backend    | Statut | Server | Latence |          |
|  +------------+--------+--------+---------+          |
|  | webapp     | OK     | 2/2    | 12ms    |          |
|  | api        | OK     | 1/1    | 8ms     |          |
|  | blog       | DEGRAD | 1/2    | 45ms    |          |
|  +------------+--------+--------+---------+          |
|                                                      |
+------------------------------------------------------+
```

## Configuration des Vhosts

### Creer un Vhost

```bash
ubus call luci.haproxy create_vhost '{
  "domain": "app.example.com",
  "backend": "webapp",
  "ssl": 1,
  "ssl_redirect": 1,
  "acme": 1,
  "enabled": 1
}'
```

### Options de Vhost

| Option | Defaut | Description |
|--------|--------|-------------|
| `domain` | - | Nom de domaine (requis) |
| `backend` | - | Nom du backend vers lequel router |
| `ssl` | 1 | Activer SSL/TLS |
| `ssl_redirect` | 1 | Rediriger HTTP vers HTTPS |
| `acme` | 1 | Demander auto certificat Let's Encrypt |
| `enabled` | 1 | Vhost actif |

### Lister les Vhosts

```bash
ubus call luci.haproxy list_vhosts

# Reponse :
{
  "vhosts": [{
    "id": "app_example_com",
    "domain": "app.example.com",
    "backend": "webapp",
    "ssl": true,
    "ssl_redirect": true,
    "acme": true,
    "enabled": true,
    "cert_status": "valid",
    "cert_expiry": "2025-03-15"
  }]
}
```

## Configuration des backends

### Creer un backend

```bash
ubus call luci.haproxy create_backend '{
  "name": "webapp",
  "mode": "http",
  "balance": "roundrobin"
}'
```

### Ajouter un serveur au backend

```bash
ubus call luci.haproxy create_server '{
  "backend": "webapp",
  "name": "srv1",
  "address": "192.168.255.10",
  "port": 8080,
  "weight": 100,
  "check": 1
}'
```

### Modes de backend

| Mode | Description |
|------|-------------|
| `http` | Proxy HTTP couche 7 |
| `tcp` | Proxy TCP couche 4 |

### Equilibrage de charge

| Algorithme | Description |
|------------|-------------|
| `roundrobin` | Alterner entre les serveurs |
| `leastconn` | Moins de connexions actives |
| `source` | Sticky par IP client |
| `uri` | Sticky par hash URI |

## Certificats SSL

### Certificats automatiques ACME

Quand `acme: 1` est defini :
1. HAProxy sert le challenge ACME sur le port 80
2. Let's Encrypt valide la propriete du domaine
3. Certificat stocke dans `/srv/haproxy/certs/`
4. Renouvellement automatique avant expiration

### Certificat manuel

```bash
# Uploader un certificat
ubus call luci.haproxy upload_certificate '{
  "domain": "app.example.com",
  "cert": "<certificat PEM>",
  "key": "<cle privee PEM>"
}'
```

### Statut des certificats

```bash
ubus call luci.haproxy list_certificates

# Reponse :
{
  "certificates": [{
    "domain": "app.example.com",
    "status": "valid",
    "issuer": "Let's Encrypt",
    "expiry": "2025-03-15",
    "days_left": 45
  }]
}
```

### Demander un certificat manuellement

```bash
ubus call luci.haproxy request_certificate '{"domain":"app.example.com"}'
```

## Statistiques

### Obtenir les stats

```bash
ubus call luci.haproxy get_stats

# Reponse :
{
  "frontend": {
    "requests": 125000,
    "bytes_in": 1234567890,
    "bytes_out": 9876543210,
    "rate": 150
  },
  "backends": [{
    "name": "webapp",
    "status": "UP",
    "servers_up": 2,
    "servers_total": 2,
    "requests": 45000,
    "response_time_avg": 12
  }]
}
```

### Page de stats

Accedez aux stats HAProxy a :
```
http://192.168.255.1:8404/stats
```

## Configuration

### Structure UCI

```bash
# /etc/config/haproxy

config haproxy 'main'
    option enabled '1'
    option stats_port '8404'

config backend 'webapp'
    option name 'webapp'
    option mode 'http'
    option balance 'roundrobin'
    option enabled '1'

config server 'webapp_srv1'
    option backend 'webapp'
    option name 'srv1'
    option address '192.168.255.10'
    option port '8080'
    option weight '100'
    option check '1'
    option enabled '1'

config vhost 'app_example_com'
    option domain 'app.example.com'
    option backend 'webapp'
    option ssl '1'
    option ssl_redirect '1'
    option acme '1'
    option enabled '1'
```

### Generer la config

```bash
# Regenerer haproxy.cfg depuis UCI
ubus call luci.haproxy generate

# Recharger HAProxy
ubus call luci.haproxy reload
```

### Valider la config

```bash
ubus call luci.haproxy validate

# Reponse :
{
  "valid": true,
  "message": "La configuration est valide"
}
```

## API RPCD

### Controle du service

| Methode | Description |
|---------|-------------|
| `status` | Obtenir le statut HAProxy |
| `start` | Demarrer le service HAProxy |
| `stop` | Arreter le service HAProxy |
| `restart` | Redemarrer HAProxy |
| `reload` | Recharger la configuration |
| `generate` | Generer le fichier de config |
| `validate` | Valider la configuration |

### Gestion des Vhosts

| Methode | Description |
|---------|-------------|
| `list_vhosts` | Lister tous les vhosts |
| `create_vhost` | Creer un nouveau vhost |
| `update_vhost` | Mettre a jour un vhost |
| `delete_vhost` | Supprimer un vhost |

### Gestion des backends

| Methode | Description |
|---------|-------------|
| `list_backends` | Lister tous les backends |
| `create_backend` | Creer un backend |
| `delete_backend` | Supprimer un backend |
| `create_server` | Ajouter un serveur au backend |
| `delete_server` | Supprimer un serveur |

### Certificats

| Methode | Description |
|---------|-------------|
| `list_certificates` | Lister tous les certificats |
| `request_certificate` | Demander un certificat ACME |
| `upload_certificate` | Uploader un certificat manuel |
| `delete_certificate` | Supprimer un certificat |

## Emplacements des fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/haproxy` | Configuration UCI |
| `/var/lib/lxc/haproxy/` | Racine du conteneur LXC |
| `/srv/haproxy/haproxy.cfg` | Config generee |
| `/srv/haproxy/certs/` | Certificats SSL |
| `/srv/haproxy/acme/` | Challenges ACME |
| `/usr/libexec/rpcd/luci.haproxy` | Backend RPCD |
| `/usr/sbin/haproxyctl` | Outil CLI |

## Outil CLI

### Commandes haproxyctl

```bash
# Statut
haproxyctl status

# Lister les vhosts
haproxyctl vhosts

# Ajouter un vhost
haproxyctl vhost add app.example.com --backend webapp --ssl --acme

# Supprimer un vhost
haproxyctl vhost del app.example.com

# Lister les certificats
haproxyctl cert list

# Demander un certificat
haproxyctl cert add app.example.com

# Generer la config
haproxyctl generate

# Recharger
haproxyctl reload

# Valider
haproxyctl validate
```

## Depannage

### HAProxy ne demarre pas

```bash
# Verifier le conteneur
lxc-info -n haproxy

# Demarrer le conteneur
lxc-start -n haproxy

# Verifier les logs
lxc-attach -n haproxy -- cat /var/log/haproxy.log
```

### 503 Service indisponible

1. Verifier que le backend est configure :
   ```bash
   ubus call luci.haproxy list_backends
   ```
2. Verifier que le serveur est joignable :
   ```bash
   curl http://192.168.255.10:8080
   ```
3. Verifier les logs HAProxy

### Certificat ne fonctionne pas

1. Assurez-vous que le DNS pointe vers votre IP publique
2. Assurez-vous que les ports 80/443 sont accessibles depuis internet
3. Verifiez le challenge ACME :
   ```bash
   curl http://app.example.com/.well-known/acme-challenge/test
   ```

### Echec de validation de la config

```bash
# Afficher les erreurs de validation
lxc-attach -n haproxy -- haproxy -c -f /etc/haproxy/haproxy.cfg
```

## Securite

### Regles de pare-feu

HAProxy a besoin des ports 80/443 ouverts depuis le WAN :

```bash
# Crees automatiquement quand le vhost utilise SSL
uci show firewall | grep HAProxy
```

### Limitation de debit

Ajouter a la config du backend :
```
stick-table type ip size 100k expire 30s store http_req_rate(10s)
http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }
```

## Licence

Licence MIT - Copyright (C) 2025 CyberMind.fr
