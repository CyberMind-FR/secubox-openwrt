# Tableau de bord LuCI Jellyfin

[English](README.md) | Francais | [中文](README.zh.md)

Interface web pour la gestion du serveur multimedia Jellyfin avec statut en temps reel, controles de conteneur et gestion des integrations.

## Installation

```bash
opkg install luci-app-jellyfin
```

## Acces

Menu LuCI : **Services -> Jellyfin**

## Sections

- **Statut du service** -- Etat du conteneur (en cours/arrete/non installe), temps de fonctionnement, sante Docker, utilisation disque
- **Statut des integrations** -- HAProxy (desactive/en attente/configure), Mesh P2P, Pare-feu WAN
- **Actions** -- Installer, Demarrer, Arreter, Redemarrer, Mettre a jour, Sauvegarder, Desinstaller, Ouvrir l'interface Web
- **Configuration** -- Port, image, chemin des donnees, fuseau horaire, domaine, SSL HAProxy, chemins des medias, transcodage GPU, activation mesh
- **Journaux** -- Visualiseur de logs du conteneur en temps reel (50 dernieres lignes)

## Methodes RPCD

Backend : `luci.jellyfin`

| Methode | Description |
|---------|-------------|
| `status` | Statut complet du service, configuration et integrations |
| `start` | Demarrer le conteneur Jellyfin |
| `stop` | Arreter le conteneur Jellyfin |
| `restart` | Redemarrer le conteneur Jellyfin |
| `install` | Telecharger l'image et creer le conteneur |
| `uninstall` | Supprimer le conteneur et les donnees |
| `update` | Telecharger la derniere image et recreer |
| `configure_haproxy` | Enregistrer le vhost HAProxy |
| `backup` | Creer une sauvegarde de la configuration/donnees |
| `restore` | Restaurer depuis une archive de sauvegarde |
| `logs` | Recuperer les logs du conteneur |

## Dependances

- `luci-base`
- `secubox-app-jellyfin`

## Licence

Apache-2.0
