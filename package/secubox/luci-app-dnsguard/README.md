# SecuBox DNS Guard

Privacy DNS manager with curated provider feed and DoH/DoT support.

## Installation

```bash
opkg install luci-app-dnsguard
```

## Access

LuCI menu: **SecuBox -> Security -> DNS Guard**

## Features

- Curated list of privacy-focused DNS providers (FDN, Quad9, Mullvad, Cloudflare, AdGuard, etc.)
- One-click provider switching with automatic dnsmasq configuration
- DNS-over-HTTPS (DoH) and DNS-over-TLS (DoT) support
- Smart config recommendations based on category (privacy, security, adblock, family)
- Built-in DNS resolution tester

## RPCD Methods

Backend: `luci.dnsguard`

| Method | Description |
|--------|-------------|
| `status` | Current DNS mode, active provider, and primary/secondary servers |
| `get_providers` | List all available DNS providers |
| `get_config` | Get dnsmasq and AdGuard Home configuration |
| `set_provider` | Switch to a specific DNS provider |
| `smart_config` | Get smart configuration recommendations |
| `test_dns` | Test DNS resolution against a server |
| `apply` | Apply pending DNS changes |

## Dependencies

- `luci-base`

## License

Apache-2.0
