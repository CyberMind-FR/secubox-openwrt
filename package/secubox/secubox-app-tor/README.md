English | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox Tor Shield

Tor integration for OpenWrt providing transparent proxy, SOCKS proxy, DNS over Tor, kill switch, hidden services, and bridge support.

## Installation

```bash
opkg install secubox-app-tor
```

## Configuration

UCI config file: `/etc/config/tor-shield`

```bash
uci set tor-shield.main.enabled='1'
uci set tor-shield.main.mode='transparent'
uci set tor-shield.main.dns_over_tor='1'
uci set tor-shield.main.kill_switch='0'
uci commit tor-shield
```

## Usage

```bash
torctl start           # Start Tor service
torctl stop            # Stop Tor service
torctl status          # Show Tor status and circuits
torctl newnym          # Request new Tor identity
torctl bridges         # Manage bridge relays
torctl hidden add      # Create a hidden service
torctl hidden list     # List hidden services
torctl killswitch on   # Enable kill switch (block non-Tor traffic)
torctl killswitch off  # Disable kill switch
```

## Modes

- **Transparent proxy** -- All LAN traffic routed through Tor via iptables
- **SOCKS proxy** -- SOCKS5 endpoint for per-app Tor usage
- **DNS over Tor** -- DNS queries resolved through Tor network
- **Kill switch** -- Blocks all non-Tor traffic if Tor goes down

## Excluded Domains (System Services Bypass)

When Tor Shield is active, certain system services (opkg, NTP, ACME) need direct
internet access. These domains bypass Tor DNS and routing:

- OpenWrt package repositories (`downloads.openwrt.org`, mirrors)
- NTP time servers (`pool.ntp.org`, `time.google.com`)
- Let's Encrypt ACME (`acme-v02.api.letsencrypt.org`)
- DNS provider APIs (Gandi, OVH, Cloudflare)

Configure additional exclusions in UCI:

```bash
uci add_list tor-shield.trans.excluded_domains='my.example.com'
uci commit tor-shield
/etc/init.d/tor-shield restart
```

The exclusions are implemented at two levels:
1. **dnsmasq bypass** -- DNS queries for excluded domains go directly to upstream
2. **iptables RETURN** -- Traffic to resolved IPs bypasses Tor transparent proxy

## Dependencies

- `iptables`
- `curl`
- `jsonfilter`
- `socat`

## License

Apache-2.0
