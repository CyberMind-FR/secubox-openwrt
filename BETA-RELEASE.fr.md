# SecuBox v1.0.0 Version Beta

🌐 **Langues :** [English](BETA-RELEASE.md) | Français | [中文](BETA-RELEASE.zh.md)

**Date de publication :** 2026-03-15
**Statut :** Beta — Prêt pour Pen Testing & Bug Bounty
**Éditeur :** [CyberMind.fr](https://cybermind.fr)

---

## Démarrage Rapide pour Chercheurs en Sécurité

### Récupérer le Code

```bash
git clone https://github.com/CyberMind-FR/secubox-openwrt.git
cd secubox-openwrt
```

### Compiler pour les Tests

```bash
# Option 1 : Utiliser les paquets pré-compilés (recommandé)
./secubox-tools/local-build.sh build all

# Option 2 : Compiler avec le SDK OpenWrt
cd ~/openwrt-sdk/package/
ln -s /path/to/secubox-openwrt secubox
make package/secubox/luci-app-secubox-portal/compile V=s
```

### Déployer sur Routeur de Test

```bash
scp bin/packages/*/secubox/*.ipk root@192.168.255.1:/tmp/
ssh root@192.168.255.1 'opkg install /tmp/luci-app-*.ipk'
```

---

## Vue d'Ensemble de la Surface d'Attaque

### Couche 1 : Bordure Réseau

| Composant | Port | Protocole | Vecteurs d'Attaque |
|-----------|------|-----------|-------------------|
| HAProxy | 80, 443 | HTTP/S | Injection d'en-tête, attaques SNI, SSL stripping |
| mitmproxy WAF | 22222 | HTTP | Contournement WAF, évasion de règles, épuisement mémoire |
| CrowdSec Bouncer | - | nftables | Contournement de règles, usurpation d'IP |
| fw4/nftables | - | L3/L4 | Évasion pare-feu, attaques par fragmentation |

### Couche 2 : Proxies Applicatifs

| Composant | Port | Protocole | Vecteurs d'Attaque |
|-----------|------|-----------|-------------------|
| LuCI (uhttpd) | 443 | HTTPS | Contournement auth, XSS, CSRF, traversée de chemin |
| RPCD (ubus) | Unix | JSON-RPC | Élévation de privilèges, injection |
| Tor Shield | 9050 | SOCKS5 | Désanonymisation, analyse de circuit |

### Couche 3 : Conteneurs LXC

| Conteneur | Port | Service | Vecteurs d'Attaque |
|-----------|------|---------|-------------------|
| Jellyfin | 8096 | Médias | Traversée de chemin, exploits de transcodage |
| Nextcloud | 8080 | Cloud | SSRF, upload de fichiers, abus WebDAV |
| Gitea | 3000 | Git | RCE via hooks, injection de repo |
| Streamlit | 8501+ | Python | Exécution de code, désérialisation pickle |
| PhotoPrism | 2342 | Photos | Empoisonnement de modèle IA, injection EXIF |

### Couche 4 : Mesh/P2P

| Composant | Port | Protocole | Vecteurs d'Attaque |
|-----------|------|-----------|-------------------|
| Hub P2P | 8333 | WebSocket | Injection de messages, usurpation de pairs |
| Master Link | 51820 | WireGuard | Vol de clé, MITM à l'intégration |
| Vortex DNS | 53 | DNS | Empoisonnement de cache, transfert de zone |

---

## Cibles à Haute Valeur

### Fichiers Critiques (Accès Écriture = Root)

```
/etc/config/network          # Configuration réseau
/etc/config/firewall         # Règles pare-feu
/etc/config/haproxy          # Routes du reverse proxy
/etc/config/crowdsec         # Configuration agent CrowdSec
/etc/shadow                  # Hashes des mots de passe
/etc/dropbear/authorized_keys
```

### Handlers RPCD (Code Shell)

```
/usr/libexec/rpcd/luci.*     # Scripts backend LuCI
/usr/sbin/*ctl               # Outils CLI (crowdsecctl, haproxyctl, etc.)
/usr/lib/secubox/            # Bibliothèques partagées
```

### Secrets

```
/etc/config/smtp-relay       # Identifiants SMTP (option password)
/etc/config/wireguard        # Clés privées WireGuard
/etc/config/dns-provider     # Clés API DNS (Gandi, OVH, Cloudflare)
/srv/mitmproxy/*.pem         # Certificats TLS
/etc/crowdsec/local_api_credentials.yaml
```

---

## Points Faibles Connus (Divulgation Intentionnelle)

### 1. Risque d'Injection Shell RPCD

De nombreux handlers RPCD utilisent des scripts shell avec des données UCI :
```sh
# Exemple de pattern (potentiellement vulnérable)
local value=$(uci get config.section.option)
eval "command $value"  # ← Injection shell si la valeur UCI contient $(...)
```

**Vérifier :** Tous les handlers `luci.*` dans `/usr/libexec/rpcd/`

### 2. Opportunités de Contournement WAF

Le WAF mitmproxy utilise du pattern matching :
- Les gros corps de requête peuvent épuiser la mémoire
- Cas limites de l'encodage chunked
- Particularités du parsing multipart
- Gestion de l'upgrade WebSocket

**Vérifier :** `/srv/mitmproxy/haproxy_router.py`

### 3. Évasions de Conteneurs LXC

Les conteneurs tournent avec des privilèges limités mais :
- Certains ont des bind mounts vers des chemins hôte
- Les limites cgroup v2 peuvent être contournables
- L'isolation des namespaces varie selon le conteneur

**Vérifier :** `/srv/lxc/*/config`

### 4. Confiance Mesh P2P

Master Link utilise la confiance au premier contact :
- L'échange initial de clé WireGuard peut être interceptable
- Les messages gossip sont signés mais la chaîne de confiance est peu profonde

**Vérifier :** `/usr/sbin/master-linkctl`, `/usr/sbin/secubox-p2p`

### 5. Cross-Site Scripting (XSS)

Les vues LuCI affichent des données contrôlées par l'utilisateur :
- Nom d'hôte, adresses MAC, commentaires utilisateur
- Entrées de logs affichées dans les tableaux de bord
- Contenu des rapports dans les emails HTML

**Vérifier :** Tous les fichiers JavaScript dans `htdocs/luci-static/resources/view/*/`

---

## Périmètre du Bug Bounty

### Dans le Périmètre

| Sévérité | Catégorie | Exemples |
|----------|-----------|----------|
| **Critique** | RCE, Contournement Auth | Injection shell dans RPCD, identifiants codés en dur |
| **Haute** | Élévation de Privilèges | Évasion LXC, contournement WAF avec RCE |
| **Moyenne** | Divulgation d'Information | Fuite d'identifiants, traversée de chemin |
| **Basse** | DoS, XSS | Épuisement mémoire, XSS stocké dans les logs |

### Hors Périmètre

- Attaques auto-DoS (utilisateur crashant son propre routeur)
- Ingénierie sociale
- Attaques nécessitant un accès physique
- Bugs logiciels tiers (cœur OpenWrt, paquets upstream)
- Contournements de rate limiting sans impact

---

## Signalement

### Contact

- **Email :** security@cybermind.fr
- **Clé GPG :** Disponible sur demande
- **GitHub Issues :** [github.com/CyberMind-FR/secubox-openwrt/security](https://github.com/CyberMind-FR/secubox-openwrt/security)

### Format de Rapport

```
## Résumé
[Description en une ligne]

## Sévérité
[Critique/Haute/Moyenne/Basse]

## Composant Affecté
[Nom du paquet, chemin du fichier, méthode RPCD]

## Étapes de Reproduction
1. ...
2. ...
3. ...

## Preuve de Concept
[Code, captures d'écran ou vidéo]

## Impact
[Que peut accomplir un attaquant ?]

## Correction Suggérée
[Optionnel]
```

### Délais de Réponse

| Phase | Délai |
|-------|-------|
| Accusé de réception | 24 heures |
| Triage | 72 heures |
| Correctif (Critique) | 7 jours |
| Correctif (Haute/Moyenne) | 30 jours |
| Divulgation Publique | 90 jours |

---

## Configuration de l'Environnement de Test

### Appliance VirtualBox

```bash
# Construire l'image VM
./secubox-tools/c3box-vm-builder.sh full

# Importer dans VirtualBox
VBoxManage import secubox-v1.0.0-beta.ova
```

### Docker (Limité)

```bash
# Tests LuCI uniquement
docker run -p 8080:80 ghcr.io/cybermind-fr/secubox-luci:beta
```

### Matériel Réel

Recommandé : Mini PC x86-64 ou SBC ARM64 (NanoPi R4S, Raspberry Pi 4)

---

## Mentions Légales

Ceci est un programme de recherche en sécurité autorisé. En participant, vous acceptez de :

1. Tester uniquement sur des systèmes que vous possédez ou avez l'autorisation de tester
2. Ne pas accéder, modifier ou supprimer des données au-delà de ce qui est nécessaire pour démontrer la vulnérabilité
3. Signaler les vulnérabilités de manière responsable avant toute divulgation publique
4. Ne pas utiliser les vulnérabilités découvertes à des fins malveillantes

**Licence :** Apache-2.0
**© 2024-2026 CyberMind.fr**

---

## Remerciements

Les chercheurs en sécurité qui signalent des vulnérabilités valides seront crédités dans :
- Hall of Fame de `SECURITY.md`
- Notes de version
- Site web du projet

**Ex Tenebris, Lux Securitas**
