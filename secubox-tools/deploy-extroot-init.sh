#!/bin/bash
# Deploy SecuBox Extroot init.d script to router
# Usage: ./deploy-extroot-init.sh [ROUTER_IP]

ROUTER_IP="${1:-192.168.255.1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Deploying secubox-extroot to $ROUTER_IP..."

# Deploy the init script
cat "$SCRIPT_DIR/../package/secubox/secubox-core/files/etc/init.d/secubox-extroot" | \
ssh root@$ROUTER_IP 'cat > /etc/init.d/secubox-extroot && chmod 755 /etc/init.d/secubox-extroot'

# Enable and run setup
ssh root@$ROUTER_IP '
/etc/init.d/secubox-extroot enable
/etc/init.d/secubox-extroot setup
/etc/init.d/secubox-extroot status
'

echo ""
echo "Done! If setup was successful, reboot to activate extroot:"
echo "  ssh root@$ROUTER_IP reboot"
