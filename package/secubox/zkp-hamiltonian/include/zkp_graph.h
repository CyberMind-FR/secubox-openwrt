/**
 * @file zkp_graph.h
 * @brief Graph operations for ZKP Hamiltonian protocol
 * @version 1.0
 *
 * Provides graph manipulation, cycle validation, and trapdoor generation.
 */

#ifndef ZKP_GRAPH_H
#define ZKP_GRAPH_H

#include "zkp_types.h"

/**
 * @brief Initialize an empty graph
 *
 * @param G  Graph to initialize
 * @param n  Number of nodes
 */
void zkp_graph_init(Graph *G, uint8_t n);

/**
 * @brief Add undirected edge (u, v) to graph
 *
 * @param G  Graph to modify
 * @param u  First node
 * @param v  Second node
 */
void zkp_graph_add_edge(Graph *G, uint8_t u, uint8_t v);

/**
 * @brief Check if edge (u, v) exists in graph
 *
 * @param G  Graph to query
 * @param u  First node
 * @param v  Second node
 * @return true if edge exists
 */
bool zkp_graph_has_edge(const Graph *G, uint8_t u, uint8_t v);

/**
 * @brief Validate that H is a valid Hamiltonian cycle in G
 *
 * Checks:
 * - H has exactly n nodes
 * - All nodes are distinct
 * - All cycle edges exist in G
 *
 * @param G  Graph
 * @param H  Cycle to validate
 * @return true if H is a valid Hamiltonian cycle in G
 */
bool zkp_validate_hamiltonian_cycle(const Graph *G, const HamiltonianCycle *H);

/**
 * @brief Check if graph is connected (BFS)
 *
 * @param G  Graph to check
 * @return true if graph is connected
 */
bool zkp_graph_is_connected(const Graph *G);

/**
 * @brief Apply permutation to graph: out = π(G)
 *
 * @param G     Input graph
 * @param perm  Permutation array
 * @param out   Output permuted graph
 */
void zkp_graph_permute(const Graph *G, const uint8_t perm[ZKP_MAX_N], Graph *out);

/**
 * @brief Apply permutation to cycle: out = π(H)
 *
 * @param H     Input cycle
 * @param perm  Permutation array
 * @param out   Output permuted cycle
 */
void zkp_cycle_permute(const HamiltonianCycle *H, const uint8_t perm[ZKP_MAX_N],
                       HamiltonianCycle *out);

/**
 * @brief Generate graph with embedded Hamiltonian cycle (trapdoor)
 *
 * Creates a graph G containing a hidden Hamiltonian cycle H.
 * Additional edges are added as decoys.
 *
 * @param n           Number of nodes (recommended: 50-80)
 * @param extra_ratio Ratio of extra edges to n (recommended: 0.5-1.5)
 * @param out_graph   Output graph
 * @param out_cycle   Output Hamiltonian cycle (trapdoor)
 * @return ZKP_OK on success
 */
ZKPResult zkp_generate_graph(uint8_t n, double extra_ratio,
                             Graph *out_graph, HamiltonianCycle *out_cycle);

/**
 * @brief Count edges in graph
 *
 * @param G  Graph
 * @return Number of edges
 */
uint32_t zkp_graph_edge_count(const Graph *G);

/**
 * @brief Print graph (debug, only in tools/tests)
 *
 * @param G  Graph to print
 */
void zkp_graph_print(const Graph *G);

/**
 * @brief Print cycle (debug, only in tools/tests)
 *
 * @param H  Cycle to print
 */
void zkp_cycle_print(const HamiltonianCycle *H);

#endif /* ZKP_GRAPH_H */
