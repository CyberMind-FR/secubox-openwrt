# SecuBox MCP Tool: DNS Query Statistics
# Provides DNS stats from AdGuard Home or dnsmasq

ADGUARD_API="http://127.0.0.1:3000/control"

tool_dns_queries() {
	# Try AdGuard Home first
	if adguard_available; then
		get_adguard_stats
	else
		# Fallback to dnsmasq stats
		get_dnsmasq_stats
	fi
}

adguard_available() {
	wget -q -O /dev/null --timeout=2 "${ADGUARD_API}/status" 2>/dev/null
}

get_adguard_stats() {
	# Get AdGuard Home statistics
	local stats=$(wget -q -O - "${ADGUARD_API}/stats" 2>/dev/null)

	if [ -z "$stats" ]; then
		echo '{"source":"adguard","error":"Could not retrieve stats"}'
		return 1
	fi

	# Parse key metrics
	local total=$(echo "$stats" | jsonfilter -e '@.num_dns_queries' 2>/dev/null)
	local blocked=$(echo "$stats" | jsonfilter -e '@.num_blocked_filtering' 2>/dev/null)
	local safe_browsing=$(echo "$stats" | jsonfilter -e '@.num_replaced_safebrowsing' 2>/dev/null)
	local parental=$(echo "$stats" | jsonfilter -e '@.num_replaced_parental' 2>/dev/null)

	# Calculate percentages
	local block_pct=0
	[ "$total" -gt 0 ] 2>/dev/null && block_pct=$((blocked * 100 / total))

	# Get top clients and domains
	local top_clients=$(wget -q -O - "${ADGUARD_API}/stats" 2>/dev/null | jsonfilter -e '@.top_clients' 2>/dev/null)
	local top_blocked=$(wget -q -O - "${ADGUARD_API}/stats" 2>/dev/null | jsonfilter -e '@.top_blocked_domains' 2>/dev/null)

	cat <<EOF
{"source":"adguard","total_queries":${total:-0},"blocked_queries":${blocked:-0},"blocked_percent":$block_pct,"safe_browsing_blocked":${safe_browsing:-0},"parental_blocked":${parental:-0},"top_clients":${top_clients:-[]},"top_blocked_domains":${top_blocked:-[]}}
EOF
}

get_dnsmasq_stats() {
	# Get dnsmasq statistics from syslog
	local cache_hits=0
	local cache_misses=0
	local queries=0

	# Parse dnsmasq stats from logread
	local stats=$(logread 2>/dev/null | grep -E "dnsmasq.*queries" | tail -1)

	if [ -n "$stats" ]; then
		queries=$(echo "$stats" | grep -oE 'queries forwarded [0-9]+' | grep -oE '[0-9]+')
		cache_hits=$(echo "$stats" | grep -oE 'queries answered locally [0-9]+' | grep -oE '[0-9]+')
	fi

	# Count unique domains from conntrack
	local unique_domains=0
	if [ -f /proc/net/nf_conntrack ]; then
		unique_domains=$(grep -c "dport=53" /proc/net/nf_conntrack 2>/dev/null || echo 0)
	fi

	cat <<EOF
{"source":"dnsmasq","total_queries":${queries:-0},"cache_hits":${cache_hits:-0},"cache_misses":${cache_misses:-0},"active_dns_connections":$unique_domains}
EOF
}

# Get blocked domains list
tool_dns_blocklist() {
	if adguard_available; then
		local blocklist=$(wget -q -O - "${ADGUARD_API}/filtering/status" 2>/dev/null)
		echo "$blocklist"
	else
		echo '{"error":"Blocklist only available with AdGuard Home"}'
	fi
}
