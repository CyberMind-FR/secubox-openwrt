# Tableau de Bord des Services Reseau (luci-app-network-tweaks)

**Surveillance unifiee des services reseau avec decouverte dynamique des composants, suivi d'impact cumulatif et synchronisation automatique DNS/hosts**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Licence](https://img.shields.io/badge/license-Apache--2.0-green.svg)
![Plateforme](https://img.shields.io/badge/platform-OpenWrt-orange.svg)

## Apercu

Le Tableau de Bord des Services Reseau (anciennement Network Tweaks) combine la synchronisation DNS automatique des VHosts avec une surveillance complete des services reseau. Il offre une visibilite en temps reel sur tous les services impactant le reseau, leur effet cumulatif sur votre systeme, et s'integre avec les Modes Reseau pour une configuration basee sur les profils.

### Fonctionnalites Cles

#### Tableau de Bord des Services Reseau (v2.0+)
- **Decouverte Dynamique des Composants** - Decouvre automatiquement les services lies au reseau depuis le catalogue de plugins SecuBox
- **Suivi d'Impact Cumulatif** - Metriques en temps reel montrant le total des entrees DNS, VHosts et ports exposes
- **Integration Mode Reseau** - Parametres de synchronisation controles par les profils de mode reseau
- **Rafraichissement Automatique** - Mises a jour en direct toutes les 10 secondes
- **Agregation de Donnees Multi-Sources** - Combine metadonnees de manifeste, etat d'installation, statut runtime et associations VHost
- **Interface Grille Moderne** - Disposition responsive basee sur cartes avec vues detaillees des composants

#### Synchronisation de Base (v1.0+)
- **Generation DNS Automatique** - Cree des entrees de configuration DNSmasq pour tous les domaines VHost actives
- **Gestion du Fichier Hosts** - Met a jour `/etc/hosts` avec les entrees de domaines VHost
- **Synchronisation Temps Reel** - Surveille les changements de configuration VHost et met a jour automatiquement
- **Integration LuCI** - Interface web conviviale avec tableau de bord de statut
- **Configuration Flexible** - Choisissez les fonctionnalites a activer (DNS, hosts, ou les deux)
- **Conscience Reseau** - Detection automatique de l'IP LAN ou remplacement manuel

## Table des Matieres

- [Installation](#installation)
- [Demarrage Rapide](#demarrage-rapide)
- [Tableau de Bord des Services Reseau](#tableau-de-bord-des-services-reseau)
- [Synchronisation de Base](#synchronisation-de-base)
- [Configuration](#configuration)
- [Integration Mode Reseau](#integration-mode-reseau)
- [Documentation Technique](#documentation-technique)
- [Depannage](#depannage)
- [Developpement](#developpement)
- [Journal des Modifications](#journal-des-modifications)

## Installation

```bash
# Compiler le paquet
make package/luci-app-network-tweaks/compile

# Installer sur le routeur
opkg install luci-app-network-tweaks_*.ipk

# Activer et demarrer
/etc/init.d/network-tweaks enable
/etc/init.d/network-tweaks start
```

## Demarrage Rapide

1. **Acceder au Tableau de Bord** :
   - Naviguer vers **Reseau -> Tableau de Bord Services Reseau** dans LuCI

2. **Voir l'Impact Reseau** :
   - Voir les composants actifs, entrees DNS, VHosts et ports exposes en un coup d'oeil
   - Surveiller le statut et les contributions de chaque service

3. **Configurer la Synchronisation** :
   - Activer la synchronisation DNS et/ou hosts
   - Choisir le mode auto-sync ou manuel

4. **Integration avec VHost Manager** :
   - Activer les VHosts dans VHost Manager
   - Network Tweaks les rend automatiquement resolvables sur votre LAN

## Tableau de Bord des Services Reseau

### Architecture

```
Manifestes Catalogue Plugins -> Moteur Decouverte -> Agregation Donnees -> Affichage Tableau de Bord
         |                            |                    |                      |
    fichiers *.json           Filtre reseau          Modele unifie          Cartes grille
    (metadonnees)           (ports/protocoles)      (JSON)                  + metriques
```

### Sections du Tableau de Bord

#### 1. Resume d'Impact

Quatre cartes de metriques montrant l'impact reseau global :

| Metrique | Description |
|----------|-------------|
| **Composants Actifs** | Services actuellement en cours d'execution |
| **Entrees DNS** | Total des enregistrements DNS geres |
| **VHosts Publies** | Hotes virtuels configures |
| **Ports Exposes** | Ports reseau ouverts |

#### 2. Statut Mode Reseau

Affiche :
- Mode reseau actuel (Routeur, DMZ, Voyage, etc.)
- Parametres de synchronisation specifiques au mode
- Si la synchronisation DNS est activee

#### 3. Grille des Composants

Grille responsive de cartes de composants, chacune montrant :

**Badges de Statut** :
- **En cours** - Service actif
- **Arrete** - Service installe mais non en cours
- **N/A** - Pas de runtime disponible

**Etat d'Installation** :
- **Installe** - Tous les paquets presents
- **Partiel** - Certains paquets manquants
- **Disponible** - Pret a installer

**Impact Reseau** :
- **Entrees DNS** - Nombre d'enregistrements DNS
- **VHosts** - Hotes virtuels publies
- **Ports** - Ports reseau exposes

**Contribution** :
- Montre combien ce composant ajoute a la configuration globale

**Actions** :
- **Details** - Voir les informations completes du composant

### Modal Details Composant

Cliquer sur **Details** sur n'importe quelle carte pour voir :

```
Composant: AdGuard Home
Categorie: reseau
Etat Installation: installe
Etat Service: en cours

Impact Reseau:
- Entrees DNS: 1
- VHosts: 1
- Ports: 2

Capacites:
[filtrage-dns] [blocage-pubs] [publication-vhost]
```

### Processus de Decouverte

1. **Scan des Manifestes** : Scanne `/usr/share/secubox/plugins/catalog/*.json`
2. **Filtrage Reseau** : Identifie les apps avec impact reseau :
   - `network.inbound_ports[]` - Apps exposant des ports reseau
   - `network.protocols[]` - Apps utilisant des protocoles reseau
   - `capabilities[]` - Capacites liees au reseau
3. **Requetes d'Etat** :
   - **Etat Installation** : via `opkg status` ou `apk info`
   - **Etat Runtime** : via `docker ps` ou services init.d
   - **Associations VHost** : correspondances avec VHosts publies
4. **Calcul d'Impact** : Compte entrees DNS, hosts, ports, VHosts
5. **Agregation** : Combine en reponse JSON unifiee

### Detection de Pertinence Reseau

Une app apparait dans le tableau de bord si son manifeste contient :

**Ports Reseau** :
```json
{
  "network": {
    "inbound_ports": [53, 3000]
  }
}
```

**Protocoles Reseau** :
```json
{
  "network": {
    "protocols": ["http", "https", "dns"]
  }
}
```

**Capacites Reseau** :
```json
{
  "capabilities": [
    "vhost-publish",
    "dns-filtering",
    "proxy",
    "firewall",
    "vpn",
    "network-service"
  ]
}
```

## Synchronisation de Base

### Fonctionnement

1. **Surveille les VHosts** : Observe `/etc/config/vhosts` pour les hotes virtuels actives
2. **Genere les Entrees** :
   - **DNSmasq** : Cree `/tmp/dnsmasq.d/50-vhosts.conf` avec entrees `address=/domain/ip`
   - **Hosts** : Ajoute des entrees a `/etc/hosts` dans une section geree
3. **Rechargement Auto** : Recharge automatiquement DNSmasq quand des changements sont detectes
4. **Declencheurs** :
   - Changements de configuration VHost (via declencheurs UCI)
   - Evenements d'interface reseau up (LAN)
   - Synchronisation manuelle via LuCI ou CLI

### Fichiers Generes

#### Configuration DNSmasq
**Emplacement** : `/tmp/dnsmasq.d/50-vhosts.conf`

```
# Entrees DNS auto-generees pour les domaines VHost Manager
# Gere par network-tweaks
# IP: 192.168.1.1
# Genere: 2026-01-01 12:00:00

address=/cloud.local/192.168.1.1
address=/adguard.local/192.168.1.1
address=/domoticz.local/192.168.1.1
```

#### Entrees Hosts
**Ajoute a** : `/etc/hosts`

```
# Gere par network-tweaks
# Entrees hosts auto-generees pour les domaines VHost Manager
# Genere: 2026-01-01 12:00:00
192.168.1.1 cloud.local
192.168.1.1 adguard.local
192.168.1.1 domoticz.local
```

### Utilisation en Ligne de Commande

```bash
# Synchroniser toutes les entrees
network-tweaks-sync sync

# Voir le statut actuel
network-tweaks-sync status

# Nettoyer toutes les entrees gerees
network-tweaks-sync cleanup
```

### Gestion du Service

```bash
# Activer le demarrage automatique
/etc/init.d/network-tweaks enable

# Demarrer le service
/etc/init.d/network-tweaks start

# Recharger la configuration (declenche sync)
/etc/init.d/network-tweaks reload

# Verifier le statut
/etc/init.d/network-tweaks status
```

## Configuration

### Parametres Interface Web

Trouves sous la section **Configuration** dans le tableau de bord :

| Option | Defaut | Description |
|--------|--------|-------------|
| **Activer Network Tweaks** | Oui | Interrupteur principal pour synchronisation DNS/hosts |
| **Sync Auto** | Oui | Synchroniser automatiquement quand la config VHost change |
| **Sync DNSmasq** | Oui | Generer config DNSmasq pour resolution de domaine local |
| **Sync /etc/hosts** | Oui | Mettre a jour /etc/hosts avec domaines VHost |
| **Interface LAN** | `lan` | Interface reseau pour detection d'adresse IP |
| **IP de Remplacement** | _vide_ | Specifier manuellement l'IP (vide = auto-detection) |

### Fichier de Configuration

Editer `/etc/config/network_tweaks` :

```
config global 'global'
	option enabled '1'            # Activer/desactiver Network Tweaks
	option auto_sync '1'          # Sync auto sur changements config
	option sync_hosts '1'         # Mettre a jour /etc/hosts
	option sync_dnsmasq '1'       # Generer config DNSmasq
	option lan_interface 'lan'    # Interface a utiliser pour IP
	option default_ip ''          # Remplacement IP manuel (vide = auto-detect)
```

## Integration Mode Reseau

Chaque profil de mode reseau inclut des parametres network-tweaks :

### Mode Routeur (Defaut)
```
config mode 'router'
	option network_tweaks_enabled '1'
	option network_tweaks_sync_hosts '1'
	option network_tweaks_sync_dnsmasq '1'
	option network_tweaks_auto_sync '1'
```

### Mode Sniffer (Transparent)
```
config mode 'sniffer'
	option network_tweaks_enabled '0'    # Desactive pour transparence
	option network_tweaks_sync_hosts '0'
	option network_tweaks_sync_dnsmasq '0'
```

### Autres Modes
Tous les autres modes (DMZ, Point d'Acces, Relais, Double NAT, Voyage, Multi-WAN, Relais VPN) activent network-tweaks avec synchronisation complete.

## Documentation Technique

### API RPC Backend

#### `getNetworkComponents`

Retourne tous les composants lies au reseau avec donnees agregees.

**Requete** : Pas de parametres

**Reponse** :
```json
{
  "success": true,
  "components": [
    {
      "id": "adguardhome",
      "name": "AdGuard Home",
      "category": "network",
      "install_state": "installed",
      "service_state": "running",
      "network_impact": {
        "dns_entries": 1,
        "vhosts": 1,
        "ports": 2
      },
      "cumulative_contribution": {
        "dnsmasq_entries": 1,
        "hosts_entries": 1,
        "ports_opened": 2
      },
      "capabilities": ["dns-filtering", "vhost-publish"]
    }
  ],
  "cumulative_summary": {
    "total_components": 12,
    "active_components": 8,
    "total_dns_entries": 18,
    "total_vhosts": 6,
    "total_ports_exposed": 23
  },
  "network_mode": {
    "current_mode": "router",
    "mode_name": "Router",
    "sync_enabled": true
  }
}
```

#### `getCumulativeImpact`

Retourne le resume agrege de l'impact reseau.

#### `setComponentEnabled`

Active/desactive les fonctionnalites reseau d'un composant.

**Requete** :
```json
{
  "app_id": "adguardhome",
  "enabled": true
}
```

#### Methodes Legacy

- `getStatus` - Statut avec comptages VHost
- `syncNow` - Declencher synchronisation immediate
- `getConfig` - Obtenir configuration actuelle
- `setConfig` - Mettre a jour configuration

### Integration CLI

**Commandes UBUS** :
```bash
# Obtenir tous les composants
ubus call luci.network-tweaks getNetworkComponents

# Obtenir impact cumulatif
ubus call luci.network-tweaks getCumulativeImpact

# Obtenir configuration
ubus call luci.network-tweaks getConfig

# Declencher sync
ubus call luci.network-tweaks syncNow
```

### Architecture Frontend

**Vue Principale** : `/luci-static/resources/view/network-tweaks/overview.js`

Methodes cles :
- `load()` - Initialiser donnees et charger CSS
- `renderDashboard()` - Construire tableau de bord complet
- `renderCumulativeImpact()` - Cartes resume d'impact
- `renderNetworkModeStatus()` - Indicateur de mode
- `renderComponentsGrid()` - Cartes composants
- `showComponentDetails()` - Modal details
- `pollData()` - Rafraichissement auto (intervalle 10s)
- `updateDisplay()` - Mise a jour DOM en direct

**Style** : `/luci-static/resources/network-tweaks/dashboard.css`

Grille responsive :
- Bureau : grille 4 colonnes (min 200px)
- Mobile : colonne unique
- Effets hover et animations
- Codage couleur des statuts

## Depannage

### Composants Non Affiches

**Symptomes** : Le tableau de bord affiche "Aucun composant impactant le reseau detecte"

**Solutions** :
1. Verifier que le catalogue de plugins existe :
   ```bash
   ls /usr/share/secubox/plugins/catalog/
   ```

2. Verifier le format du manifeste :
   ```bash
   cat /usr/share/secubox/plugins/catalog/adguardhome.json
   ```

3. Tester RPC manuellement :
   ```bash
   ubus call luci.network-tweaks getNetworkComponents
   ```

### Etat Service Affiche "N/A"

**Causes** :
- Docker non installe/en cours
- Script init n'existe pas
- Mauvais `runtime` dans le manifeste

**Solutions** :
1. Pour les apps Docker :
   ```bash
   docker ps --filter "name=adguardhome"
   ```

2. Pour les services natifs :
   ```bash
   /etc/init.d/service-name running
   ```

### Resolution DNS Ne Fonctionne Pas

**Solutions** :
1. Verifier config dnsmasq :
   ```bash
   cat /tmp/dnsmasq.d/50-vhosts.conf
   ```

2. Verifier dnsmasq en cours :
   ```bash
   ps | grep dnsmasq
   ```

3. Verifier fichier hosts :
   ```bash
   cat /etc/hosts
   ```

4. Declencher sync manuel :
   - Cliquer **Sync Maintenant** dans tableau de bord
   - Ou : `/usr/sbin/network-tweaks-sync sync`

5. S'assurer que les clients utilisent le routeur comme DNS :
   ```bash
   nslookup cloud.local
   ```

### Rafraichissement Auto Ne Fonctionne Pas

**Solutions** :
1. Verifier console navigateur pour erreurs
2. Verifier le polling (intervalle 10s)
3. Forcer rechargement : Ctrl+Shift+R

## Developpement

### Ajouter des Composants Personnalises

Creer une entree catalogue de plugin :

```bash
# /usr/share/secubox/plugins/catalog/myapp.json
{
  "id": "myapp",
  "name": "Mon Application Personnalisee",
  "category": "network",
  "runtime": "native",
  "packages": ["myapp"],
  "network": {
    "inbound_ports": [8080],
    "protocols": ["http"]
  },
  "capabilities": ["vhost-publish"]
}
```

### Ajouter de Nouvelles Methodes RPC

1. Declarer dans la section `list` :
   ```bash
   json_add_object "myMethod"
   json_close_object
   ```

2. Implementer dans la section `call` :
   ```bash
   myMethod)
       json_init
       json_add_boolean "success" 1
       # Implementation
       json_dump
       ;;
   ```

### Developpement Frontend

Ajouter des sections au tableau de bord :

```javascript
renderDashboard: function() {
    return E('div', { 'class': 'network-tweaks-dashboard' }, [
        this.renderCumulativeImpact(),
        this.renderMyNewSection(),  // Ajouter ici
        this.renderComponentsGrid()
    ]);
}
```

## Exemples de Workflows

### Configuration de Nextcloud avec Network Tweaks

1. Installer Nextcloud :
   ```bash
   nextcloudctl install
   /etc/init.d/nextcloud start
   ```

2. Creer VHost dans VHost Manager :
   - Domaine : `cloud.local`
   - Backend : `http://127.0.0.1:80`
   - SSL : Active
   - Activer VHost

3. Network Tweaks automatiquement :
   - Cree entree DNS : `cloud.local` -> `192.168.1.1`
   - Met a jour fichier hosts
   - Recharge DNSmasq

4. Acceder depuis n'importe quel appareil :
   - Ouvrir `https://cloud.local`
   - Le domaine se resout vers le routeur
   - Nginx transmet a Nextcloud

## Considerations de Performance

### Temps de Reponse
- Reponse RPC typique : 200-500ms
- Chargement initial tableau de bord : 1-2s
- Impact rafraichissement auto : Minimal

### Polling
- Intervalle : 10 secondes
- Impact CPU : Minimal
- Reseau : ~5KB par requete
- Memoire : Stable (pas d'accumulation)

### Optimisations Futures
- Cache TTL 30 secondes pour scans de manifestes
- Mises a jour de decouverte incrementales
- Worker en arriere-plan pour requetes lourdes

## Dependances

- `luci-base` - Interface web LuCI
- `rpcd` - Daemon RPC UBUS
- `luci-app-vhost-manager` - VHost Manager (source des domaines)
- `dnsmasq` - Serveur DNS

## Journal des Modifications

### v2.0.0 (2026-01-01) - Tableau de Bord Services Reseau

**Fonctionnalites Majeures** :
- Decouverte dynamique des composants depuis catalogue plugins
- Tableau de bord de suivi d'impact cumulatif
- Integration mode reseau
- Interface grille avec cartes composants
- Rafraichissement auto avec polling 10 secondes
- Modal details composants
- Design responsive avec support mode sombre

**Backend** :
- Ajout methode RPC `getNetworkComponents`
- Ajout methode RPC `getCumulativeImpact`
- Ajout methode RPC `setComponentEnabled`
- Ajout de 8 fonctions helper pour decouverte/agregation
- Integration statut mode reseau

**Frontend** :
- Reecriture complete de `overview.js`
- Nouveau `dashboard.css` avec systeme de grille
- Cartes resume d'impact
- Indicateur mode reseau
- Grille composants avec badges de statut

**Configuration** :
- Options network-tweaks ajoutees aux 8 modes reseau
- Config reste retrocompatible

### v1.0.0 - Version Initiale (Network Tweaks)

- Synchronisation basique VHost vers DNS/hosts
- Declencheur sync manuel
- Affichage simple des statistiques
- Auto-sync sur changements VHost
- Integration Hotplug

## Licence

Apache-2.0

## Auteur

CyberMind Studio <contact@cybermind.fr>

## Support

- **Issues** : https://github.com/CyberMind-FR/secubox-openwrt/issues
- **Documentation** : Ce README
- **Version** : 2.0.0
- **Derniere Mise a Jour** : 2026-01-01

## Contribution

Contributions bienvenues ! Veuillez :
1. Tester les changements soigneusement
2. Mettre a jour la documentation
3. Suivre le style de code existant
4. Soumettre une PR avec description claire
