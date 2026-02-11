#!/bin/sh
# LocalRecall AI Integration
# Semantic search and AI-powered memory operations

# Source memory library
. /usr/lib/localrecall/memory.sh

# Get LocalAI settings
get_localai_config() {
	local url=$(uci -q get localrecall.main.localai_url)
	local model=$(uci -q get localrecall.main.localai_model)
	local embed_model=$(uci -q get localrecall.main.embedding_model)

	LOCALAI_URL="${url:-http://127.0.0.1:8091}"
	LOCALAI_MODEL="${model:-tinyllama-1.1b-chat-v1.0.Q4_K_M}"
	EMBEDDING_MODEL="${embed_model:-gte-small}"
}

# Check LocalAI availability
check_localai() {
	get_localai_config
	curl -s --max-time 2 "${LOCALAI_URL}/v1/models" >/dev/null 2>&1
}

# Generate embedding for text
# $1 = text to embed
generate_embedding() {
	local text="$1"

	get_localai_config

	local escaped=$(printf '%s' "$text" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')

	local response=$(curl -s --max-time 30 -X POST "${LOCALAI_URL}/v1/embeddings" \
		-H "Content-Type: application/json" \
		-d "{\"model\":\"$EMBEDDING_MODEL\",\"input\":\"$escaped\"}" 2>/dev/null)

	if [ -n "$response" ]; then
		echo "$response" | jsonfilter -e '@.data[0].embedding' 2>/dev/null
	fi
}

# Semantic search using embeddings
# $1 = query text
# $2 = limit (optional)
semantic_search() {
	local query="$1"
	local limit="${2:-10}"

	# For now, fall back to keyword search
	# Full implementation would compute embedding similarity
	search_content "$query" "$limit"
}

# Summarize memories for context
# $1 = category (optional)
# $2 = agent (optional)
summarize_memories() {
	local category="$1"
	local agent="$2"

	get_localai_config

	# Collect relevant memories
	local memories=""

	if [ -n "$category" ]; then
		memories=$(search_category "$category" 20)
	elif [ -n "$agent" ]; then
		memories=$(search_agent "$agent" 20)
	else
		memories=$(get_recent 20)
	fi

	[ -z "$memories" ] && echo "No memories to summarize" && return

	# Build prompt
	local prompt="Summarize the following security-related memories into key insights. Be concise:\n\n$memories"
	prompt=$(printf '%s' "$prompt" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')

	local response=$(curl -s --max-time 60 -X POST "${LOCALAI_URL}/v1/chat/completions" \
		-H "Content-Type: application/json" \
		-d "{\"model\":\"$LOCALAI_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"$prompt\"}],\"max_tokens\":256,\"temperature\":0.3}" 2>/dev/null)

	if [ -n "$response" ]; then
		echo "$response" | jsonfilter -e '@.choices[0].message.content' 2>/dev/null
	else
		echo "AI summarization failed"
	fi
}

# Extract key facts from text and store as memories
# $1 = source text
# $2 = agent
# $3 = category
auto_memorize() {
	local text="$1"
	local agent="$2"
	local category="${3:-patterns}"

	get_localai_config

	local prompt="Extract the most important security facts from this text. Return each fact on a new line, starting with importance score (1-10):\n\n$text"
	prompt=$(printf '%s' "$prompt" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')

	local response=$(curl -s --max-time 60 -X POST "${LOCALAI_URL}/v1/chat/completions" \
		-H "Content-Type: application/json" \
		-d "{\"model\":\"$LOCALAI_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"$prompt\"}],\"max_tokens\":512,\"temperature\":0.3}" 2>/dev/null)

	if [ -n "$response" ]; then
		local facts=$(echo "$response" | jsonfilter -e '@.choices[0].message.content' 2>/dev/null)

		# Parse and store each fact
		local count=0
		echo "$facts" | while IFS= read -r line; do
			[ -z "$line" ] && continue

			# Try to extract importance (format: "8: fact text")
			local importance=5
			local content="$line"

			if echo "$line" | grep -qE '^[0-9]+:'; then
				importance=$(echo "$line" | cut -d: -f1)
				content=$(echo "$line" | cut -d: -f2-)
			fi

			add_memory "$category" "$agent" "$content" '{}' "$importance"
			count=$((count + 1))
		done

		echo "$count"
	else
		echo "0"
	fi
}

# Get context for an agent (relevant memories for current task)
# $1 = agent name
# $2 = current task/query
get_agent_context() {
	local agent="$1"
	local task="$2"

	# Get recent memories from this agent
	local agent_memories=$(search_agent "$agent" 10)

	# Get important memories
	local important=$(get_important 10)

	# Get related memories (keyword search from task)
	local related=""
	if [ -n "$task" ]; then
		# Extract key terms
		local terms=$(echo "$task" | tr ' ' '\n' | grep -E '^[a-zA-Z]{4,}' | head -5)
		for term in $terms; do
			local found=$(search_content "$term" 3)
			[ -n "$found" ] && related="${related}${found}\n"
		done
	fi

	# Combine into context
	cat <<EOF
## Agent Context: $agent

### Recent Actions
$agent_memories

### Important Memories
$important

### Related
$related
EOF
}

# Record a decision for future reference
# $1 = agent
# $2 = decision description
# $3 = outcome (approved|rejected|auto)
# $4 = details JSON
record_decision() {
	local agent="$1"
	local decision="$2"
	local outcome="$3"
	local details="${4:-{}}"

	local content="Decision: $decision | Outcome: $outcome"
	local metadata="{\"outcome\":\"$outcome\",\"details\":$details}"

	# Decisions are moderately important by default
	local importance=6
	[ "$outcome" = "rejected" ] && importance=7  # Learn from rejections

	add_memory "decisions" "$agent" "$content" "$metadata" "$importance"
}

# Record a threat pattern
# $1 = agent
# $2 = pattern description
# $3 = severity (low|medium|high|critical)
# $4 = details JSON
record_threat() {
	local agent="$1"
	local pattern="$2"
	local severity="$3"
	local details="${4:-{}}"

	local metadata="{\"severity\":\"$severity\",\"details\":$details}"

	# Importance based on severity
	local importance=5
	case "$severity" in
		critical) importance=10 ;;
		high) importance=8 ;;
		medium) importance=6 ;;
		low) importance=4 ;;
	esac

	add_memory "threats" "$agent" "$pattern" "$metadata" "$importance"
}
