[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox App - CrowdSec

## Version
- **Package** : secubox-app-crowdsec
- **CrowdSec Core** : v1.7.4
- **Release** : 3
- **Derniere mise a jour** : Janvier 2025

## Description
CrowdSec est un moteur de securite open-source et leger qui detecte et repond aux comportements malveillants. Ce package SecuBox fournit CrowdSec pour les routeurs OpenWrt avec configuration automatique de l'acquisition des logs.

## Fonctionnalites cles (v1.7.4)
- Capacite WAF avec helper DropRequest pour le blocage des requetes
- Acquisition syslog refactorisee utilisant RestartableStreamer
- Driver SQLite pure-go optionnel pour une meilleure compatibilite
- Configuration de logging amelioree avec support du media syslog
- Export de metriques d'utilisation configurable (api.server.disable_usage_metrics_export)
- Correction des problemes de cardinalite des metriques LAPI avec Prometheus
- Prevention des race conditions dans l'acquisition Docker
- Optimisation des requetes base de donnees pour les flux de decisions
- **Configuration automatique de l'acquisition des logs OpenWrt**
- **Gestion de l'acquisition basee sur UCI**

## Contenu du package
- **Makefile** : Definition du package OpenWrt pour CrowdSec v1.7.4
- **files/** : Scripts de configuration et d'initialisation
  - `crowdsec.initd` : Script init pour la gestion du service
  - `crowdsec.config` : Configuration UCI (avec parametres d'acquisition)
  - `crowdsec.defaults` : Configuration par defaut avec auto-detection
  - `acquis.d/` : Templates de configuration d'acquisition
    - `openwrt-syslog.yaml` : Logs syslog systeme
    - `openwrt-dropbear.yaml` : Logs SSH/Dropbear
    - `openwrt-firewall.yaml` : Logs firewall iptables/nftables
    - `openwrt-uhttpd.yaml` : Logs serveur web uHTTPd

## Installation
```bash
# Depuis l'environnement de build SecuBox
cd /home/reepost/CyberMindStudio/_files/secubox-openwrt
make package/secubox/secubox-app-crowdsec/compile V=s

# Installer sur le routeur
opkg install crowdsec_1.7.4-3_*.ipk
```

## Configuration

### Configuration UCI
CrowdSec utilise UCI pour la configuration dans `/etc/config/crowdsec` :

```bash
# Voir la configuration actuelle
uci show crowdsec

# Parametres principaux
uci set crowdsec.crowdsec.data_dir='/srv/crowdsec/data'
uci set crowdsec.crowdsec.db_path='/srv/crowdsec/data/crowdsec.db'

# Parametres d'acquisition
uci set crowdsec.acquisition.syslog_enabled='1'
uci set crowdsec.acquisition.firewall_enabled='1'
uci set crowdsec.acquisition.ssh_enabled='1'
uci set crowdsec.acquisition.http_enabled='0'
uci set crowdsec.acquisition.syslog_path='/var/log/messages'

# Parametres du Hub
uci set crowdsec.hub.auto_install='1'
uci set crowdsec.hub.collections='crowdsecurity/linux crowdsecurity/iptables'
uci set crowdsec.hub.update_interval='7'

uci commit crowdsec
```

### Emplacements des fichiers
- Config principale : `/etc/crowdsec/config.yaml`
- Repertoire d'acquisition : `/etc/crowdsec/acquis.d/`
- Acquisition legacy : `/etc/crowdsec/acquis.yaml`
- Profils : `/etc/crowdsec/profiles.yaml`
- API locale : `/etc/crowdsec/local_api_credentials.yaml`
- Repertoire de donnees : `/srv/crowdsec/data/`

## Configuration de l'acquisition des logs

### Detection automatique
Au premier demarrage, le script defaults automatiquement :
1. Detecte la configuration des fichiers de log OpenWrt
2. Identifie les services installes (Dropbear, firewall)
3. Genere les configs d'acquisition appropriees
4. Installe les collections Hub recommandees

### Sources de logs supportees
| Source de log | Par defaut | Collection requise |
|---------------|------------|-------------------|
| Syslog systeme | Active | crowdsecurity/linux |
| SSH/Dropbear | Active | crowdsecurity/linux |
| Firewall (iptables/nftables) | Active | crowdsecurity/iptables |
| HTTP (uHTTPd/nginx) | Desactive | crowdsecurity/http-cve |

### Acquisition personnalisee
Ajoutez des configs d'acquisition personnalisees dans `/etc/crowdsec/acquis.d/` :

```yaml
# /etc/crowdsec/acquis.d/custom.yaml
filenames:
  - /var/log/custom-app/*.log
labels:
  type: syslog
```

### Mode service Syslog
Pour executer CrowdSec comme serveur syslog (recevoir les logs d'autres appareils) :

```bash
uci set crowdsec.acquisition.syslog_listen_addr='0.0.0.0'
uci set crowdsec.acquisition.syslog_listen_port='514'
uci commit crowdsec
/etc/init.d/crowdsec restart
```

## Gestion du service
```bash
# Demarrer CrowdSec
/etc/init.d/crowdsec start

# Arreter CrowdSec
/etc/init.d/crowdsec stop

# Redemarrer CrowdSec
/etc/init.d/crowdsec restart

# Verifier le statut
/etc/init.d/crowdsec status
```

## Utilisation CLI
Le CLI CrowdSec est disponible via `cscli` :
```bash
# Verifier la version
cscli version

# Verifier le statut d'acquisition
cscli metrics show acquisition

# Lister les decisions
cscli decisions list

# Voir les alertes
cscli alerts list

# Gerer les collections
cscli collections list
cscli collections install crowdsecurity/nginx

# Gerer le Hub
cscli hub update
cscli hub upgrade

# Gerer les bouncers
cscli bouncers list
cscli bouncers add firewall-bouncer
```

## Collections Hub pour OpenWrt

### Collections recommandees
```bash
# Detection Linux de base (brute-force SSH, etc.)
cscli collections install crowdsecurity/linux

# Analyse des logs firewall (detection de scan de ports)
cscli collections install crowdsecurity/iptables

# Parsing syslog
cscli parsers install crowdsecurity/syslog-logs

# Whitelists pour reduire les faux positifs
cscli parsers install crowdsecurity/whitelists
```

### Collections optionnelles
```bash
# Detection d'attaques HTTP
cscli collections install crowdsecurity/http-cve

# Logs nginx
cscli collections install crowdsecurity/nginx

# Smb/Samba
cscli collections install crowdsecurity/smb
```

## Integration avec SecuBox
Ce package s'integre avec :
- **luci-app-crowdsec-dashboard** v0.5.0+
- **secubox-app-crowdsec-bouncer** - Bouncer firewall
- **Systeme de theme SecuBox**
- **Logging SecuBox** (`secubox-log`)

## Dependances
- Compilateur Go (build-time)
- SQLite3
- Systeme de base OpenWrt

## References
- Upstream : https://github.com/crowdsecurity/crowdsec
- Documentation : https://docs.crowdsec.net/
- Hub : https://hub.crowdsec.net/
- Docs Acquisition : https://docs.crowdsec.net/docs/next/log_processor/data_sources/intro/
- Projet SecuBox : https://cybermind.fr

## Changelog

### v1.7.4-3 (2025-01)
- Ajout de la configuration automatique d'acquisition des logs
- Ajout de la gestion d'acquisition basee sur UCI
- Ajout du repertoire acquis.d avec templates specifiques OpenWrt
- Amelioration de l'auto-installation des collections Hub
- Ajout de l'acquisition pour syslog, SSH/Dropbear, firewall, HTTP
- Script defaults ameliore avec logique de detection

### v1.7.4-2 (2024-12)
- Mise a jour de v1.6.2 vers v1.7.4
- Ajout du support WAF/AppSec
- Amelioration de l'acquisition syslog
- Configuration amelioree de l'export des metriques
- Correction des problemes de cardinalite Prometheus

### v1.6.2-1 (Precedent)
- Integration SecuBox initiale
- Patches de compatibilite OpenWrt de base

## Licence
Licence MIT

## Mainteneur
CyberMind.fr - Gandalf <gandalf@gk2.net>
