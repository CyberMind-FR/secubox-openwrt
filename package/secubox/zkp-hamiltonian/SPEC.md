# Spécification Technique — Protocole ZKP Hamiltonien
## Zero-Knowledge Proof basé sur le problème du Cycle Hamiltonien
### CyberMind.FR / SecuBox — Version 1.0

---

## 1. Vue d'ensemble

### 1.1 Objectif

Implémenter un protocole de **preuve à divulgation nulle de connaissance (ZKP)** basé sur le problème NP-complet du cycle hamiltonien (Blum 1986, étendu NIZK via Fiat-Shamir). Le Prouveur démontre qu'il connaît un cycle hamiltonien dans un graphe public **sans révéler le cycle lui-même**.

### 1.2 Propriétés garanties

| Propriété | Définition | Garantie |
|-----------|-----------|----------|
| **Complétude** | Un Prouveur honnête convainc toujours le Vérifieur | Probabilité 1 |
| **Solidité (Soundness)** | Un tricheur échoue avec haute probabilité | ≥ 1 - 2^{-λ} |
| **Divulgation nulle (ZK)** | Le Vérifieur n'apprend rien sur H | Simulable en temps polynomial |

### 1.3 Paramètres cibles

- **Niveau de sécurité** : λ = 128 bits
- **Taille du graphe** : n ∈ [50, 80] nœuds
- **Mode** : NIZK (Non-Interactive ZK) via transformation Fiat-Shamir
- **Cible matérielle** : OpenWrt sur ARM (routeurs MIPS/ARM Cortex-A7+)
- **Dépendances** : libsodium ou OpenSSL (SHA3-256), C99

---

## 2. Primitives cryptographiques

### 2.1 Fonction de commit

```
Commit : {0,1} × {0,1}^256 → {0,1}^256
Commit(bit, nonce) = SHA3-256(bit || nonce)
```

**Propriétés requises :**
- **Binding** : impossible de trouver (b, r) ≠ (b', r') tel que Commit(b,r) = Commit(b',r')
- **Hiding** : Commit(b, r) avec r uniforme est indistinguable de aléatoire

**Implémentation :**
```c
void commit(uint8_t bit, const uint8_t nonce[32], uint8_t out[32]);
// out = SHA3-256(bit_byte || nonce[0..31])
// bit_byte = 0x00 si bit=0, 0x01 si bit=1
```

### 2.2 Fonction de hash pour Fiat-Shamir

```
H_FS : {0,1}* → {0,1}^128
H_FS(G, G', {commits}, session_nonce) = SHA3-256(...)[:16]
```

Entrées concaténées dans l'ordre canonique :
1. Identifiant de protocole : `"ZKP-HAM-v1"` (ASCII)
2. Matrice d'adjacence de G (sérialisée, big-endian)
3. Matrice d'adjacence de G' (sérialisée)
4. Tous les commits dans l'ordre (i, j) lexicographique
5. Nonce de session (32 octets, aléatoire, anti-rejeu)

### 2.3 Génération aléatoire

**Obligatoire** : `getrandom()` (Linux ≥ 3.17) ou `/dev/urandom` — jamais `rand()`.

```c
#include <sys/random.h>
ssize_t getrandom(void *buf, size_t buflen, unsigned int flags);
```

---

## 3. Générateur de graphe à trapdoor

### 3.1 Algorithme de construction

Le graphe G est construit à partir d'un cycle hamiltonien H (la trapdoor) en ajoutant des arêtes leurres.

```
GENERATE_GRAPH(n, extra_edge_ratio) → (G, H)

1. Générer H :
   a. Créer une permutation aléatoire uniforme des nœuds {0..n-1}
      via Fisher-Yates avec getrandom()
   b. H = [(π[0],π[1]), (π[1],π[2]), ..., (π[n-2],π[n-1]), (π[n-1],π[0])]

2. Initialiser G avec les arêtes de H

3. Ajouter des arêtes leurres :
   - Nombre cible : extra = floor(n * extra_edge_ratio)   // ratio ≈ 0.5..1.5
   - Pour chaque arête leurre candidate (u, v) ∉ H, u < v :
       - Vérifier que (u,v) n'est pas dans G
       - Vérifier que l'ajout de (u,v) ne crée pas un sous-cycle de longueur < n
         (optionnel pour niveau basique, recommandé pour niveau élevé)
       - Ajouter (u,v) à G

4. Retourner (G, H)
```

**Invariants à vérifier :**
- G est connexe
- H est un cycle hamiltonien valide dans G (n arêtes, chaque nœud de degré ≥ 2)
- G est non-orienté (arête (u,v) ⟺ arête (v,u))

### 3.2 Paramètres recommandés

| Niveau sécurité | n | extra_edge_ratio | |arêtes| total |
|---|---|---|---|
| Développement | 20 | 0.5 | ~30 |
| Production 128b | 50 | 1.0 | ~75 |
| Production 256b | 70 | 1.2 | ~120 |

### 3.3 Représentation mémoire

```c
#define MAX_N 128

typedef struct {
    uint8_t  n;              // nombre de nœuds
    uint64_t adj[MAX_N];     // adj[i] : bitfield des voisins de i
                             // adj[i] & (1ULL << j) = 1 si arête (i,j)
} Graph;

typedef struct {
    uint8_t  n;              // longueur du cycle = nombre de nœuds
    uint8_t  nodes[MAX_N];   // nodes[0..n-1] : séquence des nœuds du cycle
                             // arêtes : (nodes[i], nodes[(i+1)%n])
} HamiltonianCycle;
```

---

## 4. Protocole interactif (base)

### 4.1 Acteurs

- **Prouveur P** : connaît (G, H)
- **Vérifieur V** : connaît G uniquement

### 4.2 Déroulement d'un round

```
ROUND(P(G,H), V(G)) :

── COMMIT ──────────────────────────────────────────────────────
P :
  1. Choisir π ∈ S_n uniformément (Fisher-Yates + getrandom)
  2. Calculer G' = π(G) :
       G'.adj[π[i]] |= (1ULL << π[j]) pour chaque arête (i,j) de G
  3. Pour chaque paire (i,j) avec i < j, 0 ≤ i,j < n :
       Choisir nonce[i][j] ∈ {0,1}^256 via getrandom
       bit = (G'.adj[i] >> j) & 1      // 1 si arête, 0 sinon
       commit[i][j] = SHA3-256(bit || nonce[i][j])
  4. Envoyer {commit[i][j]} à V

── CHALLENGE ───────────────────────────────────────────────────
V :
  5. Choisir b ∈ {0, 1} uniformément
  6. Envoyer b à P

── RÉPONSE ─────────────────────────────────────────────────────
P :
  Si b = 0 (challenge isomorphisme) :
    7a. Envoyer (π, tous les nonces[i][j])
  Si b = 1 (challenge cycle hamiltonien) :
    7b. Calculer H' = π(H) dans G'
        Pour chaque arête (u,v) de H' :
          Envoyer (u, v, nonce[min(u,v)][max(u,v)])

── VÉRIFICATION ────────────────────────────────────────────────
V :
  Si b = 0 :
    8a. Recalculer G'' = π(G)
        Pour chaque arête (i,j) de G'' :
          Vérifier commit[min(i,j)][max(i,j)] = SHA3-256(0x01 || nonce[i][j])
        Pour chaque non-arête :
          Vérifier commit[min(i,j)][max(i,j)] = SHA3-256(0x00 || nonce[i][j])
        ACCEPT si toutes les vérifications passent

  Si b = 1 :
    8b. Vérifier que H' forme un cycle hamiltonien valide :
          - Exactement n arêtes
          - Chaque nœud apparaît exactement une fois
          - Le cycle est connexe
        Pour chaque arête (u,v) de H' :
          Vérifier commit[min(u,v)][max(u,v)] = SHA3-256(0x01 || nonce[u][v])
        ACCEPT si tout est valide
```

### 4.3 Analyse de sécurité

**Complétude** : P honnête calcule toujours une réponse valide pour les deux challenges.

**Soundness** : Un tricheur (sans H) doit préparer à l'avance une réponse pour b=0 OU b=1, pas les deux simultanément. Probabilité de réussite par round = 1/2. Pour k rounds : 2^{-k}.

**Zero-Knowledge** : Le simulateur S (sans H) :
- Si b=0 : construit G' quelconque, révèle l'isomorphisme → valide
- Si b=1 : construit G' en posant un cycle arbitraire C, commit uniquement les arêtes de C → révèle C

Le Vérifieur ne peut distinguer transcription réelle de transcription simulée.

---

## 5. Protocole NIZK (Fiat-Shamir)

### 5.1 Transformation

Le challenge interactif `b` est remplacé par :

```
b = H_FS(G, G', {commits}, session_nonce)[0] & 0x01
```

Le Prouveur génère la preuve complète (commit + réponse) en une passe.

### 5.2 Structure de la preuve NIZK

```c
typedef struct {
    // En-tête
    uint8_t  version;                        // 0x01
    uint8_t  n;                              // nombre de nœuds
    uint8_t  session_nonce[32];              // anti-rejeu

    // Graphe G' (isomorphe de G sous π)
    uint64_t gprime_adj[MAX_N];             // matrice d'adjacence de G'

    // Commits de toutes les arêtes de G'
    uint8_t  commits[MAX_N][MAX_N][32];     // commits[i][j] pour i<j

    // Challenge (déterministe via Fiat-Shamir)
    uint8_t  challenge;                      // 0 ou 1

    // Réponse (selon challenge)
    union {
        struct {                             // si challenge = 0
            uint8_t  perm[MAX_N];           // permutation π
            uint8_t  nonces[MAX_N][MAX_N][32]; // tous les nonces
        } iso_response;

        struct {                             // si challenge = 1
            uint8_t  cycle_nodes[MAX_N];    // H' = cycle dans G'
            uint8_t  nonces[MAX_N][32];     // nonces des arêtes du cycle
        } ham_response;
    };
} NIZKProof;
```

### 5.3 Algorithme Prove

```
PROVE(G, H) → NIZKProof proof

1. Générer session_nonce ∈ {0,1}^256 via getrandom
2. Choisir π ∈ S_n (Fisher-Yates + getrandom)
3. Calculer G' = π(G)
4. Pour chaque (i,j), i<j :
     Générer nonce[i][j] via getrandom
     bit = arête présente dans G' ?
     commit[i][j] = SHA3-256(bit || nonce[i][j])
5. Calculer b = H_FS(G, G', commits, session_nonce)[0] & 0x01
6. Construire réponse selon b
7. Retourner proof
```

### 5.4 Algorithme Verify

```
VERIFY(G, proof) → {ACCEPT, REJECT}

1. Vérifier proof.version == 0x01
2. Vérifier proof.n == G.n
3. Recalculer b = H_FS(G, proof.gprime_adj, proof.commits, proof.session_nonce)[0] & 0x01
4. Vérifier proof.challenge == b  (sinon REJECT)
5. Si b = 0 :
     Vérifier permutation + commits (challenge isomorphisme)
6. Si b = 1 :
     Vérifier cycle hamiltonien + commits (challenge cycle)
7. Retourner ACCEPT ou REJECT
```

---

## 6. Vérifications de validité

### 6.1 Validation du cycle hamiltonien

```c
bool validate_hamiltonian_cycle(const Graph *G, const HamiltonianCycle *H) {
    if (H->n != G->n) return false;

    // 1. Tous les nœuds distincts
    uint64_t seen = 0;
    for (int i = 0; i < H->n; i++) {
        uint8_t node = H->nodes[i];
        if (node >= G->n) return false;
        if (seen & (1ULL << node)) return false;  // doublon
        seen |= (1ULL << node);
    }
    if (seen != (1ULL << G->n) - 1) return false;  // nœuds manquants

    // 2. Chaque arête du cycle existe dans G
    for (int i = 0; i < H->n; i++) {
        uint8_t u = H->nodes[i];
        uint8_t v = H->nodes[(i + 1) % H->n];
        if (!(G->adj[u] & (1ULL << v))) return false;
    }

    return true;
}
```

### 6.2 Comparaison en temps constant

```c
// OBLIGATOIRE pour éviter les timing attacks
bool const_time_memcmp(const uint8_t *a, const uint8_t *b, size_t len) {
    uint8_t diff = 0;
    for (size_t i = 0; i < len; i++) {
        diff |= a[i] ^ b[i];
    }
    return diff == 0;
}
// Ou utiliser : crypto_verify_32() de libsodium
```

---

## 7. Interface publique (API)

```c
// === Génération ===

// Génère un graphe à trapdoor avec son cycle hamiltonien
// Retourne 0 si succès, -1 si erreur
int zkp_generate_graph(uint8_t n, double extra_ratio,
                       Graph *out_graph, HamiltonianCycle *out_cycle);

// === Protocole ===

// Génère une preuve NIZK (Prouveur)
// Retourne 0 si succès
int zkp_prove(const Graph *G, const HamiltonianCycle *H,
              NIZKProof *out_proof);

// Vérifie une preuve NIZK (Vérifieur)
// Retourne 1 si ACCEPT, 0 si REJECT, -1 si erreur
int zkp_verify(const Graph *G, const NIZKProof *proof);

// === Sérialisation ===

// Sérialise/désérialise la preuve pour transport réseau
int zkp_proof_serialize(const NIZKProof *proof, uint8_t *buf, size_t *len);
int zkp_proof_deserialize(const uint8_t *buf, size_t len, NIZKProof *proof);

// Sérialise/désérialise le graphe public
int zkp_graph_serialize(const Graph *G, uint8_t *buf, size_t *len);
int zkp_graph_deserialize(const uint8_t *buf, size_t len, Graph *G);

// === Utilitaires ===

// Affiche lisiblement (debug)
void zkp_graph_print(const Graph *G);
void zkp_cycle_print(const HamiltonianCycle *H);
void zkp_proof_print(const NIZKProof *proof);
```

---

## 8. Structure du projet

```
zkp-hamiltonian/
├── CMakeLists.txt
├── README.md
├── include/
│   ├── zkp_hamiltonian.h      // API publique complète
│   ├── zkp_types.h            // Types (Graph, HamiltonianCycle, NIZKProof)
│   ├── zkp_crypto.h           // Primitives crypto (commit, hash_fs)
│   └── zkp_graph.h            // Opérations sur graphes
├── src/
│   ├── zkp_graph.c            // Générateur + opérations graphe
│   ├── zkp_crypto.c           // SHA3-256, commits, Fiat-Shamir
│   ├── zkp_prove.c            // Algorithme Prove
│   ├── zkp_verify.c           // Algorithme Verify
│   └── zkp_serialize.c        // Sérialisation binaire
├── tests/
│   ├── test_graph.c           // Tests du générateur
│   ├── test_crypto.c          // Tests des primitives
│   ├── test_protocol.c        // Tests complétude + soundness
│   ├── test_nizk.c            // Tests Fiat-Shamir
│   └── test_vectors.c         // Vecteurs de test fixes
├── tools/
│   ├── zkp_keygen.c           // CLI : génère et sauvegarde (G, H)
│   ├── zkp_prover.c           // CLI : génère une preuve
│   └── zkp_verifier.c         // CLI : vérifie une preuve
└── openwrt/
    ├── Makefile               // Package OpenWrt
    └── files/
        └── etc/secubox/zkp.conf
```

---

## 9. Vecteurs de test

### 9.1 Graphe minimal (n=4, développement)

```
G (n=4) :
  Arêtes : (0,1), (1,2), (2,3), (3,0), (0,2)  // 4 cycle + 1 leurre
  adj[0] = 0b1101 = {1, 2, 3}
  adj[1] = 0b0101 = {0, 2}
  adj[2] = 0b0111 = {0, 1, 3}
  adj[3] = 0b0101 = {0, 2}   // erreur → adj[3]={0,2} mais arête (2,3) et (3,0)

Cycle hamiltonien H : [0, 1, 2, 3] (retour 3→0)

Commit test :
  bit=1, nonce=0x00...00 (32 zéros)
  SHA3-256(0x01 || 0x00...00) = [valeur fixe à calculer et inclure]
```

### 9.2 Tests automatisés requis

1. **test_completeness** : `zkp_prove` puis `zkp_verify` → toujours ACCEPT
2. **test_soundness** : preuve avec cycle invalide → toujours REJECT
3. **test_anti_replay** : deux preuves du même (G,H) → session_nonces différents
4. **test_tamper_commit** : modifier un commit → REJECT
5. **test_tamper_challenge** : modifier le challenge → REJECT (hash incohérent)
6. **test_tamper_cycle** : modifier un nœud du cycle → REJECT
7. **benchmark_n50** : mesurer temps prove/verify et RAM pour n=50

---

## 10. Considérations OpenWrt / embarqué

### 10.1 Contraintes mémoire

Pour n=50 :
- `commits[50][50][32]` = 80 000 octets ≈ 78 Ko (alloué dynamiquement)
- `nonces[50][50][32]` = 80 000 octets (libérés après preuve)
- Stack : prévoir 8 Ko minimum pour les fonctions récursives

### 10.2 CMakeLists.txt (cross-compilation OpenWrt)

```cmake
cmake_minimum_required(VERSION 3.16)
project(zkp_hamiltonian C)
set(CMAKE_C_STANDARD 99)

# Options
option(USE_LIBSODIUM "Use libsodium for crypto" ON)
option(BUILD_TOOLS "Build CLI tools" ON)
option(BUILD_TESTS "Build test suite" ON)

# Cible embarquée : optimiser la taille
if(OPENWRT_BUILD)
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Os -ffunction-sections -fdata-sections")
    set(CMAKE_EXE_LINKER_FLAGS "-Wl,--gc-sections")
endif()
```

### 10.3 Dépendances

```
libsodium >= 1.0.18   // SHA3-256 (crypto_hash_sha256 ou SHA3 via EVP)
   OU
openssl >= 1.1.1      // EVP_DigestInit avec EVP_sha3_256()
```

Pour OpenWrt : `libsodium` est disponible dans les feeds standard.

---

## 11. Références

1. Blum, M. (1986). *How to prove a theorem so no one else can claim it.* ICM.
2. Fiat, A., Shamir, A. (1986). *How to Prove Yourself.* CRYPTO 1986. LNCS 263.
3. Goldreich, O., Micali, S., Wigderson, A. (1991). *Proofs that yield nothing but their validity.* JACM.
4. OEIS A000940 — *Number of inequivalent Hamiltonian cycles in K_n under dihedral group.*
5. ANSSI — *Référentiel d'exigences pour les mécanismes cryptographiques.* (pour certification CSPN SecuBox)
