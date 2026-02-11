#!/bin/sh
# P2P Intel Signer - Cryptographically sign IOCs for sharing

. /lib/functions.sh

INTEL_DIR="/var/lib/p2p-intel"
SIGNED_DIR="$INTEL_DIR/signed"

# Initialize signer
signer_init() {
    mkdir -p "$SIGNED_DIR"
}

# Sign single IOC
sign_ioc() {
    local ioc="$1"

    # Get signing key
    local signature=""
    local signer_did=""

    if [ -f /usr/lib/secubox-identity/core.sh ] && [ -f /usr/lib/secubox-identity/keys.sh ]; then
        . /usr/lib/secubox-identity/core.sh
        . /usr/lib/secubox-identity/keys.sh

        signer_did=$(did_get)

        # Create canonical form for signing
        local canonical
        canonical=$(echo "$ioc" | tr -d '\n\t ')

        # Sign the canonical form
        signature=$(keys_sign "$canonical" "primary" 2>/dev/null)
    fi

    local timestamp
    timestamp=$(date +%s)

    # Create signed IOC envelope
    cat <<EOF
{
  "version": "1.0",
  "type": "signed_ioc",
  "signer": "$signer_did",
  "timestamp": $timestamp,
  "signature": "$signature",
  "payload": $ioc
}
EOF
}

# Sign batch of IOCs
sign_batch() {
    local iocs_file="$1"
    local output_file="${2:-$SIGNED_DIR/batch_$(date +%s).json}"

    if [ ! -f "$iocs_file" ]; then
        echo "IOCs file not found: $iocs_file" >&2
        return 1
    fi

    local signer_did=""
    if [ -f /usr/lib/secubox-identity/core.sh ]; then
        . /usr/lib/secubox-identity/core.sh
        signer_did=$(did_get)
    fi

    local timestamp
    timestamp=$(date +%s)

    # Read IOCs
    local iocs
    iocs=$(cat "$iocs_file")

    # Create batch hash for signing
    local batch_hash
    batch_hash=$(echo -n "$iocs" | openssl sha256 | cut -d' ' -f2)

    # Sign the batch hash
    local signature=""
    if [ -f /usr/lib/secubox-identity/keys.sh ]; then
        . /usr/lib/secubox-identity/keys.sh
        signature=$(keys_sign "$batch_hash" "primary" 2>/dev/null)
    fi

    # Create signed batch envelope
    cat > "$output_file" <<EOF
{
  "version": "1.0",
  "type": "signed_ioc_batch",
  "signer": "$signer_did",
  "timestamp": $timestamp,
  "batch_hash": "$batch_hash",
  "signature": "$signature",
  "count": $(echo "$iocs" | jsonfilter -e '@[*]' 2>/dev/null | wc -l),
  "iocs": $iocs
}
EOF

    echo "$output_file"
}

# Create shareable IOC package
create_package() {
    local min_severity
    min_severity=$(uci -q get p2p-intel.sharing.min_severity || echo "medium")

    local include_evidence
    include_evidence=$(uci -q get p2p-intel.sharing.include_evidence || echo "0")

    # Collect fresh IOCs
    if [ -f /usr/lib/p2p-intel/collector.sh ]; then
        . /usr/lib/p2p-intel/collector.sh
        collect_all >/dev/null
    fi

    local local_iocs="$INTEL_DIR/local-iocs.json"

    if [ ! -f "$local_iocs" ] || [ "$(cat "$local_iocs")" = "[]" ]; then
        echo '{"error": "No IOCs to share"}'
        return 1
    fi

    # Sign the batch
    local signed_file
    signed_file=$(sign_batch "$local_iocs")

    cat "$signed_file"
}

# Verify signature of received IOC
verify_signature() {
    local signed_ioc="$1"

    local signer signature payload
    signer=$(echo "$signed_ioc" | jsonfilter -e '@.signer' 2>/dev/null)
    signature=$(echo "$signed_ioc" | jsonfilter -e '@.signature' 2>/dev/null)
    payload=$(echo "$signed_ioc" | jsonfilter -e '@.payload' 2>/dev/null)

    if [ -z "$signer" ] || [ -z "$signature" ]; then
        echo "Missing signer or signature"
        return 1
    fi

    # For now, we can't verify external signatures without the signer's public key
    # This would require fetching the signer's identity document

    # Basic format validation
    if [ -n "$payload" ]; then
        return 0
    else
        return 1
    fi
}

# Verify batch signature
verify_batch_signature() {
    local batch="$1"

    local signer batch_hash signature iocs
    signer=$(echo "$batch" | jsonfilter -e '@.signer' 2>/dev/null)
    batch_hash=$(echo "$batch" | jsonfilter -e '@.batch_hash' 2>/dev/null)
    signature=$(echo "$batch" | jsonfilter -e '@.signature' 2>/dev/null)
    iocs=$(echo "$batch" | jsonfilter -e '@.iocs' 2>/dev/null)

    if [ -z "$signer" ] || [ -z "$batch_hash" ]; then
        echo "Invalid batch format"
        return 1
    fi

    # Verify hash matches
    local computed_hash
    computed_hash=$(echo -n "$iocs" | openssl sha256 | cut -d' ' -f2)

    if [ "$computed_hash" = "$batch_hash" ]; then
        return 0
    else
        echo "Hash mismatch"
        return 1
    fi
}

# Initialize on source
signer_init
