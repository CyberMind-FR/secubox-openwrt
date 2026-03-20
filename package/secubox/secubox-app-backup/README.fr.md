[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Backup Manager

Systeme de sauvegarde unifie pour les conteneurs LXC, la configuration UCI, les donnees de services et les profils avec support de synchronisation mesh.

## Installation

```bash
opkg install secubox-app-backup
```

## Utilisation CLI

### Creer des sauvegardes

```bash
# Sauvegarde complete (config + conteneurs + services)
secubox-backup create --full

# Config uniquement (UCI, certificats)
secubox-backup create --config

# Conteneurs uniquement (LXC)
secubox-backup create --containers

# Services uniquement (donnees HAProxy, mitmproxy)
secubox-backup create --services
```

### Lister les sauvegardes

```bash
secubox-backup list              # Toutes les sauvegardes
secubox-backup list --local      # Locales uniquement
secubox-backup list --remote     # Gitea distant uniquement
```

### Restaurer

```bash
secubox-backup restore config-20260205-120000.tar.gz
secubox-backup restore config-20260205-120000.tar.gz --dry-run
```

### Gestion des conteneurs

```bash
secubox-backup container list                    # Lister les conteneurs LXC
secubox-backup container backup mitmproxy        # Sauvegarder un conteneur specifique
secubox-backup container restore mitmproxy /path/to/backup.tar.gz
secubox-backup container backups mitmproxy       # Lister les sauvegardes d'un conteneur
```

### Gestion des profils

```bash
secubox-backup profile list          # Lister les profils
secubox-backup profile create mysetup # Creer depuis la config actuelle
secubox-backup profile apply mysetup  # Appliquer un profil
```

### Synchronisation distante (Gitea)

```bash
secubox-backup sync --push    # Pousser vers Gitea
secubox-backup sync --pull    # Lister les sauvegardes distantes
```

### Maintenance

```bash
secubox-backup status    # Afficher le statut des sauvegardes
secubox-backup cleanup   # Supprimer les anciennes sauvegardes (garde les 10 dernieres)
```

## Configuration UCI

```
config backup 'main'
    option enabled '1'
    option storage_path '/srv/backups'
    option retention_days '30'
    option max_backups '10'
    option compress '1'

config schedule 'daily'
    option enabled '1'
    option type 'config'
    option cron '0 3 * * *'

config schedule 'weekly'
    option enabled '1'
    option type 'full'
    option cron '0 4 * * 0'

config remote 'gitea'
    option enabled '1'
    option url 'https://git.example.com'
    option repo 'user/backups'
    option token 'votre-token'
    option branch 'master'
```

## Structure des sauvegardes

```
/srv/backups/
+-- config/           # Sauvegardes UCI et certificats
|   +-- config-YYYYMMDD-HHMMSS.tar.gz
+-- containers/       # Sauvegardes de conteneurs LXC
|   +-- mitmproxy-YYYYMMDD-HHMMSS.tar.gz
|   +-- haproxy-YYYYMMDD-HHMMSS.tar.gz
+-- services/         # Sauvegardes de donnees de services
|   +-- haproxy-YYYYMMDD-HHMMSS.tar.gz
+-- profiles/         # Profils de configuration
    +-- mysetup.json
```

## Contenu des sauvegardes

| Type | Contenu |
|------|---------|
| **Config** | `/etc/config/*`, `/etc/secubox/*`, `/etc/haproxy/*`, `/srv/haproxy/certs/*`, `/etc/acme/*` |
| **Conteneurs** | Rootfs LXC complet depuis `/srv/lxc/<nom>/` |
| **Services** | `/srv/haproxy/`, `/srv/mitmproxy/`, `/srv/localai/`, `/srv/gitea/` |

## Dependances

- `lxc` - Pour la sauvegarde/restauration de conteneurs
- `tar` - Creation d'archives
- `wget` - Communication API Gitea (optionnel)
