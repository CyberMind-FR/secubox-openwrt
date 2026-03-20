# SecuBox Mail Server

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Serveur de messagerie personnalise (Postfix + Dovecot) fonctionnant dans un conteneur LXC avec support de sauvegarde mesh.

## Fonctionnalites

- **Postfix** - Serveur SMTP avec domaines virtuels
- **Dovecot** - IMAP/POP3 avec livraison LMTP
- **Rspamd** - Filtrage anti-spam
- **OpenDKIM** - Signature des emails
- **Sauvegarde mesh** - Synchronisation de sauvegarde P2P avec d'autres noeuds SecuBox
- **Integration webmail** - Fonctionne avec le conteneur Roundcube

## Installation

```bash
opkg install secubox-app-mailserver
```

## Demarrage rapide

```bash
# 1. Configurer le domaine
uci set mailserver.main.domain='example.com'
uci set mailserver.main.hostname='mail'
uci commit mailserver

# 2. Installer le conteneur
mailctl install

# 3. Configurer les enregistrements DNS (MX, SPF, DMARC)
mailctl dns-setup

# 4. Obtenir le certificat SSL
mailctl ssl-setup

# 5. Ajouter des utilisateurs de messagerie
mailctl user add user@example.com

# 6. Activer et demarrer
uci set mailserver.main.enabled=1
uci commit mailserver
/etc/init.d/mailserver start

# 7. Configurer le webmail
mailctl webmail configure
```

## Reference CLI

### Controle du service

```bash
mailctl start      # Demarrer le serveur de messagerie
mailctl stop       # Arreter le serveur de messagerie
mailctl restart    # Redemarrer le serveur de messagerie
mailctl status     # Afficher le statut
```

### Gestion des utilisateurs

```bash
mailctl user add user@domain.com    # Ajouter un utilisateur (demande le mot de passe)
mailctl user del user@domain.com    # Supprimer un utilisateur
mailctl user list                   # Lister tous les utilisateurs
mailctl user passwd user@domain.com # Changer le mot de passe
```

### Alias

```bash
mailctl alias add info@domain.com user@domain.com
mailctl alias list
```

### Certificats SSL

```bash
mailctl ssl-setup    # Obtenir le certificat Let's Encrypt via DNS-01
mailctl ssl-status   # Afficher les informations du certificat
```

### Integration DNS

```bash
mailctl dns-setup    # Creer les enregistrements MX, SPF, DMARC via dnsctl
```

### Sauvegarde mesh

```bash
mailctl mesh backup              # Creer une sauvegarde pour la synchronisation mesh
mailctl mesh restore <fichier>   # Restaurer depuis une sauvegarde
mailctl mesh sync push           # Pousser vers les peers mesh
mailctl mesh sync pull           # Tirer depuis les peers mesh
mailctl mesh add-peer <peer_id>  # Ajouter un peer mesh
mailctl mesh peers               # Lister les peers configures
mailctl mesh enable              # Activer la synchronisation mesh
mailctl mesh disable             # Desactiver la synchronisation mesh
```

### Webmail

```bash
mailctl webmail status      # Verifier le statut de Roundcube
mailctl webmail configure   # Pointer Roundcube vers ce serveur
```

### Diagnostics

```bash
mailctl logs         # Voir les logs de messagerie (50 dernieres lignes)
mailctl logs 100     # Voir les 100 dernieres lignes
mailctl test user@external.com   # Envoyer un email de test
```

## Configuration UCI

```
config mailserver 'main'
    option enabled '0'
    option hostname 'mail'
    option domain 'example.com'
    option postmaster 'postmaster'
    option data_path '/srv/mailserver'
    option container 'mailserver'

config ports 'ports'
    option smtp '25'
    option submission '587'
    option smtps '465'
    option imap '143'
    option imaps '993'
    option pop3 '110'
    option pop3s '995'

config features 'features'
    option spam_filter '1'
    option virus_scan '0'
    option dkim '1'
    option spf '1'
    option dmarc '1'
    option fail2ban '1'

config ssl 'ssl'
    option type 'letsencrypt'

config webmail 'webmail'
    option enabled '1'
    option container 'secubox-webmail'
    option port '8026'

config mesh 'mesh'
    option enabled '0'
    option backup_peers ''
    option sync_interval '3600'
```

## Structure des donnees

```
/srv/mailserver/
├── config/          # Configuration Postfix/Dovecot
│   ├── vmailbox     # Carte des boites virtuelles
│   ├── valias       # Carte des alias virtuels
│   └── users        # Base de donnees utilisateurs Dovecot
├── mail/            # Stockage Maildir
│   └── example.com/
│       └── user/
│           ├── cur/
│           ├── new/
│           └── tmp/
└── ssl/             # Certificats SSL
    ├── fullchain.pem
    └── privkey.pem
```

## Enregistrements DNS requis

La commande `mailctl dns-setup` cree ces enregistrements via `dnsctl` :

| Type | Nom | Valeur |
|------|-----|--------|
| A | mail | `<ip-publique>` |
| MX | @ | `10 mail.example.com.` |
| TXT | @ | `v=spf1 mx a:mail.example.com ~all` |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:postmaster@example.com` |
| TXT | mail._domainkey | `v=DKIM1; k=rsa; p=<cle-publique>` |

## Ports

| Port | Protocole | Description |
|------|-----------|-------------|
| 25 | SMTP | Transfert de courrier (serveur a serveur) |
| 587 | Submission | Soumission de courrier (client a serveur) |
| 465 | SMTPS | SMTP securise |
| 143 | IMAP | Acces au courrier |
| 993 | IMAPS | IMAP securise |
| 110 | POP3 | Telechargement du courrier (optionnel) |
| 995 | POP3S | POP3 securise (optionnel) |
| 4190 | Sieve | Regles de filtrage du courrier |

## Dependances

- `lxc` - Runtime de conteneur
- `secubox-app-dns-provider` - Gestion des enregistrements DNS
- `acme` - Automatisation des certificats SSL (optionnel)
- `secubox-p2p` - Synchronisation de sauvegarde mesh (optionnel)
