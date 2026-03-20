# NodogSplash - Captive Portal

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Solution de portail captif legere pour OpenWrt. Fournit une page d'accueil personnalisable avec authentification par clic ou par identifiants pour le controle d'acces au reseau invite.

## Installation

```bash
opkg install secubox-app-nodogsplash
```

## Configuration

Configuration principale : `/etc/nodogsplash/nodogsplash.conf`

Options cles :
```
GatewayInterface br-lan
GatewayAddress 192.168.1.1
MaxClients 250
SessionTimeout 1440
```

## Binaires

| Binaire | Description |
|---------|-------------|
| `/usr/bin/nodogsplash` | Daemon du portail captif |
| `/usr/bin/ndsctl` | Outil de controle a l'execution |

## Utilisation

```bash
# Gestion du service
/etc/init.d/nodogsplash start
/etc/init.d/nodogsplash stop

# Controle a l'execution
ndsctl status          # Afficher l'etat du portail
ndsctl clients         # Lister les clients connectes
ndsctl auth <mac>      # Autoriser un client
ndsctl deauth <mac>    # Revoquer l'autorisation d'un client
```

## Personnalisation

Les modeles de page d'accueil sont dans `/etc/nodogsplash/htdocs/`. Modifiez `splash.html` pour personnaliser l'apparence du portail.

## Dependances

- `libmicrohttpd`
- `libjson-c`
- `iptables-nft`

## Licence

GPL-2.0
