# secubox-app-dns-provider — History

## v1.0.0 — 2026-02-04

### Initial Release

- Created `secubox-app-dns-provider` package
  - UCI config: main settings, OVH, Gandi, Cloudflare provider sections
  - `dnsctl` CLI: list, add, rm, sync, verify, test, status, acme-dns01
  - OVH adapter: HMAC-SHA1 signed API v1 (ovh-eu, ovh-ca, ovh-us endpoints)
  - Gandi adapter: LiveDNS v5 Bearer token API
  - Cloudflare adapter: API v4 with zone_id

- Created `luci-app-dns-provider` package
  - RPCD handler: get_config, list_records, add_record, remove_record, sync_records, verify_record, test_credentials, acme_dns01
  - Settings view: provider selection, credential forms (OVH/Gandi/Cloudflare), test button
  - Records view: status bar, add record modal, HAProxy sync, ACME DNS-01 modal, propagation checker
  - Menu under admin/secubox/network/dns-provider (Records + Settings tabs)
  - ACL with read/write permissions

### Design Decisions

- **Adapter pattern**: Each provider is a standalone shell script implementing 5 functions (dns_list, dns_add, dns_rm, dns_verify, dns_test_credentials), dynamically loaded via `source`
- **eval curl**: Used for building curl command with headers; shell limitations prevent array-based argument passing in BusyBox
- **HAProxy sync**: cmd_sync iterates UCI vhosts matching the configured zone and creates A records with the public IP from ipv4.icanhazip.com
- **ACME integration**: Exports provider-specific environment variables and delegates to acme.sh's built-in DNS plugins
