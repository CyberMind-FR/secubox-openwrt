# luci-app-dns-provider

LuCI web interface for the SecuBox DNS Provider Manager.

## Overview

Provides a web UI for managing DNS records via provider APIs (OVH, Gandi, Cloudflare). Two views: Records management and Settings configuration.

## Views

### Records (`dns-provider/records`)
- Status bar: provider, zone, enabled state
- Action buttons: Add Record, Sync HAProxy Vhosts, ACME DNS-01, Refresh
- Zone records display (raw provider API output)
- Add Record modal: type, subdomain, target, TTL
- DNS propagation checker (1.1.1.1, 8.8.8.8, 9.9.9.9)

### Settings (`dns-provider/settings`)
- General: enable, provider select, zone
- OVH: endpoint, app_key, app_secret, consumer_key
- Gandi: API key / PAT
- Cloudflare: API token, zone_id
- Test Credentials button

## RPCD Methods

| Method | Params | Description |
|---|---|---|
| `get_config` | — | Config with masked secrets |
| `list_records` | — | Fetch zone records from provider |
| `add_record` | type, subdomain, target, ttl | Create DNS record |
| `remove_record` | type, subdomain | Delete DNS record |
| `sync_records` | — | Sync HAProxy vhosts to DNS |
| `verify_record` | fqdn | Check propagation |
| `test_credentials` | — | Validate API credentials |
| `acme_dns01` | domain | Issue cert via DNS-01 |

## Files

```
root/usr/libexec/rpcd/luci.dns-provider              RPCD handler
root/usr/share/luci/menu.d/luci-app-dns-provider.json Menu entry
root/usr/share/rpcd/acl.d/luci-app-dns-provider.json  ACL permissions
htdocs/.../view/dns-provider/records.js               Records view
htdocs/.../view/dns-provider/settings.js              Settings view
```

## Dependencies

- `luci-base`
- `secubox-app-dns-provider`
