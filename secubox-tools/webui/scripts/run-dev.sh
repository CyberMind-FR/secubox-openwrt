#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Starting SecuBox WebUI Development Server..."
echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Check if venv exists
VENV_BIN="${VENV_BIN:-.venv/bin}"
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Please run:"
    echo "   python -m venv .venv && source .venv/bin/activate && pip install -e .[dev]"
    exit 1
fi

# Source venv
source "$VENV_BIN/activate" 2>/dev/null || true

# Check if modules.json exists, if not run ingest
if [ ! -f "data/modules.json" ]; then
    echo "📦 Generating module catalog from packages..."
    python -m app.ingest --pretty
    echo ""
fi

echo "✅ Starting server at http://127.0.0.1:8100"
echo "   Press Ctrl+C to stop"
echo ""

if [[ -x "$VENV_BIN/uvicorn" ]]; then
    exec "$VENV_BIN/uvicorn" app.main:app --reload --host 127.0.0.1 --port 8100 "$@"
else
    exec uvicorn app.main:app --reload --host 127.0.0.1 --port 8100 "$@"
fi
