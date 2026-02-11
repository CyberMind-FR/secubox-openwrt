#!/bin/sh
#
# SecuBox RPCD - Stats Evolution & Timeline
# Persistent stats, time-series evolution, combined heartbeat line
#

PERSIST_DIR="/srv/secubox/stats"
CACHE_DIR="/tmp/secubox"

# Register methods
list_methods_stats() {
	add_method "get_timeline"
	add_method "get_evolution"
	add_method "get_heartbeat_line"
	add_method "get_stats_status"
	add_method "get_history"
	add_method_str "get_collector_cache" "collector"
}

# Handle method calls
handle_stats() {
	local method="$1"
	case "$method" in
		get_timeline)
			_do_get_timeline
			;;
		get_evolution)
			_do_get_evolution
			;;
		get_heartbeat_line)
			_do_get_heartbeat_line
			;;
		get_stats_status)
			_do_get_stats_status
			;;
		get_history)
			read_input_json
			local collector=$(get_input "collector")
			local period=$(get_input "period")
			_do_get_history "$collector" "$period"
			;;
		get_collector_cache)
			read_input_json
			local collector=$(get_input "collector")
			_do_get_collector_cache "$collector"
			;;
		*)
			return 1
			;;
	esac
}

# Get timeline (24h evolution for all collectors)
_do_get_timeline() {
	local timeline_file="$PERSIST_DIR/timeline.json"

	if [ -f "$timeline_file" ]; then
		cat "$timeline_file"
	else
		json_init
		json_add_string "error" "Timeline not generated yet"
		json_add_string "hint" "Run: secubox-stats-persist timeline"
		json_dump
	fi
}

# Get evolution (combined influence score)
_do_get_evolution() {
	local evolution_file="$PERSIST_DIR/evolution.json"

	if [ -f "$evolution_file" ]; then
		cat "$evolution_file"
	else
		json_init
		json_add_string "error" "Evolution not generated yet"
		json_add_string "hint" "Run: secubox-stats-persist evolution"
		json_dump
	fi
}

# Get heartbeat line (real-time 3min buffer)
_do_get_heartbeat_line() {
	local heartbeat_file="$PERSIST_DIR/heartbeat-line.json"

	if [ -f "$heartbeat_file" ]; then
		cat "$heartbeat_file"
	else
		# Generate on-demand if daemon not running
		if [ -x /usr/sbin/secubox-stats-persist ]; then
			/usr/sbin/secubox-stats-persist heartbeat
		else
			json_init
			json_add_string "error" "Heartbeat line not available"
			json_dump
		fi
	fi
}

# Get stats persistence status
_do_get_stats_status() {
	json_init

	# Check persistence directory
	local persist_ok=0
	[ -d "$PERSIST_DIR" ] && persist_ok=1
	json_add_boolean "persistence_enabled" "$persist_ok"
	json_add_string "persist_dir" "$PERSIST_DIR"
	json_add_string "cache_dir" "$CACHE_DIR"

	# Count cached files
	local cache_count=$(ls "$CACHE_DIR"/*.json 2>/dev/null | wc -l)
	json_add_int "cached_files" "${cache_count:-0}"

	# Count persisted files
	local persist_count=$(ls "$PERSIST_DIR"/*.json 2>/dev/null | wc -l)
	json_add_int "persisted_files" "${persist_count:-0}"

	# Last persist time
	local last_persist=""
	if [ -f "$PERSIST_DIR/.last_persist" ]; then
		last_persist=$(cat "$PERSIST_DIR/.last_persist")
	fi
	json_add_string "last_persist" "${last_persist:-never}"

	# History stats
	json_add_object "history"
	local hourly_total=0 daily_total=0
	for collector in health threat capacity crowdsec mitmproxy; do
		local hourly_count=$(ls "$PERSIST_DIR/history/hourly/$collector"/*.json 2>/dev/null | wc -l)
		local daily_count=$(ls "$PERSIST_DIR/history/daily/$collector"/*.json 2>/dev/null | wc -l)
		hourly_total=$((hourly_total + hourly_count))
		daily_total=$((daily_total + daily_count))
	done
	json_add_int "hourly_snapshots" "$hourly_total"
	json_add_int "daily_aggregates" "$daily_total"
	json_close_object

	# Current cache values
	json_add_object "current"
	local health=$(jsonfilter -i "$CACHE_DIR/health.json" -e '@.score' 2>/dev/null || echo 0)
	local threat=$(jsonfilter -i "$CACHE_DIR/threat.json" -e '@.level' 2>/dev/null || echo 0)
	local capacity=$(jsonfilter -i "$CACHE_DIR/capacity.json" -e '@.combined' 2>/dev/null || echo 0)
	json_add_int "health" "$health"
	json_add_int "threat" "$threat"
	json_add_int "capacity" "$capacity"

	# Calculate influence
	local t_inv=$((100 - threat))
	local c_inv=$((100 - capacity))
	local influence=$(( (health * 40 + t_inv * 30 + c_inv * 30) / 100 ))
	json_add_int "influence" "$influence"
	json_close_object

	json_dump
}

# Get history for specific collector
_do_get_history() {
	local collector="$1"
	local period="$2"

	[ -z "$period" ] && period="hourly"

	json_init
	json_add_string "collector" "$collector"
	json_add_string "period" "$period"

	local history_dir="$PERSIST_DIR/history/$period/$collector"

	if [ ! -d "$history_dir" ]; then
		json_add_string "error" "No history for $collector ($period)"
		json_dump
		return
	fi

	json_add_array "data"
	for hfile in $(ls -t "$history_dir"/*.json 2>/dev/null | head -48); do
		[ -f "$hfile" ] || continue
		local filename=$(basename "$hfile" .json)
		local content=$(cat "$hfile" 2>/dev/null)

		# Extract key values based on collector
		local ts=$(jsonfilter -i "$hfile" -e '@.timestamp' 2>/dev/null || echo 0)
		local val
		case "$collector" in
			health)    val=$(jsonfilter -i "$hfile" -e '@.score' 2>/dev/null) ;;
			threat)    val=$(jsonfilter -i "$hfile" -e '@.level' 2>/dev/null) ;;
			capacity)  val=$(jsonfilter -i "$hfile" -e '@.combined' 2>/dev/null) ;;
			crowdsec*) val=$(jsonfilter -i "$hfile" -e '@.alerts_24h' 2>/dev/null) ;;
			mitmproxy) val=$(jsonfilter -i "$hfile" -e '@.threats_today' 2>/dev/null) ;;
			*)         val=$(jsonfilter -i "$hfile" -e '@.total' 2>/dev/null) ;;
		esac
		[ -z "$val" ] && val=0

		json_add_object ""
		json_add_string "time" "$filename"
		json_add_int "timestamp" "$ts"
		json_add_int "value" "$val"
		json_close_object
	done
	json_close_array

	json_dump
}

# Get current collector cache
_do_get_collector_cache() {
	local collector="$1"

	local cache_file="$CACHE_DIR/${collector}.json"

	if [ -f "$cache_file" ]; then
		cat "$cache_file"
	else
		json_init
		json_add_string "error" "Cache not found: $collector"
		json_dump
	fi
}
