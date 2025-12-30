# System Hub Testing Guide

Comprehensive testing suite for the diagnostic profiles feature in luci-app-system-hub.

## Test Structure

```
tests/
├── README.md                       # This file
├── test-profiles.sh                # Unit tests (shell-based)
├── MANUAL_TESTS.md                 # Manual testing checklist
├── integration/
│   └── test-diagnostic-workflow.sh # End-to-end workflow test
└── frontend/
    └── test-diagnostics-ui.js      # Browser console tests
```

## Quick Start

### Run All Tests

```bash
# On the router (via SSH)
cd /usr/share/system-hub/tests  # or wherever tests are installed
./test-profiles.sh
./integration/test-diagnostic-workflow.sh
```

### Run Individual Test Suites

See detailed instructions below for each test type.

---

## 1. Unit Tests

**File**: `test-profiles.sh`
**Type**: Shell script
**Execution**: On the router via SSH
**Duration**: ~30 seconds

### What It Tests

- Profile listing (list_diagnostic_profiles RPC)
- Profile retrieval (get_diagnostic_profile RPC)
- Profile-based diagnostic collection
- Archive filename formatting
- Profile flag overrides
- All 5 profiles individually

### Running Unit Tests

```bash
# SSH to the router
ssh root@192.168.8.205

# Navigate to tests directory
cd /usr/share/system-hub/tests  # adjust path if needed

# Run unit tests
./test-profiles.sh
```

### Expected Output

```
========================================
System Hub Diagnostic Profiles Unit Tests
========================================
Starting test run at Mon Dec 30 16:00:00 2025

TEST 1: list_diagnostic_profiles returns valid JSON
==================================================
✅ PASS: list_diagnostic_profiles returns valid JSON

TEST 2: At least 5 profiles available
======================================
✅ PASS: At least 5 profiles returned (found 5)

...

========================================
Test Results Summary
========================================
Passed: 15
Failed: 0
Total:  15

✅ All tests passed!
```

### Exit Codes

- `0`: All tests passed
- `1`: Some tests failed

---

## 2. Integration Tests

**File**: `integration/test-diagnostic-workflow.sh`
**Type**: Shell script
**Execution**: On the router via SSH
**Duration**: ~60 seconds

### What It Tests

Complete end-to-end workflow:
1. List available profiles
2. Select a specific profile
3. Collect diagnostics with profile
4. Verify archive creation
5. Verify profile name in filename
6. List diagnostics
7. Download archive (RPC)
8. Delete archive
9. Verify deletion

### Running Integration Tests

```bash
# SSH to the router
ssh root@192.168.8.205

# Navigate to integration tests
cd /usr/share/system-hub/tests/integration

# Run workflow test
./test-diagnostic-workflow.sh
```

### Expected Output

```
========================================
Diagnostic Workflow Integration Test
========================================
Testing complete workflow with performance-problems profile

STEP 1: Listing available profiles
---------------------------------------
✅ SUCCESS: Profiles listed
  - network-issues
  - performance-problems
  - security-audit
  - wifi-problems
  - full-diagnostic

STEP 2: Selecting performance-problems profile
---------------------------------------
✅ SUCCESS: Profile retrieved
  Name: performance-problems
  Label: Problèmes Performance
  Tests: disk,latency

...

========================================
✅ ALL WORKFLOW STEPS PASSED
========================================
```

---

## 3. Frontend Validation Tests

**File**: `frontend/test-diagnostics-ui.js`
**Type**: JavaScript (browser console)
**Execution**: In browser developer tools
**Duration**: ~5 seconds

### What It Tests

- Profile grid rendering
- Profile button attributes
- Profile selection highlighting
- Toggle switch updates
- Description box display
- All 5 profiles present in UI

### Running Frontend Tests

1. **Open LuCI** in your browser
2. **Navigate** to System → System Hub → Diagnostics
3. **Open Developer Tools** (F12)
4. **Switch to Console tab**
5. **Copy and paste** the entire contents of `test-diagnostics-ui.js`
6. **Run** the tests:
   ```javascript
   runAllTests()
   ```

### Expected Output

```
========================================
Diagnostic Profiles Frontend Tests
========================================
Starting tests at 4:00:00 PM

📋 TEST 1: Profile grid renders
================================
✅ PASS: Profile grid element exists
✅ PASS: At least 5 profile buttons rendered (found 5, expected at least 5)

📋 TEST 2: Profile buttons have correct attributes
===================================================
✅ PASS: Profile button has data-profile attribute
✅ PASS: Profile button contains icon span

...

========================================
Test Results Summary
========================================
Passed: 12
Failed: 0
Total:  12

✅ All tests passed!
```

---

## 4. Manual Tests

**File**: `MANUAL_TESTS.md`
**Type**: Documented checklist
**Execution**: Manual testing in LuCI
**Duration**: ~30-45 minutes

### What It Tests

- Comprehensive user workflows
- Visual appearance and styling
- Error handling
- Edge cases
- Regression testing

### Running Manual Tests

1. **Open** `MANUAL_TESTS.md`
2. **Follow** each test case step-by-step
3. **Record** results in the document
4. **Sign off** at the end

### Test Cases Included

- Test Case 1: Profile Selector Display
- Test Case 2: Network Issues Profile
- Test Case 3: Performance Problems Profile
- Test Case 4: Security Audit Profile with Anonymization
- Test Case 5: WiFi Problems Profile
- Test Case 6: Full Diagnostic Profile
- Test Case 7: Profile Override
- Test Case 8: Profile Switching
- Test Case 9: Archive Download and Deletion
- Test Case 10: Multiple Profiles in Sequence
- Regression Tests (3 additional tests)

---

## Testing Checklist

Use this checklist to ensure complete test coverage:

- [ ] Unit tests run successfully
- [ ] Integration tests run successfully
- [ ] Frontend tests run successfully
- [ ] Manual test cases completed
- [ ] All test cases passed
- [ ] Edge cases tested
- [ ] Regression tests passed
- [ ] Documentation reviewed

---

## Continuous Integration

### Automated Testing

To run tests automatically on each deployment:

```bash
# Example CI script
#!/bin/bash

echo "Running System Hub Profile Tests..."

# Deploy to test router
./deploy.sh test-router

# Run tests via SSH
ssh root@test-router "cd /usr/share/system-hub/tests && ./test-profiles.sh"
TEST_RESULT=$?

ssh root@test-router "cd /usr/share/system-hub/tests/integration && ./test-diagnostic-workflow.sh"
INTEGRATION_RESULT=$?

# Check results
if [ $TEST_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ]; then
    echo "✅ All automated tests passed"
    exit 0
else
    echo "❌ Tests failed"
    exit 1
fi
```

---

## Troubleshooting

### Unit Tests Failing

**Problem**: `ubus call` commands fail

**Solutions**:
- Verify rpcd is running: `/etc/init.d/rpcd status`
- Restart rpcd: `/etc/init.d/rpcd restart`
- Check ACL permissions are deployed
- Verify user has luci-app-system-hub ACL

### Integration Tests Failing

**Problem**: Archive creation fails

**Solutions**:
- Check `/tmp/system-hub/diagnostics/` directory exists
- Verify disk space: `df -h`
- Check system logs: `logread | grep system-hub`

### Frontend Tests Failing

**Problem**: Profile buttons not found

**Solutions**:
- Clear browser cache (Ctrl+Shift+R)
- Verify diagnostics.js is deployed
- Check browser console for JavaScript errors
- Ensure LuCI cache is cleared: `rm -rf /tmp/luci-*`

### Manual Tests Failing

**Problem**: UI doesn't match expected results

**Solutions**:
- Logout and login again (ACL refresh)
- Clear browser cache completely
- Verify all files deployed correctly
- Check browser compatibility (use latest Chrome/Firefox)

---

## Test Maintenance

### Adding New Tests

1. **Unit Tests**: Add new test functions to `test-profiles.sh`
2. **Integration Tests**: Create new script in `integration/`
3. **Frontend Tests**: Add new test functions to `test-diagnostics-ui.js`
4. **Manual Tests**: Add new test case to `MANUAL_TESTS.md`

### Updating Tests

When adding new profiles or features:
1. Update test expectations (profile count, names, etc.)
2. Add tests for new functionality
3. Run full test suite to ensure no regressions
4. Update this README if test procedures change

---

## Contributing

When contributing tests:
- Follow existing patterns and conventions
- Add comments explaining what is being tested
- Include both positive and negative test cases
- Update documentation
- Test on actual hardware before submitting

---

## Support

For questions about testing:
- Check test output for specific error messages
- Review router logs: `logread`
- Check RPC backend: `ubus call luci.system-hub list`
- Verify deployment: `opkg list-installed | grep system-hub`

---

## License

Same license as luci-app-system-hub (MIT or GPL-2.0).
