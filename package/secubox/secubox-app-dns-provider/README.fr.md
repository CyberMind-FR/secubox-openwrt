[English](README.md) | Francais | [中文](README.zh.md)

# secubox-app-dns-provider

Gestion programmatique des enregistrements DNS via les APIs REST des fournisseurs. Fait partie de l'ecosysteme SecuBox.

## Presentation

Gere les zones DNS via les APIs OVH, Gandi et Cloudflare. Fournit un outil CLI (`dnsctl`) pour les operations CRUD sur les enregistrements, la synchronisation des vhosts HAProxy, la verification de la propagation DNS et l'emission de certificats ACME DNS-01.

## Architecture

```
dnsctl (CLI)
  |-- load_provider() -> sources /usr/lib/secubox/dns/{provider}.sh
  |-- cmd_list/add/rm -> delegue a dns_list/dns_add/dns_rm
  |-- cmd_sync -> itere sur les vhosts UCI HAProxy -> dns_add par domaine
  |-- cmd_verify -> nslookup sur 1.1.1.1, 8.8.8.8, 9.9.9.9
  +-- cmd_acme_dns01 -> exporte les variables d'env du fournisseur -> acme.sh --dns
```

## Adaptateurs de Fournisseurs

Chaque adaptateur dans `/usr/lib/secubox/dns/` implemente :

| Fonction | Description |
|---|---|
| `dns_list(zone)` | Lister tous les enregistrements de la zone |
| `dns_add(zone, type, subdomain, target, ttl)` | Creer un enregistrement |
| `dns_rm(zone, type, subdomain)` | Supprimer un enregistrement |
| `dns_verify(fqdn)` | Verifier la resolution |
| `dns_test_credentials()` | Valider les cles API |

### Fournisseurs Supportes

- **OVH** -- API v1 signee HMAC-SHA1 (app_key + app_secret + consumer_key)
- **Gandi** -- LiveDNS v5 avec token Bearer
- **Cloudflare** -- API v4 avec token Bearer + zone_id

## Configuration UCI

```
/etc/config/dns-provider
  config dns_provider 'main'     -> enabled, provider, zone
  config ovh 'ovh'               -> endpoint, app_key, app_secret, consumer_key
  config gandi 'gandi'           -> api_key
  config cloudflare 'cloudflare' -> api_token, zone_id
```

## Utilisation CLI

### Operations de Base

```bash
dnsctl status                          # Afficher le statut de configuration
dnsctl test                            # Verifier les credentials API
dnsctl list                            # Lister les enregistrements de la zone
dnsctl add A myservice 1.2.3.4        # Creer un enregistrement A
dnsctl add CNAME www mycdn.net        # Creer un CNAME
dnsctl update A myservice 5.6.7.8     # Mettre a jour un enregistrement existant
dnsctl get A www                       # Obtenir la valeur d'un enregistrement
dnsctl rm A myservice                  # Supprimer un enregistrement
dnsctl domains                         # Lister tous les domaines du compte
```

### Synchronisation HAProxy

```bash
dnsctl sync                            # Synchroniser les vhosts HAProxy vers les enregistrements A DNS
dnsctl verify myservice.example.com    # Verifier la propagation (1.1.1.1, 8.8.8.8, 9.9.9.9)
```

### Generateur de Sous-domaines

```bash
dnsctl generate gitea                  # Creer automatiquement gitea.zone avec l'IP publique
dnsctl generate api prod               # Creer prod-api.zone
dnsctl suggest web                     # Afficher les suggestions de noms de sous-domaines
dnsctl suggest mail                    # Suggestions : mail, smtp, imap, webmail, mx
dnsctl suggest dev                     # Suggestions : git, dev, staging, test, ci
```

### DynDNS

```bash
dnsctl dyndns                          # Mettre a jour l'enregistrement A racine avec l'IP WAN
dnsctl dyndns api 300                  # Mettre a jour api.zone avec un TTL de 5min
```

### Configuration DNS Mail

```bash
dnsctl mail-setup                      # Creer les enregistrements MX, SPF, DMARC
dnsctl mail-setup mail 10              # Nom d'hote et priorite personnalises
dnsctl dkim-add mail '<public-key>'    # Ajouter un enregistrement TXT DKIM
```

### Certificats SSL

```bash
dnsctl acme-dns01 example.com          # Emettre un certificat via challenge DNS-01
dnsctl acme-dns01 '*.example.com'      # Certificat wildcard via DNS-01
```

## Dependances

- `curl` -- Client HTTP pour les appels API
- `openssl-util` -- Signature HMAC-SHA1 (OVH)
- `jsonfilter` -- Parsing JSON (natif OpenWrt)
- `acme.sh` -- Emission de certificats (optionnel, pour DNS-01)

## Fichiers

```
/etc/config/dns-provider               Configuration UCI
/usr/sbin/dnsctl                       Controleur CLI
/usr/lib/secubox/dns/ovh.sh            Adaptateur OVH
/usr/lib/secubox/dns/gandi.sh          Adaptateur Gandi
/usr/lib/secubox/dns/cloudflare.sh     Adaptateur Cloudflare
```
