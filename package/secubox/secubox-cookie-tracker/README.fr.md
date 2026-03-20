# SecuBox Cookie Tracker

:globe_with_meridians: **Langues:** [English](README.md) | Français | [中文](README.zh.md)

Classification et suivi des cookies HTTP pour SecuBox InterceptoR.

## Fonctionnalités

- **Extraction de cookies** - Capture les cookies du trafic HTTP via mitmproxy
- **Classification automatique** - Catégorise les cookies comme essentiels, fonctionnels, analytiques, publicitaires ou de pistage
- **Base de données SQLite** - Stockage persistant avec recherche et filtrage
- **Base de données de traceurs connus** - Plus de 100 domaines de traceurs pré-configurés
- **Intégration Vortex** - Transmet les domaines bloqués au pare-feu Vortex
- **Gestion CLI** - Interface en ligne de commande complète pour la gestion des cookies

## Installation

```bash
opkg install secubox-cookie-tracker
```

Nécessite `secubox-app-mitmproxy` pour l'interception du trafic.

## Démarrage rapide

```bash
# Initialiser la base de données
cookie-trackerctl init

# Voir le statut
cookie-trackerctl status

# Lister les cookies
cookie-trackerctl list

# Bloquer un domaine de pistage
cookie-trackerctl block doubleclick.net
```

## Commandes CLI

| Commande | Description |
|----------|-------------|
| `status [--json]` | Afficher le résumé des statistiques |
| `init [force]` | Initialiser/réinitialiser la base de données |
| `reload` | Recharger les règles de traceurs depuis UCI |
| `list [options]` | Lister les cookies avec filtres |
| `show <domain>` | Afficher les cookies d'un domaine |
| `classify <domain> <name> <cat>` | Classifier manuellement un cookie |
| `block <domain>` | Bloquer tous les cookies d'un domaine |
| `unblock <domain>` | Débloquer un domaine |
| `report [--json]` | Générer un rapport de cookies |
| `export [file]` | Exporter la base de données en CSV |
| `import <file>` | Importer des règles de traceurs depuis TSV |
| `feed-vortex` | Transmettre les domaines bloqués à Vortex |
| `stats` | Statistiques détaillées |

## Catégories de cookies

| Catégorie | Description | Action par défaut |
|-----------|-------------|-------------------|
| `essential` | Requis pour le fonctionnement du site | Autoriser |
| `functional` | Préférences utilisateur, paramètres | Autoriser |
| `analytics` | Suivi d'utilisation pour améliorer le site | Alerte |
| `advertising` | Ciblage et reciblage publicitaire | Bloquer |
| `tracking` | Pistage inter-sites, empreinte digitale | Bloquer |
| `unknown` | Pas encore classifié | Autoriser |

## Intégration mitmproxy

Ajoutez l'addon à votre configuration mitmproxy :

```bash
# /etc/config/mitmproxy
config filtering 'filtering'
    option addon_script '/usr/lib/secubox/cookie-tracker/mitmproxy-addon.py'
```

Ou chargez-le avec l'addon principal d'analytique :

```bash
mitmdump -s /usr/lib/secubox/cookie-tracker/mitmproxy-addon.py \
         -s /srv/mitmproxy/addons/secubox_analytics.py
```

## Configuration UCI

```
# /etc/config/cookie-tracker
config cookie_tracker 'main'
    option enabled '1'
    option auto_classify '1'
    option block_tracking '0'
    option block_advertising '0'

config tracker_rule 'custom'
    option pattern '_my_tracker'
    option category 'tracking'
```

## Schéma de la base de données

```sql
CREATE TABLE cookies (
    id INTEGER PRIMARY KEY,
    domain TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'unknown',
    first_seen INTEGER,
    last_seen INTEGER,
    count INTEGER DEFAULT 1,
    client_mac TEXT,
    blocked INTEGER DEFAULT 0,
    UNIQUE(domain, name)
);

CREATE TABLE tracker_domains (
    domain TEXT PRIMARY KEY,
    category TEXT,
    source TEXT
);
```

## Exemples

```bash
# Lister tous les cookies de pistage
cookie-trackerctl list --category tracking

# Lister les cookies d'un domaine spécifique
cookie-trackerctl list --domain google.com

# Générer un rapport JSON pour le tableau de bord
cookie-trackerctl report --json

# Exporter toutes les données
cookie-trackerctl export /tmp/cookies.csv

# Bloquer et synchroniser avec Vortex
cookie-trackerctl block ads.example.com
cookie-trackerctl feed-vortex
```

## Dépendances

- secubox-app-mitmproxy (pour l'interception du trafic)
- sqlite3-cli
- jsonfilter

## Licence

GPL-3.0
