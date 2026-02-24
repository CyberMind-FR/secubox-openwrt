/**
 * @file zkp_prover.c
 * @brief CLI tool for generating ZKP proofs
 * @version 1.0
 *
 * Usage: zkp_prover -g <graph_file> -k <key_file> -o <proof_file>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 * Copyright (C) 2026 CyberMind.FR / SecuBox
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <getopt.h>
#include "zkp_hamiltonian.h"
#include "zkp_graph.h"
#include "zkp_crypto.h"

static void print_usage(const char *prog)
{
    fprintf(stderr, "Usage: %s -g <graph_file> -k <key_file> -o <proof_file>\n", prog);
    fprintf(stderr, "\n");
    fprintf(stderr, "Options:\n");
    fprintf(stderr, "  -g, --graph <file>  Path to public graph file (.graph)\n");
    fprintf(stderr, "  -k, --key <file>    Path to secret key file (.key)\n");
    fprintf(stderr, "  -o, --output <file> Path to output proof file (.proof)\n");
    fprintf(stderr, "  -h, --help          Show this help\n");
    fprintf(stderr, "\n");
    fprintf(stderr, "Example:\n");
    fprintf(stderr, "  %s -g identity.graph -k identity.key -o auth.proof\n", prog);
}

static int read_file(const char *path, uint8_t **data, size_t *len)
{
    FILE *f = fopen(path, "rb");
    if (f == NULL) {
        perror("fopen");
        return -1;
    }

    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    if (size <= 0 || size > 16 * 1024 * 1024) { /* Max 16MB */
        fprintf(stderr, "Error: invalid file size\n");
        fclose(f);
        return -1;
    }

    *data = malloc((size_t)size);
    if (*data == NULL) {
        fprintf(stderr, "Error: out of memory\n");
        fclose(f);
        return -1;
    }

    size_t read = fread(*data, 1, (size_t)size, f);
    fclose(f);

    if (read != (size_t)size) {
        free(*data);
        *data = NULL;
        return -1;
    }

    *len = (size_t)size;
    return 0;
}

static int write_file(const char *path, const uint8_t *data, size_t len)
{
    FILE *f = fopen(path, "wb");
    if (f == NULL) {
        perror("fopen");
        return -1;
    }

    size_t written = fwrite(data, 1, len, f);
    fclose(f);

    if (written != len) {
        fprintf(stderr, "Error: only wrote %zu of %zu bytes\n", written, len);
        return -1;
    }

    return 0;
}

int main(int argc, char *argv[])
{
    const char *graph_path = NULL;
    const char *key_path = NULL;
    const char *output_path = NULL;

    static struct option long_options[] = {
        {"graph",  required_argument, 0, 'g'},
        {"key",    required_argument, 0, 'k'},
        {"output", required_argument, 0, 'o'},
        {"help",   no_argument,       0, 'h'},
        {0, 0, 0, 0}
    };

    int opt;
    while ((opt = getopt_long(argc, argv, "g:k:o:h", long_options, NULL)) != -1) {
        switch (opt) {
        case 'g':
            graph_path = optarg;
            break;
        case 'k':
            key_path = optarg;
            break;
        case 'o':
            output_path = optarg;
            break;
        case 'h':
            print_usage(argv[0]);
            return 0;
        default:
            print_usage(argv[0]);
            return 2;
        }
    }

    if (graph_path == NULL || key_path == NULL || output_path == NULL) {
        fprintf(stderr, "Error: all options are required\n");
        print_usage(argv[0]);
        return 2;
    }

    int ret = 1;
    uint8_t *graph_data = NULL;
    uint8_t *key_data = NULL;
    uint8_t *proof_buf = NULL;
    size_t graph_len = 0, key_len = 0;

    /* Read graph */
    printf("Reading graph from %s...\n", graph_path);
    if (read_file(graph_path, &graph_data, &graph_len) != 0) {
        fprintf(stderr, "Error: failed to read graph file\n");
        goto cleanup;
    }

    /* Read key */
    printf("Reading key from %s...\n", key_path);
    if (read_file(key_path, &key_data, &key_len) != 0) {
        fprintf(stderr, "Error: failed to read key file\n");
        goto cleanup;
    }

    /* Deserialize graph */
    Graph G;
    ZKPResult res = zkp_graph_deserialize(graph_data, graph_len, &G);
    if (res != ZKP_OK) {
        fprintf(stderr, "Error: invalid graph file format\n");
        goto cleanup;
    }
    printf("Graph loaded: n=%u, edges=%u\n", G.n, zkp_graph_edge_count(&G));

    /* Deserialize cycle */
    HamiltonianCycle H;
    res = zkp_cycle_deserialize(key_data, key_len, &H);
    if (res != ZKP_OK) {
        fprintf(stderr, "Error: invalid key file format\n");
        goto cleanup;
    }

    /* Validate cycle */
    if (!zkp_validate_hamiltonian_cycle(&G, &H)) {
        fprintf(stderr, "Error: key does not match graph (invalid cycle)\n");
        goto cleanup;
    }

    /* Generate proof */
    printf("Generating NIZK proof...\n");
    NIZKProof proof;
    res = zkp_prove(&G, &H, &proof);
    if (res != ZKP_OK) {
        fprintf(stderr, "Error: proof generation failed (code %d)\n", res);
        goto cleanup;
    }

    printf("Proof generated: challenge=%u (%s)\n",
           proof.challenge,
           proof.challenge == 0 ? "isomorphism" : "hamiltonian");

    /* Serialize proof */
    size_t proof_len = 0;
    zkp_proof_serialize(&proof, NULL, &proof_len); /* Get size */

    proof_buf = malloc(proof_len);
    if (proof_buf == NULL) {
        fprintf(stderr, "Error: out of memory\n");
        goto cleanup;
    }

    res = zkp_proof_serialize(&proof, proof_buf, &proof_len);
    if (res != ZKP_OK) {
        fprintf(stderr, "Error: proof serialization failed\n");
        goto cleanup;
    }

    /* Write proof */
    if (write_file(output_path, proof_buf, proof_len) != 0) {
        fprintf(stderr, "Error: failed to write proof file\n");
        goto cleanup;
    }

    printf("Wrote proof: %s (%zu bytes)\n", output_path, proof_len);
    ret = 0;

cleanup:
    /* Zero sensitive data */
    if (key_data != NULL) {
        zkp_secure_zero(key_data, key_len);
        free(key_data);
    }
    zkp_secure_zero(&H, sizeof(H));

    free(graph_data);
    free(proof_buf);

    return ret;
}
