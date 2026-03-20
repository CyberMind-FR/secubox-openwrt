[English](README.md) | Francais | [中文](README.zh.md)

# Tor Shield - Routage anonyme simplifie

Protection de la vie privee a l'echelle du reseau via le reseau Tor avec activation en un clic.

## Fonctionnalites

### Modes de protection

| Mode | Description | Cas d'usage |
|------|-------------|-------------|
| **Proxy transparent** | Tout le trafic reseau route automatiquement via Tor | Anonymat reseau complet |
| **Proxy SOCKS** | Applications se connectent via SOCKS5 (127.0.0.1:9050) | Protection selective des applications |
| **Mode Bridge** | Utilise les bridges obfs4/meek pour contourner la censure | Reseaux restrictifs |

### Presets de demarrage rapide

| Preset | Icone | Configuration |
|--------|-------|---------------|
| **Anonymat complet** | Protection | Transparent + DNS sur Tor + Kill Switch |
| **Applications selectives** | Cible | SOCKS uniquement, pas de kill switch |
| **Contourner la censure** | Deverrouillage | Bridges actives + obfs4 |

### Fonctionnalites de securite

- **Kill Switch** - Bloque tout le trafic si Tor se deconnecte
- **DNS sur Tor** - Previent les fuites DNS
- **Nouvelle identite** - Demander de nouveaux circuits instantanement
- **Test de fuite** - Verifier que votre protection fonctionne
- **Services caches** - Heberger des sites .onion

## Tableau de bord

Le tableau de bord fournit une surveillance en temps reel :

```
+--------------------------------------------------+
|  Tor Shield                           Protege    |
+--------------------------------------------------+
|                                                  |
|  +------------+    Votre statut de protection    |
|  |   Onion    |    --------------------------    |
|  |   Toggle   |    IP reelle:    192.168.x.x     |
|  |            |    Sortie Tor:   185.220.x.x DE  |
|  +------------+                                  |
|                                                  |
|  +---------------------------------------------+ |
|  | Anonymat    | Apps        | Contournement  | |
|  | complet     | selectives  | censure        | |
|  +---------------------------------------------+ |
|                                                  |
|  Circuits: 5  | 45 KB/s  | 2h 15m                |
|  DL: 125 MB   | UL: 45 MB|                       |
|                                                  |
|  +---------+---------+---------+---------+       |
|  | Service | Boot    | DNS     | Kill    |       |
|  | Running | 100%    | Protege | Actif   |       |
|  +---------+---------+---------+---------+       |
+--------------------------------------------------+
```

## Services caches

Hebergez vos services sur le reseau Tor avec des adresses .onion :

```bash
# Via LuCI
Services -> Tor Shield -> Services caches -> Ajouter

# Via CLI
ubus call luci.tor-shield add_hidden_service '{"name":"monsite","local_port":80,"virtual_port":80}'

# Obtenir l'adresse onion
cat /var/lib/tor/hidden_service_monsite/hostname
```

### Exemples de services caches

| Service | Port local | Port Onion | Cas d'usage |
|---------|-----------|------------|-------------|
| Serveur web | 80 | 80 | Site web anonyme |
| SSH | 22 | 22 | Acces distant securise |
| API | 8080 | 80 | Point d'acces API anonyme |

## Bridges

Contournez la censure reseau en utilisant les bridges Tor :

### Types de bridge

| Type | Description | Quand l'utiliser |
|------|-------------|------------------|
| **obfs4** | Protocole obfusque | La plupart des reseaux censures |
| **meek-azure** | Domain fronting via Azure | Reseaux tres restrictifs |
| **snowflake** | Base sur WebRTC | Decouverte dynamique de bridges |

### Detection automatique des bridges

```bash
# Activer la selection automatique des bridges
uci set tor-shield.main.auto_bridges=1
uci commit tor-shield
/etc/init.d/tor-shield restart
```

## Configuration

### Parametres UCI

```bash
# /etc/config/tor-shield

config tor-shield 'main'
    option enabled '1'
    option mode 'transparent'      # transparent | socks
    option dns_over_tor '1'        # Router DNS via Tor
    option kill_switch '1'         # Bloquer trafic si Tor echoue
    option auto_bridges '0'        # Auto-detecter la censure

config socks 'socks'
    option port '9050'
    option address '127.0.0.1'

config trans 'trans'
    option port '9040'
    option dns_port '9053'
    list excluded_ips '192.168.255.0/24'  # Bypass LAN

config bridges 'bridges'
    option enabled '0'
    option type 'obfs4'

config security 'security'
    option exit_nodes ''           # Codes pays : {us},{de}
    option exclude_exit_nodes ''   # Eviter : {ru},{cn}
    option strict_nodes '0'

config hidden_service 'hs_monsite'
    option enabled '1'
    option name 'monsite'
    option local_port '80'
    option virtual_port '80'
```

## API RPCD

### Statut et controle

```bash
# Obtenir le statut
ubus call luci.tor-shield status

# Activer avec preset
ubus call luci.tor-shield enable '{"preset":"anonymous"}'

# Desactiver
ubus call luci.tor-shield disable

# Redemarrer
ubus call luci.tor-shield restart

# Demander une nouvelle identite
ubus call luci.tor-shield new_identity

# Verifier les fuites
ubus call luci.tor-shield check_leaks
```

### Gestion des circuits

```bash
# Obtenir les circuits actifs
ubus call luci.tor-shield circuits

# Reponse :
{
  "circuits": [{
    "id": "123",
    "status": "BUILT",
    "path": "$A~Guard,$B~Middle,$C~Exit",
    "purpose": "GENERAL",
    "nodes": [
      {"fingerprint": "ABC123", "name": "Guard"},
      {"fingerprint": "DEF456", "name": "Middle"},
      {"fingerprint": "GHI789", "name": "Exit"}
    ]
  }]
}
```

### Services caches

```bash
# Lister les services caches
ubus call luci.tor-shield hidden_services

# Ajouter un service cache
ubus call luci.tor-shield add_hidden_service '{"name":"web","local_port":80,"virtual_port":80}'

# Supprimer un service cache
ubus call luci.tor-shield remove_hidden_service '{"name":"web"}'
```

### Statistiques de bande passante

```bash
# Obtenir la bande passante
ubus call luci.tor-shield bandwidth

# Reponse :
{
  "read": 125000000,      # Total octets telecharges
  "written": 45000000,    # Total octets uploades
  "read_rate": 45000,     # Taux de telechargement actuel (octets/sec)
  "write_rate": 12000     # Taux d'upload actuel (octets/sec)
}
```

## Depannage

### Tor ne demarre pas

```bash
# Verifier les logs
logread | grep -i tor

# Verifier la config
tor --verify-config -f /var/run/tor/torrc

# Verifier le socket de controle
ls -la /var/run/tor/control
```

### Connexions lentes

1. **Verifier le bootstrap** - Attendre 100% de completion
2. **Essayer les bridges** - Le reseau peut throttler Tor
3. **Changer de circuits** - Cliquer "Nouvelle identite"
4. **Verifier les noeuds de sortie** - Certaines sorties sont lentes

### Fuites DNS

```bash
# Verifier que DNS passe par Tor
nslookup check.torproject.org

# Devrait resoudre via Tor DNS (127.0.0.1:9053)
```

### Problemes de Kill Switch

```bash
# Verifier les regles firewall
iptables -L -n | grep -i tor

# Verifier la config du kill switch
uci get tor-shield.main.kill_switch
```

## Emplacements des fichiers

| Chemin | Description |
|--------|-------------|
| `/etc/config/tor-shield` | Configuration UCI |
| `/var/run/tor/torrc` | Config Tor generee |
| `/var/run/tor/control` | Socket de controle |
| `/var/lib/tor/` | Repertoire de donnees Tor |
| `/var/lib/tor/hidden_service_*/` | Cles des services caches |
| `/tmp/tor_exit_ip` | IP de sortie en cache |
| `/tmp/tor_real_ip` | IP reelle en cache |

## Notes de securite

1. **Kill Switch** - Toujours activer pour une protection maximale
2. **Fuites DNS** - Activer DNS sur Tor pour prevenir les fuites
3. **Services caches** - Les cles dans `/var/lib/tor/` sont sensibles - sauvegardez-les en securite
4. **Noeuds de sortie** - Envisagez d'exclure certains pays pour un usage sensible
5. **Bridges** - Utilisez-les si votre FAI bloque ou throttle Tor

## Licence

Licence MIT - Copyright (C) 2025 CyberMind.fr
