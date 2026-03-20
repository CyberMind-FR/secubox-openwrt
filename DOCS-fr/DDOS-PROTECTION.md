# Guide de Protection DDoS SecuBox

> **Languages:** [English](../DOCS/DDOS-PROTECTION.md) | Francais | [中文](../DOCS-zh/DDOS-PROTECTION.md)

SecuBox fournit une **protection DDoS multi-couches** adaptee aux deployments domestiques, SOHO et PME. Ce document decrit les mecanismes de protection et les options de configuration.

## Apercu des Couches de Protection

| Couche | Composant | Types d'Attaques Attenees |
|--------|-----------|---------------------------|
| **L3** | Pare-feu OpenWrt | Inondation SYN, inondation ICMP, usurpation IP |
| **L4** | nftables/iptables | Inondations de connexions, scans de ports |
| **L4** | CrowdSec | Detection d'attaques distribuees |
| **L7** | HAProxy | Inondation HTTP, slowloris, bombardement de requetes |
| **L7** | mitmproxy WAF | Inondations applicatives, attaques de bots |
| **DNS** | Pare-feu Vortex | C2 de botnet, amplification DNS |
| **Intel** | CrowdSec CAPI | Renseignement partage sur les menaces (50k+ noeuds) |

## Protection Couche 3/4

### Protection contre l'Inondation SYN

Le pare-feu OpenWrt inclut les cookies SYN et la protection contre l'inondation SYN:

```bash
# Verifier l'etat actuel
cat /proc/sys/net/ipv4/tcp_syncookies

# Activer via UCI
uci set firewall.@defaults[0].synflood_protect='1'
uci commit firewall
/etc/init.d/firewall restart
```

### Limites de Suivi de Connexion

Augmenter la taille de la table conntrack pour les scenarios a fort trafic:

```bash
# Verifier les limites actuelles
cat /proc/sys/net/netfilter/nf_conntrack_max
cat /proc/sys/net/netfilter/nf_conntrack_count

# Augmenter la limite (ajouter a /etc/sysctl.conf)
echo "net.netfilter.nf_conntrack_max=131072" >> /etc/sysctl.conf
sysctl -p
```

### Anti-Usurpation (Filtre de Chemin Inverse)

```bash
# Activer le filtre RP
echo 1 > /proc/sys/net/ipv4/conf/all/rp_filter

# Persister dans /etc/sysctl.conf
echo "net.ipv4.conf.all.rp_filter=1" >> /etc/sysctl.conf
```

### Limitation de Debit ICMP

```bash
# Limiter les reponses ICMP (prevenir l'amplification ping flood)
echo 1000 > /proc/sys/net/ipv4/icmp_ratelimit
echo 50 > /proc/sys/net/ipv4/icmp_msgs_per_sec
```

### Rejet des Paquets Invalides

```bash
uci set firewall.@defaults[0].drop_invalid='1'
uci commit firewall
/etc/init.d/firewall restart
```

## Protection CrowdSec

CrowdSec fournit une detection basee sur le comportement et un renseignement collaboratif sur les menaces.

### Installer les Collections DDoS

```bash
# Detection d'inondation HTTP
cscli collections install crowdsecurity/http-dos

# Detection d'attaque HTTP de base
cscli collections install crowdsecurity/base-http-scenarios

# Specifique a Nginx/HAProxy
cscli collections install crowdsecurity/nginx
cscli collections install crowdsecurity/haproxy

# Redemarrer pour appliquer
/etc/init.d/crowdsec restart
```

### Scenarios CrowdSec pour DDoS

| Scenario | Description | Duree de Ban |
|----------|-------------|--------------|
| `crowdsecurity/http-dos-swithcing-ua` | Changement rapide d'user-agent | 4h |
| `crowdsecurity/http-generic-bf` | Force brute HTTP generique | 4h |
| `crowdsecurity/http-slow-bf` | Attaques style Slowloris | 4h |
| `crowdsecurity/http-crawl-non_statics` | Exploration agressive | 4h |

### Voir les Protections Actives

```bash
# Lister les scenarios installes
cscli scenarios list

# Voir les decisions actives (bans)
cscli decisions list

# Voir les metriques en temps reel
cscli metrics
```

## Limitation de Debit HAProxy

HAProxy fournit une limitation de connexion et de requetes pour les services publies.

### Limites de Connexion Globales

Ajouter a `/etc/haproxy/haproxy.cfg`:

```haproxy
global
    maxconn 4096

defaults
    maxconn 2000
    timeout connect 5s
    timeout client 30s
    timeout server 30s
```

### Limitation de Debit par Backend

```haproxy
frontend https_in
    bind *:443 ssl crt /etc/haproxy/certs/

    # Limite de debit: 100 requetes/10s par IP
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }

    # Ralentir les clients agressifs
    http-request tarpit if { sc_http_req_rate(0) gt 50 }
```

### File d'Attente de Connexion (Absorber les Pics)

```haproxy
backend myapp
    server app1 192.168.255.1:8080 maxconn 100 maxqueue 500
```

## WAF L7 mitmproxy

mitmproxy inspecte le trafic HTTP/HTTPS et detecte les attaques de couche applicative.

### Detection d'Inondation

L'addon `secubox_analytics.py` detecte:
- Pics de debit de requetes par IP
- Motifs de requetes anormaux
- Signatures de bots
- Outils de scan automatises

### Activer le WAF

```bash
# Demarrer le conteneur mitmproxy
/etc/init.d/mitmproxy start

# Verifier l'etat
mitmproxyctl status
```

### Voir les Menaces Detectees

```bash
# Menaces recentes
tail -f /srv/mitmproxy/threats.log

# Statistiques des menaces
mitmproxyctl stats
```

## Pare-feu DNS Vortex

Vortex bloque les domaines C2 de botnet connus et les sites de distribution de malware au niveau DNS.

### Activer la Protection

```bash
# Mettre a jour les flux de renseignement sur les menaces
vortex-firewall intel update

# Demarrer la protection
vortex-firewall start

# Verifier les statistiques
vortex-firewall stats
```

### Categories Bloquees

- Domaines de distribution de malware
- Serveurs C2 de botnet (Mirai, Gafgyt, etc.)
- Domaines de phishing
- Pools de minage crypto

## WAF Insider InterceptoR

Le WAF Insider InterceptoR detecte la participation DDoS depuis des appareils LAN compromis:

- **Detection de balise C2** - Identifie les appareils infectes contactant leur serveur
- **Tunneling DNS** - Detecte l'exfiltration de donnees via DNS
- **Motifs de botnet IoT** - Signatures Mirai, Gafgyt, Mozi
- **Activite de minage crypto** - Connexions aux pools de minage

### Verifier les Menaces Internes

```bash
# Voir l'etat d'InterceptoR
ubus call luci.interceptor status

# Verifier les menaces internes dans les logs
grep "insider" /srv/mitmproxy/threats.log
```

## Profil DDoS Config Advisor

Executer la verification de conformite specifique DDoS:

```bash
# Executer toutes les verifications incluant DDoS
config-advisorctl check

# Executer uniquement les verifications DDoS
config-advisorctl check --category ddos

# Auto-remedier les problemes DDoS
config-advisorctl remediate --category ddos
```

### Regles de Verification DDoS

| ID Regle | Verification | Severite |
|----------|--------------|----------|
| DDOS-001 | Cookies SYN actives | Haute |
| DDOS-002 | Limite de suivi de connexion | Moyenne |
| DDOS-003 | CrowdSec http-dos installe | Haute |
| DDOS-004 | Limitation de debit ICMP | Moyenne |
| DDOS-005 | Filtrage de chemin inverse | Haute |
| DDOS-006 | Limites de connexion HAProxy | Moyenne |
| DDOS-007 | WAF mitmproxy actif | Moyenne |
| DDOS-008 | Pare-feu DNS Vortex | Moyenne |

## Limitations

SecuBox est concu pour une echelle domestique/PME. Il **ne peut pas**:

- Absorber des attaques volumetriques plus grandes que votre bande passante WAN
- Fournir une distribution Anycast/CDN
- Agir comme un service de nettoyage

### Pour une Protection DDoS Serieuse

Envisagez d'ajouter une protection en amont:

1. **Cloudflare** - Le niveau gratuit inclut une protection DDoS de base
2. **Cloudflare Spectrum** - Proxy TCP/UDP pour les services non-HTTP
3. **AWS Shield** - Si heberge sur AWS
4. **OVH Anti-DDoS** - Si utilisant l'hebergement OVH

### Configuration Hybride

```
Internet → Cloudflare (nettoyage L3/L4/L7) → SecuBox (WAF L7 + detection interne)
```

## Liste de Controle de Durcissement Rapide

```bash
# 1. Activer les protections pare-feu
uci set firewall.@defaults[0].synflood_protect='1'
uci set firewall.@defaults[0].drop_invalid='1'
uci commit firewall

# 2. Installer la collection DDoS CrowdSec
cscli collections install crowdsecurity/http-dos

# 3. Activer les protections noyau
cat >> /etc/sysctl.conf << 'EOF'
net.ipv4.tcp_syncookies=1
net.ipv4.conf.all.rp_filter=1
net.ipv4.icmp_ratelimit=1000
net.netfilter.nf_conntrack_max=131072
EOF
sysctl -p

# 4. Demarrer le pare-feu DNS Vortex
vortex-firewall intel update
vortex-firewall start

# 5. Verifier avec Config Advisor
config-advisorctl check --category ddos
```

## Surveillance Pendant une Attaque

```bash
# Compte de connexions en temps reel
watch -n 1 'cat /proc/sys/net/netfilter/nf_conntrack_count'

# Activite CrowdSec
watch -n 5 'cscli metrics'

# Bans actifs
cscli decisions list

# Statistiques HAProxy (si active)
echo "show stat" | socat stdio /var/run/haproxy.sock

# Menaces mitmproxy
tail -f /srv/mitmproxy/threats.log
```

## Documentation Connexe

- [Apercu InterceptoR](../package/secubox/luci-app-interceptor/README.md)
- [Tableau de bord CrowdSec](../package/secubox/luci-app-crowdsec-dashboard/README.md)
- [Pare-feu DNS Vortex](../package/secubox/VORTEX-DNS-FIREWALL.md)
- [Config Advisor](../package/secubox/secubox-config-advisor/README.md)
