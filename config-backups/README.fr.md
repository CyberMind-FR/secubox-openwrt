# Sauvegardes de Configuration SecuBox

[English](README.md) | Francais | [中文](README.zh.md)

Sauvegardes de configuration runtime du routeur SecuBox pour le controle de version.

## Structure

```
config-backups/
├── bind/
│   ├── named.conf           # Configuration principale BIND
│   ├── named.conf.zones     # Declarations de zones
│   └── zones/               # Fichiers de zones
│       ├── maegia.tv.zone
│       ├── ganimed.fr.zone
│       ├── secubox.in.zone
│       └── ...
```

## Synchronisation depuis le Routeur

```bash
# Synchroniser toute la configuration BIND
ssh root@192.168.255.1 "cat /etc/bind/named.conf.zones" > config-backups/bind/named.conf.zones
ssh root@192.168.255.1 "cat /etc/bind/zones/*.zone" # par fichier

# Synchroniser vers le routeur (restauration)
scp config-backups/bind/zones/*.zone root@192.168.255.1:/etc/bind/zones/
ssh root@192.168.255.1 "/etc/init.d/named restart"
```

## Miroir Gitea Local

Depot de configuration prive : `git.maegia.tv:gandalf/secubox-configs`
