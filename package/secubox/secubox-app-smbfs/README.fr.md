# SecuBox SMB/CIFS Remote Mount Manager

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Gere les partages reseau SMB/CIFS pour les serveurs multimedia (Jellyfin, Lyrion), les sauvegardes et le stockage distant a usage general.

## Installation

```sh
opkg install secubox-app-smbfs
```

## Configuration

Fichier de configuration UCI : `/etc/config/smbfs`

```
config smbfs 'global'
    option enabled '1'
    option mount_base '/mnt/smb'
    option cifs_version '3.0'
    option timeout '10'

config mount 'movies'
    option enabled '1'
    option server '//192.168.1.100/movies'
    option mountpoint '/mnt/smb/movies'
    option username 'media'
    option _password 'secret'
    option read_only '1'
    option auto_mount '1'
    option description 'Bibliotheque de films NAS'
```

## Utilisation

```sh
# Ajouter un partage
smbfsctl add movies //nas/movies /mnt/smb/movies

# Definir les identifiants
smbfsctl credentials movies user password

# Definir les options
smbfsctl set movies read_only 1
smbfsctl set movies description 'Bibliotheque de films'

# Tester la connectivite
smbfsctl test movies

# Monter / demonter
smbfsctl mount movies
smbfsctl umount movies

# Activer le montage automatique au demarrage
smbfsctl enable movies

# Lister tous les partages
smbfsctl list

# Afficher l'etat detaille des montages
smbfsctl status

# Monter tous les partages actives
smbfsctl mount-all
```

## Integration avec les applications multimedia

```sh
# Jellyfin : ajouter le partage monte comme bibliotheque multimedia
uci add_list jellyfin.media.media_path='/mnt/smb/movies'
uci commit jellyfin

# Lyrion : pointer la bibliotheque musicale vers le partage monte
uci set lyrion.main.media_path='/mnt/smb/music'
uci commit lyrion
```

## Fonctionnalites

- Configuration des partages basee sur UCI avec stockage des identifiants
- Montage automatique au demarrage pour les partages actives
- Modes de montage lecture seule ou lecture-ecriture
- Selection de la version du protocole CIFS (2.0, 2.1, 3.0)
- Test de connectivite avant le montage
- Etat du montage avec rapport d'utilisation du disque
- Integration avec les chemins multimedia Jellyfin et Lyrion

## Fichiers

- `/etc/config/smbfs` -- Configuration UCI
- `/etc/init.d/smbfs` -- Script init procd (montage automatique)
- `/usr/sbin/smbfsctl` -- CLI du controleur

## Dependances

- `kmod-fs-cifs` -- Module noyau CIFS
- `cifsmount` -- Utilitaire mount.cifs

## Licence

Apache-2.0
