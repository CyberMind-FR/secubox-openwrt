# SecuBox CDN Cache

[English](README.md) | Francais | [中文](README.zh.md)

**Version :** 0.5.0
**Statut :** Actif

Un proxy de mise en cache pour SecuBox qui reduit l'utilisation de la bande passante en mettant en cache localement le contenu frequemment accede. Construit sur nginx avec des politiques de cache intelligentes pour differents types de contenu.

## Fonctionnalites

- **Proxy de cache transparent** - Mettre en cache le contenu HTTP automatiquement
- **Cache base sur les politiques** - Regles differentes pour les mises a jour Windows, depots Linux, applications Android, jeux Steam
- **Economies de bande passante** - Reduire les telechargements repetes sur tous les clients LAN
- **Gestion du cache** - Purger par domaine, expirer l'ancien contenu, precharger les URLs
- **Statistiques en temps reel** - Taux de hits, bande passante economisee, top des domaines caches
- **Tableau de bord LuCI** - Interface web complete pour la configuration et la surveillance

## Architecture

```
Clients LAN
     |
     v
[Proxy CDN Cache :3128]  <-- proxy cache nginx
     |
     v
  Internet
```

## Demarrage rapide

```bash
# Activer et demarrer
uci set cdn-cache.main.enabled=1
uci commit cdn-cache
/etc/init.d/cdn-cache start

# Configurer les clients pour utiliser le proxy : 192.168.255.1:3128
```

## Configuration

### Configuration UCI

```
/etc/config/cdn-cache

config cdn_cache 'main'
    option enabled '1'
    option cache_dir '/var/cache/cdn'
    option cache_size '1024'          # Taille max du cache en MB
    option max_object_size '512'      # Taille max d'un objet en MB
    option cache_valid '1440'         # Validite du cache par defaut en minutes
    option listen_port '3128'         # Port d'ecoute du proxy
    option transparent '0'            # Mode proxy transparent
    option log_level 'warn'

# Politiques de cache pour des types de contenu specifiques
config cache_policy 'windows_update'
    option name 'Windows Update'
    option domains 'windowsupdate.com download.microsoft.com'
    option extensions 'exe msu cab msi'
    option cache_time '10080'         # 7 jours
    option max_size '2048'
    option priority '10'

config cache_policy 'linux_repos'
    option name 'Linux Repositories'
    option domains 'archive.ubuntu.com deb.debian.org mirrors.kernel.org'
    option extensions 'deb rpm pkg.tar.zst'
    option cache_time '4320'          # 3 jours
    option max_size '1024'
    option priority '10'

# Exclusions (ne jamais mettre en cache)
config exclusion 'banking'
    option name 'Banking Sites'
    option domains 'bank.com paypal.com'
    option reason 'Security sensitive'
```

### Configuration client

#### Proxy manuel
Definir le proxy HTTP sur les appareils clients :
- **Adresse proxy :** 192.168.255.1
- **Port proxy :** 3128

#### Mode transparent
Activer le mode transparent pour rediriger automatiquement le trafic HTTP :
```bash
uci set cdn-cache.main.transparent=1
uci commit cdn-cache
/etc/init.d/cdn-cache restart
```

## API RPCD

### Statut et statistiques

| Methode | Parametres | Description |
|---------|------------|-------------|
| `status` | - | Statut du service, info cache, uptime |
| `stats` | - | Comptage hits/miss, bande passante economisee |
| `cache_list` | - | Lister les elements caches (top 100) |
| `top_domains` | - | Domaines classes par utilisation cache |
| `cache_size` | - | Espace cache utilise/max/libre |
| `bandwidth_savings` | period | Economies sur une periode (24h/7d/30d) |
| `hit_ratio` | period | Taux de hits sur une periode |
| `logs` | count | Dernieres entrees de log |

### Gestion du cache

| Methode | Parametres | Description |
|---------|------------|-------------|
| `purge_cache` | - | Vider tout le cache |
| `purge_domain` | domain | Vider le cache pour un domaine specifique |
| `purge_expired` | - | Supprimer les entrees expirees |
| `preload_url` | url | Recuperer et mettre en cache une URL |
| `clear_stats` | - | Reinitialiser les statistiques |

### Configuration

| Methode | Parametres | Description |
|---------|------------|-------------|
| `set_enabled` | enabled | Activer/desactiver le service |
| `policies` | - | Lister les politiques de cache |
| `add_policy` | name, domains, extensions, cache_time, max_size | Creer une politique |
| `remove_policy` | id | Supprimer une politique |
| `exclusions` | - | Lister les exclusions |
| `add_exclusion` | name, domains, reason | Creer une exclusion |
| `remove_exclusion` | id | Supprimer une exclusion |
| `set_limits` | max_size_mb, cache_valid | Definir les limites du cache |
| `restart` | - | Redemarrer le service |

### Exemples

```bash
# Verifier le statut
ubus call luci.cdn-cache status

# Obtenir les statistiques
ubus call luci.cdn-cache stats

# Purger le cache pour un domaine
ubus call luci.cdn-cache purge_domain '{"domain":"example.com"}'

# Ajouter une politique personnalisee
ubus call luci.cdn-cache add_policy '{
  "name": "Game Updates",
  "domains": "cdn.steampowered.com epicgames.com",
  "extensions": "pak bundle",
  "cache_time": 10080,
  "max_size": 4096
}'

# Definir les limites du cache (2GB, validite 48h)
ubus call luci.cdn-cache set_limits '{"max_size_mb": 2048, "cache_valid": 2880}'
```

## Configuration du cache nginx

Le service genere la configuration nginx a `/var/etc/cdn-cache-nginx.conf` :

- **Zone de cache :** Zone de cles de 64MB, taille max configurable
- **Niveaux de cache :** Structure de repertoires a 2 niveaux pour la performance
- **Contenu stale :** Sert le contenu stale en cas d'erreurs upstream (500, 502, 503, 504)
- **Verrou de cache :** Empeche le thundering herd sur les cache miss
- **Verification sante :** Endpoint `/cdn-cache-health`

### En-tetes de reponse

Les reponses cachees incluent :
- `X-Cache-Status` : HIT, MISS, EXPIRED, STALE, UPDATING
- `X-Cache-Date` : Date de reponse originale

## Politiques de cache par defaut

| Politique | Domaines | Extensions | Duree |
|-----------|----------|------------|-------|
| Windows Update | windowsupdate.com, download.microsoft.com | exe, msu, cab, msi | 7 jours |
| Linux Repos | archive.ubuntu.com, deb.debian.org | deb, rpm, pkg.tar.zst | 3 jours |
| Android Apps | play.googleapis.com | apk, obb | 7 jours |
| Steam Games | steamcontent.com | - | 7 jours |
| Static Content | * | js, css, png, jpg, woff | 1 jour |

## Fichiers

| Fichier | Description |
|---------|-------------|
| `/etc/config/cdn-cache` | Configuration UCI |
| `/etc/init.d/cdn-cache` | Script d'initialisation |
| `/var/etc/cdn-cache-nginx.conf` | Config nginx generee |
| `/var/cache/cdn/` | Repertoire de stockage du cache |
| `/var/run/cdn-cache.pid` | Fichier PID |
| `/var/run/cdn-cache-stats.json` | Fichier de statistiques |
| `/var/log/cdn-cache/access.log` | Log d'acces |
| `/var/log/cdn-cache/error.log` | Log d'erreur |
| `/usr/libexec/rpcd/luci.cdn-cache` | Backend RPCD |

## Depannage

### Le service ne demarre pas
```bash
# Verifier la syntaxe nginx
nginx -t -c /var/etc/cdn-cache-nginx.conf

# Verifier le log d'erreur
cat /var/log/cdn-cache/error.log
```

### Le cache ne fonctionne pas
```bash
# Verifier que le proxy ecoute
netstat -tlnp | grep 3128

# Tester avec curl
curl -x http://192.168.255.1:3128 http://example.com -I

# Verifier l'en-tete de statut du cache
curl -x http://192.168.255.1:3128 http://example.com -I | grep X-Cache
```

### Verifier le contenu du cache
```bash
# Lister les fichiers caches
ls -la /var/cache/cdn/

# Taille du cache
du -sh /var/cache/cdn/
```

### Vider tout le cache
```bash
ubus call luci.cdn-cache purge_cache
# ou manuellement
rm -rf /var/cache/cdn/*
/etc/init.d/cdn-cache restart
```

## Performance

Avec une configuration optimale :
- **Taux de hits :** 60-80% typique pour le contenu repete
- **Economies de bande passante :** Reduction de 40-60%
- **Latence :** < 1ms pour les cache hits

## Dependances

- `nginx-full` - Nginx avec modules proxy et cache
- `luci-base` - Framework LuCI
- `rpcd` - Daemon RPC

## Licence

Apache-2.0 - CyberMind.fr
