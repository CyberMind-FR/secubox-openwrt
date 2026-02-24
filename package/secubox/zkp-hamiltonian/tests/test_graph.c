/**
 * @file test_graph.c
 * @brief Tests for graph operations
 * @version 1.0
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include <stdio.h>
#include <string.h>
#include "zkp_types.h"
#include "zkp_graph.h"
#include "zkp_crypto.h"

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

static int test_graph_init(void)
{
    TEST("Graph init: creates empty graph");

    Graph G;
    zkp_graph_init(&G, 10);

    ASSERT(G.n == 10, "Wrong n");
    ASSERT(zkp_graph_edge_count(&G) == 0, "Not empty");

    PASS();
    return 0;
}

static int test_graph_add_edge(void)
{
    TEST("Graph add edge: adds undirected edge");

    Graph G;
    zkp_graph_init(&G, 10);

    zkp_graph_add_edge(&G, 2, 5);

    ASSERT(zkp_graph_has_edge(&G, 2, 5) == true, "Edge not found (2,5)");
    ASSERT(zkp_graph_has_edge(&G, 5, 2) == true, "Edge not found (5,2)");
    ASSERT(zkp_graph_edge_count(&G) == 1, "Wrong edge count");

    PASS();
    return 0;
}

static int test_graph_has_edge_symmetry(void)
{
    TEST("Graph has edge: symmetric for undirected");

    Graph G;
    zkp_graph_init(&G, 20);

    for (uint8_t i = 0; i < 10; i++) {
        zkp_graph_add_edge(&G, i, (uint8_t)(i + 5));
    }

    for (uint8_t i = 0; i < 10; i++) {
        uint8_t u = i;
        uint8_t v = (uint8_t)(i + 5);
        ASSERT(zkp_graph_has_edge(&G, u, v) == zkp_graph_has_edge(&G, v, u),
               "Not symmetric");
    }

    PASS();
    return 0;
}

static int test_generate_graph_n20(void)
{
    TEST("Generate graph n=20: creates valid graph with cycle");

    Graph G;
    HamiltonianCycle H;

    ZKPResult res = zkp_generate_graph(20, 1.0, &G, &H);
    ASSERT(res == ZKP_OK, "Generation failed");

    ASSERT(G.n == 20, "Wrong graph size");
    ASSERT(H.n == 20, "Wrong cycle size");
    ASSERT(zkp_graph_is_connected(&G) == true, "Not connected");
    ASSERT(zkp_validate_hamiltonian_cycle(&G, &H) == true, "Invalid cycle");

    /* Should have at least 20 edges (the cycle) */
    ASSERT(zkp_graph_edge_count(&G) >= 20, "Too few edges");

    PASS();
    return 0;
}

static int test_generate_graph_n50(void)
{
    TEST("Generate graph n=50: creates valid graph with cycle");

    Graph G;
    HamiltonianCycle H;

    ZKPResult res = zkp_generate_graph(50, 0.8, &G, &H);
    ASSERT(res == ZKP_OK, "Generation failed");

    ASSERT(G.n == 50, "Wrong graph size");
    ASSERT(H.n == 50, "Wrong cycle size");
    ASSERT(zkp_graph_is_connected(&G) == true, "Not connected");
    ASSERT(zkp_validate_hamiltonian_cycle(&G, &H) == true, "Invalid cycle");

    PASS();
    return 0;
}

static int test_graph_is_connected(void)
{
    TEST("Graph is connected: detects connectivity");

    Graph G;
    zkp_graph_init(&G, 5);

    /* Initially disconnected (no edges) */
    ASSERT(zkp_graph_is_connected(&G) == false, "Empty graph connected");

    /* Add edges to make connected: 0-1-2-3-4 */
    zkp_graph_add_edge(&G, 0, 1);
    zkp_graph_add_edge(&G, 1, 2);
    zkp_graph_add_edge(&G, 2, 3);
    zkp_graph_add_edge(&G, 3, 4);

    ASSERT(zkp_graph_is_connected(&G) == true, "Path graph not connected");

    PASS();
    return 0;
}

static int test_validate_hamiltonian_cycle_valid(void)
{
    TEST("Validate cycle: accepts valid cycle");

    Graph G;
    HamiltonianCycle H;

    /* Create a simple cycle graph: 0-1-2-3-4-0 */
    zkp_graph_init(&G, 5);
    zkp_graph_add_edge(&G, 0, 1);
    zkp_graph_add_edge(&G, 1, 2);
    zkp_graph_add_edge(&G, 2, 3);
    zkp_graph_add_edge(&G, 3, 4);
    zkp_graph_add_edge(&G, 4, 0);

    H.n = 5;
    H.nodes[0] = 0;
    H.nodes[1] = 1;
    H.nodes[2] = 2;
    H.nodes[3] = 3;
    H.nodes[4] = 4;

    ASSERT(zkp_validate_hamiltonian_cycle(&G, &H) == true, "Valid cycle rejected");

    PASS();
    return 0;
}

static int test_validate_hamiltonian_cycle_invalid(void)
{
    TEST("Validate cycle: rejects invalid cycle");

    Graph G;
    HamiltonianCycle H;

    /* Create path (not cycle): 0-1-2-3-4 */
    zkp_graph_init(&G, 5);
    zkp_graph_add_edge(&G, 0, 1);
    zkp_graph_add_edge(&G, 1, 2);
    zkp_graph_add_edge(&G, 2, 3);
    zkp_graph_add_edge(&G, 3, 4);
    /* Missing edge 4-0 */

    H.n = 5;
    H.nodes[0] = 0;
    H.nodes[1] = 1;
    H.nodes[2] = 2;
    H.nodes[3] = 3;
    H.nodes[4] = 4;

    ASSERT(zkp_validate_hamiltonian_cycle(&G, &H) == false, "Invalid cycle accepted");

    PASS();
    return 0;
}

static int test_validate_hamiltonian_cycle_duplicate(void)
{
    TEST("Validate cycle: rejects duplicate nodes");

    Graph G;
    HamiltonianCycle H;

    zkp_graph_init(&G, 5);
    /* Complete graph - all edges exist */
    for (uint8_t i = 0; i < 5; i++) {
        for (uint8_t j = (uint8_t)(i + 1); j < 5; j++) {
            zkp_graph_add_edge(&G, i, j);
        }
    }

    /* Cycle with duplicate node */
    H.n = 5;
    H.nodes[0] = 0;
    H.nodes[1] = 1;
    H.nodes[2] = 2;
    H.nodes[3] = 1;  /* Duplicate! */
    H.nodes[4] = 4;

    ASSERT(zkp_validate_hamiltonian_cycle(&G, &H) == false, "Duplicate accepted");

    PASS();
    return 0;
}

static int test_permute_preserves_structure(void)
{
    TEST("Graph permute: preserves edge structure");

    Graph G, Gprime;
    uint8_t perm[ZKP_MAX_N] = {0};
    uint8_t n = 10;

    /* Create test graph */
    zkp_graph_init(&G, n);
    zkp_graph_add_edge(&G, 0, 1);
    zkp_graph_add_edge(&G, 1, 2);
    zkp_graph_add_edge(&G, 2, 3);
    zkp_graph_add_edge(&G, 3, 0);

    uint32_t orig_edges = zkp_graph_edge_count(&G);

    /* Generate random permutation */
    ASSERT(zkp_random_permutation(perm, n) == ZKP_OK, "Permutation failed");

    /* Apply permutation */
    zkp_graph_permute(&G, perm, &Gprime);

    /* Should have same number of edges */
    ASSERT(zkp_graph_edge_count(&Gprime) == orig_edges, "Edge count changed");

    /* Verify edge mapping: if (u,v) in G, then (perm[u], perm[v]) in G' */
    for (uint8_t u = 0; u < n; u++) {
        for (uint8_t v = (uint8_t)(u + 1); v < n; v++) {
            bool orig = zkp_graph_has_edge(&G, u, v);
            bool perm_edge = zkp_graph_has_edge(&Gprime, perm[u], perm[v]);
            ASSERT(orig == perm_edge, "Edge mapping wrong");
        }
    }

    PASS();
    return 0;
}

static int test_permute_preserves_cycle(void)
{
    TEST("Permute preserves cycle: π(H) valid in π(G)");

    Graph G, Gprime;
    HamiltonianCycle H, Hprime;
    uint8_t perm[ZKP_MAX_N];
    uint8_t n = 20;

    /* Generate graph with cycle */
    ASSERT(zkp_generate_graph(n, 0.5, &G, &H) == ZKP_OK, "Gen failed");

    /* Generate permutation */
    ASSERT(zkp_random_permutation(perm, n) == ZKP_OK, "Perm failed");

    /* Apply permutation to both */
    zkp_graph_permute(&G, perm, &Gprime);
    zkp_cycle_permute(&H, perm, &Hprime);

    /* Permuted cycle should be valid in permuted graph */
    ASSERT(zkp_validate_hamiltonian_cycle(&Gprime, &Hprime) == true,
           "Permuted cycle invalid");

    PASS();
    return 0;
}

/* ============== Main ============== */

int main(void)
{
    printf("\n=== ZKP Graph Tests ===\n\n");

    int result = 0;

    result |= test_graph_init();
    result |= test_graph_add_edge();
    result |= test_graph_has_edge_symmetry();
    result |= test_generate_graph_n20();
    result |= test_generate_graph_n50();
    result |= test_graph_is_connected();
    result |= test_validate_hamiltonian_cycle_valid();
    result |= test_validate_hamiltonian_cycle_invalid();
    result |= test_validate_hamiltonian_cycle_duplicate();
    result |= test_permute_preserves_structure();
    result |= test_permute_preserves_cycle();

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
