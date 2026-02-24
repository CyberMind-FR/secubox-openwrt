/**
 * @file zkp_verify.c
 * @brief NIZK proof verification for ZKP Hamiltonian protocol
 * @version 1.0
 *
 * Implements the Verifier side of the Blum Hamiltonian Cycle ZKP
 * with NIZK transformation via Fiat-Shamir heuristic.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include "zkp_hamiltonian.h"
#include "zkp_crypto.h"
#include "zkp_graph.h"
#include <string.h>

/**
 * @brief Verify that perm is a valid permutation of {0..n-1}
 */
static bool is_valid_permutation(const uint8_t *perm, uint8_t n)
{
    if (perm == NULL || n == 0 || n > ZKP_MAX_N) {
        return false;
    }

    /* Use bitmap to track seen values */
    uint64_t seen_low = 0;  /* 0-63 */
    uint64_t seen_high = 0; /* 64-127 */
    uint8_t i;

    for (i = 0; i < n; i++) {
        uint8_t val = perm[i];

        if (val >= n) {
            return false; /* Value out of range */
        }

        if (val < 64) {
            if (seen_low & ((uint64_t)1 << val)) {
                return false; /* Duplicate value */
            }
            seen_low |= ((uint64_t)1 << val);
        } else {
            if (seen_high & ((uint64_t)1 << (val - 64))) {
                return false; /* Duplicate value */
            }
            seen_high |= ((uint64_t)1 << (val - 64));
        }
    }

    return true;
}

/**
 * @brief Compare two graphs for equality
 */
static bool graphs_equal(const Graph *a, const Graph *b)
{
    if (a == NULL || b == NULL) {
        return false;
    }

    if (a->n != b->n) {
        return false;
    }

    uint8_t i;
    for (i = 0; i < a->n; i++) {
        if (a->adj[i] != b->adj[i]) {
            return false;
        }
    }

    return true;
}

ZKPResult zkp_verify(const Graph *G, const NIZKProof *proof)
{
    /*
     * NIZK Proof Verification Algorithm:
     *
     * 1. Validate proof->version == ZKP_VERSION
     * 2. Validate proof->n == G->n
     * 3. Recalculate Fiat-Shamir challenge from transcript
     * 4. Verify challenge matches
     * 5. Reconstruct G' from proof->gprime_adj
     * 6. If challenge == 0 (isomorphism):
     *    a. Verify π is valid permutation
     *    b. Verify π(G) == G'
     *    c. Verify all commitments with provided nonces
     * 7. If challenge == 1 (Hamiltonian):
     *    a. Reconstruct H' from proof
     *    b. Verify H' is valid Hamiltonian cycle in G'
     *    c. Verify commitments for cycle edges
     */

    if (G == NULL || proof == NULL) {
        return ZKP_ERR;
    }

    /* Step 1: Validate version */
    if (proof->version != ZKP_VERSION) {
        return ZKP_REJECT;
    }

    /* Step 2: Validate n */
    uint8_t n = proof->n;
    if (n != G->n || n == 0 || n > ZKP_MAX_N) {
        return ZKP_REJECT;
    }

    /* Step 3: Recalculate Fiat-Shamir challenge */
    uint8_t computed_challenge = zkp_fiat_shamir_challenge(
        G,
        proof->gprime_adj,
        proof->commits,
        n,
        proof->session_nonce
    );

    /* Step 4: Verify challenge matches */
    if (proof->challenge != computed_challenge) {
        return ZKP_REJECT;
    }

    /* Step 5: Reconstruct G' from proof */
    Graph gprime;
    gprime.n = n;
    uint8_t i;
    for (i = 0; i < n; i++) {
        gprime.adj[i] = proof->gprime_adj[i];
    }
    for (i = n; i < ZKP_MAX_N; i++) {
        gprime.adj[i] = 0;
    }

    /* Step 6-7: Verify based on challenge type */
    if (proof->challenge == 0) {
        /*
         * Isomorphism verification:
         * Verify that G' = π(G) and all commitments are valid
         */
        const uint8_t *perm = proof->iso_response.perm;

        /* 6a: Verify π is a valid permutation */
        if (!is_valid_permutation(perm, n)) {
            return ZKP_REJECT;
        }

        /* 6b: Compute G_check = π(G) and verify G_check == G' */
        Graph g_check;
        zkp_graph_permute(G, perm, &g_check);

        if (!graphs_equal(&g_check, &gprime)) {
            return ZKP_REJECT;
        }

        /* 6c: Verify all commitments */
        uint8_t j;
        for (i = 0; i < n; i++) {
            for (j = (uint8_t)(i + 1); j < n; j++) {
                uint8_t bit = zkp_graph_has_edge(&gprime, i, j) ? 1 : 0;

                if (!zkp_commit_verify(bit,
                                        proof->iso_response.nonces[i][j],
                                        proof->commits[i][j])) {
                    return ZKP_REJECT;
                }
            }
        }

    } else {
        /*
         * Hamiltonian cycle verification:
         * Verify that H' is a valid Hamiltonian cycle in G'
         * and the cycle edge commitments are valid
         */

        /* 7a: Reconstruct H' */
        HamiltonianCycle hprime;
        hprime.n = n;
        memcpy(hprime.nodes, proof->ham_response.cycle_nodes, n);

        /* 7b: Verify H' is valid Hamiltonian cycle in G' */
        if (!zkp_validate_hamiltonian_cycle(&gprime, &hprime)) {
            return ZKP_REJECT;
        }

        /* 7c: Verify commitments for cycle edges */
        for (i = 0; i < n; i++) {
            uint8_t u = hprime.nodes[i];
            uint8_t v = hprime.nodes[(i + 1) % n];

            /* Normalize to upper triangle */
            uint8_t u_norm = (u < v) ? u : v;
            uint8_t v_norm = (u < v) ? v : u;

            /* Cycle edges should all be present (bit = 1) */
            if (!zkp_commit_verify(1,
                                    proof->ham_response.nonces[i],
                                    proof->commits[u_norm][v_norm])) {
                return ZKP_REJECT;
            }
        }
    }

    /* All checks passed */
    return ZKP_ACCEPT;
}
