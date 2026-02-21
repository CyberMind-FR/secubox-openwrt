#!/bin/sh
# WebRadio Scheduler - Cron-based show automation
# Called by cron to switch between scheduled programs

CONF_DIR="/srv/webradio/config"
LOG_DIR="/var/log/webradio"

log() {
	logger -t "webradio-scheduler" "$1"
	echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_DIR/scheduler.log"
}

uci_get() { uci -q get "webradio.$1" 2>/dev/null || echo "$2"; }

# Get current day/hour
DAY=$(date +%u)  # 1-7 (Mon-Sun)
HOUR=$(date +%H)

# Find matching schedule
find_schedule() {
	local schedules=$(uci show webradio 2>/dev/null | grep "=schedule$" | cut -d. -f2 | cut -d= -f1)

	for sched in $schedules; do
		local enabled=$(uci_get "${sched}.enabled" "0")
		[ "$enabled" != "1" ] && continue

		local days=$(uci_get "${sched}.days" "")
		local start_hour=$(uci_get "${sched}.start_hour" "0")
		local end_hour=$(uci_get "${sched}.end_hour" "24")

		# Check if current day matches
		echo "$days" | grep -q "$DAY" || continue

		# Check if current hour is in range
		if [ "$HOUR" -ge "$start_hour" ] && [ "$HOUR" -lt "$end_hour" ]; then
			echo "$sched"
			return 0
		fi
	done

	echo "default"
}

apply_schedule() {
	local sched="$1"

	if [ "$sched" = "default" ]; then
		log "No active schedule - using default playlist"
		return 0
	fi

	local name=$(uci_get "${sched}.name" "Unknown")
	local playlist_dir=$(uci_get "${sched}.playlist_dir" "")
	local jingle=$(uci_get "${sched}.intro_jingle" "")

	log "Activating schedule: $name"

	# Play intro jingle if configured
	if [ -n "$jingle" ] && [ -f "$jingle" ]; then
		log "Playing intro jingle: $jingle"
		# Signal ezstream to queue jingle
		echo "$jingle" > /tmp/webradio_next_track
		pkill -USR1 -f "ezstream" 2>/dev/null
	fi

	# If schedule has specific playlist directory, regenerate
	if [ -n "$playlist_dir" ] && [ -d "$playlist_dir" ]; then
		log "Switching to playlist: $playlist_dir"
		uci set webradio.playlist.directory="$playlist_dir"
		uci commit webradio
		/usr/sbin/webradioctl playlist generate
		/etc/init.d/webradio reload
	fi
}

# Main
current_schedule=$(find_schedule)
log "Current schedule check: $current_schedule"

# Check if schedule changed
LAST_SCHEDULE_FILE="/tmp/webradio_last_schedule"
last_schedule=""
[ -f "$LAST_SCHEDULE_FILE" ] && last_schedule=$(cat "$LAST_SCHEDULE_FILE")

if [ "$current_schedule" != "$last_schedule" ]; then
	apply_schedule "$current_schedule"
	echo "$current_schedule" > "$LAST_SCHEDULE_FILE"
fi
