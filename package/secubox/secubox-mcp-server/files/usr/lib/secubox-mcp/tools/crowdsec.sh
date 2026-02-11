# SecuBox MCP Tool: CrowdSec Threat Intelligence
# Provides alerts, decisions, and threat analysis

tool_crowdsec_alerts() {
	local args="$1"
	local limit=$(echo "$args" | jsonfilter -e '@.limit' 2>/dev/null)
	[ -z "$limit" ] && limit=50

	# Check if cscli is available
	if ! command -v cscli >/dev/null 2>&1; then
		echo '{"error":"CrowdSec CLI not installed","alerts":[]}'
		return 1
	fi

	# Get alerts in JSON format
	local alerts=$(cscli alerts list -o json --limit "$limit" 2>/dev/null)

	if [ -z "$alerts" ] || [ "$alerts" = "null" ]; then
		echo '{"alerts":[],"count":0}'
		return 0
	fi

	# Count alerts
	local count=$(echo "$alerts" | jsonfilter -e '@[*]' 2>/dev/null | wc -l)

	printf '{"alerts":%s,"count":%d}' "$alerts" "$count"
}

tool_crowdsec_decisions() {
	local args="$1"
	local limit=$(echo "$args" | jsonfilter -e '@.limit' 2>/dev/null)
	[ -z "$limit" ] && limit=50

	# Check if cscli is available
	if ! command -v cscli >/dev/null 2>&1; then
		echo '{"error":"CrowdSec CLI not installed","decisions":[]}'
		return 1
	fi

	# Get decisions in JSON format
	local decisions=$(cscli decisions list -o json 2>/dev/null | head -c 100000)

	if [ -z "$decisions" ] || [ "$decisions" = "null" ]; then
		echo '{"decisions":[],"count":0}'
		return 0
	fi

	# Count decisions
	local count=$(echo "$decisions" | jsonfilter -e '@[*]' 2>/dev/null | wc -l)

	printf '{"decisions":%s,"count":%d}' "$decisions" "$count"
}

# Additional tool: Get CrowdSec metrics/stats
tool_crowdsec_metrics() {
	if ! command -v cscli >/dev/null 2>&1; then
		echo '{"error":"CrowdSec CLI not installed"}'
		return 1
	fi

	# Get metrics
	local metrics=$(cscli metrics -o json 2>/dev/null)

	if [ -z "$metrics" ]; then
		echo '{"error":"Could not retrieve metrics"}'
		return 1
	fi

	echo "$metrics"
}

# Additional tool: Get installed scenarios (detection rules)
tool_crowdsec_scenarios() {
	if ! command -v cscli >/dev/null 2>&1; then
		echo '{"error":"CrowdSec CLI not installed"}'
		return 1
	fi

	# Get installed scenarios
	local scenarios=$(cscli scenarios list -o json 2>/dev/null)

	if [ -z "$scenarios" ]; then
		echo '{"scenarios":[]}'
		return 0
	fi

	printf '{"scenarios":%s}' "$scenarios"
}
