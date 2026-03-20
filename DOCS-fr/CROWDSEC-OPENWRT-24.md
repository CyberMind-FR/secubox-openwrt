# Integration CrowdSec pour OpenWrt 24.10+ (SecuBox)

> **Languages:** [English](../DOCS/CROWDSEC-OPENWRT-24.md) | Francais | [中文](../DOCS-zh/CROWDSEC-OPENWRT-24.md)

## Apercu

Cette documentation couvre l'integration complete de la solution de securite CrowdSec pour OpenWrt 24.10+ avec support fw4/nftables. L'integration se compose de deux packages:

1. **secubox-crowdsec-setup**: Script d'installation automatisee
2. **luci-app-secubox-crowdsec**: Tableau de bord interface web LuCI

## Prerequis

### Materiel
- Minimum 256MB RAM
- Minimum 50MB de stockage flash disponible
- Architecture ARM64, ARMv7, x86_64, ou MIPS

### Logiciel
- OpenWrt 24.10 ou ulterieur
- fw4 avec nftables (defaut dans OpenWrt 24.10+)
- Connectivite Internet pour la configuration initiale

## Installation Rapide

### Methode 1: Utiliser le Script de Configuration

```bash
# Installer les dependances
opkg update
opkg install secubox-crowdsec-setup

# Executer la configuration automatisee
secubox-crowdsec-setup --install
```

### Methode 2: Installation Manuelle

```bash
# Mettre a jour les listes de packages
opkg update

# Installer les packages requis
opkg install crowdsec crowdsec-firewall-bouncer syslog-ng

# Installer le tableau de bord LuCI (optionnel)
opkg install luci-app-secubox-crowdsec
```

## Architecture

```
                    +-----------------------+
                    |    Systeme OpenWrt    |
                    +-----------------------+
                             |
              +--------------+--------------+
              |                             |
      +-------v-------+           +---------v---------+
      |   syslog-ng   |           |   logread -f      |
      | (UDP 5140)    |           |   (repli)         |
      +-------+-------+           +---------+---------+
              |                             |
              +-------------+---------------+
                            |
                    +-------v-------+
                    |   CrowdSec    |
                    | (LAPI :8080)  |
                    +-------+-------+
                            |
              +-------------+-------------+
              |                           |
      +-------v-------+          +--------v--------+
      |   CAPI Local  |          |   CrowdSec      |
      | (blocklists)  |          |   Hub (parsers, |
      +---------------+          |   scenarios)    |
                                 +-----------------+
                                          |
                            +-------------v-------------+
                            | crowdsec-firewall-bouncer |
                            |    (mode nftables)        |
                            +-------------+-------------+
                                          |
                                 +--------v--------+
                                 |  nftables fw4   |
                                 |  (crowdsec/     |
                                 |   crowdsec6)    |
                                 +-----------------+
```

## Composants

### 1. Configuration syslog-ng

Situee a `/etc/syslog-ng/syslog-ng.conf`, cette configuration:
- Capture tous les logs systeme via socket Unix
- Transmet les logs a CrowdSec via port UDP 5140
- Ecrit des copies locales dans `/tmp/log/` pour le debogage

Sources cles surveillees:
- Logs systeme (`/dev/log`)
- Messages noyau (`/proc/kmsg`)
- Logs d'authentification (SSH, tentatives de connexion)

### 2. Moteur CrowdSec

Repertoire de configuration: `/etc/crowdsec/`

Composants principaux:
- **config.yaml**: Fichier de configuration principal
- **acquis.d/**: Fichiers de configuration d'acquisition
- **parsers/**: Regles d'analyse de logs
- **scenarios/**: Scenarios de detection d'attaques
- **hub/**: Contenu du hub telecharge

Stockage des donnees: `/srv/crowdsec/data/`

### 3. Bouncer Pare-feu

Configuration: `/etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml`

Cree les tables nftables:
- `ip crowdsec`: Blocage IPv4
- `ip6 crowdsec6`: Blocage IPv6

### 4. Tableau de Bord LuCI

Accessible via: **Services > CrowdSec**

Fonctionnalites:
- Tableau de bord avec etat du service
- Gestion des decisions actives (bans)
- Visualiseur d'alertes de securite
- Gestion des collections
- Configuration des parametres

## Configuration UCI

Le fichier de configuration UCI `/etc/config/crowdsec` contient:

```uci
config crowdsec 'crowdsec'
    option enabled '1'
    option data_dir '/srv/crowdsec/data'
    option db_path '/srv/crowdsec/data/crowdsec.db'

config acquisition 'acquisition'
    option syslog_enabled '1'
    option firewall_enabled '1'
    option ssh_enabled '1'
    option http_enabled '0'

config hub 'hub'
    option auto_install '1'
    option collections 'crowdsecurity/linux crowdsecurity/sshd crowdsecurity/iptables'
    option update_interval '7'

config bouncer 'bouncer'
    option enabled '1'
    option ipv4 '1'
    option ipv6 '1'
    option deny_action 'drop'
    option deny_log '1'
    option update_frequency '10s'
```

## Collections par Defaut

Les collections suivantes sont installees par defaut:

| Collection | Description |
|------------|-------------|
| `crowdsecurity/linux` | Securite systeme Linux |
| `crowdsecurity/sshd` | Protection contre la force brute SSH |
| `crowdsecurity/iptables` | Analyse des logs pare-feu |
| `crowdsecurity/http-cve` | Exploits HTTP CVE |

## Reference des Commandes

### Gestion des Services

```bash
# Service CrowdSec
/etc/init.d/crowdsec start|stop|restart|enable|disable

# Bouncer pare-feu
/etc/init.d/crowdsec-firewall-bouncer start|stop|restart|enable|disable

# Syslog-ng
/etc/init.d/syslog-ng start|stop|restart|enable|disable
```

### Commandes cscli

```bash
# Voir l'etat
cscli lapi status
cscli capi status

# Gestion des decisions
cscli decisions list
cscli decisions add --ip <IP> --duration 24h --reason "Ban manuel"
cscli decisions delete --ip <IP>

# Gestion des alertes
cscli alerts list
cscli alerts list --since 24h

# Gestion des collections
cscli collections list
cscli collections install crowdsecurity/nginx
cscli collections remove crowdsecurity/nginx

# Gestion du hub
cscli hub update
cscli hub upgrade

# Gestion des bouncers
cscli bouncers list

# Metriques
cscli metrics
```

### Commandes nftables

```bash
# Lister les tables CrowdSec
nft list tables | grep crowdsec

# Montrer les IPs bloquees (IPv4)
nft list set ip crowdsec crowdsec-blacklists

# Montrer les IPs bloquees (IPv6)
nft list set ip6 crowdsec6 crowdsec6-blacklists
```

## Depannage

### CrowdSec ne demarre pas

```bash
# Verifier les logs
logread | grep crowdsec
cat /var/log/crowdsec.log

# Verifier la configuration
cscli config show
```

### LAPI indisponible

```bash
# Verifier si CrowdSec tourne
pgrep crowdsec

# Reparer l'enregistrement machine
cscli machines add localhost --auto --force
/etc/init.d/crowdsec restart
```

### Le bouncer ne bloque pas

```bash
# Verifier l'etat du bouncer
pgrep -f crowdsec-firewall-bouncer

# Verifier les tables nftables
nft list tables

# Verifier la cle API du bouncer
cat /etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml | grep api_key
```

### Problemes syslog-ng

```bash
# Verifier si en cours d'execution
pgrep syslog-ng

# Tester la configuration
syslog-ng -s

# Verifier l'ecouteur UDP
netstat -uln | grep 5140
```

### Pas d'alertes generees

```bash
# Verifier l'acquisition
cscli metrics show acquisition

# Tester l'analyse des logs
echo "Failed password for root from 192.168.1.100 port 22222 ssh2" | \
  cscli parsers inspect crowdsecurity/sshd-logs
```

## Desinstallation

```bash
# Utiliser le script de configuration
secubox-crowdsec-setup --uninstall

# Suppression manuelle
/etc/init.d/crowdsec-firewall-bouncer stop
/etc/init.d/crowdsec stop
/etc/init.d/syslog-ng stop

opkg remove luci-app-secubox-crowdsec
opkg remove crowdsec-firewall-bouncer
opkg remove crowdsec
opkg remove syslog-ng

# Nettoyer nftables
nft delete table ip crowdsec
nft delete table ip6 crowdsec6

# Reactiver logd
/etc/init.d/log enable
/etc/init.d/log start
```

## Considerations de Securite

### Liste Blanche des Reseaux Locaux

La configuration par defaut inclut une liste blanche pour les reseaux prives RFC1918:
- 10.0.0.0/8
- 172.16.0.0/12
- 192.168.0.0/16
- 127.0.0.0/8

Cela empeche le blocage accidentel de l'acces de gestion local.

### Cle API du Bouncer

La cle API du bouncer est generee automatiquement pendant la configuration et stockee dans:
- `/etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml`
- Config UCI: `crowdsec.bouncer.api_key`

### Retention des Logs

Les logs dans `/tmp/log/` sont stockes en tmpfs et effaces au redemarrage. Pour un logging persistant, configurer syslog-ng pour ecrire sur le stockage overlay.

## Optimisation des Performances

Pour les appareils a ressources limitees:

1. **Reduire la frequence de mise a jour**:
   ```bash
   uci set crowdsec.bouncer.update_frequency='30s'
   uci commit crowdsec
   ```

2. **Desactiver IPv6 si non utilise**:
   ```bash
   uci set crowdsec.bouncer.ipv6='0'
   uci commit crowdsec
   ```

3. **Limiter les collections**:
   Installer uniquement les collections pertinentes pour votre configuration.

## Integration avec SecuBox

Cette integration CrowdSec fait partie de la suite de securite SecuBox pour OpenWrt. Elle fonctionne aux cotes d'autres composants SecuBox:

- Pare-feu SecuBox
- VPN SecuBox
- Filtrage DNS SecuBox
- Surveillance SecuBox

## Licence

Licence MIT - Copyright (C) 2025 CyberMind.fr

## Support

- Issues GitHub: https://github.com/secubox/secubox-openwrt
- Documentation: https://secubox.cybermood.eu/docs
- Docs CrowdSec: https://docs.crowdsec.net
