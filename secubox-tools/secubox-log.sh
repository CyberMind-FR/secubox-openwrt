#!/bin/sh
#
# SecuBox Log Aggregator / Logger
# Usage:
#   secubox-log.sh --tag netdata --message "Netdata started"
#   secubox-log.sh --snapshot            # append dmesg + logread snapshot
#   secubox-log.sh --tail 100            # print last 100 lines
#

LOG_FILE="/var/log/seccubox.log"
TAG="secubox"
MESSAGE=""
PAYLOAD=""
TAIL_COUNT=""
MODE="append"

ensure_log() {
	local dir
	dir="$(dirname "$LOG_FILE")"
	[ -d "$dir" ] || mkdir -p "$dir"
	touch "$LOG_FILE"
}

write_entry() {
	ensure_log
	printf '%s [%s] %s\n' "$(date -Iseconds)" "$TAG" "$MESSAGE" >> "$LOG_FILE"
	[ -n "$PAYLOAD" ] && printf '%s\n' "$PAYLOAD" >> "$LOG_FILE"
}

write_snapshot() {
	ensure_log
	{
		printf '===== SNAPSHOT %s =====\n' "$(date -Iseconds)"
		printf '--- DMESG (tail -n 200) ---\n'
		dmesg | tail -n 200
		printf '--- LOGREAD (tail -n 200) ---\n'
		logread 2>/dev/null | tail -n 200
		printf '===== END SNAPSHOT =====\n'
	} >> "$LOG_FILE"
}

tail_log() {
	ensure_log
	if [ -n "$TAIL_COUNT" ]; then
		tail -n "$TAIL_COUNT" "$LOG_FILE"
	else
		tail "$LOG_FILE"
	fi
}

while [ $# -gt 0 ]; do
	case "$1" in
		--tag)
			TAG="$2"; shift 2;;
		--message|-m)
			MESSAGE="$2"; shift 2;;
		--payload|-p)
			PAYLOAD="$2"; shift 2;;
		--snapshot)
			MODE="snapshot"; shift;;
		--tail)
			MODE="tail"; TAIL_COUNT="$2"; shift 2;;
		--tail-all)
			MODE="tail"; TAIL_COUNT=""; shift;;
		-h|--help)
			cat <<'EOF'
secubox-log.sh --tag TAG --message MSG [--payload TEXT]
secubox-log.sh --snapshot            # append dmesg+logread snapshot
secubox-log.sh --tail [N]           # print last N lines (default 10)
EOF
			exit 0;;
		*)
			shift;;
	esac
done

case "$MODE" in
	snapshot)
		write_snapshot
		;;
	tail)
		tail_log
		;;
	*)
		if [ -z "$MESSAGE" ]; then
			echo "Usage: $0 --message 'text' [--tag tag]" >&2
			exit 1
		fi
		write_entry
		;;
esac
