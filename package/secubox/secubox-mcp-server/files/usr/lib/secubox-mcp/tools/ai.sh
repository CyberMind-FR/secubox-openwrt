# SecuBox MCP Tool: AI-Powered Security Analysis
# Uses LocalAI for threat analysis, CVE lookups, and filter suggestions

LOCALAI_API="http://127.0.0.1:8081/v1"
LOCALAI_MODEL="tinyllama-1.1b-chat-v1.0.Q4_K_M"

# Check if LocalAI is available
localai_available() {
	wget -q -O /dev/null --timeout=2 "${LOCALAI_API}/models" 2>/dev/null
}

# Call LocalAI for completion
localai_complete() {
	local prompt="$1"
	local max_tokens="${2:-512}"

	local request=$(cat <<EOF
{"model":"$LOCALAI_MODEL","messages":[{"role":"system","content":"You are a cybersecurity analyst for SecuBox, an OpenWrt-based security appliance. Provide concise, actionable security analysis."},{"role":"user","content":"$prompt"}],"max_tokens":$max_tokens,"temperature":0.3}
EOF
)

	local response=$(echo "$request" | wget -q -O - --post-data=- \
		--header="Content-Type: application/json" \
		"${LOCALAI_API}/chat/completions" 2>/dev/null)

	if [ -n "$response" ]; then
		echo "$response" | jsonfilter -e '@.choices[0].message.content' 2>/dev/null
	fi
}

# =============================================================================
# AI TOOLS
# =============================================================================

# Analyze CrowdSec alerts and provide recommendations
tool_ai_analyze_threats() {
	local args="$1"

	if ! localai_available; then
		echo '{"error":"LocalAI not available","suggestion":"Run: localaictl start"}'
		return 1
	fi

	# Get recent alerts
	local alerts=""
	if command -v cscli >/dev/null 2>&1; then
		alerts=$(cscli alerts list -o json --limit 10 2>/dev/null | head -c 4000)
	fi

	if [ -z "$alerts" ] || [ "$alerts" = "[]" ]; then
		echo '{"analysis":"No recent alerts to analyze","recommendations":[]}'
		return 0
	fi

	# Build prompt for AI
	local prompt="Analyze these CrowdSec security alerts and provide:
1. Summary of attack patterns
2. Severity assessment (Critical/High/Medium/Low)
3. Top 3 recommended actions

Alerts JSON:
$alerts"

	local analysis=$(localai_complete "$prompt" 1024)

	if [ -n "$analysis" ]; then
		printf '{"analysis":"%s","alert_count":%d,"localai_model":"%s"}' \
			"$(json_escape "$analysis")" \
			"$(echo "$alerts" | jsonfilter -e '@[*]' 2>/dev/null | wc -l)" \
			"$LOCALAI_MODEL"
	else
		echo '{"error":"AI analysis failed"}'
		return 1
	fi
}

# CVE lookup and analysis
tool_ai_cve_lookup() {
	local args="$1"
	local cve_id=$(echo "$args" | jsonfilter -e '@.cve' 2>/dev/null)

	if [ -z "$cve_id" ]; then
		echo '{"error":"Missing required parameter: cve (e.g., CVE-2024-1234)"}'
		return 1
	fi

	if ! localai_available; then
		echo '{"error":"LocalAI not available for CVE analysis"}'
		return 1
	fi

	# Build prompt for CVE analysis
	local prompt="Provide a concise security analysis for $cve_id:
1. Brief description of the vulnerability
2. Affected systems/software
3. CVSS severity estimate
4. Mitigation recommendations for an OpenWrt router
5. Detection indicators

Format as structured analysis."

	local analysis=$(localai_complete "$prompt" 1024)

	if [ -n "$analysis" ]; then
		printf '{"cve":"%s","analysis":"%s","localai_model":"%s"}' \
			"$cve_id" \
			"$(json_escape "$analysis")" \
			"$LOCALAI_MODEL"
	else
		echo '{"error":"CVE analysis failed"}'
		return 1
	fi
}

# Suggest mitmproxy/WAF filters based on traffic patterns
tool_ai_suggest_waf_rules() {
	local args="$1"

	if ! localai_available; then
		echo '{"error":"LocalAI not available"}'
		return 1
	fi

	# Get recent threats
	local threats=""
	local threat_log="/srv/mitmproxy/threats.log"
	if [ -f "$threat_log" ]; then
		threats=$(tail -20 "$threat_log" 2>/dev/null | head -c 3000)
	fi

	# Get recent blocked IPs
	local blocked=""
	if command -v cscli >/dev/null 2>&1; then
		blocked=$(cscli decisions list -o json 2>/dev/null | head -c 2000)
	fi

	local prompt="Based on these threat patterns, suggest WAF/mitmproxy filter rules:

Recent threats:
$threats

Blocked decisions:
$blocked

Provide:
1. 3-5 specific mitmproxy filter patterns (Python regex)
2. CrowdSec scenario suggestions
3. IP reputation recommendations

Format as actionable configuration snippets."

	local suggestions=$(localai_complete "$prompt" 1024)

	if [ -n "$suggestions" ]; then
		printf '{"suggestions":"%s","localai_model":"%s"}' \
			"$(json_escape "$suggestions")" \
			"$LOCALAI_MODEL"
	else
		echo '{"error":"Filter suggestion failed"}'
		return 1
	fi
}

# Generate CrowdSec ban decision explanation
tool_ai_explain_ban() {
	local args="$1"
	local ip=$(echo "$args" | jsonfilter -e '@.ip' 2>/dev/null)

	if [ -z "$ip" ]; then
		echo '{"error":"Missing required parameter: ip"}'
		return 1
	fi

	# Get decisions for this IP
	local decisions=""
	if command -v cscli >/dev/null 2>&1; then
		decisions=$(cscli decisions list -o json --ip "$ip" 2>/dev/null)
	fi

	if [ -z "$decisions" ] || [ "$decisions" = "[]" ]; then
		printf '{"ip":"%s","status":"not_banned","explanation":"No active ban for this IP"}' "$ip"
		return 0
	fi

	if ! localai_available; then
		# Return raw data without AI explanation
		printf '{"ip":"%s","decisions":%s,"explanation":"LocalAI unavailable for detailed explanation"}' "$ip" "$decisions"
		return 0
	fi

	local prompt="Explain this CrowdSec ban decision in plain language:
IP: $ip
Decision data: $decisions

Provide:
1. Why was this IP banned?
2. What threat does it represent?
3. Recommended action (keep ban, reduce duration, whitelist?)"

	local explanation=$(localai_complete "$prompt" 512)

	printf '{"ip":"%s","decisions":%s,"explanation":"%s"}' \
		"$ip" \
		"$decisions" \
		"$(json_escape "$explanation")"
}

# Security posture assessment
tool_ai_security_posture() {
	if ! localai_available; then
		echo '{"error":"LocalAI not available for security assessment"}'
		return 1
	fi

	# Gather system security data
	local firewall_rules=$(iptables -L -n 2>/dev/null | wc -l)
	local wg_peers=$(wg show all peers 2>/dev/null | wc -l)
	local crowdsec_scenarios=$(cscli scenarios list -o json 2>/dev/null | jsonfilter -e '@[*]' 2>/dev/null | wc -l)
	local active_bans=$(cscli decisions list -o json 2>/dev/null | jsonfilter -e '@[*]' 2>/dev/null | wc -l)
	local open_ports=$(netstat -tln 2>/dev/null | grep LISTEN | wc -l)

	local security_data="Firewall rules: $firewall_rules
WireGuard peers: $wg_peers
CrowdSec scenarios: $crowdsec_scenarios
Active bans: $active_bans
Listening ports: $open_ports"

	local prompt="Assess the security posture of this SecuBox appliance:

$security_data

Provide:
1. Overall security score (1-10)
2. Top 3 security strengths
3. Top 3 areas for improvement
4. Quick wins for hardening"

	local assessment=$(localai_complete "$prompt" 1024)

	printf '{"assessment":"%s","metrics":{"firewall_rules":%d,"wg_peers":%d,"crowdsec_scenarios":%d,"active_bans":%d,"open_ports":%d},"localai_model":"%s"}' \
		"$(json_escape "$assessment")" \
		"$firewall_rules" "$wg_peers" "$crowdsec_scenarios" "$active_bans" "$open_ports" \
		"$LOCALAI_MODEL"
}
