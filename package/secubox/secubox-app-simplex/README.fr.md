[English](README.md) | Francais | [中文](README.zh.md)

# Serveur SimpleX Chat SecuBox

Serveur de relais de messagerie axe sur la confidentialite fonctionnant dans un conteneur LXC Alpine. Fournit des services SMP (SimpleX Messaging Protocol) et XFTP (transfert de fichiers) avec chiffrement de bout en bout et support de cryptographie post-quantique.

## Installation

```bash
opkg install secubox-app-simplex
```

## Configuration

Fichier de configuration UCI : `/etc/config/simplex`

```bash
uci set simplex.main.enabled='1'
uci set simplex.main.smp_port='5223'
uci set simplex.main.xftp_port='443'
uci set simplex.main.domain='chat.example.com'
uci commit simplex
```

## Utilisation

```bash
simplexctl start       # Demarrer le serveur SimpleX (LXC)
simplexctl stop        # Arreter le serveur SimpleX
simplexctl status      # Afficher le statut du service
simplexctl logs        # Voir les journaux du serveur
simplexctl address     # Afficher l'adresse du serveur pour les clients
simplexctl update      # Mettre a jour les binaires SimpleX
```

## Integration HAProxy

Une configuration HAProxy prete a l'emploi est fournie dans `/usr/lib/secubox/haproxy.d/simplex.cfg` pour la terminaison TLS et le routage via l'instance HAProxy SecuBox.

## Fonctionnalites

- Relais SMP pour la messagerie SimpleX Chat
- Relais XFTP pour les transferts de fichiers chiffres
- Chiffrement de bout en bout avec algorithmes post-quantiques
- Aucun identifiant utilisateur ni collecte de metadonnees
- Isolation via conteneur LXC Alpine

## Dependances

- `lxc`
- `lxc-common`
- `wget`
- `openssl-util`
- `tar`

## Licence

Apache-2.0
