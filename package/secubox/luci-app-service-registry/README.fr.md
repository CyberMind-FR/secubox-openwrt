[English](README.md) | Francais | [中文](README.zh.md)

# Registre de Services SecuBox

Tableau de bord d'agregation de services unifie avec publication automatique vers HAProxy (clearnet) et Tor (services caches), incluant la surveillance de sante et la generation de codes QR.

## Fonctionnalites

- **Decouverte de Services** - Detecte automatiquement les services en cours d'execution depuis :
  - Vhosts HAProxy
  - Services caches Tor
  - Ports en ecoute directe (netstat)
  - Conteneurs LXC
- **Publication en Un Clic** - Publier des services vers clearnet et/ou Tor
- **Surveillance de Sante** - Statut DNS, certificat et pare-feu en temps reel
- **Verificateur de Disponibilite URL** - Verifier la configuration du domaine avant la mise en ligne
- **Codes QR** - Generer des codes QR pour un acces mobile facile
- **Page d'Accueil** - HTML statique auto-genere avec tous les services publies

## Tableau de Bord

### Panneau de Connectivite Reseau

Statut reseau en temps reel affichant :
- **IPv4 Publique** - Votre adresse IP externe avec nom d'hote DNS inverse
- **IPv6 Publique** - Adresse IPv6 si disponible
- **Port Externe 80/443** - Si les ports sont accessibles depuis Internet (teste le transfert du routeur amont/FAI)
- **Pare-feu Local** - Statut des regles de pare-feu OpenWrt
- **HAProxy** - Statut du conteneur proxy inverse

### Barre de Resume de Sante

Affiche le statut global du systeme en un coup d'oeil :
- Statut des ports pare-feu 80/443
- Statut du conteneur HAProxy
- Statut du daemon Tor
- Nombre de resolutions DNS
- Nombre de certificats sains

### Verificateur de Disponibilite URL

Avant de publier un service, verifiez que le domaine est correctement configure :

1. Entrez un domaine dans le verificateur (ex: `example.com`)
2. Cliquez sur "Verifier" pour valider :
   - **Votre IP Publique** - Affiche vos adresses IPv4/IPv6 et DNS inverse
   - **Resolution DNS** - Verifie que le domaine pointe vers votre IP publique (detecte les erreurs d'IP privee)
   - **Accessibilite Internet** - Teste si les ports 80/443 sont accessibles depuis Internet (verification du routeur amont)
   - **Pare-feu Local** - Statut des regles de pare-feu OpenWrt
   - **Certificat SSL** - Certificat valide avec statut d'expiration
   - **HAProxy** - Conteneur proxy inverse en cours d'execution

Le verificateur fournit des recommandations actionnables specifiques :
- Si le DNS pointe vers une IP privee (ex: 192.168.x.x), affiche l'IP publique correcte a utiliser
- Si les ports sont bloques exterieurement, conseille de verifier le transfert de port du routeur amont
- Affiche l'enregistrement DNS A exact a creer : `domaine.com → votre.ip.publique`

### Indicateurs de Sante des Services

Chaque service publie affiche des badges de sante en ligne :

| Badge | Signification |
|-------|---------------|
| Globe | DNS resout correctement |
| X | Resolution DNS echouee |
| Cadenas | Certificat valide (30+ jours) |
| Attention | Certificat expire bientot (7-30 jours) |
| Rouge | Certificat critique (<7 jours) |
| Mort | Certificat expire |
| Blanc | Aucun certificat configure |
| Oignon | Service cache Tor active |

## Publication d'un Service

### Publication Rapide (LuCI)

1. Allez dans **Services > Registre de Services**
2. Trouvez votre service dans "Services Decouverts"
3. Cliquez sur Publier pour une publication rapide
4. Ajoutez optionnellement :
   - Domaine (cree un vhost HAProxy + demande un certificat ACME)
   - Service cache Tor

### Publication CLI

```bash
# Lister les services decouverts
secubox-registry list

# Publier avec domaine (clearnet)
secubox-registry publish myapp 8080 --domain app.example.com

# Publier avec service cache Tor
secubox-registry publish myapp 8080 --tor

# Publier avec les deux
secubox-registry publish myapp 8080 --domain app.example.com --tor

# Depublier
secubox-registry unpublish myapp
```

### Ce qui se Passe a la Publication

Quand vous publiez un service avec un domaine :

1. **Backend Cree** - Backend HAProxy pointant vers le port local
2. **Vhost Cree** - Vhost HAProxy pour le domaine
3. **Pare-feu Ouvert** - Ports 80/443 ouverts depuis WAN (auto)
4. **Certificat Demande** - Certificat ACME via Let's Encrypt
5. **Page d'Accueil Mise a Jour** - HTML statique regenere

## API de Verification de Sante

### Obtenir les Infos Reseau

```bash
ubus call luci.service-registry get_network_info
```

Reponse :
```json
{
  "success": true,
  "lan_ip": "192.168.255.1",
  "ipv4": {
    "address": "185.220.101.12",
    "status": "ok",
    "hostname": "server.example.com"
  },
  "ipv6": {
    "address": "2001:db8::1",
    "status": "ok"
  },
  "external_ports": {
    "http": { "accessible": true, "status": "open" },
    "https": { "accessible": true, "status": "open" }
  },
  "firewall": {
    "status": "ok",
    "http_open": true,
    "https_open": true
  },
  "haproxy": { "status": "running" }
}
```

### Verifier un Domaine Unique

```bash
ubus call luci.service-registry check_service_health '{"domain":"example.com"}'
```

Reponse :
```json
{
  "success": true,
  "domain": "example.com",
  "public_ip": {
    "ipv4": "185.220.101.12",
    "ipv6": "2001:db8::1",
    "hostname": "server.example.com"
  },
  "dns": {
    "status": "ok",
    "resolved_ip": "185.220.101.12"
  },
  "external_access": {
    "status": "ok",
    "http_accessible": true,
    "https_accessible": true
  },
  "firewall": {
    "status": "ok",
    "http_open": true,
    "https_open": true
  },
  "certificate": {
    "status": "ok",
    "days_left": 45
  },
  "haproxy": {
    "status": "running"
  }
}
```

Valeurs de statut DNS :
- `ok` - Le domaine pointe vers votre IP publique
- `private` - Le domaine pointe vers une IP privee (192.168.x.x, 10.x.x.x, etc.)
- `mismatch` - Le domaine pointe vers une IP publique differente
- `failed` - Resolution DNS echouee

### Verifier Tous les Services

```bash
ubus call luci.service-registry check_all_health
```

La reponse inclut la sante agregee pour tous les domaines publies.

## Depannage

### DNS ne Resout pas

1. Verifiez que l'enregistrement DNS A pointe vers votre IP publique
2. Verifiez avec : `nslookup example.com`
3. La propagation DNS peut prendre jusqu'a 48 heures

### Ports Pare-feu Fermes

1. Verifiez les regles de pare-feu : `uci show firewall | grep HAProxy`
2. Les ports devraient s'ouvrir automatiquement a la publication
3. Correction manuelle :
   ```bash
   uci add firewall rule
   uci set firewall.@rule[-1].name='HAProxy-HTTP'
   uci set firewall.@rule[-1].src='wan'
   uci set firewall.@rule[-1].dest_port='80'
   uci set firewall.@rule[-1].proto='tcp'
   uci set firewall.@rule[-1].target='ACCEPT'
   uci commit firewall
   /etc/init.d/firewall reload
   ```

### Certificat Manquant

1. Assurez-vous que le DNS du domaine est correctement configure
2. Assurez-vous que le port 80 est accessible depuis Internet
3. Demandez le certificat via HAProxy :
   ```bash
   haproxyctl cert add example.com
   ```

### 503 Service Non Disponible

Causes courantes :
1. **Backend non en cours d'execution** - Verifiez si le service ecoute reellement
2. **Mauvais port backend** - Verifiez la configuration du backend HAProxy
3. **HAProxy non en cours d'execution** - Verifiez le statut du conteneur

```bash
# Verifier que le service ecoute
netstat -tln | grep :8080

# Verifier le statut HAProxy
haproxyctl status

# Verifier la config HAProxy
haproxyctl validate
```

## Configuration

### Parametres UCI

```bash
# Parametres principaux
uci set service-registry.main.enabled='1'
uci set service-registry.main.auto_tor='0'        # Auto-creer Tor a la publication
uci set service-registry.main.auto_haproxy='0'    # Auto-creer HAProxy a la publication
uci set service-registry.main.landing_auto_regen='1'

# Toggles des fournisseurs
uci set service-registry.haproxy.enabled='1'
uci set service-registry.tor.enabled='1'
uci set service-registry.direct.enabled='1'
uci set service-registry.lxc.enabled='1'

uci commit service-registry
```

## Emplacements des Fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/service-registry` | Configuration UCI |
| `/www/secubox-services.html` | Page d'accueil generee |
| `/usr/sbin/secubox-registry` | Outil CLI |
| `/usr/sbin/secubox-landing-gen` | Generateur de page d'accueil |
| `/usr/libexec/rpcd/luci.service-registry` | Backend RPCD |

## Methodes RPCD

| Methode | Description |
|---------|-------------|
| `list_services` | Lister tous les services de tous les fournisseurs |
| `publish_service` | Publier un service vers HAProxy/Tor |
| `unpublish_service` | Supprimer un service de HAProxy/Tor |
| `check_service_health` | Verifier DNS/cert/pare-feu/acces externe pour le domaine |
| `check_all_health` | Verification de sante en lot pour tous les services |
| `get_network_info` | Obtenir les IPs publiques, accessibilite des ports externes, statut du pare-feu |
| `generate_landing_page` | Regenerer la page d'accueil statique |

## Licence

Licence MIT - Copyright (C) 2025 CyberMind.fr
