# SecuBox DNS Guard

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Gestionnaire DNS axe sur la confidentialite avec une liste de fournisseurs curee et support DoH/DoT.

## Installation

```bash
opkg install luci-app-dnsguard
```

## Acces

Menu LuCI : **SecuBox -> Security -> DNS Guard**

## Fonctionnalites

- Liste curee de fournisseurs DNS axes sur la confidentialite (FDN, Quad9, Mullvad, Cloudflare, AdGuard, etc.)
- Changement de fournisseur en un clic avec configuration automatique de dnsmasq
- Support DNS-over-HTTPS (DoH) et DNS-over-TLS (DoT)
- Recommandations de configuration intelligentes basees sur la categorie (confidentialite, securite, blocage de publicites, famille)
- Testeur de resolution DNS integre

## Methodes RPCD

Backend : `luci.dnsguard`

| Methode | Description |
|--------|-------------|
| `status` | Mode DNS actuel, fournisseur actif et serveurs primaire/secondaire |
| `get_providers` | Lister tous les fournisseurs DNS disponibles |
| `get_config` | Obtenir la configuration dnsmasq et AdGuard Home |
| `set_provider` | Basculer vers un fournisseur DNS specifique |
| `smart_config` | Obtenir des recommandations de configuration intelligentes |
| `test_dns` | Tester la resolution DNS contre un serveur |
| `apply` | Appliquer les changements DNS en attente |

## Dependances

- `luci-base`

## Licence

Apache-2.0
