# Scenarios CrowdSec personnalises pour SecuBox

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Configurations CrowdSec personnalisees pour l'interface web SecuBox et la protection des services.

## Installation

```sh
opkg install secubox-app-crowdsec-custom
```

## Scenarios inclus

- Detection de bruteforce d'authentification HTTP
- Detection de scan de chemins / enumeration
- Surveillance des echecs d'authentification LuCI / uhttpd
- Surveillance du reverse proxy Nginx
- Protection du backend HAProxy et surveillance de l'authentification
- Detection de bruteforce Gitea web, SSH et API
- Protection contre le flooding et l'authentification des applications Streamlit
- Protection generique contre le bruteforce d'authentification des webapps
- Enrichissement de liste blanche pour les reseaux de confiance

## Contenu fourni

- Parsers sous `/etc/crowdsec/parsers/`
- Scenarios sous `/etc/crowdsec/scenarios/`
- Configurations d'acquisition sous `/etc/crowdsec/acquis.d/`
- Profils d'enrichissement de liste blanche

## Dependances

- `crowdsec`
- `crowdsec-firewall-bouncer`

## Licence

Apache-2.0
