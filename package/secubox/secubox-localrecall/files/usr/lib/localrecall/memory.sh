#!/bin/sh
# LocalRecall Memory Library
# Persistent memory storage for AI agents

STORAGE_DIR="/var/lib/localrecall"
MEMORIES_FILE="$STORAGE_DIR/memories.json"
INDEX_FILE="$STORAGE_DIR/index.json"

# Initialize storage
init_storage() {
	mkdir -p "$STORAGE_DIR"
	[ -f "$MEMORIES_FILE" ] || echo '[]' > "$MEMORIES_FILE"
	[ -f "$INDEX_FILE" ] || echo '{}' > "$INDEX_FILE"
}

# Generate unique ID
gen_id() {
	head -c 8 /dev/urandom | md5sum | head -c 16
}

# Add a memory
# $1 = category (threats|decisions|patterns|configs|conversations)
# $2 = agent (threat_analyst|dns_guard|network_anomaly|cve_triage|user)
# $3 = content
# $4 = metadata JSON (optional)
# $5 = importance (1-10, optional, default 5)
add_memory() {
	local category="$1"
	local agent="$2"
	local content="$3"
	local metadata="${4:-{}}"
	local importance="${5:-5}"

	init_storage

	local id=$(gen_id)
	local timestamp=$(date -Iseconds)

	# Escape content for JSON
	local escaped_content=$(printf '%s' "$content" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')

	# Create memory entry
	local memory=$(cat <<EOF
{
	"id": "$id",
	"category": "$category",
	"agent": "$agent",
	"content": "$escaped_content",
	"metadata": $metadata,
	"importance": $importance,
	"timestamp": "$timestamp",
	"accessed": "$timestamp",
	"access_count": 0
}
EOF
)

	# Append to memories file
	local tmp_file="$MEMORIES_FILE.tmp"

	if [ -s "$MEMORIES_FILE" ] && [ "$(cat "$MEMORIES_FILE")" != "[]" ]; then
		# Remove closing bracket, add comma and new entry
		head -c -2 "$MEMORIES_FILE" > "$tmp_file"
		printf ',\n%s\n]' "$memory" >> "$tmp_file"
	else
		# First entry
		printf '[\n%s\n]' "$memory" > "$tmp_file"
	fi

	mv "$tmp_file" "$MEMORIES_FILE"

	# Update category index
	update_index "$category" "$id"

	echo "$id"
}

# Update category index
update_index() {
	local category="$1"
	local id="$2"

	local index=$(cat "$INDEX_FILE" 2>/dev/null || echo '{}')

	# Simple JSON manipulation for index
	if echo "$index" | grep -q "\"$category\""; then
		# Add ID to existing category array
		local tmp_file="$INDEX_FILE.tmp"
		sed "s/\"$category\":\[/\"$category\":[\"$id\",/" "$INDEX_FILE" > "$tmp_file"
		mv "$tmp_file" "$INDEX_FILE"
	else
		# Create new category entry
		local tmp_file="$INDEX_FILE.tmp"
		if [ "$index" = "{}" ]; then
			echo "{\"$category\":[\"$id\"]}" > "$tmp_file"
		else
			# Add to existing object
			sed "s/^{/{\"$category\":[\"$id\"],/" "$INDEX_FILE" > "$tmp_file"
		fi
		mv "$tmp_file" "$INDEX_FILE"
	fi
}

# Get memory by ID
get_memory() {
	local id="$1"

	[ ! -f "$MEMORIES_FILE" ] && return 1

	# Extract memory with matching ID
	local memory=$(jsonfilter -i "$MEMORIES_FILE" -e "@[@.id='$id']" 2>/dev/null)

	if [ -n "$memory" ]; then
		# Update access timestamp and count
		update_access "$id"
		echo "$memory"
		return 0
	fi

	return 1
}

# Update access stats
update_access() {
	local id="$1"
	local timestamp=$(date -Iseconds)

	# Update accessed timestamp (simplified - full impl would use proper JSON parsing)
	local tmp_file="$MEMORIES_FILE.tmp"
	sed "s/\"id\":\"$id\",\\(.*\\)\"accessed\":\"[^\"]*\"/\"id\":\"$id\",\\1\"accessed\":\"$timestamp\"/" \
		"$MEMORIES_FILE" > "$tmp_file"
	mv "$tmp_file" "$MEMORIES_FILE"
}

# Search memories by category
search_category() {
	local category="$1"
	local limit="${2:-20}"

	[ ! -f "$MEMORIES_FILE" ] && echo '[]' && return

	# Filter by category
	jsonfilter -i "$MEMORIES_FILE" -e "@[@.category='$category']" 2>/dev/null | head -n "$limit"
}

# Search memories by agent
search_agent() {
	local agent="$1"
	local limit="${2:-20}"

	[ ! -f "$MEMORIES_FILE" ] && echo '[]' && return

	jsonfilter -i "$MEMORIES_FILE" -e "@[@.agent='$agent']" 2>/dev/null | head -n "$limit"
}

# Search memories by content (simple grep)
search_content() {
	local query="$1"
	local limit="${2:-20}"

	[ ! -f "$MEMORIES_FILE" ] && echo '[]' && return

	grep -i "$query" "$MEMORIES_FILE" 2>/dev/null | head -n "$limit"
}

# Get recent memories
get_recent() {
	local limit="${1:-20}"

	[ ! -f "$MEMORIES_FILE" ] && echo '[]' && return

	# Return last N entries (file is append-only so last = recent)
	jsonfilter -i "$MEMORIES_FILE" -e '@[*]' 2>/dev/null | tail -n "$limit"
}

# Get important memories (importance >= 7)
get_important() {
	local limit="${1:-50}"

	[ ! -f "$MEMORIES_FILE" ] && echo '[]' && return

	# Filter by importance
	local result='['
	local first=1

	jsonfilter -i "$MEMORIES_FILE" -e '@[*]' 2>/dev/null | while read -r mem; do
		local imp=$(echo "$mem" | jsonfilter -e '@.importance' 2>/dev/null)
		if [ "${imp:-0}" -ge 7 ]; then
			[ $first -eq 0 ] && result="${result},"
			first=0
			result="${result}${mem}"
		fi
	done

	echo "${result}]"
}

# Delete memory by ID
delete_memory() {
	local id="$1"

	[ ! -f "$MEMORIES_FILE" ] && return 1

	# Filter out the memory with this ID
	local tmp_file="$MEMORIES_FILE.tmp"
	local result='['
	local first=1

	jsonfilter -i "$MEMORIES_FILE" -e '@[*]' 2>/dev/null | while read -r mem; do
		local mem_id=$(echo "$mem" | jsonfilter -e '@.id' 2>/dev/null)
		if [ "$mem_id" != "$id" ]; then
			[ $first -eq 0 ] && result="${result},"
			first=0
			result="${result}${mem}"
		fi
	done

	echo "${result}]" > "$tmp_file"
	mv "$tmp_file" "$MEMORIES_FILE"
}

# Cleanup old memories
cleanup_old() {
	local retention_days="${1:-90}"
	local keep_important="${2:-1}"

	[ ! -f "$MEMORIES_FILE" ] && return

	local cutoff_date=$(date -d "-${retention_days} days" -Iseconds 2>/dev/null || date -Iseconds)
	local deleted=0

	local tmp_file="$MEMORIES_FILE.tmp"
	local result='['
	local first=1

	jsonfilter -i "$MEMORIES_FILE" -e '@[*]' 2>/dev/null | while read -r mem; do
		local ts=$(echo "$mem" | jsonfilter -e '@.timestamp' 2>/dev/null)
		local imp=$(echo "$mem" | jsonfilter -e '@.importance' 2>/dev/null)

		# Keep if recent or important
		local keep=0
		[ "$ts" \> "$cutoff_date" ] && keep=1
		[ "$keep_important" = "1" ] && [ "${imp:-0}" -ge 7 ] && keep=1

		if [ $keep -eq 1 ]; then
			[ $first -eq 0 ] && result="${result},"
			first=0
			result="${result}${mem}"
		else
			deleted=$((deleted + 1))
		fi
	done

	echo "${result}]" > "$tmp_file"
	mv "$tmp_file" "$MEMORIES_FILE"

	echo "$deleted"
}

# Count memories
count_memories() {
	[ ! -f "$MEMORIES_FILE" ] && echo 0 && return
	jsonfilter -i "$MEMORIES_FILE" -e '@[*]' 2>/dev/null | wc -l
}

# Count by category
count_category() {
	local category="$1"
	[ ! -f "$MEMORIES_FILE" ] && echo 0 && return
	jsonfilter -i "$MEMORIES_FILE" -e "@[@.category='$category']" 2>/dev/null | wc -l
}

# Export memories to file
export_memories() {
	local output_file="$1"
	[ -f "$MEMORIES_FILE" ] && cp "$MEMORIES_FILE" "$output_file"
}

# Import memories from file
import_memories() {
	local input_file="$1"

	[ ! -f "$input_file" ] && return 1

	# Validate JSON
	jsonfilter -i "$input_file" -e '@[0]' >/dev/null 2>&1 || return 1

	# Merge with existing (simple concat for now)
	init_storage

	if [ -s "$MEMORIES_FILE" ] && [ "$(cat "$MEMORIES_FILE")" != "[]" ]; then
		# Merge arrays
		local tmp_file="$MEMORIES_FILE.tmp"
		head -c -1 "$MEMORIES_FILE" > "$tmp_file"
		printf ','
		tail -c +2 "$input_file" >> "$tmp_file"
		mv "$tmp_file" "$MEMORIES_FILE"
	else
		cp "$input_file" "$MEMORIES_FILE"
	fi
}
