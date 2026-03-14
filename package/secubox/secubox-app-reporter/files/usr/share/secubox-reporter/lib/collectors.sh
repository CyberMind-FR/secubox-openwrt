#!/bin/sh
# SecuBox Reporter - Data Collectors
# Extracts data from .claude files and system services

# Collect recent history entries
collect_history() {
    local history_file="$1"
    [ ! -f "$history_file" ] && return

    local output=""
    local count=0
    local max_entries=10
    local current_date=""
    local in_section=0

    while IFS= read -r line; do
        # Match date headers like "### 2026-03-12"
        if echo "$line" | grep -qE '^### [0-9]{4}-[0-9]{2}-[0-9]{2}'; then
            [ $count -ge $max_entries ] && break

            current_date=$(echo "$line" | sed 's/### //')
            output="$output<div class='history-entry'><div class='history-date'>$current_date</div><ul>"
            in_section=1
            count=$((count + 1))
        elif [ $in_section -eq 1 ]; then
            # Match bullet points
            if echo "$line" | grep -qE '^- '; then
                local item=$(echo "$line" | sed 's/^- //' | sed 's/\*\*\([^*]*\)\*\*/<strong>\1<\/strong>/g')
                output="$output<li>$item</li>"
            elif echo "$line" | grep -qE '^$'; then
                output="$output</ul></div>"
                in_section=0
            fi
        fi
    done < "$history_file"

    # Close any open section
    [ $in_section -eq 1 ] && output="$output</ul></div>"

    echo "$output"
}

# Collect WIP items
collect_wip() {
    local wip_file="$1"
    [ ! -f "$wip_file" ] && return

    local output=""
    local in_nextup=0
    local in_inprogress=0

    while IFS= read -r line; do
        # Find "Next Up" or "In Progress" sections
        if echo "$line" | grep -qiE '^## Next Up|^### Next Up'; then
            output="$output<div class='wip-section'><h4>Next Up</h4><ul>"
            in_nextup=1
            in_inprogress=0
        elif echo "$line" | grep -qiE '^## In Progress|^### In Progress'; then
            [ $in_nextup -eq 1 ] && output="$output</ul></div>"
            output="$output<div class='wip-section'><h4>In Progress</h4><ul>"
            in_inprogress=1
            in_nextup=0
        elif echo "$line" | grep -qE '^## |^### '; then
            # End of section
            [ $in_nextup -eq 1 ] && output="$output</ul></div>"
            [ $in_inprogress -eq 1 ] && output="$output</ul></div>"
            in_nextup=0
            in_inprogress=0
        elif [ $in_nextup -eq 1 ] || [ $in_inprogress -eq 1 ]; then
            if echo "$line" | grep -qE '^[0-9]+\. |^- '; then
                local item=$(echo "$line" | sed 's/^[0-9]*\. //' | sed 's/^- //' | sed 's/\*\*\([^*]*\)\*\*/<strong>\1<\/strong>/g')
                [ -n "$item" ] && output="$output<li>$item</li>"
            fi
        fi
    done < "$wip_file"

    # Close any open sections
    [ $in_nextup -eq 1 ] && output="$output</ul></div>"
    [ $in_inprogress -eq 1 ] && output="$output</ul></div>"

    echo "$output"
}

# Collect roadmap progress
collect_roadmap() {
    local roadmap_file="$1"
    [ ! -f "$roadmap_file" ] && return

    local output=""
    local current_version=""

    # Extract version sections with status
    while IFS= read -r line; do
        if echo "$line" | grep -qE '^### v[0-9]+\.[0-9]+'; then
            current_version=$(echo "$line" | grep -oE 'v[0-9]+\.[0-9]+')
            local title=$(echo "$line" | sed 's/^### //')
            output="$output<div class='roadmap-version'><h4>$title</h4>"
        elif echo "$line" | grep -qiE '^\*\*Status:'; then
            local status=$(echo "$line" | sed 's/.*Status: *//' | sed 's/\*//g')
            local status_class="pending"
            echo "$status" | grep -qi "progress" && status_class="inprogress"
            echo "$status" | grep -qi "complete\|done" && status_class="complete"
            output="$output<span class='status-badge $status_class'>$status</span></div>"
        fi
    done < "$roadmap_file"

    echo "$output"
}

# Collect Tor hidden services
collect_tor_services() {
    local output=""
    local tor_dir="/var/lib/tor/hidden_services"

    [ ! -d "$tor_dir" ] && echo "<p class='muted'>No Tor services configured</p>" && return

    output="<table class='services-table'><thead><tr><th>Service</th><th>Onion Address</th><th>Port</th></tr></thead><tbody>"

    for service_dir in "$tor_dir"/*/; do
        [ ! -d "$service_dir" ] && continue
        local name=$(basename "$service_dir")
        local hostname_file="$service_dir/hostname"

        if [ -f "$hostname_file" ]; then
            local onion=$(cat "$hostname_file" | head -1)
            local port=$(grep -oE '[0-9]+$' "$service_dir/../torrc" 2>/dev/null | head -1)
            [ -z "$port" ] && port="80"
            output="$output<tr><td>$name</td><td><code>$onion</code></td><td>$port</td></tr>"
        fi
    done

    output="$output</tbody></table>"
    echo "$output"
}

# Collect DNS/SSL services (HAProxy vhosts)
collect_dns_services() {
    local output=""

    output="<table class='services-table'><thead><tr><th>Domain</th><th>Backend</th><th>SSL</th><th>Status</th></tr></thead><tbody>"

    # Parse HAProxy vhosts from UCI
    for vhost in $(uci show haproxy 2>/dev/null | grep '=vhost$' | cut -d'.' -f2 | cut -d'=' -f1); do
        local enabled=$(uci -q get haproxy.$vhost.enabled)
        [ "$enabled" != "1" ] && continue

        local domain=$(uci -q get haproxy.$vhost.domain)
        local backend=$(uci -q get haproxy.$vhost.backend)
        local ssl=$(uci -q get haproxy.$vhost.ssl)

        local ssl_icon="❌"
        [ "$ssl" = "1" ] && ssl_icon="✅"

        local status_class="running"
        local status_text="Active"

        output="$output<tr><td><a href='https://$domain' target='_blank'>$domain</a></td><td>$backend</td><td>$ssl_icon</td><td><span class='status-badge $status_class'>$status_text</span></td></tr>"
    done

    output="$output</tbody></table>"
    echo "$output"
}

# Collect Mesh services
collect_mesh_services() {
    local output=""

    if ! command -v secubox-p2p >/dev/null 2>&1; then
        echo "<p class='muted'>P2P mesh not installed</p>"
        return
    fi

    output="<table class='services-table'><thead><tr><th>Service</th><th>Node</th><th>Port</th></tr></thead><tbody>"

    # Get shared services from P2P
    secubox-p2p shared-services 2>/dev/null | while read line; do
        local name=$(echo "$line" | cut -d':' -f1)
        local node=$(echo "$line" | cut -d':' -f2)
        local port=$(echo "$line" | cut -d':' -f3)
        output="$output<tr><td>$name</td><td>$node</td><td>$port</td></tr>"
    done

    output="$output</tbody></table>"
    echo "$output"
}
