# SecuBox Configuration Backups

English | [Francais](README.fr.md) | [中文](README.zh.md)

Runtime configuration backups from the SecuBox router for version control.

## Structure

```
config-backups/
├── bind/
│   ├── named.conf           # Main BIND configuration
│   ├── named.conf.zones     # Zone declarations
│   └── zones/               # Zone files
│       ├── maegia.tv.zone
│       ├── ganimed.fr.zone
│       ├── secubox.in.zone
│       └── ...
```

## Sync from Router

```bash
# Sync all BIND config
ssh root@192.168.255.1 "cat /etc/bind/named.conf.zones" > config-backups/bind/named.conf.zones
ssh root@192.168.255.1 "cat /etc/bind/zones/*.zone" # per-file

# Sync to router (restore)
scp config-backups/bind/zones/*.zone root@192.168.255.1:/etc/bind/zones/
ssh root@192.168.255.1 "/etc/init.d/named restart"
```

## Local Gitea Mirror

Private config repo: `git.maegia.tv:gandalf/secubox-configs`
