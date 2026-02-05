# SecuBox Threat Analyst - Analyzer Module
# Collects and analyzes threats using LocalAI

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Slurp JSON lines into array (jq -s '.' replacement)
json_slurp() {
	printf '['
	local first=1
	while IFS= read -r line; do
		[ -z "$line" ] && continue
		# Validate JSON
		echo "$line" | jsonfilter -e '@' >/dev/null 2>&1 || continue
		[ $first -eq 0 ] && printf ','
		first=0
		printf '%s' "$line"
	done
	printf ']'
}

# =============================================================================
# THREAT COLLECTION
# =============================================================================

collect_threats() {
	local all_threats='[]'

	# CrowdSec alerts
	if [ "$(uci_get source_crowdsec.enabled)" = "1" ]; then
		local cs_threats=$(collect_crowdsec_threats)
		all_threats=$(merge_json_arrays "$all_threats" "$cs_threats")
	fi

	# mitmproxy threats
	if [ "$(uci_get source_mitmproxy.enabled)" = "1" ]; then
		local mitm_threats=$(collect_mitmproxy_threats)
		all_threats=$(merge_json_arrays "$all_threats" "$mitm_threats")
	fi

	# netifyd DPI
	if [ "$(uci_get source_netifyd.enabled)" = "1" ]; then
		local dpi_threats=$(collect_netifyd_threats)
		all_threats=$(merge_json_arrays "$all_threats" "$dpi_threats")
	fi

	echo "$all_threats"
}

collect_crowdsec_threats() {
	if ! command -v cscli >/dev/null 2>&1; then
		echo '[]'
		return
	fi

	# Get recent alerts (last hour)
	local alerts=$(cscli alerts list -o json --since 1h 2>/dev/null | head -c 50000)
	[ -z "$alerts" ] && { echo '[]'; return; }

	# Transform to common format - output JSON lines then slurp
	echo "$alerts" | jsonfilter -e '@[*]' 2>/dev/null | while read -r alert; do
		local scenario=$(echo "$alert" | jsonfilter -e '@.scenario' 2>/dev/null)
		local source_ip=$(echo "$alert" | jsonfilter -e '@.source.ip' 2>/dev/null)
		local created=$(echo "$alert" | jsonfilter -e '@.created_at' 2>/dev/null)

		printf '{"source":"crowdsec","type":"alert","scenario":"%s","ip":"%s","timestamp":"%s"}\n' \
			"$scenario" "$source_ip" "$created"
	done | json_slurp
}

collect_mitmproxy_threats() {
	local log_path=$(uci_get source_mitmproxy.path)
	[ -z "$log_path" ] && log_path="/srv/mitmproxy/threats.log"

	if [ ! -f "$log_path" ]; then
		echo '[]'
		return
	fi

	# Get last 100 threats
	tail -100 "$log_path" 2>/dev/null | while IFS= read -r line; do
		# Try to parse as JSON
		if echo "$line" | jsonfilter -e '@' >/dev/null 2>&1; then
			local threat_type=$(echo "$line" | jsonfilter -e '@.threat_type' 2>/dev/null)
			local source_ip=$(echo "$line" | jsonfilter -e '@.client_ip' 2>/dev/null)
			local url=$(echo "$line" | jsonfilter -e '@.url' 2>/dev/null)
			local pattern=$(echo "$line" | jsonfilter -e '@.pattern' 2>/dev/null)

			# Escape special chars for JSON
			url=$(echo "$url" | sed 's/\\/\\\\/g; s/"/\\"/g')

			printf '{"source":"mitmproxy","type":"%s","ip":"%s","url":"%s","pattern":"%s"}\n' \
				"$threat_type" "$source_ip" "$url" "$pattern"
		fi
	done | json_slurp
}

collect_netifyd_threats() {
	local status_file=$(uci_get source_netifyd.path)
	[ -z "$status_file" ] && status_file="/var/run/netifyd/status.json"

	if [ ! -f "$status_file" ]; then
		echo '[]'
		return
	fi

	# Extract flows with security risks
	jsonfilter -i "$status_file" -e '@.flows[*]' 2>/dev/null | while read -r flow; do
		local risks=$(echo "$flow" | jsonfilter -e '@.risks[*]' 2>/dev/null)
		[ -z "$risks" ] && continue

		local local_ip=$(echo "$flow" | jsonfilter -e '@.local_ip' 2>/dev/null)
		local other_ip=$(echo "$flow" | jsonfilter -e '@.other_ip' 2>/dev/null)
		local proto=$(echo "$flow" | jsonfilter -e '@.detected_protocol_name' 2>/dev/null)

		for risk in $risks; do
			printf '{"source":"netifyd","type":"dpi_risk","risk":"%s","local_ip":"%s","other_ip":"%s","protocol":"%s"}\n' \
				"$risk" "$local_ip" "$other_ip" "$proto"
		done
	done | json_slurp
}

merge_json_arrays() {
	local arr1="$1"
	local arr2="$2"

	# Handle empty arrays
	[ "$arr1" = "[]" ] && { echo "$arr2"; return; }
	[ "$arr2" = "[]" ] && { echo "$arr1"; return; }

	# Merge by stripping brackets and concatenating
	local inner1=$(echo "$arr1" | sed 's/^\[//; s/\]$//')
	local inner2=$(echo "$arr2" | sed 's/^\[//; s/\]$//')

	printf '[%s,%s]' "$inner1" "$inner2"
}

# =============================================================================
# AI ANALYSIS
# =============================================================================

analyze_threats() {
	local threats="$1"

	# Check LocalAI availability
	if ! wget -q -O /dev/null --timeout=3 "${localai_url}/v1/models" 2>/dev/null; then
		log_warn "LocalAI not available at $localai_url"
		return 1
	fi

	# Build analysis prompt
	local threat_summary=$(echo "$threats" | head -c 8000)

	local prompt="You are a cybersecurity analyst for SecuBox, an OpenWrt security appliance.

Analyze these threat events and provide:
1. Attack pattern summary (what types of attacks are occurring)
2. Top 3 most critical threats requiring immediate action
3. Common indicators (IPs, URLs, patterns) that should be blocked
4. Recommended filter rules for:
   - mitmproxy (Python regex patterns for HTTP inspection)
   - CrowdSec (scenario triggers and conditions)
   - WAF (URL/header patterns to block)

Threat data:
$threat_summary

Provide actionable, specific recommendations. Format filter patterns as code snippets."

	# Escape prompt for JSON
	local escaped_prompt=$(echo "$prompt" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')

	# Call LocalAI
	local request="{\"model\":\"$localai_model\",\"messages\":[{\"role\":\"system\",\"content\":\"You are a security analyst generating threat detection rules.\"},{\"role\":\"user\",\"content\":\"$escaped_prompt\"}],\"max_tokens\":2048,\"temperature\":0.3}"

	local response=$(echo "$request" | wget -q -O - --post-data=- \
		--header="Content-Type: application/json" \
		"${localai_url}/v1/chat/completions" 2>/dev/null)

	if [ -n "$response" ]; then
		echo "$response" | jsonfilter -e '@.choices[0].message.content' 2>/dev/null
	fi
}
