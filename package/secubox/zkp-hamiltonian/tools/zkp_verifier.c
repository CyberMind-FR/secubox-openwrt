/**
 * @file zkp_verifier.c
 * @brief CLI tool for verifying ZKP proofs
 * @version 1.0
 *
 * Usage: zkp_verifier -g <graph_file> -p <proof_file>
 *
 * Exit codes:
 *   0 - ACCEPT (proof valid)
 *   1 - REJECT (proof invalid)
 *   2 - ERROR (usage or file error)
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

static void print_usage(const char *prog)
{
    fprintf(stderr, "Usage: %s -g <graph_file> -p <proof_file>\n", prog);
    fprintf(stderr, "\n");
    fprintf(stderr, "Options:\n");
    fprintf(stderr, "  -g, --graph <file>  Path to public graph file (.graph)\n");
    fprintf(stderr, "  -p, --proof <file>  Path to proof file (.proof)\n");
    fprintf(stderr, "  -v, --verbose       Verbose output\n");
    fprintf(stderr, "  -h, --help          Show this help\n");
    fprintf(stderr, "\n");
    fprintf(stderr, "Exit codes:\n");
    fprintf(stderr, "  0 - ACCEPT (proof is valid)\n");
    fprintf(stderr, "  1 - REJECT (proof is invalid)\n");
    fprintf(stderr, "  2 - ERROR (usage or file error)\n");
    fprintf(stderr, "\n");
    fprintf(stderr, "Example:\n");
    fprintf(stderr, "  %s -g identity.graph -p auth.proof && echo 'Authenticated!'\n", prog);
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

    size_t read_bytes = fread(*data, 1, (size_t)size, f);
    fclose(f);

    if (read_bytes != (size_t)size) {
        free(*data);
        *data = NULL;
        return -1;
    }

    *len = (size_t)size;
    return 0;
}

int main(int argc, char *argv[])
{
    const char *graph_path = NULL;
    const char *proof_path = NULL;
    int verbose = 0;

    static struct option long_options[] = {
        {"graph",   required_argument, 0, 'g'},
        {"proof",   required_argument, 0, 'p'},
        {"verbose", no_argument,       0, 'v'},
        {"help",    no_argument,       0, 'h'},
        {0, 0, 0, 0}
    };

    int opt;
    while ((opt = getopt_long(argc, argv, "g:p:vh", long_options, NULL)) != -1) {
        switch (opt) {
        case 'g':
            graph_path = optarg;
            break;
        case 'p':
            proof_path = optarg;
            break;
        case 'v':
            verbose = 1;
            break;
        case 'h':
            print_usage(argv[0]);
            return 0;
        default:
            print_usage(argv[0]);
            return 2;
        }
    }

    if (graph_path == NULL || proof_path == NULL) {
        fprintf(stderr, "Error: graph and proof files are required\n");
        print_usage(argv[0]);
        return 2;
    }

    int ret = 2; /* Error by default */
    uint8_t *graph_data = NULL;
    uint8_t *proof_data = NULL;
    size_t graph_len = 0, proof_len = 0;

    /* Read graph */
    if (verbose) {
        printf("Reading graph from %s...\n", graph_path);
    }
    if (read_file(graph_path, &graph_data, &graph_len) != 0) {
        fprintf(stderr, "Error: failed to read graph file\n");
        goto cleanup;
    }

    /* Read proof */
    if (verbose) {
        printf("Reading proof from %s...\n", proof_path);
    }
    if (read_file(proof_path, &proof_data, &proof_len) != 0) {
        fprintf(stderr, "Error: failed to read proof file\n");
        goto cleanup;
    }

    /* Deserialize graph */
    Graph G;
    ZKPResult res = zkp_graph_deserialize(graph_data, graph_len, &G);
    if (res != ZKP_OK) {
        fprintf(stderr, "Error: invalid graph file format\n");
        goto cleanup;
    }
    if (verbose) {
        printf("Graph loaded: n=%u, edges=%u\n", G.n, zkp_graph_edge_count(&G));
    }

    /* Deserialize proof */
    NIZKProof proof;
    res = zkp_proof_deserialize(proof_data, proof_len, &proof);
    if (res != ZKP_OK) {
        fprintf(stderr, "Error: invalid proof file format\n");
        goto cleanup;
    }
    if (verbose) {
        printf("Proof loaded: version=%u, n=%u, challenge=%u\n",
               proof.version, proof.n, proof.challenge);
    }

    /* Verify proof */
    if (verbose) {
        printf("Verifying proof...\n");
    }

    res = zkp_verify(&G, &proof);

    if (res == ZKP_ACCEPT) {
        if (verbose) {
            printf("\033[32m✓ ACCEPT\033[0m - Proof is valid\n");
        } else {
            printf("ACCEPT\n");
        }
        ret = 0;
    } else if (res == ZKP_REJECT) {
        if (verbose) {
            printf("\033[31m✗ REJECT\033[0m - Proof is invalid\n");
        } else {
            printf("REJECT\n");
        }
        ret = 1;
    } else {
        fprintf(stderr, "Error: verification failed (code %d)\n", res);
        ret = 2;
    }

cleanup:
    free(graph_data);
    free(proof_data);

    return ret;
}
