/**
 * @file zkp_types.h
 * @brief Type definitions for ZKP Hamiltonian protocol
 * @version 1.0
 *
 * Zero-Knowledge Proof based on Hamiltonian Cycle (Blum 1986)
 * NIZK transformation via Fiat-Shamir
 */

#ifndef ZKP_TYPES_H
#define ZKP_TYPES_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

/* Protocol constants */
#define ZKP_MAX_N        128
#define ZKP_NONCE_SIZE   32
#define ZKP_HASH_SIZE    32
#define ZKP_VERSION      0x01
#define ZKP_PROTOCOL_ID  "ZKP-HAM-v1"

/**
 * @brief Graph representation using adjacency bitfield
 *
 * adj[i] contains a bitfield where bit j is set if edge (i,j) exists.
 * Graph is undirected: adj[i] & (1ULL << j) iff adj[j] & (1ULL << i)
 */
typedef struct {
    uint8_t  n;              /**< Number of nodes (vertices) */
    uint64_t adj[ZKP_MAX_N]; /**< Adjacency bitfield for each node */
} Graph;

/**
 * @brief Hamiltonian cycle representation
 *
 * nodes[0..n-1] contains the sequence of nodes in the cycle.
 * Edges are: (nodes[i], nodes[(i+1) % n]) for i in [0, n-1]
 */
typedef struct {
    uint8_t  n;              /**< Cycle length (equals number of nodes) */
    uint8_t  nodes[ZKP_MAX_N]; /**< Node sequence in cycle order */
} HamiltonianCycle;

/**
 * @brief NIZK proof structure
 *
 * Contains all data needed to verify the proof without interaction.
 * The challenge is deterministically computed via Fiat-Shamir transform.
 */
typedef struct {
    uint8_t  version;                                    /**< Protocol version (ZKP_VERSION) */
    uint8_t  n;                                          /**< Number of nodes */
    uint8_t  session_nonce[ZKP_NONCE_SIZE];             /**< Anti-replay nonce */
    uint64_t gprime_adj[ZKP_MAX_N];                     /**< G' = π(G) adjacency */
    uint8_t  commits[ZKP_MAX_N][ZKP_MAX_N][ZKP_HASH_SIZE]; /**< Edge commitments */
    uint8_t  challenge;                                  /**< Fiat-Shamir challenge (0 or 1) */

    union {
        /** Response for challenge = 0 (isomorphism proof) */
        struct {
            uint8_t perm[ZKP_MAX_N];                     /**< Permutation π */
            uint8_t nonces[ZKP_MAX_N][ZKP_MAX_N][ZKP_NONCE_SIZE]; /**< All nonces */
        } iso_response;

        /** Response for challenge = 1 (Hamiltonian cycle proof) */
        struct {
            uint8_t cycle_nodes[ZKP_MAX_N];             /**< H' = π(H) cycle nodes */
            uint8_t nonces[ZKP_MAX_N][ZKP_NONCE_SIZE];  /**< Nonces for cycle edges */
        } ham_response;
    };
} NIZKProof;

/**
 * @brief Result codes for ZKP operations
 */
typedef enum {
    ZKP_OK       =  0,   /**< Operation successful */
    ZKP_REJECT   =  0,   /**< Proof rejected (alias for verify) */
    ZKP_ACCEPT   =  1,   /**< Proof accepted */
    ZKP_ERR      = -1,   /**< Generic error */
    ZKP_ERR_MEM  = -2,   /**< Memory allocation error */
    ZKP_ERR_RNG  = -3,   /**< Random number generation error */
    ZKP_ERR_PARAM= -4,   /**< Invalid parameter */
} ZKPResult;

#endif /* ZKP_TYPES_H */
