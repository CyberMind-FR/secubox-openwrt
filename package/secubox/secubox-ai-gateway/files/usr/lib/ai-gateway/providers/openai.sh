#!/bin/sh
# SecuBox AI Gateway - OpenAI Provider Adapter

CONFIG="ai-gateway"

provider_request() {
	local request_json="$1"

	local endpoint=$(uci -q get ${CONFIG}.openai.endpoint || echo "https://api.openai.com/v1")
	local api_key=$(uci -q get ${CONFIG}.openai.api_key)
	local model=$(uci -q get ${CONFIG}.openai.model || echo "gpt-4o")

	if [ -z "$api_key" ]; then
		printf '{"error":{"message":"OpenAI API key not configured","type":"auth_error","code":"missing_api_key"}}'
		return 1
	fi

	# Override model in request
	request_json=$(echo "$request_json" | sed "s/\"model\":[^,}]*/\"model\":\"$model\"/")

	# Send to OpenAI API
	local response=$(echo "$request_json" | wget -q -O - \
		--post-data=- \
		--header="Content-Type: application/json" \
		--header="Authorization: Bearer $api_key" \
		"${endpoint}/chat/completions" 2>/dev/null)

	if [ -z "$response" ]; then
		printf '{"error":{"message":"OpenAI API request failed","type":"provider_error","code":"openai_error"}}'
		return 1
	fi

	echo "$response"
}

provider_test() {
	local api_key=$(uci -q get ${CONFIG}.openai.api_key)

	echo "Testing OpenAI..."

	if [ -z "$api_key" ]; then
		echo "Status: NOT CONFIGURED (no API key)"
		return 1
	fi

	# Check API key format
	if echo "$api_key" | grep -q "^sk-"; then
		echo "Status: CONFIGURED"
		echo "API Key: sk-***"
		return 0
	else
		echo "Status: INVALID API KEY FORMAT"
		return 1
	fi
}
