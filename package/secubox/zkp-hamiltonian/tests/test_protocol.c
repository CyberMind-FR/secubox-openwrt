/**
 * @file test_protocol.c
 * @brief Tests for ZKP protocol (prove/verify)
 * @version 1.0
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include <stdio.h>
#include <string.h>
#include "zkp_hamiltonian.h"
#include "zkp_crypto.h"
#include "zkp_graph.h"

/* ============== Test Framework ============== */

static int tests_run = 0;
static int tests_passed = 0;

#define TEST(name) \
    do { \
        tests_run++; \
        printf("  [%02d] %-50s ", tests_run, name); \
        fflush(stdout); \
    } while(0)

#define PASS() \
    do { \
        tests_passed++; \
        printf("\033[32mPASS\033[0m\n"); \
    } while(0)

#define FAIL(msg) \
    do { \
        printf("\033[31mFAIL\033[0m (%s)\n", msg); \
        return 1; \
    } while(0)

#define ASSERT(cond, msg) \
    do { \
        if (!(cond)) { FAIL(msg); } \
    } while(0)

/* ============== Tests ============== */

static int test_completeness_single(void)
{
    TEST("Completeness: prove + verify → ACCEPT");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    /* Generate graph with cycle */
    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");

    /* Generate proof */
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");

    /* Verify proof */
    ZKPResult res = zkp_verify(&G, &proof);
    ASSERT(res == ZKP_ACCEPT, "Verify rejected valid proof");

    PASS();
    return 0;
}

static int test_completeness_n20_100x(void)
{
    TEST("Completeness n=20: 100 repetitions");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 0.8, &G, &H) == ZKP_OK, "Graph gen failed");

    for (int i = 0; i < 100; i++) {
        ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");
        ASSERT(zkp_verify(&G, &proof) == ZKP_ACCEPT, "Verify rejected");
    }

    PASS();
    return 0;
}

static int test_soundness_bad_cycle(void)
{
    TEST("Soundness: invalid cycle → cannot prove");

    Graph G;
    HamiltonianCycle H;

    /* Create graph without Hamiltonian cycle */
    zkp_graph_init(&G, 10);
    zkp_graph_add_edge(&G, 0, 1);
    zkp_graph_add_edge(&G, 1, 2);
    zkp_graph_add_edge(&G, 2, 3);
    /* Disconnected: nodes 4-9 have no edges */

    /* Create fake cycle */
    H.n = 10;
    for (uint8_t i = 0; i < 10; i++) {
        H.nodes[i] = i;
    }

    /* Prove should fail (cycle not valid in graph) */
    NIZKProof proof;
    ZKPResult res = zkp_prove(&G, &H, &proof);
    ASSERT(res == ZKP_ERR_PARAM, "Prove accepted invalid cycle");

    PASS();
    return 0;
}

static int test_tamper_commit(void)
{
    TEST("Tamper detection: modified commit → REJECT");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");

    /* Tamper with a commitment */
    proof.commits[0][1][0] ^= 0xFF;

    /* Verify should reject */
    ZKPResult res = zkp_verify(&G, &proof);
    ASSERT(res == ZKP_REJECT, "Verify accepted tampered commits");

    PASS();
    return 0;
}

static int test_tamper_challenge(void)
{
    TEST("Tamper detection: modified challenge → REJECT");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");

    /* Flip the challenge bit */
    proof.challenge ^= 1;

    /* Verify should reject (challenge doesn't match Fiat-Shamir) */
    ZKPResult res = zkp_verify(&G, &proof);
    ASSERT(res == ZKP_REJECT, "Verify accepted wrong challenge");

    PASS();
    return 0;
}

static int test_tamper_gprime(void)
{
    TEST("Tamper detection: modified G' → REJECT");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");

    /*
     * Tamper with G' adjacency across multiple entries.
     * This ensures the Fiat-Shamir hash changes significantly,
     * causing challenge mismatch and verification failure.
     */
    for (uint8_t i = 0; i < proof.n; i++) {
        proof.gprime_adj[i] ^= 0xFFFFFFFFFFFFFFFFULL;
    }

    /* Verify should reject */
    ZKPResult res = zkp_verify(&G, &proof);
    ASSERT(res == ZKP_REJECT, "Verify accepted tampered G'");

    PASS();
    return 0;
}

static int test_tamper_nonce(void)
{
    TEST("Tamper detection: modified nonce → REJECT");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");

    /* Tamper with a nonce in the response */
    if (proof.challenge == 0) {
        proof.iso_response.nonces[0][1][0] ^= 0xFF;
    } else {
        proof.ham_response.nonces[0][0] ^= 0xFF;
    }

    /* Verify should reject */
    ZKPResult res = zkp_verify(&G, &proof);
    ASSERT(res == ZKP_REJECT, "Verify accepted tampered nonce");

    PASS();
    return 0;
}

static int test_antireplay_different_nonces(void)
{
    TEST("Anti-replay: different session_nonces per proof");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof1, proof2;

    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");
    ASSERT(zkp_prove(&G, &H, &proof1) == ZKP_OK, "Prove 1 failed");
    ASSERT(zkp_prove(&G, &H, &proof2) == ZKP_OK, "Prove 2 failed");

    /* Session nonces should be different */
    ASSERT(memcmp(proof1.session_nonce, proof2.session_nonce, ZKP_NONCE_SIZE) != 0,
           "Session nonces identical");

    /* Both should verify */
    ASSERT(zkp_verify(&G, &proof1) == ZKP_ACCEPT, "Proof 1 rejected");
    ASSERT(zkp_verify(&G, &proof2) == ZKP_ACCEPT, "Proof 2 rejected");

    PASS();
    return 0;
}

static int test_wrong_graph(void)
{
    TEST("Wrong graph: proof for G1 rejected on G2");

    Graph G1, G2;
    HamiltonianCycle H1, H2;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 1.0, &G1, &H1) == ZKP_OK, "G1 gen failed");
    ASSERT(zkp_generate_graph(20, 1.0, &G2, &H2) == ZKP_OK, "G2 gen failed");

    /* Generate proof for G1 */
    ASSERT(zkp_prove(&G1, &H1, &proof) == ZKP_OK, "Prove failed");

    /* Should accept on G1 */
    ASSERT(zkp_verify(&G1, &proof) == ZKP_ACCEPT, "Rejected on correct graph");

    /* Should reject on G2 */
    ZKPResult res = zkp_verify(&G2, &proof);
    ASSERT(res == ZKP_REJECT, "Accepted on wrong graph");

    PASS();
    return 0;
}

static int test_version_mismatch(void)
{
    TEST("Version mismatch: wrong version → REJECT");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");

    /* Change version */
    proof.version = 0xFF;

    ZKPResult res = zkp_verify(&G, &proof);
    ASSERT(res == ZKP_REJECT, "Accepted wrong version");

    PASS();
    return 0;
}

static int test_size_mismatch(void)
{
    TEST("Size mismatch: wrong n → REJECT");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");

    /* Change n in proof */
    proof.n = 30;

    ZKPResult res = zkp_verify(&G, &proof);
    ASSERT(res == ZKP_REJECT, "Accepted wrong n");

    PASS();
    return 0;
}

/* ============== Main ============== */

int main(void)
{
    printf("\n=== ZKP Protocol Tests ===\n\n");

    int result = 0;

    result |= test_completeness_single();
    result |= test_completeness_n20_100x();
    result |= test_soundness_bad_cycle();
    result |= test_tamper_commit();
    result |= test_tamper_challenge();
    result |= test_tamper_gprime();
    result |= test_tamper_nonce();
    result |= test_antireplay_different_nonces();
    result |= test_wrong_graph();
    result |= test_version_mismatch();
    result |= test_size_mismatch();

    printf("\n");
    printf("Tests: %d/%d passed\n", tests_passed, tests_run);

    if (tests_passed == tests_run) {
        printf("\033[32m✓ All tests passed!\033[0m\n\n");
        return 0;
    } else {
        printf("\033[31m✗ Some tests failed\033[0m\n\n");
        return 1;
    }
}
