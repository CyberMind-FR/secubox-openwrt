#!/bin/sh
# SecuBox AI Gateway - Data Classifier (Sovereignty Engine)
# Classifies AI requests into LOCAL_ONLY, SANITIZED, or CLOUD_DIRECT tiers

CONFIG="ai-gateway"
PATTERNS_LOCAL="/tmp/ai-gateway/patterns_local.txt"
PATTERNS_SANITIZABLE="/tmp/ai-gateway/patterns_sanitizable.txt"

# Classification levels (numeric for comparison)
CLASS_LOCAL_ONLY=0
CLASS_SANITIZED=1
CLASS_CLOUD_DIRECT=2

# Initialize pattern cache from UCI
init_patterns() {
	mkdir -p /tmp/ai-gateway

	# Load LOCAL_ONLY patterns from UCI
	> "$PATTERNS_LOCAL"
	local patterns=$(uci -q get ${CONFIG}.local_only_patterns.pattern 2>/dev/null)
	for p in $patterns; do
		echo "$p" >> "$PATTERNS_LOCAL"
	done

	# Load SANITIZABLE patterns from UCI
	> "$PATTERNS_SANITIZABLE"
	patterns=$(uci -q get ${CONFIG}.sanitizable_patterns.pattern 2>/dev/null)
	for p in $patterns; do
		echo "$p" >> "$PATTERNS_SANITIZABLE"
	done
}

# Classify a text block
# Returns: 0=LOCAL_ONLY, 1=SANITIZED, 2=CLOUD_DIRECT
classify_text() {
	local text="$1"
	local classification=$CLASS_CLOUD_DIRECT

	# Check for LOCAL_ONLY patterns (highest priority)
	while IFS= read -r pattern; do
		[ -z "$pattern" ] && continue
		if echo "$text" | grep -qiE "$pattern" 2>/dev/null; then
			return $CLASS_LOCAL_ONLY
		fi
	done < "$PATTERNS_LOCAL"

	# Check for SANITIZABLE patterns
	while IFS= read -r pattern; do
		[ -z "$pattern" ] && continue
		if echo "$text" | grep -qiE "$pattern" 2>/dev/null; then
			classification=$CLASS_SANITIZED
		fi
	done < "$PATTERNS_SANITIZABLE"

	return $classification
}

# Detailed classification with reason (JSON output)
classify_with_reason() {
	local text="$1"
	local matched_pattern=""

	# Check LOCAL_ONLY patterns
	while IFS= read -r pattern; do
		[ -z "$pattern" ] && continue
		if echo "$text" | grep -qiE "$pattern" 2>/dev/null; then
			printf '{"classification":"local_only","reason":"matched_sensitive_pattern","pattern":"%s"}\n' "$pattern"
			return 0
		fi
	done < "$PATTERNS_LOCAL"

	# Check SANITIZABLE patterns
	while IFS= read -r pattern; do
		[ -z "$pattern" ] && continue
		if echo "$text" | grep -qiE "$pattern" 2>/dev/null; then
			printf '{"classification":"sanitized","reason":"contains_pii","pattern":"%s"}\n' "$pattern"
			return 0
		fi
	done < "$PATTERNS_SANITIZABLE"

	# Default: safe for cloud
	printf '{"classification":"cloud_direct","reason":"no_sensitive_data","pattern":""}\n'
}

# High-level classification of full JSON request
classify_request() {
	local request_json="$1"
	local worst_classification=$CLASS_CLOUD_DIRECT

	# Extract all text content from messages array
	local messages=$(echo "$request_json" | jsonfilter -e '@.messages[*].content' 2>/dev/null)

	for msg in $messages; do
		classify_text "$msg"
		local msg_class=$?
		[ $msg_class -lt $worst_classification ] && worst_classification=$msg_class
	done

	# Also check prompt field (for completions API)
	local prompt=$(echo "$request_json" | jsonfilter -e '@.prompt' 2>/dev/null)
	if [ -n "$prompt" ]; then
		classify_text "$prompt"
		local prompt_class=$?
		[ $prompt_class -lt $worst_classification ] && worst_classification=$prompt_class
	fi

	# Check system message
	local system=$(echo "$request_json" | jsonfilter -e '@.messages[0].content' 2>/dev/null)
	if [ -n "$system" ]; then
		classify_text "$system"
		local sys_class=$?
		[ $sys_class -lt $worst_classification ] && worst_classification=$sys_class
	fi

	return $worst_classification
}

# Convert numeric classification to string
classification_to_string() {
	case "$1" in
		0) echo "local_only" ;;
		1) echo "sanitized" ;;
		2) echo "cloud_direct" ;;
		*) echo "local_only" ;;  # Default to most restrictive
	esac
}

# Convert string classification to numeric
string_to_classification() {
	case "$1" in
		local_only) echo 0 ;;
		sanitized) echo 1 ;;
		cloud_direct) echo 2 ;;
		*) echo 0 ;;  # Default to most restrictive
	esac
}
