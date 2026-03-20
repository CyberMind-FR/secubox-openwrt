# SecuBox mitmproxy App

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Conteneur LXC avec mitmproxy pour l'inspection du trafic HTTPS et la detection des menaces.

## Support multi-instances

SecuBox prend en charge plusieurs instances mitmproxy pour differents flux de trafic :

| Instance | Objectif | Port proxy | Port web | Mode |
|----------|----------|------------|----------|------|
| **out** | LAN → Internet (proxy sortant) | 8888 | 8089 | transparent |
| **in** | WAN → Services (WAF/reverse) | 8889 | 8090 | upstream |

### Commandes d'instance

```bash
# Lister toutes les instances
mitmproxyctl list-instances

# Statut d'une instance specifique
mitmproxyctl status out
mitmproxyctl status in

# Shell dans une instance
mitmproxyctl shell in

# Demarrer/arreter les instances (via init.d)
/etc/init.d/mitmproxy start
/etc/init.d/mitmproxy stop
```

### Configuration UCI

Les instances sont configurees dans `/etc/config/mitmproxy` :

```
config instance 'out'
    option enabled '1'
    option description 'LAN->Internet Proxy'
    option container_name 'mitmproxy-out'
    option proxy_port '8888'
    option web_port '8089'
    option mode 'transparent'

config instance 'in'
    option enabled '1'
    option description 'WAF/Reverse Proxy'
    option container_name 'mitmproxy-in'
    option proxy_port '8889'
    option web_port '8090'
    option mode 'upstream'
    option haproxy_backend '1'
```

## Composants

| Composant | Description |
|-----------|-------------|
| **Conteneurs LXC** | Conteneurs bases sur Debian avec mitmproxy (un par instance) |
| **secubox_analytics.py** | Addon de detection des menaces pour mitmproxy |
| **haproxy_router.py** | Addon de routage backend HAProxy |
| **Integration CrowdSec** | Journalisation des menaces pour le bannissement automatique des IP |

## Modeles de detection des menaces

### Types d'attaques detectees

| Categorie | Modeles |
|-----------|---------|
| **Injection SQL** | UNION SELECT, OR 1=1, SLEEP(), BENCHMARK() |
| **XSS** | `<script>`, gestionnaires d'evenements, URLs javascript: |
| **Injection de commande** | ; cat, \| ls, backticks, $() |
| **Traversee de chemin** | ../, %2e%2e/, file:// |
| **SSRF** | IPs internes, endpoints de metadonnees |
| **XXE** | <!ENTITY, SYSTEM, file:// |
| **Injection LDAP** | )(|, )(&, objectclass=* |
| **Log4Shell** | ${jndi:, ${env:, ldap:// |
| **SSTI** | {{...}}, ${...}, <%...%> |
| **Pollution de prototype** | __proto__, constructor[ |
| **Abus GraphQL** | Imbrication profonde, introspection |
| **Attaques JWT** | alg:none, tokens exposes |

### Detection CVE

| CVE | Description |
|-----|-------------|
| CVE-2021-44228 | Log4Shell (RCE Log4j) |
| CVE-2021-41773 | Traversee de chemin Apache |
| CVE-2022-22965 | Spring4Shell |
| CVE-2023-34362 | Injection SQL MOVEit |
| CVE-2024-3400 | Injection de commande PAN-OS |
| CVE-2024-21887 | Ivanti Connect Secure |
| CVE-2024-1709 | Contournement d'auth ScreenConnect |
| CVE-2024-27198 | Contournement d'auth TeamCity |

### Detection de scanners

Detecte les scanners de securite : sqlmap, nikto, nuclei, burpsuite, nmap, dirb, gobuster, ffuf, etc.

## Integration CrowdSec

Les menaces sont journalisees dans `/data/threats.log` (monte comme `/srv/mitmproxy/threats.log` sur l'hote).

Scenarios CrowdSec :
- `secubox/mitmproxy-attack` - Bannit apres 3 attaques high/critical
- `secubox/mitmproxy-scanner` - Bannit les scanners agressifs
- `secubox/mitmproxy-ssrf` - Bannit les tentatives SSRF externes
- `secubox/mitmproxy-cve` - Bannissement immediat pour les exploits CVE

## GeoIP

Installez GeoLite2-Country.mmdb dans `/srv/mitmproxy/` pour la detection de pays :
```bash
curl -sL "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-Country.mmdb" \
  -o /srv/mitmproxy/GeoLite2-Country.mmdb
```

## Chemins des fichiers

| Chemin | Description |
|--------|-------------|
| `/srv/mitmproxy/` | Repertoire de montage de l'hote |
| `/srv/mitmproxy/threats.log` | Journal des menaces CrowdSec |
| `/srv/mitmproxy/addons/` | Scripts addon mitmproxy |
| `/srv/mitmproxy/GeoLite2-Country.mmdb` | Base de donnees GeoIP |

## Integration HAProxy et routage

### Architecture du flux de trafic

```
┌─────────────────────────────────────────────────────────────────┐
│                      INTERNET                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  HAProxy (ports 80/443)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Frontend : Recoit les requetes HTTPS                     │   │
│  │ ACL : Routage par header Host vers les vhosts            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Backend : mitmproxy_inspector (127.0.0.1:8890)           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Conteneur LXC mitmproxy (port 8890)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ haproxy_router.py : Routage par header Host              │   │
│  │ secubox_analytics.py : Detection des menaces             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│           Journalise les menaces dans /data/threats.log         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Services backend                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Gitea   │  │ Streamlit│  │ Glances  │  │  LuCI    │        │
│  │  :3000   │  │  :8501   │  │  :61208  │  │  :8081   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Commande de synchronisation des routes

Synchronise les configurations vhost HAProxy vers la table de routage mitmproxy :

```bash
mitmproxyctl sync-routes
```

Cela genere `/srv/mitmproxy/haproxy-routes.json` :

```json
{
  "devel.cybermind.fr": ["192.168.255.1", 3000],
  "play.cybermind.fr": ["192.168.255.1", 8501],
  "glances.maegia.tv": ["192.168.255.1", 61208],
  "factory.maegia.tv": ["192.168.255.1", 7331]
}
```

### Commandes d'integration HAProxy

| Commande | Description |
|----------|-------------|
| `mitmproxyctl haproxy-enable` | Activer l'inspection des menaces pour tous les vhosts |
| `mitmproxyctl haproxy-disable` | Desactiver l'inspection, restaurer les backends directs |
| `mitmproxyctl sync-routes` | Regenerer les routes depuis la config HAProxy actuelle |

### Activer l'inspection HAProxy

```bash
# Activer le mode inspection
mitmproxyctl haproxy-enable

# Cela va :
# 1. Creer le backend mitmproxy_inspector (127.0.0.1:8890)
# 2. Stocker les backends originaux dans UCI (haproxy.$vhost.original_backend)
# 3. Rediriger tous les vhosts via mitmproxy
# 4. Synchroniser les mappages de routes
# 5. Redemarrer les services
```

### Ports

| Port | Instance | Service |
|------|----------|---------|
| 8888 | out | Port proxy (sortant LAN) |
| 8889 | in | Port proxy (HAProxy/WAF) |
| 8089 | out | UI mitmweb (sortant) |
| 8090 | in | UI mitmweb (WAF) |

### Addon haproxy_router.py

L'addon de routage :
- Charge les routes depuis `/data/haproxy-routes.json`
- Route les requetes par header Host vers les vrais backends
- Stocke l'hote original dans `flow.metadata['original_host']`
- Fallback vers LuCI (127.0.0.1:8081) pour les hotes inconnus

### Format du fichier de routes

```json
{
  "hostname": ["ip", port],
  "*.wildcard.domain": ["ip", port]
}
```

Supporte la correspondance wildcard avec les motifs `*.domain.tld`.

## Dependances

- `lxc` - Runtime de conteneur
- `crowdsec` - Intelligence des menaces (optionnel)
- `geoip2` - Bibliotheque Python GeoIP (optionnel)
