[English](README.md) | Francais | [中文](README.zh.md)

# Tableau de Bord LuCI Glances

Tableau de bord de surveillance systeme alimente par Glances avec interface web integree.

## Installation

```bash
opkg install luci-app-glances
```

## Acces

Menu LuCI : **SecuBox -> Surveillance -> Glances**

## Onglets

- **Tableau de Bord** -- Metriques CPU, memoire, disque et reseau en un coup d'oeil
- **Interface Web** -- Interface web Glances integree avec theme SecuBox
- **Parametres** -- Intervalles de surveillance, seuils d'alerte, controle du service

## Methodes RPCD

Backend : `luci.glances`

| Methode | Description |
|---------|-------------|
| `get_status` | Statut du service et metriques de base |
| `get_config` | Obtenir la configuration Glances |
| `get_monitoring_config` | Obtenir les parametres de surveillance |
| `get_alerts_config` | Obtenir les parametres de seuils d'alerte |
| `get_web_url` | Obtenir l'URL de l'interface web Glances |
| `service_start` | Demarrer Glances |
| `service_stop` | Arreter Glances |
| `service_restart` | Redemarrer Glances |
| `set_config` | Mettre a jour une cle de configuration |

## Dependances

- `luci-base`
- `secubox-app-glances`

## Licence

Apache-2.0
