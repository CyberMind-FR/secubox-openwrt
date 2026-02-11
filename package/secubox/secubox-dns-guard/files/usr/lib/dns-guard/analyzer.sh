# SecuBox DNS Guard - AI Analysis Module
# Copyright (C) 2026 CyberMind.fr
#
# LocalAI integration for intelligent DNS threat analysis

# =============================================================================
# AI ANALYSIS
# =============================================================================

analyze_anomalies() {
	local anomalies="$1"

	# Check LocalAI availability
	if ! wget -q -O /dev/null --timeout=3 "${localai_url}/v1/models" 2>/dev/null; then
		log_warn "LocalAI not available at $localai_url"
		return 1
	fi

	# Build analysis prompt
	local anomaly_summary=$(echo "$anomalies" | head -c 6000)

	local prompt="You are a DNS security analyst for SecuBox, an OpenWrt security appliance.

Analyze these DNS anomalies and provide:

1. THREAT ASSESSMENT
   - Severity level (Critical/High/Medium/Low)
   - Attack type identification (DGA malware, DNS tunneling, data exfiltration, C2 communication)
   - Confidence in assessment (percentage)

2. DOMAIN CLASSIFICATION
   For each suspicious domain, classify as:
   - BLOCK: Definitively malicious, should be blocked immediately
   - MONITOR: Suspicious but needs more data, continue monitoring
   - SAFE: False positive, likely legitimate

3. RECOMMENDED ACTIONS
   - Specific domains to block (with reasoning)
   - Additional investigation steps
   - Network isolation recommendations if critical

4. PATTERN ANALYSIS
   - Common characteristics among malicious domains
   - Potential malware family identification
   - Related threat intelligence

DNS Anomalies:
$anomaly_summary

Respond in a structured format. For domains to block, provide a JSON array like:
BLOCK_LIST: [{\"domain\": \"example.xyz\", \"reason\": \"DGA pattern\", \"confidence\": 90}]"

	# Escape prompt for JSON
	local escaped_prompt=$(printf '%s' "$prompt" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')

	# Call LocalAI
	local request="{\"model\":\"$localai_model\",\"messages\":[{\"role\":\"system\",\"content\":\"You are a DNS security analyst. Provide clear, actionable threat assessments.\"},{\"role\":\"user\",\"content\":\"$escaped_prompt\"}],\"max_tokens\":2048,\"temperature\":0.2}"

	local response=$(printf '%s' "$request" | wget -q -O - --post-data=- \
		--header="Content-Type: application/json" \
		"${localai_url}/v1/chat/completions" 2>/dev/null)

	if [ -n "$response" ]; then
		echo "$response" | jsonfilter -e '@.choices[0].message.content' 2>/dev/null
	fi
}

analyze_single_domain() {
	local domain="$1"

	# Check LocalAI availability
	if ! wget -q -O /dev/null --timeout=3 "${localai_url}/v1/models" 2>/dev/null; then
		return 1
	fi

	local prompt="Analyze this domain for potential security threats:

Domain: $domain

Provide:
1. Risk assessment (Low/Medium/High/Critical)
2. Potential threat type (malware C2, phishing, DGA, tunneling, legitimate)
3. Key indicators that led to your assessment
4. Recommendation (BLOCK/MONITOR/SAFE)

Be concise but thorough."

	local escaped_prompt=$(printf '%s' "$prompt" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')

	local request="{\"model\":\"$localai_model\",\"messages\":[{\"role\":\"user\",\"content\":\"$escaped_prompt\"}],\"max_tokens\":512,\"temperature\":0.2}"

	local response=$(printf '%s' "$request" | wget -q -O - --post-data=- \
		--header="Content-Type: application/json" \
		"${localai_url}/v1/chat/completions" 2>/dev/null)

	if [ -n "$response" ]; then
		echo "$response" | jsonfilter -e '@.choices[0].message.content' 2>/dev/null
	fi
}

# =============================================================================
# RECOMMENDATION EXTRACTION
# =============================================================================

extract_ai_recommendations() {
	local analysis="$1"

	# Try to extract BLOCK_LIST JSON from AI response
	local block_json=$(echo "$analysis" | grep -o 'BLOCK_LIST: \[.*\]' | sed 's/BLOCK_LIST: //')

	if [ -n "$block_json" ]; then
		# Validate and return
		if echo "$block_json" | jsonfilter -e '@[0]' >/dev/null 2>&1; then
			echo "$block_json"
			return
		fi
	fi

	# Fallback: extract domains mentioned with "block" context
	local domains=$(echo "$analysis" | grep -oE '[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}' | sort -u)

	# Build block list from domains mentioned in blocking context
	local blocks='[]'
	for domain in $domains; do
		# Check if domain appears near "block" keyword
		if echo "$analysis" | grep -qi "block.*$domain\|$domain.*block"; then
			local block_entry=$(printf '{"domain":"%s","reason":"AI recommended block","confidence":75}' "$domain")
			blocks=$(merge_json_arrays "$blocks" "[$block_entry]")
		fi
	done

	echo "$blocks"
}

extract_high_confidence_blocks() {
	local anomalies="$1"

	# Extract anomalies with confidence >= min_confidence
	local blocks='[]'

	echo "$anomalies" | jsonfilter -e '@[*]' 2>/dev/null | while read -r anomaly; do
		local confidence=$(echo "$anomaly" | jsonfilter -e '@.confidence' 2>/dev/null)
		[ -z "$confidence" ] && continue

		if [ "$confidence" -ge "$min_confidence" ]; then
			local domain=$(echo "$anomaly" | jsonfilter -e '@.domain' 2>/dev/null)
			local type=$(echo "$anomaly" | jsonfilter -e '@.type' 2>/dev/null)
			local reason=$(echo "$anomaly" | jsonfilter -e '@.reason' 2>/dev/null)

			# Skip wildcard entries
			[ "$domain" = "*" ] && continue

			printf '{"domain":"%s","type":"%s","confidence":%d,"reason":"%s"}\n' \
				"$domain" "$type" "$confidence" "$reason"
		fi
	done | json_slurp
}

# =============================================================================
# ALERT MANAGEMENT
# =============================================================================

store_alerts() {
	local anomalies="$1"
	local alerts_file="$STATE_DIR/alerts.json"
	local timestamp=$(date -Iseconds)

	# Add timestamp to each anomaly
	local timestamped='[]'

	echo "$anomalies" | jsonfilter -e '@[*]' 2>/dev/null | while read -r anomaly; do
		local domain=$(echo "$anomaly" | jsonfilter -e '@.domain' 2>/dev/null)
		local client=$(echo "$anomaly" | jsonfilter -e '@.client' 2>/dev/null)
		local type=$(echo "$anomaly" | jsonfilter -e '@.type' 2>/dev/null)
		local confidence=$(echo "$anomaly" | jsonfilter -e '@.confidence' 2>/dev/null)
		local reason=$(echo "$anomaly" | jsonfilter -e '@.reason' 2>/dev/null)

		printf '{"timestamp":"%s","domain":"%s","client":"%s","type":"%s","confidence":%s,"reason":"%s"}\n' \
			"$timestamp" "$domain" "$client" "$type" "${confidence:-0}" "$reason"
	done > "$STATE_DIR/new_alerts.tmp"

	# Merge with existing alerts
	if [ -f "$alerts_file" ]; then
		{
			cat "$alerts_file"
			cat "$STATE_DIR/new_alerts.tmp"
		} | json_slurp > "$STATE_DIR/alerts_merged.tmp"
		mv "$STATE_DIR/alerts_merged.tmp" "$alerts_file"
	else
		cat "$STATE_DIR/new_alerts.tmp" | json_slurp > "$alerts_file"
	fi

	rm -f "$STATE_DIR/new_alerts.tmp"
}

cleanup_old_alerts() {
	local alerts_file="$STATE_DIR/alerts.json"
	[ ! -f "$alerts_file" ] && return

	local retention_hours="$alert_retention"
	[ -z "$retention_hours" ] && retention_hours=24

	local cutoff=$(date -d "-${retention_hours} hours" +%s 2>/dev/null)
	[ -z "$cutoff" ] && return

	# Filter alerts newer than cutoff
	local filtered='[]'

	jsonfilter -i "$alerts_file" -e '@[*]' 2>/dev/null | while read -r alert; do
		local ts=$(echo "$alert" | jsonfilter -e '@.timestamp' 2>/dev/null)
		local alert_epoch=$(date -d "$ts" +%s 2>/dev/null)
		[ -z "$alert_epoch" ] && continue

		if [ "$alert_epoch" -gt "$cutoff" ]; then
			echo "$alert"
		fi
	done | json_slurp > "$STATE_DIR/alerts_filtered.tmp"

	mv "$STATE_DIR/alerts_filtered.tmp" "$alerts_file"
}

get_recent_alerts() {
	local limit="${1:-50}"
	local alerts_file="$STATE_DIR/alerts.json"

	if [ ! -f "$alerts_file" ]; then
		echo '[]'
		return
	fi

	# Return last N alerts
	jsonfilter -i "$alerts_file" -e '@[*]' 2>/dev/null | tail -n "$limit" | json_slurp
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

merge_json_arrays() {
	local arr1="$1"
	local arr2="$2"

	[ "$arr1" = "[]" ] && { echo "$arr2"; return; }
	[ "$arr2" = "[]" ] && { echo "$arr1"; return; }

	local inner1=$(echo "$arr1" | sed 's/^\[//; s/\]$//')
	local inner2=$(echo "$arr2" | sed 's/^\[//; s/\]$//')

	printf '[%s,%s]' "$inner1" "$inner2"
}
