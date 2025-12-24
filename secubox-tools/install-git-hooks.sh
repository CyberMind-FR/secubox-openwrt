#!/bin/bash
#
# install-git-hooks.sh
# ====================
# Installs SecuBox validation git hooks
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"

echo "Installing SecuBox git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

# Install pre-push hook
if [ -f "$SCRIPT_DIR/pre-push-validation.sh" ]; then
    ln -sf ../../secubox-tools/pre-push-validation.sh "$GIT_HOOKS_DIR/pre-push"
    chmod +x "$SCRIPT_DIR/pre-push-validation.sh"
    echo "✓ Installed pre-push hook"
else
    echo "✗ pre-push-validation.sh not found"
    exit 1
fi

echo ""
echo "Git hooks installed successfully!"
echo ""
echo "The pre-push hook will run automatically before every 'git push'"
echo "to validate your modules."
echo ""
echo "To bypass validation (NOT RECOMMENDED):"
echo "  git push --no-verify"
echo ""
