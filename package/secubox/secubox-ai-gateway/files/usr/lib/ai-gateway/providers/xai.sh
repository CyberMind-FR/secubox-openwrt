#!/bin/sh
# SecuBox AI Gateway - xAI (Grok) Provider Adapter

CONFIG="ai-gateway"

provider_request() {
	local request_json="$1"

	local endpoint=$(uci -q get ${CONFIG}.xai.endpoint || echo "https://api.x.ai/v1")
	local api_key=$(uci -q get ${CONFIG}.xai.api_key)
	local model=$(uci -q get ${CONFIG}.xai.model || echo "grok-2")

	if [ -z "$api_key" ]; then
		printf '{"error":{"message":"xAI API key not configured","type":"auth_error","code":"missing_api_key"}}'
		return 1
	fi

	# Override model in request
	request_json=$(echo "$request_json" | sed "s/\"model\":[^,}]*/\"model\":\"$model\"/")

	# Send to xAI API (OpenAI-compatible)
	local response=$(echo "$request_json" | wget -q -O - \
		--post-data=- \
		--header="Content-Type: application/json" \
		--header="Authorization: Bearer $api_key" \
		"${endpoint}/chat/completions" 2>/dev/null)

	if [ -z "$response" ]; then
		printf '{"error":{"message":"xAI API request failed","type":"provider_error","code":"xai_error"}}'
		return 1
	fi

	echo "$response"
}

provider_test() {
	local api_key=$(uci -q get ${CONFIG}.xai.api_key)

	echo "Testing xAI (Grok)..."

	if [ -z "$api_key" ]; then
		echo "Status: NOT CONFIGURED (no API key)"
		return 1
	fi

	echo "Status: CONFIGURED"
	echo "API Key: ***"
	return 0
}
