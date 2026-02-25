/**
 * @file zkp_graph.c
 * @brief Graph operations for ZKP Hamiltonian protocol
 * @version 1.0
 *
 * Provides graph manipulation, cycle validation, and trapdoor generation.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include "zkp_graph.h"
#include "zkp_crypto.h"
#include <string.h>

/* ============== Basic Graph Operations ============== */

void zkp_graph_init(Graph *G, uint8_t n)
{
    if (G == NULL || n > ZKP_MAX_N) {
        return;
    }

    G->n = n;
    memset(G->adj, 0, sizeof(G->adj));
}

void zkp_graph_add_edge(Graph *G, uint8_t u, uint8_t v)
{
    if (G == NULL || u >= G->n || v >= G->n || u == v) {
        return;
    }

    /* Set bit v in adj[u] */
    G->adj[u] |= ((uint64_t)1 << v);
    /* Set bit u in adj[v] (undirected) */
    G->adj[v] |= ((uint64_t)1 << u);
}

bool zkp_graph_has_edge(const Graph *G, uint8_t u, uint8_t v)
{
    if (G == NULL || u >= G->n || v >= G->n) {
        return false;
    }

    return (G->adj[u] & ((uint64_t)1 << v)) != 0;
}

uint32_t zkp_graph_edge_count(const Graph *G)
{
    if (G == NULL) {
        return 0;
    }

    uint32_t count = 0;
    uint8_t i, j;

    /* Count edges in upper triangle only (undirected graph) */
    for (i = 0; i < G->n; i++) {
        for (j = (uint8_t)(i + 1); j < G->n; j++) {
            if (zkp_graph_has_edge(G, i, j)) {
                count++;
            }
        }
    }

    return count;
}

/* ============== Graph Validation ============== */

bool zkp_validate_hamiltonian_cycle(const Graph *G, const HamiltonianCycle *H)
{
    if (G == NULL || H == NULL) {
        return false;
    }

    /* Check cycle length matches graph size */
    if (H->n != G->n) {
        return false;
    }

    uint8_t n = H->n;
    if (n == 0 || n > ZKP_MAX_N) {
        return false;
    }

    /* Check all nodes are distinct using a visited bitmap */
    uint64_t visited_low = 0;  /* nodes 0-63 */
    uint64_t visited_high = 0; /* nodes 64-127 */
    uint8_t i;

    for (i = 0; i < n; i++) {
        uint8_t node = H->nodes[i];

        if (node >= n) {
            return false; /* Node out of range */
        }

        /* Check if already visited */
        if (node < 64) {
            if (visited_low & ((uint64_t)1 << node)) {
                return false; /* Duplicate node */
            }
            visited_low |= ((uint64_t)1 << node);
        } else {
            if (visited_high & ((uint64_t)1 << (node - 64))) {
                return false; /* Duplicate node */
            }
            visited_high |= ((uint64_t)1 << (node - 64));
        }
    }

    /* Check all cycle edges exist in G */
    for (i = 0; i < n; i++) {
        uint8_t u = H->nodes[i];
        uint8_t v = H->nodes[(i + 1) % n];

        if (!zkp_graph_has_edge(G, u, v)) {
            return false; /* Missing edge in graph */
        }
    }

    return true;
}

bool zkp_graph_is_connected(const Graph *G)
{
    if (G == NULL || G->n == 0) {
        return false;
    }

    if (G->n == 1) {
        return true;
    }

    /*
     * BFS to check connectivity.
     * Use a simple queue implemented with array.
     */
    uint8_t n = G->n;
    uint64_t visited_low = 0;  /* nodes 0-63 */
    uint64_t visited_high = 0; /* nodes 64-127 */
    uint8_t queue[ZKP_MAX_N];
    uint8_t head = 0, tail = 0;
    uint8_t visited_count = 0;

    /* Start BFS from node 0 */
    queue[tail++] = 0;
    visited_low |= 1;
    visited_count = 1;

    while (head < tail) {
        uint8_t current = queue[head++];
        uint8_t neighbor;

        /* Check all potential neighbors */
        for (neighbor = 0; neighbor < n; neighbor++) {
            if (neighbor == current) {
                continue;
            }

            if (!zkp_graph_has_edge(G, current, neighbor)) {
                continue;
            }

            /* Check if neighbor already visited */
            bool already_visited;
            if (neighbor < 64) {
                already_visited = (visited_low & ((uint64_t)1 << neighbor)) != 0;
            } else {
                already_visited = (visited_high & ((uint64_t)1 << (neighbor - 64))) != 0;
            }

            if (!already_visited) {
                /* Mark as visited and add to queue */
                if (neighbor < 64) {
                    visited_low |= ((uint64_t)1 << neighbor);
                } else {
                    visited_high |= ((uint64_t)1 << (neighbor - 64));
                }
                queue[tail++] = neighbor;
                visited_count++;
            }
        }
    }

    return (visited_count == n);
}

/* ============== Permutation Operations ============== */

void zkp_graph_permute(const Graph *G, const uint8_t perm[ZKP_MAX_N], Graph *out)
{
    if (G == NULL || perm == NULL || out == NULL) {
        return;
    }

    uint8_t n = G->n;

    /*
     * Apply permutation π to graph G:
     * If edge (u, v) exists in G, then edge (π(u), π(v)) exists in out.
     */
    zkp_graph_init(out, n);

    uint8_t u, v;
    for (u = 0; u < n; u++) {
        for (v = (uint8_t)(u + 1); v < n; v++) {
            if (zkp_graph_has_edge(G, u, v)) {
                zkp_graph_add_edge(out, perm[u], perm[v]);
            }
        }
    }
}

void zkp_cycle_permute(const HamiltonianCycle *H, const uint8_t perm[ZKP_MAX_N],
                       HamiltonianCycle *out)
{
    if (H == NULL || perm == NULL || out == NULL) {
        return;
    }

    /*
     * Apply permutation π to cycle H:
     * out->nodes[i] = π(H->nodes[i])
     */
    out->n = H->n;

    uint8_t i;
    for (i = 0; i < H->n; i++) {
        out->nodes[i] = perm[H->nodes[i]];
    }
}

/* ============== Trapdoor Generation ============== */

ZKPResult zkp_generate_graph(uint8_t n, double extra_ratio,
                              Graph *out_graph, HamiltonianCycle *out_cycle)
{
    if (out_graph == NULL || out_cycle == NULL) {
        return ZKP_ERR_PARAM;
    }

    if (n < 3 || n > ZKP_MAX_N) {
        return ZKP_ERR_PARAM;
    }

    if (extra_ratio < 0.0 || extra_ratio > 10.0) {
        return ZKP_ERR_PARAM;
    }

    /*
     * Algorithm:
     * 1. Generate random permutation π of {0..n-1}
     * 2. H.nodes = [π[0], π[1], ..., π[n-1]]
     * 3. Initialize G with edges of H
     * 4. Add nb_extra = (int)(n * extra_ratio) random edges as decoys
     * 5. Verify graph is connected (should always be true since H is connected)
     * 6. Verify H is valid Hamiltonian cycle in G
     */

    uint8_t perm[ZKP_MAX_N];
    ZKPResult res;
    int attempts = 0;
    const int max_attempts = 10; /* Should rarely need more than 1 */

retry:
    if (attempts++ >= max_attempts) {
        return ZKP_ERR;
    }

    /* Step 1: Generate random permutation */
    res = zkp_random_permutation(perm, n);
    if (res != ZKP_OK) {
        return res;
    }

    /* Step 2: Create Hamiltonian cycle from permutation */
    out_cycle->n = n;
    uint8_t i;
    for (i = 0; i < n; i++) {
        out_cycle->nodes[i] = perm[i];
    }

    /* Step 3: Initialize graph with cycle edges */
    zkp_graph_init(out_graph, n);
    for (i = 0; i < n; i++) {
        uint8_t u = out_cycle->nodes[i];
        uint8_t v = out_cycle->nodes[(i + 1) % n];
        zkp_graph_add_edge(out_graph, u, v);
    }

    /* Step 4: Add decoy edges */
    int nb_extra = (int)(n * extra_ratio);
    int max_tries = nb_extra * 10;
    uint8_t rand_buf[2];

    while (nb_extra > 0 && max_tries > 0) {
        max_tries--;

        /* Get random u, v */
        res = zkp_random_bytes(rand_buf, 2);
        if (res != ZKP_OK) {
            return res;
        }

        uint8_t u = rand_buf[0] % n;
        uint8_t v = rand_buf[1] % n;

        if (u == v) {
            continue; /* No self-loops */
        }

        if (!zkp_graph_has_edge(out_graph, u, v)) {
            zkp_graph_add_edge(out_graph, u, v);
            nb_extra--;
        }
    }

    /* Step 5: Verify connectivity (should always pass) */
    if (!zkp_graph_is_connected(out_graph)) {
        /* This shouldn't happen since the Hamiltonian cycle ensures connectivity */
        goto retry;
    }

    /* Step 6: Verify the cycle is valid (assertion) */
    if (!zkp_validate_hamiltonian_cycle(out_graph, out_cycle)) {
        /* This should never fail - indicates a bug */
        return ZKP_ERR;
    }

    /* Zero the permutation (sensitive data) */
    zkp_secure_zero(perm, sizeof(perm));

    return ZKP_OK;
}

/* ============== Debug Functions (tools/tests only) ============== */

#ifndef OPENWRT_BUILD

#include <stdio.h>

void zkp_graph_print(const Graph *G)
{
    if (G == NULL) {
        printf("Graph: NULL\n");
        return;
    }

    printf("Graph (n=%u, edges=%u):\n", G->n, zkp_graph_edge_count(G));

    uint8_t i, j;
    for (i = 0; i < G->n; i++) {
        printf("  %3u: ", i);
        for (j = 0; j < G->n; j++) {
            if (zkp_graph_has_edge(G, i, j)) {
                printf("%u ", j);
            }
        }
        printf("\n");
    }
}

void zkp_cycle_print(const HamiltonianCycle *H)
{
    if (H == NULL) {
        printf("Cycle: NULL\n");
        return;
    }

    printf("Hamiltonian Cycle (n=%u): ", H->n);
    uint8_t i;
    for (i = 0; i < H->n; i++) {
        printf("%u", H->nodes[i]);
        if (i < H->n - 1) {
            printf(" -> ");
        }
    }
    printf(" -> %u\n", H->nodes[0]); /* Back to start */
}

#else

/* Stub implementations for OpenWrt build */
void zkp_graph_print(const Graph *G)
{
    (void)G;
}

void zkp_cycle_print(const HamiltonianCycle *H)
{
    (void)H;
}

#endif
