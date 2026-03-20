# SecuBox Dashboard Web Application

:globe_with_meridians: **Langues:** [English](README.md) | Français | [中文](README.zh.md)

Application web de tableau de bord native pour les appliances SecuBox. Fournit une surveillance en temps réel, une gestion des services et une intégration de sécurité CrowdSec utilisant l'authentification rpcd/ubus.

## Installation

```bash
opkg install secubox-app-webapp
```

## Configuration

Fichier de configuration UCI : `/etc/config/secubox-webapp`

```bash
uci set secubox-webapp.main.enabled='1'
uci set secubox-webapp.main.port='80'
uci commit secubox-webapp
```

## Configuration initiale

Exécutez la configuration initiale après l'installation :

```bash
/usr/sbin/secubox-webapp-setup
```

## Interface Web

Accédez au tableau de bord à l'adresse `http://<router-ip>/secubox/index.html`. L'authentification est gérée via le système de session natif rpcd/ubus (mêmes identifiants que LuCI).

## Fonctionnalités

- Surveillance système en temps réel (CPU, mémoire, réseau)
- État et gestion des services
- Intégration du tableau de bord des menaces CrowdSec
- Authentification native rpcd/ubus (pas de base de données utilisateur séparée)

## Dépendances

- `uhttpd`
- `uhttpd-mod-ubus`
- `rpcd`
- `rpcd-mod-file`

## Licence

Apache-2.0
