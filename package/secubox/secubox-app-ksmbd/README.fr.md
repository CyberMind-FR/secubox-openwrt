# SecuBox ksmbd Mesh Media Server

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Serveur de fichiers SMB3 integre au noyau pour la distribution de medias sur le mesh.

## Demarrage rapide

```bash
# Activer le serveur media
ksmbdctl enable

# Verifier le statut
ksmbdctl status

# Ajouter un partage personnalise
ksmbdctl add-share "Films" /srv/movies --guest --readonly

# Ajouter un utilisateur authentifie
ksmbdctl add-user admin

# S'enregistrer sur le mesh pour la decouverte
ksmbdctl mesh-register
```

## Partages par defaut

| Partage | Chemin | Acces |
|---------|--------|-------|
| Media | /srv/media | Invite RW |
| Jellyfin | /srv/jellyfin/media | Invite RO |
| Lyrion | /srv/lyrion/music | Invite RO |
| Backup | /srv/backup | Auth RW |

## Acces reseau

- **macOS/Linux** : `smb://192.168.255.1/`
- **Windows** : `\\192.168.255.1\`

## Integration

- **mDNS** : Annonce automatique via Avahi (ksmbd-avahi-service)
- **P2P Mesh** : `ksmbdctl mesh-register` pour la decouverte mesh
- **smbfs** : Monter des partages distants avec `smbfsctl`
