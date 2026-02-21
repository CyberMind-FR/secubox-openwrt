#!/bin/sh
# Lyrion to Icecast Bridge - FFmpeg Audio Pipeline
# Reads PCM from Squeezelite FIFO and streams to Icecast

LOG_FILE="/var/log/lyrion-bridge.log"

log() {
	echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
	logger -t lyrion-bridge "$1"
}

uci_get() { uci -q get "lyrion-bridge.$1" 2>/dev/null || echo "$2"; }

# Load configuration
INPUT_FIFO=$(uci_get audio.input_fifo "/tmp/squeezelite.pcm")
SAMPLE_RATE=$(uci_get audio.sample_rate "44100")
CHANNELS=$(uci_get audio.channels "2")
FORMAT=$(uci_get audio.format "s16le")

ICECAST_HOST=$(uci_get icecast.host "127.0.0.1")
ICECAST_PORT=$(uci_get icecast.port "8000")
ICECAST_MOUNT=$(uci_get icecast.mount "/lyrion")
ICECAST_PASS=$(uci_get icecast.password "hackme")
BITRATE=$(uci_get icecast.bitrate "192")
STREAM_NAME=$(uci_get icecast.name "Lyrion Stream")
STREAM_DESC=$(uci_get icecast.description "Streaming from Lyrion Music Server")
STREAM_GENRE=$(uci_get icecast.genre "Various")

METADATA_SYNC=$(uci_get metadata.sync_enabled "1")
METADATA_INTERVAL=$(uci_get metadata.sync_interval "5")

log "Starting Lyrion to Icecast bridge..."
log "Input: $INPUT_FIFO (PCM $FORMAT, ${SAMPLE_RATE}Hz, ${CHANNELS}ch)"
log "Output: icecast://${ICECAST_HOST}:${ICECAST_PORT}${ICECAST_MOUNT} (MP3 ${BITRATE}kbps)"

# Ensure FIFO exists
if [ ! -p "$INPUT_FIFO" ]; then
	log "Creating FIFO: $INPUT_FIFO"
	mkfifo "$INPUT_FIFO"
fi

# Wait for Squeezelite to start writing to FIFO
log "Waiting for audio input..."
while [ ! -s "$INPUT_FIFO" ] && [ -p "$INPUT_FIFO" ]; do
	sleep 1
done

# Build Icecast URL
ICECAST_URL="icecast://source:${ICECAST_PASS}@${ICECAST_HOST}:${ICECAST_PORT}${ICECAST_MOUNT}"

# Metadata update function (background process)
update_metadata() {
	local lyrion_host=$(uci_get main.lyrion_server "127.0.0.1")
	local lyrion_port=$(uci_get main.lyrion_port "9000")

	while true; do
		# Query Lyrion for current track info
		local status=$(curl -s "http://${lyrion_host}:${lyrion_port}/jsonrpc.js" \
			-d '{"id":1,"method":"slim.request","params":["",["status","-",1,"tags:adl"]]}' 2>/dev/null)

		if [ -n "$status" ]; then
			local title=$(echo "$status" | jsonfilter -e '@.result.playlist_loop[0].title' 2>/dev/null)
			local artist=$(echo "$status" | jsonfilter -e '@.result.playlist_loop[0].artist' 2>/dev/null)
			local album=$(echo "$status" | jsonfilter -e '@.result.playlist_loop[0].album' 2>/dev/null)

			if [ -n "$title" ]; then
				local metadata="${artist:+$artist - }${title}"
				# Update Icecast metadata via admin API
				curl -s "http://admin:$(uci -q get webradio.main.admin_password)@${ICECAST_HOST}:${ICECAST_PORT}/admin/metadata?mount=${ICECAST_MOUNT}&mode=updinfo&song=$(echo "$metadata" | sed 's/ /%20/g')" >/dev/null 2>&1
			fi
		fi

		sleep "$METADATA_INTERVAL"
	done
}

# Start metadata sync in background
if [ "$METADATA_SYNC" = "1" ]; then
	update_metadata &
	METADATA_PID=$!
	log "Metadata sync started (PID: $METADATA_PID)"
fi

# Cleanup on exit
cleanup() {
	log "Stopping bridge..."
	[ -n "$METADATA_PID" ] && kill $METADATA_PID 2>/dev/null
	[ -n "$FFMPEG_PID" ] && kill $FFMPEG_PID 2>/dev/null
	exit 0
}
trap cleanup INT TERM

# Main streaming loop
while true; do
	log "Starting FFmpeg stream..."

	ffmpeg -re \
		-f $FORMAT -ar $SAMPLE_RATE -ac $CHANNELS \
		-i "$INPUT_FIFO" \
		-acodec libmp3lame -ab ${BITRATE}k -ar $SAMPLE_RATE -ac $CHANNELS \
		-f mp3 \
		-content_type audio/mpeg \
		"$ICECAST_URL" \
		2>> "$LOG_FILE" &

	FFMPEG_PID=$!
	log "FFmpeg started (PID: $FFMPEG_PID)"

	# Wait for FFmpeg to exit
	wait $FFMPEG_PID
	EXIT_CODE=$?

	log "FFmpeg exited with code $EXIT_CODE"

	# If exited normally (0 or 255), it means stream ended - wait and retry
	if [ $EXIT_CODE -eq 0 ] || [ $EXIT_CODE -eq 255 ]; then
		log "Stream ended, waiting for new audio..."
		sleep 2
	else
		# Error - wait longer before retry
		log "Stream error, retrying in 5 seconds..."
		sleep 5
	fi
done
