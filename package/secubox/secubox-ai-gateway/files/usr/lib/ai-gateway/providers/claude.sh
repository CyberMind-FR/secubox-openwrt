#!/bin/sh
# SecuBox AI Gateway - Claude Provider Adapter
# Anthropic Claude API

CONFIG="ai-gateway"

provider_request() {
	local request_json="$1"

	local endpoint=$(uci -q get ${CONFIG}.claude.endpoint || echo "https://api.anthropic.com/v1")
	local api_key=$(uci -q get ${CONFIG}.claude.api_key)
	local model=$(uci -q get ${CONFIG}.claude.model || echo "claude-sonnet-4-20250514")

	if [ -z "$api_key" ]; then
		printf '{"error":{"message":"Claude API key not configured","type":"auth_error","code":"missing_api_key"}}'
		return 1
	fi

	# Convert OpenAI format to Anthropic format
	local messages=$(echo "$request_json" | jsonfilter -e '@.messages')
	local max_tokens=$(echo "$request_json" | jsonfilter -e '@.max_tokens' 2>/dev/null || echo "1024")

	# Build Anthropic request
	local anthropic_request=$(cat <<EOF
{
  "model": "$model",
  "max_tokens": $max_tokens,
  "messages": $messages
}
EOF
)

	# Send to Anthropic API
	local response=$(echo "$anthropic_request" | wget -q -O - \
		--post-data=- \
		--header="Content-Type: application/json" \
		--header="x-api-key: $api_key" \
		--header="anthropic-version: 2023-06-01" \
		"${endpoint}/messages" 2>/dev/null)

	if [ -z "$response" ]; then
		printf '{"error":{"message":"Claude API request failed","type":"provider_error","code":"claude_error"}}'
		return 1
	fi

	# Convert Anthropic response to OpenAI format
	local content=$(echo "$response" | jsonfilter -e '@.content[0].text' 2>/dev/null)
	if [ -n "$content" ]; then
		printf '{"choices":[{"message":{"role":"assistant","content":"%s"},"finish_reason":"stop"}]}' "$content"
	else
		echo "$response"
	fi
}

provider_test() {
	local api_key=$(uci -q get ${CONFIG}.claude.api_key)

	echo "Testing Claude (Anthropic)..."

	if [ -z "$api_key" ]; then
		echo "Status: NOT CONFIGURED (no API key)"
		return 1
	fi

	# Simple validation - check API key format
	if echo "$api_key" | grep -q "^sk-ant-"; then
		echo "Status: CONFIGURED"
		echo "API Key: sk-ant-***"
		return 0
	else
		echo "Status: INVALID API KEY FORMAT"
		return 1
	fi
}
