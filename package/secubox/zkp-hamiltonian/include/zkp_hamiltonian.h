/**
 * @file zkp_hamiltonian.h
 * @brief Main public API for ZKP Hamiltonian protocol
 * @version 1.0
 *
 * Zero-Knowledge Proof based on Hamiltonian Cycle (Blum 1986)
 * with NIZK transformation via Fiat-Shamir.
 *
 * Usage:
 *   1. Generate (G, H) with zkp_generate_graph()
 *   2. Prover creates proof with zkp_prove()
 *   3. Verifier checks with zkp_verify()
 *
 * Security properties:
 *   - Completeness: Honest prover always convinces verifier
 *   - Soundness: Cheater fails with probability >= 1 - 2^(-128)
 *   - Zero-Knowledge: Verifier learns nothing about H
 */

#ifndef ZKP_HAMILTONIAN_H
#define ZKP_HAMILTONIAN_H

#include "zkp_types.h"
#include "zkp_crypto.h"
#include "zkp_graph.h"

/* ============== Core Protocol ============== */

/**
 * @brief Generate NIZK proof (Prover)
 *
 * @param G         Public graph
 * @param H         Secret Hamiltonian cycle (trapdoor)
 * @param out_proof Output proof
 * @return ZKP_OK on success
 */
ZKPResult zkp_prove(const Graph *G, const HamiltonianCycle *H,
                    NIZKProof *out_proof);

/**
 * @brief Verify NIZK proof (Verifier)
 *
 * @param G     Public graph
 * @param proof Proof to verify
 * @return ZKP_ACCEPT (1) if valid, ZKP_REJECT (0) if invalid, ZKP_ERR on error
 */
ZKPResult zkp_verify(const Graph *G, const NIZKProof *proof);

/* ============== Serialization ============== */

/**
 * @brief Serialize proof to binary format
 *
 * @param proof  Proof to serialize
 * @param buf    Output buffer
 * @param len    In: buffer size, Out: bytes written
 * @return ZKP_OK on success
 */
ZKPResult zkp_proof_serialize(const NIZKProof *proof, uint8_t *buf, size_t *len);

/**
 * @brief Deserialize proof from binary format
 *
 * @param buf    Input buffer
 * @param len    Buffer length
 * @param proof  Output proof
 * @return ZKP_OK on success
 */
ZKPResult zkp_proof_deserialize(const uint8_t *buf, size_t len, NIZKProof *proof);

/**
 * @brief Serialize graph to binary format
 *
 * @param G    Graph to serialize
 * @param buf  Output buffer
 * @param len  In: buffer size, Out: bytes written
 * @return ZKP_OK on success
 */
ZKPResult zkp_graph_serialize(const Graph *G, uint8_t *buf, size_t *len);

/**
 * @brief Deserialize graph from binary format
 *
 * @param buf  Input buffer
 * @param len  Buffer length
 * @param G    Output graph
 * @return ZKP_OK on success
 */
ZKPResult zkp_graph_deserialize(const uint8_t *buf, size_t len, Graph *G);

/**
 * @brief Serialize Hamiltonian cycle to binary format
 *
 * @param H    Cycle to serialize
 * @param buf  Output buffer
 * @param len  In: buffer size, Out: bytes written
 * @return ZKP_OK on success
 */
ZKPResult zkp_cycle_serialize(const HamiltonianCycle *H, uint8_t *buf, size_t *len);

/**
 * @brief Deserialize Hamiltonian cycle from binary format
 *
 * @param buf  Input buffer
 * @param len  Buffer length
 * @param H    Output cycle
 * @return ZKP_OK on success
 */
ZKPResult zkp_cycle_deserialize(const uint8_t *buf, size_t len, HamiltonianCycle *H);

/* ============== Debug (tools/tests only) ============== */

/**
 * @brief Print proof summary (debug)
 *
 * @param proof  Proof to print
 */
void zkp_proof_print(const NIZKProof *proof);

#endif /* ZKP_HAMILTONIAN_H */
