#!/bin/sh
#
# Vortex Sinkhole HTTP Handler
# Called by socat for each connection
#

SINKHOLE_HTML="/usr/share/vortex-firewall/sinkhole.html"
BLOCKLIST_DB="/var/lib/vortex-firewall/blocklist.db"

# Get client IP from SOCAT environment
CLIENT_IP="${SOCAT_PEERADDR:-unknown}"

# Get threat type for domain
get_threat_type() {
    local domain="$1"
    if [ -f "$BLOCKLIST_DB" ]; then
        sqlite3 "$BLOCKLIST_DB" "SELECT threat_type FROM domains WHERE domain='$domain' LIMIT 1;" 2>/dev/null || echo "malicious"
    else
        echo "malicious"
    fi
}

# Read HTTP request
request=""
host=""
method=""
path=""
user_agent=""

# Read first line
read -r line
method=$(echo "$line" | awk '{print $1}')
path=$(echo "$line" | awk '{print $2}')

# Read headers until empty line
while read -r line; do
    line=$(echo "$line" | tr -d '\r')
    [ -z "$line" ] && break

    case "$line" in
        Host:*|host:*)
            host=$(echo "$line" | cut -d':' -f2- | tr -d ' ' | cut -d':' -f1)
            ;;
        User-Agent:*|user-agent:*)
            user_agent=$(echo "$line" | cut -d':' -f2-)
            ;;
    esac
done

# Default host if not found
[ -z "$host" ] && host="unknown"

# Get threat type
threat_type=$(get_threat_type "$host")
timestamp=$(date "+%Y-%m-%d %H:%M:%S")

# Record event (background to not delay response)
/usr/sbin/vortex-firewall sinkhole record "$CLIENT_IP" "$host" "http" "$method $path" >/dev/null 2>&1 &

# Log
logger -t vortex-sinkhole "HTTP: $CLIENT_IP -> $host ($method $path) [$threat_type]"

# Generate warning page
body=$(cat <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Connection Blocked - Vortex DNS Firewall</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #e2e8f0; margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { max-width: 560px; width: 100%; background: rgba(30, 41, 59, 0.95); border-radius: 20px; padding: 48px 40px; text-align: center; border: 1px solid rgba(99, 102, 241, 0.2); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .shield { width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 40px; box-shadow: 0 0 40px rgba(239, 68, 68, 0.4); }
        h1 { color: #f87171; margin: 0 0 12px 0; font-size: 26px; font-weight: 700; }
        .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
        .domain-box { background: rgba(15, 23, 42, 0.8); padding: 16px 24px; border-radius: 12px; font-family: 'SF Mono', Consolas, monospace; color: #f87171; font-size: 16px; margin: 24px 0; word-break: break-all; border: 1px solid rgba(248, 113, 113, 0.2); }
        .threat-badge { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; border-radius: 24px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .threat-badge::before { content: "\\26A0"; }
        .info { color: #94a3b8; line-height: 1.7; margin: 28px 0; font-size: 14px; }
        .info strong { color: #38bdf8; }
        .details { background: rgba(15, 23, 42, 0.6); border-radius: 12px; padding: 20px; margin-top: 28px; font-size: 12px; color: #64748b; text-align: left; border: 1px solid rgba(51, 65, 85, 0.5); }
        .details-title { color: #94a3b8; font-weight: 600; margin-bottom: 12px; font-size: 13px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(51, 65, 85, 0.3); }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #64748b; }
        .detail-value { color: #38bdf8; font-family: 'SF Mono', Consolas, monospace; }
        .footer { margin-top: 32px; color: #475569; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .footer-logo { width: 16px; height: 16px; background: #6366f1; border-radius: 4px; }
        @media (max-width: 480px) { .container { padding: 32px 24px; } h1 { font-size: 22px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="shield">&#128737;</div>
        <h1>Connection Blocked</h1>
        <p class="subtitle">Vortex DNS Firewall has intercepted a potentially dangerous connection</p>
        <div class="domain-box">$host</div>
        <span class="threat-badge">$threat_type</span>
        <p class="info">
            This domain has been identified as <strong>malicious</strong> by our threat intelligence feeds.
            The connection was blocked to protect your device from potential harm.
        </p>
        <div class="details">
            <div class="details-title">Block Details</div>
            <div class="detail-row">
                <span class="detail-label">Domain</span>
                <span class="detail-value">$host</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Category</span>
                <span class="detail-value">$threat_type</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Your IP</span>
                <span class="detail-value">$CLIENT_IP</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Timestamp</span>
                <span class="detail-value">$timestamp</span>
            </div>
        </div>
        <p class="footer">
            <span class="footer-logo"></span>
            SecuBox Vortex DNS Firewall
        </p>
    </div>
</body>
</html>
EOF
)

body_len=${#body}

# Send HTTP response
printf "HTTP/1.1 403 Forbidden\r\n"
printf "Content-Type: text/html; charset=utf-8\r\n"
printf "Content-Length: %d\r\n" "$body_len"
printf "Connection: close\r\n"
printf "X-Vortex-Blocked: %s\r\n" "$host"
printf "X-Threat-Type: %s\r\n" "$threat_type"
printf "Cache-Control: no-store, no-cache, must-revalidate\r\n"
printf "\r\n"
printf "%s" "$body"
