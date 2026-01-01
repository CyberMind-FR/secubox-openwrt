#!/bin/sh
# System Hub Diagnostic Profiles - Unit Tests
# Tests RPCD backend functions in isolation

. /lib/functions.sh
. /usr/share/libubox/jshn.sh

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TEST_NAME=""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Assert functions
assert_equals() {
	local expected="$1"
	local actual="$2"
	local test_name="$3"

	if [ "$expected" = "$actual" ]; then
		echo -e "${GREEN}✅ PASS${NC}: $test_name"
		TESTS_PASSED=$((TESTS_PASSED + 1))
		return 0
	else
		echo -e "${RED}❌ FAIL${NC}: $test_name"
		echo "   Expected: $expected"
		echo "   Actual:   $actual"
		TESTS_FAILED=$((TESTS_FAILED + 1))
		return 1
	fi
}

assert_contains() {
	local haystack="$1"
	local needle="$2"
	local test_name="$3"

	if echo "$haystack" | grep -q "$needle"; then
		echo -e "${GREEN}✅ PASS${NC}: $test_name"
		TESTS_PASSED=$((TESTS_PASSED + 1))
		return 0
	else
		echo -e "${RED}❌ FAIL${NC}: $test_name"
		echo "   Expected to find: $needle"
		echo "   In: $haystack"
		TESTS_FAILED=$((TESTS_FAILED + 1))
		return 1
	fi
}

assert_json_valid() {
	local json="$1"
	local test_name="$2"

	if echo "$json" | jsonfilter -e '@' >/dev/null 2>&1; then
		echo -e "${GREEN}✅ PASS${NC}: $test_name"
		TESTS_PASSED=$((TESTS_PASSED + 1))
		return 0
	else
		echo -e "${RED}❌ FAIL${NC}: $test_name"
		echo "   Invalid JSON: $json"
		TESTS_FAILED=$((TESTS_FAILED + 1))
		return 1
	fi
}

# Test 1: Profile listing returns valid JSON
test_list_profiles_json() {
	echo ""
	echo "TEST 1: list_diagnostic_profiles returns valid JSON"
	echo "=================================================="

	local result=$(ubus call luci.system-hub list_diagnostic_profiles 2>&1)

	assert_json_valid "$result" "list_diagnostic_profiles returns valid JSON"
}

# Test 2: At least 5 profiles returned
test_list_profiles_count() {
	echo ""
	echo "TEST 2: At least 5 profiles available"
	echo "======================================"

	local result=$(ubus call luci.system-hub list_diagnostic_profiles 2>&1)
	local count=$(echo "$result" | jsonfilter -e '@.profiles[*]' 2>/dev/null | wc -l)

	if [ "$count" -ge 5 ]; then
		assert_equals "5" "$count" "At least 5 profiles returned (found $count)"
	else
		assert_equals "5" "$count" "At least 5 profiles returned"
	fi
}

# Test 3: Profile names are correct
test_profile_names() {
	echo ""
	echo "TEST 3: Profile names are correct"
	echo "=================================="

	local result=$(ubus call luci.system-hub list_diagnostic_profiles 2>&1)

	assert_contains "$result" "network-issues" "Contains network-issues profile"
	assert_contains "$result" "performance-problems" "Contains performance-problems profile"
	assert_contains "$result" "security-audit" "Contains security-audit profile"
	assert_contains "$result" "wifi-problems" "Contains wifi-problems profile"
	assert_contains "$result" "full-diagnostic" "Contains full-diagnostic profile"
}

# Test 4: Get specific profile - network-issues
test_get_profile_network() {
	echo ""
	echo "TEST 4: Get network-issues profile"
	echo "==================================="

	local result=$(ubus call luci.system-hub get_diagnostic_profile '{"name":"network-issues"}' 2>&1)

	assert_json_valid "$result" "get_diagnostic_profile returns valid JSON"

	local name=$(echo "$result" | jsonfilter -e '@.name' 2>/dev/null)
	assert_equals "network-issues" "$name" "Profile name is network-issues"

	local tests=$(echo "$result" | jsonfilter -e '@.tests' 2>/dev/null)
	assert_contains "$tests" "connectivity" "Profile contains connectivity test"
	assert_contains "$tests" "dns" "Profile contains dns test"

	local include_logs=$(echo "$result" | jsonfilter -e '@.include_logs' 2>/dev/null)
	assert_equals "1" "$include_logs" "Profile includes logs"
}

# Test 5: Get specific profile - performance-problems
test_get_profile_performance() {
	echo ""
	echo "TEST 5: Get performance-problems profile"
	echo "========================================="

	local result=$(ubus call luci.system-hub get_diagnostic_profile '{"name":"performance-problems"}' 2>&1)

	local name=$(echo "$result" | jsonfilter -e '@.name' 2>/dev/null)
	assert_equals "performance-problems" "$name" "Profile name is performance-problems"

	local include_config=$(echo "$result" | jsonfilter -e '@.include_config' 2>/dev/null)
	assert_equals "0" "$include_config" "Performance profile does not include config"
}

# Test 6: Get invalid profile
test_get_profile_invalid() {
	echo ""
	echo "TEST 6: Get invalid profile returns error"
	echo "=========================================="

	local result=$(ubus call luci.system-hub get_diagnostic_profile '{"name":"invalid-profile"}' 2>&1)

	assert_json_valid "$result" "Invalid profile returns valid JSON error"
	assert_contains "$result" "error" "Response contains error field"
}

# Test 7: Collect diagnostics with profile
test_collect_with_profile() {
	echo ""
	echo "TEST 7: Collect diagnostics with profile"
	echo "========================================="

	local result=$(ubus call luci.system-hub collect_diagnostics '{"profile":"network-issues"}' 2>&1)

	assert_json_valid "$result" "collect_diagnostics with profile returns valid JSON"

	local success=$(echo "$result" | jsonfilter -e '@.success' 2>/dev/null)
	assert_equals "true" "$success" "Diagnostic collection succeeds"

	local filename=$(echo "$result" | jsonfilter -e '@.file' 2>/dev/null)
	assert_contains "$filename" "network-issues" "Archive filename contains profile name"

	# Cleanup
	if [ -n "$filename" ]; then
		rm -f "/tmp/system-hub/diagnostics/$filename"
	fi
}

# Test 8: Profile filename format
test_profile_filename_format() {
	echo ""
	echo "TEST 8: Profile filename format is correct"
	echo "==========================================="

	local result=$(ubus call luci.system-hub collect_diagnostics '{"profile":"security-audit"}' 2>&1)
	local filename=$(echo "$result" | jsonfilter -e '@.file' 2>/dev/null)

	# Format should be: diagnostics-{hostname}-{profile}-{timestamp}.tar.gz
	assert_contains "$filename" "security-audit" "Filename contains profile name"
	assert_contains "$filename" ".tar.gz" "Filename has .tar.gz extension"
	assert_contains "$filename" "diagnostics-" "Filename starts with diagnostics-"

	# Cleanup
	if [ -n "$filename" ]; then
		rm -f "/tmp/system-hub/diagnostics/$filename"
	fi
}

# Test 9: Profile overrides flags
test_profile_overrides_flags() {
	echo ""
	echo "TEST 9: Profile overrides individual flags"
	echo "==========================================="

	# Performance profile has include_config=0
	local result=$(ubus call luci.system-hub collect_diagnostics '{"profile":"performance-problems","include_config":1}' 2>&1)

	local success=$(echo "$result" | jsonfilter -e '@.success' 2>/dev/null)
	assert_equals "true" "$success" "Collection with profile override succeeds"

	local filename=$(echo "$result" | jsonfilter -e '@.file' 2>/dev/null)
	assert_contains "$filename" "performance-problems" "Filename contains profile name"

	# Cleanup
	if [ -n "$filename" ]; then
		rm -f "/tmp/system-hub/diagnostics/$filename"
	fi
}

# Test 10: All profiles can be retrieved
test_all_profiles_retrievable() {
	echo ""
	echo "TEST 10: All 5 profiles can be retrieved individually"
	echo "======================================================"

	local profiles="network-issues performance-problems security-audit wifi-problems full-diagnostic"

	for profile in $profiles; do
		local result=$(ubus call luci.system-hub get_diagnostic_profile "{\"name\":\"$profile\"}" 2>&1)
		local name=$(echo "$result" | jsonfilter -e '@.name' 2>/dev/null)
		assert_equals "$profile" "$name" "Profile $profile can be retrieved"
	done
}

# Run all tests
echo "========================================"
echo "System Hub Diagnostic Profiles Unit Tests"
echo "========================================"
echo "Starting test run at $(date)"
echo ""

test_list_profiles_json
test_list_profiles_count
test_profile_names
test_get_profile_network
test_get_profile_performance
test_get_profile_invalid
test_collect_with_profile
test_profile_filename_format
test_profile_overrides_flags
test_all_profiles_retrievable

# Summary
echo ""
echo "========================================"
echo "Test Results Summary"
echo "========================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
	echo -e "${GREEN}✅ All tests passed!${NC}"
	exit 0
else
	echo -e "${RED}❌ Some tests failed${NC}"
	exit 1
fi
