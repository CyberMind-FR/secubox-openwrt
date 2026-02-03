# NodogSplash - Captive Portal

Lightweight captive portal solution for OpenWrt. Provides a customizable splash page with click-through or credential-based authentication for guest network access control.

## Installation

```bash
opkg install secubox-app-nodogsplash
```

## Configuration

Main config: `/etc/nodogsplash/nodogsplash.conf`

Key options:
```
GatewayInterface br-lan
GatewayAddress 192.168.1.1
MaxClients 250
SessionTimeout 1440
```

## Binaries

| Binary | Description |
|--------|-------------|
| `/usr/bin/nodogsplash` | Captive portal daemon |
| `/usr/bin/ndsctl` | Runtime control tool |

## Usage

```bash
# Service management
/etc/init.d/nodogsplash start
/etc/init.d/nodogsplash stop

# Runtime control
ndsctl status          # Show portal status
ndsctl clients         # List connected clients
ndsctl auth <mac>      # Authorize a client
ndsctl deauth <mac>    # Deauthorize a client
```

## Customization

Splash page templates are in `/etc/nodogsplash/htdocs/`. Edit `splash.html` to customize the portal appearance.

## Dependencies

- `libmicrohttpd`
- `libjson-c`
- `iptables-nft`

## License

GPL-2.0
