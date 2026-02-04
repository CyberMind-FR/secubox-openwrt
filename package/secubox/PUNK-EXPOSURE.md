# Punk Exposure Engine

## Vision

Every SecuBox node is a **generative station** — it discovers what runs locally, and offers a unified flow to make any service reachable through all available channels: Tor .onion, classical DNS/HTTPS, P2P mesh, or all three at once.

Three verbs define the workflow:

- **Peek** — Scan, discover, look around. What's running? What's exposed? What domains are mapped? What peers are online?
- **Poke** — Target a service. Pick the exposure channels. Configure the linking flow.
- **Emancipate** — Activate. The service becomes reachable. DNS records are created, certificates are issued, .onion addresses are generated, mesh peers are notified.

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

## Components

### Existing (already built)

| Component | Package | What it does |
|-----------|---------|--------------|
| Service scanner | `secubox-app-exposure` | `netstat` scan enriched with UCI/Docker/process names |
| Tor exposure | `secubox-app-tor` + `secubox-app-exposure` | `tor_add()` creates hidden service dir + torrc entry |
| SSL/HAProxy exposure | `secubox-app-haproxy` + `secubox-app-exposure` | `ssl_add()` creates HAProxy backend + vhost + ACME cert |
| ACME certificates | `secubox-app-haproxy` | `acme.sh` with HTTP-01 webroot validation via port 8402 |
| VHost manager | `luci-app-vhost-manager` | Nginx-based vhost CRUD with ACME + templates |
| P2P mesh | `secubox-p2p` | mDNS discovery, WireGuard mesh, service registry, gossip chain |
| Master-Link | `secubox-master-link` | Hierarchical node onboarding with HMAC tokens + blockchain audit |
| Service registry | `luci-app-service-registry` | Aggregates services across mesh, health checks, landing page |
| Exposure dashboard | `luci-app-exposure` | Single-table KISS view: scan + Tor/SSL toggles per service |

### Missing (to build)

| Component | Purpose | Priority |
|-----------|---------|----------|
| **DNS provider API** | Programmatic DNS record management (OVH, Gandi, Cloudflare) | **High** |
| **DNS-01 ACME** | Wildcard certs + domains without port 80 access | **High** |
| **Unified Poke flow** | Single action to expose service on all channels | Medium |
| **Peek aggregation** | Combined view: local scan + mesh peers + DNS records + Tor | Medium |
| **Emancipate orchestrator** | Atomic multi-channel activation with rollback | Medium |

## DNS Provider API Integration

### Design

New package: `secubox-app-dns-provider`

```
package/secubox/secubox-app-dns-provider/
  files/etc/config/dns-provider     # UCI: provider type, API keys, zone
  files/etc/init.d/dns-provider     # (optional) cron for record sync
  files/usr/sbin/dnsctl             # CLI: record add/rm/list/sync
  files/usr/lib/secubox/dns/        # Provider adapters
    ovh.sh                          # OVH API (app key + secret + consumer key)
    gandi.sh                        # Gandi LiveDNS (API key)
    cloudflare.sh                   # Cloudflare (API token + zone ID)
```

### UCI config

```uci
config dns_provider 'main'
    option enabled '1'
    option provider 'ovh'          # ovh | gandi | cloudflare
    option zone 'example.com'      # managed DNS zone

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

### dnsctl commands

```
dnsctl list                          # List all DNS records in zone
dnsctl add A myservice 1.2.3.4      # Create A record
dnsctl add CNAME blog mycdn.net     # Create CNAME
dnsctl rm A myservice               # Remove record
dnsctl sync                         # Sync local vhosts to DNS records
dnsctl verify myservice.example.com # Check DNS propagation
```

### acme.sh DNS-01 integration

Once `dnsctl` works, enable DNS-01 challenges in `haproxyctl cert add`:

```sh
# Current (HTTP-01 only):
acme.sh --issue -d "$domain" --webroot /var/www/acme-challenge

# New (DNS-01 via provider):
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

This unlocks **wildcard certificates** (`*.example.com`) and domains behind firewalls without port 80.

## The Emancipate Flow

When a user pokes a service and chooses "Emancipate", the orchestrator runs all selected channels atomically:

```
User selects: Gitea (port 3001) → Emancipate [Tor + DNS + Mesh]

1. Tor channel:
   secubox-exposure tor add gitea 3001 80
   → .onion address generated

2. DNS channel:
   dnsctl add A gitea <public-ip>
   haproxyctl vhost add gitea.example.com 3001
   haproxyctl cert add gitea.example.com --dns
   → HTTPS live at gitea.example.com

3. Mesh channel:
   secubox-p2p publish gitea 3001 "Gitea"
   gossip_sync
   → All mesh peers discover the service

4. Registry update:
   Service registry refreshed
   Landing page regenerated
   Exposure dashboard shows all three badges
```

### Rollback on failure

If any channel fails, previously completed channels are not torn down — they remain active. The failure is reported, and the user can retry or remove individual channels via the Exposure dashboard toggles.

## Peek: What Exists Today

The current Exposure dashboard (`luci-app-exposure/services.js`) already implements Peek:

- Scans all listening ports via `netstat -tlnp`
- Enriches with real names from uhttpd, streamlit, Docker, glances configs
- Cross-references Tor hidden services by backend port
- Cross-references HAProxy vhosts by backend port
- Shows toggle switches for Tor and SSL per service

### What Peek needs next

- **DNS records column**: Show which services have DNS A/CNAME records via `dnsctl list`
- **Mesh visibility column**: Show which services are published to mesh peers
- **Multi-node view**: Aggregate services across all mesh peers (already available via `secubox-p2p get_shared_services`)

## Poke: What Exists Today

The toggle switches in the Exposure dashboard are already "Poke" actions:

- Toggle Tor ON → modal → service name + onion port → Enable
- Toggle SSL ON → modal → service name + domain → Enable

### What Poke needs next

- **DNS toggle**: Third toggle column for DNS record management
- **Emancipate button**: "Expose everywhere" single action per service
- **Provider selection**: Choose which DNS zone/provider for the domain

## Integration Points with Existing Packages

| Package | Integration | Direction |
|---------|------------|-----------|
| `secubox-app-exposure` | Peek scan + Tor/SSL add/remove | Already working |
| `secubox-app-haproxy` | HAProxy vhost + ACME cert | Already working |
| `secubox-app-tor` | Hidden service lifecycle | Already working |
| `secubox-p2p` | Service publish + gossip sync | Add `publish` RPC call |
| `luci-app-exposure` | Dashboard: add DNS column + Emancipate button | Frontend extension |
| `secubox-app-dns-provider` | **NEW**: DNS record CRUD via provider APIs | To build |
| `luci-app-dns-provider` | **NEW**: LuCI config for provider credentials | To build |

## Implementation Order

1. **`secubox-app-dns-provider`** — CLI tool + UCI config + provider adapters (OVH first)
2. **DNS-01 in haproxyctl** — Wire `dnsctl` into ACME flow as alternative to HTTP-01
3. **`luci-app-dns-provider`** — LuCI frontend for provider configuration
4. **Exposure dashboard DNS column** — Add DNS toggle + `dnsctl` integration
5. **Emancipate flow** — Unified orchestrator in `secubox-exposure emancipate`
6. **Mesh publish integration** — Wire `secubox-p2p publish` into Emancipate

## Naming Convention

The project uses punk/DIY metaphors:

| Term | Meaning | Technical equivalent |
|------|---------|---------------------|
| **Peek** | Discover, scan, observe | `secubox-exposure scan` + service registry |
| **Poke** | Target, configure, aim | Toggle switches + modal config |
| **Emancipate** | Activate, make free, expose | Multi-channel atomic activation |
| **Station** | A SecuBox node | One OpenWrt device running the mesh |
| **Generative** | Each station can create new endpoints | Docker apps + exposure channels |

## Security Considerations

- DNS provider API keys stored in UCI with restricted ACL
- ACME private keys in `/etc/acme/` with 600 permissions
- Tor hidden service keys in `/var/lib/tor/` owned by tor:tor
- Emancipate flow never exposes 127.0.0.1-only services (guard in scan)
- DNS records only created for services the user explicitly Pokes
- Rollback does NOT auto-delete — user must explicitly remove exposure
