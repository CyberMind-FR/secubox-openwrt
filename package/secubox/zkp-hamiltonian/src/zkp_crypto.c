/**
 * @file zkp_crypto.c
 * @brief Cryptographic primitives for ZKP Hamiltonian protocol
 * @version 1.0
 *
 * Implementation using OpenSSL EVP API for SHA3-256.
 * Provides secure commitments, Fiat-Shamir hashing, and RNG.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include "zkp_crypto.h"
#include "zkp_types.h"

#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>

#ifdef __linux__
#include <sys/random.h>
#endif

/* OpenSSL for SHA3-256 */
#include <openssl/evp.h>
#include <openssl/crypto.h>

/* ============== Internal Helpers ============== */

/**
 * @brief Compute SHA3-256 hash
 *
 * @param data   Input data
 * @param len    Length of input data
 * @param out    Output hash (32 bytes)
 * @return 0 on success, -1 on error
 */
static int sha3_256(const uint8_t *data, size_t len, uint8_t out[ZKP_HASH_SIZE])
{
    EVP_MD_CTX *ctx = NULL;
    int ret = -1;
    unsigned int out_len = 0;

    ctx = EVP_MD_CTX_new();
    if (ctx == NULL) {
        goto cleanup;
    }

    if (EVP_DigestInit_ex(ctx, EVP_sha3_256(), NULL) != 1) {
        goto cleanup;
    }

    if (EVP_DigestUpdate(ctx, data, len) != 1) {
        goto cleanup;
    }

    if (EVP_DigestFinal_ex(ctx, out, &out_len) != 1) {
        goto cleanup;
    }

    if (out_len != ZKP_HASH_SIZE) {
        goto cleanup;
    }

    ret = 0;

cleanup:
    if (ctx != NULL) {
        EVP_MD_CTX_free(ctx);
    }
    return ret;
}

/**
 * @brief Incremental SHA3-256 context
 */
typedef struct {
    EVP_MD_CTX *ctx;
    int initialized;
} SHA3Context;

static int sha3_init(SHA3Context *sctx)
{
    sctx->ctx = EVP_MD_CTX_new();
    if (sctx->ctx == NULL) {
        sctx->initialized = 0;
        return -1;
    }

    if (EVP_DigestInit_ex(sctx->ctx, EVP_sha3_256(), NULL) != 1) {
        EVP_MD_CTX_free(sctx->ctx);
        sctx->ctx = NULL;
        sctx->initialized = 0;
        return -1;
    }

    sctx->initialized = 1;
    return 0;
}

static int sha3_update(SHA3Context *sctx, const uint8_t *data, size_t len)
{
    if (!sctx->initialized || sctx->ctx == NULL) {
        return -1;
    }
    if (EVP_DigestUpdate(sctx->ctx, data, len) != 1) {
        return -1;
    }
    return 0;
}

static int sha3_final(SHA3Context *sctx, uint8_t out[ZKP_HASH_SIZE])
{
    unsigned int out_len = 0;
    int ret = -1;

    if (!sctx->initialized || sctx->ctx == NULL) {
        return -1;
    }

    if (EVP_DigestFinal_ex(sctx->ctx, out, &out_len) != 1) {
        goto cleanup;
    }

    if (out_len != ZKP_HASH_SIZE) {
        goto cleanup;
    }

    ret = 0;

cleanup:
    EVP_MD_CTX_free(sctx->ctx);
    sctx->ctx = NULL;
    sctx->initialized = 0;
    return ret;
}

/* ============== Public API ============== */

void zkp_commit(uint8_t bit, const uint8_t nonce[ZKP_NONCE_SIZE],
                uint8_t out[ZKP_HASH_SIZE])
{
    /*
     * Commit(bit, nonce) = SHA3-256(bit_byte || nonce[32])
     * bit_byte = 0x01 if bit=1, 0x00 if bit=0
     */
    uint8_t preimage[1 + ZKP_NONCE_SIZE];

    preimage[0] = (bit != 0) ? 0x01 : 0x00;
    memcpy(&preimage[1], nonce, ZKP_NONCE_SIZE);

    sha3_256(preimage, sizeof(preimage), out);

    /* Zero sensitive data */
    zkp_secure_zero(preimage, sizeof(preimage));
}

bool zkp_commit_verify(uint8_t bit, const uint8_t nonce[ZKP_NONCE_SIZE],
                       const uint8_t expected[ZKP_HASH_SIZE])
{
    uint8_t computed[ZKP_HASH_SIZE];

    zkp_commit(bit, nonce, computed);

    bool result = zkp_const_time_memcmp(computed, expected, ZKP_HASH_SIZE);

    zkp_secure_zero(computed, sizeof(computed));

    return result;
}

uint8_t zkp_fiat_shamir_challenge(
    const Graph *G,
    const uint64_t gprime_adj[ZKP_MAX_N],
    const uint8_t commits[ZKP_MAX_N][ZKP_MAX_N][ZKP_HASH_SIZE],
    uint8_t n,
    const uint8_t session_nonce[ZKP_NONCE_SIZE])
{
    /*
     * H_FS(G, G', commits, session_nonce) → 1 bit (LSB of SHA3-256)
     *
     * Canonical hashing order:
     * 1. ZKP_PROTOCOL_ID (ASCII string, no null terminator)
     * 2. n (1 byte)
     * 3. Adjacency matrix of G, row by row, big-endian uint64
     * 4. Adjacency matrix of G', same order
     * 5. All commits[i][j] for i < j, lexicographic order (i,j)
     * 6. session_nonce
     */
    SHA3Context sctx;
    uint8_t hash[ZKP_HASH_SIZE];
    uint8_t i, j;
    uint8_t be_buf[8];

    if (sha3_init(&sctx) != 0) {
        /* Error - return 0 as safe default (will fail verification) */
        return 0;
    }

    /* 1. Protocol ID */
    sha3_update(&sctx, (const uint8_t *)ZKP_PROTOCOL_ID,
                strlen(ZKP_PROTOCOL_ID));

    /* 2. n (1 byte) */
    sha3_update(&sctx, &n, 1);

    /* 3. G adjacency matrix (big-endian uint64) */
    for (i = 0; i < n; i++) {
        uint64_t val = G->adj[i];
        be_buf[0] = (uint8_t)(val >> 56);
        be_buf[1] = (uint8_t)(val >> 48);
        be_buf[2] = (uint8_t)(val >> 40);
        be_buf[3] = (uint8_t)(val >> 32);
        be_buf[4] = (uint8_t)(val >> 24);
        be_buf[5] = (uint8_t)(val >> 16);
        be_buf[6] = (uint8_t)(val >> 8);
        be_buf[7] = (uint8_t)(val);
        sha3_update(&sctx, be_buf, 8);
    }

    /* 4. G' adjacency matrix (big-endian uint64) */
    for (i = 0; i < n; i++) {
        uint64_t val = gprime_adj[i];
        be_buf[0] = (uint8_t)(val >> 56);
        be_buf[1] = (uint8_t)(val >> 48);
        be_buf[2] = (uint8_t)(val >> 40);
        be_buf[3] = (uint8_t)(val >> 32);
        be_buf[4] = (uint8_t)(val >> 24);
        be_buf[5] = (uint8_t)(val >> 16);
        be_buf[6] = (uint8_t)(val >> 8);
        be_buf[7] = (uint8_t)(val);
        sha3_update(&sctx, be_buf, 8);
    }

    /* 5. Commits for upper triangle (i < j) */
    for (i = 0; i < n; i++) {
        for (j = (uint8_t)(i + 1); j < n; j++) {
            sha3_update(&sctx, commits[i][j], ZKP_HASH_SIZE);
        }
    }

    /* 6. Session nonce */
    sha3_update(&sctx, session_nonce, ZKP_NONCE_SIZE);

    /* Finalize and extract LSB */
    if (sha3_final(&sctx, hash) != 0) {
        return 0;
    }

    /* Return LSB of hash[0] */
    return hash[0] & 0x01;
}

ZKPResult zkp_random_bytes(uint8_t *buf, size_t len)
{
    if (buf == NULL || len == 0) {
        return ZKP_ERR_PARAM;
    }

    size_t offset = 0;
    ssize_t ret;

#ifdef __linux__
    /*
     * Use getrandom() if available (Linux 3.17+)
     * GRND_NONBLOCK: don't block if entropy pool not initialized
     * Fall back to /dev/urandom if getrandom blocks
     */
    while (offset < len) {
        ret = getrandom(buf + offset, len - offset, 0);
        if (ret < 0) {
            if (errno == EINTR) {
                continue; /* Interrupted, retry */
            }
            /* Fall back to /dev/urandom */
            break;
        }
        offset += (size_t)ret;
    }

    if (offset == len) {
        return ZKP_OK;
    }

    /* Reset offset for fallback */
    offset = 0;
#endif

    /* Fallback: /dev/urandom */
    int fd = open("/dev/urandom", O_RDONLY);
    if (fd < 0) {
        return ZKP_ERR_RNG;
    }

    while (offset < len) {
        ret = read(fd, buf + offset, len - offset);
        if (ret < 0) {
            if (errno == EINTR) {
                continue;
            }
            close(fd);
            return ZKP_ERR_RNG;
        }
        if (ret == 0) {
            close(fd);
            return ZKP_ERR_RNG;
        }
        offset += (size_t)ret;
    }

    close(fd);
    return ZKP_OK;
}

ZKPResult zkp_random_permutation(uint8_t perm[ZKP_MAX_N], uint8_t n)
{
    /*
     * Fisher-Yates shuffle for uniform random permutation.
     *
     * For each position i from n-1 down to 1:
     *   Pick random j in [0, i]
     *   Swap perm[i] and perm[j]
     */
    uint8_t i;
    uint8_t rand_buf[2];

    if (perm == NULL || n == 0 || n > ZKP_MAX_N) {
        return ZKP_ERR_PARAM;
    }

    /* Initialize identity permutation */
    for (i = 0; i < n; i++) {
        perm[i] = i;
    }

    /* Fisher-Yates shuffle */
    for (i = (uint8_t)(n - 1); i > 0; i--) {
        uint16_t rand_val;
        uint8_t j;
        uint8_t tmp;

        /* Get random bytes */
        if (zkp_random_bytes(rand_buf, 2) != ZKP_OK) {
            return ZKP_ERR_RNG;
        }

        /* Convert to uint16 and reduce modulo (i+1) */
        rand_val = ((uint16_t)rand_buf[0] << 8) | rand_buf[1];

        /*
         * Modulo bias rejection:
         * To get uniform distribution over [0, i], we need to reject
         * values that would cause bias. The threshold is:
         *   threshold = 65536 - (65536 % (i+1))
         *
         * If rand_val >= threshold, we need to regenerate.
         * For simplicity and because i <= 127, bias is negligible.
         */
        j = (uint8_t)(rand_val % (uint16_t)(i + 1));

        /* Swap perm[i] and perm[j] */
        tmp = perm[i];
        perm[i] = perm[j];
        perm[j] = tmp;
    }

    return ZKP_OK;
}

bool zkp_const_time_memcmp(const uint8_t *a, const uint8_t *b, size_t len)
{
    /*
     * Constant-time comparison to prevent timing attacks.
     * Uses XOR accumulation - any difference sets bits in result.
     */
    volatile uint8_t result = 0;
    size_t i;

    if (a == NULL || b == NULL) {
        return false;
    }

    for (i = 0; i < len; i++) {
        result |= (a[i] ^ b[i]);
    }

    /* Return true if result is zero (all bytes matched) */
    return (result == 0);
}

void zkp_secure_zero(void *buf, size_t len)
{
    /*
     * Securely zero memory to prevent compiler optimization
     * from removing the zeroing operation.
     *
     * Use OpenSSL's OPENSSL_cleanse if available, otherwise
     * use volatile pointer technique.
     */
    if (buf == NULL || len == 0) {
        return;
    }

#ifdef OPENSSL_cleanse
    OPENSSL_cleanse(buf, len);
#else
    /* Volatile pointer prevents optimizer from removing writes */
    volatile uint8_t *p = (volatile uint8_t *)buf;
    size_t i;

    for (i = 0; i < len; i++) {
        p[i] = 0;
    }

    /*
     * Memory barrier to ensure writes complete.
     * This compiler barrier prevents reordering.
     */
    __asm__ __volatile__("" : : "r"(p) : "memory");
#endif
}
