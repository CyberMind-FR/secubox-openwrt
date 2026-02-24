/**
 * @file test_crypto.c
 * @brief Tests for cryptographic primitives
 * @version 1.0
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include <stdio.h>
#include <string.h>
#include "zkp_types.h"
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

static int test_commit_deterministic(void)
{
    TEST("Commit deterministic: same (bit,nonce) → same hash");

    uint8_t nonce[ZKP_NONCE_SIZE];
    uint8_t hash1[ZKP_HASH_SIZE];
    uint8_t hash2[ZKP_HASH_SIZE];

    /* Generate random nonce */
    ASSERT(zkp_random_bytes(nonce, ZKP_NONCE_SIZE) == ZKP_OK, "RNG failed");

    /* Commit twice with same inputs */
    zkp_commit(1, nonce, hash1);
    zkp_commit(1, nonce, hash2);

    ASSERT(memcmp(hash1, hash2, ZKP_HASH_SIZE) == 0, "Hashes differ");

    PASS();
    return 0;
}

static int test_commit_binding(void)
{
    TEST("Commit binding: Commit(0,r) ≠ Commit(1,r)");

    uint8_t nonce[ZKP_NONCE_SIZE];
    uint8_t hash0[ZKP_HASH_SIZE];
    uint8_t hash1[ZKP_HASH_SIZE];

    ASSERT(zkp_random_bytes(nonce, ZKP_NONCE_SIZE) == ZKP_OK, "RNG failed");

    zkp_commit(0, nonce, hash0);
    zkp_commit(1, nonce, hash1);

    ASSERT(memcmp(hash0, hash1, ZKP_HASH_SIZE) != 0, "Same hash for 0 and 1");

    PASS();
    return 0;
}

static int test_commit_hiding(void)
{
    TEST("Commit hiding: Commit(0,r1) ≠ Commit(0,r2) for r1≠r2");

    uint8_t nonce1[ZKP_NONCE_SIZE];
    uint8_t nonce2[ZKP_NONCE_SIZE];
    uint8_t hash1[ZKP_HASH_SIZE];
    uint8_t hash2[ZKP_HASH_SIZE];

    ASSERT(zkp_random_bytes(nonce1, ZKP_NONCE_SIZE) == ZKP_OK, "RNG failed");
    ASSERT(zkp_random_bytes(nonce2, ZKP_NONCE_SIZE) == ZKP_OK, "RNG failed");

    /* Ensure nonces are different */
    ASSERT(memcmp(nonce1, nonce2, ZKP_NONCE_SIZE) != 0, "Nonces same");

    zkp_commit(0, nonce1, hash1);
    zkp_commit(0, nonce2, hash2);

    ASSERT(memcmp(hash1, hash2, ZKP_HASH_SIZE) != 0, "Same hash for different nonces");

    PASS();
    return 0;
}

static int test_commit_verify_valid(void)
{
    TEST("Commit verify: accepts correct commitment");

    uint8_t nonce[ZKP_NONCE_SIZE];
    uint8_t hash[ZKP_HASH_SIZE];

    ASSERT(zkp_random_bytes(nonce, ZKP_NONCE_SIZE) == ZKP_OK, "RNG failed");

    zkp_commit(1, nonce, hash);

    ASSERT(zkp_commit_verify(1, nonce, hash) == true, "Verify rejected valid");

    PASS();
    return 0;
}

static int test_commit_verify_tampered(void)
{
    TEST("Commit verify: rejects tampered commitment");

    uint8_t nonce[ZKP_NONCE_SIZE];
    uint8_t hash[ZKP_HASH_SIZE];

    ASSERT(zkp_random_bytes(nonce, ZKP_NONCE_SIZE) == ZKP_OK, "RNG failed");

    zkp_commit(1, nonce, hash);

    /* Tamper with hash */
    hash[0] ^= 0xFF;

    ASSERT(zkp_commit_verify(1, nonce, hash) == false, "Verify accepted tampered");

    PASS();
    return 0;
}

static int test_commit_verify_wrong_bit(void)
{
    TEST("Commit verify: rejects wrong bit");

    uint8_t nonce[ZKP_NONCE_SIZE];
    uint8_t hash[ZKP_HASH_SIZE];

    ASSERT(zkp_random_bytes(nonce, ZKP_NONCE_SIZE) == ZKP_OK, "RNG failed");

    zkp_commit(1, nonce, hash);

    /* Try to verify with wrong bit */
    ASSERT(zkp_commit_verify(0, nonce, hash) == false, "Verify accepted wrong bit");

    PASS();
    return 0;
}

static int test_fiat_shamir_deterministic(void)
{
    TEST("Fiat-Shamir: same inputs → same challenge");

    Graph G;
    uint64_t gprime_adj[ZKP_MAX_N] = {0};
    uint8_t commits[ZKP_MAX_N][ZKP_MAX_N][ZKP_HASH_SIZE] = {{{0}}};
    uint8_t session_nonce[ZKP_NONCE_SIZE];
    uint8_t n = 10;

    /* Generate test data */
    zkp_graph_init(&G, n);
    zkp_graph_add_edge(&G, 0, 1);
    zkp_graph_add_edge(&G, 1, 2);

    ASSERT(zkp_random_bytes(session_nonce, ZKP_NONCE_SIZE) == ZKP_OK, "RNG failed");

    /* Copy G to gprime_adj */
    for (uint8_t i = 0; i < n; i++) {
        gprime_adj[i] = G.adj[i];
    }

    /* Generate some commits */
    uint8_t nonce[ZKP_NONCE_SIZE];
    for (uint8_t i = 0; i < n; i++) {
        for (uint8_t j = (uint8_t)(i + 1); j < n; j++) {
            ASSERT(zkp_random_bytes(nonce, ZKP_NONCE_SIZE) == ZKP_OK, "RNG");
            zkp_commit(zkp_graph_has_edge(&G, i, j) ? 1 : 0, nonce, commits[i][j]);
        }
    }

    uint8_t c1 = zkp_fiat_shamir_challenge(&G, gprime_adj, commits, n, session_nonce);
    uint8_t c2 = zkp_fiat_shamir_challenge(&G, gprime_adj, commits, n, session_nonce);

    ASSERT(c1 == c2, "Challenges differ for same inputs");
    ASSERT(c1 == 0 || c1 == 1, "Challenge not 0 or 1");

    PASS();
    return 0;
}

static int test_random_bytes_fills_buffer(void)
{
    TEST("Random bytes: fills entire buffer");

    uint8_t buf[64];
    memset(buf, 0, sizeof(buf));

    ASSERT(zkp_random_bytes(buf, sizeof(buf)) == ZKP_OK, "RNG failed");

    /* Check that buffer is not all zeros (probability 2^-512) */
    int non_zero = 0;
    for (size_t i = 0; i < sizeof(buf); i++) {
        if (buf[i] != 0) non_zero++;
    }

    ASSERT(non_zero > 0, "Buffer still all zeros");

    PASS();
    return 0;
}

static int test_random_permutation_valid(void)
{
    TEST("Random permutation: valid permutation of {0..n-1}");

    uint8_t perm[ZKP_MAX_N];
    uint8_t n = 20;

    ASSERT(zkp_random_permutation(perm, n) == ZKP_OK, "Permutation failed");

    /* Check all values present exactly once */
    uint32_t seen = 0;
    for (uint8_t i = 0; i < n; i++) {
        ASSERT(perm[i] < n, "Value out of range");
        ASSERT((seen & (1U << perm[i])) == 0, "Duplicate value");
        seen |= (1U << perm[i]);
    }

    /* All values should be present */
    ASSERT(seen == ((1U << n) - 1), "Missing values");

    PASS();
    return 0;
}

static int test_random_permutation_randomness(void)
{
    TEST("Random permutation: appears random (statistical)");

    /* Generate 100 permutations and check position 0 is not always 0 */
    int zero_at_zero = 0;
    uint8_t perm[ZKP_MAX_N];
    uint8_t n = 20;

    for (int iter = 0; iter < 100; iter++) {
        ASSERT(zkp_random_permutation(perm, n) == ZKP_OK, "Permutation failed");
        if (perm[0] == 0) zero_at_zero++;
    }

    /* Expected: ~5 times out of 100 (1/20 probability) */
    /* Accept if between 0 and 20 times */
    ASSERT(zero_at_zero < 30, "Permutation not random enough");

    PASS();
    return 0;
}

static int test_const_time_memcmp_equal(void)
{
    TEST("Const-time memcmp: returns true for equal");

    uint8_t a[32], b[32];
    ASSERT(zkp_random_bytes(a, 32) == ZKP_OK, "RNG failed");
    memcpy(b, a, 32);

    ASSERT(zkp_const_time_memcmp(a, b, 32) == true, "Equal buffers not equal");

    PASS();
    return 0;
}

static int test_const_time_memcmp_differ(void)
{
    TEST("Const-time memcmp: returns false for different");

    uint8_t a[32], b[32];
    ASSERT(zkp_random_bytes(a, 32) == ZKP_OK, "RNG failed");
    ASSERT(zkp_random_bytes(b, 32) == ZKP_OK, "RNG failed");

    /* Make sure they're different */
    a[0] ^= 0x01;

    ASSERT(zkp_const_time_memcmp(a, b, 32) == false, "Different buffers equal");

    PASS();
    return 0;
}

/* ============== Main ============== */

int main(void)
{
    printf("\n=== ZKP Crypto Tests ===\n\n");

    int result = 0;

    result |= test_commit_deterministic();
    result |= test_commit_binding();
    result |= test_commit_hiding();
    result |= test_commit_verify_valid();
    result |= test_commit_verify_tampered();
    result |= test_commit_verify_wrong_bit();
    result |= test_fiat_shamir_deterministic();
    result |= test_random_bytes_fills_buffer();
    result |= test_random_permutation_valid();
    result |= test_random_permutation_randomness();
    result |= test_const_time_memcmp_equal();
    result |= test_const_time_memcmp_differ();

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
