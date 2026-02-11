# SecuBox Threat Analyst - Rule Appliers
# Applies generated rules to mitmproxy, CrowdSec, WAF

# =============================================================================
# MITMPROXY APPLIER
# =============================================================================

apply_mitmproxy_filters() {
	local filter_content="$1"
	local output_path=$(uci_get target_mitmproxy_filters.output_path)
	local reload_cmd=$(uci_get target_mitmproxy_filters.reload_cmd)

	[ -z "$output_path" ] && output_path="/etc/mitmproxy/ai_filters.py"

	# Backup existing
	[ -f "$output_path" ] && cp "$output_path" "${output_path}.bak"

	# Write new filters
	echo "$filter_content" > "$output_path"
	chmod 644 "$output_path"

	log_info "Written mitmproxy filters to $output_path"

	# Reload if configured
	if [ -n "$reload_cmd" ]; then
		eval "$reload_cmd" 2>/dev/null && log_info "mitmproxy reloaded" || log_warn "mitmproxy reload failed"
	fi
}

# =============================================================================
# CROWDSEC APPLIER
# =============================================================================

apply_crowdsec_scenario() {
	local scenario_content="$1"
	local output_path=$(uci_get target_crowdsec_scenarios.output_path)
	local reload_cmd=$(uci_get target_crowdsec_scenarios.reload_cmd)

	[ -z "$output_path" ] && output_path="/etc/crowdsec/scenarios/ai-generated.yaml"

	# Ensure directory exists
	mkdir -p "$(dirname "$output_path")"

	# Backup existing
	[ -f "$output_path" ] && cp "$output_path" "${output_path}.bak"

	# Write new scenario
	echo "$scenario_content" > "$output_path"
	chmod 644 "$output_path"

	log_info "Written CrowdSec scenario to $output_path"

	# Install scenario
	if command -v cscli >/dev/null 2>&1; then
		# Validate YAML syntax
		if cscli scenarios inspect "$output_path" >/dev/null 2>&1; then
			cscli scenarios install "$output_path" --force 2>/dev/null
			log_info "CrowdSec scenario installed"

			# Reload CrowdSec
			if [ -n "$reload_cmd" ]; then
				eval "$reload_cmd" 2>/dev/null
			else
				/etc/init.d/crowdsec reload 2>/dev/null
			fi
		else
			log_warn "CrowdSec scenario validation failed"
		fi
	fi
}

# =============================================================================
# WAF APPLIER
# =============================================================================

apply_waf_rules() {
	local rules_content="$1"
	local output_path=$(uci_get target_waf_rules.output_path)
	local reload_cmd=$(uci_get target_waf_rules.reload_cmd)

	[ -z "$output_path" ] && output_path="/etc/mitmproxy/waf_ai_rules.json"

	# Ensure directory exists
	mkdir -p "$(dirname "$output_path")"

	# Backup existing
	[ -f "$output_path" ] && cp "$output_path" "${output_path}.bak"

	# Validate JSON
	if echo "$rules_content" | jsonfilter -e '@' >/dev/null 2>&1; then
		echo "$rules_content" > "$output_path"
		chmod 644 "$output_path"
		log_info "Written WAF rules to $output_path"

		# Reload if configured
		if [ -n "$reload_cmd" ]; then
			eval "$reload_cmd" 2>/dev/null && log_info "WAF reloaded" || log_warn "WAF reload failed"
		fi
	else
		log_error "WAF rules JSON validation failed"
		return 1
	fi
}

# =============================================================================
# PENDING RULES MANAGEMENT
# =============================================================================

approve_pending_rule() {
	local rule_id="$1"
	local pending_file="$STATE_DIR/pending_rules.json"

	if [ ! -f "$pending_file" ]; then
		log_error "No pending rules"
		return 1
	fi

	# Find rule by ID
	local rule=$(jsonfilter -i "$pending_file" -e "@[?(@.id==\"$rule_id\")]" 2>/dev/null)

	if [ -z "$rule" ]; then
		log_error "Rule not found: $rule_id"
		return 1
	fi

	local rule_type=$(echo "$rule" | jsonfilter -e '@.type')
	local rule_content=$(echo "$rule" | jsonfilter -e '@.content' | base64 -d)

	# Apply based on type
	case "$rule_type" in
		mitmproxy)
			apply_mitmproxy_filters "$rule_content"
			;;
		crowdsec)
			apply_crowdsec_scenario "$rule_content"
			;;
		waf)
			apply_waf_rules "$rule_content"
			;;
		*)
			log_error "Unknown rule type: $rule_type"
			return 1
			;;
	esac

	# Remove from pending
	remove_pending_rule "$rule_id"
	log_info "Approved and applied rule: $rule_id"
}

reject_pending_rule() {
	local rule_id="$1"

	remove_pending_rule "$rule_id"
	log_info "Rejected rule: $rule_id"
}

remove_pending_rule() {
	local rule_id="$1"
	local pending_file="$STATE_DIR/pending_rules.json"

	if [ ! -f "$pending_file" ]; then
		return
	fi

	# Filter out the rule (simple approach using temp file)
	local temp_file="${pending_file}.tmp"

	# Filter out the rule - rebuild array without jq
	{
		printf '['
		local first=1
		jsonfilter -i "$pending_file" -e '@[*]' 2>/dev/null | while read -r item; do
			local item_id=$(echo "$item" | jsonfilter -e '@.id' 2>/dev/null)
			[ "$item_id" = "$rule_id" ] && continue
			[ $first -eq 0 ] && printf ','
			first=0
			printf '%s' "$item"
		done
		printf ']'
	} > "$temp_file"

	mv "$temp_file" "$pending_file"
}

apply_all_pending() {
	local pending_file="$STATE_DIR/pending_rules.json"

	if [ ! -f "$pending_file" ]; then
		echo "No pending rules"
		return 0
	fi

	local count=0
	jsonfilter -i "$pending_file" -e '@[*].id' 2>/dev/null | while read -r rule_id; do
		[ -n "$rule_id" ] && approve_pending_rule "$rule_id" && count=$((count + 1))
	done

	echo "Applied $count pending rules"
}

# =============================================================================
# CHATBOT INTERFACE
# =============================================================================

# Simple chat interface for LuCI integration
chat_query() {
	local query="$1"

	# Check LocalAI
	if ! wget -q -O /dev/null --timeout=3 "${localai_url}/v1/models" 2>/dev/null; then
		echo '{"error":"LocalAI not available"}'
		return 1
	fi

	# Get current threat context
	local threat_summary=$(collect_threats | head -c 4000)

	local prompt="You are the SecuBox Threat Analyst AI assistant. You help analyze security threats and manage filters.

Current threat context:
$threat_summary

User query: $query

Provide a helpful, concise response. If the user asks about threats, analyze the context. If they ask to generate rules, provide specific recommendations."

	local request=$(cat <<EOF
{"model":"$localai_model","messages":[{"role":"system","content":"You are SecuBox Threat Analyst, a security AI assistant."},{"role":"user","content":"$(echo "$prompt" | sed 's/"/\\"/g' | tr '\n' ' ')"}],"max_tokens":1024,"temperature":0.5}
EOF
)

	local response=$(echo "$request" | wget -q -O - --post-data=- \
		--header="Content-Type: application/json" \
		"${localai_url}/v1/chat/completions" 2>/dev/null)

	if [ -n "$response" ]; then
		local content=$(echo "$response" | jsonfilter -e '@.choices[0].message.content' 2>/dev/null)
		printf '{"response":"%s"}' "$(echo "$content" | sed 's/"/\\"/g' | tr '\n' ' ')"
	else
		echo '{"error":"AI query failed"}'
	fi
}
