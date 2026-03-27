#!/bin/sh
# SecuBox Mesh Topology Management
# Tracks mesh nodes, edges, and generates topology graph
# CyberMind — SecuBox — 2026

TOPO_FILE="/var/lib/secubox-mesh/topology.json"
NODES_FILE="/var/lib/secubox-mesh/nodes.json"
EDGES_FILE="/var/lib/secubox-mesh/edges.json"

# Initialize topology storage
topology_init() {
    mkdir -p "$(dirname "$TOPO_FILE")"
    [ -f "$TOPO_FILE" ] || echo '{"nodes":[],"edges":[],"mesh_gate":""}' > "$TOPO_FILE"
    [ -f "$NODES_FILE" ] || echo '[]' > "$NODES_FILE"
    [ -f "$EDGES_FILE" ] || echo '[]' > "$EDGES_FILE"
}

# Add or update a node in topology
topology_add_node() {
    local did="$1"
    local address="$2"
    local role="${3:-edge}"
    local last_seen
    last_seen=$(date -Iseconds)

    # Check if node exists
    local exists
    exists=$(jsonfilter -i "$NODES_FILE" -e "@[\"$did\"]" 2>/dev/null)

    local tmp_file="/tmp/topo_nodes_$$.json"

    if [ -n "$exists" ]; then
        # Update existing node
        local updated='{"did":"'"$did"'","address":"'"$address"'","role":"'"$role"'","last_seen":"'"$last_seen"'","zkp_valid":true}'
        # Use sed to update (simplified)
        sed "s|{\"did\":\"$did\"[^}]*}|$updated|" "$NODES_FILE" > "$tmp_file"
    else
        # Add new node
        if [ "$(cat "$NODES_FILE")" = "[]" ]; then
            echo '[{"did":"'"$did"'","address":"'"$address"'","role":"'"$role"'","last_seen":"'"$last_seen"'","zkp_valid":true}]' > "$tmp_file"
        else
            # Insert before closing bracket
            sed "s/\]$/,{\"did\":\"$did\",\"address\":\"$address\",\"role\":\"$role\",\"last_seen\":\"$last_seen\",\"zkp_valid\":true}]/" "$NODES_FILE" > "$tmp_file"
        fi
    fi

    mv "$tmp_file" "$NODES_FILE"
}

# Remove a node from topology
topology_remove_node() {
    local did="$1"
    local tmp_file="/tmp/topo_nodes_$$.json"

    # Remove node entry (simplified - removes entire object)
    grep -v "\"did\":\"$did\"" "$NODES_FILE" > "$tmp_file" || echo '[]' > "$tmp_file"
    mv "$tmp_file" "$NODES_FILE"

    # Also remove edges involving this node
    topology_remove_edges_for_node "$did"
}

# Add an edge between two nodes
topology_add_edge() {
    local from_did="$1"
    local to_did="$2"
    local weight="${3:-1}"
    local active="${4:-true}"

    local edge_id="${from_did}:${to_did}"
    local tmp_file="/tmp/topo_edges_$$.json"

    if [ "$(cat "$EDGES_FILE")" = "[]" ]; then
        echo '[{"id":"'"$edge_id"'","from":"'"$from_did"'","to":"'"$to_did"'","weight":'"$weight"',"active":'"$active"'}]' > "$tmp_file"
    else
        # Check if edge exists
        if grep -q "\"id\":\"$edge_id\"" "$EDGES_FILE"; then
            return 0  # Edge already exists
        fi
        sed "s/\]$/,{\"id\":\"$edge_id\",\"from\":\"$from_did\",\"to\":\"$to_did\",\"weight\":$weight,\"active\":$active}]/" "$EDGES_FILE" > "$tmp_file"
    fi

    mv "$tmp_file" "$EDGES_FILE"
}

# Remove edges for a node
topology_remove_edges_for_node() {
    local did="$1"
    local tmp_file="/tmp/topo_edges_$$.json"

    grep -v "\"$did\"" "$EDGES_FILE" > "$tmp_file" || echo '[]' > "$tmp_file"
    mv "$tmp_file" "$EDGES_FILE"
}

# Get all nodes
topology_get_nodes() {
    cat "$NODES_FILE" 2>/dev/null || echo '[]'
}

# Get all edges
topology_get_edges() {
    cat "$EDGES_FILE" 2>/dev/null || echo '[]'
}

# Get full topology
topology_get() {
    local nodes edges mesh_gate
    nodes=$(cat "$NODES_FILE" 2>/dev/null || echo '[]')
    edges=$(cat "$EDGES_FILE" 2>/dev/null || echo '[]')
    mesh_gate=$(cat /var/lib/secubox-mesh/mesh_gate 2>/dev/null || echo "")

    cat <<EOF
{"nodes":$nodes,"edges":$edges,"mesh_gate":"$mesh_gate"}
EOF
}

# Update topology from peer discovery
topology_update() {
    local peers_file="/var/lib/secubox-mesh/peers.json"

    [ -f "$peers_file" ] || return

    # Add this node first
    local my_did my_addr my_role
    my_did="${NODE_DID:-$(cat /var/lib/mirrornet/identity/did.txt 2>/dev/null)}"
    my_addr=$(uci -q get network.lan.ipaddr || echo "0.0.0.0")
    my_role="${CURRENT_ROLE:-edge}"

    [ -n "$my_did" ] && topology_add_node "$my_did" "$my_addr" "$my_role"

    # Process discovered peers
    local peer_count=0
    while IFS= read -r peer_json; do
        [ -z "$peer_json" ] && continue

        local peer_did peer_addr peer_role
        peer_did=$(echo "$peer_json" | jsonfilter -e '@.did' 2>/dev/null)
        peer_addr=$(echo "$peer_json" | jsonfilter -e '@.address' 2>/dev/null)
        peer_role=$(echo "$peer_json" | jsonfilter -e '@.role' 2>/dev/null || echo "edge")

        [ -z "$peer_did" ] && continue

        topology_add_node "$peer_did" "$peer_addr" "$peer_role"

        # Add edge from this node to peer
        [ -n "$my_did" ] && topology_add_edge "$my_did" "$peer_did" 1 true

        peer_count=$((peer_count + 1))
    done < <(jsonfilter -i "$peers_file" -e '@[*]' 2>/dev/null)

    # Save combined topology
    topology_get > "$TOPO_FILE"

    logger -t secubox-mesh "Topology updated: $peer_count peers"
}

# Prune stale nodes (not seen in 5 minutes)
topology_prune_stale() {
    local stale_threshold=300  # 5 minutes
    local current_time
    current_time=$(date +%s)

    local tmp_file="/tmp/topo_nodes_prune_$$.json"
    local pruned=0

    echo '[' > "$tmp_file"
    local first=1

    while IFS= read -r node_json; do
        [ -z "$node_json" ] && continue

        local last_seen_str last_seen_ts age
        last_seen_str=$(echo "$node_json" | jsonfilter -e '@.last_seen' 2>/dev/null)

        # Convert ISO date to timestamp (simplified)
        last_seen_ts=$(date -d "$last_seen_str" +%s 2>/dev/null || echo "$current_time")
        age=$((current_time - last_seen_ts))

        if [ "$age" -lt "$stale_threshold" ]; then
            [ "$first" = "1" ] || echo ',' >> "$tmp_file"
            echo "$node_json" >> "$tmp_file"
            first=0
        else
            pruned=$((pruned + 1))
            local did
            did=$(echo "$node_json" | jsonfilter -e '@.did' 2>/dev/null)
            logger -t secubox-mesh "Pruned stale node: $did (age: ${age}s)"
        fi
    done < <(jsonfilter -i "$NODES_FILE" -e '@[*]' 2>/dev/null)

    echo ']' >> "$tmp_file"
    mv "$tmp_file" "$NODES_FILE"

    [ "$pruned" -gt 0 ] && topology_update
}

# Get node count
topology_node_count() {
    jsonfilter -i "$NODES_FILE" -e '@[*]' 2>/dev/null | wc -l
}

# Get edge count
topology_edge_count() {
    jsonfilter -i "$EDGES_FILE" -e '@[*]' 2>/dev/null | wc -l
}

# Initialize on source
topology_init
