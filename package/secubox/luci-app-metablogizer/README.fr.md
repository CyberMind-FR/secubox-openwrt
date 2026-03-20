# MetaBlogizer - Editeur de sites statiques

[English](README.md) | Francais | [中文](README.zh.md)

Hebergement de sites web statiques en un clic avec vhosts HAProxy automatiques, certificats SSL et synchronisation Gitea.

## Fonctionnalites

| Fonctionnalite | Description |
|----------------|-------------|
| **Auto Vhost** | Cree le vhost HAProxy + backend automatiquement |
| **ACME SSL** | Certificats Let's Encrypt automatiques |
| **Sync Gitea** | Pull depuis les depots Gitea |
| **Upload fichiers** | Glisser-deposer des fichiers |
| **Statut sante** | Surveillance DNS, certificat et publication |
| **QR Codes** | Partager des sites avec des QR codes |

## Demarrage rapide

### Creer un site via LuCI

1. Aller dans **Services -> MetaBlogizer**
2. Cliquer sur **+ Nouveau site**
3. Remplir :
   - **Nom du site** : `myblog`
   - **Domaine** : `blog.example.com`
   - **Depot Gitea** : `user/repo` (optionnel)
4. Cliquer sur **Creer**

### Ce qui se passe automatiquement

```
+-----------------------------------------------------+
|  Creer le site "myblog" @ blog.example.com          |
+-----------------------------------------------------+
|  1. Creer /srv/metablogizer/sites/myblog/           |
|  2. Creer le backend HAProxy (metablog_myblog)      |
|  3. Creer le vhost HAProxy (blog.example.com)       |
|  4. Demander le certificat ACME                     |
|  5. Generer index.html par defaut                   |
|  6. Site en ligne a https://blog.example.com        |
+-----------------------------------------------------+
```

## Tableau de bord

### Panneau de statut d'hebergement Web

Le tableau de bord montre la sante en temps reel pour tous les sites :

| Site | Domaine | DNS | IP resolue | Certificat | Statut |
|------|---------|-----|------------|------------|--------|
| myblog | blog.example.com | ok | 185.220.x.x | 45j | publie |
| docs | docs.example.com | echec | - | manquant | en attente |

### Indicateurs de statut

| Icone | Statut DNS | Signification |
|-------|------------|---------------|
| ok | DNS resout vers votre IP publique |
| prive | DNS pointe vers une IP privee (192.168.x.x) |
| discordance | DNS pointe vers une IP publique differente |
| echec | Echec de la resolution DNS |

| Icone | Statut certificat | Signification |
|-------|-------------------|---------------|
| ok | Certificat valide (30+ jours) |
| avertissement | Certificat expirant (7-30 jours) |
| critique | Certificat critique (<7 jours) |
| expire | Certificat expire |
| manquant | Pas de certificat |

| Icone | Statut publication | Signification |
|-------|---------------------|---------------|
| publie | Site active avec contenu |
| en attente | Site active, pas encore de contenu |
| brouillon | Site desactive |

## Gestion des fichiers

### Uploader des fichiers

1. Cliquer sur **Upload** sur une carte de site
2. Glisser-deposer des fichiers ou cliquer pour parcourir
3. Cocher "Definir le premier HTML comme page d'accueil" pour utiliser comme index.html
4. Cliquer sur **Upload**

### Gerer les fichiers

1. Cliquer sur **Fichiers** sur une carte de site
2. Voir tous les fichiers uploades
3. Definir n'importe quel fichier HTML comme page d'accueil
4. Supprimer des fichiers

## Synchronisation Gitea

### Configuration

1. Creer/editer un site
2. Entrer le depot Gitea : `username/repo`
3. Cliquer sur **Sync** pour pull le dernier contenu

### Auto-Sync

Le site se synchronise depuis Gitea sur :
- Clic du bouton sync manuel
- Push webhook (si configure)

```bash
# Sync manuelle via CLI
ubus call luci.metablogizer sync_site '{"id":"site_myblog"}'
```

## Partage et QR

Cliquer sur **Partager** sur n'importe quel site pour obtenir :
- Copier l'URL dans le presse-papiers
- QR code pour acces mobile
- Partage Twitter
- Partage LinkedIn
- Partage Facebook
- Partage Telegram
- Partage WhatsApp
- Partage Email

## Configuration

### Parametres UCI

```bash
# /etc/config/metablogizer

config metablogizer 'main'
    option enabled '1'
    option runtime 'auto'           # auto | uhttpd | nginx
    option sites_root '/srv/metablogizer/sites'
    option nginx_container 'nginx'
    option gitea_url 'http://192.168.255.1:3000'

config site 'site_myblog'
    option name 'myblog'
    option domain 'blog.example.com'
    option gitea_repo 'user/myblog'
    option ssl '1'
    option enabled '1'
    option description 'Mon blog personnel'
    option port '8901'
    option runtime 'uhttpd'
```

### Modes d'execution

| Mode | Description | Cas d'utilisation |
|------|-------------|-------------------|
| **uhttpd** | Serveur web integre d'OpenWrt | Par defaut, leger |
| **nginx** | Nginx dans conteneur LXC | Fonctionnalites avancees |
| **auto** | Detection automatique du runtime disponible | Recommande |

## API RPCD

### Gestion des sites

```bash
# Lister tous les sites
ubus call luci.metablogizer list_sites

# Creer un site
ubus call luci.metablogizer create_site '{
  "name": "myblog",
  "domain": "blog.example.com",
  "gitea_repo": "user/myblog",
  "ssl": "1",
  "description": "Mon blog"
}'

# Sync depuis Gitea
ubus call luci.metablogizer sync_site '{"id":"site_myblog"}'

# Supprimer un site
ubus call luci.metablogizer delete_site '{"id":"site_myblog"}'
```

### Surveillance de sante

```bash
# Obtenir le statut d'hebergement pour tous les sites
ubus call luci.metablogizer get_hosting_status

# Reponse :
{
  "success": true,
  "public_ip": "185.220.101.12",
  "haproxy_status": "running",
  "sites": [{
    "id": "site_myblog",
    "name": "myblog",
    "domain": "blog.example.com",
    "dns_status": "ok",
    "dns_ip": "185.220.101.12",
    "cert_status": "ok",
    "cert_days": 45,
    "publish_status": "published"
  }]
}

# Verifier la sante d'un site
ubus call luci.metablogizer check_site_health '{"id":"site_myblog"}'
```

### Operations sur les fichiers

```bash
# Lister les fichiers d'un site
ubus call luci.metablogizer list_files '{"id":"site_myblog"}'

# Uploader un fichier (contenu base64)
ubus call luci.metablogizer upload_file '{
  "id": "site_myblog",
  "filename": "style.css",
  "content": "Ym9keSB7IGJhY2tncm91bmQ6ICNmZmY7IH0="
}'
```

## Emplacements des fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/metablogizer` | Configuration UCI |
| `/srv/metablogizer/sites/` | Repertoires de contenu des sites |
| `/srv/metablogizer/sites/<nom>/index.html` | Page d'accueil du site |
| `/usr/libexec/rpcd/luci.metablogizer` | Backend RPCD |

## Depannage

### Le site affiche 503

1. Verifier que HAProxy fonctionne : `lxc-info -n haproxy`
2. Verifier que le port du backend ecoute
3. Verifier l'instance uhttpd : `uci show uhttpd | grep metablog`

### DNS ne resout pas

1. Verifier que l'enregistrement A pointe vers votre IP publique
2. Verifier avec : `nslookup blog.example.com`
3. Attendre la propagation DNS (jusqu'a 48h)

### Certificat manquant

1. S'assurer que le DNS resout correctement d'abord
2. S'assurer que les ports 80/443 sont accessibles depuis Internet
3. Verifier les logs ACME : `logread | grep acme`

### Echec de la sync Gitea

1. Verifier l'URL Gitea : `uci get metablogizer.main.gitea_url`
2. Verifier que le depot existe et est public
3. Tester manuellement : `git clone http://192.168.255.1:3000/user/repo.git`

## Licence

MIT License - Copyright (C) 2025 CyberMind.fr
