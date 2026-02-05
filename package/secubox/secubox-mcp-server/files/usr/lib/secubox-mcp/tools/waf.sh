# SecuBox MCP Tool: WAF/mitmproxy Threat Events
# Provides WAF logs and threat analysis

MITMPROXY_LOG="/srv/mitmproxy/threats.log"
MITMPROXY_EVENTS="/srv/mitmproxy/events.json"

tool_waf_logs() {
	local args="$1"
	local limit=$(echo "$args" | jsonfilter -e '@.limit' 2>/dev/null)
	[ -z "$limit" ] && limit=100

	# Check for threat log
	if [ ! -f "$MITMPROXY_LOG" ]; then
		echo '{"threats":[],"count":0,"message":"No threat log found"}'
		return 0
	fi

	# Read last N lines and format as JSON array
	local threats='['
	local first=1
	local count=0

	tail -n "$limit" "$MITMPROXY_LOG" | while IFS= read -r line; do
		# Skip empty lines
		[ -z "$line" ] && continue

		# Try to parse as JSON, if not wrap as text
		if echo "$line" | jsonfilter -e '@' >/dev/null 2>&1; then
			[ $first -eq 0 ] && printf ','
			first=0
			printf '%s' "$line"
		else
			[ $first -eq 0 ] && printf ','
			first=0
			printf '{"raw":"%s"}' "$(json_escape "$line")"
		fi
		count=$((count + 1))
	done

	threats="${threats}]"

	printf '{"threats":%s,"count":%d}' "$threats" "$count"
}

# Get WAF filter rules/patterns
tool_waf_rules() {
	local rules_file="/etc/mitmproxy/waf_rules.json"

	if [ ! -f "$rules_file" ]; then
		echo '{"rules":[],"message":"No WAF rules configured"}'
		return 0
	fi

	local rules=$(cat "$rules_file" 2>/dev/null)
	printf '{"rules":%s}' "${rules:-[]}"
}

# Get real-time WAF statistics
tool_waf_stats() {
	local stats_file="/tmp/mitmproxy_stats.json"

	# Check if mitmproxy is running
	local running="false"
	pgrep -f mitmproxy >/dev/null 2>&1 && running="true"

	# Get stats if available
	local stats='{}'
	if [ -f "$stats_file" ]; then
		stats=$(cat "$stats_file" 2>/dev/null)
	fi

	# Count threats in log
	local threat_count=0
	if [ -f "$MITMPROXY_LOG" ]; then
		threat_count=$(wc -l < "$MITMPROXY_LOG")
	fi

	printf '{"running":%s,"threat_count":%d,"stats":%s}' "$running" "$threat_count" "$stats"
}
