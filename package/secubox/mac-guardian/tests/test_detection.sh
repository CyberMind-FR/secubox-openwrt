#!/bin/sh
# TAP test suite for mac-guardian detection logic
# Run: sh tests/test_detection.sh

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEST_TMPDIR=$(mktemp -d)
trap 'rm -rf "$TEST_TMPDIR"' EXIT

# Override paths for testing
MG_RUNDIR="$TEST_TMPDIR/run"
MG_DBFILE="$MG_RUNDIR/known.db"
MG_LOCKDIR="$MG_RUNDIR/lock"
MG_LOGFILE="$TEST_TMPDIR/mac-guardian.log"
MG_EVENTS_LOG="$TEST_TMPDIR/mac-guardian.log"
MG_OUI_FILE="$SCRIPT_DIR/files/usr/lib/secubox/mac-guardian/oui.tsv"
MG_STATS_FILE="$TEST_TMPDIR/stats.json"
MG_MAX_LOG_SIZE=524288

mkdir -p "$MG_RUNDIR"
touch "$MG_DBFILE"
touch "$MG_EVENTS_LOG"

# Stub logger and UCI
logger() { :; }
config_load() { :; }
config_get() {
	local var="$1" section="$2" option="$3" default="$4"
	eval "$var=\"\${$var:-$default}\""
}
config_list_foreach() { :; }

# Source functions
. "$SCRIPT_DIR/files/usr/lib/secubox/mac-guardian/functions.sh"

# Re-apply path overrides (sourcing functions.sh resets them)
MG_RUNDIR="$TEST_TMPDIR/run"
MG_DBFILE="$MG_RUNDIR/known.db"
MG_LOCKDIR="$MG_RUNDIR/lock"
MG_LOGFILE="$TEST_TMPDIR/mac-guardian.log"
MG_EVENTS_LOG="$TEST_TMPDIR/mac-guardian.log"
MG_OUI_FILE="$SCRIPT_DIR/files/usr/lib/secubox/mac-guardian/oui.tsv"
MG_STATS_FILE="$TEST_TMPDIR/stats.json"
MG_MAX_LOG_SIZE=524288

# Reset config
MG_ENABLED=1
MG_DEBUG=0
MG_DETECT_RANDOM=1
MG_DETECT_OUI_DUP=1
MG_OUI_DUP_THRESHOLD=3
MG_DETECT_FLIP=1
MG_FLIP_WINDOW=300
MG_FLIP_THRESHOLD=3
MG_DETECT_SPOOF=1
MG_POLICY="alert"
MG_NOTIFY_CROWDSEC=0
MG_WL_MACS=""
MG_WL_OUIS=""
MG_START_TIME=$(date +%s)
MG_TOTAL_SCANS=0
MG_TOTAL_ALERTS=0

# --- TAP output ---
TESTS=0
PASS=0
FAIL=0

ok() {
	TESTS=$((TESTS + 1))
	PASS=$((PASS + 1))
	echo "ok $TESTS - $1"
}

not_ok() {
	TESTS=$((TESTS + 1))
	FAIL=$((FAIL + 1))
	echo "not ok $TESTS - $1"
}

echo "TAP version 13"
echo "1..8"

# --- Test 1: Randomized MAC generates alert ---
: > "$MG_EVENTS_LOG"
: > "$MG_DBFILE"
mg_check_station "02:aa:bb:cc:dd:ee" "-65" "wlan0"
if grep -q "randomized_mac" "$MG_EVENTS_LOG"; then
	ok "Randomized MAC (02:xx) triggers alert"
else
	not_ok "Randomized MAC (02:xx) triggers alert"
fi

# --- Test 2: Non-randomized MAC does NOT generate randomized alert ---
: > "$MG_EVENTS_LOG"
: > "$MG_DBFILE"
mg_check_station "00:11:22:33:44:55" "-60" "wlan0"
if grep -q "randomized_mac" "$MG_EVENTS_LOG"; then
	not_ok "Non-randomized MAC (00:xx) does not trigger randomized alert"
else
	ok "Non-randomized MAC (00:xx) does not trigger randomized alert"
fi

# --- Test 3: New station event logged ---
: > "$MG_EVENTS_LOG"
: > "$MG_DBFILE"
mg_check_station "00:aa:bb:cc:dd:01" "-55" "wlan0"
if grep -q "new_station" "$MG_EVENTS_LOG"; then
	ok "New station event logged for unknown MAC"
else
	not_ok "New station event logged for unknown MAC"
fi

# --- Test 4: OUI anomaly detection ---
: > "$MG_EVENTS_LOG"
: > "$MG_DBFILE"
now=$(date +%s)
# Seed database with 4 MACs sharing same OUI on wlan0 (threshold is 3)
echo "aa:bb:cc:00:00:01|AA:BB:CC|$now|$now|wlan0|host1|unknown" >> "$MG_DBFILE"
echo "aa:bb:cc:00:00:02|AA:BB:CC|$now|$now|wlan0|host2|unknown" >> "$MG_DBFILE"
echo "aa:bb:cc:00:00:03|AA:BB:CC|$now|$now|wlan0|host3|unknown" >> "$MG_DBFILE"
echo "aa:bb:cc:00:00:04|AA:BB:CC|$now|$now|wlan0|host4|unknown" >> "$MG_DBFILE"
mg_detect_oui_anomaly "wlan0"
if grep -q "oui_anomaly" "$MG_EVENTS_LOG"; then
	ok "OUI anomaly triggered when count exceeds threshold"
else
	not_ok "OUI anomaly triggered when count exceeds threshold"
fi

# --- Test 5: OUI anomaly NOT triggered below threshold ---
: > "$MG_EVENTS_LOG"
: > "$MG_DBFILE"
echo "aa:bb:cc:00:00:01|AA:BB:CC|$now|$now|wlan0|host1|unknown" >> "$MG_DBFILE"
echo "aa:bb:cc:00:00:02|AA:BB:CC|$now|$now|wlan0|host2|unknown" >> "$MG_DBFILE"
mg_detect_oui_anomaly "wlan0"
if grep -q "oui_anomaly" "$MG_EVENTS_LOG"; then
	not_ok "OUI anomaly not triggered below threshold"
else
	ok "OUI anomaly not triggered below threshold"
fi

# --- Test 6: MAC flood detection ---
: > "$MG_EVENTS_LOG"
: > "$MG_DBFILE"
now=$(date +%s)
# Seed with many recent MACs (threshold is 3)
echo "00:11:22:33:44:01|00:11:22|$now|$now|wlan0||unknown" >> "$MG_DBFILE"
echo "00:11:22:33:44:02|00:11:22|$now|$now|wlan0||unknown" >> "$MG_DBFILE"
echo "00:11:22:33:44:03|00:11:22|$now|$now|wlan0||unknown" >> "$MG_DBFILE"
echo "00:11:22:33:44:04|00:11:22|$now|$now|wlan0||unknown" >> "$MG_DBFILE"
mg_detect_mac_flip "wlan0"
if grep -q "mac_flood" "$MG_EVENTS_LOG"; then
	ok "MAC flood detected when new MACs exceed threshold in window"
else
	not_ok "MAC flood detected when new MACs exceed threshold in window"
fi

# --- Test 7: Spoof detection (interface change) ---
: > "$MG_EVENTS_LOG"
: > "$MG_DBFILE"
now=$(date +%s)
# Seed a MAC on wlan0
echo "00:aa:bb:cc:dd:99|00:AA:BB|$((now - 60))|$((now - 10))|wlan0|testhost|unknown" >> "$MG_DBFILE"
# Check same MAC on wlan1 -> should trigger spoof
mg_check_station "00:aa:bb:cc:dd:99" "-70" "wlan1"
if grep -q "spoof_detected" "$MG_EVENTS_LOG"; then
	ok "Spoof detected when MAC appears on different interface"
else
	not_ok "Spoof detected when MAC appears on different interface"
fi

# --- Test 8: Stats generation ---
: > "$MG_DBFILE"
echo "aa:bb:cc:00:00:01|AA:BB:CC|$now|$now|wlan0|host1|trusted" >> "$MG_DBFILE"
echo "aa:bb:cc:00:00:02|AA:BB:CC|$now|$now|wlan0|host2|suspect" >> "$MG_DBFILE"
echo "aa:bb:cc:00:00:03|AA:BB:CC|$now|$now|wlan0|host3|unknown" >> "$MG_DBFILE"
mg_stats_generate
if [ -f "$MG_STATS_FILE" ] && grep -q '"trusted":1' "$MG_STATS_FILE"; then
	ok "Stats generation produces valid JSON with correct counts"
else
	not_ok "Stats generation produces valid JSON with correct counts"
fi

# --- Summary ---
echo ""
echo "# Tests: $TESTS, Passed: $PASS, Failed: $FAIL"
if [ "$FAIL" -gt 0 ]; then
	exit 1
fi
exit 0
