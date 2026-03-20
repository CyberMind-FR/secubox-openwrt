# Configuration LuCI Jitsi Meet

[English](README.md) | Francais | [中文](README.zh.md)

Gestion du service de videoconference pour Jitsi Meet auto-heberge.

## Installation

```bash
opkg install luci-app-jitsi
```

## Acces

Menu LuCI : **Services -> Jitsi Meet**

## Fonctionnalites

- Orchestration de conteneurs Docker (web, prosody, jicofo, jvb)
- Statistiques de conferences et participants via l'API JVB
- Gestion des utilisateurs pour les reunions authentifiees
- Visualiseur de logs du service

## Methodes RPCD

Backend : `luci.jitsi`

| Methode | Description |
|---------|-------------|
| `status` | Etats des conteneurs, stats conferences/participants |
| `start` | Demarrer les conteneurs Jitsi |
| `stop` | Arreter les conteneurs Jitsi |
| `restart` | Redemarrer tous les conteneurs |
| `install` | Installer la stack Jitsi |
| `generate_config` | Generer les fichiers de configuration Jitsi |
| `add_user` | Ajouter un utilisateur authentifie |
| `remove_user` | Supprimer un utilisateur |
| `list_users` | Lister les utilisateurs enregistres |
| `logs` | Recuperer les logs du service |

## Dependances

- `secubox-app-jitsi`

## Licence

Apache-2.0
