# SecuBox CDN Cache Dashboard

[![OpenWrt](https://img.shields.io/badge/OpenWrt-23.05+-blue.svg)](https://openwrt.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![SecuBox](https://img.shields.io/badge/SecuBox-Module-cyan.svg)](https://cybermind.fr/secubox)

Dashboard LuCI pour gérer un proxy cache CDN local sur OpenWrt. Optimisez votre bande passante en cachant le contenu web fréquemment accédé.

![CDN Cache Dashboard](docs/screenshot-overview.png)

## 🎯 Fonctionnalités

- **📊 Dashboard temps réel** — Statistiques de hit ratio, économies de bande passante
- **💾 Gestion du cache** — Visualisation des objets en cache, purge sélective
- **📋 Policies configurables** — Règles par domaine, extension, durée
- **📈 Graphiques statistiques** — Évolution du hit ratio et des économies
- **🔧 Maintenance** — Purge, préchargement, logs, redémarrage
- **⚙️ Configuration complète** — Taille cache, port, mode transparent

## 📦 Installation

### Depuis les packages SecuBox

```bash
opkg update
opkg install luci-app-cdn-cache
```

### Compilation manuelle

```bash
# Cloner dans le SDK OpenWrt
git clone https://github.com/gkerma/luci-app-cdn-cache.git package/luci-app-cdn-cache

# Compiler
make package/luci-app-cdn-cache/compile V=s
```

## 🔧 Configuration

### Via LuCI

1. Accéder à **Services → CDN Cache → Settings**
2. Configurer la taille du cache, le port et les policies
3. Activer le service

### Via UCI

```bash
# Activer le service
uci set cdn-cache.main.enabled=1
uci set cdn-cache.main.cache_size=2048
uci set cdn-cache.main.listen_port=3128
uci commit cdn-cache

# Redémarrer
/etc/init.d/cdn-cache restart
```

### Configuration client

Configurez vos appareils pour utiliser le proxy :

```
Proxy HTTP: 192.168.1.1:3128
```

Ou utilisez le mode transparent avec des règles iptables.

## 📊 Policies de Cache

Les policies définissent quoi cacher et pour combien de temps :

| Policy | Domaines | Extensions | Durée |
|--------|----------|------------|-------|
| Windows Update | windowsupdate.com, download.microsoft.com | exe, msu, cab | 7 jours |
| Linux Repos | archive.ubuntu.com, deb.debian.org | deb, rpm | 3 jours |
| Static Content | * | js, css, png, jpg, woff | 1 jour |

## 🚫 Exclusions

Certains domaines ne doivent jamais être cachés :

- **Sites bancaires** — Sécurité
- **Streaming vidéo** — Contenu temps réel
- **APIs dynamiques** — Données changeantes

## 📁 Structure du Package

```
luci-app-cdn-cache/
├── Makefile
├── htdocs/luci-static/resources/
│   ├── view/cdn-cache/
│   │   ├── overview.js        # Dashboard principal
│   │   ├── cache.js           # Gestion du cache
│   │   ├── policies.js        # Configuration policies
│   │   ├── statistics.js      # Graphiques stats
│   │   ├── maintenance.js     # Outils maintenance
│   │   └── settings.js        # Configuration
│   └── cdn-cache/
│       ├── api.js             # API RPC
│       └── dashboard.css      # Styles
└── root/
    ├── etc/
    │   ├── config/cdn-cache   # Configuration UCI
    │   └── init.d/cdn-cache   # Script init
    └── usr/
        ├── libexec/rpcd/cdn-cache  # Backend RPCD
        └── share/
            ├── luci/menu.d/   # Menu LuCI
            └── rpcd/acl.d/    # ACL
```

## 🔗 API RPCD

| Méthode | Description |
|---------|-------------|
| `status` | État du service |
| `stats` | Statistiques globales |
| `cache_list` | Liste des objets en cache |
| `top_domains` | Top domaines par usage |
| `bandwidth_savings` | Économies de bande passante |
| `purge_cache` | Vider tout le cache |
| `purge_domain` | Vider cache d'un domaine |
| `preload_url` | Précharger une URL |

## 🔧 Dépendances

- `luci-base` — Framework LuCI
- `nginx-ssl` — Serveur proxy
- `rpcd` — Daemon RPC
- `coreutils-stat` — Utilitaires

## 📈 Performances

Avec une configuration optimale :

- **Hit ratio** : 60-80% typique
- **Économies** : 40-60% de bande passante
- **Latence** : < 1ms pour les hits

## 🔗 Liens

- [Documentation](https://cybermind.fr/apps/cdn-cache)
- [SecuBox Project](https://cybermind.fr/secubox)
- [CyberMind.fr](https://cybermind.fr)

## 📄 Licence

Apache-2.0 © 2025 CyberMind.fr
