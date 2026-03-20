[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI InterceptoR Dashboard

Tableau de bord unifie pour SecuBox InterceptoR - Systeme d'interception de trafic transparent "The Gandalf Proxy".

## Fonctionnalites

- **Score de Sante** - Couverture globale d'interception (0-100%)
- **5 Cartes de Statut des Piliers** :
  - WPAD Redirector - Statut de decouverte auto-proxy
  - MITM Proxy - Detection de menaces et statistiques de connexion
  - CDN Cache - Ratio de hits et economies de bande passante
  - Cookie Tracker - Detection des cookies de suivi
  - API Failover - Statut de service de contenu obsolete
- **Liens Rapides** - Acces direct aux tableaux de bord des modules individuels

## Installation

```bash
opkg install luci-app-interceptor
```

## Emplacement Menu

- SecuBox > InterceptoR > Vue d'ensemble - Score de sante et statut des piliers
- SecuBox > InterceptoR > Services - Tableau de bord des services dynamiques

## Architecture

InterceptoR agrege le statut de 5 piliers d'interception :

```
                    +-------------------+
                    |   InterceptoR     |
                    |    Dashboard      |
                    +-------------------+
                           |
    +------+------+--------+--------+------+
    |      |      |        |        |      |
  WPAD   MITM   CDN     Cookie   API
  Proxy  Proxy  Cache   Tracker  Failover
```

### Modules Piliers

| Pilier | Package | Fonction |
|--------|---------|----------|
| WPAD | luci-app-network-tweaks | Auto-proxy via DHCP/DNS |
| MITM | secubox-app-mitmproxy | Inspection HTTPS, detection de menaces |
| CDN Cache | luci-app-cdn-cache | Mise en cache de contenu, economies de bande passante |
| Cookie Tracker | secubox-cookie-tracker | Classification des cookies, suivi |
| API Failover | luci-app-cdn-cache | Stale-if-error, mode hors ligne |

## Tableau de Bord Services

L'onglet Services fournit une vue dynamique de tous les services SecuBox avec :

- **Publies** - Vhosts HAProxy et services onion Tor avec URLs en direct
- **Proxies** - Instances mitmproxy avec statut et liens vers l'UI web
- **Services** - Daemons en cours d'execution avec statut active/en cours
- **Tableaux de Bord** - Liens des apps LuCI pour une navigation rapide
- **Metriques** - Sante systeme, memoire, statistiques CrowdSec

Chaque service s'affiche avec son emoji de categorie pour une identification visuelle rapide.

## Methodes RPCD

### luci.interceptor

| Methode | Description |
|---------|-------------|
| `status` | Statut agrege de tous les piliers |
| `getPillarStatus` | Statut pour un pilier specifique |

### luci.services-registry

| Methode | Description |
|---------|-------------|
| `getServices` | Tous les services init.d avec statut |
| `getPublished` | Vhosts HAProxy + URLs onion Tor |
| `getMetrics` | Metriques systeme et statistiques CrowdSec |
| `getAll` | Combine : services, publies, proxies, tableaux de bord, metriques |

## Calcul du Score de Sante

- 20 points : WPAD active ou application active
- 20 points : mitmproxy en cours d'execution
- 20 points : CDN Cache (Squid) en cours d'execution
- 20 points : Cookie Tracker active
- 20 points : API Failover active

## Acces Public

La methode `status` est disponible pour les utilisateurs non authentifies pour les tableaux de bord de surveillance.

## Dependances

- luci-base
- rpcd

Optionnel (pour une fonctionnalite complete) :
- luci-app-network-tweaks
- secubox-app-mitmproxy
- luci-app-cdn-cache
- secubox-cookie-tracker

## Licence

GPL-3.0
