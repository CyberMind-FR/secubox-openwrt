/**
 * @file zkp_crypto.h
 * @brief Cryptographic primitives for ZKP Hamiltonian protocol
 * @version 1.0
 *
 * Provides SHA3-256 commitments, Fiat-Shamir hashing, and secure RNG.
 */

#ifndef ZKP_CRYPTO_H
#define ZKP_CRYPTO_H

#include "zkp_types.h"

/**
 * @brief Compute commitment: Commit(bit, nonce) = SHA3-256(bit_byte || nonce)
 *
 * @param bit    The bit to commit (0 or 1)
 * @param nonce  Random nonce (ZKP_NONCE_SIZE bytes)
 * @param out    Output hash (ZKP_HASH_SIZE bytes)
 */
void zkp_commit(uint8_t bit, const uint8_t nonce[ZKP_NONCE_SIZE],
                uint8_t out[ZKP_HASH_SIZE]);

/**
 * @brief Verify a commitment in constant time
 *
 * @param bit      Expected bit value
 * @param nonce    Nonce used in commitment
 * @param expected Expected commitment hash
 * @return true if commitment matches, false otherwise
 */
bool zkp_commit_verify(uint8_t bit, const uint8_t nonce[ZKP_NONCE_SIZE],
                       const uint8_t expected[ZKP_HASH_SIZE]);

/**
 * @brief Compute Fiat-Shamir challenge from transcript
 *
 * H_FS(G, G', commits, session_nonce) → 1 bit (LSB of SHA3-256)
 *
 * @param G             Original graph
 * @param gprime_adj    Permuted graph adjacency
 * @param commits       All commitments
 * @param n             Number of nodes
 * @param session_nonce Session nonce for anti-replay
 * @return Challenge bit (0 or 1)
 */
uint8_t zkp_fiat_shamir_challenge(
    const Graph *G,
    const uint64_t gprime_adj[ZKP_MAX_N],
    const uint8_t commits[ZKP_MAX_N][ZKP_MAX_N][ZKP_HASH_SIZE],
    uint8_t n,
    const uint8_t session_nonce[ZKP_NONCE_SIZE]
);

/**
 * @brief Fill buffer with cryptographically secure random bytes
 *
 * Uses getrandom() if available, falls back to /dev/urandom.
 *
 * @param buf  Output buffer
 * @param len  Number of bytes to generate
 * @return ZKP_OK on success, ZKP_ERR_RNG on failure
 */
ZKPResult zkp_random_bytes(uint8_t *buf, size_t len);

/**
 * @brief Generate uniform random permutation via Fisher-Yates
 *
 * @param perm  Output permutation array
 * @param n     Size of permutation
 * @return ZKP_OK on success, ZKP_ERR_RNG on failure
 */
ZKPResult zkp_random_permutation(uint8_t perm[ZKP_MAX_N], uint8_t n);

/**
 * @brief Constant-time memory comparison
 *
 * @param a    First buffer
 * @param b    Second buffer
 * @param len  Length to compare
 * @return true if equal, false otherwise
 */
bool zkp_const_time_memcmp(const uint8_t *a, const uint8_t *b, size_t len);

/**
 * @brief Securely zero memory
 *
 * @param buf  Buffer to zero
 * @param len  Length to zero
 */
void zkp_secure_zero(void *buf, size_t len);

#endif /* ZKP_CRYPTO_H */
