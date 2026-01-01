# Manual Test Procedure - Diagnostic Profiles

## Test Environment Setup

- **Router**: OpenWrt with luci-app-system-hub installed
- **Access**: LuCI web interface
- **Browser**: Chrome, Firefox, or Edge (latest version)
- **Prerequisites**: Admin access to the router

---

## Test Case 1: Profile Selector Display

**Objective**: Verify that the profile selector card displays correctly with all 5 profiles

**Steps**:
1. Login to LuCI web interface
2. Navigate to **System → System Hub → Diagnostics**
3. Observe the "Profils de Diagnostic" card at the top

**Expected Results**:
- ✅ Profile selector card is visible
- ✅ 5 profile buttons are displayed in a grid layout
- ✅ Each button shows an icon and label:
  - 🌐 Problèmes Réseau
  - ⚡ Problèmes Performance
  - 🔐 Audit Sécurité
  - 📶 Problèmes WiFi
  - 📋 Diagnostic Complet
- ✅ Buttons are clickable and styled properly

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Test Case 2: Network Issues Profile

**Objective**: Test the network-issues profile workflow

**Steps**:
1. Navigate to **System → System Hub → Diagnostics**
2. Click the "🌐 Problèmes Réseau" button
3. Observe the toggle switches below
4. Observe the description box
5. Click "📦 Générer Archive"
6. Wait for completion notification
7. Check the "Archives Récentes" section

**Expected Results**:
- ✅ Profile button is highlighted (gradient background)
- ✅ Description appears: "Diagnostique les pannes de routage..."
- ✅ Toggles are set to:
  - Logs: ON
  - Configuration: ON
  - Network: ON
  - Anonymize: OFF
- ✅ Success notification appears: "✅ Archive créée: ..."
- ✅ Archive filename contains "network-issues"
- ✅ Archive appears in recent archives list

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Test Case 3: Performance Problems Profile

**Objective**: Test the performance-problems profile with different toggles

**Steps**:
1. Navigate to **System → System Hub → Diagnostics**
2. Click the "⚡ Problèmes Performance" button
3. Observe toggle switches
4. Verify that Config toggle is OFF
5. Click "📦 Générer Archive"
6. Verify archive creation

**Expected Results**:
- ✅ Profile button is highlighted
- ✅ Description appears about CPU/memory bottlenecks
- ✅ Toggles are set to:
  - Logs: ON
  - Configuration: OFF (different from network profile!)
  - Network: OFF
  - Anonymize: OFF
- ✅ Archive filename contains "performance-problems"
- ✅ Archive is smaller than full diagnostic (no config/network)

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Test Case 4: Security Audit Profile with Anonymization

**Objective**: Verify anonymization works with security-audit profile

**Steps**:
1. Navigate to **System → System Hub → Diagnostics**
2. Click the "🔐 Audit Sécurité" button
3. Observe that Anonymize toggle is ON
4. Click "📦 Générer Archive"
5. Download the archive
6. Extract and inspect config files

**Expected Results**:
- ✅ Profile button is highlighted
- ✅ Anonymize toggle is ON
- ✅ Archive filename contains "security-audit"
- ✅ Config files in archive have sensitive data removed (passwords, keys, IPs, MACs)
- ✅ Logs still contain useful diagnostic information

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Test Case 5: WiFi Problems Profile

**Objective**: Test WiFi-specific profile

**Steps**:
1. Navigate to **System → System Hub → Diagnostics**
2. Click the "📶 Problèmes WiFi" button
3. Observe toggles
4. Click "📦 Générer Archive"
5. Verify archive creation

**Expected Results**:
- ✅ Profile button is highlighted
- ✅ Description mentions signal strength and interference
- ✅ All toggles ON except anonymize
- ✅ Archive filename contains "wifi-problems"

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Test Case 6: Full Diagnostic Profile

**Objective**: Test the complete diagnostic profile

**Steps**:
1. Navigate to **System → System Hub → Diagnostics**
2. Click the "📋 Diagnostic Complet" button
3. Observe toggles
4. Click "📦 Générer Archive"
5. Compare archive size with other profiles

**Expected Results**:
- ✅ Profile button is highlighted
- ✅ Description mentions "support escalation"
- ✅ All toggles ON including anonymize
- ✅ Archive filename contains "full-diagnostic"
- ✅ Archive is largest (contains everything)

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Test Case 7: Profile Override

**Objective**: Verify user can manually adjust toggles after selecting profile

**Steps**:
1. Navigate to **System → System Hub → Diagnostics**
2. Click the "🌐 Problèmes Réseau" profile
3. Manually toggle OFF the "Configuration" switch
4. Click "📦 Générer Archive"
5. Verify archive creation

**Expected Results**:
- ✅ Manual toggle change is respected
- ✅ Archive is created without config files
- ✅ Filename still contains "network-issues"
- ✅ User override works correctly

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Test Case 8: Profile Switching

**Objective**: Test switching between different profiles

**Steps**:
1. Navigate to **System → System Hub → Diagnostics**
2. Click "🌐 Problèmes Réseau" profile
3. Observe toggles state
4. Click "⚡ Problèmes Performance" profile
5. Observe toggles state changes
6. Switch to "🔐 Audit Sécurité"
7. Observe toggles state changes

**Expected Results**:
- ✅ Only one profile button is highlighted at a time
- ✅ Toggles update correctly for each profile
- ✅ Description updates for each profile
- ✅ No visual glitches or errors
- ✅ Profile highlighting transitions smoothly

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Test Case 9: Archive Download and Deletion

**Objective**: Test downloading and deleting profile-based archives

**Steps**:
1. Create archive with any profile
2. Click download button for the archive
3. Verify file downloads to browser
4. Click delete button
5. Confirm deletion
6. Verify archive removed from list

**Expected Results**:
- ✅ Download initiates correctly
- ✅ Filename matches what was shown
- ✅ File can be extracted (valid .tar.gz)
- ✅ Deletion confirmation dialog appears
- ✅ Archive is removed from list
- ✅ Archive file is deleted from router

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Test Case 10: Multiple Profiles in Sequence

**Objective**: Create archives with multiple different profiles in sequence

**Steps**:
1. Click "🌐 Problèmes Réseau" → Generate Archive
2. Wait for completion
3. Click "⚡ Problèmes Performance" → Generate Archive
4. Wait for completion
5. Click "🔐 Audit Sécurité" → Generate Archive
6. Check archives list

**Expected Results**:
- ✅ All 3 archives created successfully
- ✅ Each archive has correct profile name in filename
- ✅ Archives have different sizes (based on included data)
- ✅ All archives appear in recent archives list
- ✅ No errors or conflicts

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Regression Tests

### RT-1: Existing Diagnostics Still Work

**Objective**: Ensure non-profile diagnostics still function

**Steps**:
1. Don't select any profile
2. Manually set toggles (Logs: ON, Config: ON, Network: OFF, Anonymize: OFF)
3. Click "📦 Générer Archive"

**Expected Results**:
- ✅ Archive is created successfully
- ✅ Filename contains "manual" instead of profile name
- ✅ Only logs and config are included (no network info)
- ✅ Backward compatibility maintained

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

### RT-2: Quick Tests Unchanged

**Objective**: Verify quick test buttons still work

**Steps**:
1. Navigate to **System → System Hub → Diagnostics**
2. Scroll to "Tests Rapides" section
3. Click each test button:
   - Connectivity
   - DNS
   - Latency
   - Disk
   - Firewall
   - WiFi

**Expected Results**:
- ✅ All test buttons are visible
- ✅ Each test executes and shows results
- ✅ Tests are independent of profile selection
- ✅ No errors or regressions

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

### RT-3: Upload to Support

**Objective**: Verify upload functionality still works with profiles

**Steps**:
1. Create archive with any profile
2. Click "☁️ Envoyer au Support"
3. Select the profile-based archive
4. Confirm upload

**Expected Results**:
- ✅ Upload dialog appears
- ✅ Profile-based archives are listed
- ✅ Upload process works (or shows appropriate error if no endpoint configured)
- ✅ No regressions in upload functionality

**Result**: ☐ PASS  ☐ FAIL
**Notes**: ___________________________________________

---

## Sign-off

**Tester Name**: _______________________________
**Date**: _______________________________
**Build Version**: _______________________________
**Browser**: _______________________________
**Overall Result**: ☐ ALL PASS  ☐ SOME FAILURES

**Notes/Issues**:
___________________________________________
___________________________________________
___________________________________________

**Failures to Address**:
___________________________________________
___________________________________________
___________________________________________
