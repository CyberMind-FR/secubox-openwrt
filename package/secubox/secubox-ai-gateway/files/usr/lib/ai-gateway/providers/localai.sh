#!/bin/sh
# SecuBox AI Gateway - LocalAI Provider Adapter
# On-device inference via LocalAI (OpenAI-compatible API)

CONFIG="ai-gateway"

provider_request() {
	local request_json="$1"

	local endpoint=$(uci -q get ${CONFIG}.localai.endpoint || echo "http://127.0.0.1:8081")
	local model=$(uci -q get ${CONFIG}.localai.model || echo "tinyllama-1.1b-chat-v1.0.Q4_K_M")

	# Override model in request if specified
	request_json=$(echo "$request_json" | sed "s/\"model\":[^,}]*/\"model\":\"$model\"/")

	# Send to LocalAI
	local response=$(echo "$request_json" | wget -q -O - \
		--post-data=- \
		--header="Content-Type: application/json" \
		"${endpoint}/v1/chat/completions" 2>/dev/null)

	if [ -z "$response" ]; then
		printf '{"error":{"message":"LocalAI not available","type":"provider_error","code":"localai_unavailable"}}'
		return 1
	fi

	echo "$response"
}

provider_test() {
	local endpoint=$(uci -q get ${CONFIG}.localai.endpoint || echo "http://127.0.0.1:8081")

	echo "Testing LocalAI at $endpoint..."

	if wget -q -O /dev/null --timeout=5 "${endpoint}/readyz" 2>/dev/null; then
		echo "Status: AVAILABLE"

		# Get models
		local models=$(wget -q -O - "${endpoint}/v1/models" 2>/dev/null)
		echo "Models: $(echo "$models" | jsonfilter -e '@.data[*].id' 2>/dev/null | tr '\n' ', ')"
		return 0
	else
		echo "Status: UNAVAILABLE"
		return 1
	fi
}
