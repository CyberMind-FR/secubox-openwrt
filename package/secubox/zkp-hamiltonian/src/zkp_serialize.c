/**
 * @file zkp_serialize.c
 * @brief Serialization functions for ZKP Hamiltonian protocol
 * @version 1.0
 *
 * Provides binary serialization/deserialization for proofs, graphs, and cycles.
 *
 * Wire format is designed for embedded systems:
 * - Fixed sizes where possible (no variable-length encoding complexity)
 * - Big-endian for network/file portability
 * - Version fields for forward compatibility
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include "zkp_hamiltonian.h"
#include "zkp_crypto.h"
#include <string.h>

/* Magic bytes for file identification */
#define ZKP_MAGIC_PROOF  0x5A4B5050  /* "ZKPP" - ZKP Proof */
#define ZKP_MAGIC_GRAPH  0x5A4B5047  /* "ZKPG" - ZKP Graph */
#define ZKP_MAGIC_CYCLE  0x5A4B5048  /* "ZKPH" - ZKP Hamiltonian cycle */

/* ============== Helper Functions ============== */

/**
 * @brief Write uint32 in big-endian format
 */
static void write_be32(uint8_t *buf, uint32_t val)
{
    buf[0] = (uint8_t)(val >> 24);
    buf[1] = (uint8_t)(val >> 16);
    buf[2] = (uint8_t)(val >> 8);
    buf[3] = (uint8_t)(val);
}

/**
 * @brief Read uint32 from big-endian format
 */
static uint32_t read_be32(const uint8_t *buf)
{
    return ((uint32_t)buf[0] << 24) |
           ((uint32_t)buf[1] << 16) |
           ((uint32_t)buf[2] << 8) |
           ((uint32_t)buf[3]);
}

/**
 * @brief Write uint64 in big-endian format
 */
static void write_be64(uint8_t *buf, uint64_t val)
{
    buf[0] = (uint8_t)(val >> 56);
    buf[1] = (uint8_t)(val >> 48);
    buf[2] = (uint8_t)(val >> 40);
    buf[3] = (uint8_t)(val >> 32);
    buf[4] = (uint8_t)(val >> 24);
    buf[5] = (uint8_t)(val >> 16);
    buf[6] = (uint8_t)(val >> 8);
    buf[7] = (uint8_t)(val);
}

/**
 * @brief Read uint64 from big-endian format
 */
static uint64_t read_be64(const uint8_t *buf)
{
    return ((uint64_t)buf[0] << 56) |
           ((uint64_t)buf[1] << 48) |
           ((uint64_t)buf[2] << 40) |
           ((uint64_t)buf[3] << 32) |
           ((uint64_t)buf[4] << 24) |
           ((uint64_t)buf[5] << 16) |
           ((uint64_t)buf[6] << 8) |
           ((uint64_t)buf[7]);
}

/* ============== Proof Serialization ============== */

/*
 * Proof wire format:
 *
 * Header (42 bytes):
 *   [4B]  magic = 0x5A4B5050
 *   [1B]  version
 *   [1B]  n (number of nodes)
 *   [32B] session_nonce
 *   [1B]  challenge (0 or 1)
 *   [3B]  reserved (padding)
 *
 * Body (variable, depends on n and challenge):
 *   [n*8B] gprime_adj (big-endian uint64 per row)
 *   [n*(n-1)/2 * 32B] commits (upper triangle only)
 *
 * Response (depends on challenge):
 *   If challenge == 0 (isomorphism):
 *     [n]   perm
 *     [n*(n-1)/2 * 32B] nonces (upper triangle)
 *   If challenge == 1 (Hamiltonian):
 *     [n]   cycle_nodes
 *     [n * 32B] cycle_nonces
 */

ZKPResult zkp_proof_serialize(const NIZKProof *proof, uint8_t *buf, size_t *len)
{
    if (proof == NULL || len == NULL) {
        return ZKP_ERR_PARAM;
    }

    uint8_t n = proof->n;
    if (n == 0 || n > ZKP_MAX_N) {
        return ZKP_ERR_PARAM;
    }

    /* Calculate required buffer size */
    size_t header_size = 44; /* magic + version + n + nonce + challenge + reserved */
    size_t gprime_size = (size_t)n * 8;
    size_t commits_count = (size_t)n * (n - 1) / 2;
    size_t commits_size = commits_count * ZKP_HASH_SIZE;
    size_t response_size;

    if (proof->challenge == 0) {
        /* Isomorphism response: perm + all nonces */
        response_size = (size_t)n + commits_count * ZKP_NONCE_SIZE;
    } else {
        /* Hamiltonian response: cycle nodes + cycle nonces */
        response_size = (size_t)n + (size_t)n * ZKP_NONCE_SIZE;
    }

    size_t total_size = header_size + gprime_size + commits_size + response_size;

    if (buf == NULL) {
        /* Just return required size */
        *len = total_size;
        return ZKP_OK;
    }

    if (*len < total_size) {
        *len = total_size;
        return ZKP_ERR_MEM;
    }

    size_t offset = 0;

    /* Header */
    write_be32(buf + offset, ZKP_MAGIC_PROOF);
    offset += 4;

    buf[offset++] = proof->version;
    buf[offset++] = n;

    memcpy(buf + offset, proof->session_nonce, ZKP_NONCE_SIZE);
    offset += ZKP_NONCE_SIZE;

    buf[offset++] = proof->challenge;
    buf[offset++] = 0; /* reserved */
    buf[offset++] = 0;
    buf[offset++] = 0;

    /* G' adjacency */
    uint8_t i, j;
    for (i = 0; i < n; i++) {
        write_be64(buf + offset, proof->gprime_adj[i]);
        offset += 8;
    }

    /* Commits (upper triangle) */
    for (i = 0; i < n; i++) {
        for (j = (uint8_t)(i + 1); j < n; j++) {
            memcpy(buf + offset, proof->commits[i][j], ZKP_HASH_SIZE);
            offset += ZKP_HASH_SIZE;
        }
    }

    /* Response */
    if (proof->challenge == 0) {
        /* Isomorphism: perm + nonces */
        memcpy(buf + offset, proof->iso_response.perm, n);
        offset += n;

        for (i = 0; i < n; i++) {
            for (j = (uint8_t)(i + 1); j < n; j++) {
                memcpy(buf + offset, proof->iso_response.nonces[i][j], ZKP_NONCE_SIZE);
                offset += ZKP_NONCE_SIZE;
            }
        }
    } else {
        /* Hamiltonian: cycle nodes + nonces */
        memcpy(buf + offset, proof->ham_response.cycle_nodes, n);
        offset += n;

        for (i = 0; i < n; i++) {
            memcpy(buf + offset, proof->ham_response.nonces[i], ZKP_NONCE_SIZE);
            offset += ZKP_NONCE_SIZE;
        }
    }

    *len = offset;
    return ZKP_OK;
}

ZKPResult zkp_proof_deserialize(const uint8_t *buf, size_t len, NIZKProof *proof)
{
    if (buf == NULL || proof == NULL) {
        return ZKP_ERR_PARAM;
    }

    if (len < 44) {
        return ZKP_ERR_PARAM; /* Too short for header */
    }

    size_t offset = 0;

    /* Verify magic */
    uint32_t magic = read_be32(buf + offset);
    offset += 4;

    if (magic != ZKP_MAGIC_PROOF) {
        return ZKP_ERR_PARAM;
    }

    /* Read header */
    memset(proof, 0, sizeof(NIZKProof));

    proof->version = buf[offset++];
    proof->n = buf[offset++];

    uint8_t n = proof->n;
    if (n == 0 || n > ZKP_MAX_N) {
        return ZKP_ERR_PARAM;
    }

    memcpy(proof->session_nonce, buf + offset, ZKP_NONCE_SIZE);
    offset += ZKP_NONCE_SIZE;

    proof->challenge = buf[offset++];
    offset += 3; /* skip reserved */

    /* Calculate expected remaining size */
    size_t gprime_size = (size_t)n * 8;
    size_t commits_count = (size_t)n * (n - 1) / 2;
    size_t commits_size = commits_count * ZKP_HASH_SIZE;
    size_t response_size;

    if (proof->challenge == 0) {
        response_size = (size_t)n + commits_count * ZKP_NONCE_SIZE;
    } else {
        response_size = (size_t)n + (size_t)n * ZKP_NONCE_SIZE;
    }

    if (len < offset + gprime_size + commits_size + response_size) {
        return ZKP_ERR_PARAM;
    }

    /* Read G' adjacency */
    uint8_t i, j;
    for (i = 0; i < n; i++) {
        proof->gprime_adj[i] = read_be64(buf + offset);
        offset += 8;
    }

    /* Read commits (upper triangle) */
    for (i = 0; i < n; i++) {
        for (j = (uint8_t)(i + 1); j < n; j++) {
            memcpy(proof->commits[i][j], buf + offset, ZKP_HASH_SIZE);
            /* Mirror to lower triangle */
            memcpy(proof->commits[j][i], proof->commits[i][j], ZKP_HASH_SIZE);
            offset += ZKP_HASH_SIZE;
        }
    }

    /* Read response */
    if (proof->challenge == 0) {
        /* Isomorphism */
        memcpy(proof->iso_response.perm, buf + offset, n);
        offset += n;

        for (i = 0; i < n; i++) {
            for (j = (uint8_t)(i + 1); j < n; j++) {
                memcpy(proof->iso_response.nonces[i][j], buf + offset, ZKP_NONCE_SIZE);
                /* Mirror to lower triangle */
                memcpy(proof->iso_response.nonces[j][i],
                       proof->iso_response.nonces[i][j], ZKP_NONCE_SIZE);
                offset += ZKP_NONCE_SIZE;
            }
        }
    } else {
        /* Hamiltonian */
        memcpy(proof->ham_response.cycle_nodes, buf + offset, n);
        offset += n;

        for (i = 0; i < n; i++) {
            memcpy(proof->ham_response.nonces[i], buf + offset, ZKP_NONCE_SIZE);
            offset += ZKP_NONCE_SIZE;
        }
    }

    return ZKP_OK;
}

/* ============== Graph Serialization ============== */

/*
 * Graph wire format:
 *   [4B]  magic = 0x5A4B5047
 *   [1B]  version
 *   [1B]  n
 *   [2B]  reserved
 *   [n*8B] adj (big-endian uint64 per row)
 */

ZKPResult zkp_graph_serialize(const Graph *G, uint8_t *buf, size_t *len)
{
    if (G == NULL || len == NULL) {
        return ZKP_ERR_PARAM;
    }

    uint8_t n = G->n;
    if (n == 0 || n > ZKP_MAX_N) {
        return ZKP_ERR_PARAM;
    }

    size_t total_size = 8 + (size_t)n * 8;

    if (buf == NULL) {
        *len = total_size;
        return ZKP_OK;
    }

    if (*len < total_size) {
        *len = total_size;
        return ZKP_ERR_MEM;
    }

    size_t offset = 0;

    write_be32(buf + offset, ZKP_MAGIC_GRAPH);
    offset += 4;

    buf[offset++] = ZKP_VERSION;
    buf[offset++] = n;
    buf[offset++] = 0; /* reserved */
    buf[offset++] = 0;

    uint8_t i;
    for (i = 0; i < n; i++) {
        write_be64(buf + offset, G->adj[i]);
        offset += 8;
    }

    *len = offset;
    return ZKP_OK;
}

ZKPResult zkp_graph_deserialize(const uint8_t *buf, size_t len, Graph *G)
{
    if (buf == NULL || G == NULL) {
        return ZKP_ERR_PARAM;
    }

    if (len < 8) {
        return ZKP_ERR_PARAM;
    }

    size_t offset = 0;

    uint32_t magic = read_be32(buf + offset);
    offset += 4;

    if (magic != ZKP_MAGIC_GRAPH) {
        return ZKP_ERR_PARAM;
    }

    uint8_t version = buf[offset++];
    (void)version; /* Currently unused, for forward compatibility */

    uint8_t n = buf[offset++];
    offset += 2; /* skip reserved */

    if (n == 0 || n > ZKP_MAX_N) {
        return ZKP_ERR_PARAM;
    }

    if (len < 8 + (size_t)n * 8) {
        return ZKP_ERR_PARAM;
    }

    G->n = n;
    memset(G->adj, 0, sizeof(G->adj));

    uint8_t i;
    for (i = 0; i < n; i++) {
        G->adj[i] = read_be64(buf + offset);
        offset += 8;
    }

    return ZKP_OK;
}

/* ============== Cycle Serialization ============== */

/*
 * Cycle wire format:
 *   [4B]  magic = 0x5A4B5048
 *   [1B]  version
 *   [1B]  n
 *   [2B]  reserved
 *   [n]   nodes
 */

ZKPResult zkp_cycle_serialize(const HamiltonianCycle *H, uint8_t *buf, size_t *len)
{
    if (H == NULL || len == NULL) {
        return ZKP_ERR_PARAM;
    }

    uint8_t n = H->n;
    if (n == 0 || n > ZKP_MAX_N) {
        return ZKP_ERR_PARAM;
    }

    size_t total_size = 8 + (size_t)n;

    if (buf == NULL) {
        *len = total_size;
        return ZKP_OK;
    }

    if (*len < total_size) {
        *len = total_size;
        return ZKP_ERR_MEM;
    }

    size_t offset = 0;

    write_be32(buf + offset, ZKP_MAGIC_CYCLE);
    offset += 4;

    buf[offset++] = ZKP_VERSION;
    buf[offset++] = n;
    buf[offset++] = 0; /* reserved */
    buf[offset++] = 0;

    memcpy(buf + offset, H->nodes, n);
    offset += n;

    *len = offset;
    return ZKP_OK;
}

ZKPResult zkp_cycle_deserialize(const uint8_t *buf, size_t len, HamiltonianCycle *H)
{
    if (buf == NULL || H == NULL) {
        return ZKP_ERR_PARAM;
    }

    if (len < 8) {
        return ZKP_ERR_PARAM;
    }

    size_t offset = 0;

    uint32_t magic = read_be32(buf + offset);
    offset += 4;

    if (magic != ZKP_MAGIC_CYCLE) {
        return ZKP_ERR_PARAM;
    }

    uint8_t version = buf[offset++];
    (void)version;

    uint8_t n = buf[offset++];
    offset += 2; /* skip reserved */

    if (n == 0 || n > ZKP_MAX_N) {
        return ZKP_ERR_PARAM;
    }

    if (len < 8 + (size_t)n) {
        return ZKP_ERR_PARAM;
    }

    H->n = n;
    memset(H->nodes, 0, sizeof(H->nodes));
    memcpy(H->nodes, buf + offset, n);

    return ZKP_OK;
}

/* ============== Debug Functions ============== */

#ifndef OPENWRT_BUILD

#include <stdio.h>

void zkp_proof_print(const NIZKProof *proof)
{
    if (proof == NULL) {
        printf("Proof: NULL\n");
        return;
    }

    printf("NIZKProof {\n");
    printf("  version: %u\n", proof->version);
    printf("  n: %u\n", proof->n);
    printf("  challenge: %u (%s)\n", proof->challenge,
           proof->challenge == 0 ? "isomorphism" : "hamiltonian");

    printf("  session_nonce: ");
    for (int i = 0; i < 8; i++) {
        printf("%02x", proof->session_nonce[i]);
    }
    printf("...\n");

    printf("  edges in G': %u\n", zkp_graph_edge_count(
        &(Graph){.n = proof->n, .adj = {0}}
    ));

    printf("}\n");
}

#else

void zkp_proof_print(const NIZKProof *proof)
{
    (void)proof;
}

#endif
