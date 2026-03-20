# ZKP Hamiltonian

:globe_with_meridians: **Langues:** [English](README.md) | Français | [中文](README.zh.md)

Bibliothèque de preuve à divulgation nulle de connaissance (ZKP) basée sur le problème du cycle hamiltonien (Blum 1986) avec transformation NIZK via l'heuristique de Fiat-Shamir.

**CyberMind.FR / SecuBox** — Version 0.1.0

## Aperçu

Cette bibliothèque implémente un protocole de preuve à divulgation nulle de connaissance (ZKP) qui permet à un Prouveur de convaincre un Vérificateur qu'il connaît un cycle hamiltonien dans un graphe, sans révéler le cycle lui-même.

### Propriétés de sécurité

- **Complétude** : Un prouveur honnête avec connaissance de H convainc toujours le vérificateur
- **Solidité** : Un tricheur échoue avec une probabilité >= 1 - 2^(-128)
- **Divulgation nulle** : Le vérificateur n'apprend rien sur H

## Compilation

### Prérequis

- CMake >= 3.16
- OpenSSL (pour SHA3-256)
- Compilateur C99

### Commandes de compilation

```bash
mkdir build && cd build
cmake ..
make

# Exécuter les tests
ctest --output-on-failure

# Ou exécuter les tests individuellement
./test_crypto
./test_graph
./test_protocol
./test_nizk
```

### Compilation OpenWrt

```bash
make package/zkp-hamiltonian/compile V=s
```

## Utilisation

### Outils CLI

#### Générer une paire de clés

```bash
zkp_keygen -n 50 -r 1.0 -o identity
# Crée : identity.graph (public), identity.key (SECRET !)
```

#### Générer une preuve

```bash
zkp_prover -g identity.graph -k identity.key -o auth.proof
```

#### Vérifier une preuve

```bash
zkp_verifier -g identity.graph -p auth.proof
# Code de sortie : 0=ACCEPTÉ, 1=REJETÉ, 2=ERREUR
```

### API C

```c
#include "zkp_hamiltonian.h"

// Générer une paire de clés
Graph G;
HamiltonianCycle H;
zkp_generate_graph(50, 1.0, &G, &H);

// Prouveur : générer une preuve
NIZKProof proof;
zkp_prove(&G, &H, &proof);

// Vérificateur : vérifier la preuve
ZKPResult result = zkp_verify(&G, &proof);
if (result == ZKP_ACCEPT) {
    // Authentifié !
}
```

## Aperçu du protocole

1. **Configuration** : Le prouveur génère (G, H) où H est un cycle hamiltonien dans G
2. **Génération de preuve** :
   - Générer une permutation aléatoire pi
   - Calculer G' = pi(G)
   - S'engager sur chaque arête de G' en utilisant SHA3-256
   - Calculer le défi via Fiat-Shamir : c = H(G, G', engagements)
   - Si c=0 : révéler pi et tous les nonces (preuve d'isomorphisme)
   - Si c=1 : révéler pi(H) et les nonces des arêtes du cycle (preuve hamiltonienne)
3. **Vérification** :
   - Recalculer le défi Fiat-Shamir
   - Vérifier que la réponse correspond aux engagements

## Fichiers

```
zkp-hamiltonian/
├── include/
│   ├── zkp_types.h       # Définitions de types
│   ├── zkp_crypto.h      # Primitives cryptographiques
│   ├── zkp_graph.h       # Opérations sur les graphes
│   └── zkp_hamiltonian.h # API principale
├── src/
│   ├── zkp_crypto.c      # SHA3-256, engagements, RNG
│   ├── zkp_graph.c       # Manipulation de graphes
│   ├── zkp_prove.c       # Génération de preuve NIZK
│   ├── zkp_verify.c      # Vérification de preuve NIZK
│   └── zkp_serialize.c   # Sérialisation binaire
├── tests/
│   ├── test_crypto.c     # Tests des primitives crypto
│   ├── test_graph.c      # Tests des opérations sur graphes
│   ├── test_protocol.c   # Complétude/solidité du protocole
│   └── test_nizk.c       # Tests NIZK complets + benchmarks
├── tools/
│   ├── zkp_keygen.c      # CLI de génération de clés
│   ├── zkp_prover.c      # CLI de génération de preuves
│   └── zkp_verifier.c    # CLI de vérification de preuves
├── CMakeLists.txt
└── README.md
```

## Configuration

### Options de compilation (CMake)

| Option | Défaut | Description |
|--------|--------|-------------|
| `OPENWRT_BUILD` | OFF | Activer les optimisations OpenWrt |
| `BUILD_TESTS` | ON | Compiler les exécutables de test |
| `BUILD_TOOLS` | ON | Compiler les outils CLI |
| `BUILD_SHARED_LIBS` | OFF | Compiler en bibliothèque partagée |
| `ZKP_MAX_N` | 128 | Nombre maximum de noeuds du graphe |

### Paramètres recommandés

| Paramètre | Recommandé | Description |
|-----------|------------|-------------|
| n (noeuds) | 50-80 | Taille du graphe |
| extra_ratio | 0.5-1.5 | Ratio d'arêtes de camouflage |

## Intégration SecuBox

Voir `SECUBOX_INTEGRATION.md` pour les détails sur :
- Intégration avec `secubox-auth`
- Protocole réseau (ZKP_HELLO, ZKP_PROOF, etc.)
- Configuration UCI
- Tableau de bord LuCI

## Licence

GPL-2.0-or-later

Copyright (C) 2026 CyberMind.FR / SecuBox
