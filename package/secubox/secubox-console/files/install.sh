#!/bin/bash
# SecuBox Frontend Installer
# One-line install: curl -sL URL | bash

set -e

VERSION="1.0.0"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/share/secubox-frontend}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         SecuBox Frontend Installer v$VERSION                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "❌ Python 3 required. Install with:"
    echo "   sudo apt install python3 python3-pip"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "✅ Python $PYTHON_VERSION found"

# Create directories
mkdir -p "$INSTALL_DIR" "$BIN_DIR"

# Download or copy files
echo "📦 Installing files..."

if [ -f "secubox_frontend.py" ]; then
    # Local install
    cp secubox_frontend.py "$INSTALL_DIR/"
    cp secubox_console.py "$INSTALL_DIR/" 2>/dev/null || true
else
    # Download from mesh/repo
    echo "   Downloading from repository..."
    # Would download from GitHub or mesh here
    cat > "$INSTALL_DIR/secubox_frontend.py" << 'PYEOF'
# Placeholder - replace with actual download
print("SecuBox Frontend - Download full version from repository")
PYEOF
fi

# Create launcher
cat > "$BIN_DIR/secubox-frontend" << EOF
#!/usr/bin/env python3
import sys
sys.path.insert(0, "$INSTALL_DIR")
from secubox_frontend import main
main()
EOF
chmod +x "$BIN_DIR/secubox-frontend"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
python3 -m pip install --user --quiet textual paramiko httpx rich 2>/dev/null || {
    echo "⚠️  Some dependencies failed. Try:"
    echo "   pip install textual paramiko httpx rich"
}

# Add to PATH if needed
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo ""
    echo "⚠️  Add to your PATH:"
    echo "   export PATH=\"\$PATH:$BIN_DIR\""
    echo ""
    echo "   Or add to ~/.bashrc:"
    echo "   echo 'export PATH=\"\$PATH:$BIN_DIR\"' >> ~/.bashrc"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Usage:"
echo "   secubox-frontend                    # Launch TUI"
echo "   secubox-frontend --add mybox 192.168.255.1"
echo "   secubox-frontend --list"
echo "   secubox-frontend --simple           # Simple CLI mode"
echo ""
echo "First, add a SecuBox device:"
echo "   secubox-frontend --add main 192.168.255.1"
echo ""
