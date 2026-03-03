#!/bin/sh
#
# Vortex Sinkhole HTTP Server
# Captures malware/phishing connections for analysis
#
# Usage: sinkhole-http.sh <bind_ip> <port>
#

BIND_IP="${1:-192.168.255.253}"
PORT="${2:-80}"
SINKHOLE_HTML="/usr/share/vortex-firewall/sinkhole.html"
BLOCKLIST_DB="/var/lib/vortex-firewall/blocklist.db"

# Log function
log() {
    logger -t vortex-sinkhole-http "$1"
}

# Get warning page HTML
get_warning_page() {
    local domain="$1"
    local client_ip="$2"
    local threat_type="$3"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")

    if [ -f "$SINKHOLE_HTML" ]; then
        # Substitute placeholders
        sed -e "s|{{DOMAIN}}|$domain|g" \
            -e "s|{{CLIENT_IP}}|$client_ip|g" \
            -e "s|{{THREAT_TYPE}}|$threat_type|g" \
            -e "s|{{TIMESTAMP}}|$timestamp|g" \
            "$SINKHOLE_HTML"
    else
        # Inline fallback
        cat <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Connection Blocked - Vortex DNS Firewall</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 40px 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { max-width: 600px; background: #1e293b; border-radius: 16px; padding: 40px; text-align: center; border: 1px solid #334155; }
        .shield { font-size: 64px; margin-bottom: 24px; }
        h1 { color: #f87171; margin: 0 0 16px 0; font-size: 28px; }
        .domain { background: #0f172a; padding: 12px 20px; border-radius: 8px; font-family: monospace; color: #f87171; font-size: 18px; margin: 20px 0; word-break: break-all; }
        .threat-badge { display: inline-block; padding: 6px 14px; background: #dc2626; color: white; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 16px 0; }
        .info { color: #94a3b8; line-height: 1.6; margin: 20px 0; }
        .details { background: #0f172a; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 12px; color: #64748b; text-align: left; }
        .details code { color: #38bdf8; }
        .footer { margin-top: 24px; color: #475569; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="shield">&#128737;</div>
        <h1>Connection Blocked</h1>
        <div class="domain">$domain</div>
        <div class="threat-badge">$threat_type</div>
        <p class="info">
            This connection was blocked by <strong>Vortex DNS Firewall</strong> because the domain
            has been identified as malicious or potentially harmful.
        </p>
        <div class="details">
            <p><strong>Block Details:</strong></p>
            <p>Domain: <code>$domain</code></p>
            <p>Category: <code>$threat_type</code></p>
            <p>Client IP: <code>$client_ip</code></p>
            <p>Timestamp: <code>$timestamp</code></p>
        </div>
        <p class="footer">SecuBox Vortex DNS Firewall</p>
    </div>
</body>
</html>
EOF
    fi
}

# Get threat type for domain
get_threat_type() {
    local domain="$1"
    if [ -f "$BLOCKLIST_DB" ]; then
        sqlite3 "$BLOCKLIST_DB" "SELECT threat_type FROM domains WHERE domain='$domain' LIMIT 1;" 2>/dev/null || echo "malicious"
    else
        echo "malicious"
    fi
}

# Handle HTTP request
handle_request() {
    local client_ip="$1"

    # Read HTTP request
    local request=""
    local host=""
    local method=""
    local path=""
    local headers=""

    # Read first line (GET /path HTTP/1.1)
    read -r line
    method=$(echo "$line" | awk '{print $1}')
    path=$(echo "$line" | awk '{print $2}')
    request="$line"

    # Read headers until empty line
    while read -r line; do
        line=$(echo "$line" | tr -d '\r')
        [ -z "$line" ] && break
        headers="$headers$line\n"

        # Extract Host header
        case "$line" in
            Host:*|host:*)
                host=$(echo "$line" | cut -d':' -f2 | tr -d ' ')
                ;;
        esac
    done

    # Default host if not found
    [ -z "$host" ] && host="unknown"

    # Get threat type
    local threat_type=$(get_threat_type "$host")

    # Record event
    /usr/sbin/vortex-firewall sinkhole record "$client_ip" "$host" "http" "$method $path" >/dev/null 2>&1 &

    # Log
    log "Captured: $client_ip -> $host ($method $path) [$threat_type]"

    # Generate response
    local body=$(get_warning_page "$host" "$client_ip" "$threat_type")
    local body_len=${#body}

    # Send HTTP response
    printf "HTTP/1.1 403 Forbidden\r\n"
    printf "Content-Type: text/html; charset=utf-8\r\n"
    printf "Content-Length: %d\r\n" "$body_len"
    printf "Connection: close\r\n"
    printf "X-Vortex-Blocked: %s\r\n" "$host"
    printf "Cache-Control: no-store, no-cache\r\n"
    printf "\r\n"
    printf "%s" "$body"
}

# Main loop using socat
log "Starting HTTP sinkhole on $BIND_IP:$PORT"

exec socat -T 30 TCP-LISTEN:$PORT,bind=$BIND_IP,reuseaddr,fork EXEC:"/usr/lib/vortex-firewall/sinkhole-http-handler.sh",sigint,sigterm
