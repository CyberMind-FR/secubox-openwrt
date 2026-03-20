[English](README.md) | Francais | [中文](README.zh.md)

# luci-app-client-guardian

**Version :** 0.4.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif

**Controle d'acces reseau et tableau de bord de portail captif pour OpenWrt**

Client Guardian est un systeme de controle d'acces reseau (NAC) nouvelle generation pour OpenWrt avec portail captif, surveillance en temps reel, gestion des zones et alertes SMS/Email.

![Client Guardian Dashboard](https://cybermind.fr/images/client-guardian-hero.png)

## Fonctionnalites

### Surveillance temps reel
- Detection automatique des nouveaux clients (MAC + hostname DHCP)
- Statut en ligne/hors ligne en temps reel
- Historique de trafic par client (RX/TX)
- Premiere connexion / Derniere activite

### Gestion des zones

| Zone | Description | Internet | Local | Isolation |
|------|-------------|----------|-------|-----------|
| **LAN Prive** | Reseau de confiance | Oui | Oui | Non |
| **IoT** | Objets connectes | Oui | Non | Oui |
| **Enfants** | Acces filtre | Oui (Filtre) | Oui | Non |
| **Invites** | Acces limite | Oui (Limite) | Non | Oui |
| **Quarantaine** | Non approuves | Non (Portail) | Non | Oui |
| **Bloque** | Bannis | Non | Non | Oui |

### Politique par defaut : Quarantaine
- Tout nouveau client non reconnu -> **Quarantaine automatique**
- Acces uniquement au portail captif
- Approbation manuelle requise pour acces complet
- Protection contre les intrusions

### Portail captif nouvelle generation
- Interface moderne et personnalisable
- Authentification par mot de passe / inscription
- Conditions d'utilisation acceptees
- Duree de session configurable
- Logo et couleurs personnalisables

### Controle parental
- **Plages horaires** : Blocage nocturne, heures scolaires
- **Filtrage de contenu** : Adulte, violence, jeux d'argent
- **SafeSearch force** : Google, Bing, YouTube
- **YouTube Mode Restreint**
- **Listes blanches/noires** d'URLs personnalisees
- **Quotas journaliers** de temps d'ecran

### Alertes SMS et Email
- Nouveau client detecte
- Tentative de client banni
- Quota depasse
- Activite suspecte (scan de ports, etc.)
- Templates personnalisables
- Fournisseurs SMS : Twilio, Nexmo, OVH

## Installation

### Pre-requis

```bash
opkg update
opkg install luci-base rpcd dnsmasq-full iptables uhttpd
```

### Optionnels

```bash
# Pour les notifications
opkg install msmtp curl

# Pour le filtrage DNS
opkg install adblock

# Pour les quotas de bande passante
opkg install sqm-scripts
```

### Installation du package

```bash
# Depuis les sources
git clone https://github.com/gkerma/luci-app-client-guardian.git
cd luci-app-client-guardian
make install

# Redemarrer rpcd
/etc/init.d/rpcd restart
```

## Utilisation

### Workflow typique

1. **Nouveau client se connecte** -> Automatiquement en quarantaine
2. **Alerte envoyee** -> SMS/Email a l'admin
3. **Admin verifie** -> Dans le tableau de bord LuCI
4. **Decision** :
   - **Approuver** -> Assigner a une zone (LAN, IoT, Enfants...)
   - **Bannir** -> Bloquer definitivement

### Actions sur les clients

| Action | Description |
|--------|-------------|
| Approuver | Sortir de quarantaine, assigner zone |
| Bannir | Bloquer tout acces reseau |
| Quarantaine | Remettre en isolation |
| Modifier | Changer nom, zone, quota |

## Configuration

### Fichier UCI `/etc/config/client-guardian`

```bash
# Configuration globale
config client-guardian 'config'
    option enabled '1'
    option default_policy 'quarantine'
    option scan_interval '30'
    option portal_enabled '1'

# Alertes Email
config email 'email'
    option enabled '1'
    option smtp_server 'smtp.gmail.com'
    option smtp_port '587'
    option smtp_user 'user@gmail.com'
    list recipients 'admin@example.com'

# Alertes SMS (Twilio)
config sms 'sms'
    option enabled '1'
    option provider 'twilio'
    option api_key 'ACxxxxx'
    option api_secret 'xxxxx'
    list recipients '+33612345678'

# Zone personnalisee
config zone 'gaming'
    option name 'Gaming'
    option network 'lan'
    option internet_access '1'
    option bandwidth_limit '0'
    option time_restrictions '0'

# Client connu
config client 'mon_pc'
    option name 'PC Bureau'
    option mac 'AA:BB:CC:DD:EE:FF'
    option zone 'lan_private'
    option status 'approved'
    option static_ip '192.168.1.10'
```

## Architecture

```
+--------------------------------------------------------------+
|                      Interface web LuCI                       |
|  +----------+----------+----------+----------+----------+    |
|  | Apercu   | Clients  |  Zones   | Portail  | Parental |    |
|  +----------+----------+----------+----------+----------+    |
+--------------------------------------------------------------+
|                        Backend RPCD                           |
|  +---------------------------------------------------------+ |
|  | status | clients | zones | approve | ban | quarantine   | |
|  +---------------------------------------------------------+ |
+--------------------------------------------------------------+
|                     Integration systeme                       |
|  +-----------+-----------+-----------+-------------------+   |
|  |  dnsmasq  | iptables  | arptables | uhttpd (portail) |   |
|  |  (DHCP)   | (firewall)| (MAC)     |                   |   |
|  +-----------+-----------+-----------+-------------------+   |
+--------------------------------------------------------------+
|                       Systeme d'alertes                       |
|  +-------------------+------------------------------------+  |
|  |   Email (msmtp)   |      SMS (Twilio/Nexmo/OVH)       |  |
|  +-------------------+------------------------------------+  |
+--------------------------------------------------------------+
```

## API RPCD

| Methode | Description | Parametres |
|---------|-------------|------------|
| `status` | Etat global du systeme | - |
| `clients` | Liste tous les clients | - |
| `zones` | Liste toutes les zones | - |
| `parental` | Config controle parental | - |
| `portal` | Config portail captif | - |
| `alerts` | Config alertes | - |
| `logs` | Journal d'evenements | `limit`, `level` |
| `approve_client` | Approuver un client | `mac`, `name`, `zone` |
| `ban_client` | Bannir un client | `mac`, `reason` |
| `quarantine_client` | Mettre en quarantaine | `mac` |
| `update_client` | Modifier un client | `section`, `name`, `zone`... |
| `update_zone` | Modifier une zone | `id`, `name`, `bandwidth_limit`... |
| `update_portal` | Modifier le portail | `title`, `subtitle`... |
| `send_test_alert` | Envoyer alerte test | `type` (email/sms) |

## Securite

- **Quarantaine par defaut** : Aucun acces sans approbation
- **Isolation des zones** : IoT isole du LAN
- **Detection d'intrusion** : Alertes en temps reel
- **Historique complet** : Logs de toutes les connexions
- **ACL** : Permissions granulaires pour l'API

## Theme

- **Couleur principale** : Rouge securite (#ef4444)
- **Fond** : Mode sombre (#0f0a0a)
- **Zones** : Couleurs distinctes par type
- **Animations** : Pulse pour quarantaine, glow pour alertes

## Structure du package

```
luci-app-client-guardian/
+-- Makefile
+-- README.md
+-- htdocs/luci-static/resources/
|   +-- client-guardian/
|   |   +-- api.js
|   |   +-- dashboard.css
|   +-- view/client-guardian/
|       +-- overview.js
|       +-- clients.js
|       +-- zones.js
|       +-- portal.js
|       +-- parental.js
|       +-- alerts.js
|       +-- logs.js
+-- root/
    +-- etc/
    |   +-- config/client-guardian
    +-- usr/
        +-- libexec/rpcd/client-guardian
        +-- share/
            +-- luci/menu.d/luci-app-client-guardian.json
            +-- rpcd/acl.d/luci-app-client-guardian.json
```

## Feuille de route

- [x] Surveillance temps reel
- [x] Gestion des zones
- [x] Portail captif
- [x] Controle parental
- [x] Alertes Email/SMS
- [ ] Integration Pi-hole
- [ ] Statistiques graphiques (historique)
- [ ] Application mobile
- [ ] API REST externe
- [ ] Integration Home Assistant

## Licence

Apache-2.0 - Voir [LICENSE](LICENSE)

## Auteur

**Gandalf** - [CyberMind.fr](https://cybermind.fr)

---

*Protegez votre reseau avec Client Guardian*
