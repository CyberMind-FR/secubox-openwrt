# LuCI ZKP Hamiltonian Dashboard

Web interface for Zero-Knowledge Proof cryptography based on the Hamiltonian Cycle problem (Blum 1986).

## Features

- **Key Generation** - Create graph + Hamiltonian cycle pairs
- **Proof Creation** - Generate NIZK proofs using Fiat-Shamir heuristic
- **Verification** - Validate proofs with ACCEPT/REJECT result
- **Key Management** - List, view, and delete saved keys

## Screenshot

```
┌─────────────────────────────────────────────────────┐
│  ZKP Hamiltonian Cryptography          [v1.0.0]    │
├─────────────────────────────────────────────────────┤
│  Saved Keys: 3    Max Nodes: 50    Hash: SHA3-256  │
├─────────────────────────────────────────────────────┤
│  🔑 Generate New Key                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Name     │ │ Nodes    │ │ Density  │ [Generate] │
│  │ my_key   │ │ 20       │ │ 0.8      │            │
│  └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────┤
│  🗂️ Saved Keys                                      │
│  ┌─────────┬───────┬────────┬─────────┬──────────┐ │
│  │ Name    │ Nodes │ Graph  │ Created │ Actions  │ │
│  ├─────────┼───────┼────────┼─────────┼──────────┤ │
│  │ test_1  │ 20    │ 1.2 KB │ 10:15   │ P  V  X  │ │
│  │ demo    │ 30    │ 2.1 KB │ 09:30   │ P  V  X  │ │
│  └─────────┴───────┴────────┴─────────┴──────────┘ │
└─────────────────────────────────────────────────────┘
```

## Menu Location

`Status > ZKP Cryptography`

## Dependencies

- `zkp-hamiltonian` - CLI tools (zkp_keygen, zkp_prover, zkp_verifier)
- OpenSSL (for SHA3-256)

## RPCD Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `status` | - | Library version, key count, paths |
| `keygen` | nodes, density, name | Generate graph + cycle |
| `prove` | name | Create NIZK proof |
| `verify` | name | Verify proof → ACCEPT/REJECT |
| `list_keys` | - | List all saved keys |
| `delete_key` | name | Delete key and files |
| `get_graph` | name | Get graph metadata |

## Usage

### Generate a Key

1. Enter a name for the key (e.g., `my_secret`)
2. Select node count (4-50, default 20)
3. Choose edge density (0.5-1.0, default 0.8)
4. Click **Generate**

### Create and Verify Proof

1. Click **Prove** on a saved key
2. Wait for proof generation
3. Click **Verify** to validate
4. Result shows **✅ ACCEPT** or **❌ REJECT**

## File Storage

```
/var/lib/zkp/
├── graphs/     # Binary graph files (.graph)
├── keys/       # Hamiltonian cycle files (.key)
└── proofs/     # Generated proofs (.proof)
```

## Protocol

The ZKP protocol proves knowledge of a Hamiltonian cycle in a graph without revealing the cycle:

1. **Prover** has graph G and secret Hamiltonian cycle H
2. **Prover** creates random permutation π, computes G' = π(G)
3. **Prover** commits to G' edges using SHA3-256
4. **Challenge** derived via Fiat-Shamir (hash of G, G', commits)
5. **Response** reveals either:
   - Challenge=0: Permutation π (proves G ≅ G')
   - Challenge=1: Cycle in G' (proves H exists)
6. **Verifier** checks commitments and response

Security: ~2^-128 soundness error with SHA3-256.

## Building

```bash
# In OpenWrt buildroot
make package/luci-app-zkp/compile V=s

# Install
opkg install luci-app-zkp_*.ipk
```

## Quick Deploy (Development)

```bash
# Deploy to router
scp htdocs/luci-static/resources/view/zkp/overview.js root@192.168.255.1:/www/luci-static/resources/view/zkp/
scp root/usr/libexec/rpcd/luci.zkp root@192.168.255.1:/usr/libexec/rpcd/
ssh root@192.168.255.1 'killall rpcd; /etc/init.d/rpcd start'
```

## License

GPL-2.0-or-later

## Author

SecuBox / CyberMind.FR
