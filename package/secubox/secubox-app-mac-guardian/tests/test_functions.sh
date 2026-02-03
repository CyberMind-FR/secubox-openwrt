#!/bin/sh
# TAP test suite for mac-guardian functions
# Run: sh tests/test_functions.sh

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

# Stub logger for test environment
logger() { :; }

# Stub UCI functions for testing
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

# Reset config defaults for tests
MG_ENABLED=1
MG_DEBUG=0
MG_DETECT_RANDOM=1
MG_DETECT_OUI_DUP=1
MG_OUI_DUP_THRESHOLD=5
MG_DETECT_FLIP=1
MG_FLIP_WINDOW=300
MG_FLIP_THRESHOLD=10
MG_DETECT_SPOOF=1
MG_POLICY="alert"
MG_NOTIFY_CROWDSEC=0
MG_WL_MACS=""
MG_WL_OUIS=""

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

assert_true() {
	if eval "$1"; then
		ok "$2"
	else
		not_ok "$2"
	fi
}

assert_false() {
	if eval "$1"; then
		not_ok "$2"
	else
		ok "$2"
	fi
}

assert_eq() {
	if [ "$1" = "$2" ]; then
		ok "$3"
	else
		not_ok "$3 (got '$1', expected '$2')"
	fi
}

echo "TAP version 13"
echo "1..19"

# --- Test mg_is_randomized ---
assert_true  'mg_is_randomized "02:11:22:33:44:55"' "mg_is_randomized: 02:xx is randomized"
assert_false 'mg_is_randomized "00:11:22:33:44:55"' "mg_is_randomized: 00:xx is not randomized"
assert_true  'mg_is_randomized "da:11:22:33:44:55"' "mg_is_randomized: da:xx is randomized (bit1 set)"
assert_false 'mg_is_randomized "dc:11:22:33:44:55"' "mg_is_randomized: dc:xx is not randomized (bit1 clear)"
assert_true  'mg_is_randomized "fe:11:22:33:44:55"' "mg_is_randomized: fe:xx is randomized"
assert_false 'mg_is_randomized "fc:11:22:33:44:55"' "mg_is_randomized: fc:xx is not randomized"

# --- Test mg_validate_mac ---
assert_true  'mg_validate_mac "aa:bb:cc:dd:ee:ff"' "mg_validate_mac: valid lowercase MAC"
assert_true  'mg_validate_mac "AA:BB:CC:DD:EE:FF"' "mg_validate_mac: valid uppercase MAC"
assert_false 'mg_validate_mac "aa:bb:cc:dd:ee"'    "mg_validate_mac: short MAC rejected"
assert_false 'mg_validate_mac "aabbccddeeff"'       "mg_validate_mac: no colons rejected"
assert_false 'mg_validate_mac "gg:hh:ii:jj:kk:ll"' "mg_validate_mac: hex overflow rejected"

# --- Test mg_get_oui ---
result=$(mg_get_oui "aa:bb:cc:dd:ee:ff")
assert_eq "$result" "AA:BB:CC" "mg_get_oui: extracts first 3 octets uppercase"

# --- Test mg_db_upsert + mg_db_lookup ---

# Insert new entry
mg_db_upsert "aa:bb:cc:11:22:33" "wlan0" "test-host"
entry=$(mg_db_lookup "aa:bb:cc:11:22:33")
assert_true '[ -n "$entry" ]' "mg_db_upsert: inserts new entry"

# Update existing (no duplicate)
mg_db_upsert "aa:bb:cc:11:22:33" "wlan0" "test-host-updated"
count=$(grep -c "aa:bb:cc:11:22:33" "$MG_DBFILE")
assert_eq "$count" "1" "mg_db_upsert: update does not create duplicate"

# Lookup missing
missing=$(mg_db_lookup "ff:ff:ff:ff:ff:ff")
assert_true '[ -z "$missing" ]' "mg_db_lookup: missing MAC returns empty"

# --- Test mg_is_whitelisted ---
MG_WL_MACS="aa:bb:cc:11:22:33"
assert_true  'mg_is_whitelisted "aa:bb:cc:11:22:33"' "mg_is_whitelisted: whitelisted MAC matches"
assert_false 'mg_is_whitelisted "ff:ee:dd:cc:bb:aa"' "mg_is_whitelisted: non-whitelisted MAC rejected"
MG_WL_MACS=""

# --- Test lock acquire/release ---
mg_lock
assert_true '[ -d "$MG_LOCKDIR" ]' "mg_lock: lock directory created"
mg_unlock
assert_false '[ -d "$MG_LOCKDIR" ]' "mg_unlock: lock directory removed"

# --- Summary ---
echo ""
echo "# Tests: $TESTS, Passed: $PASS, Failed: $FAIL"
if [ "$FAIL" -gt 0 ]; then
	exit 1
fi
exit 0
