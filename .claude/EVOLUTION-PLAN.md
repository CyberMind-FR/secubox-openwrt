# SecuBox — Plan d'Évolution : Intégration des patterns SysWarden
> Document interne CyberMind.FR — Usage Claude Code  
> Auteur : Gandalf (gkerma) — Version 1.0 — Février 2026  
> Référence : `secubox-openwrt` × `syswarden` cross-analysis

---

## Contexte et Objectif

Ce document est un plan d'implémentation actionnable pour Claude Code. Il décrit quatre évolutions techniques à apporter à `secubox-openwrt`, inspirées de l'analyse comparative du projet `syswarden` (fork `gkerma/syswarden`).

**Objectif global** : combler les surfaces de sécurité non couvertes par SecuBox en s'inspirant des patterns éprouvés de SysWarden, sans dénaturer l'architecture LuCI modulaire existante.

**Périmètre** : les quatre évolutions sont indépendantes et peuvent être implémentées dans l'ordre de priorité défini. Chacune est spécifiée avec suffisamment de détail pour qu'un agent Claude Code puisse l'implémenter sans intervention humaine supplémentaire.

---

## ÉVOLUTION #1 — `luci-app-ipblocklist` (Priorité HAUTE)

### Problème adressé
SecuBox s'appuie exclusivement sur CrowdSec pour le blocage IP, qui est réactif/collaboratif. Il n'existe aucune couche de défense statique pré-emptive à l'image du layer 1 de SysWarden (blocklist ~100k IPs connues dans ipset kernel).

### Architecture cible

```
Trafic entrant
  └─► [Layer 1] ipset Data-Shield (~100k IPs)   → DROP kernel immédiat (NOUVEAU)
        └─► [Layer 2] CrowdSec bouncer          → blocage collaboratif dynamique (EXISTANT)
              └─► [Layer 3] Netifyd DPI         → détection applicative (EXISTANT)
```

### Nouveau module à créer : `luci-app-ipblocklist`

**Structure de fichiers à créer** :
```
luci-app-ipblocklist/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── view/ipblocklist/
│   │   └── dashboard.js          # Vue principale LuCI
│   └── ipblocklist/
│       ├── api.js                # Client RPC
│       └── dashboard.css         # Styles (dark cybersecurity theme, cohérent avec CrowdSec)
└── root/
    ├── etc/
    │   ├── config/ipblocklist    # UCI config (sources, schedule, whitelist)
    │   └── cron.d/ipblocklist    # Cron hourly update
    ├── usr/
    │   ├── libexec/rpcd/ipblocklist  # Backend shell RPCD
    │   └── share/
    │       ├── luci/menu.d/ipblocklist.json
    │       └── rpcd/acl.d/ipblocklist.json
    └── sbin/
        └── ipblocklist-update.sh  # Script principal de mise à jour
```

### Spécifications `ipblocklist-update.sh`

Ce script s'inspire directement de `install-syswarden.sh` mais adapté OpenWrt :

```bash
#!/bin/sh
# ipblocklist-update.sh — SecuBox IP Blocklist Manager
# Compatible OpenWrt — utilise ipset natif + nftables/iptables selon disponibilité

IPSET_NAME="secubox_blocklist"
SOURCES_UCI="ipblocklist"
LOG_FILE="/var/log/ipblocklist.log"
WHITELIST_FILE="/etc/ipblocklist/whitelist.txt"

# Sources de blocklists (configurables via UCI)
# Défaut: Data-Shield (même source que SysWarden)
DEFAULT_SOURCES="
https://raw.githubusercontent.com/duggytuxy/Data-Shield_IPv4_Blocklist/main/data-shield-blocklist-ipv4.txt
https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset
"

# Détection automatique du backend firewall (pattern SysWarden)
detect_firewall() {
    if command -v nft >/dev/null 2>&1; then
        echo "nftables"
    elif command -v iptables >/dev/null 2>&1; then
        echo "iptables"
    else
        echo "none"
    fi
}

# Initialisation ipset
init_ipset() {
    ipset create "$IPSET_NAME" hash:net hashsize 65536 maxelem 200000 2>/dev/null || true
    ipset flush "$IPSET_NAME"
}

# Téléchargement et chargement avec TCP latency check (pattern SysWarden smart mirror)
load_blocklist() {
    local sources
    sources=$(uci get "${SOURCES_UCI}.global.sources" 2>/dev/null || echo "$DEFAULT_SOURCES")
    local count=0
    for url in $sources; do
        local tmp
        tmp=$(mktemp)
        if wget -q -T 15 -O "$tmp" "$url" 2>/dev/null; then
            while IFS= read -r line; do
                [ -z "$line" ] && continue
                echo "${line%%#*}" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]' || continue
                # Vérification whitelist
                grep -qF "$line" "$WHITELIST_FILE" 2>/dev/null && continue
                ipset add "$IPSET_NAME" "$line" 2>/dev/null && count=$((count + 1))
            done < "$tmp"
        fi
        rm -f "$tmp"
    done
    echo "$(date): Loaded $count IPs into $IPSET_NAME" >> "$LOG_FILE"
}

# Application des règles firewall
apply_rules() {
    local fw
    fw=$(detect_firewall)
    case "$fw" in
        nftables)
            # Intégration nftables OpenWrt (table fw4)
            nft add set inet fw4 "$IPSET_NAME" { type ipv4_addr \; flags interval \; } 2>/dev/null || true
            nft add rule inet fw4 forward ip saddr @"$IPSET_NAME" drop 2>/dev/null || true
            nft add rule inet fw4 input ip saddr @"$IPSET_NAME" drop 2>/dev/null || true
            ;;
        iptables)
            iptables -I INPUT -m set --match-set "$IPSET_NAME" src -j DROP 2>/dev/null || true
            iptables -I FORWARD -m set --match-set "$IPSET_NAME" src -j DROP 2>/dev/null || true
            ;;
    esac
}

# Persistance via hotplug OpenWrt
save_persistence() {
    local save_dir="/etc/ipblocklist"
    mkdir -p "$save_dir"
    ipset save "$IPSET_NAME" > "${save_dir}/ipset.save"
}

main() {
    init_ipset
    load_blocklist
    apply_rules
    save_persistence
}

main "$@"
```

### Spécifications UCI (`/etc/config/ipblocklist`)
```
config global 'global'
    option enabled '1'
    option update_interval '3600'
    list sources 'https://raw.githubusercontent.com/duggytuxy/Data-Shield_IPv4_Blocklist/main/data-shield-blocklist-ipv4.txt'
    list sources 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset'
    option log_drops '1'
    option whitelist_file '/etc/ipblocklist/whitelist.txt'
```

### Interface LuCI (`dashboard.js`) — Fonctionnalités requises

1. **Status Card** : nombre d'IPs en blocklist, dernière mise à jour, taille ipset
2. **Sources Manager** : liste des sources URL, ajout/suppression, activation par source
3. **Whitelist Manager** : IPs/CIDRs à exclure, import depuis fichier
4. **Logs Viewer** : journal des blocages avec pagination (10/20/50 entrées)
5. **Manual Actions** : bouton "Update Now", bouton "Flush", bouton "Test IP"
6. **Statistics** : graphe hits par heure (sparkline, réutiliser le style Netdata dashboard)

### Dépendances Makefile
```makefile
PKG_NAME:=luci-app-ipblocklist
PKG_VERSION:=1.0.0
LUCI_DEPENDS:=+ipset +kmod-ipt-ipset +iptables-mod-ipset
LUCI_TITLE:=SecuBox IP Blocklist — Static threat defense layer
```

### Tests de validation
- [ ] `ipset list secubox_blocklist` retourne > 50000 entrées après update
- [ ] Une IP connue malveillante (ex: `1.1.1.1` dans whitelist = exclue, IP Firehol level1 = bloquée)
- [ ] Reboot : l'ipset est rechargé depuis `/etc/ipblocklist/ipset.save` via hotplug
- [ ] UCI toggle `enabled=0` désactive le cron et vide l'ipset
- [ ] Interface LuCI : toutes les sections s'affichent sans erreur JS console

---

## ÉVOLUTION #2 — Reporting AbuseIPDB dans `luci-app-crowdsec-dashboard` (Priorité HAUTE)

### Problème adressé
SecuBox n'a aucun mécanisme de reporting sortant vers les bases communautaires. SysWarden implémente `syswarden_reporter.py` qui soumet automatiquement les IPs bloquées à AbuseIPDB. Intégrer ce pattern dans le CrowdSec dashboard renforce la posture communautaire et constitue un argument favorable pour la certification ANSSI.

### Modifications à apporter au module existant

**Fichier cible** : `luci-app-crowdsec-dashboard/`

**Nouveaux fichiers à créer** :
```
luci-app-crowdsec-dashboard/
└── root/
    ├── etc/config/crowdsec_abuseipdb    # UCI config clé API + seuils
    └── usr/
        ├── libexec/rpcd/crowdsec_abuseipdb  # Backend RPCD
        └── sbin/
            └── crowdsec-reporter.sh     # Script de reporting (version shell de syswarden_reporter.py)
```

**Modifications à apporter au dashboard JS existant** :
- Ajouter un onglet "AbuseIPDB Reporter" dans `luci-app-crowdsec-dashboard/htdocs/luci-static/resources/view/crowdsec/`
- Nouveau fichier : `reporter.js`

### Spécifications `crowdsec-reporter.sh`

```bash
#!/bin/sh
# crowdsec-reporter.sh — SecuBox AbuseIPDB Reporter
# Inspired by syswarden_reporter.py — shell version for OpenWrt

ABUSEIPDB_API_URL="https://api.abuseipdb.com/api/v2/report"
UCI_CONFIG="crowdsec_abuseipdb"
LOG_FILE="/var/log/crowdsec-reporter.log"
STATE_FILE="/var/lib/crowdsec-reporter/reported.txt"

get_api_key() {
    uci get "${UCI_CONFIG}.global.api_key" 2>/dev/null
}

get_confidence_threshold() {
    uci get "${UCI_CONFIG}.global.confidence_threshold" 2>/dev/null || echo "80"
}

# Récupère les décisions CrowdSec récentes (dernière heure)
get_recent_decisions() {
    if command -v cscli >/dev/null 2>&1; then
        cscli decisions list --output json 2>/dev/null | \
            jsonfilter -e '@[*].value' 2>/dev/null
    else
        # Fallback: lecture des logs CrowdSec
        grep -h "ban" /var/log/crowdsec/*.log 2>/dev/null | \
            grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort -u
    fi
}

# Reporting vers AbuseIPDB (pattern SysWarden)
report_ip() {
    local ip="$1"
    local api_key="$2"
    local categories="18,21"  # Brute-Force, Web App Attack

    # Éviter les doublons (anti-spam AbuseIPDB 15min cooldown)
    mkdir -p "$(dirname "$STATE_FILE")"
    grep -qF "$ip" "$STATE_FILE" 2>/dev/null && return 0

    local response
    response=$(wget -q -O- \
        --header="Key: ${api_key}" \
        --header="Accept: application/json" \
        --post-data="ip=${ip}&categories=${categories}&comment=Blocked+by+SecuBox+CrowdSec+on+OpenWrt" \
        "$ABUSEIPDB_API_URL" 2>/dev/null)

    if echo "$response" | grep -q '"abuseConfidenceScore"'; then
        echo "$ip" >> "$STATE_FILE"
        echo "$(date): Reported $ip to AbuseIPDB" >> "$LOG_FILE"
        return 0
    fi
    return 1
}

main() {
    local api_key
    api_key=$(get_api_key)
    [ -z "$api_key" ] && echo "No API key configured" && exit 1

    # Rotation du fichier d'état (garder 7 jours = pattern SysWarden logrotate)
    find "$(dirname "$STATE_FILE")" -name "reported.txt.*" -mtime +7 -delete 2>/dev/null

    local decisions
    decisions=$(get_recent_decisions)
    local reported=0
    for ip in $decisions; do
        report_ip "$ip" "$api_key" && reported=$((reported + 1))
    done
    echo "$(date): Reported $reported IPs to AbuseIPDB" >> "$LOG_FILE"
}

main "$@"
```

### Interface LuCI — Onglet "AbuseIPDB Reporter" (`reporter.js`)

Sections requises :
1. **Configuration** : champ API Key (masqué), seuil de confiance (slider 0-100), toggle enabled
2. **Statistics** : IPs reportées aujourd'hui / cette semaine / total, score AbuseIPDB du routeur
3. **History** : tableau des derniers reportings (IP, date, catégories, score retourné)
4. **Cron Status** : fréquence de reporting, dernier run, prochain run

### Cron à configurer
```
# /etc/cron.d/crowdsec-reporter
*/15 * * * * root /usr/sbin/crowdsec-reporter.sh >/dev/null 2>&1
```

### Tests de validation
- [ ] Avec clé API valide : au moins un reporting réussi visible dans l'historique
- [ ] Cooldown : même IP non re-reportée avant 15 minutes
- [ ] Sans clé API : interface affiche un état "non configuré" sans erreur
- [ ] Toggle disabled : cron supprimé, script ne s'exécute pas

---

## ÉVOLUTION #3 — Log Denoising dans `luci-app-system-hub` (Priorité MOYENNE)

### Problème adressé
`luci-app-system-hub` agrège les logs de tous les composants SecuBox mais affiche le bruit brut : scans automatisés, bruteforce repetitif depuis des IPs déjà dans la blocklist. SysWarden vante comme bénéfice principal la "réduction du bruit" pour ne voir que les "vrais signaux". Appliquer cette philosophie à la vue logs de System Hub.

### Modifications à apporter au module existant

**Fichier cible principal** : `luci-app-system-hub/htdocs/luci-static/resources/view/system_hub/logs.js` (ou équivalent selon structure existante)

**Nouveau backend à créer** : `luci-app-system-hub/root/usr/libexec/rpcd/system_hub_denoiser`

### Spécifications du backend `system_hub_denoiser`

```bash
#!/bin/sh
# system_hub_denoiser — Filtre les logs en excluant les IPs déjà dans ipblocklist
# et les événements répétitifs sans valeur opérationnelle

IPSET_NAME="secubox_blocklist"
MAX_LINES="${1:-200}"

# Récupère les IPs de la blocklist pour filtrage rapide
get_blocklist_ips() {
    ipset list "$IPSET_NAME" 2>/dev/null | grep -E '^[0-9]+\.' | head -1000
}

# Filtre un flux de logs
filter_logs() {
    local input="$1"
    local mode="${2:-smart}"  # smart | raw | signal_only

    case "$mode" in
        raw)
            # Aucun filtrage, logs bruts
            cat "$input"
            ;;
        smart)
            # Supprime les entrées provenant d'IPs en blocklist statique
            # Supprime les patterns repetitifs sans valeur (scans SYN purs)
            grep -v -f /tmp/denoiser_iplist.txt "$input" 2>/dev/null | \
            grep -vE "(SYN_RECV|SYN_SENT)" | \
            grep -vE "kernel: \[.*\] DROP" | \
            tail -n "$MAX_LINES"
            ;;
        signal_only)
            # Mode le plus agressif : uniquement les événements CrowdSec, auth failures, erreurs
            grep -E "(crowdsec|ALERT|ERROR|WARN|authentication failure|Failed password|CRITICAL)" "$input" | \
            tail -n "$MAX_LINES"
            ;;
    esac
}

# Point d'entrée RPCD
case "$1" in
    get_filtered_logs)
        get_blocklist_ips > /tmp/denoiser_iplist.txt 2>/dev/null
        # Collecte logs de toutes les sources SecuBox
        {
            tail -n 500 /var/log/crowdsec/crowdsec.log 2>/dev/null
            tail -n 500 /var/log/ipblocklist.log 2>/dev/null
            logread 2>/dev/null | tail -n 500
        } | filter_logs /dev/stdin "$2"
        rm -f /tmp/denoiser_iplist.txt
        ;;
    get_stats)
        # Retourne les statistiques de débruitage
        local total raw filtered
        raw=$(logread 2>/dev/null | wc -l)
        filtered=$(logread 2>/dev/null | grep -c -E "(crowdsec|ALERT|ERROR|WARN|authentication failure)" 2>/dev/null || echo 0)
        printf '{"total":%d,"signals":%d,"noise_ratio":%d}\n' \
            "$raw" "$filtered" \
            "$(( (raw - filtered) * 100 / (raw + 1) ))"
        ;;
esac
```

### Modifications UI dans System Hub

Ajouter dans la vue logs existante :

1. **Sélecteur de mode** (toggle 3 positions) :
   - `RAW` — logs bruts complets
   - `SMART` *(défaut)* — filtré : supprime IPs blocklist + scans répétitifs
   - `SIGNAL ONLY` — uniquement alertes et événements CrowdSec

2. **Indicateur de débruitage** : badge "X% noise filtered" calculé en temps réel

3. **Option "Show suppressed"** : accordéon permettant de voir les entrées filtrées en gris/opacité réduite

### Tests de validation
- [ ] Mode SMART : les logs ne contiennent plus d'entrées provenant d'IPs dans `secubox_blocklist`
- [ ] Indicateur de débruitage affiche un pourcentage cohérent (> 0% si blocklist active)
- [ ] Mode RAW : tous les logs originaux visibles
- [ ] Mode SIGNAL ONLY : uniquement les entrées contenant les keywords définis
- [ ] Performance : filtrage < 500ms pour 10000 entrées de logs

---

## ÉVOLUTION #4 — Module SIEM Connector pour cibles x86 (Priorité BASSE/CONDITIONNELLE)

### Problème adressé
SecuBox supporte officiellement `x86-64` (PC, VM, Proxmox). Sur ces cibles, Wazuh XDR Agent est déployable — SysWarden l'automatise complètement. SecuBox n'a aucun équivalent.

### Condition d'activation
Ce module est conditionnel : activable uniquement sur cibles `x86-64` et `x86-generic`. Les Makefiles des autres architectures doivent exclure ce paquet via `DEPENDS += @TARGET_x86`.

### Nouveau module à créer : `luci-app-siem-connector`

**Structure** :
```
luci-app-siem-connector/
├── Makefile                    # DEPENDS += @TARGET_x86 || @TARGET_x86_64
├── README.md
├── htdocs/luci-static/resources/
│   ├── view/siem/
│   │   ├── setup.js           # Wizard de déploiement Wazuh Agent
│   │   └── status.js          # Status et métriques de l'agent
│   └── siem/
│       └── dashboard.css
└── root/
    ├── etc/config/siem_connector
    └── usr/
        ├── libexec/rpcd/siem_connector
        └── sbin/
            └── wazuh-deploy.sh  # Pattern SysWarden : déploiement automatisé agent
```

### Spécifications `wazuh-deploy.sh`

Portage du module Wazuh de SysWarden pour OpenWrt x86 :

```bash
#!/bin/sh
# wazuh-deploy.sh — SecuBox SIEM Connector
# Déploiement automatisé Wazuh Agent (pattern SysWarden)
# Cible: OpenWrt x86 uniquement

MANAGER_IP=""
AGENT_NAME=""
AGENT_GROUP="secubox"

install_wazuh_agent() {
    # Détection OS (OpenWrt = Linux, paquet via opkg si disponible en feed)
    if command -v opkg >/dev/null 2>&1; then
        # Installation depuis feed optionnel ou package manuel
        opkg update
        opkg install wazuh-agent 2>/dev/null || {
            # Fallback: téléchargement direct (pattern SysWarden repo detection)
            local arch
            arch=$(uname -m)
            local pkg_url="https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/"
            # ... logique de téléchargement selon architecture
        }
    fi
}

configure_agent() {
    local ossec_conf="/var/ossec/etc/ossec.conf"
    cat > "$ossec_conf" << EOF
<ossec_config>
  <client>
    <server>
      <address>${MANAGER_IP}</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>
    <config-profile>${AGENT_GROUP}</config-profile>
  </client>
</ossec_config>
EOF
}

whitelist_wazuh_in_secubox() {
    # Pattern SysWarden : whitelister les ports Wazuh dans ipblocklist
    echo "$MANAGER_IP" >> /etc/ipblocklist/whitelist.txt
    # Règle firewall pour permettre 1514/1515 vers le manager
    uci add firewall rule
    uci set firewall.@rule[-1].name='Allow-Wazuh-Manager'
    uci set firewall.@rule[-1].dest_ip="$MANAGER_IP"
    uci set firewall.@rule[-1].dest_port='1514 1515'
    uci set firewall.@rule[-1].target='ACCEPT'
    uci commit firewall
    /etc/init.d/firewall restart
}
```

### Interface LuCI — Wizard de déploiement

Wizard en 4 étapes (inspiré de l'interactivité de SysWarden) :

1. **Prérequis** : vérification architecture x86, connexion réseau vers manager IP
2. **Configuration** : champs Manager IP, Agent Name, Group
3. **Déploiement** : progress bar, log en temps réel
4. **Vérification** : statut agent (actif/inactif), test de connexion vers manager

### Tests de validation
- [ ] Le Makefile exclut correctement le paquet sur architectures non-x86 (`DEPENDS += @TARGET_x86`)
- [ ] Wizard étape 1 : détecte et bloque l'installation si architecture incompatible
- [ ] Post-déploiement : `wazuh-agent` en statut `active` dans System Hub
- [ ] Whitelisting automatique : l'IP manager présente dans `/etc/ipblocklist/whitelist.txt`
- [ ] Port 1514/1515 : règle UCI firewall créée et visible dans LuCI

---

## Plan de Séquencement et Interdépendances

```
Semaine 1-2 : ÉVOLUTION #1 (luci-app-ipblocklist)
  ↓ fournit ipset "secubox_blocklist" utilisé par #3
  
Semaine 2-3 : ÉVOLUTION #2 (AbuseIPDB dans crowdsec-dashboard)
  ↓ indépendant, peut être parallélisé avec #1
  
Semaine 3-4 : ÉVOLUTION #3 (Log Denoising dans system-hub)
  ↓ dépend de #1 pour le filtrage par ipset
  
Semaine 5+  : ÉVOLUTION #4 (SIEM Connector x86)
  ↓ conditionnel, dépend de #1 pour le whitelisting
```

---

## Conventions de Développement SecuBox à Respecter

Toutes les évolutions doivent respecter les conventions identifiées dans `CLAUDE.md` du repo `secubox-openwrt` :

### Style Shell (RPCD backends)
- POSIX sh uniquement (pas bash), compatible BusyBox OpenWrt
- Toutes les fonctions documentées avec commentaire d'en-tête
- Gestion d'erreurs via `|| true` pour les commandes non-critiques
- Log systématique dans `/var/log/<module>.log`
- Usage de `uci` pour toute configuration persistante

### Style JavaScript (LuCI views)
- Réutiliser les classes CSS existantes de `luci-app-crowdsec-dashboard` pour la cohérence visuelle (dark cybersecurity theme)
- Utiliser `L.ui.showModal()` pour les confirmations destructives
- Auto-refresh via `setInterval` avec intervalle configurable (défaut 30s)
- Gestion des erreurs : afficher message d'erreur inline, pas d'alert() natif

### Structure Makefile
```makefile
include $(TOPDIR)/rules.mk
PKG_NAME:=luci-app-XXXX
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=Gandalf <gandalf@cybermind.fr>
PKG_LICENSE:=Apache-2.0
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/luci/luci.mk
LUCI_TITLE:=SecuBox XXXX — Description courte
LUCI_DEPENDS:=+dep1 +dep2
$(eval $(call BuildPackage,$(PKG_NAME)))
```

### ACL JSON (permissions RPCD)
```json
{
  "luci-app-XXXX": {
    "description": "Grant access to SecuBox XXXX",
    "read": { "uci": ["XXXX"], "file": {"/var/log/XXXX.log": ["read"]} },
    "write": { "uci": ["XXXX"] }
  }
}
```

---

## Critères de Validation Globaux (pour CI/CD)

Les GitHub Actions existantes (`build-openwrt-packages.yml`, `test-validate.yml`) doivent passer pour chaque évolution :

```bash
# Lint shell
shellcheck luci-app-*/root/usr/libexec/rpcd/*
shellcheck luci-app-*/root/usr/sbin/*.sh

# Lint JSON
for f in luci-app-*/root/usr/share/luci/menu.d/*.json; do
    jsonlint "$f" && echo "OK: $f" || echo "FAIL: $f"
done
for f in luci-app-*/root/usr/share/rpcd/acl.d/*.json; do
    jsonlint "$f" && echo "OK: $f" || echo "FAIL: $f"
done

# Validation Makefiles
for pkg in luci-app-ipblocklist luci-app-siem-connector; do
    make package/${pkg}/compile V=s ARCH=x86_64 OPENWRT_VERSION=23.05.5
done

# Tests fonctionnels (nécessitent environnement OpenWrt)
./secubox-tools/secubox-debug.sh luci-app-ipblocklist
./secubox-tools/secubox-debug.sh luci-app-siem-connector
```

---

## Référentiel ANSSI CSPN — Mapping des Évolutions

| Évolution | Critère CSPN adressé |
|---|---|
| #1 ipblocklist | Contrôle d'accès réseau / Filtrage préventif |
| #2 AbuseIPDB reporter | Journalisation / Partage d'information sur incidents |
| #3 Log denoising | Journalisation / Détection d'événements pertinents |
| #4 SIEM connector | Supervision / Remontée d'alertes vers SIEM |

---

*Document généré par analyse croisée `gkerma/syswarden` × `gkerma/secubox-openwrt`*  
*CyberMind.FR — Usage interne — Style OPORD confidentiel*
