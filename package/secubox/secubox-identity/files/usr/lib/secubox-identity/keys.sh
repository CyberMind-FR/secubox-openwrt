#!/bin/sh
# SecuBox Identity Keys - Cryptographic key management

. /lib/functions.sh

KEYS_DIR="/var/lib/secubox-identity/keys"

# Initialize keys storage
keys_init() {
    mkdir -p "$KEYS_DIR"
    chmod 700 "$KEYS_DIR"
}

# Generate new keypair
keys_generate() {
    local key_id="${1:-primary}"
    local algorithm
    algorithm=$(uci -q get identity.keys.algorithm || echo "hmac-sha256")

    local key_file="$KEYS_DIR/$key_id.key"
    local pub_file="$KEYS_DIR/$key_id.pub"

    if [ -f "$key_file" ]; then
        echo "Key '$key_id' already exists. Use 'rotate' to replace." >&2
        return 1
    fi

    case "$algorithm" in
        hmac-sha256)
            # Generate 256-bit random key
            local private_key
            private_key=$(openssl rand -hex 32)
            echo "$private_key" > "$key_file"
            chmod 600 "$key_file"

            # Derive public key hash
            local public_hash
            public_hash=$(echo -n "$private_key" | openssl sha256 | cut -d' ' -f2)
            ;;

        ed25519)
            # Try to use Ed25519 if available
            if openssl genpkey -algorithm ed25519 -out "$key_file" 2>/dev/null; then
                chmod 600 "$key_file"
                openssl pkey -in "$key_file" -pubout -out "$pub_file.pem" 2>/dev/null
                public_hash=$(openssl pkey -in "$key_file" -pubout -outform DER 2>/dev/null | openssl sha256 | cut -d' ' -f2)
            else
                echo "Ed25519 not available, falling back to HMAC" >&2
                local private_key
                private_key=$(openssl rand -hex 32)
                echo "$private_key" > "$key_file"
                chmod 600 "$key_file"
                public_hash=$(echo -n "$private_key" | openssl sha256 | cut -d' ' -f2)
                algorithm="hmac-sha256"
            fi
            ;;

        *)
            echo "Unknown algorithm: $algorithm" >&2
            return 1
            ;;
    esac

    # Get DID
    local did=""
    if [ -f /usr/lib/secubox-identity/core.sh ]; then
        . /usr/lib/secubox-identity/core.sh
        did=$(did_get)
    fi

    # Create public key document
    cat > "$pub_file" <<EOF
{
  "id": "${did}#$key_id",
  "type": "$(echo $algorithm | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' | tr -d ' ')VerificationKey",
  "controller": "$did",
  "publicKeyHash": "$public_hash",
  "algorithm": "$algorithm",
  "created": "$(date -Iseconds)"
}
EOF

    logger -t secubox-identity "Generated key '$key_id' using $algorithm"
    echo "$pub_file"
}

# Get private key (internal use only)
keys_get_private() {
    local key_id="${1:-primary}"
    local key_file="$KEYS_DIR/$key_id.key"

    if [ -f "$key_file" ]; then
        cat "$key_file"
    else
        return 1
    fi
}

# Get public key info
keys_get_public() {
    local key_id="${1:-primary}"
    local pub_file="$KEYS_DIR/$key_id.pub"

    if [ -f "$pub_file" ]; then
        cat "$pub_file"
    else
        echo '{"error": "Key not found"}'
        return 1
    fi
}

# List all public keys
keys_list_public() {
    echo "["
    local first=1
    for pub_file in "$KEYS_DIR"/*.pub 2>/dev/null; do
        [ -f "$pub_file" ] || continue
        [ "$first" = "1" ] || echo ","
        cat "$pub_file"
        first=0
    done
    echo "]"
}

# List all key IDs
keys_list() {
    for key_file in "$KEYS_DIR"/*.key 2>/dev/null; do
        [ -f "$key_file" ] || continue
        basename "$key_file" .key
    done
}

# Sign data with private key
keys_sign() {
    local data="$1"
    local key_id="${2:-primary}"

    local private_key
    private_key=$(keys_get_private "$key_id")

    if [ -z "$private_key" ]; then
        echo "Key not found: $key_id" >&2
        return 1
    fi

    # Check if this is a raw HMAC key or PEM file
    if echo "$private_key" | grep -q "BEGIN"; then
        # PEM format (Ed25519)
        echo -n "$data" | openssl pkeyutl -sign -inkey "$KEYS_DIR/$key_id.key" 2>/dev/null | base64 -w 0
    else
        # HMAC key
        echo -n "$data" | openssl dgst -sha256 -hmac "$private_key" | cut -d' ' -f2
    fi
}

# Verify signature
keys_verify() {
    local data="$1"
    local signature="$2"
    local key_id="${3:-primary}"

    local private_key
    private_key=$(keys_get_private "$key_id")

    if [ -z "$private_key" ]; then
        echo "Key not found: $key_id" >&2
        return 1
    fi

    local expected_sig
    expected_sig=$(keys_sign "$data" "$key_id")

    if [ "$signature" = "$expected_sig" ]; then
        return 0
    else
        return 1
    fi
}

# Rotate key (backup old, generate new)
keys_rotate() {
    local key_id="${1:-primary}"
    local key_file="$KEYS_DIR/$key_id.key"
    local pub_file="$KEYS_DIR/$key_id.pub"

    local backup_enabled
    backup_enabled=$(uci -q get identity.keys.backup_enabled || echo "1")

    if [ -f "$key_file" ]; then
        if [ "$backup_enabled" = "1" ]; then
            local timestamp
            timestamp=$(date +%Y%m%d%H%M%S)
            mv "$key_file" "$KEYS_DIR/${key_id}.key.backup.$timestamp"
            mv "$pub_file" "$KEYS_DIR/${key_id}.pub.backup.$timestamp" 2>/dev/null
            logger -t secubox-identity "Key '$key_id' backed up before rotation"
        else
            rm -f "$key_file" "$pub_file"
        fi
    fi

    keys_generate "$key_id"
    logger -t secubox-identity "Key '$key_id' rotated"
}

# Delete key
keys_delete() {
    local key_id="$1"

    if [ -z "$key_id" ]; then
        echo "Key ID required" >&2
        return 1
    fi

    if [ "$key_id" = "primary" ]; then
        echo "Cannot delete primary key. Use 'rotate' instead." >&2
        return 1
    fi

    rm -f "$KEYS_DIR/$key_id.key" "$KEYS_DIR/$key_id.pub"
    logger -t secubox-identity "Key '$key_id' deleted"
}

# Check if key rotation is needed
keys_check_rotation() {
    local key_id="${1:-primary}"
    local pub_file="$KEYS_DIR/$key_id.pub"

    if [ ! -f "$pub_file" ]; then
        return 0  # No key, needs generation
    fi

    local rotation_days
    rotation_days=$(uci -q get identity.keys.rotation_days || echo "90")

    local created_str
    created_str=$(jsonfilter -i "$pub_file" -e '@.created' 2>/dev/null)

    if [ -z "$created_str" ]; then
        return 1  # Can't determine, assume OK
    fi

    # Parse ISO date and compare
    local created_epoch
    created_epoch=$(date -d "$created_str" +%s 2>/dev/null || echo "0")
    local current_epoch
    current_epoch=$(date +%s)
    local age_days=$(( (current_epoch - created_epoch) / 86400 ))

    if [ "$age_days" -ge "$rotation_days" ]; then
        logger -t secubox-identity "Key '$key_id' is $age_days days old, rotation recommended"
        return 0
    else
        return 1
    fi
}

# Initialize on source
keys_init
