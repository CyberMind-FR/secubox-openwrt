# SecuBox MCP Protocol Handler
# JSON-RPC 2.0 implementation for Model Context Protocol
# Sourced by /usr/bin/secubox-mcp

# =============================================================================
# JSON HELPERS
# =============================================================================

# Parse a JSON field using jsonfilter
json_get() {
	local json="$1"
	local path="$2"
	echo "$json" | jsonfilter -e "$path" 2>/dev/null
}

# Escape a string for JSON output
json_escape() {
	printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | tr '\n' ' '
}

# =============================================================================
# RESPONSE BUILDERS
# =============================================================================

send_response() {
	local id="$1"
	local result="$2"
	printf '{"jsonrpc":"2.0","id":%s,"result":%s}\n' "$id" "$result"
}

send_error() {
	local id="$1"
	local code="$2"
	local message="$3"
	if [ "$id" = "null" ] || [ -z "$id" ]; then
		printf '{"jsonrpc":"2.0","id":null,"error":{"code":%d,"message":"%s"}}\n' "$code" "$message"
	else
		printf '{"jsonrpc":"2.0","id":%s,"error":{"code":%d,"message":"%s"}}\n' "$id" "$code" "$message"
	fi
}

# =============================================================================
# MCP PROTOCOL HANDLERS
# =============================================================================

# Handle initialize request
send_initialize_response() {
	local id="$1"
	cat <<EOF
{"jsonrpc":"2.0","id":$id,"result":{"protocolVersion":"$MCP_VERSION","capabilities":{"tools":{}},"serverInfo":{"name":"$SERVER_NAME","version":"$SERVER_VERSION"}}}
EOF
}

# Handle initialized notification (no response needed)
handle_initialized() {
	logger -t secubox-mcp "Client initialized"
}

# Handle tools/list request
send_tools_list() {
	local id="$1"

	# Build tools array based on allowed tools in config
	local tools_json='['
	local first=1

	# Get allowed tools from UCI
	local allowed_tools=$(uci -q get ${CONFIG}.main.allowed_tool 2>/dev/null || echo "")

	# Tool definitions
	for tool in $allowed_tools; do
		[ $first -eq 0 ] && tools_json="${tools_json},"
		first=0

		case "$tool" in
			crowdsec.alerts)
				tools_json="${tools_json}"'{"name":"crowdsec.alerts","description":"Get active CrowdSec security alerts","inputSchema":{"type":"object","properties":{"limit":{"type":"number","description":"Maximum alerts to return (default: 50)"}},"required":[]}}'
				;;
			crowdsec.decisions)
				tools_json="${tools_json}"'{"name":"crowdsec.decisions","description":"Get active CrowdSec blocking decisions","inputSchema":{"type":"object","properties":{"limit":{"type":"number","description":"Maximum decisions to return (default: 50)"}},"required":[]}}'
				;;
			waf.logs)
				tools_json="${tools_json}"'{"name":"waf.logs","description":"Get WAF threat events from mitmproxy","inputSchema":{"type":"object","properties":{"limit":{"type":"number","description":"Maximum events to return (default: 100)"}},"required":[]}}'
				;;
			dns.queries)
				tools_json="${tools_json}"'{"name":"dns.queries","description":"Get DNS query statistics from AdGuard Home","inputSchema":{"type":"object","properties":{},"required":[]}}'
				;;
			network.flows)
				tools_json="${tools_json}"'{"name":"network.flows","description":"Get network traffic summary","inputSchema":{"type":"object","properties":{"interface":{"type":"string","description":"Network interface (optional)"}},"required":[]}}'
				;;
			system.metrics)
				tools_json="${tools_json}"'{"name":"system.metrics","description":"Get system metrics (CPU, memory, disk, temperature)","inputSchema":{"type":"object","properties":{},"required":[]}}'
				;;
			wireguard.status)
				tools_json="${tools_json}"'{"name":"wireguard.status","description":"Get WireGuard VPN tunnel status","inputSchema":{"type":"object","properties":{"interface":{"type":"string","description":"WireGuard interface (optional, shows all if omitted)"}},"required":[]}}'
				;;
			uci.get)
				tools_json="${tools_json}"'{"name":"uci.get","description":"Read OpenWrt UCI configuration value","inputSchema":{"type":"object","properties":{"key":{"type":"string","description":"UCI key (e.g., network.lan.ipaddr)"}},"required":["key"]}}'
				;;
			uci.set)
				tools_json="${tools_json}"'{"name":"uci.set","description":"Write OpenWrt UCI configuration value","inputSchema":{"type":"object","properties":{"key":{"type":"string","description":"UCI key"},"value":{"type":"string","description":"Value to set"}},"required":["key","value"]}}'
				;;
			ai.analyze_threats)
				tools_json="${tools_json}"'{"name":"ai.analyze_threats","description":"AI-powered analysis of CrowdSec alerts with recommendations (requires LocalAI)","inputSchema":{"type":"object","properties":{},"required":[]}}'
				;;
			ai.cve_lookup)
				tools_json="${tools_json}"'{"name":"ai.cve_lookup","description":"AI-powered CVE vulnerability analysis and mitigation advice","inputSchema":{"type":"object","properties":{"cve":{"type":"string","description":"CVE ID (e.g., CVE-2024-1234)"}},"required":["cve"]}}'
				;;
			ai.suggest_waf_rules)
				tools_json="${tools_json}"'{"name":"ai.suggest_waf_rules","description":"AI-powered WAF/mitmproxy filter rule suggestions based on threat patterns","inputSchema":{"type":"object","properties":{},"required":[]}}'
				;;
			ai.explain_ban)
				tools_json="${tools_json}"'{"name":"ai.explain_ban","description":"AI explanation of why an IP was banned by CrowdSec","inputSchema":{"type":"object","properties":{"ip":{"type":"string","description":"IP address to explain"}},"required":["ip"]}}'
				;;
			ai.security_posture)
				tools_json="${tools_json}"'{"name":"ai.security_posture","description":"AI-powered security posture assessment of the SecuBox appliance","inputSchema":{"type":"object","properties":{},"required":[]}}'
				;;
		esac
	done

	tools_json="${tools_json}]"

	printf '{"jsonrpc":"2.0","id":%s,"result":{"tools":%s}}\n' "$id" "$tools_json"
}

# Check if a tool is allowed
is_tool_allowed() {
	local tool="$1"
	local allowed_tools=$(uci -q get ${CONFIG}.main.allowed_tool 2>/dev/null || echo "")

	for allowed in $allowed_tools; do
		[ "$allowed" = "$tool" ] && return 0
	done
	return 1
}

# Execute a tool
execute_tool() {
	local id="$1"
	local tool_name="$2"
	local arguments="$3"

	# Check if tool is allowed
	if ! is_tool_allowed "$tool_name"; then
		send_error "$id" -32601 "Tool not allowed: $tool_name"
		return
	fi

	# Source tool module and execute
	local module_name="${tool_name%%.*}"
	local func_name="tool_$(echo "$tool_name" | tr '.' '_')"
	local tool_file="${TOOLS_DIR}/${module_name}.sh"

	if [ ! -f "$tool_file" ]; then
		send_error "$id" -32601 "Tool module not found: $module_name"
		return
	fi

	# Source the tool module
	. "$tool_file"

	# Check if function exists
	if ! type "$func_name" >/dev/null 2>&1; then
		send_error "$id" -32601 "Tool function not found: $func_name"
		return
	fi

	# Execute tool and capture result
	local result
	result=$("$func_name" "$arguments" 2>/dev/null)

	if [ $? -eq 0 ] && [ -n "$result" ]; then
		# Wrap result in content array for MCP
		printf '{"jsonrpc":"2.0","id":%s,"result":{"content":[{"type":"text","text":%s}]}}\n' "$id" "$result"
	else
		send_error "$id" -32000 "Tool execution failed"
	fi
}

# =============================================================================
# MAIN REQUEST HANDLER
# =============================================================================

handle_request() {
	local request="$1"

	# Parse JSON-RPC fields
	local method=$(json_get "$request" '@.method')
	local id=$(json_get "$request" '@.id')
	local params=$(json_get "$request" '@.params')

	# Handle missing id (notification)
	[ -z "$id" ] && id="null"

	# Route by method
	case "$method" in
		initialize)
			send_initialize_response "$id"
			;;
		initialized)
			handle_initialized
			# No response for notifications
			;;
		tools/list)
			send_tools_list "$id"
			;;
		tools/call)
			local tool_name=$(json_get "$request" '@.params.name')
			local arguments=$(json_get "$request" '@.params.arguments')
			execute_tool "$id" "$tool_name" "$arguments"
			;;
		ping)
			send_response "$id" '{}'
			;;
		*)
			send_error "$id" -32601 "Method not found: $method"
			;;
	esac
}
