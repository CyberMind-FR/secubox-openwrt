[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox HAProxy App

Proxy inverse HAProxy avec gestion automatique des certificats SSL/TLS via ACME (Let's Encrypt).

## Fonctionnalites

- **Isolation conteneur LXC** - HAProxy s'execute dans un conteneur isole
- **HTTPS automatique** - Emission et renouvellement de certificats ACME
- **Certificats sans interruption** - Le mode webroot garde HAProxy en fonctionnement pendant l'emission
- **Hotes virtuels** - Plusieurs domaines avec routage automatique
- **Equilibrage de charge** - Round-robin, least connections, IP source
- **Health Checks** - Surveillance automatique de la sante des backends
- **Tableau de bord Stats** - Statistiques en temps reel sur le port 8404

## Gestion des certificats

### Mode Webroot ACME (sans interruption)

HAProxy gere les challenges ACME en interne - pas de redemarrage requis :

```
Internet -> Port 80 -> HAProxy
                        |
                        +- /.well-known/acme-challenge/
                        |        |
                        |   backend acme_challenge (:8402)
                        |        |
                        |   busybox httpd sert les fichiers de challenge
                        |
                        +- Autres chemins -> backends normaux
```

### Demander un certificat

```bash
# Certificat de production (approuve par les navigateurs)
haproxyctl cert add example.com

# Certificat de staging (pour les tests, non approuve)
uci set haproxy.acme.staging='1'
uci commit haproxy
haproxyctl cert add example.com
```

### Pre-requis pour ACME

1. **DNS** - Le domaine doit pointer vers l'IP publique de votre serveur
2. **Port 80** - Doit etre accessible depuis internet (firewall/NAT)
3. **Email** - Configurer dans LuCI > Services > HAProxy > Parametres

### Commandes de certificat

```bash
haproxyctl cert list              # Lister les certificats installes
haproxyctl cert add <domain>      # Demander un nouveau certificat
haproxyctl cert renew [domain]    # Renouveler le(s) certificat(s)
haproxyctl cert remove <domain>   # Supprimer un certificat
haproxyctl cert import <domain>   # Importer un certificat existant
```

## Configuration

### Options UCI

```bash
# Parametres principaux
uci set haproxy.main.enabled='1'
uci set haproxy.main.http_port='80'
uci set haproxy.main.https_port='443'
uci set haproxy.main.stats_port='8404'

# Parametres ACME
uci set haproxy.acme.email='admin@example.com'
uci set haproxy.acme.staging='0'        # 0=production, 1=staging
uci set haproxy.acme.key_type='ec-256'  # ec-256, ec-384, rsa-2048, rsa-4096

uci commit haproxy
```

### Creer un hote virtuel

```bash
# Via CLI
haproxyctl vhost add example.com mybackend --ssl --acme

# Via UCI
uci set haproxy.example=vhost
uci set haproxy.example.domain='example.com'
uci set haproxy.example.backend='mybackend'
uci set haproxy.example.ssl='1'
uci set haproxy.example.ssl_redirect='1'
uci set haproxy.example.acme='1'
uci set haproxy.example.enabled='1'
uci commit haproxy
haproxyctl generate && haproxyctl reload
```

### Creer un backend

```bash
# Via CLI
haproxyctl backend add myapp --server 192.168.1.100:8080

# Via UCI
uci set haproxy.myapp=backend
uci set haproxy.myapp.name='myapp'
uci set haproxy.myapp.mode='http'
uci set haproxy.myapp.balance='roundrobin'
uci set haproxy.myapp.enabled='1'

uci set haproxy.myapp_srv1=server
uci set haproxy.myapp_srv1.backend='myapp'
uci set haproxy.myapp_srv1.address='192.168.1.100'
uci set haproxy.myapp_srv1.port='8080'
uci set haproxy.myapp_srv1.check='1'
uci commit haproxy
```

## Reference CLI

```bash
haproxyctl status          # Afficher le statut
haproxyctl start           # Demarrer HAProxy
haproxyctl stop            # Arreter HAProxy
haproxyctl restart         # Redemarrer HAProxy
haproxyctl reload          # Recharger la configuration
haproxyctl generate        # Regenerer le fichier de config
haproxyctl validate        # Valider la configuration

haproxyctl vhost list      # Lister les hotes virtuels
haproxyctl backend list    # Lister les backends
haproxyctl cert list       # Lister les certificats
haproxyctl stats           # Afficher les statistiques d'execution
```

## Depannage

### Echec de l'emission du certificat

1. **Verifier la resolution DNS :**
   ```bash
   nslookup example.com
   ```

2. **Verifier que le port 80 est accessible :**
   ```bash
   # Depuis un serveur externe
   curl -I http://example.com/.well-known/acme-challenge/test
   ```

3. **Verifier que HAProxy est en cours d'execution :**
   ```bash
   haproxyctl status
   ```

4. **Examiner les logs :**
   ```bash
   logread | grep -i acme
   logread | grep -i haproxy
   ```

### HAProxy ne demarre pas

1. **Valider la configuration :**
   ```bash
   haproxyctl validate
   ```

2. **Verifier les fichiers de certificat :**
   ```bash
   ls -la /srv/haproxy/certs/
   ```

3. **Examiner les logs du conteneur :**
   ```bash
   lxc-attach -n haproxy -- cat /var/log/haproxy.log
   ```

## Emplacements des fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/haproxy` | Configuration UCI |
| `/srv/haproxy/config/haproxy.cfg` | Config HAProxy generee |
| `/srv/haproxy/certs/` | Certificats SSL |
| `/etc/acme/` | Donnees de compte et certificats ACME |
| `/var/www/acme-challenge/` | Webroot des challenges ACME |
| `/srv/lxc/haproxy/` | Rootfs du conteneur LXC |

## Licence

Licence MIT - Copyright (C) 2025 CyberMind.fr
