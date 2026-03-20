# SecuBox Jitsi Meet

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Visioconference auto-hebergee avec chiffrement de bout en bout pour SecuBox.

## Fonctionnalites

- **Appels video securises** : Visioconferences chiffrees de bout en bout
- **Pas de compte requis** : Les invites peuvent rejoindre sans inscription
- **Partage d'ecran** : Partagez votre ecran avec les participants
- **Chat et reactions** : Chat en reunion et reactions emoji
- **Salles de sous-groupes** : Divisez les reunions en groupes plus petits
- **Enregistrement** : Enregistrement optionnel vers Dropbox (configuration requise)
- **Support mobile** : Applications iOS et Android disponibles
- **Integration HAProxy** : Configuration automatique SSL et reverse proxy
- **Federation mesh** : Annonce du service sur le reseau mesh SecuBox

## Pre-requis

- Docker et docker-compose
- 2 Go+ de RAM (4 Go recommandes)
- Domaine public avec DNS pointant vers votre SecuBox
- Certificat SSL (via Let's Encrypt ou HAProxy)

## Demarrage rapide

```bash
# Installer
opkg install secubox-app-jitsi luci-app-jitsi

# Configurer le domaine
uci set jitsi.main.domain='meet.example.com'
uci set jitsi.main.enabled='1'
uci commit jitsi

# Installer les conteneurs Docker
jitsctl install

# Demarrer le service
/etc/init.d/jitsi start
```

## Configuration

### Via LuCI
Naviguez vers **Services > Jitsi Meet** dans l'interface web LuCI.

### Via CLI
```bash
# Afficher le statut
jitsctl status

# Voir les logs
jitsctl logs

# Ajouter un utilisateur authentifie
jitsctl add-user admin motdepasse

# Regenerer la configuration
jitsctl generate-config

# Redemarrer les conteneurs
jitsctl restart
```

### Options UCI

```
config jitsi 'main'
    option enabled '1'
    option domain 'meet.example.com'
    option timezone 'Europe/Paris'

config jitsi 'web'
    option port '8443'
    option enable_guests '1'
    option enable_auth '0'
    option default_language 'fr'

config jitsi 'jvb'
    option port '10000'
    option enable_tcp_fallback '0'
    option stun_servers 'meet-jit-si-turnrelay.jitsi.net:443'

config jitsi 'security'
    option lobby_enabled '1'
    option password_required '0'
    option jwt_enabled '0'
```

## Integration HAProxy

Si secubox-app-haproxy est installe, Jitsi configurera automatiquement un vhost :

```bash
jitsctl configure-haproxy
```

Cela cree :
- Frontend HTTPS sur le port 443
- Support WebSocket pour la communication temps reel
- Terminaison SSL (utilisant votre certificat)

## Pare-feu

Les ports suivants sont requis :

| Port | Protocole | Description |
|------|-----------|-------------|
| 443 | TCP | HTTPS (via HAProxy) |
| 8443 | TCP | Acces web direct |
| 10000 | UDP | Flux video/audio |
| 4443 | TCP | Fallback TCP (optionnel) |

Les regles de pare-feu sont automatiquement ajoutees lors de l'installation.

## Integration mesh

Activez la federation mesh pour :
- Annoncer Jitsi sur le reseau mesh SecuBox
- Enregistrement automatique DNS (ex: meet.c3box.mesh.local)
- Deploiement de video bridge multi-noeud

```bash
uci set jitsi.mesh.enabled='1'
uci commit jitsi
/etc/init.d/jitsi restart
```

## Depannage

### Les conteneurs ne demarrent pas
```bash
# Verifier le statut Docker
docker ps -a

# Voir les logs des conteneurs
jitsctl logs web
jitsctl logs prosody
jitsctl logs jicofo
jitsctl logs jvb
```

### Video/audio ne fonctionne pas
1. Verifier que le port UDP 10000 est ouvert sur le pare-feu
2. Verifier que les serveurs STUN sont accessibles
3. Activer le fallback TCP si derriere un NAT strict

### Problemes d'authentification
```bash
# Lister les utilisateurs
jitsctl list-users

# Reinitialiser le mot de passe d'un utilisateur
jitsctl remove-user admin
jitsctl add-user admin nouveaumotdepasse
```

## Sauvegarde et restauration

```bash
# Creer une sauvegarde
jitsctl backup /tmp/jitsi-backup.tar.gz

# Restaurer
jitsctl restore /tmp/jitsi-backup.tar.gz
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    HAProxy (443)                        │
│                    Terminaison SSL                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                Reseau Docker : meet.jitsi                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐    │
│  │   Web   │ │ Prosody │ │ Jicofo  │ │     JVB     │    │
│  │  :8443  │ │  :5222  │ │  :8888  │ │ :10000/UDP  │    │
│  │ React   │ │  XMPP   │ │  Focus  │ │   Media     │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Licence

Apache 2.0 - Voir le fichier LICENSE pour plus de details.
