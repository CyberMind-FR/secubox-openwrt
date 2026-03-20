# Punk Exposure Engine

> **Langues**: [English](PUNK-EXPOSURE.md) | Francais | [中文](PUNK-EXPOSURE.zh.md)

## Vision

Chaque noeud SecuBox est une **station generative** — il decouvre ce qui tourne localement et offre un flux unifie pour rendre n'importe quel service accessible via tous les canaux disponibles : Tor .onion, DNS/HTTPS classique, maillage P2P, ou les trois a la fois.

Trois verbes definissent le workflow :

- **Peek** — Scanner, decouvrir, observer. Qu'est-ce qui tourne ? Qu'est-ce qui est expose ? Quels domaines sont mappes ? Quels pairs sont en ligne ?
- **Poke** — Cibler un service. Choisir les canaux d'exposition. Configurer le flux de liaison.
- **Emancipate** — Activer. Le service devient accessible. Les enregistrements DNS sont crees, les certificats sont emis, les adresses .onion sont generees, les pairs du maillage sont notifies.

## Architecture

```
                          EMANCIPATE
                              |
             +----------------+----------------+
             |                |                |
         Tor Layer      DNS/SSL Layer      Mesh Layer
         (.onion)       (HTTPS+ACME)       (P2P peers)
             |                |                |
     tor-shield          haproxyctl        secubox-p2p
     hidden svc       + dns-provider-api   + gossip sync
                      + acme.sh
                              |
                     DNS Provider APIs
                    (OVH, Gandi, Cloudflare)
                              |
                     A/AAAA/CNAME records
                     created programmatically
```

## Composants

### Existants (deja construits)

| Composant | Package | Ce qu'il fait |
|-----------|---------|--------------|
| Scanner de services | `secubox-app-exposure` | Scan `netstat` enrichi avec noms UCI/Docker/processus |
| Exposition Tor | `secubox-app-tor` + `secubox-app-exposure` | `tor_add()` cree le repertoire hidden service + entree torrc |
| Exposition SSL/HAProxy | `secubox-app-haproxy` + `secubox-app-exposure` | `ssl_add()` cree le backend HAProxy + vhost + certificat ACME |
| Certificats ACME | `secubox-app-haproxy` | `acme.sh` avec validation HTTP-01 webroot via port 8402 |
| Gestionnaire VHost | `luci-app-vhost-manager` | CRUD vhost Nginx avec ACME + templates |
| Maillage P2P | `secubox-p2p` | Decouverte mDNS, maillage WireGuard, registre de services, chaine gossip |
| Master-Link | `secubox-master-link` | Onboarding hierarchique de noeuds avec tokens HMAC + audit blockchain |
| Registre de services | `luci-app-service-registry` | Agregation des services a travers le maillage, health checks, page d'accueil |
| Tableau de bord Exposure | `luci-app-exposure` | Vue KISS mono-table : scan + toggles Tor/SSL par service |

### Manquants (a construire)

| Composant | Objectif | Priorite |
|-----------|---------|----------|
| **API fournisseur DNS** | Gestion programmatique des enregistrements DNS (OVH, Gandi, Cloudflare) | **Haute** |
| **ACME DNS-01** | Certificats wildcard + domaines sans acces port 80 | **Haute** |
| **Flux Poke unifie** | Action unique pour exposer un service sur tous les canaux | Moyenne |
| **Agregation Peek** | Vue combinee : scan local + pairs maillage + enregistrements DNS + Tor | Moyenne |
| **Orchestrateur Emancipate** | Activation multi-canaux atomique avec rollback | Moyenne |

## Integration API Fournisseur DNS

### Conception

Nouveau package : `secubox-app-dns-provider`

```
package/secubox/secubox-app-dns-provider/
  files/etc/config/dns-provider     # UCI: type fournisseur, cles API, zone
  files/etc/init.d/dns-provider     # (optionnel) cron pour sync enregistrements
  files/usr/sbin/dnsctl             # CLI: record add/rm/list/sync
  files/usr/lib/secubox/dns/        # Adaptateurs fournisseurs
    ovh.sh                          # API OVH (app key + secret + consumer key)
    gandi.sh                        # Gandi LiveDNS (cle API)
    cloudflare.sh                   # Cloudflare (token API + zone ID)
```

### Config UCI

```uci
config dns_provider 'main'
    option enabled '1'
    option provider 'ovh'          # ovh | gandi | cloudflare
    option zone 'example.com'      # zone DNS geree

config ovh 'ovh'
    option endpoint 'ovh-eu'       # ovh-eu | ovh-ca | ovh-us
    option app_key ''
    option app_secret ''
    option consumer_key ''

config gandi 'gandi'
    option api_key ''

config cloudflare 'cloudflare'
    option api_token ''
    option zone_id ''
```

### Commandes dnsctl

```
dnsctl list                          # Lister tous les enregistrements DNS de la zone
dnsctl add A myservice 1.2.3.4      # Creer enregistrement A
dnsctl add CNAME blog mycdn.net     # Creer CNAME
dnsctl rm A myservice               # Supprimer enregistrement
dnsctl sync                         # Synchroniser vhosts locaux vers enregistrements DNS
dnsctl verify myservice.example.com # Verifier propagation DNS
```

### Integration acme.sh DNS-01

Une fois que `dnsctl` fonctionne, activer les challenges DNS-01 dans `haproxyctl cert add` :

```sh
# Actuel (HTTP-01 uniquement):
acme.sh --issue -d "$domain" --webroot /var/www/acme-challenge

# Nouveau (DNS-01 via fournisseur):
provider=$(uci -q get dns-provider.main.provider)
case "$provider" in
    ovh)
        export OVH_END_POINT=$(uci -q get dns-provider.ovh.endpoint)
        export OVH_APPLICATION_KEY=$(uci -q get dns-provider.ovh.app_key)
        export OVH_APPLICATION_SECRET=$(uci -q get dns-provider.ovh.app_secret)
        export OVH_CONSUMER_KEY=$(uci -q get dns-provider.ovh.consumer_key)
        acme.sh --issue -d "$domain" --dns dns_ovh
        ;;
    gandi)
        export GANDI_LIVEDNS_KEY=$(uci -q get dns-provider.gandi.api_key)
        acme.sh --issue -d "$domain" --dns dns_gandi_livedns
        ;;
    cloudflare)
        export CF_Token=$(uci -q get dns-provider.cloudflare.api_token)
        export CF_Zone_ID=$(uci -q get dns-provider.cloudflare.zone_id)
        acme.sh --issue -d "$domain" --dns dns_cf
        ;;
esac
```

Cela debloque les **certificats wildcard** (`*.example.com`) et les domaines derriere des firewalls sans port 80.

## Le Flux Emancipate

Quand un utilisateur poke un service et choisit "Emancipate", l'orchestrateur execute tous les canaux selectionnes de maniere atomique :

```
L'utilisateur selectionne : Gitea (port 3001) → Emancipate [Tor + DNS + Mesh]

1. Canal Tor:
   secubox-exposure tor add gitea 3001 80
   → adresse .onion generee

2. Canal DNS:
   dnsctl add A gitea <public-ip>
   haproxyctl vhost add gitea.example.com 3001
   haproxyctl cert add gitea.example.com --dns
   → HTTPS actif sur gitea.example.com

3. Canal Mesh:
   secubox-p2p publish gitea 3001 "Gitea"
   gossip_sync
   → Tous les pairs du maillage decouvrent le service

4. Mise a jour du registre:
   Registre de services rafraichi
   Page d'accueil regeneree
   Tableau de bord Exposure affiche les trois badges
```

### Rollback en cas d'echec

Si un canal echoue, les canaux precedemment completes ne sont pas demontes — ils restent actifs. L'echec est signale, et l'utilisateur peut reessayer ou supprimer des canaux individuels via les toggles du tableau de bord Exposure.

## Peek : Ce Qui Existe Aujourd'hui

Le tableau de bord Exposure actuel (`luci-app-exposure/services.js`) implemente deja Peek :

- Scanne tous les ports en ecoute via `netstat -tlnp`
- Enrichit avec les vrais noms depuis uhttpd, streamlit, Docker, configs glances
- Reference croisee des hidden services Tor par port backend
- Reference croisee des vhosts HAProxy par port backend
- Affiche des interrupteurs toggle pour Tor et SSL par service

### Ce dont Peek a besoin ensuite

- **Colonne enregistrements DNS** : Montrer quels services ont des enregistrements DNS A/CNAME via `dnsctl list`
- **Colonne visibilite Mesh** : Montrer quels services sont publies aux pairs du maillage
- **Vue multi-noeuds** : Agreger les services de tous les pairs du maillage (deja disponible via `secubox-p2p get_shared_services`)

## Poke : Ce Qui Existe Aujourd'hui

Les interrupteurs toggle dans le tableau de bord Exposure sont deja des actions "Poke" :

- Toggle Tor ON → modal → nom du service + port onion → Activer
- Toggle SSL ON → modal → nom du service + domaine → Activer

### Ce dont Poke a besoin ensuite

- **Toggle DNS** : Troisieme colonne toggle pour la gestion des enregistrements DNS
- **Bouton Emancipate** : Action unique "Exposer partout" par service
- **Selection du fournisseur** : Choisir quelle zone DNS/fournisseur pour le domaine

## Points d'Integration avec les Packages Existants

| Package | Integration | Direction |
|---------|------------|-----------|
| `secubox-app-exposure` | Scan Peek + ajout/suppression Tor/SSL | Deja fonctionnel |
| `secubox-app-haproxy` | Vhost HAProxy + certificat ACME | Deja fonctionnel |
| `secubox-app-tor` | Cycle de vie hidden service | Deja fonctionnel |
| `secubox-p2p` | Publication service + gossip sync | Ajouter appel RPC `publish` |
| `luci-app-exposure` | Tableau de bord : ajouter colonne DNS + bouton Emancipate | Extension frontend |
| `secubox-app-dns-provider` | **NOUVEAU** : CRUD enregistrements DNS via APIs fournisseurs | A construire |
| `luci-app-dns-provider` | **NOUVEAU** : Config LuCI pour identifiants fournisseur | A construire |

## Ordre d'Implementation

1. **`secubox-app-dns-provider`** — Outil CLI + config UCI + adaptateurs fournisseurs (OVH d'abord)
2. **DNS-01 dans haproxyctl** — Connecter `dnsctl` au flux ACME comme alternative a HTTP-01
3. **`luci-app-dns-provider`** — Frontend LuCI pour configuration fournisseur
4. **Colonne DNS du tableau de bord Exposure** — Ajouter toggle DNS + integration `dnsctl`
5. **Flux Emancipate** — Orchestrateur unifie dans `secubox-exposure emancipate`
6. **Integration publication Mesh** — Connecter `secubox-p2p publish` a Emancipate

## Convention de Nommage

Le projet utilise des metaphores punk/DIY :

| Terme | Signification | Equivalent technique |
|------|---------|---------------------|
| **Peek** | Decouvrir, scanner, observer | `secubox-exposure scan` + registre de services |
| **Poke** | Cibler, configurer, viser | Interrupteurs toggle + config modal |
| **Emancipate** | Activer, liberer, exposer | Activation multi-canaux atomique |
| **Station** | Un noeud SecuBox | Un appareil OpenWrt executant le maillage |
| **Generative** | Chaque station peut creer de nouveaux endpoints | Apps Docker + canaux d'exposition |

## Considerations de Securite

- Cles API fournisseur DNS stockees dans UCI avec ACL restreint
- Cles privees ACME dans `/etc/acme/` avec permissions 600
- Cles hidden service Tor dans `/var/lib/tor/` proprietaire tor:tor
- Le flux Emancipate n'expose jamais les services 127.0.0.1 uniquement (garde dans le scan)
- Enregistrements DNS crees uniquement pour les services que l'utilisateur Poke explicitement
- Le rollback ne supprime PAS automatiquement — l'utilisateur doit explicitement retirer l'exposition
