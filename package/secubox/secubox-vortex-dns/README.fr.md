[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Vortex DNS

Systeme de delegation multi-sous-domaines dynamiques en maillage.

## Architecture

```
MAITRE (*.secubox.io)
├── ESCLAVE node1.secubox.io
│   └── services: git.node1.secubox.io, web.node1.secubox.io
├── SOUS-MAITRE region1.secubox.io
│   ├── ESCLAVE a.region1.secubox.io
│   └── ESCLAVE b.region1.secubox.io
└── ESCLAVE node2.secubox.io
```

## Fonctionnalites

- **Delegation Wildcard** : Le maitre possede `*.domaine`, delegue les sous-zones aux esclaves
- **First Peek** : Les services s'enregistrent automatiquement lorsqu'ils sont decouverts sur le maillage
- **Synchronisation Gossip** : Les configurations d'exposition se propagent via le maillage P2P
- **Sous-maitrise** : Delegation hierarchique (maitre → sous-maitre → esclaves)
- **Multi-Fournisseur** : OVH, Gandi, Cloudflare via dns-provider

## Reference CLI

```bash
# Operations maitre
vortexctl master init secubox.io          # Initialiser comme maitre
vortexctl master delegate 192.168.1.100 node1  # Deleguer une sous-zone
vortexctl master list-slaves              # Lister les zones deleguees

# Operations esclave
vortexctl slave join <ip_maitre> <jeton>  # Rejoindre la hierarchie maitre
vortexctl slave status                    # Afficher le statut esclave

# Operations maillage
vortexctl mesh status                     # Statut DNS du maillage
vortexctl mesh sync                       # Forcer la synchronisation avec les pairs
vortexctl mesh publish <service> <domaine> # Publier sur le maillage

# General
vortexctl status                          # Statut global
vortexctl daemon                          # Executer le daemon de synchronisation
```

## Configuration

```uci
config vortex 'main'
    option enabled '1'
    option mode 'master|slave|submaster|standalone'
    option sync_interval '300'

config master 'master'
    option enabled '1'
    option wildcard_domain 'secubox.io'
    option dns_provider 'ovh'
    option auto_delegate '1'

config slave 'slave'
    option enabled '0'
    option parent_master '192.168.1.1'
    option delegated_zone 'node1'

config mesh 'mesh'
    option gossip_enabled '1'
    option first_peek '1'
    option auto_register '1'
```

## Fait partie de SecuBox v0.19 Couche MirrorNetworking
