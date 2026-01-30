#!/bin/sh
# SecuBox P2P Mesh - Distributed Recovery Infrastructure
# Multipoint hosting with synchronized catalogs via blockchain-style data blocks
# Copyright 2026 CyberMind - Licensed under MIT

# ============================================================================
# Configuration
# ============================================================================
MESH_DIR="/srv/secubox/mesh"
BLOCKS_DIR="$MESH_DIR/blocks"
CATALOG_DIR="$MESH_DIR/catalog"
PEERS_FILE="$MESH_DIR/peers.json"
CHAIN_FILE="$MESH_DIR/chain.json"
NODE_ID_FILE="$MESH_DIR/node.id"
SYNC_LOCK="/tmp/secubox-mesh-sync.lock"
MESH_PORT="${MESH_PORT:-7331}"
DISCOVERY_PORT="${DISCOVERY_PORT:-7332}"

# ============================================================================
# Initialization
# ============================================================================
mesh_init() {
    mkdir -p "$BLOCKS_DIR" "$CATALOG_DIR" "$MESH_DIR/snapshots" "$MESH_DIR/tmp"

    # Generate node ID if not exists
    if [ ! -f "$NODE_ID_FILE" ]; then
        node_id=$(cat /proc/sys/kernel/random/uuid | tr -d '-' | head -c 16)
        echo "$node_id" > "$NODE_ID_FILE"
    fi

    # Initialize peers list
    [ ! -f "$PEERS_FILE" ] && echo '{"peers":[],"last_sync":0}' > "$PEERS_FILE"

    # Initialize chain
    if [ ! -f "$CHAIN_FILE" ]; then
        genesis_hash=$(echo "secubox-genesis-$(date +%s)" | sha256sum | cut -d' ' -f1)
        cat > "$CHAIN_FILE" << EOF
{
    "version": 1,
    "genesis": "$genesis_hash",
    "blocks": [
        {
            "index": 0,
            "timestamp": $(date +%s),
            "type": "genesis",
            "hash": "$genesis_hash",
            "prev_hash": "0000000000000000000000000000000000000000000000000000000000000000",
            "data": {"node": "$(cat $NODE_ID_FILE)", "created": "$(date -Iseconds)"}
        }
    ]
}
EOF
    fi

    echo "Mesh initialized: node=$(cat $NODE_ID_FILE)"
}

# ============================================================================
# Content-Addressed Block Storage
# ============================================================================
block_hash() {
    # Generate SHA256 hash of content
    sha256sum | cut -d' ' -f1
}

block_store() {
    # Store content as block, return hash
    local content="$1"
    local hash=$(echo "$content" | block_hash)
    local block_path="$BLOCKS_DIR/${hash:0:2}/${hash:2:2}"

    mkdir -p "$block_path"
    echo "$content" > "$block_path/$hash"
    echo "$hash"
}

block_store_file() {
    # Store file as block
    local file="$1"
    local hash=$(cat "$file" | block_hash)
    local block_path="$BLOCKS_DIR/${hash:0:2}/${hash:2:2}"

    mkdir -p "$block_path"
    cp "$file" "$block_path/$hash"
    echo "$hash"
}

block_get() {
    # Retrieve block by hash
    local hash="$1"
    local block_path="$BLOCKS_DIR/${hash:0:2}/${hash:2:2}/$hash"

    if [ -f "$block_path" ]; then
        cat "$block_path"
        return 0
    fi
    return 1
}

block_exists() {
    local hash="$1"
    [ -f "$BLOCKS_DIR/${hash:0:2}/${hash:2:2}/$hash" ]
}

# ============================================================================
# Blockchain Chain Management
# ============================================================================
chain_get_last() {
    jsonfilter -i "$CHAIN_FILE" -e '@.blocks[-1]'
}

chain_get_hash() {
    jsonfilter -i "$CHAIN_FILE" -e '@.blocks[-1].hash'
}

chain_add_block() {
    local block_type="$1"
    local block_data="$2"
    local block_hash="$3"

    local prev_hash=$(chain_get_hash)
    local index=$(jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*]' | wc -l)
    local timestamp=$(date +%s)
    local node_id=$(cat "$NODE_ID_FILE")

    # Create block record
    local block_record=$(cat << EOF
{
    "index": $index,
    "timestamp": $timestamp,
    "type": "$block_type",
    "hash": "$block_hash",
    "prev_hash": "$prev_hash",
    "node": "$node_id",
    "data": $block_data
}
EOF
)

    # Append to chain (using temp file for atomic update)
    local tmp_chain="$MESH_DIR/tmp/chain_$$.json"
    jsonfilter -i "$CHAIN_FILE" -e '@' | sed 's/\]$//' > "$tmp_chain"
    echo ",$block_record]}" >> "$tmp_chain"
    mv "$tmp_chain" "$CHAIN_FILE"

    echo "$block_hash"
}

chain_verify() {
    # Verify chain integrity
    local prev_hash="0000000000000000000000000000000000000000000000000000000000000000"
    local valid=1

    jsonfilter -i "$CHAIN_FILE" -e '@.blocks[*]' | while read block; do
        block_prev=$(echo "$block" | jsonfilter -e '@.prev_hash')
        if [ "$block_prev" != "$prev_hash" ]; then
            echo "Chain broken at block $(echo "$block" | jsonfilter -e '@.index')"
            valid=0
            break
        fi
        prev_hash=$(echo "$block" | jsonfilter -e '@.hash')
    done

    return $valid
}

# ============================================================================
# Catalog Management
# ============================================================================
catalog_init() {
    local cat_type="$1"  # apps, profiles, snapshots, patches
    local cat_file="$CATALOG_DIR/${cat_type}.json"

    [ ! -f "$cat_file" ] && cat > "$cat_file" << EOF
{
    "type": "$cat_type",
    "version": 1,
    "updated": $(date +%s),
    "items": []
}
EOF
}

catalog_add() {
    local cat_type="$1"
    local item_id="$2"
    local item_data="$3"
    local block_hash="$4"

    local cat_file="$CATALOG_DIR/${cat_type}.json"
    catalog_init "$cat_type"

    local timestamp=$(date +%s)
    local node_id=$(cat "$NODE_ID_FILE")

    # Create catalog entry
    local entry=$(cat << EOF
{
    "id": "$item_id",
    "hash": "$block_hash",
    "node": "$node_id",
    "timestamp": $timestamp,
    "data": $item_data
}
EOF
)

    # Update catalog
    local tmp_cat="$MESH_DIR/tmp/cat_$$.json"
    jsonfilter -i "$cat_file" -e '@' | \
        sed "s/\"items\":\[/\"items\":[$entry,/" | \
        sed "s/\"updated\":[0-9]*/\"updated\":$timestamp/" > "$tmp_cat"
    mv "$tmp_cat" "$cat_file"

    # Add to blockchain
    chain_add_block "catalog_$cat_type" "{\"id\":\"$item_id\",\"hash\":\"$block_hash\"}" "$block_hash"
}

catalog_list() {
    local cat_type="$1"
    local cat_file="$CATALOG_DIR/${cat_type}.json"

    [ -f "$cat_file" ] && jsonfilter -i "$cat_file" -e '@.items[*].id'
}

catalog_get() {
    local cat_type="$1"
    local item_id="$2"
    local cat_file="$CATALOG_DIR/${cat_type}.json"

    [ -f "$cat_file" ] && jsonfilter -i "$cat_file" -e "@.items[@.id='$item_id']"
}

# ============================================================================
# Peer Management
# ============================================================================
peer_add() {
    local peer_addr="$1"
    local peer_port="${2:-$MESH_PORT}"
    local peer_id="${3:-unknown}"

    local timestamp=$(date +%s)
    local tmp_peers="$MESH_DIR/tmp/peers_$$.json"

    # Check if peer exists
    if grep -q "\"$peer_addr\"" "$PEERS_FILE" 2>/dev/null; then
        echo "Peer already exists: $peer_addr"
        return 1
    fi

    # Add peer
    local entry="{\"id\":\"$peer_id\",\"addr\":\"$peer_addr\",\"port\":$peer_port,\"added\":$timestamp,\"last_seen\":$timestamp,\"status\":\"pending\"}"

    jsonfilter -i "$PEERS_FILE" -e '@' | \
        sed "s/\"peers\":\[/\"peers\":[$entry,/" > "$tmp_peers"
    mv "$tmp_peers" "$PEERS_FILE"

    echo "Added peer: $peer_addr:$peer_port"
}

peer_list() {
    jsonfilter -i "$PEERS_FILE" -e '@.peers[*]' 2>/dev/null
}

peer_update_status() {
    local peer_addr="$1"
    local status="$2"
    local timestamp=$(date +%s)

    # Update peer status (simplified - would use jq in production)
    sed -i "s/\"addr\":\"$peer_addr\".*\"status\":\"[^\"]*\"/\"addr\":\"$peer_addr\",\"last_seen\":$timestamp,\"status\":\"$status\"/" "$PEERS_FILE"
}

# ============================================================================
# P2P Discovery & Sync
# ============================================================================
discover_peers() {
    # Broadcast discovery on local network
    local node_id=$(cat "$NODE_ID_FILE")
    local msg="SECUBOX-MESH:DISCOVER:$node_id:$MESH_PORT"

    # UDP broadcast (requires socat or nc)
    if command -v socat >/dev/null; then
        echo "$msg" | socat - UDP-DATAGRAM:255.255.255.255:$DISCOVERY_PORT,broadcast
    fi

    # Also try mDNS if available
    if command -v avahi-publish >/dev/null; then
        avahi-publish -s "secubox-mesh-$node_id" _secubox._tcp $MESH_PORT &
    fi
}

sync_with_peer() {
    local peer_addr="$1"
    local peer_port="${2:-$MESH_PORT}"

    echo "Syncing with peer: $peer_addr:$peer_port"

    # Get peer's chain tip
    local peer_chain=$(curl -s --connect-timeout 5 "http://$peer_addr:$peer_port/api/chain/tip" 2>/dev/null)
    if [ -z "$peer_chain" ]; then
        peer_update_status "$peer_addr" "offline"
        return 1
    fi

    peer_update_status "$peer_addr" "online"

    local peer_hash=$(echo "$peer_chain" | jsonfilter -e '@.hash' 2>/dev/null)
    local local_hash=$(chain_get_hash)

    if [ "$peer_hash" = "$local_hash" ]; then
        echo "Already in sync with $peer_addr"
        return 0
    fi

    # Get missing blocks from peer
    local missing=$(curl -s "http://$peer_addr:$peer_port/api/chain/since/$local_hash" 2>/dev/null)
    if [ -n "$missing" ]; then
        echo "$missing" | jsonfilter -e '@[*]' | while read block; do
            local block_hash=$(echo "$block" | jsonfilter -e '@.hash')
            local block_type=$(echo "$block" | jsonfilter -e '@.type')

            # Fetch and store block data
            if ! block_exists "$block_hash"; then
                curl -s "http://$peer_addr:$peer_port/api/block/$block_hash" -o "$MESH_DIR/tmp/$block_hash"
                if [ -f "$MESH_DIR/tmp/$block_hash" ]; then
                    block_store_file "$MESH_DIR/tmp/$block_hash"
                    rm "$MESH_DIR/tmp/$block_hash"
                fi
            fi
        done

        echo "Synced $(echo "$missing" | jsonfilter -e '@[*]' | wc -l) blocks from $peer_addr"
    fi
}

sync_all_peers() {
    [ -f "$SYNC_LOCK" ] && return 1
    touch "$SYNC_LOCK"

    peer_list | while read peer; do
        addr=$(echo "$peer" | jsonfilter -e '@.addr')
        port=$(echo "$peer" | jsonfilter -e '@.port')
        sync_with_peer "$addr" "$port"
    done

    rm -f "$SYNC_LOCK"
}

# ============================================================================
# Snapshot & Recovery
# ============================================================================
snapshot_create() {
    local name="${1:-snapshot-$(date +%Y%m%d-%H%M%S)}"
    local snapshot_dir="$MESH_DIR/snapshots/$name"

    mkdir -p "$snapshot_dir"

    echo "Creating snapshot: $name"

    # Backup configs
    cp -a /etc/config "$snapshot_dir/config" 2>/dev/null

    # Backup installed packages list
    opkg list-installed > "$snapshot_dir/packages.list"

    # Backup SecuBox specific
    cp -a /srv/secubox "$snapshot_dir/secubox-data" 2>/dev/null
    cp -a /opt/haproxy "$snapshot_dir/haproxy" 2>/dev/null

    # Create manifest
    cat > "$snapshot_dir/manifest.json" << EOF
{
    "name": "$name",
    "created": "$(date -Iseconds)",
    "node": "$(cat $NODE_ID_FILE)",
    "hostname": "$(uci get system.@system[0].hostname 2>/dev/null)",
    "version": "$(cat /etc/secubox-version 2>/dev/null || echo unknown)",
    "files": $(find "$snapshot_dir" -type f | wc -l)
}
EOF

    # Archive and hash
    tar -czf "$snapshot_dir.tar.gz" -C "$MESH_DIR/snapshots" "$name"
    local hash=$(block_store_file "$snapshot_dir.tar.gz")

    # Add to catalog
    catalog_add "snapshots" "$name" "$(cat $snapshot_dir/manifest.json)" "$hash"

    # Cleanup temp
    rm -rf "$snapshot_dir"

    echo "Snapshot created: $name (hash: $hash)"
    echo "$hash"
}

snapshot_restore() {
    local name_or_hash="$1"

    # Find snapshot
    local hash=""
    if [ ${#name_or_hash} -eq 64 ]; then
        hash="$name_or_hash"
    else
        hash=$(catalog_get "snapshots" "$name_or_hash" | jsonfilter -e '@.hash')
    fi

    if [ -z "$hash" ] || ! block_exists "$hash"; then
        echo "Snapshot not found: $name_or_hash"
        return 1
    fi

    echo "Restoring snapshot: $hash"

    # Extract
    local tmp_dir="$MESH_DIR/tmp/restore_$$"
    mkdir -p "$tmp_dir"
    block_get "$hash" | tar -xzf - -C "$tmp_dir"

    # Restore configs
    cp -a "$tmp_dir"/*/config/* /etc/config/ 2>/dev/null

    # Restore SecuBox data
    cp -a "$tmp_dir"/*/secubox-data/* /srv/secubox/ 2>/dev/null

    # Reinstall packages (optional)
    if [ -f "$tmp_dir"/*/packages.list ]; then
        echo "Package list available at: $tmp_dir/*/packages.list"
    fi

    rm -rf "$tmp_dir"
    echo "Snapshot restored"
}

# ============================================================================
# Bootstrap / Reborn Script
# ============================================================================
generate_reborn_script() {
    local output="${1:-/tmp/secubox-reborn.sh}"
    local snapshot_hash=$(snapshot_create "reborn-$(date +%Y%m%d)")

    cat > "$output" << 'REBORN_SCRIPT'
#!/bin/sh
# SecuBox Reborn Script - Self-Revival Bootstrap
# Generated: TIMESTAMP
# Snapshot: SNAPSHOT_HASH

MESH_SEED="SEED_PEERS"
SNAPSHOT_HASH="SNAPSHOT_HASH"

echo "=== SecuBox Reborn ==="
echo "Restoring from distributed mesh..."

# Install dependencies
opkg update
opkg install curl tar gzip

# Bootstrap mesh
mkdir -p /srv/secubox/mesh
cd /srv/secubox/mesh

# Try to fetch snapshot from mesh peers
for peer in $MESH_SEED; do
    echo "Trying peer: $peer"
    if curl -sf "http://$peer/api/block/$SNAPSHOT_HASH" -o snapshot.tar.gz; then
        echo "Downloaded from $peer"
        break
    fi
done

if [ ! -f snapshot.tar.gz ]; then
    echo "Failed to download snapshot from mesh"
    exit 1
fi

# Verify hash
actual_hash=$(sha256sum snapshot.tar.gz | cut -d' ' -f1)
if [ "$actual_hash" != "$SNAPSHOT_HASH" ]; then
    echo "Hash mismatch! Expected: $SNAPSHOT_HASH, Got: $actual_hash"
    exit 1
fi

# Extract and restore
tar -xzf snapshot.tar.gz
./restore.sh

echo "=== SecuBox Reborn Complete ==="
REBORN_SCRIPT

    # Fill in values
    sed -i "s/TIMESTAMP/$(date -Iseconds)/" "$output"
    sed -i "s/SNAPSHOT_HASH/$snapshot_hash/g" "$output"

    # Get peer addresses
    local peers=$(peer_list | jsonfilter -e '@.addr' | tr '\n' ' ')
    sed -i "s/SEED_PEERS/$peers/" "$output"

    chmod +x "$output"
    echo "Reborn script generated: $output"
}

# ============================================================================
# HTTP API Server (for peer communication)
# ============================================================================
start_api_server() {
    local port="${1:-$MESH_PORT}"

    # Simple HTTP API using uhttpd CGI or netcat
    mkdir -p /www/secubox-mesh/api

    # Chain tip endpoint
    cat > /www/secubox-mesh/api/chain << 'API'
#!/bin/sh
echo "Content-Type: application/json"
echo ""
cat /srv/secubox/mesh/chain.json
API

    # Block endpoint
    cat > /www/secubox-mesh/api/block << 'API'
#!/bin/sh
echo "Content-Type: application/octet-stream"
echo ""
hash="${QUERY_STRING##*/}"
cat "/srv/secubox/mesh/blocks/${hash:0:2}/${hash:2:2}/$hash" 2>/dev/null
API

    chmod +x /www/secubox-mesh/api/*

    echo "API endpoints available at /secubox-mesh/api/"
}

# ============================================================================
# Main Commands
# ============================================================================
case "$1" in
    init)
        mesh_init
        ;;
    peer-add)
        peer_add "$2" "$3"
        ;;
    peer-list)
        peer_list
        ;;
    discover)
        discover_peers
        ;;
    sync)
        sync_all_peers
        ;;
    snapshot)
        snapshot_create "$2"
        ;;
    restore)
        snapshot_restore "$2"
        ;;
    reborn)
        generate_reborn_script "$2"
        ;;
    catalog)
        catalog_list "$2"
        ;;
    chain)
        cat "$CHAIN_FILE"
        ;;
    verify)
        chain_verify && echo "Chain valid" || echo "Chain invalid"
        ;;
    api)
        start_api_server "$2"
        ;;
    *)
        echo "SecuBox P2P Mesh - Distributed Recovery Infrastructure"
        echo ""
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  init              Initialize mesh node"
        echo "  peer-add <ip>     Add peer node"
        echo "  peer-list         List known peers"
        echo "  discover          Broadcast discovery"
        echo "  sync              Sync with all peers"
        echo "  snapshot [name]   Create snapshot"
        echo "  restore <hash>    Restore from snapshot"
        echo "  reborn [file]     Generate reborn script"
        echo "  catalog <type>    List catalog (apps|profiles|snapshots)"
        echo "  chain             Show blockchain"
        echo "  verify            Verify chain integrity"
        echo "  api [port]        Start API server"
        ;;
esac
