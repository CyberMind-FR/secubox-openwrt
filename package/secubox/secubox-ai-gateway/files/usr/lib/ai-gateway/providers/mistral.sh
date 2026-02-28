#!/bin/sh
# SecuBox AI Gateway - Mistral Provider Adapter
# EU Sovereign AI Provider (GDPR Compliant)

CONFIG="ai-gateway"

provider_request() {
	local request_json="$1"

	local endpoint=$(uci -q get ${CONFIG}.mistral.endpoint || echo "https://api.mistral.ai/v1")
	local api_key=$(uci -q get ${CONFIG}.mistral.api_key)
	local model=$(uci -q get ${CONFIG}.mistral.model || echo "mistral-small-latest")

	if [ -z "$api_key" ]; then
		printf '{"error":{"message":"Mistral API key not configured","type":"auth_error","code":"missing_api_key"}}'
		return 1
	fi

	# Override model in request
	request_json=$(echo "$request_json" | sed "s/\"model\":[^,}]*/\"model\":\"$model\"/")

	# Send to Mistral API
	local response=$(echo "$request_json" | wget -q -O - \
		--post-data=- \
		--header="Content-Type: application/json" \
		--header="Authorization: Bearer $api_key" \
		"${endpoint}/chat/completions" 2>/dev/null)

	if [ -z "$response" ]; then
		printf '{"error":{"message":"Mistral API request failed","type":"provider_error","code":"mistral_error"}}'
		return 1
	fi

	echo "$response"
}

provider_test() {
	local endpoint=$(uci -q get ${CONFIG}.mistral.endpoint || echo "https://api.mistral.ai/v1")
	local api_key=$(uci -q get ${CONFIG}.mistral.api_key)

	echo "Testing Mistral AI (EU)..."

	if [ -z "$api_key" ]; then
		echo "Status: NOT CONFIGURED (no API key)"
		return 1
	fi

	# Test with models endpoint
	local response=$(wget -q -O - \
		--header="Authorization: Bearer $api_key" \
		"${endpoint}/models" 2>/dev/null)

	if [ -n "$response" ] && ! echo "$response" | grep -q '"error"'; then
		echo "Status: AVAILABLE"
		echo "Region: EU (GDPR compliant)"
		return 0
	else
		echo "Status: ERROR"
		echo "$response" | head -1
		return 1
	fi
}
