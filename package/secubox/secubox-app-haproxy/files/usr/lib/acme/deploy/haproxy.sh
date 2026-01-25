#!/bin/sh
# ACME deploy hook for HAProxy
# Combines fullchain + private key into single .pem file
# Usage: Called by acme.sh after certificate issuance/renewal

HAPROXY_CERTS_DIR="/srv/haproxy/certs"

# acme.sh passes these environment variables:
# DOMAIN - the domain name
# CERT_PATH - path to the domain certificate
# KEY_PATH - path to the domain private key
# CA_PATH - path to the intermediate CA certificate
# FULLCHAIN_PATH - path to the full chain certificate
# CERT_KEY_PATH - same as KEY_PATH

deploy() {
    local domain="$1"
    local key_path="$2"
    local cert_path="$3"
    local ca_path="$4"
    local fullchain_path="$5"

    [ -z "$domain" ] && { echo "Error: domain required"; return 1; }

    mkdir -p "$HAPROXY_CERTS_DIR"

    # Use fullchain if available, otherwise use cert + ca
    local combined_cert=""
    if [ -n "$fullchain_path" ] && [ -f "$fullchain_path" ]; then
        combined_cert="$fullchain_path"
    elif [ -n "$cert_path" ] && [ -f "$cert_path" ]; then
        combined_cert="$cert_path"
    else
        echo "Error: No certificate file found for $domain"
        return 1
    fi

    if [ -z "$key_path" ] || [ ! -f "$key_path" ]; then
        echo "Error: No key file found for $domain"
        return 1
    fi

    # Combine fullchain + private key for HAProxy
    echo "Deploying certificate for $domain to HAProxy..."
    cat "$combined_cert" "$key_path" > "$HAPROXY_CERTS_DIR/$domain.pem"
    chmod 600 "$HAPROXY_CERTS_DIR/$domain.pem"

    echo "Certificate deployed: $HAPROXY_CERTS_DIR/$domain.pem"

    # Reload HAProxy if running
    if [ -x /etc/init.d/haproxy ]; then
        /etc/init.d/haproxy reload 2>/dev/null || true
    fi

    return 0
}

# Entry point for acme.sh deploy hook
deploy "$Le_Domain" "$CERT_KEY_PATH" "$CERT_PATH" "$CA_CERT_PATH" "$CERT_FULLCHAIN_PATH"
