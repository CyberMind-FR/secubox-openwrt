#!/bin/sh
# SecuBox AI Gateway - Provider Routing Logic
# Selects appropriate AI provider based on data classification

CONFIG="ai-gateway"
PROVIDERS_DIR="/usr/lib/ai-gateway/providers"

# Load all provider configurations
load_providers() {
	. /lib/functions.sh
	config_load "$CONFIG"
}

# Get ordered list of enabled providers for a classification level
# Args: $1 = classification (local_only, sanitized, cloud_direct)
# Output: space-separated list of provider names sorted by priority
get_enabled_providers() {
	local classification="$1"
	local providers=""

	# Iterate through all provider sections
	for section in localai mistral claude openai gemini xai; do
		local enabled=$(uci -q get ${CONFIG}.${section}.enabled)
		[ "$enabled" != "1" ] && continue

		local prov_class=$(uci -q get ${CONFIG}.${section}.classification)
		local priority=$(uci -q get ${CONFIG}.${section}.priority || echo 99)

		# Filter by classification level
		case "$classification" in
			local_only)
				# Only LocalAI for local_only
				[ "$prov_class" = "local_only" ] || continue
				;;
			sanitized)
				# LocalAI or EU providers (Mistral)
				[ "$prov_class" = "local_only" ] || [ "$prov_class" = "sanitized" ] || continue
				;;
			cloud_direct)
				# Any provider allowed
				;;
		esac

		providers="${providers}${priority}:${section} "
	done

	# Sort by priority and return provider names
	echo "$providers" | tr ' ' '\n' | sort -t: -k1 -n | cut -d: -f2 | tr '\n' ' '
}

# Check if a provider is available (has API key or is local)
provider_available() {
	local provider="$1"

	case "$provider" in
		localai)
			# Check if LocalAI is running
			local endpoint=$(uci -q get ${CONFIG}.localai.endpoint || echo "http://127.0.0.1:8081")
			wget -q -O /dev/null --timeout=2 "${endpoint}/readyz" 2>/dev/null
			return $?
			;;
		*)
			# Cloud providers need API key
			local api_key=$(uci -q get ${CONFIG}.${provider}.api_key)
			[ -n "$api_key" ] && return 0
			return 1
			;;
	esac
}

# Select best available provider for a classification
# Args: $1 = classification
# Output: provider name or empty if none available
select_provider() {
	local classification="$1"

	for provider in $(get_enabled_providers "$classification"); do
		[ -z "$provider" ] && continue
		if provider_available "$provider"; then
			echo "$provider"
			return 0
		fi
	done

	# No provider available
	return 1
}

# Route request to selected provider
# Args: $1 = JSON request, $2 = classification
# Output: JSON response
route_request() {
	local request_json="$1"
	local classification="$2"

	local provider=$(select_provider "$classification")
	if [ -z "$provider" ]; then
		printf '{"error":{"code":"no_provider","message":"No provider available for classification: %s"}}' "$classification"
		return 1
	fi

	# Source provider adapter
	local adapter="${PROVIDERS_DIR}/${provider}.sh"
	if [ ! -f "$adapter" ]; then
		printf '{"error":{"code":"adapter_missing","message":"Provider adapter not found: %s"}}' "$provider"
		return 1
	fi

	. "$adapter"

	# Call provider-specific handler
	provider_request "$request_json"
}

# Get provider info for status display
get_provider_info() {
	local provider="$1"

	local enabled=$(uci -q get ${CONFIG}.${provider}.enabled || echo "0")
	local priority=$(uci -q get ${CONFIG}.${provider}.priority || echo "-")
	local classification=$(uci -q get ${CONFIG}.${provider}.classification || echo "-")
	local model=$(uci -q get ${CONFIG}.${provider}.model || echo "-")

	local status="unavailable"
	if [ "$enabled" = "1" ]; then
		provider_available "$provider" && status="available" || status="configured"
	fi

	printf '{"name":"%s","enabled":%s,"priority":%s,"classification":"%s","model":"%s","status":"%s"}' \
		"$provider" \
		"$([ "$enabled" = "1" ] && echo "true" || echo "false")" \
		"$priority" \
		"$classification" \
		"$model" \
		"$status"
}
