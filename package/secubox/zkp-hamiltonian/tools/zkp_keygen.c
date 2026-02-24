/**
 * @file zkp_keygen.c
 * @brief CLI tool for generating ZKP key pairs (Graph G, Cycle H)
 * @version 1.0
 *
 * Usage: zkp_keygen -n <nodes> [-r <ratio>] -o <output_prefix>
 *
 * Generates:
 *   <output_prefix>.graph - Public graph G (can be shared)
 *   <output_prefix>.key   - Secret Hamiltonian cycle H (CONFIDENTIAL!)
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
    fprintf(stderr, "Usage: %s -n <nodes> [-r <ratio>] -o <output_prefix>\n", prog);
    fprintf(stderr, "\n");
    fprintf(stderr, "Options:\n");
    fprintf(stderr, "  -n, --nodes <n>     Number of nodes (3-%d, recommended 50-80)\n", ZKP_MAX_N);
    fprintf(stderr, "  -r, --ratio <r>     Extra edge ratio (default 1.0, range 0.0-5.0)\n");
    fprintf(stderr, "  -o, --output <pfx>  Output prefix (creates <pfx>.graph and <pfx>.key)\n");
    fprintf(stderr, "  -h, --help          Show this help\n");
    fprintf(stderr, "\n");
    fprintf(stderr, "Example:\n");
    fprintf(stderr, "  %s -n 50 -r 1.0 -o /etc/secubox/zkp/identity\n", prog);
    fprintf(stderr, "\n");
    fprintf(stderr, "Output:\n");
    fprintf(stderr, "  <prefix>.graph  Public graph (share with verifiers)\n");
    fprintf(stderr, "  <prefix>.key    Secret cycle (KEEP CONFIDENTIAL!)\n");
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
    int n = 0;
    double ratio = 1.0;
    const char *output_prefix = NULL;

    static struct option long_options[] = {
        {"nodes",  required_argument, 0, 'n'},
        {"ratio",  required_argument, 0, 'r'},
        {"output", required_argument, 0, 'o'},
        {"help",   no_argument,       0, 'h'},
        {0, 0, 0, 0}
    };

    int opt;
    while ((opt = getopt_long(argc, argv, "n:r:o:h", long_options, NULL)) != -1) {
        switch (opt) {
        case 'n':
            n = atoi(optarg);
            break;
        case 'r':
            ratio = atof(optarg);
            break;
        case 'o':
            output_prefix = optarg;
            break;
        case 'h':
            print_usage(argv[0]);
            return 0;
        default:
            print_usage(argv[0]);
            return 2;
        }
    }

    /* Validate arguments */
    if (n < 3 || n > ZKP_MAX_N) {
        fprintf(stderr, "Error: nodes must be between 3 and %d\n", ZKP_MAX_N);
        return 2;
    }

    if (ratio < 0.0 || ratio > 5.0) {
        fprintf(stderr, "Error: ratio must be between 0.0 and 5.0\n");
        return 2;
    }

    if (output_prefix == NULL) {
        fprintf(stderr, "Error: output prefix required (-o)\n");
        print_usage(argv[0]);
        return 2;
    }

    /* Generate graph and cycle */
    printf("Generating ZKP key pair (n=%d, ratio=%.2f)...\n", n, ratio);

    Graph G;
    HamiltonianCycle H;

    ZKPResult res = zkp_generate_graph((uint8_t)n, ratio, &G, &H);
    if (res != ZKP_OK) {
        fprintf(stderr, "Error: generation failed (code %d)\n", res);
        return 1;
    }

    printf("Generated graph with %u nodes and %u edges\n", G.n, zkp_graph_edge_count(&G));

    /* Serialize graph */
    uint8_t graph_buf[8192];
    size_t graph_len = sizeof(graph_buf);

    res = zkp_graph_serialize(&G, graph_buf, &graph_len);
    if (res != ZKP_OK) {
        fprintf(stderr, "Error: graph serialization failed\n");
        return 1;
    }

    /* Serialize cycle */
    uint8_t cycle_buf[256];
    size_t cycle_len = sizeof(cycle_buf);

    res = zkp_cycle_serialize(&H, cycle_buf, &cycle_len);
    if (res != ZKP_OK) {
        fprintf(stderr, "Error: cycle serialization failed\n");
        return 1;
    }

    /* Write files */
    char graph_path[512];
    char key_path[512];

    snprintf(graph_path, sizeof(graph_path), "%s.graph", output_prefix);
    snprintf(key_path, sizeof(key_path), "%s.key", output_prefix);

    if (write_file(graph_path, graph_buf, graph_len) != 0) {
        fprintf(stderr, "Error: failed to write %s\n", graph_path);
        return 1;
    }
    printf("Wrote public graph: %s (%zu bytes)\n", graph_path, graph_len);

    if (write_file(key_path, cycle_buf, cycle_len) != 0) {
        fprintf(stderr, "Error: failed to write %s\n", key_path);
        return 1;
    }
    printf("Wrote secret key:   %s (%zu bytes)\n", key_path, cycle_len);

    printf("\nIMPORTANT:\n");
    printf("  - %s can be shared with verifiers\n", graph_path);
    printf("  - %s is SECRET! Do NOT share it.\n", key_path);

    /* Zero sensitive data */
    zkp_secure_zero(&H, sizeof(H));
    zkp_secure_zero(cycle_buf, sizeof(cycle_buf));

    return 0;
}
