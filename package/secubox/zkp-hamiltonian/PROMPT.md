# Prompt — Agent Claude.ai dans VS Code
## Projet : zkp-hamiltonian
## À coller dans la fenêtre de chat Claude (VS Code Extension ou claude.ai)

---

## CONTEXTE ET RÔLE

Tu es un expert en cryptographie appliquée et en développement C embarqué.
Tu vas implémenter un protocole de **preuve à divulgation nulle de connaissance (Zero-Knowledge Proof)**
basé sur le problème du cycle hamiltonien (Blum 1986 + transformation NIZK Fiat-Shamir).

Cible : **OpenWrt sur ARM** (routeurs embarqués, intégration SecuBox).
Langage : **C99** exclusivement.
Dépendance crypto : **libsodium** (disponible dans les feeds OpenWrt).

La spécification complète est dans `ZKP_Hamiltonian_Spec.md` à la racine du projet.
**Lis ce fichier en premier avant toute implémentation.**

---

## ÉTAPE 1 — INITIALISATION DU PROJET

Crée la structure complète du projet :

```
zkp-hamiltonian/
├── CMakeLists.txt
├── README.md
├── include/
│   ├── zkp_hamiltonian.h
│   ├── zkp_types.h
│   ├── zkp_crypto.h
│   └── zkp_graph.h
├── src/
│   ├── zkp_graph.c
│   ├── zkp_crypto.c
│   ├── zkp_prove.c
│   ├── zkp_verify.c
│   └── zkp_serialize.c
├── tests/
│   ├── test_graph.c
│   ├── test_crypto.c
│   ├── test_protocol.c
│   └── test_nizk.c
├── tools/
│   ├── zkp_keygen.c
│   ├── zkp_prover.c
│   └── zkp_verifier.c
└── openwrt/
    └── Makefile
```

---

## ÉTAPE 2 — TYPES ET CONSTANTES (zkp_types.h)

Implémente **exactement** ces types :

```c
#ifndef ZKP_TYPES_H
#define ZKP_TYPES_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define ZKP_MAX_N        128
#define ZKP_NONCE_SIZE   32
#define ZKP_HASH_SIZE    32
#define ZKP_VERSION      0x01
#define ZKP_PROTOCOL_ID  "ZKP-HAM-v1"

typedef struct {
    uint8_t  n;
    uint64_t adj[ZKP_MAX_N];
} Graph;

typedef struct {
    uint8_t  n;
    uint8_t  nodes[ZKP_MAX_N];
} HamiltonianCycle;

typedef struct {
    uint8_t  version;
    uint8_t  n;
    uint8_t  session_nonce[ZKP_NONCE_SIZE];
    uint64_t gprime_adj[ZKP_MAX_N];
    uint8_t  commits[ZKP_MAX_N][ZKP_MAX_N][ZKP_HASH_SIZE];
    uint8_t  challenge;
    union {
        struct {
            uint8_t perm[ZKP_MAX_N];
            uint8_t nonces[ZKP_MAX_N][ZKP_MAX_N][ZKP_NONCE_SIZE];
        } iso_response;
        struct {
            uint8_t cycle_nodes[ZKP_MAX_N];
            uint8_t nonces[ZKP_MAX_N][ZKP_NONCE_SIZE];
        } ham_response;
    };
} NIZKProof;

typedef enum {
    ZKP_OK       =  0,
    ZKP_REJECT   =  0,
    ZKP_ACCEPT   =  1,
    ZKP_ERR      = -1,
    ZKP_ERR_MEM  = -2,
    ZKP_ERR_RNG  = -3,
    ZKP_ERR_PARAM= -4,
} ZKPResult;

#endif /* ZKP_TYPES_H */
```

---

## ÉTAPE 3 — PRIMITIVES CRYPTO (zkp_crypto.h / zkp_crypto.c)

### 3.1 Commit SHA3-256

```c
// Commit(bit, nonce) = SHA3-256(bit_byte || nonce[32])
// bit_byte = 0x01 si bit=1, 0x00 si bit=0
void zkp_commit(uint8_t bit, const uint8_t nonce[ZKP_NONCE_SIZE],
                uint8_t out[ZKP_HASH_SIZE]);

// Vérifie un commit en temps constant (pas de timing leak)
bool zkp_commit_verify(uint8_t bit, const uint8_t nonce[ZKP_NONCE_SIZE],
                       const uint8_t expected[ZKP_HASH_SIZE]);
```

**IMPORTANT** : utilise `SHA3-256` via `EVP_DigestInit(ctx, EVP_sha3_256())` (OpenSSL)
ou l'équivalent libsodium. La comparaison finale doit être en **temps constant** :
utilise `sodium_memcmp()` ou une boucle XOR sans branchement.

### 3.2 Hash Fiat-Shamir

```c
// H_FS(G, G', commits, session_nonce) → 1 bit (le LSB de SHA3-256)
uint8_t zkp_fiat_shamir_challenge(
    const Graph *G,
    const uint64_t gprime_adj[ZKP_MAX_N],
    const uint8_t commits[ZKP_MAX_N][ZKP_MAX_N][ZKP_HASH_SIZE],
    uint8_t n,
    const uint8_t session_nonce[ZKP_NONCE_SIZE]
);
```

Ordre de hachage canonique :
1. `ZKP_PROTOCOL_ID` (string ASCII, sans null)
2. `n` (1 octet)
3. Matrice adj de G, rangée par rangée, big-endian uint64
4. Matrice adj de G', même ordre
5. Tous les commits[i][j] pour i < j, ordre lexicographique (i,j)
6. `session_nonce`

### 3.3 Génération aléatoire sécurisée

```c
// Remplit buf[len] avec des octets cryptographiquement aléatoires
// Utilise getrandom() si disponible, sinon /dev/urandom
// Retourne ZKP_OK ou ZKP_ERR_RNG
ZKPResult zkp_random_bytes(uint8_t *buf, size_t len);

// Génère une permutation uniforme de {0..n-1} via Fisher-Yates
// Utilise zkp_random_bytes pour chaque swap
ZKPResult zkp_random_permutation(uint8_t perm[ZKP_MAX_N], uint8_t n);
```

---

## ÉTAPE 4 — GÉNÉRATEUR DE GRAPHE (zkp_graph.h / zkp_graph.c)

### 4.1 Fonctions sur les graphes

```c
// Initialise un graphe vide
void zkp_graph_init(Graph *G, uint8_t n);

// Ajoute une arête non-orientée (u,v) à G
void zkp_graph_add_edge(Graph *G, uint8_t u, uint8_t v);

// Vérifie si (u,v) est une arête de G
bool zkp_graph_has_edge(const Graph *G, uint8_t u, uint8_t v);

// Vérifie que H est un cycle hamiltonien valide dans G
bool zkp_validate_hamiltonian_cycle(const Graph *G, const HamiltonianCycle *H);

// Vérifie que G est connexe (BFS/DFS)
bool zkp_graph_is_connected(const Graph *G);

// Applique la permutation π à G : retourne G' = π(G)
void zkp_graph_permute(const Graph *G, const uint8_t perm[ZKP_MAX_N], Graph *out);

// Applique la permutation π au cycle H : retourne H' = π(H)
void zkp_cycle_permute(const HamiltonianCycle *H, const uint8_t perm[ZKP_MAX_N],
                       HamiltonianCycle *out);
```

### 4.2 Générateur à trapdoor

```c
// Génère un graphe G avec cycle hamiltonien H intégré (la trapdoor)
// n : nombre de nœuds (recommandé : 50-80 pour production)
// extra_ratio : ratio arêtes leurres / n (recommandé : 0.5 à 1.5)
// Retourne ZKP_OK ou code d'erreur
ZKPResult zkp_generate_graph(uint8_t n, double extra_ratio,
                             Graph *out_graph, HamiltonianCycle *out_cycle);
```

**Algorithme exact à implémenter :**

```
1. Générer permutation π aléatoire de {0..n-1}
2. H.nodes = [π[0], π[1], ..., π[n-1]]
   H.n = n
3. Initialiser G vide, ajouter toutes les arêtes de H
4. Calculer nb_extra = (int)(n * extra_ratio)
5. Tentatives max = nb_extra * 10 (éviter boucle infinie)
6. Tant que nb_extra > 0 et tentatives > 0 :
     Choisir u, v aléatoires dans {0..n-1}, u ≠ v
     Si (u,v) ∉ G :
         Ajouter (u,v) à G
         nb_extra--
     tentatives--
7. Vérifier zkp_graph_is_connected(G) → si non, recommencer
8. Vérifier zkp_validate_hamiltonian_cycle(G, H) → assertion
9. Retourner (G, H)
```

---

## ÉTAPE 5 — PROUVEUR (zkp_prove.c)

```c
// Génère une preuve NIZK complète
// G : graphe public
// H : cycle hamiltonien (trapdoor)
// out_proof : preuve générée
ZKPResult zkp_prove(const Graph *G, const HamiltonianCycle *H,
                    NIZKProof *out_proof);
```

**Algorithme exact :**

```
1. Valider les paramètres (G, H non NULL, G->n == H->n)
2. Initialiser proof->version = ZKP_VERSION, proof->n = G->n
3. Générer proof->session_nonce via zkp_random_bytes
4. Générer permutation π via zkp_random_permutation
5. Calculer G' = zkp_graph_permute(G, π)
   Copier G'.adj dans proof->gprime_adj
6. Pour chaque (i,j) avec i < j < n :
     Générer nonce_matrix[i][j] via zkp_random_bytes
     bit = zkp_graph_has_edge(&G', i, j) ? 1 : 0
     proof->commits[i][j] = zkp_commit(bit, nonce_matrix[i][j])
     proof->commits[j][i] = proof->commits[i][j]  // symétrique
7. proof->challenge = zkp_fiat_shamir_challenge(
       G, proof->gprime_adj, proof->commits, n, proof->session_nonce)
8. Si challenge == 0 (réponse isomorphisme) :
     Copier π dans proof->iso_response.perm
     Copier nonce_matrix dans proof->iso_response.nonces
9. Si challenge == 1 (réponse cycle) :
     Calculer H' = zkp_cycle_permute(H, π)
     Copier H'.nodes dans proof->ham_response.cycle_nodes
     Pour chaque arête (u,v) = (H'[i], H'[(i+1)%n]) :
         u_norm = min(u,v), v_norm = max(u,v)
         proof->ham_response.nonces[i] = nonce_matrix[u_norm][v_norm]
10. Effacer π et nonce_matrix de la mémoire (sodium_memzero ou explicit_bzero)
11. Retourner ZKP_OK
```

---

## ÉTAPE 6 — VÉRIFIEUR (zkp_verify.c)

```c
// Vérifie une preuve NIZK
// Retourne ZKP_ACCEPT (1), ZKP_REJECT (0), ou ZKP_ERR (-1)
ZKPResult zkp_verify(const Graph *G, const NIZKProof *proof);
```

**Algorithme exact :**

```
1. Valider proof->version == ZKP_VERSION
2. Valider proof->n == G->n
3. Recalculer b = zkp_fiat_shamir_challenge(
       G, proof->gprime_adj, proof->commits, n, proof->session_nonce)
4. Si proof->challenge ≠ b → REJECT (preuve falsifiée)

5. Reconstruire G' depuis proof->gprime_adj

6. Si b == 0 (vérifier isomorphisme) :
     π = proof->iso_response.perm
     Vérifier π est une permutation valide de {0..n-1}
     Calculer G_check = zkp_graph_permute(G, π)
     Vérifier G_check.adj == G'.adj  // graphes identiques
     Pour chaque (i,j), i < j :
         bit = zkp_graph_has_edge(&G', i, j) ? 1 : 0
         Si !zkp_commit_verify(bit, proof->iso_response.nonces[i][j],
                               proof->commits[i][j]) → REJECT

7. Si b == 1 (vérifier cycle hamiltonien) :
     Reconstruire HamiltonianCycle H' depuis proof->ham_response.cycle_nodes
     Si !zkp_validate_hamiltonian_cycle(&G', &H') → REJECT
     Pour chaque arête i du cycle :
         u = H'.nodes[i], v = H'.nodes[(i+1)%n]
         u_norm = min(u,v), v_norm = max(u,v)
         Si !zkp_commit_verify(1, proof->ham_response.nonces[i],
                               proof->commits[u_norm][v_norm]) → REJECT

8. Retourner ACCEPT
```

---

## ÉTAPE 7 — TESTS (tests/)

Implémente les tests suivants avec un framework minimaliste (pas de dépendance externe) :

### test_graph.c
- `test_generate_graph_n20()` : génère graphe n=20, vérifie connexité + cycle valide
- `test_generate_graph_n50()` : idem n=50
- `test_permute_preserves_cycle()` : permuter G+H, cycle reste hamiltonien dans G'
- `test_has_edge_symmetry()` : (u,v) ∈ G ⟺ (v,u) ∈ G

### test_crypto.c
- `test_commit_deterministic()` : même (bit, nonce) → même hash
- `test_commit_binding()` : Commit(0,r) ≠ Commit(1,r)
- `test_commit_hiding()` : Commit(0,r1) ≠ Commit(0,r2) pour r1≠r2
- `test_commit_verify_valid()` : verify accepte commit correct
- `test_commit_verify_tampered()` : verify rejette commit modifié
- `test_fiat_shamir_deterministic()` : mêmes entrées → même challenge

### test_protocol.c
- `test_completeness_n20()` : prove + verify → ACCEPT, 100 répétitions
- `test_soundness_bad_cycle()` : preuve avec cycle invalide → REJECT
- `test_tamper_commit()` : modifier commits[0][1] → REJECT
- `test_tamper_challenge()` : modifier proof.challenge → REJECT
- `test_antireplay()` : deux preuves → session_nonces différents

### test_nizk.c
- `test_nizk_full_n50()` : prove + verify pour n=50, mesurer temps
- `test_nizk_challenge_distribution()` : 1000 preuves, vérifier ~50% challenge 0/1

---

## ÉTAPE 8 — OUTILS CLI (tools/)

### zkp_keygen.c
```
Usage: zkp_keygen -n <noeuds> [-r <ratio>] -o <fichier>
Génère (G, H) et sauvegarde en binaire.
G → <fichier>.graph
H → <fichier>.key  (confidentiel !)
```

### zkp_prover.c
```
Usage: zkp_prover -g <fichier>.graph -k <fichier>.key -o <preuve>.proof
Lit G et H, génère la preuve NIZK, sauvegarde.
```

### zkp_verifier.c
```
Usage: zkp_verifier -g <fichier>.graph -p <preuve>.proof
Lit G et la preuve, affiche ACCEPT ou REJECT.
Exit code : 0=ACCEPT, 1=REJECT, 2=ERREUR
```

---

## ÉTAPE 9 — CMAKE

```cmake
cmake_minimum_required(VERSION 3.16)
project(zkp_hamiltonian C)
set(CMAKE_C_STANDARD 99)
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Wextra -Werror")

# Trouver libsodium ou OpenSSL
find_package(PkgConfig REQUIRED)
pkg_check_modules(SODIUM libsodium)
if(NOT SODIUM_FOUND)
    find_package(OpenSSL REQUIRED)
    add_compile_definitions(USE_OPENSSL)
endif()

# Bibliothèque principale
add_library(zkp_hamiltonian STATIC
    src/zkp_graph.c
    src/zkp_crypto.c
    src/zkp_prove.c
    src/zkp_verify.c
    src/zkp_serialize.c
)
target_include_directories(zkp_hamiltonian PUBLIC include)
target_link_libraries(zkp_hamiltonian ${SODIUM_LIBRARIES})

# Tests
enable_testing()
foreach(TEST graph crypto protocol nizk)
    add_executable(test_${TEST} tests/test_${TEST}.c)
    target_link_libraries(test_${TEST} zkp_hamiltonian)
    add_test(NAME ${TEST} COMMAND test_${TEST})
endforeach()

# Outils CLI
foreach(TOOL keygen prover verifier)
    add_executable(zkp_${TOOL} tools/zkp_${TOOL}.c)
    target_link_libraries(zkp_${TOOL} zkp_hamiltonian)
endforeach()
```

---

## CONTRAINTES ABSOLUES

**Sécurité :**
1. Ne jamais utiliser `rand()`, `random()`, ou `time()` pour la cryptographie
2. Toutes les comparaisons de secrets en **temps constant** (pas de `memcmp` standard)
3. Effacer les secrets de la mémoire avec `sodium_memzero()` ou `explicit_bzero()` après usage
4. Valider **toutes** les entrées avant traitement (taille n, indices, version)

**Qualité :**
5. Chaque fichier .c compile sans warnings avec `-Wall -Wextra -Werror`
6. Aucune allocation dynamique dans le code critique (pile uniquement, struct statiques)
7. Chaque fonction retourne un code d'erreur vérifié
8. Commentaires sur toutes les fonctions publiques (format Doxygen)

**Embarqué :**
9. Pas de printf dans les bibliothèques (seulement dans tools/ et tests/)
10. Stack frame < 4Ko par fonction
11. Tester avec `-DOPENWRT_BUILD` qui active `-Os -ffunction-sections`

---

## ORDRE D'IMPLÉMENTATION

Respecte cet ordre et attends ma validation entre chaque étape :

```
[1] zkp_types.h                    → types de base
[2] zkp_crypto.h + zkp_crypto.c   → primitives, tester avec test_crypto.c
[3] zkp_graph.h + zkp_graph.c     → graphes, tester avec test_graph.c
[4] zkp_prove.c                    → prouveur
[5] zkp_verify.c                   → vérifieur, tester avec test_protocol.c
[6] zkp_serialize.c                → sérialisation
[7] test_nizk.c + benchmarks       → tests complets
[8] tools/ (keygen, prover, verifier)
[9] CMakeLists.txt + openwrt/Makefile
```

**Commence par l'étape [1] et [2] uniquement.**
Présente le code complet pour ces deux étapes, compilable immédiatement.
