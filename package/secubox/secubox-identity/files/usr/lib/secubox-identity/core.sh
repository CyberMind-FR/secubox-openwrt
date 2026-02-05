#!/bin/sh
# SecuBox Identity Core - DID generation and management

. /lib/functions.sh

IDENTITY_DIR="/var/lib/secubox-identity"
DID_FILE="$IDENTITY_DIR/did.txt"
IDENTITY_DOC="$IDENTITY_DIR/identity.json"

# Initialize identity storage
identity_core_init() {
    mkdir -p "$IDENTITY_DIR"
    chmod 700 "$IDENTITY_DIR"
}

# Generate fingerprint from machine identity
_generate_fingerprint() {
    local machine_id mac_addr seed

    # Try multiple sources for unique machine identity
    if [ -f /etc/machine-id ]; then
        machine_id=$(cat /etc/machine-id)
    elif [ -f /var/lib/dbus/machine-id ]; then
        machine_id=$(cat /var/lib/dbus/machine-id)
    else
        # Generate from hostname + uptime
        machine_id=$(hostname)$(cat /proc/uptime | cut -d' ' -f1)
    fi

    # Get primary MAC address
    mac_addr=$(cat /sys/class/net/br-lan/address 2>/dev/null || \
               cat /sys/class/net/eth0/address 2>/dev/null || \
               cat /sys/class/net/en*/address 2>/dev/null | head -1 || \
               echo "00:00:00:00:00:00")

    # Combine with constant salt
    seed="${machine_id}:${mac_addr}:secubox-identity-v1"

    # Generate 16-character fingerprint
    echo -n "$seed" | openssl sha256 | cut -d' ' -f2 | cut -c1-16
}

# Generate DID (Decentralized Identifier)
# Format: did:plc:<16-char-fingerprint>
did_generate() {
    local method
    method=$(uci -q get identity.main.did_method || echo "plc")

    local fingerprint
    fingerprint=$(_generate_fingerprint)

    echo "did:$method:$fingerprint"
}

# Get or create node DID
did_get() {
    if [ -f "$DID_FILE" ]; then
        cat "$DID_FILE"
    else
        local did
        did=$(did_generate)
        echo "$did" > "$DID_FILE"
        chmod 600 "$DID_FILE"
        logger -t secubox-identity "Generated new DID: $did"
        echo "$did"
    fi
}

# Get just the fingerprint portion of DID
did_fingerprint() {
    local did
    did=$(did_get)
    echo "$did" | sed 's/did:[^:]*://'
}

# Validate DID format
did_validate() {
    local did="$1"

    # Check format: did:<method>:<identifier>
    if echo "$did" | grep -qE '^did:[a-z]+:[a-zA-Z0-9]+$'; then
        return 0
    else
        return 1
    fi
}

# Extract method from DID
did_method() {
    local did="$1"
    echo "$did" | cut -d':' -f2
}

# Extract identifier from DID
did_identifier() {
    local did="$1"
    echo "$did" | cut -d':' -f3
}

# Create identity document (DID Document)
identity_create_document() {
    local did hostname version created

    did=$(did_get)
    hostname=$(uci -q get system.@system[0].hostname || echo "secubox")
    version=$(cat /etc/secubox-version 2>/dev/null || echo "unknown")
    created=$(date -Iseconds)

    # Get network addresses
    local lan_ip wan_ip wg_ip
    lan_ip=$(uci -q get network.lan.ipaddr || echo "")
    wan_ip=$(curl -s --connect-timeout 5 https://api.ipify.org 2>/dev/null || echo "")
    wg_ip=$(ip addr show wg0 2>/dev/null | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1 || echo "")

    # Get public keys
    local keys="[]"
    if [ -f /usr/lib/secubox-identity/keys.sh ]; then
        . /usr/lib/secubox-identity/keys.sh
        keys=$(keys_list_public)
    fi

    cat > "$IDENTITY_DOC" <<EOF
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "$did",
  "controller": "$did",
  "hostname": "$hostname",
  "version": "$version",
  "created": "$created",
  "verificationMethod": $keys,
  "service": [
    {
      "id": "${did}#p2p",
      "type": "SecuBoxP2P",
      "serviceEndpoint": "http://${lan_ip:-0.0.0.0}:7331"
    },
    {
      "id": "${did}#mirrornet",
      "type": "MirrorNet",
      "serviceEndpoint": "http://${lan_ip:-0.0.0.0}:7332"
    }
  ],
  "addresses": {
    "lan": "$lan_ip",
    "wan": "$wan_ip",
    "wireguard": "$wg_ip"
  }
}
EOF

    chmod 644 "$IDENTITY_DOC"
    cat "$IDENTITY_DOC"
}

# Get identity document
identity_get_document() {
    if [ -f "$IDENTITY_DOC" ]; then
        cat "$IDENTITY_DOC"
    else
        identity_create_document
    fi
}

# Refresh identity document (update addresses, keys)
identity_refresh() {
    identity_create_document >/dev/null
    logger -t secubox-identity "Identity document refreshed"
}

# Resolve DID to identity document (for known peers)
did_resolve() {
    local did="$1"
    local peers_dir="$IDENTITY_DIR/peers"

    if ! did_validate "$did"; then
        echo '{"error": "Invalid DID format"}'
        return 1
    fi

    local identifier
    identifier=$(did_identifier "$did")
    local peer_file="$peers_dir/$identifier.json"

    if [ -f "$peer_file" ]; then
        cat "$peer_file"
    else
        echo '{"error": "DID not found"}'
        return 1
    fi
}

# Store peer identity document
identity_store_peer() {
    local did="$1"
    local document="$2"
    local peers_dir="$IDENTITY_DIR/peers"

    mkdir -p "$peers_dir"

    if ! did_validate "$did"; then
        echo "Invalid DID format: $did" >&2
        return 1
    fi

    local identifier
    identifier=$(did_identifier "$did")

    echo "$document" > "$peers_dir/$identifier.json"
    logger -t secubox-identity "Stored identity for $did"

    echo "$identifier"
}

# List known peer identities
identity_list_peers() {
    local peers_dir="$IDENTITY_DIR/peers"

    echo "["
    local first=1
    for peer_file in "$peers_dir"/*.json 2>/dev/null; do
        [ -f "$peer_file" ] || continue
        [ "$first" = "1" ] || echo ","
        cat "$peer_file"
        first=0
    done
    echo "]"
}

# Remove peer identity
identity_remove_peer() {
    local identifier="$1"
    local peer_file="$IDENTITY_DIR/peers/$identifier.json"

    if [ -f "$peer_file" ]; then
        rm -f "$peer_file"
        logger -t secubox-identity "Removed identity for $identifier"
        return 0
    else
        return 1
    fi
}

# Export identity for backup
identity_export() {
    local export_file="$1"

    if [ -z "$export_file" ]; then
        export_file="/tmp/secubox-identity-backup.tar.gz"
    fi

    tar -czf "$export_file" -C "$IDENTITY_DIR" . 2>/dev/null
    echo "$export_file"
}

# Import identity from backup
identity_import() {
    local import_file="$1"

    if [ ! -f "$import_file" ]; then
        echo "Import file not found: $import_file" >&2
        return 1
    fi

    # Backup current identity
    local backup_dir="$IDENTITY_DIR.backup.$(date +%s)"
    mv "$IDENTITY_DIR" "$backup_dir"
    mkdir -p "$IDENTITY_DIR"

    tar -xzf "$import_file" -C "$IDENTITY_DIR" 2>/dev/null
    if [ $? -eq 0 ]; then
        rm -rf "$backup_dir"
        logger -t secubox-identity "Identity imported from $import_file"
        return 0
    else
        rm -rf "$IDENTITY_DIR"
        mv "$backup_dir" "$IDENTITY_DIR"
        echo "Import failed" >&2
        return 1
    fi
}

# Initialize on source
identity_core_init
