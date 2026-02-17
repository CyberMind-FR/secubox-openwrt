#!/bin/sh
# WebRadio Scheduler - Cron-based programming grid
# Copyright (C) 2024 CyberMind.FR

. /lib/functions.sh

CONFIG="webradio"
PLAYLIST_DIR="/srv/webradio/playlists"
JINGLE_DIR="/srv/webradio/jingles"
SCHEDULE_CRON="/etc/cron.d/webradio"
CURRENT_SHOW_FILE="/var/run/webradio/current_show"
LOG_FILE="/var/log/webradio-scheduler.log"

# Logging
log() {
	local msg="$(date '+%Y-%m-%d %H:%M:%S') $1"
	echo "$msg" >> "$LOG_FILE"
	logger -t webradio-scheduler "$1"
}

# Load schedule slot
load_schedule_slot() {
	local name enabled start_time end_time days playlist jingle_before jingle_after

	config_get name "$1" name ""
	config_get enabled "$1" enabled "0"
	config_get start_time "$1" start_time ""
	config_get end_time "$1" end_time ""
	config_get days "$1" days "0123456"
	config_get playlist "$1" playlist ""
	config_get jingle_before "$1" jingle_before ""
	config_get jingle_after "$1" jingle_after ""

	[ "$enabled" = "1" ] || return
	[ -n "$start_time" ] || return
	[ -n "$name" ] || return

	# Parse time (HH:MM)
	local hour=$(echo "$start_time" | cut -d: -f1 | sed 's/^0//')
	local minute=$(echo "$start_time" | cut -d: -f2 | sed 's/^0//')

	# Convert days to cron format (0-6, Sunday=0)
	local cron_days=$(echo "$days" | sed 's/./&,/g' | sed 's/,$//')

	# Add cron entry
	echo "# $name" >> "$SCHEDULE_CRON"
	echo "$minute $hour * * $cron_days /usr/lib/webradio/scheduler.sh play_slot '$1'" >> "$SCHEDULE_CRON"

	log "Scheduled: $name at $start_time on days $days"
}

# Generate cron entries from UCI config
generate_cron() {
	log "Generating schedule cron..."

	mkdir -p "$(dirname "$SCHEDULE_CRON")"
	mkdir -p /var/run/webradio

	# Header
	cat > "$SCHEDULE_CRON" << 'EOF'
# WebRadio Schedule - Auto-generated
# Do not edit - use /etc/config/webradio
SHELL=/bin/sh
PATH=/usr/bin:/bin:/usr/sbin:/sbin

EOF

	config_load "$CONFIG"
	config_foreach load_schedule_slot schedule

	# Reload cron
	/etc/init.d/cron reload 2>/dev/null

	log "Cron schedule generated: $SCHEDULE_CRON"
}

# Play a scheduled slot
play_slot() {
	local slot="$1"

	config_load "$CONFIG"

	local name playlist jingle_before jingle_after crossfade
	config_get name "$slot" name "Unknown Show"
	config_get playlist "$slot" playlist ""
	config_get jingle_before "$slot" jingle_before ""
	config_get jingle_after "$slot" jingle_after ""
	config_get crossfade "$slot" crossfade "0"

	log "Starting show: $name"

	# Save current show info
	mkdir -p "$(dirname "$CURRENT_SHOW_FILE")"
	cat > "$CURRENT_SHOW_FILE" << EOF
SHOW_NAME="$name"
SHOW_SLOT="$slot"
SHOW_START="$(date -Iseconds)"
SHOW_PLAYLIST="$playlist"
EOF

	# Play jingle before (if configured)
	if [ -n "$jingle_before" ] && [ -f "$JINGLE_DIR/$jingle_before" ]; then
		log "Playing intro jingle: $jingle_before"
		play_jingle "$JINGLE_DIR/$jingle_before"
	fi

	# Switch playlist
	if [ -n "$playlist" ]; then
		local playlist_file="$PLAYLIST_DIR/${playlist}.m3u"
		if [ -f "$playlist_file" ]; then
			log "Switching to playlist: $playlist"
			cp "$playlist_file" "$PLAYLIST_DIR/current.m3u"

			# Restart ezstream to load new playlist
			/etc/init.d/ezstream restart
		else
			log "Warning: Playlist not found: $playlist_file"
		fi
	fi
}

# Play a jingle file via ffmpeg to Icecast
play_jingle() {
	local jingle_file="$1"

	[ -f "$jingle_file" ] || return 1

	# Get Icecast connection info
	config_load ezstream
	local host port password mount
	config_get host server hostname "127.0.0.1"
	config_get port server port "8000"
	config_get password server password "hackme"
	config_get mount server mount "/live"

	# Temporarily stop ezstream
	local ezstream_was_running=0
	pgrep -x ezstream >/dev/null && ezstream_was_running=1
	[ "$ezstream_was_running" = "1" ] && /etc/init.d/ezstream stop

	# Play jingle via ffmpeg
	if command -v ffmpeg >/dev/null 2>&1; then
		ffmpeg -re -i "$jingle_file" \
			-c:a libmp3lame -b:a 128k -ar 44100 -ac 2 \
			-content_type audio/mpeg \
			-f mp3 "icecast://source:${password}@${host}:${port}${mount}" \
			-loglevel error 2>&1
	fi

	# Restart ezstream if it was running
	[ "$ezstream_was_running" = "1" ] && /etc/init.d/ezstream start

	return 0
}

# Get current show info
current_show() {
	if [ -f "$CURRENT_SHOW_FILE" ]; then
		. "$CURRENT_SHOW_FILE"
		cat << EOF
{
	"name": "$SHOW_NAME",
	"slot": "$SHOW_SLOT",
	"start": "$SHOW_START",
	"playlist": "$SHOW_PLAYLIST"
}
EOF
	else
		echo '{"name": "Default", "slot": "", "start": "", "playlist": "current"}'
	fi
}

# List all scheduled slots
list_schedule() {
	config_load "$CONFIG"

	echo "Scheduled Shows:"
	echo "================"

	config_foreach list_slot_info schedule
}

list_slot_info() {
	local name enabled start_time end_time days playlist

	config_get name "$1" name "$1"
	config_get enabled "$1" enabled "0"
	config_get start_time "$1" start_time ""
	config_get end_time "$1" end_time ""
	config_get days "$1" days "0123456"
	config_get playlist "$1" playlist ""

	local status="disabled"
	[ "$enabled" = "1" ] && status="enabled"

	printf "  %-20s %s-%s  Days:%s  Playlist:%s  [%s]\n" \
		"$name" "$start_time" "$end_time" "$days" "$playlist" "$status"
}

# Play jingle now (manual trigger)
play_jingle_now() {
	local jingle="$1"

	if [ -z "$jingle" ]; then
		echo "Usage: scheduler.sh jingle <filename>"
		echo "Available jingles:"
		ls -1 "$JINGLE_DIR"/*.mp3 "$JINGLE_DIR"/*.ogg 2>/dev/null | while read f; do
			echo "  $(basename "$f")"
		done
		return 1
	fi

	local jingle_path="$JINGLE_DIR/$jingle"
	[ -f "$jingle_path" ] || jingle_path="$jingle"

	if [ -f "$jingle_path" ]; then
		log "Manual jingle: $jingle_path"
		play_jingle "$jingle_path"
		echo "Jingle played: $jingle_path"
	else
		echo "Jingle not found: $jingle"
		return 1
	fi
}

# Usage
usage() {
	cat << EOF
WebRadio Scheduler

Usage: $0 <command> [args]

Commands:
  generate              Generate cron schedule from UCI config
  play_slot <slot>      Play a specific schedule slot
  current               Show current playing show info
  list                  List all scheduled shows
  jingle <file>         Play a jingle file immediately

Schedule Configuration:
  Edit /etc/config/webradio and add 'schedule' sections:

  config schedule 'morning'
      option enabled '1'
      option name 'Morning Show'
      option start_time '06:00'
      option end_time '09:00'
      option days '12345'
      option playlist 'morning_mix'
      option jingle_before 'morning_intro.mp3'

Days: 0=Sunday, 1=Monday, ..., 6=Saturday
Example: '12345' = Monday-Friday

Jingles directory: $JINGLE_DIR
Playlists directory: $PLAYLIST_DIR

EOF
}

# Main
case "${1:-help}" in
	generate)
		generate_cron
		;;
	play_slot)
		play_slot "$2"
		;;
	current)
		current_show
		;;
	list)
		list_schedule
		;;
	jingle)
		play_jingle_now "$2"
		;;
	help|--help|-h)
		usage
		;;
	*)
		echo "Unknown command: $1"
		usage
		exit 1
		;;
esac
