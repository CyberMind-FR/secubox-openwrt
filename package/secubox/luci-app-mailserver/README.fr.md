# LuCI Mail Server Manager

> **Languages:** [English](README.md) | Francais | [中文](README.zh.md)

Tableau de bord web unifie pour le serveur de messagerie SecuBox, le webmail et la sauvegarde mesh.

## Fonctionnalites

- **Statut du serveur** : Etat du conteneur, domaine, utilisateurs, stockage, SSL, mesh
- **Surveillance des ports** : SMTP (25), Submission (587), SMTPS (465), IMAPS (993), POP3S (995)
- **Gestion des utilisateurs** : Ajouter/supprimer des comptes mail avec statistiques de boite aux lettres
- **Gestion des alias** : Creer des alias de redirection d'emails
- **Configuration DNS** : Creation d'enregistrements MX, SPF, DMARC en un clic
- **Configuration SSL** : Automatisation des certificats ACME DNS-01
- **Integration webmail** : Configurer le conteneur Roundcube
- **Sauvegarde mesh** : Synchronisation de sauvegarde P2P

## Installation

```bash
opkg install luci-app-mailserver
```

## Emplacement

**Services -> Mail Server**

## Methodes RPCD

| Methode | Parametres | Description |
|--------|------------|-------------|
| `status` | - | Obtenir le statut du serveur (etat, domaine, utilisateurs, ports, SSL) |
| `user_list` | - | Lister les utilisateurs mail avec statistiques de boite aux lettres |
| `alias_list` | - | Lister les alias email |
| `webmail_status` | - | Obtenir le statut du conteneur webmail |
| `logs` | `lines` | Obtenir les logs du serveur mail |
| `install` | - | Installer le conteneur du serveur mail |
| `start` | - | Demarrer le serveur mail |
| `stop` | - | Arreter le serveur mail |
| `restart` | - | Redemarrer le serveur mail |
| `user_add` | `email`, `password` | Ajouter un utilisateur mail |
| `user_del` | `email` | Supprimer un utilisateur mail |
| `user_passwd` | `email`, `password` | Changer le mot de passe utilisateur |
| `alias_add` | `alias`, `target` | Ajouter un alias email |
| `dns_setup` | - | Creer les enregistrements MX/SPF/DMARC |
| `ssl_setup` | - | Obtenir un certificat SSL |
| `webmail_configure` | - | Configurer Roundcube |
| `mesh_backup` | - | Creer une sauvegarde mesh |
| `mesh_sync` | `mode` | Synchroniser avec le mesh (push/pull) |

## Sections du tableau de bord

### Statut du serveur
- Etat d'execution du conteneur
- FQDN du domaine
- Nombre d'utilisateurs
- Utilisation du stockage
- Validite du certificat SSL
- Statut du webmail
- Statut de la sauvegarde mesh
- Indicateurs d'etat des ports

### Actions rapides
- Demarrer/Arreter le serveur
- Configurer les enregistrements DNS
- Configurer le certificat SSL
- Configurer le webmail
- Creer une sauvegarde mesh

### Utilisateurs mail
- Adresse email
- Taille de la boite aux lettres
- Nombre de messages
- Action de suppression

### Alias email
- Adresse de l'alias
- Cible de redirection

## Dependances

- `secubox-app-mailserver` - CLI backend
- `luci-base` - Framework LuCI
