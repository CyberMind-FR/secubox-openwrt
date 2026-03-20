# MMPM - MagicMirror Package Manager

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Interface web pour gerer les modules MagicMirror. Fournit une interface de gestionnaire de paquets pour decouvrir, installer et configurer les modules MagicMirror2.

## Installation

```bash
opkg install secubox-app-mmpm
```

Necessite que MagicMirror2 soit installe au prealable.

## Configuration

Fichier de configuration UCI : `/etc/config/mmpm`

```bash
uci set mmpm.main.enabled='1'
uci set mmpm.main.port='7890'
uci commit mmpm
```

## Utilisation

```bash
mmpmctl start          # Demarrer le service MMPM
mmpmctl stop           # Arreter le service MMPM
mmpmctl status         # Afficher l'etat du service
mmpmctl list           # Lister les modules installes
mmpmctl search <name>  # Rechercher des modules disponibles
mmpmctl install <mod>  # Installer un module
mmpmctl remove <mod>   # Supprimer un module
```

## Dependances

- `secubox-app-magicmirror2`

## Licence

Apache-2.0
