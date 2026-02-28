#!/bin/sh
# SecuBox AI Gateway - HTTP Proxy Handler
# OpenAI-compatible API on port 4000

. /usr/lib/ai-gateway/classifier.sh
. /usr/lib/ai-gateway/sanitizer.sh
. /usr/lib/ai-gateway/providers.sh
. /usr/lib/ai-gateway/audit.sh

CONFIG="ai-gateway"

# Generate unique request ID
generate_request_id() {
	echo "$(date +%s%N | md5sum | head -c 16)"
}

# Handle incoming chat completion request
# Input: JSON request body
# Output: JSON response
handle_chat_completion() {
	local request_json="$1"
	local request_id=$(generate_request_id)
	local start_time=$(date +%s%3N)

	# 1. Initialize patterns for classification
	init_patterns

	# 2. Classify the request
	classify_request "$request_json"
	local class_num=$?
	local classification=$(classification_to_string $class_num)

	# 3. Check offline mode
	local offline_mode=$(uci -q get ${CONFIG}.main.offline_mode)
	if [ "$offline_mode" = "1" ]; then
		classification="local_only"
	fi

	# 4. Select provider
	local provider=$(select_provider "$classification")
	if [ -z "$provider" ]; then
		printf '{"error":{"message":"No provider available for classification: %s","type":"provider_error","code":"no_provider"}}' "$classification"
		return 1
	fi

	local model=$(uci -q get ${CONFIG}.${provider}.model)

	# 5. Sanitize if needed
	local sanitized="0"
	if [ "$classification" = "sanitized" ]; then
		request_json=$(sanitize_request "$request_json")
		sanitized="1"
	fi

	# 6. Log request
	init_audit
	audit_log_request "$request_id" "$classification" "$provider" "$model" "$sanitized"

	# 7. Route to provider
	local response=$(route_request "$request_json" "$classification")
	local status="success"
	echo "$response" | grep -q '"error"' && status="error"

	# 8. Log response
	local end_time=$(date +%s%3N)
	local latency=$((end_time - start_time))
	audit_log_response "$request_id" "$status" "$latency"

	echo "$response"
}

# Handle models list request
handle_models() {
	local models='{"object":"list","data":['
	local first=1

	for provider in localai mistral claude openai gemini xai; do
		local enabled=$(uci -q get ${CONFIG}.${provider}.enabled)
		[ "$enabled" != "1" ] && continue

		local model=$(uci -q get ${CONFIG}.${provider}.model)
		[ -z "$model" ] && continue

		[ $first -eq 0 ] && models="${models},"
		first=0

		models="${models}{\"id\":\"${model}\",\"object\":\"model\",\"owned_by\":\"${provider}\"}"
	done

	models="${models}]}"
	echo "$models"
}

# Handle health check
handle_health() {
	local localai_status="down"
	local endpoint=$(uci -q get ${CONFIG}.localai.endpoint || echo "http://127.0.0.1:8081")
	wget -q -O /dev/null --timeout=2 "${endpoint}/readyz" 2>/dev/null && localai_status="up"

	printf '{"status":"ok","localai":"%s","version":"1.0.0"}' "$localai_status"
}

# Simple HTTP request parser
# Reads from stdin, outputs: METHOD PATH BODY
parse_http_request() {
	local line method path version
	local content_length=0
	local body=""

	# Read request line
	read -r line
	method=$(echo "$line" | cut -d' ' -f1)
	path=$(echo "$line" | cut -d' ' -f2)

	# Read headers
	while read -r line; do
		line=$(echo "$line" | tr -d '\r')
		[ -z "$line" ] && break

		case "$line" in
			Content-Length:*)
				content_length=$(echo "$line" | cut -d':' -f2 | tr -d ' ')
				;;
		esac
	done

	# Read body
	if [ "$content_length" -gt 0 ]; then
		body=$(head -c "$content_length")
	fi

	echo "$method"
	echo "$path"
	echo "$body"
}

# HTTP response helper
send_response() {
	local status="$1"
	local body="$2"
	local content_type="${3:-application/json}"

	printf "HTTP/1.1 %s\r\n" "$status"
	printf "Content-Type: %s\r\n" "$content_type"
	printf "Content-Length: %d\r\n" "${#body}"
	printf "Access-Control-Allow-Origin: *\r\n"
	printf "\r\n"
	printf "%s" "$body"
}

# Main HTTP handler
http_handler() {
	local request=$(parse_http_request)
	local method=$(echo "$request" | head -1)
	local path=$(echo "$request" | head -2 | tail -1)
	local body=$(echo "$request" | tail -n +3)

	case "$method $path" in
		"POST /v1/chat/completions")
			local response=$(handle_chat_completion "$body")
			send_response "200 OK" "$response"
			;;
		"POST /v1/completions")
			# Legacy completions API - convert to chat format
			local response=$(handle_chat_completion "$body")
			send_response "200 OK" "$response"
			;;
		"GET /v1/models")
			local response=$(handle_models)
			send_response "200 OK" "$response"
			;;
		"GET /health"|"GET /readyz")
			local response=$(handle_health)
			send_response "200 OK" "$response"
			;;
		"OPTIONS "*)
			send_response "200 OK" ""
			;;
		*)
			send_response "404 Not Found" '{"error":"Not found"}'
			;;
	esac
}

# Start proxy server (called by init.d)
start_proxy() {
	local port=$(uci -q get ${CONFIG}.main.proxy_port || echo 4000)
	local host=$(uci -q get ${CONFIG}.main.proxy_host || echo 127.0.0.1)

	logger -t ai-gateway "Starting proxy on ${host}:${port}"

	# Use socat for simple TCP server
	# Each connection spawns this script with http_handler
	if command -v socat >/dev/null 2>&1; then
		exec socat TCP-LISTEN:${port},bind=${host},reuseaddr,fork EXEC:"/usr/lib/ai-gateway/proxy.sh handle"
	else
		# Fallback: simple nc loop (less robust)
		while true; do
			nc -l -p "$port" -e /usr/lib/ai-gateway/proxy.sh handle
		done
	fi
}

# Entry point
case "$1" in
	handle)
		http_handler
		;;
	start)
		start_proxy
		;;
	*)
		echo "Usage: proxy.sh <start|handle>"
		;;
esac
