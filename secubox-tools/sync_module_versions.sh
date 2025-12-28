#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCR="$REPO_ROOT/secubox-tools/sync_module_versions.py"

python3 "$SCR"
