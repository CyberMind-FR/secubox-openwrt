# secubox-app-dns-provider

Programmatic DNS record management via provider REST APIs. Part of the SecuBox ecosystem.

## Overview

Manages DNS zones through OVH, Gandi, and Cloudflare APIs. Provides a CLI tool (`dnsctl`) for record CRUD, HAProxy vhost sync, DNS propagation verification, and ACME DNS-01 certificate issuance.

## Architecture

```
dnsctl (CLI)
  ├── load_provider() → sources /usr/lib/secubox/dns/{provider}.sh
  ├── cmd_list/add/rm → delegates to dns_list/dns_add/dns_rm
  ├── cmd_sync → iterates HAProxy UCI vhosts → dns_add per domain
  ├── cmd_verify → nslookup against 1.1.1.1, 8.8.8.8, 9.9.9.9
  └── cmd_acme_dns01 → exports provider env vars → acme.sh --dns
```

## Provider Adapters

Each adapter in `/usr/lib/secubox/dns/` implements:

| Function | Description |
|---|---|
| `dns_list(zone)` | List all records in zone |
| `dns_add(zone, type, subdomain, target, ttl)` | Create record |
| `dns_rm(zone, type, subdomain)` | Delete record |
| `dns_verify(fqdn)` | Check resolution |
| `dns_test_credentials()` | Validate API keys |

### Supported Providers

- **OVH** — HMAC-SHA1 signed API v1 (app_key + app_secret + consumer_key)
- **Gandi** — LiveDNS v5 with Bearer token
- **Cloudflare** — API v4 with Bearer token + zone_id

## UCI Configuration

```
/etc/config/dns-provider
  config dns_provider 'main'     → enabled, provider, zone
  config ovh 'ovh'               → endpoint, app_key, app_secret, consumer_key
  config gandi 'gandi'           → api_key
  config cloudflare 'cloudflare' → api_token, zone_id
```

## CLI Usage

### Basic Operations

```bash
dnsctl status                          # Show config status
dnsctl test                            # Verify API credentials
dnsctl list                            # List zone records
dnsctl add A myservice 1.2.3.4        # Create A record
dnsctl add CNAME www mycdn.net        # Create CNAME
dnsctl update A myservice 5.6.7.8     # Update existing record
dnsctl get A www                       # Get record value
dnsctl rm A myservice                  # Remove record
dnsctl domains                         # List all domains in account
```

### HAProxy Sync

```bash
dnsctl sync                            # Sync HAProxy vhosts to DNS A records
dnsctl verify myservice.example.com    # Check propagation (1.1.1.1, 8.8.8.8, 9.9.9.9)
```

### Subdomain Generator

```bash
dnsctl generate gitea                  # Auto-create gitea.zone with public IP
dnsctl generate api prod               # Create prod-api.zone
dnsctl suggest web                     # Show subdomain name suggestions
dnsctl suggest mail                    # Suggestions: mail, smtp, imap, webmail, mx
dnsctl suggest dev                     # Suggestions: git, dev, staging, test, ci
```

### DynDNS

```bash
dnsctl dyndns                          # Update root A record with WAN IP
dnsctl dyndns api 300                  # Update api.zone with 5min TTL
```

### Mail DNS Setup

```bash
dnsctl mail-setup                      # Create MX, SPF, DMARC records
dnsctl mail-setup mail 10              # Custom hostname and priority
dnsctl dkim-add mail '<public-key>'    # Add DKIM TXT record
```

### SSL Certificates

```bash
dnsctl acme-dns01 example.com          # Issue cert via DNS-01 challenge
dnsctl acme-dns01 '*.example.com'      # Wildcard cert via DNS-01
```

## Dependencies

- `curl` — HTTP client for API calls
- `openssl-util` — HMAC-SHA1 signing (OVH)
- `jsonfilter` — JSON parsing (OpenWrt native)
- `acme.sh` — Certificate issuance (optional, for DNS-01)

## Files

```
/etc/config/dns-provider               UCI configuration
/usr/sbin/dnsctl                       CLI controller
/usr/lib/secubox/dns/ovh.sh            OVH adapter
/usr/lib/secubox/dns/gandi.sh          Gandi adapter
/usr/lib/secubox/dns/cloudflare.sh     Cloudflare adapter
```
