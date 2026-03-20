# Hexo CMS - Plateforme de publication de blogs

[English](README.md) | Francais | [中文](README.zh.md)

Gestion de blog Hexo complete avec support multi-instances, integration Gitea, publication HAProxy et services caches Tor.

## Fonctionnalites

| Fonctionnalite | Description |
|----------------|-------------|
| **Editeur d'articles** | Creer, editer, publier des articles avec markdown |
| **Categories/Tags** | Organiser le contenu hierarchiquement |
| **Bibliotheque media** | Gerer les images et ressources |
| **Config theme** | Editer les parametres du theme Hexo |
| **Deploiement en un clic** | Generer et deployer d'un seul clic |
| **Integration HAProxy** | Publication automatique sur le clearnet avec SSL |
| **Services caches Tor** | Publier sur des adresses .onion |
| **Sync Gitea** | Push/pull depuis les depots Git |
| **Profils de publication** | Presets de l'assistant pour les configurations courantes |
| **Surveillance sante** | Statut du pipeline et diagnostics |

## Assistant de demarrage rapide

### Profils de publication

Choisissez un preset pour configurer votre blog :

| Profil | Icone | HAProxy | Tor | Cas d'utilisation |
|--------|-------|---------|-----|-------------------|
| **Blog** | - | SSL | Non | Blog public avec domaine personnalise |
| **Portfolio** | - | SSL | Non | Vitrine creative |
| **Privacy** | - | Non | Oui | Blog .onion anonyme |
| **Dual** | - | Oui | Oui | Acces clearnet + Tor |
| **Documentation** | - | SSL | Non | Site de docs techniques |

### Appliquer un profil

```bash
# Via LuCI : Services -> Hexo CMS -> Profils -> Appliquer

# Via CLI
ubus call luci.hexojs apply_profile '{
  "instance": "default",
  "profile": "blog",
  "domain": "blog.example.com"
}'
```

## Tableau de bord

```
+------------------------------------------------------+
|  Hexo CMS                                 En cours   |
+------------------------------------------------------+
|                                                      |
|  Statistiques du site                                |
|  +-- Articles : 134                                  |
|  +-- Categories : 12                                 |
|  +-- Tags : 45                                       |
|  +-- Medias : 89 fichiers                            |
|                                                      |
|  Points d'acces                                      |
|  +-- Local : http://192.168.255.1:4000               |
|  +-- Clearnet : https://blog.example.com             |
|  +-- Tor : http://abc123xyz.onion                    |
|                                                      |
|  Sante du pipeline : 95/100                          |
|  +-- Serveur Hexo : En cours                         |
|  +-- HAProxy : Publie                                |
|  +-- Certificat : Valide (45 jours)                  |
|  +-- Gitea : Synchronise                             |
|                                                      |
+------------------------------------------------------+
```

## Gestion du contenu

### Creer un article

1. Aller dans **Services -> Hexo CMS -> Articles**
2. Cliquer sur **+ Nouvel article**
3. Remplir :
   - **Titre** : Mon premier article
   - **Categorie** : tech/tutoriels
   - **Tags** : hexo, blog
   - **Contenu** : Votre markdown ici
4. Cliquer sur **Sauvegarder brouillon** ou **Publier**

### Front Matter des articles

```yaml
---
title: Mon premier article
date: 2025-01-28 10:30:00
categories:
  - tech
  - tutoriels
tags:
  - hexo
  - blog
---

Votre contenu ici...
```

### Lister les articles via CLI

```bash
ubus call luci.hexojs list_posts '{"instance":"default","limit":10}'
```

## Pipeline de publication

### Flux de publication complet

```
+-----------+    +-----------+    +-----------+    +-----------+
|  Editer   | -> | Generer   | -> | Deployer  | -> |  En       |
|  Articles |    |   HTML    |    | HAProxy   |    |  ligne    |
+-----------+    +-----------+    |   Tor     |    +-----------+
                                  +-----------+
```

### Commandes

```bash
# Generer les fichiers statiques
ubus call luci.hexojs generate '{"instance":"default"}'

# Deployer sur HAProxy (clearnet)
ubus call luci.hexojs publish_to_haproxy '{
  "instance": "default",
  "domain": "blog.example.com"
}'

# Deployer sur Tor (.onion)
ubus call luci.hexojs publish_to_tor '{"instance":"default"}'

# Pipeline complet (generer + deployer tout)
ubus call luci.hexojs full_publish '{
  "instance": "default",
  "domain": "blog.example.com",
  "tor": true
}'
```

## Integration HAProxy

### Publier sur le clearnet

1. Aller dans **Hexo CMS -> Publication**
2. Entrer le domaine : `blog.example.com`
3. Cocher **Activer SSL**
4. Cliquer sur **Publier sur HAProxy**

### Ce qui se passe

1. Cree le backend HAProxy -> `hexo_default`
2. Cree le serveur HAProxy -> `127.0.0.1:4000`
3. Cree le vhost -> `blog.example.com`
4. Demande le certificat ACME
5. Recharge HAProxy

### Verifier le statut HAProxy

```bash
ubus call luci.hexojs get_haproxy_status '{"instance":"default"}'

# Reponse :
{
  "published": true,
  "domain": "blog.example.com",
  "ssl": true,
  "cert_status": "valid",
  "cert_days": 45,
  "dns_status": "ok"
}
```

## Services caches Tor

### Creer un site .onion

```bash
ubus call luci.hexojs publish_to_tor '{"instance":"default"}'
```

### Obtenir l'adresse Onion

```bash
ubus call luci.hexojs get_tor_status '{"instance":"default"}'

# Reponse :
{
  "enabled": true,
  "onion_address": "abc123xyz...def.onion",
  "virtual_port": 80,
  "status": "active"
}
```

### Acceder via Tor Browser

```
http://abc123xyz...def.onion
```

## Integration Gitea

### Configurer la synchronisation Gitea

1. Aller dans **Hexo CMS -> Git**
2. Entrer le depot : `user/myblog`
3. Configurer les identifiants (optionnel)
4. Cliquer sur **Cloner** ou **Pull**

### Webhook de deploiement automatique

Activer le deploiement automatique lors du push vers Gitea :

```bash
ubus call luci.hexojs setup_webhook '{
  "instance": "default",
  "auto_build": true
}'
```

### Operations Git

```bash
# Cloner le depot
ubus call luci.hexojs git_clone '{
  "instance": "default",
  "url": "http://192.168.255.1:3000/user/myblog.git"
}'

# Pull dernieres modifications
ubus call luci.hexojs git_pull '{"instance":"default"}'

# Push modifications
ubus call luci.hexojs git_push '{"instance":"default"}'

# Voir le log
ubus call luci.hexojs git_log '{"instance":"default","limit":10}'
```

## Surveillance de sante

### Score de sante de l'instance

```bash
ubus call luci.hexojs get_instance_health '{"instance":"default"}'

# Reponse :
{
  "instance": "default",
  "score": 95,
  "status": "healthy",
  "checks": {
    "hexo_running": true,
    "content_exists": true,
    "haproxy_published": true,
    "ssl_valid": true,
    "dns_resolves": true,
    "git_clean": true
  },
  "issues": []
}
```

### Details du score de sante

| Verification | Points | Description |
|--------------|--------|-------------|
| Hexo en cours | 20 | Processus serveur actif |
| Contenu existe | 15 | Repertoire articles a du contenu |
| HAProxy publie | 20 | Vhost configure |
| SSL valide | 15 | Certificat non expirant |
| DNS resout | 15 | Domaine pointe vers le serveur |
| Git propre | 15 | Pas de modifications non commitees |

## Configuration

### Parametres UCI

```bash
# /etc/config/hexojs

config hexojs 'main'
    option enabled '1'
    option instances_root '/srv/hexojs/instances'
    option content_root '/srv/hexojs/content'

config instance 'default'
    option name 'default'
    option enabled '1'
    option port '4000'
    option theme 'landscape'
    # HAProxy
    option haproxy_enabled '1'
    option haproxy_domain 'blog.example.com'
    option haproxy_ssl '1'
    # Tor
    option tor_enabled '1'
    option tor_onion 'abc123...onion'
    # Gitea
    option gitea_repo 'user/myblog'
    option gitea_auto_build '1'
```

## Emplacements des fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/hexojs` | Configuration UCI |
| `/srv/hexojs/instances/` | Repertoires des instances |
| `/srv/hexojs/content/` | Contenu partage (articles, medias) |
| `/srv/hexojs/content/source/_posts/` | Articles de blog |
| `/srv/hexojs/content/source/images/` | Fichiers medias |
| `/usr/libexec/rpcd/luci.hexojs` | Backend RPCD |

## Methodes RPCD

### Gestion du contenu

| Methode | Description |
|---------|-------------|
| `list_posts` | Lister tous les articles |
| `get_post` | Obtenir le contenu d'un article |
| `create_post` | Creer un nouvel article |
| `update_post` | Mettre a jour le contenu d'un article |
| `delete_post` | Supprimer un article |
| `publish_post` | Deplacer un brouillon vers publie |
| `search_posts` | Rechercher des articles par requete |

### Operations du site

| Methode | Description |
|---------|-------------|
| `generate` | Generer le HTML statique |
| `clean` | Nettoyer les fichiers generes |
| `deploy` | Deployer vers les cibles configurees |
| `preview_start` | Demarrer le serveur de preview |
| `preview_status` | Verifier le serveur de preview |

### Publication

| Methode | Description |
|---------|-------------|
| `publish_to_haproxy` | Publier sur le clearnet |
| `unpublish_from_haproxy` | Retirer de HAProxy |
| `publish_to_tor` | Creer un service cache Tor |
| `unpublish_from_tor` | Retirer le service Tor |
| `full_publish` | Pipeline complet |

### Surveillance

| Methode | Description |
|---------|-------------|
| `get_instance_health` | Score de sante et verifications |
| `get_pipeline_status` | Statut de toutes les instances |
| `get_instance_endpoints` | Toutes les URLs de l'instance |

## Depannage

### Le serveur Hexo ne demarre pas

```bash
# Verifier si le port est utilise
netstat -tln | grep 4000

# Verifier les logs
logread | grep hexo

# Redemarrer manuellement
/etc/init.d/hexojs restart
```

### Les articles ne s'affichent pas

1. Verifier que les articles sont dans `/srv/hexojs/content/source/_posts/`
2. Verifier que le format front matter est correct
3. Executer `hexo clean && hexo generate`

### Erreur HAProxy 503

1. Verifier que Hexo fonctionne sur le port attendu
2. Verifier la configuration du backend HAProxy
3. Tester l'acces local : `curl http://127.0.0.1:4000`

### Echec du push Git

1. Verifier les identifiants : `ubus call luci.hexojs git_get_credentials`
2. Verifier que l'URL distante est correcte
3. Verifier que Gitea est accessible

## Licence

MIT License - Copyright (C) 2025 CyberMind.fr
