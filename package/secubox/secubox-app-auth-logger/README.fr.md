# SecuBox Authentication Failure Logger pour CrowdSec

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Enregistre les echecs d'authentification de LuCI/rpcd et Dropbear SSH pour la detection CrowdSec.

## Installation

```sh
opkg install secubox-app-auth-logger
```

## Utilisation

```sh
# Activer et demarrer le service
/etc/init.d/secubox-app-auth-logger enable
/etc/init.d/secubox-app-auth-logger start
```

Le moniteur d'authentification s'execute en tant que daemon en arriere-plan surveillant les echecs de connexion.

## Contenu fourni

- Surveillance des echecs SSH (OpenSSH/Dropbear)
- Journalisation des echecs d'authentification de l'interface web LuCI via hook CGI
- Parser CrowdSec et scenario de bruteforce
- Configuration d'acquisition CrowdSec

## Fichiers

- `/etc/init.d/secubox-app-auth-logger` -- Script init
- `/usr/lib/secubox/auth-monitor.sh` -- Daemon de surveillance des echecs d'authentification

## Dependances

- `rpcd`
- `uhttpd`

## Licence

Apache-2.0
