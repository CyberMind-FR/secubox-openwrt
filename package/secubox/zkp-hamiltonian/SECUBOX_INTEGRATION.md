# Intégration SecuBox — Module ZKP Hamiltonien
## Architecture d'intégration dans l'écosystème SecuBox
### CyberMind.FR — Version 1.0

---

## 1. Positionnement dans SecuBox

### 1.1 Carte des modules SecuBox concernés

```
SecuBox (38+ modules)
│
├── secubox-core              ← dépendance de base
├── secubox-auth              ← MODULE PRINCIPAL CONSOMMATEUR
│   ├── zkp-hamiltonian       ← CE MODULE (nouveau)
│   ├── pki-local             ← remplacé partiellement
│   └── password-auth         ← complété par ZKP
│
├── secubox-vpn               ← intégration phase 2
├── secubox-ids               ← intégration phase 3
└── secubox-luci              ← interface de gestion
    └── luci-app-zkp          ← nouveau (dashboard LuCI)
```

### 1.2 Cas d'usage cibles

| Cas d'usage | Description | Priorité |
|-------------|-------------|----------|
| **Auth nœud-à-nœud** | Deux routeurs prouvent mutuellement leur identité sans PKI centrale | P1 |
| **Auth admin sans mot de passe** | L'admin prouve qu'il possède la clé secrète (H) sans la transmettre | P1 |
| **Bootstrap réseau maillé** | Enrôlement d'un nouveau nœud sans autorité de certification | P2 |
| **Audit de configuration** | Prouver qu'une config est valide sans révéler les détails | P3 |

---

## 2. Architecture d'intégration

### 2.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    SecuBox Node A (Prouveur)                  │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  secubox-auth│    │zkp-hamiltonian│    │  secubox-core │  │
│  │              │───▶│              │───▶│               │  │
│  │  auth_agent  │    │  zkp_prove() │    │ /dev/urandom  │  │
│  │              │◀───│              │    │ libsodium     │  │
│  └──────────────┘    └──────────────┘    └───────────────┘  │
│           │                                                   │
│           │  NIZKProof (binaire sérialisé)                    │
└───────────┼───────────────────────────────────────────────────┘
            │  réseau (UDP/TCP chiffré par secubox-vpn)
┌───────────┼───────────────────────────────────────────────────┐
│           │                  SecuBox Node B (Vérifieur)        │
│  ┌────────▼─────┐    ┌──────────────┐    ┌───────────────┐   │
│  │  secubox-auth│    │zkp-hamiltonian│    │ secubox-luci  │   │
│  │              │───▶│              │    │               │   │
│  │  auth_verif  │    │ zkp_verify() │    │ dashboard ZKP │   │
│  │              │◀───│              │    │               │   │
│  └──────────────┘    └──────────────┘    └───────────────┘   │
└─────────────────────────────────────────────────────────────-─┘
```

### 2.2 Interface avec secubox-auth

Le module `secubox-auth` appelle `zkp-hamiltonian` via une **interface C bien définie** et une **interface de socket Unix** pour les composants non-C (scripts Lua/LuCI).

```c
/* secubox_auth_zkp.h — Interface auth ↔ ZKP */

#include "zkp_hamiltonian.h"

/* Contexte d'authentification ZKP persistant */
typedef struct {
    char     identity[64];      /* identifiant du nœud ("node-A") */
    Graph    G;                 /* graphe public partagé */
    HamiltonianCycle H;         /* clé secrète (uniquement côté prouveur) */
    uint8_t  G_fingerprint[32]; /* SHA3-256(G sérialisé), partagé */
    bool     has_secret;        /* true si ce nœud est prouveur */
} ZKPAuthContext;

/* Initialisation */
int zkp_auth_init_prover(ZKPAuthContext *ctx,
                          const char *identity,
                          uint8_t n,
                          double extra_ratio);

int zkp_auth_init_verifier(ZKPAuthContext *ctx,
                            const char *identity,
                            const uint8_t *serialized_G,
                            size_t G_len);

/* Protocole */
int zkp_auth_prove(const ZKPAuthContext *ctx,
                   uint8_t *proof_buf,
                   size_t *proof_len);

int zkp_auth_verify(const ZKPAuthContext *ctx,
                    const uint8_t *proof_buf,
                    size_t proof_len);

/* Export du graphe public (à diffuser au vérifieur) */
int zkp_auth_export_public(const ZKPAuthContext *ctx,
                            uint8_t *buf,
                            size_t *len);

/* Persistance sécurisée */
int zkp_auth_save_context(const ZKPAuthContext *ctx,
                           const char *path);       /* chiffré AES-256-GCM */

int zkp_auth_load_context(ZKPAuthContext *ctx,
                           const char *path,
                           const uint8_t *key);     /* clé de déchiffrement */
```

---

## 3. Protocole réseau SecuBox-ZKP

### 3.1 Format des messages

Tous les messages sont encapsulés dans le format SecuBox standard (TLV binaire) :

```
┌──────────────────────────────────────────────────────────────┐
│  SecuBox Message Frame                                        │
│                                                               │
│  [4B] Magic    = 0x5345_435A  ("SECZ")                       │
│  [1B] Version  = 0x01                                         │
│  [1B] Type     = voir tableau ci-dessous                      │
│  [2B] Reserved = 0x0000                                       │
│  [4B] Length   = longueur du payload en octets (big-endian)  │
│  [32B] HMAC   = HMAC-SHA3-256(header+payload, session_key)   │
│  [Nb] Payload  = données du message                           │
└──────────────────────────────────────────────────────────────┘
```

| Type | Valeur | Description |
|------|--------|-------------|
| `ZKP_HELLO`        | 0x10 | Demande d'auth, envoie identité |
| `ZKP_GRAPH_OFFER`  | 0x11 | Prouveur envoie G (graphe public) |
| `ZKP_GRAPH_ACK`    | 0x12 | Vérifieur confirme réception de G |
| `ZKP_PROOF`        | 0x13 | Prouveur envoie NIZKProof |
| `ZKP_RESULT`       | 0x14 | Vérifieur envoie ACCEPT/REJECT |
| `ZKP_ERROR`        | 0xFF | Erreur protocolaire |

### 3.2 Séquence d'authentification complète

```
Prouveur (A)                              Vérifieur (B)
    │                                          │
    │──── ZKP_HELLO {identity_A, n} ──────────▶│
    │                                          │ (lookup G_A dans sa DB
    │                                          │  ou demande envoi)
    │◀─── ZKP_GRAPH_OFFER? ou ZKP_GRAPH_ACK ──│
    │                                          │
    │  [si B ne connaît pas G_A]               │
    │──── ZKP_GRAPH_OFFER {G_sérialisé} ──────▶│
    │                                          │ (stocke G_A,
    │                                          │  vérifie fingerprint)
    │◀─── ZKP_GRAPH_ACK {G_fingerprint} ───────│
    │                                          │
    │  [génération de la preuve NIZK]          │
    │  zkp_prove(G, H) → NIZKProof             │
    │                                          │
    │──── ZKP_PROOF {NIZKProof_sérialisée} ───▶│
    │                                          │ zkp_verify(G, proof)
    │◀─── ZKP_RESULT {ACCEPT, timestamp} ──────│
    │                                          │
    │  [session établie]                       │
```

### 3.3 Gestion des timeouts et rejeu

```c
/* Paramètres de sécurité du protocole réseau */
#define ZKP_NET_TIMEOUT_MS        5000   /* 5s max par message */
#define ZKP_NET_MAX_PROOF_SIZE    (128*128*32 + 512)  /* taille max NIZKProof */
#define ZKP_SESSION_NONCE_TTL_S   30     /* nonce de session périmé après 30s */
#define ZKP_MAX_AUTH_ATTEMPTS     3      /* ban temporaire après 3 échecs */
#define ZKP_BAN_DURATION_S        300    /* 5 minutes de ban */
```

Le `session_nonce` dans NIZKProof inclut un **timestamp UNIX 32 bits** dans ses 4 premiers octets — le vérifieur rejette toute preuve avec timestamp > 30 secondes d'écart.

---

## 4. Stockage et persistance

### 4.1 Arborescence des fichiers

```
/etc/secubox/zkp/
├── identity.conf           ← configuration du nœud
├── prover/
│   ├── graph.pub           ← graphe public G (partageable)
│   ├── key.enc             ← cycle H chiffré (AES-256-GCM + PBKDF2)
│   └── key.pub.fingerprint ← SHA3-256(G) pour vérification rapide
└── verifier/
    ├── trusted/
    │   ├── node-A.pub      ← graphe public de node-A
    │   ├── node-B.pub      ← graphe public de node-B
    │   └── ...
    └── sessions/
        └── [nonce].used    ← nonces consommés (anti-rejeu, TTL 30s)
```

### 4.2 Format de la clé chiffrée (key.enc)

```
┌─────────────────────────────────────────────────────┐
│  ZKP Key File v1                                     │
│                                                       │
│  [4B]  Magic   = "ZKPK"                              │
│  [1B]  Version = 0x01                                │
│  [16B] Salt    = sel PBKDF2 (aléatoire)             │
│  [12B] IV      = nonce AES-256-GCM                  │
│  [4B]  Iter    = itérations PBKDF2 (ex: 100000)     │
│  [4B]  PayLen  = longueur du payload chiffré         │
│  [Nb]  Payload = AES-256-GCM(HamiltonianCycle sér.) │
│  [16B] Tag     = tag GCM                             │
└─────────────────────────────────────────────────────┘
```

Le mot de passe de déchiffrement est dérivé du mot de passe admin SecuBox via PBKDF2-SHA256. En option : déchiffrement via TPM si disponible sur le matériel.

### 4.3 Rotation des clés

```
/etc/secubox/zkp/rotate.sh
  1. Générer (G_new, H_new) via zkp_keygen
  2. Annoncer G_new aux nœuds pairs (ZKP_GRAPH_OFFER)
  3. Période de grâce : 24h où G_old et G_new sont acceptés
  4. Supprimer G_old après la période de grâce
```

---

## 5. Interface LuCI (luci-app-zkp)

### 5.1 Pages et fonctionnalités

```
SecuBox Dashboard
└── Authentification ZKP
    ├── [Onglet] État
    │   ├── Statut du module (actif/inactif)
    │   ├── Identité du nœud
    │   ├── Fingerprint du graphe public
    │   ├── Nombre d'authentifications réussies (24h)
    │   ├── Nombre d'échecs (24h)
    │   └── Dernière authentification (horodatage + peer)
    │
    ├── [Onglet] Configuration
    │   ├── Taille du graphe n (slider 20-80)
    │   ├── Ratio arêtes leurres (0.5 - 2.0)
    │   ├── Timeout réseau (ms)
    │   ├── Tentatives max avant ban
    │   └── Durée de ban (secondes)
    │
    ├── [Onglet] Gestion des clés
    │   ├── [Bouton] Générer nouvelle paire (G, H)
    │   ├── [Bouton] Exporter graphe public G
    │   ├── [Bouton] Importer graphe public (pair de confiance)
    │   ├── [Bouton] Rotation des clés
    │   └── Liste des pairs de confiance
    │
    └── [Onglet] Journal
        ├── Filtres : date, peer, résultat
        ├── Tableau des événements d'authentification
        └── [Bouton] Exporter CSV
```

### 5.2 Backend UCI (Unified Configuration Interface)

```uci
# /etc/config/secubox_zkp

config zkp 'global'
    option enabled      '1'
    option identity     'node-notre-dame-01'
    option graph_n      '50'
    option extra_ratio  '1.0'
    option timeout_ms   '5000'
    option max_attempts '3'
    option ban_duration '300'
    option log_level    'info'       # debug|info|warn|error

config zkp 'network'
    option listen_port  '7890'
    option bind_addr    '0.0.0.0'
    option use_tls      '1'          # TLS par-dessus pour le transport

config trusted_peer 'node-a'
    option identity     'node-a'
    option graph_file   '/etc/secubox/zkp/verifier/trusted/node-a.pub'
    option fingerprint  'a1b2c3...'
    option enabled      '1'
```

### 5.3 Script UCI de génération initiale

```sh
#!/bin/sh
# /etc/secubox/zkp/init.sh
# Appelé lors du premier démarrage ou après factory reset

IDENTITY=$(uci get secubox_zkp.global.identity 2>/dev/null || hostname)
N=$(uci get secubox_zkp.global.graph_n 2>/dev/null || echo 50)
RATIO=$(uci get secubox_zkp.global.extra_ratio 2>/dev/null || echo 1.0)

mkdir -p /etc/secubox/zkp/prover
mkdir -p /etc/secubox/zkp/verifier/trusted
mkdir -p /etc/secubox/zkp/verifier/sessions

# Génération de la paire (G, H)
zkp_keygen -n "$N" -r "$RATIO" -o /etc/secubox/zkp/prover/identity \
    && logger -t secubox-zkp "Graphe généré : n=$N, ratio=$RATIO" \
    || { logger -t secubox-zkp "ERREUR : génération échouée"; exit 1; }

# Calcul du fingerprint
sha3sum /etc/secubox/zkp/prover/identity.graph \
    > /etc/secubox/zkp/prover/key.pub.fingerprint

logger -t secubox-zkp "Initialisation ZKP terminée pour $IDENTITY"
```

---

## 6. Daemon secubox-zkpd

### 6.1 Rôle

Le daemon `secubox-zkpd` gère les connexions entrantes, maintient les sessions, applique les politiques de ban, et journalise les événements dans syslog.

### 6.2 Fichier de démarrage init.d

```sh
#!/bin/sh /etc/rc.common
# /etc/init.d/secubox-zkpd

START=85
STOP=15
USE_PROCD=1

NAME=secubox-zkpd
PROG=/usr/sbin/secubox-zkpd

start_service() {
    local enabled identity port bind_addr

    config_load secubox_zkp
    config_get_bool enabled global enabled 1
    [ "$enabled" -eq 0 ] && return 0

    config_get identity  global identity  "secubox-node"
    config_get port      network listen_port 7890
    config_get bind_addr network bind_addr  "0.0.0.0"

    procd_open_instance
    procd_set_param command "$PROG" \
        -i "$identity" \
        -p "$port" \
        -b "$bind_addr" \
        -g /etc/secubox/zkp/prover/identity.graph \
        -k /etc/secubox/zkp/prover/identity.key.enc \
        -T /etc/secubox/zkp/verifier/trusted/ \
        -S /etc/secubox/zkp/verifier/sessions/
    procd_set_param respawn 3600 5 0
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_set_param file /etc/config/secubox_zkp
    procd_close_instance
}

reload_service() {
    stop
    start
}
```

### 6.3 Intégration syslog

```c
/* Niveaux de log SecuBox-ZKP */
#define ZKP_LOG_DEBUG   LOG_DEBUG
#define ZKP_LOG_INFO    LOG_INFO
#define ZKP_LOG_WARN    LOG_WARNING
#define ZKP_LOG_ERROR   LOG_ERR
#define ZKP_LOG_AUDIT   LOG_NOTICE   /* toujours loggé, pour l'audit ANSSI */

/* Macro de log */
#define zkp_log(level, fmt, ...) \
    syslog(level, "[secubox-zkp] " fmt, ##__VA_ARGS__)

/* Événements d'audit obligatoires (ANSSI CSPN) */
/* Toujours logger avec ZKP_LOG_AUDIT : */
/*   - AUTH_SUCCESS : peer, timestamp, proof_size       */
/*   - AUTH_FAILURE : peer, timestamp, raison           */
/*   - KEY_GENERATED : n, ratio, fingerprint            */
/*   - KEY_ROTATED   : old_fingerprint, new_fingerprint */
/*   - PEER_BANNED   : peer_ip, attempt_count           */
/*   - PEER_UNBANNED : peer_ip                          */
```

---

## 7. Tests d'intégration SecuBox

### 7.1 Tests sur nœud unique (simulation)

```sh
#!/bin/sh
# tests/integration/test_loopback.sh

GRAPH=/tmp/test.graph
KEY=/tmp/test.key.enc
PROOF=/tmp/test.proof

echo "=== Test 1 : Génération ==="
zkp_keygen -n 20 -r 0.5 -o /tmp/test
[ $? -eq 0 ] && echo "OK" || { echo "FAIL"; exit 1; }

echo "=== Test 2 : Preuve ==="
zkp_prover -g $GRAPH -k $KEY -o $PROOF
[ $? -eq 0 ] && echo "OK" || { echo "FAIL"; exit 1; }

echo "=== Test 3 : Vérification ==="
zkp_verifier -g $GRAPH -p $PROOF
[ $? -eq 0 ] && echo "ACCEPT OK" || { echo "REJECT - FAIL"; exit 1; }

echo "=== Test 4 : Anti-rejeu ==="
zkp_verifier -g $GRAPH -p $PROOF  # deuxième fois avec même proof
[ $? -ne 0 ] && echo "OK (rejeu détecté)" || echo "FAIL (rejeu accepté)"

echo "=== Test 5 : Preuve corrompue ==="
cp $PROOF /tmp/tampered.proof
printf '\xFF' | dd of=/tmp/tampered.proof bs=1 seek=100 conv=notrunc 2>/dev/null
zkp_verifier -g $GRAPH -p /tmp/tampered.proof
[ $? -eq 1 ] && echo "REJECT OK" || echo "FAIL (corruption non détectée)"
```

### 7.2 Test deux nœuds (QEMU/netns)

```sh
# tests/integration/test_two_nodes.sh
# Requiert : ip netns, qemu ou deux VMs OpenWrt

ip netns add prover_ns
ip netns add verifier_ns
ip link add veth-p type veth peer name veth-v
ip link set veth-p netns prover_ns
ip link set veth-v netns verifier_ns

ip netns exec prover_ns   ip addr add 10.0.0.1/24 dev veth-p
ip netns exec verifier_ns ip addr add 10.0.0.2/24 dev veth-v
ip netns exec prover_ns   ip link set veth-p up
ip netns exec verifier_ns ip link set veth-v up

# Démarrer le vérifieur
ip netns exec verifier_ns secubox-zkpd \
    -g /tmp/node-a.graph \
    -T /tmp/trusted/ \
    -p 7890 &

sleep 1

# Authentification depuis le prouveur
ip netns exec prover_ns zkp_client \
    -g /tmp/node-a.graph \
    -k /tmp/node-a.key.enc \
    -H 10.0.0.2 -P 7890

echo "Résultat : $?"
```

---

## 8. Feuille de route d'intégration

### 8.1 Phases

```
Phase 1 — Bibliothèque standalone (4-6 semaines)
  ✓ zkp-hamiltonian compilé pour OpenWrt
  ✓ Tests unitaires passants
  ✓ CLI tools fonctionnels
  ✓ Package OpenWrt installable

Phase 2 — Intégration auth (3-4 semaines)
  ✓ secubox-auth utilise zkp pour auth nœud-à-nœud
  ✓ Protocole réseau implémenté (secubox-zkpd)
  ✓ UCI configuration
  ✓ init.d + procd

Phase 3 — Interface LuCI (2-3 semaines)
  ✓ luci-app-zkp dashboard
  ✓ Gestion des clés via interface web
  ✓ Journal d'authentification
  ✓ Import/export des graphes pairs

Phase 4 — Durcissement CSPN (ongoing)
  ✓ Audit des logs conformes ANSSI
  ✓ Tests de pénétration
  ✓ Documentation pour dossier CSPN
  ✓ Fuzz testing des parseurs réseau
```

### 8.2 Dépendances inter-modules SecuBox

```
zkp-hamiltonian
    ↑ requis par
secubox-auth (mod_zkp)
    ↑ requis par
secubox-vpn (auth handshake)
secubox-ids (détection bruteforce ZKP)
luci-app-zkp (interface)
secubox-audit (logs CSPN)
```
