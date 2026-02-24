/**
 * @file zkp_prove.c
 * @brief NIZK proof generation for ZKP Hamiltonian protocol
 * @version 1.0
 *
 * Implements the Prover side of the Blum Hamiltonian Cycle ZKP
 * with NIZK transformation via Fiat-Shamir heuristic.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include "zkp_hamiltonian.h"
#include "zkp_crypto.h"
#include "zkp_graph.h"
#include <string.h>

ZKPResult zkp_prove(const Graph *G, const HamiltonianCycle *H,
                    NIZKProof *out_proof)
{
    /*
     * NIZK Proof Generation Algorithm:
     *
     * 1. Validate parameters (G, H non-NULL, G->n == H->n)
     * 2. Initialize proof header (version, n, session_nonce)
     * 3. Generate random permutation π
     * 4. Compute G' = π(G), store in proof->gprime_adj
     * 5. Generate commitments for all edges in G'
     * 6. Compute Fiat-Shamir challenge from transcript
     * 7. Generate response based on challenge:
     *    - challenge=0: reveal π and all nonces (isomorphism proof)
     *    - challenge=1: reveal H' = π(H) and cycle edge nonces (Hamiltonian proof)
     * 8. Zero sensitive data from memory
     */

    if (G == NULL || H == NULL || out_proof == NULL) {
        return ZKP_ERR_PARAM;
    }

    if (G->n != H->n) {
        return ZKP_ERR_PARAM;
    }

    uint8_t n = G->n;
    if (n == 0 || n > ZKP_MAX_N) {
        return ZKP_ERR_PARAM;
    }

    /* Validate that H is actually a valid Hamiltonian cycle in G */
    if (!zkp_validate_hamiltonian_cycle(G, H)) {
        return ZKP_ERR_PARAM;
    }

    ZKPResult res;
    uint8_t perm[ZKP_MAX_N];
    uint8_t nonce_matrix[ZKP_MAX_N][ZKP_MAX_N][ZKP_NONCE_SIZE];
    Graph gprime;
    uint8_t i, j;

    /* Step 2: Initialize proof header */
    memset(out_proof, 0, sizeof(NIZKProof));
    out_proof->version = ZKP_VERSION;
    out_proof->n = n;

    /* Generate session nonce (anti-replay) */
    res = zkp_random_bytes(out_proof->session_nonce, ZKP_NONCE_SIZE);
    if (res != ZKP_OK) {
        goto cleanup;
    }

    /* Step 3: Generate random permutation π */
    res = zkp_random_permutation(perm, n);
    if (res != ZKP_OK) {
        goto cleanup;
    }

    /* Step 4: Compute G' = π(G) */
    zkp_graph_permute(G, perm, &gprime);

    /* Copy G'.adj to proof */
    for (i = 0; i < n; i++) {
        out_proof->gprime_adj[i] = gprime.adj[i];
    }

    /* Step 5: Generate commitments for all edges */
    /* For each pair (i,j) with i < j, generate nonce and commit */
    for (i = 0; i < n; i++) {
        for (j = (uint8_t)(i + 1); j < n; j++) {
            /* Generate random nonce */
            res = zkp_random_bytes(nonce_matrix[i][j], ZKP_NONCE_SIZE);
            if (res != ZKP_OK) {
                goto cleanup;
            }

            /* Compute bit = 1 if edge exists in G', 0 otherwise */
            uint8_t bit = zkp_graph_has_edge(&gprime, i, j) ? 1 : 0;

            /* Compute commitment */
            zkp_commit(bit, nonce_matrix[i][j], out_proof->commits[i][j]);

            /* Mirror to lower triangle (symmetric) */
            memcpy(out_proof->commits[j][i], out_proof->commits[i][j], ZKP_HASH_SIZE);
            memcpy(nonce_matrix[j][i], nonce_matrix[i][j], ZKP_NONCE_SIZE);
        }
    }

    /* Step 6: Compute Fiat-Shamir challenge */
    out_proof->challenge = zkp_fiat_shamir_challenge(
        G,
        out_proof->gprime_adj,
        out_proof->commits,
        n,
        out_proof->session_nonce
    );

    /* Step 7: Generate response based on challenge */
    if (out_proof->challenge == 0) {
        /*
         * Isomorphism proof: reveal π and all nonces
         * This proves G' is isomorphic to G via π
         */
        memcpy(out_proof->iso_response.perm, perm, n);

        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                memcpy(out_proof->iso_response.nonces[i][j],
                       nonce_matrix[i][j],
                       ZKP_NONCE_SIZE);
            }
        }
    } else {
        /*
         * Hamiltonian cycle proof: reveal H' = π(H) and cycle edge nonces
         * This proves G' contains a Hamiltonian cycle H'
         */
        HamiltonianCycle hprime;
        zkp_cycle_permute(H, perm, &hprime);

        /* Copy cycle nodes */
        memcpy(out_proof->ham_response.cycle_nodes, hprime.nodes, n);

        /* Copy nonces for cycle edges only */
        for (i = 0; i < n; i++) {
            uint8_t u = hprime.nodes[i];
            uint8_t v = hprime.nodes[(i + 1) % n];

            /* Normalize edge to upper triangle */
            uint8_t u_norm = (u < v) ? u : v;
            uint8_t v_norm = (u < v) ? v : u;

            memcpy(out_proof->ham_response.nonces[i],
                   nonce_matrix[u_norm][v_norm],
                   ZKP_NONCE_SIZE);
        }

        zkp_secure_zero(&hprime, sizeof(hprime));
    }

    res = ZKP_OK;

cleanup:
    /* Step 8: Zero sensitive data */
    zkp_secure_zero(perm, sizeof(perm));
    zkp_secure_zero(nonce_matrix, sizeof(nonce_matrix));
    zkp_secure_zero(&gprime, sizeof(gprime));

    return res;
}
