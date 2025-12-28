#!/usr/bin/env bash
# Deploy luci-app-network-modes to an OpenWrt router.
# Usage: ./secubox-tools/deploy-network-modes.sh [root@192.168.1.1] [package.ipk]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ROUTER_HOST="${1:-root@192.168.1.1}"
PACKAGE_PATH="${2:-}"

if [[ -z "$PACKAGE_PATH" ]]; then
  echo "[1/4] Building luci-app-network-modes…" >&2
  (cd "$REPO_ROOT" && ./secubox-tools/local-build.sh build luci-app-network-modes)

  echo "[2/4] Locating IPK artifact…" >&2
  mapfile -t PKGS < <(cd "$REPO_ROOT" && find bin -type f -name 'luci-app-network-modes_*_all.ipk' -print 2>/dev/null | sort)
  if [[ "${#PKGS[@]}" -eq 0 ]]; then
    echo "ERROR: No luci-app-network-modes IPK found under bin/. Build step may have failed." >&2
    exit 1
  fi
  PACKAGE_PATH="${PKGS[-1]}"
fi

if [[ ! -f "$PACKAGE_PATH" ]]; then
  echo "ERROR: Package file not found: $PACKAGE_PATH" >&2
  exit 1
fi

PACKAGE_PATH="$(cd "$(dirname "$PACKAGE_PATH")" && pwd)/$(basename "$PACKAGE_PATH")"
PKG_NAME="$(basename "$PACKAGE_PATH")"

echo "[3/4] Uploading $PKG_NAME to $ROUTER_HOST:/tmp/" >&2
scp "$PACKAGE_PATH" "${ROUTER_HOST}:/tmp/$PKG_NAME"

echo "[4/4] Installing on router and restarting services…" >&2
ssh "$ROUTER_HOST" "sh -s" <<EOF
set -e
PKG="/tmp/$PKG_NAME"
if command -v apk >/dev/null 2>&1; then
  echo "[router] Detected apk – ensuring package database…" >&2
  apk add --allow-untrusted "\$PKG"
else
  echo "[router] Using opkg…" >&2
  opkg remove luci-app-network-modes --force-depends >/dev/null 2>&1 || true
  opkg install "\$PKG"
fi

chmod 755 /usr/libexec/rpcd/luci.network-modes || true
chmod 644 /www/luci-static/resources/network-modes/* 2>/dev/null || true
rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* 2>/dev/null || true
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart

echo "[router] Deployment complete."
EOF

echo "Deployment completed successfully."
