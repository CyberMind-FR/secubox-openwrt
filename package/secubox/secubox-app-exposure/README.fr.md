[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Gestionnaire d'Exposition de Services

Backend unifie pour la gestion de l'exposition des services : detection de conflits de ports, services caches Tor et configuration du reverse proxy SSL HAProxy.

## Installation

```sh
opkg install secubox-app-exposure
```

## Configuration

Fichier de configuration UCI : `/etc/config/secubox-exposure`

```
config exposure 'main'
    option enabled '1'
```

## Utilisation

```sh
# Verifier les conflits de ports
secubox-exposure check-ports

# Gerer les services caches Tor
secubox-exposure tor-add <service>
secubox-exposure tor-remove <service>

# Gerer les entrees du reverse proxy HAProxy
secubox-exposure haproxy-add <service>
secubox-exposure haproxy-remove <service>
```

## Fichiers

- `/etc/config/secubox-exposure` -- Configuration UCI
- `/usr/sbin/secubox-exposure` -- CLI principal

## Dependances

- `secubox-core`

## Licence

MIT
