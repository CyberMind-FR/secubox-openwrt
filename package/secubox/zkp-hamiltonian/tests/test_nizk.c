/**
 * @file test_nizk.c
 * @brief Full NIZK protocol tests and benchmarks
 * @version 1.0
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include <stdio.h>
#include <string.h>
#include <time.h>
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

static int test_nizk_full_n50(void)
{
    TEST("NIZK full n=50: prove + verify");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    clock_t start, end;
    double gen_time, prove_time, verify_time;

    /* Generate */
    start = clock();
    ASSERT(zkp_generate_graph(50, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");
    end = clock();
    gen_time = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;

    /* Prove */
    start = clock();
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");
    end = clock();
    prove_time = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;

    /* Verify */
    start = clock();
    ZKPResult res = zkp_verify(&G, &proof);
    end = clock();
    verify_time = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;

    ASSERT(res == ZKP_ACCEPT, "Verify rejected");

    printf("\n        Times: gen=%.1fms prove=%.1fms verify=%.1fms\n        ",
           gen_time, prove_time, verify_time);

    PASS();
    return 0;
}

static int test_nizk_full_n80(void)
{
    TEST("NIZK full n=80: prove + verify");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    clock_t start, end;
    double gen_time, prove_time, verify_time;

    /* Generate */
    start = clock();
    ASSERT(zkp_generate_graph(80, 0.8, &G, &H) == ZKP_OK, "Graph gen failed");
    end = clock();
    gen_time = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;

    /* Prove */
    start = clock();
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");
    end = clock();
    prove_time = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;

    /* Verify */
    start = clock();
    ZKPResult res = zkp_verify(&G, &proof);
    end = clock();
    verify_time = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;

    ASSERT(res == ZKP_ACCEPT, "Verify rejected");

    printf("\n        Times: gen=%.1fms prove=%.1fms verify=%.1fms\n        ",
           gen_time, prove_time, verify_time);

    PASS();
    return 0;
}

static int test_nizk_challenge_distribution(void)
{
    TEST("Challenge distribution: ~50% 0/1 over 1000 proofs");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");

    int challenge_0 = 0;
    int challenge_1 = 0;
    const int iterations = 1000;

    for (int i = 0; i < iterations; i++) {
        ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");

        if (proof.challenge == 0) {
            challenge_0++;
        } else {
            challenge_1++;
        }

        /* Also verify each proof */
        ASSERT(zkp_verify(&G, &proof) == ZKP_ACCEPT, "Verify failed");
    }

    double ratio_0 = (double)challenge_0 / iterations;
    double ratio_1 = (double)challenge_1 / iterations;

    printf("\n        Distribution: c=0: %.1f%% c=1: %.1f%%\n        ",
           ratio_0 * 100, ratio_1 * 100);

    /* Allow 40-60% range (statistically should be close to 50%) */
    ASSERT(ratio_0 >= 0.35 && ratio_0 <= 0.65, "Distribution too skewed");

    PASS();
    return 0;
}

static int test_nizk_serialization_roundtrip(void)
{
    TEST("Serialization: proof roundtrip");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof, proof2;
    uint8_t buf[1024 * 1024]; /* 1MB buffer */
    size_t len;

    ASSERT(zkp_generate_graph(30, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");
    ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");

    /* Serialize */
    len = sizeof(buf);
    ASSERT(zkp_proof_serialize(&proof, buf, &len) == ZKP_OK, "Serialize failed");

    printf("\n        Proof size: %zu bytes\n        ", len);

    /* Deserialize */
    ASSERT(zkp_proof_deserialize(buf, len, &proof2) == ZKP_OK, "Deserialize failed");

    /* Verify the deserialized proof */
    ASSERT(zkp_verify(&G, &proof2) == ZKP_ACCEPT, "Deserialized proof rejected");

    /* Check key fields match */
    ASSERT(proof.version == proof2.version, "Version mismatch");
    ASSERT(proof.n == proof2.n, "N mismatch");
    ASSERT(proof.challenge == proof2.challenge, "Challenge mismatch");
    ASSERT(memcmp(proof.session_nonce, proof2.session_nonce, ZKP_NONCE_SIZE) == 0,
           "Nonce mismatch");

    PASS();
    return 0;
}

static int test_nizk_graph_serialization(void)
{
    TEST("Serialization: graph roundtrip");

    Graph G, G2;
    HamiltonianCycle H;
    uint8_t buf[8192];
    size_t len;

    ASSERT(zkp_generate_graph(50, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");

    /* Serialize */
    len = sizeof(buf);
    ASSERT(zkp_graph_serialize(&G, buf, &len) == ZKP_OK, "Serialize failed");

    printf("\n        Graph size: %zu bytes\n        ", len);

    /* Deserialize */
    ASSERT(zkp_graph_deserialize(buf, len, &G2) == ZKP_OK, "Deserialize failed");

    /* Compare graphs */
    ASSERT(G.n == G2.n, "N mismatch");
    for (uint8_t i = 0; i < G.n; i++) {
        ASSERT(G.adj[i] == G2.adj[i], "Adjacency mismatch");
    }

    PASS();
    return 0;
}

static int test_nizk_cycle_serialization(void)
{
    TEST("Serialization: cycle roundtrip");

    Graph G;
    HamiltonianCycle H, H2;
    uint8_t buf[256];
    size_t len;

    ASSERT(zkp_generate_graph(30, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");

    /* Serialize */
    len = sizeof(buf);
    ASSERT(zkp_cycle_serialize(&H, buf, &len) == ZKP_OK, "Serialize failed");

    printf("\n        Cycle size: %zu bytes\n        ", len);

    /* Deserialize */
    ASSERT(zkp_cycle_deserialize(buf, len, &H2) == ZKP_OK, "Deserialize failed");

    /* Compare cycles */
    ASSERT(H.n == H2.n, "N mismatch");
    ASSERT(memcmp(H.nodes, H2.nodes, H.n) == 0, "Nodes mismatch");

    /* Deserialized cycle should still be valid */
    ASSERT(zkp_validate_hamiltonian_cycle(&G, &H2) == true, "Invalid after deser");

    PASS();
    return 0;
}

static int test_nizk_benchmark_n20(void)
{
    TEST("Benchmark n=20: 100 prove+verify cycles");

    Graph G;
    HamiltonianCycle H;
    NIZKProof proof;

    ASSERT(zkp_generate_graph(20, 1.0, &G, &H) == ZKP_OK, "Graph gen failed");

    clock_t start = clock();
    const int iterations = 100;

    for (int i = 0; i < iterations; i++) {
        ASSERT(zkp_prove(&G, &H, &proof) == ZKP_OK, "Prove failed");
        ASSERT(zkp_verify(&G, &proof) == ZKP_ACCEPT, "Verify failed");
    }

    clock_t end = clock();
    double total_ms = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;
    double per_cycle = total_ms / iterations;

    printf("\n        Total: %.1fms (%.2fms/cycle)\n        ",
           total_ms, per_cycle);

    PASS();
    return 0;
}

/* ============== Main ============== */

int main(void)
{
    printf("\n=== ZKP NIZK Full Tests ===\n\n");

    int result = 0;

    result |= test_nizk_full_n50();
    result |= test_nizk_full_n80();
    result |= test_nizk_challenge_distribution();
    result |= test_nizk_serialization_roundtrip();
    result |= test_nizk_graph_serialization();
    result |= test_nizk_cycle_serialization();
    result |= test_nizk_benchmark_n20();

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
