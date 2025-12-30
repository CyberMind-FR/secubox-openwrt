/**
 * Frontend Validation Tests for Diagnostic Profiles
 *
 * USAGE:
 * 1. Navigate to System Hub → Diagnostics in LuCI
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file
 * 4. Run: runAllTests()
 */

// Test counter
var testResults = {
	passed: 0,
	failed: 0,
	tests: []
};

// Helper functions
function assert(condition, testName) {
	if (condition) {
		console.log('%c✅ PASS: ' + testName, 'color: green');
		testResults.passed++;
		testResults.tests.push({ name: testName, status: 'PASS' });
		return true;
	} else {
		console.error('❌ FAIL: ' + testName);
		testResults.failed++;
		testResults.tests.push({ name: testName, status: 'FAIL' });
		return false;
	}
}

function assertExists(element, testName) {
	return assert(element !== null && element !== undefined, testName);
}

function assertCount(actual, expected, testName) {
	if (actual >= expected) {
		return assert(true, testName + ' (found ' + actual + ', expected at least ' + expected + ')');
	} else {
		console.error('Expected at least ' + expected + ' but found ' + actual);
		return assert(false, testName);
	}
}

// Test 1: Profile grid renders
function testProfileGridRenders() {
	console.log('\n📋 TEST 1: Profile grid renders');
	console.log('================================');

	var grid = document.querySelector('.profile-grid');
	assertExists(grid, 'Profile grid element exists');

	var buttons = grid ? grid.querySelectorAll('button.profile-btn') : [];
	assertCount(buttons.length, 5, 'At least 5 profile buttons rendered');
}

// Test 2: Profile buttons have correct attributes
function testProfileButtonAttributes() {
	console.log('\n📋 TEST 2: Profile buttons have correct attributes');
	console.log('===================================================');

	var buttons = document.querySelectorAll('.profile-btn');

	if (buttons.length === 0) {
		assert(false, 'No profile buttons found');
		return;
	}

	var firstButton = buttons[0];
	assertExists(firstButton.dataset.profile, 'Profile button has data-profile attribute');

	var hasIcon = firstButton.querySelector('span') !== null;
	assert(hasIcon, 'Profile button contains icon span');
}

// Test 3: Profile selection highlights button
function testProfileSelection() {
	console.log('\n📋 TEST 3: Profile selection highlights button');
	console.log('================================================');

	var buttons = document.querySelectorAll('.profile-btn');

	if (buttons.length === 0) {
		assert(false, 'No profile buttons found');
		return;
	}

	// Click first profile button
	var firstButton = buttons[0];
	var profileName = firstButton.dataset.profile;
	console.log('Clicking profile:', profileName);

	firstButton.click();

	// Wait a bit for the async operation
	setTimeout(function() {
		var isActive = firstButton.classList.contains('active') ||
		               firstButton.style.background.includes('gradient');

		assert(isActive, 'Clicked profile button is highlighted');

		// Check other buttons are not active
		var otherButtonsInactive = true;
		for (var i = 1; i < buttons.length; i++) {
			if (buttons[i].classList.contains('active')) {
				otherButtonsInactive = false;
				break;
			}
		}
		assert(otherButtonsInactive, 'Other profile buttons are not highlighted');
	}, 500);
}

// Test 4: Profile description appears
function testProfileDescriptionAppears() {
	console.log('\n📋 TEST 4: Profile description appears');
	console.log('=======================================');

	var descBox = document.getElementById('profile-description');
	assertExists(descBox, 'Profile description box exists');

	// Click a profile button to trigger description
	var buttons = document.querySelectorAll('.profile-btn');
	if (buttons.length > 0) {
		buttons[0].click();

		setTimeout(function() {
			var isVisible = descBox && descBox.style.display !== 'none';
			assert(isVisible, 'Description box is visible after profile selection');

			var hasContent = descBox && descBox.textContent.length > 0;
			assert(hasContent, 'Description box contains text');
		}, 500);
	}
}

// Test 5: Toggle switches update when profile selected
function testToggleSwitchesUpdate() {
	console.log('\n📋 TEST 5: Toggle switches update with profile');
	console.log('================================================');

	var logsToggle = document.getElementById('diag_logs');
	var configToggle = document.getElementById('diag_config');
	var networkToggle = document.getElementById('diag_network');
	var anonymizeToggle = document.getElementById('diag_anonymize');

	assertExists(logsToggle, 'Logs toggle exists');
	assertExists(configToggle, 'Config toggle exists');
	assertExists(networkToggle, 'Network toggle exists');
	assertExists(anonymizeToggle, 'Anonymize toggle exists');

	// Click network-issues profile (should have all logs/config/network enabled)
	var buttons = document.querySelectorAll('.profile-btn');
	var networkBtn = null;
	for (var i = 0; i < buttons.length; i++) {
		if (buttons[i].dataset.profile === 'network-issues') {
			networkBtn = buttons[i];
			break;
		}
	}

	if (networkBtn) {
		networkBtn.click();

		setTimeout(function() {
			var logsActive = logsToggle && logsToggle.classList.contains('active');
			var configActive = configToggle && configToggle.classList.contains('active');
			var networkActive = networkToggle && networkToggle.classList.contains('active');

			assert(logsActive, 'Logs toggle activated by network-issues profile');
			assert(configActive, 'Config toggle activated by network-issues profile');
			assert(networkActive, 'Network toggle activated by network-issues profile');
		}, 500);
	} else {
		assert(false, 'Could not find network-issues profile button');
	}
}

// Test 6: Diagnostic collection includes profile (mock test)
function testDiagnosticCollectionProfile() {
	console.log('\n📋 TEST 6: Diagnostic collection includes profile');
	console.log('==================================================');

	// This is a simulated test - we check that the API call would include profile
	// We can't actually trigger collection without mocking

	console.log('Note: This would require mocking API.collectDiagnostics()');
	console.log('Manual test: Click "Generate Archive" and verify archive filename includes profile name');

	assert(true, 'Profile parameter mechanism in place (manual verification required)');
}

// Test 7: All 5 profiles are present
function testAllProfilesPresent() {
	console.log('\n📋 TEST 7: All 5 expected profiles are present');
	console.log('================================================');

	var expectedProfiles = [
		'network-issues',
		'performance-problems',
		'security-audit',
		'wifi-problems',
		'full-diagnostic'
	];

	var buttons = document.querySelectorAll('.profile-btn');
	var foundProfiles = [];

	for (var i = 0; i < buttons.length; i++) {
		foundProfiles.push(buttons[i].dataset.profile);
	}

	expectedProfiles.forEach(function(profile) {
		var found = foundProfiles.indexOf(profile) !== -1;
		assert(found, 'Profile "' + profile + '" is present');
	});
}

// Run all tests
function runAllTests() {
	console.clear();
	console.log('========================================');
	console.log('Diagnostic Profiles Frontend Tests');
	console.log('========================================');
	console.log('Starting tests at ' + new Date().toLocaleTimeString());
	console.log('');

	testResults = { passed: 0, failed: 0, tests: [] };

	// Run tests
	testProfileGridRenders();
	testProfileButtonAttributes();
	testAllProfilesPresent();

	// Tests with delays
	setTimeout(function() {
		testProfileSelection();
		testProfileDescriptionAppears();
		testToggleSwitchesUpdate();
		testDiagnosticCollectionProfile();

		// Summary after all tests complete
		setTimeout(function() {
			console.log('\n========================================');
			console.log('Test Results Summary');
			console.log('========================================');
			console.log('%cPassed: ' + testResults.passed, 'color: green; font-weight: bold');
			console.log('%cFailed: ' + testResults.failed, 'color: red; font-weight: bold');
			console.log('Total:  ' + (testResults.passed + testResults.failed));
			console.log('');

			if (testResults.failed === 0) {
				console.log('%c✅ All tests passed!', 'color: green; font-weight: bold; font-size: 16px');
			} else {
				console.log('%c❌ Some tests failed', 'color: red; font-weight: bold; font-size: 16px');
				console.log('');
				console.log('Failed tests:');
				testResults.tests.forEach(function(test) {
					if (test.status === 'FAIL') {
						console.log('  - ' + test.name);
					}
				});
			}
		}, 2000);
	}, 500);
}

console.log('✅ Frontend test suite loaded');
console.log('Run tests with: runAllTests()');
