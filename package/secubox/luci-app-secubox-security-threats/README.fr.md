[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# Tableau de Bord SecuBox Security Threats

## Apercu

Un tableau de bord LuCI unifie qui integre les **risques de securite DPI de netifyd** avec **l'intelligence de menaces CrowdSec** pour une surveillance complete des menaces reseau et un blocage automatise.

## Fonctionnalites

- **Detection de Menaces en Temps Reel** : Surveille les 52 types de risques de securite de netifyd
- **Integration CrowdSec** : Correlation avec les alertes et decisions CrowdSec
- **Score de Risque** : Calcule des scores de risque 0-100 bases sur plusieurs facteurs
- **Blocage Automatique** : Regles configurables pour le blocage automatique des menaces
- **Analyse par Hote** : Suivi des menaces par adresse IP
- **Tableau de Bord Visuel** : Statistiques, graphiques et tableau de menaces en temps reel

## Architecture

```
Moteur DPI netifyd → Backend RPCD → API ubus → Tableau de Bord LuCI
                          ↓
                    CrowdSec LAPI
                          ↓
                  nftables (blocage)
```

## Dependances

- `luci-base` : Framework LuCI
- `rpcd` : Daemon Remote Procedure Call
- `netifyd` : Moteur d'inspection approfondie des paquets
- `crowdsec` : Intelligence de menaces et blocage
- `jq` : Traitement JSON
- `jsonfilter` : Filtrage JSON compatible UCI

## Installation

1. Compiler le package :
```bash
cd /path/to/openwrt
make package/secubox/luci-app-secubox-security-threats/compile
```

2. Installer sur le routeur :
```bash
opkg install luci-app-secubox-security-threats_*.ipk
```

3. Redemarrer les services :
```bash
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## Utilisation

### Acces au Tableau de Bord

Naviguer vers : **Admin → SecuBox → Securite → Threat Monitor → Dashboard**

### Configurer les Regles de Blocage Automatique

Editer `/etc/config/secubox_security_threats` :

```uci
config block_rule 'my_rule'
    option name 'Bloquer Malware'
    option enabled '1'
    option threat_types 'malware'
    option duration '24h'
    option threshold '60'
```

Appliquer les changements :
```bash
uci commit secubox_security_threats
```

### Blocage Manuel

Via le tableau de bord :
1. Cliquer sur le bouton "Bloquer" a cote de la menace
2. Confirmer l'action
3. L'IP sera bloquee via CrowdSec

Via CLI :
```bash
ubus call luci.secubox-security-threats block_threat '{"ip":"192.168.1.100","duration":"4h","reason":"Test"}'
```

### Mettre un Hote en Liste Blanche

```bash
ubus call luci.secubox-security-threats whitelist_host '{"ip":"192.168.1.100","reason":"Poste admin"}'
```

## Algorithme de Score de Risque

**Score de Base (0-50) :** nombre_risques × 10 (plafonne)

**Poids de Severite :**
- Indicateurs de malware (MALICIOUS_JA3, DGA) : +20
- Attaques web (injection SQL, XSS) : +15
- Anomalies reseau (RISKY_ASN, tunneling DNS) : +10
- Menaces de protocole (BitTorrent, Mining) : +5

**Correlation CrowdSec :**
- Decision active : +30

**Niveaux de Severite :**
- Critique : ≥80
- Eleve : 60-79
- Moyen : 40-59
- Faible : <40

## Categories de Menaces

- **malware** : JA3 malveillant, domaines DGA, entropie suspecte
- **web_attack** : Injection SQL, XSS, tentatives RCE
- **anomaly** : Tunneling DNS, ASN risques, trafic unidirectionnel
- **protocol** : BitTorrent, mining, Tor, protocoles non autorises
- **tls_issue** : Problemes de certificat, chiffrements faibles

## Tests

### Backend (CLI ubus)
```bash
# Tester le statut
ubus call luci.secubox-security-threats status

# Obtenir les menaces actives
ubus call luci.secubox-security-threats get_active_threats

# Tester le blocage
ubus call luci.secubox-security-threats block_threat '{"ip":"192.168.1.100","duration":"4h","reason":"Test"}'

# Verifier dans CrowdSec
cscli decisions list
```

### Frontend
1. Naviguer vers le tableau de bord dans LuCI
2. Verifier que les cartes de statistiques s'affichent
3. Verifier que le tableau des menaces se remplit
4. Tester le bouton "Bloquer"
5. Verifier le polling temps reel (rafraichissement 10s)

## Depannage

### Aucune menace detectee
- Verifier si netifyd fonctionne : `ps | grep netifyd`
- Verifier les donnees netifyd : `cat /var/run/netifyd/status.json`
- Activer la detection de risques netifyd dans la config

### Blocage automatique non fonctionnel
- Verifier si le blocage auto est active : `uci get secubox_security_threats.global.auto_block_enabled`
- Verifier que les regles de blocage sont activees : `uci show secubox_security_threats`
- Consulter les logs : `logread | grep security-threats`

### Problemes d'integration CrowdSec
- Verifier si CrowdSec fonctionne : `ps | grep crowdsec`
- Tester cscli : `cscli version`
- Verifier les permissions : `ls -l /usr/bin/cscli`

## Fichiers

**Backend :**
- `/usr/libexec/rpcd/luci.secubox-security-threats` - Backend RPCD (mode 755)
- `/etc/config/secubox_security_threats` - Configuration UCI

**Frontend :**
- `/www/luci-static/resources/secubox-security-threats/api.js` - Wrapper API
- `/www/luci-static/resources/view/secubox-security-threats/dashboard.js` - Vue tableau de bord

**Configuration :**
- `/usr/share/luci/menu.d/luci-app-secubox-security-threats.json` - Menu
- `/usr/share/rpcd/acl.d/luci-app-secubox-security-threats.json` - Permissions

**Runtime :**
- `/tmp/secubox-threats-history.json` - Historique des menaces (volatile)

## Licence

Apache-2.0

## Auteurs

CyberMind.fr - Gandalf

## Version

1.0.0 (2026-01-07)
