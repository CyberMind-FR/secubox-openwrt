#!/bin/sh
# P2P Intel Blockchain - Permanent IOC recording on mesh blockchain
# Records threat_ioc and ioc_feedback blocks for audit trail

. /usr/lib/secubox/p2p-mesh.sh 2>/dev/null

CHAIN_FILE="/srv/secubox/mesh/chain.json"
INTEL_DIR="/var/lib/p2p-intel"
PROCESSED_BLOCKS="$INTEL_DIR/processed-blocks.list"

# Initialize blockchain integration
blockchain_init() {
    mkdir -p "$INTEL_DIR"
    [ -f "$PROCESSED_BLOCKS" ] || touch "$PROCESSED_BLOCKS"
}

# Record IOC batch to blockchain
# Usage: blockchain_record_iocs '<iocs_json_array>' '<source_did>'
blockchain_record_iocs() {
    local iocs_json="$1"
    local source_did="$2"

    [ -z "$iocs_json" ] && return 1
    [ "$iocs_json" = "[]" ] && return 0

    local timestamp=$(date +%s)
    local node_id=$(cat /srv/secubox/mesh/node.id 2>/dev/null || echo "unknown")
    local ioc_count=$(echo "$iocs_json" | jsonfilter -e '@[*]' 2>/dev/null | wc -l)

    [ "$ioc_count" -eq 0 ] && return 0

    # Build block data
    local block_data="{\"version\":1,\"source\":\"$source_did\",\"count\":$ioc_count,\"iocs\":$iocs_json}"
    local block_hash=$(echo "${block_data}${timestamp}${node_id}" | sha256sum | cut -d' ' -f1)

    # Add to blockchain
    if type chain_add_block >/dev/null 2>&1; then
        chain_add_block "threat_ioc" "$block_data" "$block_hash"
        logger -t p2p-intel "Recorded $ioc_count IOCs to blockchain (hash: ${block_hash:0:16})"
        echo "$block_hash"
        return 0
    else
        logger -t p2p-intel "Warning: chain_add_block not available"
        return 1
    fi
}

# Scan chain for unprocessed threat_ioc blocks from other nodes
# Returns: IOCs as JSON lines (one per line)
blockchain_scan_iocs() {
    [ -f "$CHAIN_FILE" ] || return 0
    [ -f "$PROCESSED_BLOCKS" ] || touch "$PROCESSED_BLOCKS"

    local my_node=$(cat /srv/secubox/mesh/node.id 2>/dev/null)

    jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*]' 2>/dev/null | while read -r block; do
        local btype=$(echo "$block" | jsonfilter -e '@.type' 2>/dev/null)
        [ "$btype" = "threat_ioc" ] || continue

        local bhash=$(echo "$block" | jsonfilter -e '@.hash' 2>/dev/null)
        local bnode=$(echo "$block" | jsonfilter -e '@.node' 2>/dev/null)

        # Skip own blocks
        [ "$bnode" = "$my_node" ] && continue

        # Skip already processed
        grep -q "$bhash" "$PROCESSED_BLOCKS" 2>/dev/null && continue

        # Extract source for trust checking
        local source=$(echo "$block" | jsonfilter -e '@.data.source' 2>/dev/null)

        # Output each IOC with source attribution
        echo "$block" | jsonfilter -e '@.data.iocs[*]' 2>/dev/null | while read -r ioc; do
            # Add source_node to IOC for trust tracking
            echo "$ioc" | sed "s/}$/,\"source_node\":\"$source\"}/g"
        done

        # Mark as processed
        echo "$bhash" >> "$PROCESSED_BLOCKS"
    done
}

# Count unprocessed threat_ioc blocks
blockchain_pending_count() {
    [ -f "$CHAIN_FILE" ] || { echo "0"; return; }
    [ -f "$PROCESSED_BLOCKS" ] || touch "$PROCESSED_BLOCKS"

    local my_node=$(cat /srv/secubox/mesh/node.id 2>/dev/null)
    local count=0

    jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*]' 2>/dev/null | while read -r block; do
        local btype=$(echo "$block" | jsonfilter -e '@.type' 2>/dev/null)
        [ "$btype" = "threat_ioc" ] || continue

        local bhash=$(echo "$block" | jsonfilter -e '@.hash' 2>/dev/null)
        local bnode=$(echo "$block" | jsonfilter -e '@.node' 2>/dev/null)

        [ "$bnode" = "$my_node" ] && continue
        grep -q "$bhash" "$PROCESSED_BLOCKS" 2>/dev/null && continue

        count=$((count + 1))
    done

    echo "$count"
}

# Record IOC feedback to chain (effectiveness tracking)
# Usage: blockchain_record_feedback '<ioc_hash>' '<feedback_type>' '<details>'
# feedback_type: "effective" or "false_positive"
blockchain_record_feedback() {
    local ioc_hash="$1"
    local feedback_type="$2"
    local details="${3:-}"

    [ -z "$ioc_hash" ] || [ -z "$feedback_type" ] && return 1

    local timestamp=$(date +%s)
    local node_id=$(cat /srv/secubox/mesh/node.id 2>/dev/null || echo "unknown")

    local block_data="{\"ioc_hash\":\"$ioc_hash\",\"feedback\":\"$feedback_type\",\"reporter\":\"$node_id\",\"details\":\"$details\",\"ts\":$timestamp}"
    local block_hash=$(echo "${block_data}${timestamp}" | sha256sum | cut -d' ' -f1)

    if type chain_add_block >/dev/null 2>&1; then
        chain_add_block "ioc_feedback" "$block_data" "$block_hash"
        logger -t p2p-intel "Recorded IOC feedback: $ioc_hash -> $feedback_type"
        echo "$block_hash"
        return 0
    else
        logger -t p2p-intel "Warning: chain_add_block not available"
        return 1
    fi
}

# Get feedback statistics from blockchain
blockchain_feedback_stats() {
    [ -f "$CHAIN_FILE" ] || { echo '{"effective":0,"false_positive":0}'; return; }

    local effective=0
    local false_positive=0

    jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*]' 2>/dev/null | while read -r block; do
        local btype=$(echo "$block" | jsonfilter -e '@.type' 2>/dev/null)
        [ "$btype" = "ioc_feedback" ] || continue

        local feedback=$(echo "$block" | jsonfilter -e '@.data.feedback' 2>/dev/null)
        case "$feedback" in
            effective) effective=$((effective + 1)) ;;
            false_positive) false_positive=$((false_positive + 1)) ;;
        esac
    done

    echo "{\"effective\":$effective,\"false_positive\":$false_positive}"
}

# Get threat_ioc block count
blockchain_ioc_block_count() {
    [ -f "$CHAIN_FILE" ] || { echo "0"; return; }

    jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*].type' 2>/dev/null | grep -c "threat_ioc" || echo "0"
}

# Clean old processed blocks list (keep last 1000)
blockchain_cleanup() {
    [ -f "$PROCESSED_BLOCKS" ] || return 0

    local lines=$(wc -l < "$PROCESSED_BLOCKS")
    if [ "$lines" -gt 1000 ]; then
        tail -n 1000 "$PROCESSED_BLOCKS" > "$PROCESSED_BLOCKS.tmp"
        mv "$PROCESSED_BLOCKS.tmp" "$PROCESSED_BLOCKS"
        logger -t p2p-intel "Cleaned processed blocks list (kept last 1000)"
    fi
}

# Initialize on source
blockchain_init
