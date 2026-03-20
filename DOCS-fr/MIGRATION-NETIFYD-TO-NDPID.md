# Plan de Migration: Netifyd vers nDPId

> **Languages:** [English](../DOCS/MIGRATION-NETIFYD-TO-NDPID.md) | Francais | [中文](../DOCS-zh/MIGRATION-NETIFYD-TO-NDPID.md)

## Resume Executif

Ce document fournit un plan de migration complet pour remplacer **Netifyd v5.2.1** par **nDPId** dans le projet SecuBox OpenWrt tout en maintenant une compatibilite complete avec les consommateurs CrowdSec et Netdata existants.

**Constatation Cle**: Netifyd et nDPId sont tous deux construits sur **nDPI** (la bibliotheque DPI sous-jacente). Netifyd est essentiellement un wrapper riche en fonctionnalites autour de nDPI avec integration cloud, tandis que nDPId est un daemon minimaliste haute performance avec une architecture microservice.

---

## Analyse de l'Architecture Actuelle

### Apercu de l'Integration Netifyd

| Composant | Emplacement | Objectif |
|-----------|-------------|----------|
| Package de Base | `secubox-app-netifyd` | Moteur DPI Netifyd v5.2.1 |
| App LuCI | `luci-app-secubox-netifyd` | UI Web avec surveillance temps reel |
| Backend RPCD | `/usr/libexec/rpcd/luci.secubox-netifyd` | 15 methodes lecture + 9 ecriture RPC |
| Config UCI | `/etc/config/secubox-netifyd` | Bascules fonctionnelles, plugins, sinks |
| Fichier Etat | `/var/run/netifyd/status.json` | Statistiques resumees (PAS les flux) |
| Socket | `/var/run/netifyd/netifyd.sock` | Interface streaming JSON |
| Collecteur | `/usr/bin/netifyd-collector` | Stats periodiques vers `/tmp/netifyd-stats.json` |

### Consommateurs de Donnees Actuels

1. **CrowdSec**: AUCUNE integration directe n'existe. Fonctionne independamment.
2. **Netdata**: Tableau de bord separe. Lit les metriques systeme via `/proc`, pas les donnees DPI.
3. **Tableau de Bord LuCI**: Consommateur principal via backend RPCD.

### Formats de Sortie Netifyd

**Statistiques Resumees** (`/var/run/netifyd/status.json`):
```json
{
  "flow_count": 150,
  "flows_active": 42,
  "devices": [...],
  "stats": {
    "br-lan": {
      "ip_bytes": 1234567,
      "wire_bytes": 1345678,
      "tcp": 1200,
      "udp": 300,
      "icmp": 50
    }
  },
  "dns_hint_cache": { "cache_size": 500 },
  "uptime": 86400
}
```

**Donnees de Flux** (quand sink active, pas par defaut):
```json
{
  "flow_id": "abc123",
  "src_ip": "192.168.1.100",
  "dst_ip": "8.8.8.8",
  "src_port": 54321,
  "dst_port": 443,
  "protocol": "tcp",
  "application": "google",
  "category": "search_engine",
  "bytes_rx": 1500,
  "bytes_tx": 500,
  "packets_rx": 10,
  "packets_tx": 5
}
```

---

## Architecture nDPId

### Composants Principaux

| Composant | Objectif |
|-----------|----------|
| **nDPId** | Daemon de capture de trafic utilisant libpcap + libnDPI |
| **nDPIsrvd** | Broker qui distribue les evenements a plusieurs consommateurs |
| **libnDPI** | Bibliotheque DPI centrale (partagee avec Netifyd) |

### Systeme d'Evenements nDPId

**Format de Message**: `[longueur-5-chiffres][JSON]\n`
```
01223{"flow_event_id":7,"flow_event_name":"detection-update",...}\n
```

**Categories d'Evenements**:

| Categorie | Evenements | Description |
|-----------|------------|-------------|
| Erreur | 17 types | Echecs de traitement de paquets, problemes memoire |
| Daemon | 4 types | init, shutdown, reconnect, status |
| Paquet | 2 types | packet, packet-flow (encode base64) |
| Flux | 9 types | new, end, idle, update, detected, guessed, detection-update, not-detected, analyse |

### Exemple d'Evenement de Flux nDPId

```json
{
  "flow_event_id": 5,
  "flow_event_name": "detected",
  "thread_id": 0,
  "packet_id": 12345,
  "source": "eth0",
  "flow_id": 1001,
  "flow_state": "finished",
  "flow_src_packets_processed": 15,
  "flow_dst_packets_processed": 20,
  "flow_first_seen": 1704067200000,
  "flow_src_last_pkt_time": 1704067260000,
  "flow_dst_last_pkt_time": 1704067258000,
  "flow_idle_time": 2000,
  "flow_src_tot_l4_payload_len": 1500,
  "flow_dst_tot_l4_payload_len": 2000,
  "l3_proto": "ip4",
  "src_ip": "192.168.1.100",
  "dst_ip": "142.250.185.78",
  "l4_proto": "tcp",
  "src_port": 54321,
  "dst_port": 443,
  "ndpi": {
    "proto": "TLS.Google",
    "proto_id": 91,
    "proto_by_ip": 0,
    "encrypted": 1,
    "breed": "Safe",
    "category_id": 5,
    "category": "Web"
  }
}
```

---

## Strategie de Migration

### Phase 1: Developpement de la Couche de Compatibilite

Creer un daemon de traduction qui convertit les evenements nDPId au format compatible Netifyd.

**Nouveau Composant**: `secubox-ndpid-compat`

```
nDPId → nDPIsrvd → secubox-ndpid-compat → Consommateurs Existants
                                        ↓
                    /var/run/netifyd/status.json (compatible)
                    /tmp/netifyd-stats.json (compatible)
                    Backend RPCD (inchange)
```

### Phase 2: Developpement des Packages

#### 2.1 Nouveau Package: `secubox-app-ndpid`

**Makefile**:
```makefile
PKG_NAME:=ndpid
PKG_VERSION:=1.7.0
PKG_RELEASE:=1
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/utoni/nDPId.git

DEPENDS:=+libndpi +libpcap +libjson-c +libpthread
```

**Prerequis de Build**:
- libnDPI >=5.0.0
- libpcap
- libjson-c
- Systeme de build CMake

#### 2.2 Nouveau Package: `secubox-ndpid-compat`

Script de couche de traduction qui:
1. Se connecte au socket nDPIsrvd
2. Agregue les evenements de flux au format compatible Netifyd
3. Ecrit dans `/var/run/netifyd/status.json`
4. Fournit la meme interface RPCD

### Phase 3: Traduction du Format de Sortie

#### 3.1 Carte de Traduction du Fichier Etat

| Champ Netifyd | Source nDPId | Logique de Traduction |
|---------------|--------------|----------------------|
| `flow_count` | Compte des evenements de flux | Incrementer sur `new`, decrementer sur `end`/`idle` |
| `flows_active` | Suivi des flux actifs | Compter les flux sans evenements `end`/`idle` |
| `stats.{iface}.tcp` | `l4_proto == "tcp"` | Agreger par interface |
| `stats.{iface}.udp` | `l4_proto == "udp"` | Agreger par interface |
| `stats.{iface}.ip_bytes` | `flow_*_tot_l4_payload_len` | Somme par interface |
| `uptime` | Evenement daemon `status` | Mappage direct |

#### 3.2 Carte de Traduction des Donnees de Flux

| Champ Netifyd | Champ nDPId | Notes |
|---------------|-------------|-------|
| `src_ip` | `src_ip` | Direct |
| `dst_ip` | `dst_ip` | Direct |
| `src_port` | `src_port` | Direct |
| `dst_port` | `dst_port` | Direct |
| `protocol` | `l4_proto` | Minuscules |
| `application` | `ndpi.proto` | Parser depuis "TLS.Google" → "google" |
| `category` | `ndpi.category` | Direct |
| `bytes_rx` | `flow_dst_tot_l4_payload_len` | Note: inverse (dst=rx du point de vue du flux) |
| `bytes_tx` | `flow_src_tot_l4_payload_len` | Note: inverse |

#### 3.3 Normalisation des Noms d'Application

nDPId utilise un format comme `TLS.Google`, `QUIC.YouTube`. Normaliser en base minuscules:
```
TLS.Google → google
QUIC.YouTube → youtube
HTTP.Facebook → facebook
DNS → dns
```

### Phase 4: Compatibilite des Consommateurs

#### 4.1 Integration CrowdSec (NOUVEAU)

Puisqu'il n'y a pas d'integration CrowdSec existante, nous pouvons la concevoir correctement:

**Configuration d'Acquisition** (`/etc/crowdsec/acquis.d/ndpid.yaml`):
```yaml
source: file
filenames:
  - /tmp/ndpid-flows.log
labels:
  type: ndpid
---
source: journalctl
journalctl_filter:
  - "_SYSTEMD_UNIT=ndpid.service"
labels:
  type: syslog
```

**Parseur** (`/etc/crowdsec/parsers/s02-enrich/ndpid-flows.yaml`):
```yaml
name: secubox/ndpid-flows
description: "Parser les evenements de detection de flux nDPId"
filter: "evt.Parsed.program == 'ndpid'"
onsuccess: next_stage
statics:
  - parsed: flow_application
    expression: evt.Parsed.ndpi_proto
nodes:
  - grok:
      pattern: '%{IP:src_ip}:%{INT:src_port} -> %{IP:dst_ip}:%{INT:dst_port} %{WORD:proto} %{DATA:app}'
```

**Scenario** (`/etc/crowdsec/scenarios/ndpid-suspicious-app.yaml`):
```yaml
type: leaky
name: secubox/ndpid-suspicious-app
description: "Detecter l'utilisation d'applications suspectes"
filter: evt.Parsed.flow_application in ["bittorrent", "tor", "vpn_udp"]
groupby: evt.Parsed.src_ip
capacity: 5
leakspeed: 10m
blackhole: 1h
labels:
  remediation: true
```

#### 4.2 Integration Netdata (NOUVEAU)

Creer un collecteur Netdata personnalise pour nDPId:

**Collecteur** (`/usr/lib/netdata/plugins.d/ndpid.chart.sh`):
```bash
#!/bin/bash
# Collecteur Netdata pour nDPId

NDPID_STATUS="/var/run/netifyd/status.json"

# Definitions des graphiques
cat << EOF
CHART ndpid.flows '' "Flux Reseau" "flux" ndpid ndpid.flows area
DIMENSION active '' absolute 1 1
DIMENSION total '' absolute 1 1
EOF

while true; do
    if [ -f "$NDPID_STATUS" ]; then
        active=$(jq -r '.flows_active // 0' "$NDPID_STATUS")
        total=$(jq -r '.flow_count // 0' "$NDPID_STATUS")
        echo "BEGIN ndpid.flows"
        echo "SET active = $active"
        echo "SET total = $total"
        echo "END"
    fi
    sleep 1
done
```

### Phase 5: Migration du Systeme de Plugins

#### 5.1 Actions IPSet

Plugins Netifyd → processeur externe nDPId:

| Plugin Netifyd | Equivalent nDPId |
|----------------|------------------|
| `libnetify-plugin-ipset.so` | Script externe consommant les evenements de flux |
| `libnetify-plugin-nftables.so` | Actualiseur nftables externe |

**Script d'Action de Flux nDPId** (`/usr/bin/ndpid-flow-actions`):
```bash
#!/bin/bash
# Traiter les evenements nDPId et mettre a jour les ipsets

socat -u UNIX-RECV:/tmp/ndpid-actions.sock - | while read -r line; do
    # Parser le prefixe de longueur 5 chiffres
    json="${line:5}"

    event=$(echo "$json" | jq -r '.flow_event_name')
    app=$(echo "$json" | jq -r '.ndpi.proto' | tr '.' '\n' | tail -1 | tr '[:upper:]' '[:lower:]')

    case "$event" in
        detected)
            case "$app" in
                bittorrent)
                    src_ip=$(echo "$json" | jq -r '.src_ip')
                    ipset add secubox-bittorrent "$src_ip" timeout 900 2>/dev/null
                    ;;
            esac
            ;;
    esac
done
```

---

## Phases d'Implementation

### Phase 1: Fondation (Semaine 1-2)

1. [ ] Creer le package `secubox-app-ndpid`
2. [ ] Build nDPId + nDPIsrvd pour OpenWrt
3. [ ] Tester la detection de flux de base
4. [ ] Creer le schema de configuration UCI

### Phase 2: Couche de Compatibilite (Semaine 3-4)

1. [ ] Developper le daemon de traduction `secubox-ndpid-compat`
2. [ ] Implementer la generation de status.json
3. [ ] Implementer l'agregation des evenements de flux
4. [ ] Tester avec le tableau de bord LuCI existant

### Phase 3: Mise a Jour du Backend RPCD (Semaine 5)

1. [ ] Mettre a jour les methodes RPCD pour utiliser les donnees nDPId
2. [ ] S'assurer que les 15 methodes de lecture fonctionnent
3. [ ] S'assurer que les 9 methodes d'ecriture fonctionnent
4. [ ] Tester la compatibilite de l'application LuCI

### Phase 4: Integration des Consommateurs (Semaine 6-7)

1. [ ] Creer le parseur/scenario CrowdSec
2. [ ] Creer le collecteur Netdata
3. [ ] Tester le flux de donnees de bout en bout
4. [ ] Documenter les nouvelles integrations

### Phase 5: Migration & Nettoyage (Semaine 8)

1. [ ] Creer un script de migration pour les utilisateurs existants
2. [ ] Mettre a jour la documentation
3. [ ] Supprimer le package Netifyd (optionnel, peut coexister)
4. [ ] Tests finaux et publication

---

## Structure des Fichiers Apres Migration

```
package/secubox/
├── secubox-app-ndpid/              # NOUVEAU: Package nDPId
│   ├── Makefile
│   ├── files/
│   │   ├── ndpid.config            # Config UCI
│   │   ├── ndpid.init              # Script init procd
│   │   └── ndpisrvd.init           # init nDPIsrvd
│   └── patches/                    # Patches OpenWrt si necessaire
│
├── secubox-ndpid-compat/           # NOUVEAU: Couche de compatibilite
│   ├── Makefile
│   └── files/
│       ├── ndpid-compat.lua        # Daemon de traduction
│       ├── ndpid-flow-actions      # Gestionnaire IPSet/nftables
│       └── ndpid-collector         # Agregateur de stats
│
├── luci-app-secubox-netifyd/       # MODIFIE: Fonctionne avec les deux
│   └── root/usr/libexec/rpcd/
│       └── luci.secubox-netifyd    # Mis a jour pour compat nDPId
│
└── secubox-app-netifyd/            # DEPRECIE: Garder en repli
```

---

## Mappage de Configuration

### Traduction Config UCI

**Netifyd** (`/etc/config/secubox-netifyd`):
```
config settings 'settings'
    option enabled '1'
    option socket_type 'unix'

config sink 'sink'
    option enabled '1'
    option type 'unix'
    option unix_path '/tmp/netifyd-flows.json'
```

**nDPId** (`/etc/config/secubox-ndpid`):
```
config ndpid 'main'
    option enabled '1'
    option interfaces 'br-lan br-wan'
    option collector_socket '/tmp/ndpid-collector.sock'

config ndpisrvd 'distributor'
    option enabled '1'
    option listen_socket '/tmp/ndpisrvd.sock'
    option tcp_port '7000'

config compat 'compat'
    option enabled '1'
    option netifyd_status '/var/run/netifyd/status.json'
    option netifyd_socket '/var/run/netifyd/netifyd.sock'
```

---

## Evaluation des Risques

| Risque | Impact | Attenuation |
|--------|--------|-------------|
| Differences de precision de detection | Moyen | Les deux utilisent libnDPI; resultats similaires attendus |
| Regression de performance | Faible | nDPId est plus leger; devrait ameliorer les performances |
| Compatibilite des plugins | Eleve | Doit reimplementer les actions de flux en externe |
| Casse des tableaux de bord existants | Eleve | La couche de compatibilite assure le meme format de sortie |
| Fonctionnalites Netifyd manquantes | Moyen | Documenter les ecarts de fonctionnalites; prioriser les critiques |

### Comparaison des Fonctionnalites

| Fonctionnalite | Netifyd | nDPId | Impact Migration |
|----------------|---------|-------|------------------|
| Detection de protocole | Oui | Oui | Aucun |
| Detection d'application | Oui | Oui | Aucun |
| Suivi de flux | Oui | Oui | Aucun |
| Sortie JSON | Oui | Oui | Traduction de format necessaire |
| Streaming socket | Oui | Oui | Format different |
| Integration cloud | Oui | Non | Fonctionnalite supprimee |
| Architecture plugin | Integree | Externe | Reimplementer |
| Empreinte memoire | ~50MB | ~15MB | Amelioration |
| Temps de demarrage | ~5s | ~1s | Amelioration |

---

## Plan de Tests

### Tests Unitaires

1. **Precision de Traduction**: Verifier que les evenements nDPId se mappent correctement au format Netifyd
2. **Agregation des Statistiques**: Verifier que les comptes de flux, octets, paquets correspondent
3. **Detection d'Application**: Comparer les resultats de detection entre les moteurs

### Tests d'Integration

1. **Tableau de Bord LuCI**: Toutes les vues s'affichent correctement
2. **Methodes RPCD**: Toutes les 24 methodes retournent les donnees attendues
3. **Actions IPSet**: La detection BitTorrent/streaming declenche les mises a jour ipset
4. **Parsing CrowdSec**: Les evenements de flux sont parses et les scenarios se declenchent

### Tests de Performance

1. **Debit**: Mesurer le max flux/seconde
2. **Memoire**: Comparer l'utilisation RAM sous charge
3. **CPU**: Comparer l'utilisation CPU pendant les pics de trafic

---

## Plan de Rollback

Si la migration echoue:

1. Arreter les services nDPId: `/etc/init.d/ndpid stop && /etc/init.d/ndpisrvd stop`
2. Demarrer Netifyd: `/etc/init.d/netifyd start`
3. La couche de compatibilite detecte automatiquement et bascule la source
4. Pas de perte de donnees; les deux peuvent coexister

---

## References

- [Depot GitHub nDPId](https://github.com/utoni/nDPId)
- [Bibliotheque nDPI](https://github.com/ntop/nDPI)
- [Documentation Netifyd](https://www.netify.ai/documentation/)
- [Acquisition CrowdSec](https://docs.crowdsec.net/docs/data_sources/intro)
- [Plugins Externes Netdata](https://learn.netdata.cloud/docs/agent/collectors/plugins.d)

---

## Annexe A: Reference du Schema d'Evenements nDPId

### Champs d'Evenement de Flux

```json
{
  "flow_event_id": "entier (0-8)",
  "flow_event_name": "chaine (new|end|idle|update|detected|guessed|detection-update|not-detected|analyse)",
  "thread_id": "entier",
  "packet_id": "entier",
  "source": "chaine (nom d'interface)",
  "flow_id": "entier",
  "flow_state": "chaine (skipped|finished|info)",
  "l3_proto": "chaine (ip4|ip6)",
  "src_ip": "chaine",
  "dst_ip": "chaine",
  "l4_proto": "chaine (tcp|udp|icmp|...)",
  "src_port": "entier",
  "dst_port": "entier",
  "flow_src_packets_processed": "entier",
  "flow_dst_packets_processed": "entier",
  "flow_first_seen": "entier (timestamp ms)",
  "flow_src_tot_l4_payload_len": "entier (octets)",
  "flow_dst_tot_l4_payload_len": "entier (octets)",
  "ndpi": {
    "proto": "chaine (ex: TLS.Google)",
    "proto_id": "entier",
    "encrypted": "entier (0|1)",
    "breed": "chaine (Safe|Acceptable|Fun|Unsafe|...)",
    "category_id": "entier",
    "category": "chaine"
  }
}
```

### Champs d'Evenement Etat Daemon

```json
{
  "daemon_event_id": 3,
  "daemon_event_name": "status",
  "global_ts_usec": "entier",
  "uptime": "entier (secondes)",
  "packets": "entier",
  "packet_bytes": "entier",
  "flows_active": "entier",
  "flows_idle": "entier",
  "flows_detected": "entier",
  "compressions": "entier",
  "decompressions": "entier"
}
```

---

## Annexe B: Code Exemple de Couche de Compatibilite

```lua
#!/usr/bin/env lua
-- secubox-ndpid-compat: Traducteur de format nDPId vers Netifyd

local socket = require("socket")
local json = require("cjson")

local NDPISRVD_SOCK = "/tmp/ndpisrvd.sock"
local OUTPUT_STATUS = "/var/run/netifyd/status.json"
local UPDATE_INTERVAL = 1

-- Suivi d'etat
local state = {
    flows = {},
    flow_count = 0,
    flows_active = 0,
    stats = {},
    devices = {},
    uptime = 0,
    start_time = os.time()
}

-- Traiter l'evenement nDPId entrant
local function process_event(raw)
    -- Supprimer le prefixe de longueur 5 chiffres
    local json_str = raw:sub(6)
    local ok, event = pcall(json.decode, json_str)
    if not ok then return end

    local event_name = event.flow_event_name or event.daemon_event_name

    if event_name == "new" then
        state.flows[event.flow_id] = event
        state.flow_count = state.flow_count + 1
        state.flows_active = state.flows_active + 1

    elseif event_name == "end" or event_name == "idle" then
        state.flows[event.flow_id] = nil
        state.flows_active = state.flows_active - 1

    elseif event_name == "detected" then
        if state.flows[event.flow_id] then
            state.flows[event.flow_id].detected = event.ndpi
        end
        -- Mettre a jour les stats d'interface
        local iface = event.source or "unknown"
        if not state.stats[iface] then
            state.stats[iface] = {ip_bytes=0, tcp=0, udp=0, icmp=0}
        end
        local proto = event.l4_proto or ""
        if proto == "tcp" then state.stats[iface].tcp = state.stats[iface].tcp + 1 end
        if proto == "udp" then state.stats[iface].udp = state.stats[iface].udp + 1 end
        if proto == "icmp" then state.stats[iface].icmp = state.stats[iface].icmp + 1 end
        local bytes = (event.flow_src_tot_l4_payload_len or 0) + (event.flow_dst_tot_l4_payload_len or 0)
        state.stats[iface].ip_bytes = state.stats[iface].ip_bytes + bytes

    elseif event_name == "status" then
        state.uptime = event.uptime or (os.time() - state.start_time)
    end
end

-- Generer status.json compatible Netifyd
local function generate_status()
    return json.encode({
        flow_count = state.flow_count,
        flows_active = state.flows_active,
        stats = state.stats,
        devices = state.devices,
        uptime = state.uptime,
        dns_hint_cache = { cache_size = 0 }
    })
end

-- Boucle principale
local function main()
    -- Creer le repertoire de sortie
    os.execute("mkdir -p /var/run/netifyd")

    local sock = socket.unix()
    local ok, err = sock:connect(NDPISRVD_SOCK)
    if not ok then
        print("Echec de connexion a nDPIsrvd: " .. (err or "inconnu"))
        os.exit(1)
    end

    sock:settimeout(0.1)

    local last_write = 0
    while true do
        local line, err = sock:receive("*l")
        if line then
            process_event(line)
        end

        -- Ecrire le fichier status periodiquement
        local now = os.time()
        if now - last_write >= UPDATE_INTERVAL then
            local f = io.open(OUTPUT_STATUS, "w")
            if f then
                f:write(generate_status())
                f:close()
            end
            last_write = now
        end
    end
end

main()
```

---

*Version du Document: 1.0*
*Cree: 2026-01-09*
*Auteur: Assistant Claude Code*
