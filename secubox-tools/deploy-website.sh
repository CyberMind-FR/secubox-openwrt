#!/usr/bin/env bash
# Deploy SecuBox website to an OpenWrt router.
# Usage: ./secubox-tools/deploy-website.sh [root@192.168.1.1] [/path/to/website]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ROUTER_HOST="${1:-root@192.168.8.191}"
WEBSITE_PATH="${2:-}"
TARGET_DIR="/www/luci-static/secubox"

# Determine website source path
if [[ -z "$WEBSITE_PATH" ]]; then
  # Check common locations
  COMMON_PATHS=(
    "$REPO_ROOT/../secubox-website"
    "$HOME/CyberMindStudio/_files/secubox-website"
    "./secubox-website"
  )

  for path in "${COMMON_PATHS[@]}"; do
    if [[ -d "$path" ]]; then
      WEBSITE_PATH="$path"
      break
    fi
  done

  if [[ -z "$WEBSITE_PATH" ]]; then
    echo "ERROR: Website directory not found. Please specify path as second argument." >&2
    echo "Usage: $0 [router_host] [website_path]" >&2
    exit 1
  fi
fi

if [[ ! -d "$WEBSITE_PATH" ]]; then
  echo "ERROR: Website directory not found: $WEBSITE_PATH" >&2
  exit 1
fi

echo "[1/4] Preparing website files from $WEBSITE_PATH…" >&2

# Create tarball excluding unnecessary files
TARBALL="/tmp/secubox-website-$(date +%s).tar.gz"
(cd "$WEBSITE_PATH" && tar czf "$TARBALL" \
  --exclude='.git' \
  --exclude='.claude' \
  --exclude='*.md' \
  --exclude='.gitignore' \
  --exclude='README*' \
  --exclude='LICENSE' \
  .)

echo "[2/4] Uploading website files to $ROUTER_HOST:$TARGET_DIR/" >&2
scp "$TARBALL" "${ROUTER_HOST}:/tmp/secubox-website.tar.gz"

echo "[3/4] Deploying website on router…" >&2
ssh "$ROUTER_HOST" "sh -s" <<EOF
set -e

# Create target directory
mkdir -p "$TARGET_DIR"

# Backup existing website if present
if [ -d "$TARGET_DIR" ] && [ "\$(ls -A $TARGET_DIR)" ]; then
  BACKUP_DIR="/tmp/secubox-website-backup-\$(date +%s)"
  echo "[router] Creating backup at \$BACKUP_DIR…" >&2
  mkdir -p "\$BACKUP_DIR"
  cp -a "$TARGET_DIR"/* "\$BACKUP_DIR/" 2>/dev/null || true
fi

# Extract new website
echo "[router] Extracting website files…" >&2
cd "$TARGET_DIR"
tar xzf /tmp/secubox-website.tar.gz

# Set proper permissions
chmod 755 "$TARGET_DIR"
find "$TARGET_DIR" -type d -exec chmod 755 {} \;
find "$TARGET_DIR" -type f -name "*.html" -exec chmod 644 {} \;
find "$TARGET_DIR" -type f -name "*.js" -exec chmod 644 {} \;
find "$TARGET_DIR" -type f -name "*.css" -exec chmod 644 {} \; 2>/dev/null || true

# Clean up
rm -f /tmp/secubox-website.tar.gz

echo "[router] Website deployed to $TARGET_DIR"
echo "[router] Access URL: http://\$(uci get network.lan.ipaddress 2>/dev/null || echo 'router-ip')/luci-static/secubox/"
EOF

echo "[4/4] Cleaning up local tarball…" >&2
rm -f "$TARBALL"

echo ""
echo "✓ Website deployment completed successfully!"
echo "  Target: $ROUTER_HOST:$TARGET_DIR"
echo "  Files: $(find "$WEBSITE_PATH" -type f \( -name "*.html" -o -name "*.js" \) | wc -l) files deployed"
echo ""
