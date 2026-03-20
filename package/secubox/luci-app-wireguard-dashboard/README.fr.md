[English](README.md) | Francais | [中文](README.zh.md)

# LuCI WireGuard Dashboard

Interface moderne de gestion VPN WireGuard pour OpenWrt avec assistant de configuration, gestion des pairs et surveillance en temps reel.

## Fonctionnalites

- **Assistant de configuration** : Creez des tunnels et des pairs en quelques minutes avec des presets pour les cas d'utilisation courants
- **Vue d'ensemble du tableau de bord** : Statut en temps reel de tous les tunnels et pairs
- **Gestion des pairs** : Ajoutez, supprimez et configurez les pairs avec generation de QR code
- **Surveillance du trafic** : Statistiques de bande passante en direct par interface et par pair
- **Export de configuration client** : Generez des fichiers de configuration et QR codes pour les applications mobiles

## Installation

```bash
opkg update
opkg install luci-app-wireguard-dashboard
```

### Dependances

- `wireguard-tools` - Outils espace utilisateur WireGuard
- `luci-base` - Interface web LuCI
- `qrencode` (optionnel) - Pour la generation de QR code cote serveur

## Assistant de configuration

L'assistant fournit des configurations predefinies pour les scenarios VPN courants :

### Presets de tunnel

| Preset | Description | Port par defaut | Reseau |
|--------|-------------|-----------------|--------|
| Road Warrior | Acces distant pour utilisateurs mobiles | 51820 | 10.10.0.0/24 |
| Site-to-Site | Connecter deux reseaux | 51821 | 10.20.0.0/24 |
| Tunnel IoT | Tunnel isole pour appareils connectes | 51822 | 10.30.0.0/24 |

### Presets de zone de pair

| Zone | Description | Mode tunnel |
|------|-------------|-------------|
| Utilisateur domicile | Acces reseau complet | Complet |
| Travailleur distant | Ressources bureau uniquement | Divise |
| Appareil mobile | Acces en deplacement | Complet |
| Appareil IoT | Acces VPN uniquement limite | Divise |
| Invite | Acces visiteur temporaire | Complet |
| Serveur/Site | Connexion site-a-site | Divise |

### Flux de l'assistant

1. **Selectionner le type de tunnel** - Choisir le preset (Road Warrior, Site-to-Site, IoT)
2. **Configurer le tunnel** - Definir le nom d'interface, port, reseau VPN, endpoint public
3. **Selectionner les zones de pair** - Choisir quels types de pairs creer
4. **Creer** - L'assistant genere les cles, cree l'interface, ajoute les pairs, affiche les QR codes

## API RPCD

Le tableau de bord communique via l'objet RPCD `luci.wireguard-dashboard`.

### Methodes

| Methode | Parametres | Description |
|---------|------------|-------------|
| `status` | - | Obtenir le statut global WireGuard |
| `interfaces` | - | Lister toutes les interfaces WireGuard |
| `peers` | - | Lister tous les pairs avec leur statut |
| `traffic` | - | Obtenir les statistiques de trafic |
| `generate_keys` | - | Generer une nouvelle paire de cles + PSK |
| `create_interface` | name, private_key, listen_port, addresses, mtu | Creer une nouvelle interface WireGuard avec regles firewall |
| `add_peer` | interface, name, allowed_ips, public_key, preshared_key, endpoint, persistent_keepalive | Ajouter un pair a l'interface |
| `remove_peer` | interface, public_key | Supprimer un pair de l'interface |
| `interface_control` | interface, action (up/down/restart) | Controler l'etat de l'interface |
| `generate_config` | interface, peer, private_key, endpoint | Generer un fichier de configuration client |
| `generate_qr` | interface, peer, private_key, endpoint | Generer un QR code (necessite qrencode) |

### Exemple : Creer une interface via CLI

```bash
# Generer les cles
keys=$(ubus call luci.wireguard-dashboard generate_keys '{}')
privkey=$(echo "$keys" | jsonfilter -e '@.private_key')

# Creer l'interface
ubus call luci.wireguard-dashboard create_interface "{
  \"name\": \"wg0\",
  \"private_key\": \"$privkey\",
  \"listen_port\": \"51820\",
  \"addresses\": \"10.10.0.1/24\",
  \"mtu\": \"1420\"
}"
```

### Exemple : Ajouter un pair via CLI

```bash
# Generer les cles du pair
peer_keys=$(ubus call luci.wireguard-dashboard generate_keys '{}')
peer_pubkey=$(echo "$peer_keys" | jsonfilter -e '@.public_key')
peer_psk=$(echo "$peer_keys" | jsonfilter -e '@.preshared_key')

# Ajouter le pair
ubus call luci.wireguard-dashboard add_peer "{
  \"interface\": \"wg0\",
  \"name\": \"Telephone\",
  \"allowed_ips\": \"10.10.0.2/32\",
  \"public_key\": \"$peer_pubkey\",
  \"preshared_key\": \"$peer_psk\",
  \"persistent_keepalive\": \"25\"
}"
```

## Integration pare-feu

Lors de la creation d'une interface via l'assistant ou l'API `create_interface`, les regles de pare-feu suivantes sont automatiquement creees :

1. **Zone** (`wg_<interface>`) : INPUT/OUTPUT/FORWARD = ACCEPT
2. **Redirection** : Redirection bidirectionnelle vers/depuis la zone `lan`
3. **Regle WAN** : Autoriser le trafic UDP sur le port d'ecoute depuis le WAN

## Emplacements des fichiers

| Fichier | Objectif |
|---------|----------|
| `/usr/libexec/rpcd/luci.wireguard-dashboard` | Backend RPCD |
| `/www/luci-static/resources/wireguard-dashboard/api.js` | Wrapper API JavaScript |
| `/www/luci-static/resources/view/wireguard-dashboard/*.js` | Vues LuCI |
| `/usr/share/luci/menu.d/luci-app-wireguard-dashboard.json` | Configuration du menu |
| `/usr/share/rpcd/acl.d/luci-app-wireguard-dashboard.json` | Permissions ACL |

## Depannage

### L'interface ne demarre pas

```bash
# Verifier le statut de l'interface
wg show wg0

# Verifier la configuration UCI
uci show network.wg0

# Demarrer manuellement
ifup wg0

# Verifier les logs
logread | grep -i wireguard
```

### Les pairs ne se connectent pas

1. Verifiez que le port du pare-feu est ouvert : `iptables -L -n | grep 51820`
2. Verifiez que l'endpoint est accessible depuis le client
3. Verifiez que les allowed_ips correspondent des deux cotes
4. Verifiez les problemes de NAT - activez PersistentKeepalive

### Les QR codes ne se generent pas

Installez qrencode pour la generation de QR cote serveur :
```bash
opkg install qrencode
```

Le tableau de bord prend egalement en charge la generation de QR cote client via JavaScript (sans dependance serveur).

## Licence

Apache-2.0

## Auteur

CyberMind.fr - Projet SecuBox
