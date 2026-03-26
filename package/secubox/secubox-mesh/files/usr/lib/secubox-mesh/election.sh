#!/bin/sh
# SecuBox Mesh Gate Election
# Elects a mesh gate (coordinator) based on node capabilities
# CyberMind — SecuBox — 2026

ELECTION_STATE="/var/lib/secubox-mesh/election_state.json"
MESH_GATE_FILE="/var/lib/secubox-mesh/mesh_gate"

# Election criteria weights
WEIGHT_UPTIME=30        # Higher uptime = more stable
WEIGHT_PEERS=25         # More peers = better connected
WEIGHT_CPU=15           # Lower CPU = more available
WEIGHT_MEMORY=15        # Lower memory = more available
WEIGHT_ROLE=15          # relay > edge for gate role

# Initialize election state
election_init() {
    mkdir -p "$(dirname "$ELECTION_STATE")"
}

# Calculate node score for gate election
election_calculate_score() {
    local did="$1"
    local telemetry="$2"
    local peer_count="${3:-0}"
    local role="${4:-edge}"

    local score=0

    # Uptime score (max 30 points for 24h+ uptime)
    local uptime
    uptime=$(echo "$telemetry" | jsonfilter -e '@.uptime' 2>/dev/null || echo 0)
    local uptime_hours=$((uptime / 3600))
    local uptime_score=$((uptime_hours > 24 ? WEIGHT_UPTIME : uptime_hours * WEIGHT_UPTIME / 24))
    score=$((score + uptime_score))

    # Peer count score (max 25 points for 10+ peers)
    local peer_score=$((peer_count > 10 ? WEIGHT_PEERS : peer_count * WEIGHT_PEERS / 10))
    score=$((score + peer_score))

    # CPU availability score (lower usage = higher score)
    local cpu_percent
    cpu_percent=$(echo "$telemetry" | jsonfilter -e '@.cpu_percent' 2>/dev/null || echo 50)
    local cpu_score=$(( (100 - cpu_percent) * WEIGHT_CPU / 100 ))
    score=$((score + cpu_score))

    # Memory availability score (lower usage = higher score)
    local memory_percent
    memory_percent=$(echo "$telemetry" | jsonfilter -e '@.memory_percent' 2>/dev/null || echo 50)
    local memory_score=$(( (100 - memory_percent) * WEIGHT_MEMORY / 100 ))
    score=$((score + memory_score))

    # Role score
    local role_score=0
    case "$role" in
        relay|master)
            role_score=$WEIGHT_ROLE
            ;;
        submaster)
            role_score=$((WEIGHT_ROLE * 3 / 4))
            ;;
        edge|peer)
            role_score=$((WEIGHT_ROLE / 2))
            ;;
        *)
            role_score=$((WEIGHT_ROLE / 4))
            ;;
    esac
    score=$((score + role_score))

    echo "$score"
}

# Run gate election
election_run() {
    local nodes_file="/var/lib/secubox-mesh/nodes.json"
    local telemetry_file="/var/lib/secubox-mesh/telemetry.json"
    local peers_file="/var/lib/secubox-mesh/peers.json"

    local best_did=""
    local best_score=0
    local my_did="${NODE_DID:-$(cat /var/lib/mirrornet/identity/did.txt 2>/dev/null)}"

    # Calculate score for this node
    if [ -n "$my_did" ]; then
        local my_telemetry
        my_telemetry=$(cat "$telemetry_file" 2>/dev/null || echo '{}')
        local my_peer_count
        my_peer_count=$(jsonfilter -i "$peers_file" -e '@[*]' 2>/dev/null | wc -l)
        local my_role="${CURRENT_ROLE:-edge}"

        local my_score
        my_score=$(election_calculate_score "$my_did" "$my_telemetry" "$my_peer_count" "$my_role")

        best_did="$my_did"
        best_score="$my_score"
    fi

    # Check peer scores (if we have their telemetry)
    while IFS= read -r peer_json; do
        [ -z "$peer_json" ] && continue

        local peer_did peer_role
        peer_did=$(echo "$peer_json" | jsonfilter -e '@.did' 2>/dev/null)
        peer_role=$(echo "$peer_json" | jsonfilter -e '@.role' 2>/dev/null || echo "edge")

        [ -z "$peer_did" ] && continue

        # Try to get peer's telemetry via API
        local peer_addr peer_port
        peer_addr=$(echo "$peer_json" | jsonfilter -e '@.address' 2>/dev/null)
        peer_port=$(echo "$peer_json" | jsonfilter -e '@.port' 2>/dev/null || echo "7331")

        local peer_telemetry
        peer_telemetry=$(timeout 2 wget -qO- "http://$peer_addr:$peer_port/api/telemetry" 2>/dev/null)

        if [ -n "$peer_telemetry" ]; then
            # Count peer's peers (simplified: assume similar to ours)
            local peer_peer_count="$my_peer_count"

            local peer_score
            peer_score=$(election_calculate_score "$peer_did" "$peer_telemetry" "$peer_peer_count" "$peer_role")

            if [ "$peer_score" -gt "$best_score" ]; then
                best_did="$peer_did"
                best_score="$peer_score"
            fi
        fi
    done < <(jsonfilter -i "$peers_file" -e '@[*]' 2>/dev/null)

    # Save election result
    echo "$best_did" > "$MESH_GATE_FILE"

    # Save election state
    cat > "$ELECTION_STATE" <<EOF
{
  "mesh_gate": "$best_did",
  "score": $best_score,
  "elected_at": "$(date -Iseconds)",
  "candidates_evaluated": $(jsonfilter -i "$peers_file" -e '@[*]' 2>/dev/null | wc -l)
}
EOF

    # Log election result
    if [ "$best_did" = "$my_did" ]; then
        logger -t secubox-mesh "This node elected as mesh gate (score: $best_score)"
    else
        logger -t secubox-mesh "Mesh gate: $best_did (score: $best_score)"
    fi

    echo "$best_did"
}

# Get current mesh gate
election_get_gate() {
    cat "$MESH_GATE_FILE" 2>/dev/null || echo ""
}

# Check if this node is the gate
election_is_gate() {
    local current_gate
    current_gate=$(election_get_gate)
    local my_did="${NODE_DID:-$(cat /var/lib/mirrornet/identity/did.txt 2>/dev/null)}"

    [ "$current_gate" = "$my_did" ]
}

# Force election (trigger immediate re-election)
election_force() {
    rm -f "$MESH_GATE_FILE" "$ELECTION_STATE"
    election_run
}

# Get election state
election_get_state() {
    if [ -f "$ELECTION_STATE" ]; then
        cat "$ELECTION_STATE"
    else
        echo '{"mesh_gate":"","score":0,"elected_at":"","candidates_evaluated":0}'
    fi
}

# Initialize on source
election_init
