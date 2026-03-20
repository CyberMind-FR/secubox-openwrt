[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Jellyfin Media Server

Serveur multimedia gratuit pour streamer films, series TV, musique et photos. Execute Jellyfin dans Docker sur les systemes OpenWrt SecuBox.

## Installation

```sh
opkg install secubox-app-jellyfin
jellyfinctl install
```

## Configuration

Fichier de configuration UCI : `/etc/config/jellyfin`

```
config jellyfin 'main'
    option enabled '0'
    option image 'jellyfin/jellyfin:latest'
    option data_path '/srv/jellyfin'
    option port '8096'
    option timezone 'Europe/Paris'

config jellyfin 'media'
    list media_path '/mnt/media/movies'
    list media_path '/mnt/media/music'

config jellyfin 'network'
    option domain 'jellyfin.secubox.local'
    option haproxy '0'
    option firewall_wan '0'

config jellyfin 'transcoding'
    option hw_accel '0'

config jellyfin 'mesh'
    option enabled '0'
```

## Utilisation

```sh
# Controle du service
/etc/init.d/jellyfin start
/etc/init.d/jellyfin stop

# CLI du controleur
jellyfinctl install           # Telecharger l'image Docker et creer le conteneur
jellyfinctl status            # Afficher le statut du conteneur et des integrations
jellyfinctl update            # Telecharger la derniere image et recreer le conteneur
jellyfinctl logs              # Afficher les logs du conteneur (-f pour suivre)
jellyfinctl shell             # Ouvrir un shell dans le conteneur
jellyfinctl backup            # Sauvegarder la config et les donnees
jellyfinctl restore <file>    # Restaurer depuis une archive de sauvegarde
jellyfinctl uninstall         # Arreter et supprimer le conteneur et les donnees

# Integrations
jellyfinctl configure-haproxy # Enregistrer le vhost HAProxy avec SSL
jellyfinctl remove-haproxy    # Supprimer le vhost HAProxy
jellyfinctl configure-fw      # Ouvrir le port WAN du firewall
jellyfinctl remove-fw         # Fermer le port WAN du firewall
jellyfinctl register-mesh     # Enregistrer dans le mesh P2P SecuBox
jellyfinctl unregister-mesh   # Supprimer du registre mesh
```

Interface Web : `http://<device-ip>:8096`

## Fonctionnalites

- Jellyfin base sur Docker avec gestion complete du cycle de vie
- Bibliotheques multimedia multi-chemins (films, musique, photos, series)
- Support du transcodage GPU materiel
- Reverse proxy HAProxy avec integration SSL/ACME
- Exposition du port WAN via firewall
- Enregistrement du service mesh P2P SecuBox
- Sauvegarde/restauration complete de la config et des donnees
- Acces shell au conteneur et streaming des logs

## Fichiers

- `/etc/config/jellyfin` -- Configuration UCI
- `/etc/init.d/jellyfin` -- Script de service procd
- `/usr/sbin/jellyfinctl` -- CLI du controleur

## Dependances

- `dockerd`
- `docker`
- `containerd`

## Licence

Apache-2.0
