# Tableau de bord LuCI Gitea

[English](README.md) | Francais | [中文](README.zh.md)

Tableau de bord de gestion du service d'hebergement Git pour Gitea.

## Installation

```bash
opkg install luci-app-gitea
```

## Acces

Menu LuCI : **Services -> Gitea**

## Onglets

- **Vue d'ensemble** -- Statut du service, sante du conteneur, utilisation du stockage
- **Depots** -- Parcourir et creer des depots Git
- **Utilisateurs** -- Gerer les utilisateurs et les comptes administrateur
- **Parametres** -- Ports HTTP/SSH, domaine, chemin des donnees, limite memoire, politique d'inscription

## Methodes RPCD

Backend : `luci.gitea`

| Methode | Description |
|---------|-------------|
| `get_status` | Statut du service et du conteneur |
| `get_stats` | Statistiques des depots et utilisateurs |
| `get_config` | Obtenir la configuration Gitea |
| `save_config` | Sauvegarder la configuration |
| `start` | Demarrer Gitea |
| `stop` | Arreter Gitea |
| `restart` | Redemarrer Gitea |
| `install` | Installer le conteneur Gitea |
| `uninstall` | Supprimer le conteneur Gitea |
| `update` | Mettre a jour Gitea vers la derniere version |
| `get_logs` | Recuperer les logs du service |
| `list_repos` | Lister tous les depots |
| `get_repo` | Obtenir les details d'un depot |
| `list_users` | Lister tous les utilisateurs |
| `create_admin` | Creer un compte administrateur |
| `create_user` | Creer un compte utilisateur |
| `generate_token` | Generer un jeton d'acces API |
| `create_repo` | Creer un nouveau depot |
| `create_backup` | Creer une sauvegarde des donnees |
| `list_backups` | Lister les sauvegardes disponibles |
| `restore_backup` | Restaurer depuis une sauvegarde |
| `get_install_progress` | Verifier la progression de l'installation |

## Dependances

- `luci-base`
- `secubox-app-gitea`

## Licence

Apache-2.0
