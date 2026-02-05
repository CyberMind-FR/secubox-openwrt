#!/bin/sh
# MirrorNet Identity Management - DID-based identity system
# did:plc:<fingerprint> compatible

. /lib/functions.sh

IDENTITY_DIR="/var/lib/mirrornet/identity"
KEYS_DIR="$IDENTITY_DIR/keys"

# Initialize identity storage
identity_init() {
    mkdir -p "$IDENTITY_DIR" "$KEYS_DIR"
    chmod 700 "$KEYS_DIR"
}

# Generate node DID (Decentralized Identifier)
# Format: did:plc:<16-char-fingerprint>
identity_generate_did() {
    local fingerprint

    # Use factory fingerprint if available
    if [ -f /usr/lib/secubox/factory.sh ]; then
        . /usr/lib/secubox/factory.sh
        fingerprint=$(factory_fingerprint 2>/dev/null)
    fi

    # Fallback: generate from machine-id + MAC
    if [ -z "$fingerprint" ]; then
        local machine_id mac_addr seed
        machine_id=$(cat /etc/machine-id 2>/dev/null || echo "unknown")
        mac_addr=$(cat /sys/class/net/br-lan/address 2>/dev/null || \
                   cat /sys/class/net/eth0/address 2>/dev/null || echo "00:00:00:00:00:00")
        seed="${machine_id}:${mac_addr}:mirrornet"
        fingerprint=$(echo -n "$seed" | openssl sha256 | cut -d' ' -f2 | cut -c1-16)
    fi

    echo "did:plc:$fingerprint"
}

# Get current node DID
identity_get_did() {
    local did_file="$IDENTITY_DIR/did.txt"

    if [ -f "$did_file" ]; then
        cat "$did_file"
    else
        local did
        did=$(identity_generate_did)
        echo "$did" > "$did_file"
        echo "$did"
    fi
}

# Generate signing keypair (HMAC-based for OpenWrt compatibility)
identity_generate_keypair() {
    local key_id="${1:-primary}"
    local key_file="$KEYS_DIR/$key_id.key"
    local pub_file="$KEYS_DIR/$key_id.pub"

    if [ -f "$key_file" ]; then
        echo "Key '$key_id' already exists"
        return 1
    fi

    # Generate 256-bit random key
    local private_key
    private_key=$(openssl rand -hex 32)

    # Derive public key hash (for verification)
    local public_hash
    public_hash=$(echo -n "$private_key" | openssl sha256 | cut -d' ' -f2)

    # Store keys
    echo "$private_key" > "$key_file"
    chmod 600 "$key_file"

    local did
    did=$(identity_get_did)
    cat > "$pub_file" <<EOF
{
  "id": "$key_id",
  "did": "$did",
  "type": "HMAC-SHA256",
  "publicKeyHash": "$public_hash",
  "created": "$(date -Iseconds)"
}
EOF

    echo "$pub_file"
}

# Get public key info
identity_get_pubkey() {
    local key_id="${1:-primary}"
    local pub_file="$KEYS_DIR/$key_id.pub"

    if [ -f "$pub_file" ]; then
        cat "$pub_file"
    else
        echo "{\"error\": \"Key not found\"}"
        return 1
    fi
}

# Sign data with private key
identity_sign() {
    local data="$1"
    local key_id="${2:-primary}"
    local key_file="$KEYS_DIR/$key_id.key"

    if [ ! -f "$key_file" ]; then
        echo "Key not found: $key_id" >&2
        return 1
    fi

    local private_key
    private_key=$(cat "$key_file")

    # HMAC-SHA256 signature
    echo -n "$data" | openssl dgst -sha256 -hmac "$private_key" | cut -d' ' -f2
}

# Verify signature (requires shared secret or pre-exchanged public key hash)
identity_verify() {
    local data="$1"
    local signature="$2"
    local key_id="${3:-primary}"
    local key_file="$KEYS_DIR/$key_id.key"

    if [ ! -f "$key_file" ]; then
        echo "Key not found: $key_id" >&2
        return 1
    fi

    local private_key expected_sig
    private_key=$(cat "$key_file")
    expected_sig=$(echo -n "$data" | openssl dgst -sha256 -hmac "$private_key" | cut -d' ' -f2)

    if [ "$signature" = "$expected_sig" ]; then
        return 0
    else
        return 1
    fi
}

# Rotate key (backup old, generate new)
identity_rotate_key() {
    local key_id="${1:-primary}"
    local key_file="$KEYS_DIR/$key_id.key"
    local pub_file="$KEYS_DIR/$key_id.pub"

    if [ -f "$key_file" ]; then
        local timestamp
        timestamp=$(date +%Y%m%d%H%M%S)
        mv "$key_file" "$KEYS_DIR/${key_id}.key.backup.$timestamp"
        mv "$pub_file" "$KEYS_DIR/${key_id}.pub.backup.$timestamp" 2>/dev/null
        logger -t mirrornet "Key '$key_id' rotated, backup created"
    fi

    identity_generate_keypair "$key_id"
}

# Export identity document (for mesh sharing)
identity_export() {
    local did
    did=$(identity_get_did)

    local pubkeys="[]"
    if [ -d "$KEYS_DIR" ]; then
        pubkeys="["
        local first=1
        for pub_file in "$KEYS_DIR"/*.pub; do
            [ -f "$pub_file" ] || continue
            [ "$first" = "1" ] || pubkeys="$pubkeys,"
            pubkeys="$pubkeys$(cat "$pub_file")"
            first=0
        done
        pubkeys="$pubkeys]"
    fi

    local hostname version
    hostname=$(uci -q get system.@system[0].hostname || echo "secubox")
    version=$(cat /etc/secubox-version 2>/dev/null || echo "unknown")

    cat <<EOF
{
  "did": "$did",
  "hostname": "$hostname",
  "version": "$version",
  "keys": $pubkeys,
  "endpoints": {
    "p2p": "http://$(uci -q get network.lan.ipaddr || echo "0.0.0.0"):7331",
    "mirrornet": "http://$(uci -q get network.lan.ipaddr || echo "0.0.0.0"):7332"
  },
  "created": "$(date -Iseconds)"
}
EOF
}

# Import peer identity document
identity_import_peer() {
    local doc="$1"
    local peer_dir="$IDENTITY_DIR/peers"
    mkdir -p "$peer_dir"

    local did
    did=$(echo "$doc" | jsonfilter -e '@.did' 2>/dev/null)

    if [ -z "$did" ]; then
        echo "Invalid identity document" >&2
        return 1
    fi

    # Extract fingerprint from DID
    local fingerprint
    fingerprint=$(echo "$did" | sed 's/did:plc://')

    echo "$doc" > "$peer_dir/$fingerprint.json"
    logger -t mirrornet "Imported identity for $did"

    echo "$fingerprint"
}

# Get peer identity
identity_get_peer() {
    local fingerprint="$1"
    local peer_file="$IDENTITY_DIR/peers/$fingerprint.json"

    if [ -f "$peer_file" ]; then
        cat "$peer_file"
    else
        echo "{\"error\": \"Peer not found\"}"
        return 1
    fi
}

# List known peer identities
identity_list_peers() {
    local peer_dir="$IDENTITY_DIR/peers"

    echo "["
    local first=1
    for peer_file in "$peer_dir"/*.json 2>/dev/null; do
        [ -f "$peer_file" ] || continue
        [ "$first" = "1" ] || echo ","
        cat "$peer_file"
        first=0
    done
    echo "]"
}

# Initialize on source
identity_init
