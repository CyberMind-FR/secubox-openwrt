[English](README.md) | Francais | [中文](README.zh.md)

# LuCI SecuBox Service Exposure Manager

Interface unifiee pour exposer les services locaux via les services caches Tor et le proxy inverse SSL HAProxy, avec detection des conflits de ports.

## Installation

```bash
opkg install luci-app-exposure
```

## Acces

Menu LuCI : **SecuBox -> Reseau -> Exposition de services**

## Onglets

- **Apercu** -- Scanner les services en ecoute, detecter les conflits de ports
- **Services** -- Gerer les ports de services exposes
- **Tor Hidden** -- Creer et gerer les services caches .onion
- **Proxy SSL** -- Configurer les entrees du proxy inverse SSL HAProxy

## Methodes RPCD

Backend : `luci.exposure`

| Methode | Description |
|---------|-------------|
| `scan` | Scanner tous les services et ports en ecoute |
| `conflicts` | Detecter les conflits de ports entre services |
| `status` | Obtenir le statut du gestionnaire d'exposition |
| `tor_list` | Lister les services caches Tor |
| `ssl_list` | Lister les entrees du proxy inverse SSL |
| `get_config` | Obtenir la configuration d'exposition |
| `fix_port` | Reassigner un port de service en conflit |
| `tor_add` | Ajouter un service cache Tor |
| `tor_remove` | Supprimer un service cache Tor |
| `ssl_add` | Ajouter une entree de proxy inverse SSL |
| `ssl_remove` | Supprimer une entree de proxy inverse SSL |

## Dependances

- `luci-base`
- `secubox-app-exposure`

## Licence

Apache-2.0
