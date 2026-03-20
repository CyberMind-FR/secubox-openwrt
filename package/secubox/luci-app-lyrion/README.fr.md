# LuCI Lyrion Music Server

[English](README.md) | Francais | [中文](README.zh.md)

Tableau de bord de gestion pour Lyrion Music Server (anciennement Logitech Media Server / Squeezebox Server).

## Installation

```bash
opkg install luci-app-lyrion
```

## Acces

Menu LuCI : **Services -> Lyrion**

## Onglets

- **Vue d'ensemble** -- Statut du service, lien vers l'interface web, nombre de lecteurs
- **Parametres** -- Port, chemins des donnees/medias, limite memoire, fuseau horaire, environnement d'execution

## Methodes RPCD

Backend : `luci.lyrion`

| Methode | Description |
|---------|-------------|
| `status` | Statut du service et du conteneur |
| `get_config` | Obtenir la configuration actuelle |
| `save_config` | Sauvegarder la configuration |
| `install` | Installer le conteneur Lyrion |
| `start` | Demarrer Lyrion |
| `stop` | Arreter Lyrion |
| `restart` | Redemarrer Lyrion |
| `update` | Mettre a jour vers la derniere version |
| `logs` | Recuperer les logs du service |

## Dependances

- `luci-base`

## Licence

Apache-2.0
