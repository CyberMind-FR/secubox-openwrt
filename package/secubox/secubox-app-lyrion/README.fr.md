[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Lyrion Music Server

Lyrion Music Server (anciennement Logitech Media Server / Squeezebox Server) pour les systemes OpenWrt SecuBox.

## Presentation

Execute Lyrion dans un conteneur LXC Debian Bookworm avec :
- Paquet Debian officiel Lyrion (v9.x)
- Support complet des codecs audio (FLAC, MP3, AAC, etc.)
- Decouverte des lecteurs Squeezebox (UDP 3483)
- Interface web sur port configurable (defaut : 9000)

## Installation

```sh
opkg install secubox-app-lyrion
lyrionctl install   # Cree un conteneur LXC Debian
/etc/init.d/lyrion enable
/etc/init.d/lyrion start
```

## Configuration

Fichier de configuration UCI : `/etc/config/lyrion`

```
config lyrion 'main'
    option enabled '0'
    option port '9000'
    option data_path '/srv/lyrion'
    option media_path '/srv/media'
    option memory_limit '1G'
    option extra_media_paths '/mnt/usb:/mnt/usb'
```

### Chemins Media Supplementaires

Montez des repertoires media additionnels (separes par espaces) :
```
option extra_media_paths '/mnt/MUSIC /mnt/USB:/music/usb'
```

## Utilisation

```sh
# Gestion du service
/etc/init.d/lyrion start
/etc/init.d/lyrion stop
/etc/init.d/lyrion restart

# CLI du controleur
lyrionctl status      # Afficher le statut du conteneur
lyrionctl install     # Creer un conteneur LXC Debian
lyrionctl destroy     # Supprimer le conteneur (conserve la config)
lyrionctl update      # Reconstruire le conteneur avec le dernier Lyrion
lyrionctl logs        # Voir les logs du serveur
lyrionctl logs -f     # Suivre les logs
lyrionctl shell       # Ouvrir un shell dans le conteneur
lyrionctl runtime     # Afficher le runtime detecte
```

## Architecture du Conteneur

Le conteneur utilise Debian Bookworm avec :
- Paquets du depot officiel Lyrion
- Bind mounts pour la config (`/srv/lyrion`) et les medias
- Reseau partage avec l'hote pour la decouverte des lecteurs
- Limites memoire via cgroup2

## Ports

| Port | Protocole | Description |
|------|-----------|-------------|
| 9000 | TCP | Interface web |
| 9090 | TCP | Interface CLI/RPC |
| 3483 | TCP | Slim Protocol (lecteurs) |
| 3483 | UDP | Decouverte des lecteurs |

## Fichiers

- `/etc/config/lyrion` -- Configuration UCI
- `/usr/sbin/lyrionctl` -- CLI du controleur
- `/srv/lyrion/` -- Config et cache persistants
- `/srv/lxc/lyrion/` -- Rootfs du conteneur LXC

## Dependances

- `lxc` (ou `docker`)
- `debootstrap` (auto-installe pour LXC)
- `wget`, `tar`

## Licence

Apache-2.0
