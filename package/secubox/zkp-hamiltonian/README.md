# ZKP Hamiltonian

Zero-Knowledge Proof library based on the Hamiltonian Cycle problem (Blum 1986) with NIZK transformation via Fiat-Shamir heuristic.

**CyberMind.FR / SecuBox** — Version 0.1.0

## Overview

This library implements a Zero-Knowledge Proof (ZKP) protocol that allows a Prover to convince a Verifier that they know a Hamiltonian cycle in a graph, without revealing the cycle itself.

### Security Properties

- **Completeness**: An honest prover with knowledge of H always convinces the verifier
- **Soundness**: A cheater fails with probability ≥ 1 - 2^(-128)
- **Zero-Knowledge**: The verifier learns nothing about H

## Building

### Prerequisites

- CMake ≥ 3.16
- OpenSSL (for SHA3-256)
- C99 compiler

### Build Commands

```bash
mkdir build && cd build
cmake ..
make

# Run tests
ctest --output-on-failure

# Or run individual tests
./test_crypto
./test_graph
./test_protocol
./test_nizk
```

### OpenWrt Build

```bash
make package/zkp-hamiltonian/compile V=s
```

## Usage

### CLI Tools

#### Generate Key Pair

```bash
zkp_keygen -n 50 -r 1.0 -o identity
# Creates: identity.graph (public), identity.key (SECRET!)
```

#### Generate Proof

```bash
zkp_prover -g identity.graph -k identity.key -o auth.proof
```

#### Verify Proof

```bash
zkp_verifier -g identity.graph -p auth.proof
# Exit code: 0=ACCEPT, 1=REJECT, 2=ERROR
```

### C API

```c
#include "zkp_hamiltonian.h"

// Generate key pair
Graph G;
HamiltonianCycle H;
zkp_generate_graph(50, 1.0, &G, &H);

// Prover: generate proof
NIZKProof proof;
zkp_prove(&G, &H, &proof);

// Verifier: verify proof
ZKPResult result = zkp_verify(&G, &proof);
if (result == ZKP_ACCEPT) {
    // Authenticated!
}
```

## Protocol Overview

1. **Setup**: Prover generates (G, H) where H is a Hamiltonian cycle in G
2. **Proof Generation**:
   - Generate random permutation π
   - Compute G' = π(G)
   - Commit to each edge in G' using SHA3-256
   - Compute challenge via Fiat-Shamir: c = H(G, G', commits)
   - If c=0: reveal π and all nonces (isomorphism proof)
   - If c=1: reveal π(H) and cycle edge nonces (Hamiltonian proof)
3. **Verification**:
   - Recompute Fiat-Shamir challenge
   - Verify response matches commitments

## Files

```
zkp-hamiltonian/
├── include/
│   ├── zkp_types.h       # Type definitions
│   ├── zkp_crypto.h      # Cryptographic primitives
│   ├── zkp_graph.h       # Graph operations
│   └── zkp_hamiltonian.h # Main API
├── src/
│   ├── zkp_crypto.c      # SHA3-256, commitments, RNG
│   ├── zkp_graph.c       # Graph manipulation
│   ├── zkp_prove.c       # NIZK proof generation
│   ├── zkp_verify.c      # NIZK proof verification
│   └── zkp_serialize.c   # Binary serialization
├── tests/
│   ├── test_crypto.c     # Crypto primitive tests
│   ├── test_graph.c      # Graph operation tests
│   ├── test_protocol.c   # Protocol completeness/soundness
│   └── test_nizk.c       # Full NIZK tests + benchmarks
├── tools/
│   ├── zkp_keygen.c      # Key generation CLI
│   ├── zkp_prover.c      # Proof generation CLI
│   └── zkp_verifier.c    # Proof verification CLI
├── CMakeLists.txt
└── README.md
```

## Configuration

### Build Options (CMake)

| Option | Default | Description |
|--------|---------|-------------|
| `OPENWRT_BUILD` | OFF | Enable OpenWrt optimizations |
| `BUILD_TESTS` | ON | Build test executables |
| `BUILD_TOOLS` | ON | Build CLI tools |
| `BUILD_SHARED_LIBS` | OFF | Build shared library |
| `ZKP_MAX_N` | 128 | Maximum graph nodes |

### Recommended Parameters

| Parameter | Recommended | Description |
|-----------|-------------|-------------|
| n (nodes) | 50-80 | Graph size |
| extra_ratio | 0.5-1.5 | Decoy edge ratio |

## SecuBox Integration

See `SECUBOX_INTEGRATION.md` for details on:
- Integration with `secubox-auth`
- Network protocol (ZKP_HELLO, ZKP_PROOF, etc.)
- UCI configuration
- LuCI dashboard

## License

GPL-2.0-or-later

Copyright (C) 2026 CyberMind.FR / SecuBox
