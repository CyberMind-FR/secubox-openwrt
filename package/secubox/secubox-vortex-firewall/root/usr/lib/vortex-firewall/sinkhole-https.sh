#!/bin/sh
#
# Vortex Sinkhole HTTPS Server
# Captures TLS connections to blocked domains
#
# Note: Requires socat with SSL support OR stunnel package
# Without SSL support, HTTPS connections to blocked domains will
# show certificate warnings instead of the sinkhole page.
#
# Usage: sinkhole-https.sh <bind_ip> <port>
#

BIND_IP="${1:-192.168.255.253}"
PORT="${2:-443}"
CERT_DIR="/etc/vortex-firewall"
CERT_FILE="$CERT_DIR/sinkhole.crt"
KEY_FILE="$CERT_DIR/sinkhole.key"
PID_FILE="/var/run/vortex-sinkhole-https.pid"

log() {
    logger -t vortex-sinkhole-https "$1"
}

# Check certificates exist
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    log "ERROR: Certificates not found. Run: vortex-firewall sinkhole gencert"
    exit 1
fi

log "Starting HTTPS sinkhole on $BIND_IP:$PORT"
echo $$ > "$PID_FILE"

# Cleanup on exit
cleanup() {
    log "Stopping HTTPS sinkhole"
    rm -f "$PID_FILE"
    exit 0
}
trap cleanup INT TERM

# Check if socat has SSL support
if socat -h 2>&1 | grep -q "openssl"; then
    log "Using socat with SSL support"
    exec socat -T 30 \
        OPENSSL-LISTEN:$PORT,bind=$BIND_IP,reuseaddr,fork,cert=$CERT_FILE,key=$KEY_FILE,verify=0 \
        EXEC:"/usr/lib/vortex-firewall/sinkhole-http-handler.sh",sigint,sigterm
fi

# Check if stunnel is available
if command -v stunnel >/dev/null 2>&1; then
    log "Using stunnel for HTTPS"
    # Create stunnel config
    STUNNEL_CONF="/tmp/vortex-stunnel.conf"
    cat > "$STUNNEL_CONF" <<EOF
pid = /var/run/vortex-stunnel.pid
[vortex-sinkhole]
accept = $BIND_IP:$PORT
connect = 127.0.0.1:10443
cert = $CERT_FILE
key = $KEY_FILE
EOF
    # Start local HTTP handler
    socat TCP-LISTEN:10443,bind=127.0.0.1,reuseaddr,fork \
        EXEC:"/usr/lib/vortex-firewall/sinkhole-http-handler.sh" &
    exec stunnel "$STUNNEL_CONF"
fi

# Fallback: No HTTPS support available
log "WARNING: No SSL termination available (install socat-openssl or stunnel)"
log "HTTPS blocked domains will show certificate warnings"

# Keep running to indicate service is "active" but limited
while true; do
    sleep 3600
done
