#!/bin/sh
# SecuBox AI Gateway - Google Gemini Provider Adapter

CONFIG="ai-gateway"

provider_request() {
	local request_json="$1"

	local endpoint=$(uci -q get ${CONFIG}.gemini.endpoint || echo "https://generativelanguage.googleapis.com/v1beta")
	local api_key=$(uci -q get ${CONFIG}.gemini.api_key)
	local model=$(uci -q get ${CONFIG}.gemini.model || echo "gemini-pro")

	if [ -z "$api_key" ]; then
		printf '{"error":{"message":"Gemini API key not configured","type":"auth_error","code":"missing_api_key"}}'
		return 1
	fi

	# Convert OpenAI format to Gemini format
	local user_content=$(echo "$request_json" | jsonfilter -e '@.messages[-1].content' 2>/dev/null)

	# Build Gemini request
	local gemini_request=$(cat <<EOF
{
  "contents": [{"parts":[{"text":"$user_content"}]}]
}
EOF
)

	# Send to Gemini API
	local response=$(echo "$gemini_request" | wget -q -O - \
		--post-data=- \
		--header="Content-Type: application/json" \
		"${endpoint}/models/${model}:generateContent?key=${api_key}" 2>/dev/null)

	if [ -z "$response" ]; then
		printf '{"error":{"message":"Gemini API request failed","type":"provider_error","code":"gemini_error"}}'
		return 1
	fi

	# Convert Gemini response to OpenAI format
	local content=$(echo "$response" | jsonfilter -e '@.candidates[0].content.parts[0].text' 2>/dev/null)
	if [ -n "$content" ]; then
		printf '{"choices":[{"message":{"role":"assistant","content":"%s"},"finish_reason":"stop"}]}' "$content"
	else
		echo "$response"
	fi
}

provider_test() {
	local api_key=$(uci -q get ${CONFIG}.gemini.api_key)

	echo "Testing Google Gemini..."

	if [ -z "$api_key" ]; then
		echo "Status: NOT CONFIGURED (no API key)"
		return 1
	fi

	echo "Status: CONFIGURED"
	echo "API Key: ***"
	return 0
}
