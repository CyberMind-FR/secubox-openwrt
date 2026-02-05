# SecuBox DNS Guard - Anomaly Detection Module
# Copyright (C) 2026 CyberMind.fr
#
# Implements multiple DNS anomaly detection algorithms

# =============================================================================
# DNS QUERY COLLECTION
# =============================================================================

collect_dns_queries() {
	local log_file=$(uci -q get dns-guard.dnsmasq.log_facility)
	[ -z "$log_file" ] && log_file="/var/log/dnsmasq.log"

	if [ ! -f "$log_file" ]; then
		# Try logread as fallback
		logread | grep "dnsmasq\[" | grep "query\[" | tail -1000
		return
	fi

	# Get queries from the last interval
	# Format: timestamp dnsmasq[pid]: query[A] domain from client
	tail -5000 "$log_file" 2>/dev/null | grep "query\[" | while read -r line; do
		# Extract domain and client
		local domain=$(echo "$line" | sed -n 's/.*query\[[^]]*\] \([^ ]*\) from.*/\1/p')
		local client=$(echo "$line" | sed -n 's/.*from \([^ ]*\).*/\1/p')
		local qtype=$(echo "$line" | sed -n 's/.*query\[\([^]]*\)\].*/\1/p')

		[ -n "$domain" ] && echo "$domain|$client|$qtype"
	done | sort -u
}

# =============================================================================
# ENTROPY CALCULATION (for DGA detection)
# =============================================================================

calculate_entropy() {
	local str="$1"
	local len=${#str}
	[ "$len" -eq 0 ] && { echo "0"; return; }

	# Count character frequencies using awk
	local entropy=$(echo "$str" | awk -v len="$len" '
	BEGIN {
		split("", freq)
	}
	{
		n = split($0, chars, "")
		for (i = 1; i <= n; i++) {
			freq[chars[i]]++
		}
	}
	END {
		entropy = 0
		for (c in freq) {
			p = freq[c] / len
			if (p > 0) {
				entropy -= p * log(p) / log(2)
			}
		}
		printf "%.2f", entropy
	}')

	echo "$entropy"
}

# =============================================================================
# DGA DETECTION
# =============================================================================

detect_dga() {
	local domain="$1"
	local client="$2"

	local entropy_threshold=$(uci -q get dns-guard.dga.entropy_threshold)
	local min_length=$(uci -q get dns-guard.dga.min_length)
	[ -z "$entropy_threshold" ] && entropy_threshold="3.2"
	[ -z "$min_length" ] && min_length="12"

	# Extract subdomain (first label before TLD)
	local subdomain=$(echo "$domain" | awk -F'.' '{
		if (NF >= 2) {
			print $1
		}
	}')

	[ -z "$subdomain" ] && return 1
	[ ${#subdomain} -lt "$min_length" ] && return 1

	# Calculate entropy of subdomain
	local entropy=$(calculate_entropy "$subdomain")

	# Check if entropy exceeds threshold (using awk for float comparison)
	local is_dga=$(awk -v e="$entropy" -v t="$entropy_threshold" 'BEGIN { print (e >= t) ? 1 : 0 }')

	if [ "$is_dga" = "1" ]; then
		# Additional heuristics: consonant ratio, digit ratio
		local consonant_ratio=$(echo "$subdomain" | awk '{
			gsub(/[aeiouAEIOU0-9]/, "", $0)
			print length($0) / length($0) * 100
		}')

		local digit_ratio=$(echo "$subdomain" | awk '{
			total = length($0)
			gsub(/[^0-9]/, "", $0)
			print (length($0) / total) * 100
		}')

		# High consonant ratio + high entropy = likely DGA
		local confidence=70
		[ "$(awk -v e="$entropy" 'BEGIN { print (e > 3.5) ? 1 : 0 }')" = "1" ] && confidence=$((confidence + 15))
		[ ${#subdomain} -gt 20 ] && confidence=$((confidence + 10))

		printf '{"domain":"%s","client":"%s","type":"dga","confidence":%d,"reason":"High entropy (%.2f), length=%d"}' \
			"$domain" "$client" "$confidence" "$entropy" "${#subdomain}"
		return 0
	fi

	return 1
}

# =============================================================================
# DNS TUNNELING DETECTION
# =============================================================================

detect_tunneling() {
	local domain="$1"
	local client="$2"
	local qtype="$3"

	local max_subdomain=$(uci -q get dns-guard.tunneling.max_subdomain_length)
	[ -z "$max_subdomain" ] && max_subdomain="63"

	# Check for very long subdomains (data exfiltration)
	local first_label=$(echo "$domain" | cut -d'.' -f1)
	local label_len=${#first_label}

	if [ "$label_len" -gt "$max_subdomain" ]; then
		printf '{"domain":"%s","client":"%s","type":"tunneling","confidence":90,"reason":"Excessive subdomain length (%d chars)"}' \
			"$domain" "$client" "$label_len"
		return 0
	fi

	# Check for base64-like patterns in subdomain
	if echo "$first_label" | grep -qE '^[A-Za-z0-9+/]{20,}={0,2}$'; then
		printf '{"domain":"%s","client":"%s","type":"tunneling","confidence":85,"reason":"Base64-like subdomain pattern"}' \
			"$domain" "$client"
		return 0
	fi

	# Check for hex-encoded data
	if echo "$first_label" | grep -qE '^[0-9a-fA-F]{32,}$'; then
		printf '{"domain":"%s","client":"%s","type":"tunneling","confidence":80,"reason":"Hex-encoded subdomain"}' \
			"$domain" "$client"
		return 0
	fi

	# TXT queries are common for tunneling
	if [ "$qtype" = "TXT" ]; then
		# Check TXT query rate for this domain
		local txt_count=$(grep -c "query\[TXT\] $domain" "$STATE_DIR/recent_queries" 2>/dev/null || echo "0")
		local txt_limit=$(uci -q get dns-guard.tunneling.txt_rate_limit)
		[ -z "$txt_limit" ] && txt_limit="10"

		if [ "$txt_count" -gt "$txt_limit" ]; then
			printf '{"domain":"%s","client":"%s","type":"tunneling","confidence":75,"reason":"High TXT query rate (%d/min)"}' \
				"$domain" "$client" "$txt_count"
			return 0
		fi
	fi

	return 1
}

# =============================================================================
# RATE ANOMALY DETECTION
# =============================================================================

detect_rate_anomaly() {
	local queries="$1"

	local qpm_threshold=$(uci -q get dns-guard.rate_anomaly.queries_per_minute)
	local udpm_threshold=$(uci -q get dns-guard.rate_anomaly.unique_domains_per_minute)
	[ -z "$qpm_threshold" ] && qpm_threshold="100"
	[ -z "$udpm_threshold" ] && udpm_threshold="50"

	local anomalies=""

	# Analyze per-client query rates
	echo "$queries" | awk -F'|' '{
		clients[$2]++
		domains[$2,$1] = 1
	}
	END {
		for (c in clients) {
			unique = 0
			for (key in domains) {
				split(key, parts, SUBSEP)
				if (parts[1] == c) unique++
			}
			print c "|" clients[c] "|" unique
		}
	}' | while read -r line; do
		local client=$(echo "$line" | cut -d'|' -f1)
		local count=$(echo "$line" | cut -d'|' -f2)
		local unique=$(echo "$line" | cut -d'|' -f3)

		if [ "$count" -gt "$qpm_threshold" ]; then
			printf '{"domain":"*","client":"%s","type":"rate_anomaly","confidence":80,"reason":"High query rate (%d queries)"}\n' \
				"$client" "$count"
		fi

		if [ "$unique" -gt "$udpm_threshold" ]; then
			printf '{"domain":"*","client":"%s","type":"rate_anomaly","confidence":75,"reason":"High unique domain rate (%d domains)"}\n' \
				"$client" "$unique"
		fi
	done
}

# =============================================================================
# KNOWN BAD DOMAIN DETECTION
# =============================================================================

detect_known_bad() {
	local domain="$1"
	local client="$2"

	local blocklist_paths=$(uci -q get dns-guard.known_bad.blocklist_paths)
	[ -z "$blocklist_paths" ] && blocklist_paths="/etc/dns-guard/blocklists"

	# Check against local blocklists
	if [ -d "$blocklist_paths" ]; then
		for list in "$blocklist_paths"/*; do
			[ -f "$list" ] || continue
			if grep -qFx "$domain" "$list" 2>/dev/null; then
				local list_name=$(basename "$list")
				printf '{"domain":"%s","client":"%s","type":"known_bad","confidence":95,"reason":"Found in blocklist: %s"}' \
					"$domain" "$client" "$list_name"
				return 0
			fi
		done
	fi

	# Check against state-maintained threat list
	local threat_domains="$STATE_DIR/threat_domains.txt"
	if [ -f "$threat_domains" ] && grep -qFx "$domain" "$threat_domains" 2>/dev/null; then
		printf '{"domain":"%s","client":"%s","type":"known_bad","confidence":90,"reason":"Previously identified threat"}' \
			"$domain" "$client"
		return 0
	fi

	return 1
}

# =============================================================================
# TLD ANOMALY DETECTION
# =============================================================================

detect_tld_anomaly() {
	local domain="$1"
	local client="$2"

	local suspicious_tlds=$(uci -q get dns-guard.tld_anomaly.suspicious_tlds)
	[ -z "$suspicious_tlds" ] && suspicious_tlds="xyz,top,club,work,date,loan,racing,download,review,click,bid,stream,gdn,icu"

	# Extract TLD
	local tld=$(echo "$domain" | awk -F'.' '{print $NF}')
	[ -z "$tld" ] && return 1

	# Check if TLD is in suspicious list
	if echo ",$suspicious_tlds," | grep -qi ",$tld,"; then
		# Lower confidence - suspicious TLD alone isn't conclusive
		printf '{"domain":"%s","client":"%s","type":"tld_anomaly","confidence":50,"reason":"Suspicious TLD: .%s"}' \
			"$domain" "$client" "$tld"
		return 0
	fi

	# Check for punycode (IDN) domains that might be homograph attacks
	if echo "$domain" | grep -q "^xn--"; then
		printf '{"domain":"%s","client":"%s","type":"tld_anomaly","confidence":60,"reason":"Punycode/IDN domain (potential homograph)"}' \
			"$domain" "$client"
		return 0
	fi

	return 1
}

# =============================================================================
# RUN ALL DETECTORS
# =============================================================================

run_all_detectors() {
	local queries="$1"
	local anomalies='[]'

	# Store recent queries for rate analysis
	echo "$queries" > "$STATE_DIR/recent_queries"

	# Per-query detectors
	echo "$queries" | while IFS='|' read -r domain client qtype; do
		[ -z "$domain" ] && continue

		# Skip local/internal domains
		case "$domain" in
			localhost|*.local|*.lan|*.localdomain) continue ;;
			*.in-addr.arpa|*.ip6.arpa) continue ;;
		esac

		# DGA detection
		if [ "$(uci -q get dns-guard.dga.enabled)" = "1" ]; then
			local dga_result=$(detect_dga "$domain" "$client")
			[ -n "$dga_result" ] && echo "$dga_result"
		fi

		# Tunneling detection
		if [ "$(uci -q get dns-guard.tunneling.enabled)" = "1" ]; then
			local tunnel_result=$(detect_tunneling "$domain" "$client" "$qtype")
			[ -n "$tunnel_result" ] && echo "$tunnel_result"
		fi

		# Known bad detection
		if [ "$(uci -q get dns-guard.known_bad.enabled)" = "1" ]; then
			local bad_result=$(detect_known_bad "$domain" "$client")
			[ -n "$bad_result" ] && echo "$bad_result"
		fi

		# TLD anomaly detection
		if [ "$(uci -q get dns-guard.tld_anomaly.enabled)" = "1" ]; then
			local tld_result=$(detect_tld_anomaly "$domain" "$client")
			[ -n "$tld_result" ] && echo "$tld_result"
		fi
	done | json_slurp

	# Rate anomaly detection (aggregate)
	if [ "$(uci -q get dns-guard.rate_anomaly.enabled)" = "1" ]; then
		detect_rate_anomaly "$queries"
	fi
}

# =============================================================================
# SINGLE DOMAIN CHECK
# =============================================================================

check_domain_all_detectors() {
	local domain="$1"
	local client="local"

	echo "Domain: $domain"
	echo ""

	# DGA check
	echo "DGA Detection:"
	local subdomain=$(echo "$domain" | cut -d'.' -f1)
	local entropy=$(calculate_entropy "$subdomain")
	printf "  Subdomain: %s (length: %d)\n" "$subdomain" "${#subdomain}"
	printf "  Entropy: %s\n" "$entropy"
	local dga_result=$(detect_dga "$domain" "$client")
	if [ -n "$dga_result" ]; then
		echo "  Result: SUSPICIOUS"
		echo "  $dga_result"
	else
		echo "  Result: OK"
	fi
	echo ""

	# Tunneling check
	echo "Tunneling Detection:"
	local tunnel_result=$(detect_tunneling "$domain" "$client" "A")
	if [ -n "$tunnel_result" ]; then
		echo "  Result: SUSPICIOUS"
		echo "  $tunnel_result"
	else
		echo "  Result: OK"
	fi
	echo ""

	# Known bad check
	echo "Known Bad Detection:"
	local bad_result=$(detect_known_bad "$domain" "$client")
	if [ -n "$bad_result" ]; then
		echo "  Result: BLOCKED"
		echo "  $bad_result"
	else
		echo "  Result: OK"
	fi
	echo ""

	# TLD check
	echo "TLD Anomaly Detection:"
	local tld=$(echo "$domain" | awk -F'.' '{print $NF}')
	printf "  TLD: .%s\n" "$tld"
	local tld_result=$(detect_tld_anomaly "$domain" "$client")
	if [ -n "$tld_result" ]; then
		echo "  Result: SUSPICIOUS"
		echo "  $tld_result"
	else
		echo "  Result: OK"
	fi
}

# =============================================================================
# STATISTICS FUNCTIONS
# =============================================================================

show_query_stats() {
	local log_file=$(uci -q get dns-guard.dnsmasq.log_facility)
	[ -z "$log_file" ] && log_file="/var/log/dnsmasq.log"

	if [ ! -f "$log_file" ]; then
		echo "No DNS log file found"
		return
	fi

	local total=$(grep -c "query\[" "$log_file" 2>/dev/null || echo "0")
	local a_queries=$(grep -c "query\[A\]" "$log_file" 2>/dev/null || echo "0")
	local aaaa_queries=$(grep -c "query\[AAAA\]" "$log_file" 2>/dev/null || echo "0")
	local txt_queries=$(grep -c "query\[TXT\]" "$log_file" 2>/dev/null || echo "0")
	local unique_domains=$(grep "query\[" "$log_file" 2>/dev/null | sed 's/.*query\[[^]]*\] \([^ ]*\) from.*/\1/' | sort -u | wc -l)

	echo "=== DNS Query Statistics ==="
	echo ""
	echo "Total queries: $total"
	echo "Unique domains: $unique_domains"
	echo ""
	echo "By type:"
	printf "  A:    %s\n" "$a_queries"
	printf "  AAAA: %s\n" "$aaaa_queries"
	printf "  TXT:  %s\n" "$txt_queries"
}

show_top_domains() {
	local limit="$1"
	[ -z "$limit" ] && limit=20

	local log_file=$(uci -q get dns-guard.dnsmasq.log_facility)
	[ -z "$log_file" ] && log_file="/var/log/dnsmasq.log"

	echo "=== Top $limit Queried Domains ==="
	echo ""

	grep "query\[" "$log_file" 2>/dev/null | \
		sed 's/.*query\[[^]]*\] \([^ ]*\) from.*/\1/' | \
		sort | uniq -c | sort -rn | head -n "$limit" | \
		awk '{ printf "%6d  %s\n", $1, $2 }'
}

show_top_clients() {
	local limit="$1"
	[ -z "$limit" ] && limit=10

	local log_file=$(uci -q get dns-guard.dnsmasq.log_facility)
	[ -z "$log_file" ] && log_file="/var/log/dnsmasq.log"

	echo "=== Top $limit DNS Clients ==="
	echo ""

	grep "query\[" "$log_file" 2>/dev/null | \
		sed 's/.*from \([^ ]*\).*/\1/' | \
		sort | uniq -c | sort -rn | head -n "$limit" | \
		awk '{ printf "%6d  %s\n", $1, $2 }'
}

# =============================================================================
# JSON HELPERS
# =============================================================================

json_slurp() {
	printf '['
	local first=1
	while IFS= read -r line; do
		[ -z "$line" ] && continue
		echo "$line" | jsonfilter -e '@' >/dev/null 2>&1 || continue
		[ $first -eq 0 ] && printf ','
		first=0
		printf '%s' "$line"
	done
	printf ']'
}
