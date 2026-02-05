#!/bin/sh
# P2P Intel Validator - Validate and score received IOCs

. /lib/functions.sh

INTEL_DIR="/var/lib/p2p-intel"
RECEIVED_DIR="$INTEL_DIR/received"
VALIDATED_DIR="$INTEL_DIR/validated"
REJECTED_DIR="$INTEL_DIR/rejected"

# Initialize validator
validator_init() {
    mkdir -p "$RECEIVED_DIR" "$VALIDATED_DIR" "$REJECTED_DIR"
}

# Check if IOC is too old
_is_too_old() {
    local timestamp="$1"
    local max_age_hours
    max_age_hours=$(uci -q get p2p-intel.validation.max_age_hours || echo "168")

    local max_age_seconds=$((max_age_hours * 3600))
    local current_time
    current_time=$(date +%s)
    local age=$((current_time - timestamp))

    [ "$age" -gt "$max_age_seconds" ]
}

# Check if source is trusted
_is_source_trusted() {
    local source_did="$1"
    local min_trust
    min_trust=$(uci -q get p2p-intel.validation.min_source_trust || echo "40")

    if [ -f /usr/lib/secubox-identity/trust.sh ]; then
        . /usr/lib/secubox-identity/trust.sh
        local score
        score=$(trust_get_score "$source_did")
        [ "$score" -ge "$min_trust" ]
    else
        # No trust system, accept all
        return 0
    fi
}

# Check if IP is in local subnet (whitelist)
_is_local_ip() {
    local ip="$1"

    # Check common local ranges
    case "$ip" in
        10.*|172.1[6-9].*|172.2[0-9].*|172.3[0-1].*|192.168.*|127.*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Validate single IOC
validate_ioc() {
    local ioc="$1"
    local source_did="$2"

    local ioc_type value timestamp
    ioc_type=$(echo "$ioc" | jsonfilter -e '@.type' 2>/dev/null)
    value=$(echo "$ioc" | jsonfilter -e '@.value' 2>/dev/null)
    timestamp=$(echo "$ioc" | jsonfilter -e '@.collected_at' 2>/dev/null)

    # Check required fields
    if [ -z "$ioc_type" ] || [ -z "$value" ]; then
        echo '{"valid": false, "reason": "missing_fields"}'
        return 1
    fi

    # Check age
    if [ -n "$timestamp" ] && _is_too_old "$timestamp"; then
        echo '{"valid": false, "reason": "too_old"}'
        return 1
    fi

    # Check source trust
    if [ -n "$source_did" ]; then
        if ! _is_source_trusted "$source_did"; then
            echo '{"valid": false, "reason": "untrusted_source"}'
            return 1
        fi
    fi

    # Type-specific validation
    case "$ioc_type" in
        ip)
            # Validate IP format
            if ! echo "$value" | grep -qE '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$'; then
                echo '{"valid": false, "reason": "invalid_ip_format"}'
                return 1
            fi

            # Check whitelist
            local whitelist_local
            whitelist_local=$(uci -q get p2p-intel.application.whitelist_local || echo "1")
            if [ "$whitelist_local" = "1" ] && _is_local_ip "$value"; then
                echo '{"valid": false, "reason": "local_ip_whitelisted"}'
                return 1
            fi
            ;;

        domain)
            # Basic domain format check
            if ! echo "$value" | grep -qE '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$'; then
                echo '{"valid": false, "reason": "invalid_domain_format"}'
                return 1
            fi
            ;;

        url)
            # Basic URL format check
            if ! echo "$value" | grep -qE '^https?://'; then
                echo '{"valid": false, "reason": "invalid_url_format"}'
                return 1
            fi
            ;;

        hash)
            # Check hash format (MD5, SHA1, SHA256)
            local len=${#value}
            if [ "$len" != "32" ] && [ "$len" != "40" ] && [ "$len" != "64" ]; then
                echo '{"valid": false, "reason": "invalid_hash_format"}'
                return 1
            fi
            ;;

        *)
            echo '{"valid": false, "reason": "unknown_ioc_type"}'
            return 1
            ;;
    esac

    echo '{"valid": true}'
    return 0
}

# Validate signed batch
validate_batch() {
    local batch="$1"
    local batch_file="$2"

    local require_signature
    require_signature=$(uci -q get p2p-intel.validation.require_signature || echo "1")

    # Verify signature if required
    if [ "$require_signature" = "1" ]; then
        if [ -f /usr/lib/p2p-intel/signer.sh ]; then
            . /usr/lib/p2p-intel/signer.sh
            if ! verify_batch_signature "$batch"; then
                echo '{"valid": false, "reason": "invalid_signature"}'
                return 1
            fi
        fi
    fi

    local signer
    signer=$(echo "$batch" | jsonfilter -e '@.signer' 2>/dev/null)

    # Extract and validate each IOC
    local valid_count=0
    local invalid_count=0
    local validated_iocs="["
    local first=1

    local iocs
    iocs=$(echo "$batch" | jsonfilter -e '@.iocs[*]' 2>/dev/null)

    echo "$iocs" | while read -r ioc; do
        [ -z "$ioc" ] && continue

        local result
        result=$(validate_ioc "$ioc" "$signer")

        if echo "$result" | grep -q '"valid": true'; then
            valid_count=$((valid_count + 1))
            [ "$first" = "1" ] || validated_iocs="$validated_iocs,"
            validated_iocs="$validated_iocs$ioc"
            first=0
        else
            invalid_count=$((invalid_count + 1))
        fi
    done

    validated_iocs="$validated_iocs]"

    # Save validated IOCs
    local output_file="$VALIDATED_DIR/$(date +%s)_$signer.json"
    echo "$validated_iocs" > "$output_file"

    cat <<EOF
{
  "valid": true,
  "source": "$signer",
  "validated": $valid_count,
  "rejected": $invalid_count,
  "output_file": "$output_file"
}
EOF
}

# Process received IOC package
process_received() {
    local input_file="$1"

    if [ ! -f "$input_file" ]; then
        echo '{"error": "File not found"}'
        return 1
    fi

    local batch
    batch=$(cat "$input_file")

    validate_batch "$batch" "$input_file"
}

# Get validated IOCs
get_validated() {
    echo "["
    local first=1
    for f in "$VALIDATED_DIR"/*.json 2>/dev/null; do
        [ -f "$f" ] || continue
        [ "$first" = "1" ] || echo ","
        cat "$f"
        first=0
    done
    echo "]"
}

# Clean old validated/rejected files
cleanup() {
    local max_age="${1:-604800}"  # 7 days default
    find "$VALIDATED_DIR" -type f -mtime +7 -delete 2>/dev/null
    find "$REJECTED_DIR" -type f -mtime +7 -delete 2>/dev/null
    find "$RECEIVED_DIR" -type f -mtime +7 -delete 2>/dev/null
}

# Initialize on source
validator_init
