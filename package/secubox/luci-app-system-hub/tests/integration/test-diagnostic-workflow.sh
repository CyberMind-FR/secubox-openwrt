#!/bin/sh
# Integration Test: Complete diagnostic workflow with profiles
# Tests end-to-end user workflow from profile selection to archive download

. /lib/functions.sh
. /usr/share/libubox/jshn.sh

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "Diagnostic Workflow Integration Test"
echo "========================================"
echo "Testing complete workflow with performance-problems profile"
echo ""

# Step 1: List available profiles
echo -e "${YELLOW}STEP 1:${NC} Listing available profiles"
echo "---------------------------------------"

profiles=$(ubus call luci.system-hub list_diagnostic_profiles 2>&1)
if [ $? -ne 0 ]; then
	echo -e "${RED}❌ FAILED${NC}: Could not list profiles"
	echo "$profiles"
	exit 1
fi

echo -e "${GREEN}✅ SUCCESS${NC}: Profiles listed"
echo "$profiles" | jsonfilter -e '@.profiles[*].name' | sed 's/^/  - /'
echo ""

# Step 2: Select performance-problems profile
echo -e "${YELLOW}STEP 2:${NC} Selecting performance-problems profile"
echo "---------------------------------------"

profile=$(ubus call luci.system-hub get_diagnostic_profile '{"name":"performance-problems"}' 2>&1)
if [ $? -ne 0 ]; then
	echo -e "${RED}❌ FAILED${NC}: Could not get profile"
	echo "$profile"
	exit 1
fi

echo -e "${GREEN}✅ SUCCESS${NC}: Profile retrieved"
echo "  Name: $(echo "$profile" | jsonfilter -e '@.name')"
echo "  Label: $(echo "$profile" | jsonfilter -e '@.label')"
echo "  Tests: $(echo "$profile" | jsonfilter -e '@.tests')"
echo ""

# Step 3: Collect diagnostics using profile
echo -e "${YELLOW}STEP 3:${NC} Collecting diagnostics with profile"
echo "---------------------------------------"

archive=$(ubus call luci.system-hub collect_diagnostics '{"profile":"performance-problems"}' 2>&1)
if [ $? -ne 0 ]; then
	echo -e "${RED}❌ FAILED${NC}: Could not collect diagnostics"
	echo "$archive"
	exit 1
fi

success=$(echo "$archive" | jsonfilter -e '@.success')
if [ "$success" != "true" ]; then
	echo -e "${RED}❌ FAILED${NC}: Collection reported failure"
	echo "$archive"
	exit 1
fi

filename=$(echo "$archive" | jsonfilter -e '@.file')
size=$(echo "$archive" | jsonfilter -e '@.size')

echo -e "${GREEN}✅ SUCCESS${NC}: Archive created"
echo "  Filename: $filename"
echo "  Size: $size bytes"
echo ""

# Step 4: Verify archive exists
echo -e "${YELLOW}STEP 4:${NC} Verifying archive exists on filesystem"
echo "---------------------------------------"

archive_path="/tmp/system-hub/diagnostics/$filename"
if [ ! -f "$archive_path" ]; then
	echo -e "${RED}❌ FAILED${NC}: Archive file not found at $archive_path"
	exit 1
fi

echo -e "${GREEN}✅ SUCCESS${NC}: Archive file exists"
ls -lh "$archive_path" | awk '{print "  Size: " $5 "  Modified: " $6 " " $7 " " $8}'
echo ""

# Step 5: Verify archive contains profile name
echo -e "${YELLOW}STEP 5:${NC} Verifying profile name in filename"
echo "---------------------------------------"

if echo "$filename" | grep -q "performance-problems"; then
	echo -e "${GREEN}✅ SUCCESS${NC}: Filename contains profile name"
	echo "  $filename"
else
	echo -e "${RED}❌ FAILED${NC}: Profile name not in filename"
	echo "  Expected: performance-problems"
	echo "  Found: $filename"
	exit 1
fi
echo ""

# Step 6: List diagnostics to verify it appears
echo -e "${YELLOW}STEP 6:${NC} Listing diagnostics archives"
echo "---------------------------------------"

diagnostics=$(ubus call luci.system-hub list_diagnostics 2>&1)
if [ $? -ne 0 ]; then
	echo -e "${RED}❌ FAILED${NC}: Could not list diagnostics"
	echo "$diagnostics"
	rm -f "$archive_path"
	exit 1
fi

if echo "$diagnostics" | grep -q "$filename"; then
	echo -e "${GREEN}✅ SUCCESS${NC}: Archive appears in diagnostics list"
	echo "$diagnostics" | jsonfilter -e '@.archives[*].name' | grep "$filename" | sed 's/^/  - /'
else
	echo -e "${RED}❌ FAILED${NC}: Archive not in diagnostics list"
	rm -f "$archive_path"
	exit 1
fi
echo ""

# Step 7: Download archive (simulate)
echo -e "${YELLOW}STEP 7:${NC} Downloading archive (verifying RPC)"
echo "---------------------------------------"

download=$(ubus call luci.system-hub download_diagnostic "{\"name\":\"$filename\"}" 2>&1)
if [ $? -ne 0 ]; then
	echo -e "${RED}❌ FAILED${NC}: Could not download archive"
	echo "$download"
	rm -f "$archive_path"
	exit 1
fi

download_success=$(echo "$download" | jsonfilter -e '@.success')
if [ "$download_success" != "true" ]; then
	echo -e "${RED}❌ FAILED${NC}: Download reported failure"
	rm -f "$archive_path"
	exit 1
fi

echo -e "${GREEN}✅ SUCCESS${NC}: Download RPC successful"
echo "  (Archive data would be base64 encoded for browser download)"
echo ""

# Step 8: Delete archive
echo -e "${YELLOW}STEP 8:${NC} Deleting archive"
echo "---------------------------------------"

delete=$(ubus call luci.system-hub delete_diagnostic "{\"name\":\"$filename\"}" 2>&1)
if [ $? -ne 0 ]; then
	echo -e "${RED}❌ FAILED${NC}: Could not delete archive"
	echo "$delete"
	rm -f "$archive_path"
	exit 1
fi

delete_success=$(echo "$delete" | jsonfilter -e '@.success')
if [ "$delete_success" != "true" ]; then
	echo -e "${RED}❌ FAILED${NC}: Delete reported failure"
	rm -f "$archive_path"
	exit 1
fi

echo -e "${GREEN}✅ SUCCESS${NC}: Archive deleted"
echo ""

# Step 9: Verify deletion
echo -e "${YELLOW}STEP 9:${NC} Verifying archive was deleted"
echo "---------------------------------------"

if [ -f "$archive_path" ]; then
	echo -e "${RED}❌ FAILED${NC}: Archive file still exists after deletion"
	rm -f "$archive_path"
	exit 1
fi

echo -e "${GREEN}✅ SUCCESS${NC}: Archive file removed from filesystem"
echo ""

# Final summary
echo "========================================"
echo -e "${GREEN}✅ ALL WORKFLOW STEPS PASSED${NC}"
echo "========================================"
echo "Successfully tested complete diagnostic workflow:"
echo "  1. List profiles"
echo "  2. Get specific profile"
echo "  3. Collect diagnostics with profile"
echo "  4. Verify archive creation"
echo "  5. Verify profile name in filename"
echo "  6. List diagnostics"
echo "  7. Download archive (RPC)"
echo "  8. Delete archive"
echo "  9. Verify deletion"
echo ""

exit 0
