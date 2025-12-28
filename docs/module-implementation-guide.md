# SecuBox Module Implementation Guide

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active  
**Purpose:** Complete guide for regenerating SecuBox modules matching the live demo

---

## See Also

- **Automation Briefing:** [CODEX.md](codex.md)
- **Module Prompts:** [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)
- **Code Templates:** [CODE-TEMPLATES.md](code-templates.md)
- **Quick Commands:** [QUICK-START.md](quick-start.md)

---

## Quick Navigation

📋 **[FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)** - Complete feature specifications for all 15 modules
💻 **[CODE-TEMPLATES.md](code-templates.md)** - Ready-to-use code templates and implementation examples
🏗️ **[DEVELOPMENT-GUIDELINES.md](development-guidelines.md)** - Complete development guidelines and design system
⚡ **[QUICK-START.md](quick-start.md)** - Quick reference for common tasks
🔧 **[CLAUDE.md](claude.md)** - Build system and architecture reference

---

## Document Overview

This guide shows you how to use the comprehensive documentation to regenerate or create SecuBox modules that match the live demo at **secubox.cybermood.eu**.

### What's Included

1. **Feature Specifications** - Detailed requirements for all 15 modules
2. **Code Templates** - Working implementation examples
3. **Design System** - CSS variables, typography, components
4. **Validation Tools** - Automated testing and fixing
5. **Deployment Scripts** - Local build and remote deployment

---

## Implementation Workflow

### Step 1: Choose Your Approach

**Option A: Use Claude.ai for Code Generation**
1. Open [claude.ai](https://claude.ai)
2. Copy the relevant module prompt from [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)
3. Paste the prompt and request implementation
4. Claude will generate all required files based on the templates
5. Review and integrate the generated code

**Option B: Manual Implementation Using Templates**
1. Copy templates from [CODE-TEMPLATES.md](code-templates.md)
2. Replace placeholders with module-specific values
3. Implement module-specific logic
4. Validate and test

**Option C: Hybrid Approach (Recommended)**
1. Use Claude.ai for initial code generation
2. Refine using templates and guidelines
3. Validate with automated tools
4. Deploy and test on target device

---

## Step-by-Step: Regenerate a Module with Claude.ai

### Example: Regenerating System Hub Module

#### 1. Gather Context

Before prompting Claude, gather these resources:

```bash
# Read the module specification
cat FEATURE-REGENERATION-PROMPTS.md | grep -A 200 "System Hub"

# Review the design system
cat DEVELOPMENT-GUIDELINES.md | grep -A 100 "Design System"

# Check existing implementation (if available)
ls -la luci-app-system-hub/
```

#### 2. Prepare the Prompt

Create a comprehensive prompt for Claude.ai:

```
I need you to implement the System Hub module for OpenWrt LuCI framework.

IMPORTANT CONSTRAINTS:
- OpenWrt uses LuCI framework (not React/Vue)
- JavaScript uses L.view.extend() pattern (not ES6 modules)
- Backend is RPCD (shell scripts) communicating via ubus
- CSS must use variables from system-hub/common.css
- All code must be production-ready and match live demo
- Follow the design system exactly

TECHNICAL REQUIREMENTS:
- RPCD script MUST be named: luci.system-hub
- Menu paths MUST match view file locations
- Use CSS variables (--sh-*) for all colors
- Support dark mode with [data-theme="dark"]
- Implement proper error handling
- Add loading states for async operations

REFERENCE DOCUMENTS:
1. Live Demo: https://secubox.cybermood.eu/system-hub
2. Feature Specification: [paste from FEATURE-REGENERATION-PROMPTS.md]
3. Code Templates: [paste relevant templates from CODE-TEMPLATES.md]

Please provide:
1. Complete JavaScript view files (overview.js, services.js, etc.)
2. RPCD backend script (luci.system-hub)
3. API module (system-hub/api.js)
4. CSS styles (system-hub/dashboard.css)
5. Menu configuration JSON
6. ACL configuration JSON

Make sure all code matches the live demo visual design and functionality.
```

#### 3. Generate Code

Paste your prompt into Claude.ai and let it generate the implementation.

#### 4. Review Generated Code

Check the generated code against these requirements:

**API Module Checklist:**
- [ ] Uses `'use strict';`
- [ ] Requires `baseclass` and `rpc`
- [ ] All RPC methods use `rpc.declare()`
- [ ] Object names match RPCD script name (`luci.system-hub`)
- [ ] Helper functions included if needed
- [ ] Exports from `baseclass.extend()`

**View Module Checklist:**
- [ ] Extends `view.extend()`
- [ ] Implements `load()` method returning Promise
- [ ] Implements `render(data)` method
- [ ] Uses `E()` helper for DOM building
- [ ] Implements `poll.add()` for auto-refresh
- [ ] Proper error handling with try/catch
- [ ] Uses `ui.showModal()` for loading states
- [ ] Uses `ui.addNotification()` for user feedback

**RPCD Backend Checklist:**
- [ ] Starts with `#!/bin/sh`
- [ ] Sources `/lib/functions.sh` and `/usr/share/libubox/jshn.sh`
- [ ] Implements `list` case with method declarations
- [ ] Implements `call` case with method routing
- [ ] All methods output valid JSON using `json_*` functions
- [ ] Proper parameter validation
- [ ] Error handling with appropriate messages

**Menu JSON Checklist:**
- [ ] Paths follow `admin/secubox/<category>/<module>`
- [ ] First entry uses `"type": "firstchild"`
- [ ] View entries use `"type": "view"` with correct `"path"`
- [ ] Paths match view file locations
- [ ] Proper `"order"` values for menu positioning
- [ ] Depends on correct ACL entry

**ACL JSON Checklist:**
- [ ] Entry name matches package name
- [ ] All read methods listed under `"read"."ubus"`
- [ ] All write methods listed under `"write"."ubus"`
- [ ] ubus object names match RPCD script name
- [ ] UCI config access granted if needed

**CSS Checklist:**
- [ ] Imports `system-hub/common.css`
- [ ] Uses CSS variables (`var(--sh-*)`)
- [ ] Supports dark mode with `[data-theme="dark"]`
- [ ] Responsive grid layouts
- [ ] Smooth transitions and animations
- [ ] JetBrains Mono for numeric values

#### 5. Integrate into Codebase

```bash
# Create module directory structure
mkdir -p luci-app-system-hub/htdocs/luci-static/resources/system-hub
mkdir -p luci-app-system-hub/htdocs/luci-static/resources/view/system-hub
mkdir -p luci-app-system-hub/root/usr/libexec/rpcd
mkdir -p luci-app-system-hub/root/usr/share/luci/menu.d
mkdir -p luci-app-system-hub/root/usr/share/rpcd/acl.d

# Copy generated files to appropriate locations
# (Copy from Claude's output to respective files)

# Set RPCD script as executable
chmod +x luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub
```

#### 6. Validate Implementation

```bash
# Fix permissions first (CRITICAL)
./secubox-tools/fix-permissions.sh --local

# Run comprehensive validation (7 checks)
./secubox-tools/validate-modules.sh

# Expected output:
# ✅ All checks passed
# OR
# ❌ Errors found with specific fix instructions
```

#### 7. Build Locally

```bash
# Build single module
./secubox-tools/local-build.sh build luci-app-system-hub

# Or build all modules
./secubox-tools/local-build.sh build

# Or full validation + build
./secubox-tools/local-build.sh full
```

#### 8. Deploy to Test Router

```bash
# Transfer package
scp build/x86-64/luci-app-system-hub*.ipk root@192.168.1.1:/tmp/

# Install on router
ssh root@192.168.1.1 << 'EOF'
opkg install /tmp/luci-app-system-hub*.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
EOF

# Fix permissions on deployed router (if needed)
./secubox-tools/fix-permissions.sh --remote
```

#### 9. Test in Browser

1. Navigate to `http://192.168.1.1/cgi-bin/luci`
2. Go to SecuBox → System → System Hub
3. Verify:
   - Page loads without errors
   - Data displays correctly
   - Actions work (buttons, forms)
   - Auto-refresh updates data
   - Styling matches demo
   - Dark mode works
   - Responsive design works on mobile

#### 10. Iterate and Refine

If issues found:
1. Check browser console for JavaScript errors
2. Check router logs: `ssh root@192.168.1.1 "logread | tail -50"`
3. Verify RPCD methods work: `ubus call luci.system-hub status`
4. Fix issues in local files
5. Rebuild and redeploy
6. Test again

---

## Common Implementation Patterns

### Pattern 1: Multi-Tab Dashboard

**Example:** System Hub with 9 tabs

```javascript
// In render()
var tabs = [
	{ id: 'overview', title: 'Overview', icon: '🏠' },
	{ id: 'services', title: 'Services', icon: '⚙️' },
	{ id: 'logs', title: 'Logs', icon: '📋' }
];

var activeTab = 'overview';

// Render tab navigation
var tabNav = E('div', { 'class': 'sh-nav-tabs' },
	tabs.map(function(tab) {
		return E('div', {
			'class': 'sh-nav-tab' + (activeTab === tab.id ? ' active' : ''),
			'click': function() {
				// Switch tab logic
				document.querySelectorAll('.sh-nav-tab').forEach(function(t) {
					t.classList.remove('active');
				});
				this.classList.add('active');
				// Show/hide tab content
			}
		}, [
			E('span', {}, tab.icon),
			E('span', {}, tab.title)
		]);
	})
);

// Render tab content
var tabContent = E('div', { 'class': 'tab-content' }, [
	// Overview tab
	E('div', { 'class': 'tab-pane' + (activeTab === 'overview' ? ' active' : ''), 'data-tab': 'overview' }, [
		this.renderOverviewContent()
	]),
	// Services tab
	E('div', { 'class': 'tab-pane' + (activeTab === 'services' ? ' active' : ''), 'data-tab': 'services' }, [
		this.renderServicesContent()
	])
]);
```

### Pattern 2: Filter Tabs with Data Filtering

**Example:** SecuBox module grid with category filtering

```javascript
// Filter tabs
var filterTabs = E('div', { 'class': 'sh-filter-tabs' }, [
	E('div', {
		'class': 'sh-filter-tab active',
		'data-filter': 'all',
		'click': function(ev) {
			document.querySelectorAll('.sh-filter-tab').forEach(function(t) {
				t.classList.remove('active');
			});
			this.classList.add('active');
			self.filterModules('all');
		}
	}, [
		E('span', { 'class': 'sh-tab-icon' }, '📦'),
		E('span', { 'class': 'sh-tab-label' }, 'All')
	]),
	E('div', {
		'class': 'sh-filter-tab',
		'data-filter': 'security',
		'click': function(ev) {
			document.querySelectorAll('.sh-filter-tab').forEach(function(t) {
				t.classList.remove('active');
			});
			this.classList.add('active');
			self.filterModules('security');
		}
	}, [
		E('span', { 'class': 'sh-tab-icon' }, '🛡️'),
		E('span', { 'class': 'sh-tab-label' }, 'Security')
	])
]);

// Filter function
filterModules: function(category) {
	var modules = document.querySelectorAll('.module-card');
	modules.forEach(function(module) {
		if (category === 'all' || module.dataset.category === category) {
			module.style.display = 'block';
		} else {
			module.style.display = 'none';
		}
	});
}
```

### Pattern 3: Real-Time Log Viewer

**Example:** System Hub logs tab

```javascript
// Logs view with auto-scroll and auto-refresh
renderLogsTab: function() {
	var self = this;
	var autoScroll = true;
	var autoRefresh = true;
	var refreshInterval = 5; // seconds

	var logsContainer = E('div', { 'class': 'logs-container' });

	// Load logs
	var loadLogs = function() {
		API.getLogs(100, '').then(function(result) {
			var logs = result.logs || [];

			dom.content(logsContainer,
				logs.map(function(log) {
					return E('div', { 'class': 'log-line' }, log);
				})
			);

			// Auto-scroll to bottom
			if (autoScroll) {
				logsContainer.scrollTop = logsContainer.scrollHeight;
			}
		});
	};

	// Initial load
	loadLogs();

	// Auto-refresh
	if (autoRefresh) {
		setInterval(loadLogs, refreshInterval * 1000);
	}

	return E('div', {}, [
		// Controls
		E('div', { 'class': 'logs-controls' }, [
			E('label', {}, [
				E('input', {
					'type': 'checkbox',
					'checked': autoScroll,
					'change': function() { autoScroll = this.checked; }
				}),
				' Auto-scroll'
			]),
			E('label', {}, [
				E('input', {
					'type': 'checkbox',
					'checked': autoRefresh,
					'change': function() { autoRefresh = this.checked; }
				}),
				' Auto-refresh'
			]),
			E('button', {
				'class': 'sh-btn sh-btn-primary',
				'click': loadLogs
			}, '🔄 Refresh Now')
		]),
		// Logs display
		logsContainer
	]);
}
```

### Pattern 4: Action Buttons with Confirmation

**Example:** Service management buttons

```javascript
// Render action button with confirmation
renderActionButton: function(service, action, label, btnClass) {
	var self = this;

	return E('button', {
		'class': 'sh-btn ' + btnClass,
		'click': function(ev) {
			// Show confirmation modal
			ui.showModal(_('Confirm Action'), [
				E('p', {}, _('Are you sure you want to %s service %s?').format(action, service)),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'sh-btn sh-btn-secondary',
						'click': ui.hideModal
					}, _('Cancel')),
					E('button', {
						'class': 'sh-btn sh-btn-primary',
						'click': function() {
							ui.hideModal();
							self.performServiceAction(service, action);
						}
					}, _('Confirm'))
				])
			]);
		}
	}, label);
},

// Perform service action
performServiceAction: function(service, action) {
	var self = this;

	ui.showModal(_('Performing Action'), [
		E('p', {}, E('em', { 'class': 'spinning' }, _('Please wait...')))
	]);

	API.serviceAction(service, action).then(function(result) {
		ui.hideModal();

		if (result.success) {
			ui.addNotification(null, E('p', _('Action completed successfully')), 'success');
			self.handleRefresh();
		} else {
			ui.addNotification(null, E('p', _('Action failed: %s').format(result.message)), 'error');
		}
	}).catch(function(error) {
		ui.hideModal();
		ui.addNotification(null, E('p', _('Error: %s').format(error.message)), 'error');
	});
}
```

### Pattern 5: Form with Validation

**Example:** Settings page

```javascript
renderSettingsForm: function() {
	var self = this;
	var settings = this.settingsData || {};

	return E('form', { 'class': 'settings-form' }, [
		// Text input
		E('div', { 'class': 'form-group' }, [
			E('label', {}, 'Hostname'),
			E('input', {
				'type': 'text',
				'class': 'form-control',
				'value': settings.hostname || '',
				'id': 'input-hostname'
			})
		]),

		// Number input with validation
		E('div', { 'class': 'form-group' }, [
			E('label', {}, 'Refresh Interval (seconds)'),
			E('input', {
				'type': 'number',
				'class': 'form-control',
				'value': settings.refresh_interval || 30,
				'min': 10,
				'max': 300,
				'id': 'input-refresh'
			})
		]),

		// Checkbox
		E('div', { 'class': 'form-group' }, [
			E('label', {}, [
				E('input', {
					'type': 'checkbox',
					'checked': settings.auto_refresh || false,
					'id': 'input-auto-refresh'
				}),
				' Enable auto-refresh'
			])
		]),

		// Submit button
		E('div', { 'class': 'form-actions' }, [
			E('button', {
				'class': 'sh-btn sh-btn-primary',
				'type': 'submit',
				'click': function(ev) {
					ev.preventDefault();
					self.handleSaveSettings();
				}
			}, 'Save Settings')
		])
	]);
},

handleSaveSettings: function() {
	var hostname = document.getElementById('input-hostname').value;
	var refreshInterval = parseInt(document.getElementById('input-refresh').value);
	var autoRefresh = document.getElementById('input-auto-refresh').checked;

	// Validate
	if (!hostname) {
		ui.addNotification(null, E('p', _('Hostname is required')), 'error');
		return;
	}

	if (refreshInterval < 10 || refreshInterval > 300) {
		ui.addNotification(null, E('p', _('Refresh interval must be between 10 and 300 seconds')), 'error');
		return;
	}

	// Save via API
	API.saveSettings(hostname, refreshInterval, autoRefresh).then(function(result) {
		if (result.success) {
			ui.addNotification(null, E('p', _('Settings saved successfully')), 'success');
		} else {
			ui.addNotification(null, E('p', _('Failed to save settings: %s').format(result.message)), 'error');
		}
	});
}
```

---

## Module-Specific Notes

### System Hub (luci-app-system-hub)
- **Complexity:** High - 9 tabs, many features
- **Key Features:** Health monitoring, service management, system logs, backup/restore
- **Special Requirements:** Integration with SecuBox for components list
- **Dependencies:** Calls `luci.secubox` for module enumeration

### WireGuard Dashboard (luci-app-wireguard-dashboard)
- **Complexity:** Medium
- **Key Features:** Peer management, QR code generation, traffic stats
- **Special Requirements:** QR code generation (use qrencode or JavaScript library)
- **Dependencies:** WireGuard tools (`wg` command)

### CrowdSec Dashboard (luci-app-crowdsec-dashboard)
- **Complexity:** Medium
- **Key Features:** Threat intelligence, decisions management, bouncers
- **Special Requirements:** Parse CrowdSec CLI output
- **Dependencies:** CrowdSec (`cscli` command)

### Netdata Dashboard (luci-app-netdata-dashboard)
- **Complexity:** Low - mostly embedding iframe
- **Key Features:** Embedded Netdata UI, quick metrics overview
- **Special Requirements:** Netdata API integration
- **Dependencies:** Netdata service

### Network Modes (luci-app-network-modes)
- **Complexity:** High - UCI manipulation
- **Key Features:** Network topology wizard, configuration preview
- **Special Requirements:** UCI config validation, rollback mechanism
- **Dependencies:** Network, firewall, DHCP configs

---

## Troubleshooting Guide

### Issue: "Object not found" Error

**Symptoms:**
```
RPC call to luci.module-name/method failed with error -32000: Object not found
```

**Diagnosis:**
```bash
# 1. Check RPCD script exists and is executable
ls -la luci-app-module-name/root/usr/libexec/rpcd/

# 2. Check RPCD script name matches ubus object
grep "object:" luci-app-module-name/htdocs/luci-static/resources/module-name/api.js

# 3. Test RPCD script manually
ssh root@router "/usr/libexec/rpcd/luci.module-name list"

# 4. Check RPCD logs
ssh root@router "logread | grep rpcd | tail -20"
```

**Solutions:**
1. Rename RPCD script to match ubus object name (must include `luci.` prefix)
2. Make script executable: `chmod +x luci.module-name`
3. Restart RPCD: `/etc/init.d/rpcd restart`
4. Reinstall package if deployed

### Issue: View Not Loading (404)

**Symptoms:**
```
HTTP error 404 while loading class file '/luci-static/resources/view/module-name/overview.js'
```

**Diagnosis:**
```bash
# 1. Check menu path
cat luci-app-module-name/root/usr/share/luci/menu.d/*.json | grep "path"

# 2. Check view file exists
ls -la luci-app-module-name/htdocs/luci-static/resources/view/

# 3. Verify paths match
# Menu: "path": "module-name/overview"
# File: view/module-name/overview.js
```

**Solutions:**
1. Update menu path to match view file location
2. OR move view files to match menu path
3. Rebuild and redeploy package

### Issue: CSS Not Applied

**Symptoms:**
- Unstyled page
- Missing colors, fonts, or layout

**Diagnosis:**
```bash
# 1. Check browser console for CSS 404 errors
# (Open browser developer tools)

# 2. Verify CSS import in view file
grep "stylesheet" luci-app-module-name/htdocs/luci-static/resources/view/*/overview.js

# 3. Check CSS file exists
ls -la luci-app-module-name/htdocs/luci-static/resources/module-name/dashboard.css
```

**Solutions:**
1. Verify CSS import path: `L.resource('module-name/dashboard.css')`
2. Import common.css: `@import url('../system-hub/common.css');`
3. Check file permissions: `644` for CSS files
4. Clear browser cache (Ctrl+Shift+R)

### Issue: Data Not Updating

**Symptoms:**
- Dashboard shows stale data
- Auto-refresh not working

**Diagnosis:**
```bash
# 1. Check poll is registered
# (Look for poll.add() in render() method)

# 2. Check API calls return Promises
# (Verify methods return results from rpc.declare())

# 3. Test API methods directly
ssh root@router "ubus call luci.module-name status"
```

**Solutions:**
1. Add poll.add() to render() method
2. Verify API calls in poll callback return Promises
3. Ensure updateDashboard() updates correct DOM elements
4. Check browser console for JavaScript errors

---

## Best Practices

### 1. Code Organization

**DO:**
- Keep related code together (API methods, helpers)
- Use descriptive variable and function names
- Add comments for complex logic
- Break large functions into smaller helpers

**DON'T:**
- Put all code in one massive function
- Use single-letter variable names (except in loops)
- Duplicate code - create helper functions instead
- Leave commented-out code in production

### 2. Error Handling

**DO:**
```javascript
API.getData().then(function(result) {
	if (result && result.data) {
		// Process data
	} else {
		console.warn('No data returned');
		// Show empty state
	}
}).catch(function(error) {
	console.error('API error:', error);
	ui.addNotification(null, E('p', 'Failed to load data'), 'error');
});
```

**DON'T:**
```javascript
API.getData().then(function(result) {
	// Process data without checking
	result.data.forEach(function(item) { ... }); // Will crash if data is null
});
```

### 3. Performance

**DO:**
- Use poll.add() instead of setInterval for auto-refresh
- Update specific DOM elements instead of full re-render
- Debounce search inputs
- Lazy load data only when needed

**DON'T:**
- Re-render entire view on every update
- Poll too frequently (<10 seconds)
- Load all data upfront
- Perform expensive operations in render()

### 4. User Experience

**DO:**
- Show loading states (spinners, skeleton screens)
- Provide feedback for actions (success/error notifications)
- Confirm destructive actions (delete, restart)
- Use descriptive error messages

**DON'T:**
- Leave users waiting without feedback
- Silent failures
- Generic error messages ("Error occurred")
- Allow destructive actions without confirmation

---

## Deployment Checklist

Before deploying to production:

- [ ] **Code Quality**
  - [ ] All validation checks pass
  - [ ] No JavaScript errors in console
  - [ ] No shell script errors (shellcheck)
  - [ ] All JSON files valid (jsonlint)

- [ ] **Functionality**
  - [ ] All tabs/pages load correctly
  - [ ] All actions work as expected
  - [ ] Data displays correctly
  - [ ] Auto-refresh updates data
  - [ ] Forms validate input
  - [ ] Error handling works

- [ ] **Design**
  - [ ] Matches live demo visually
  - [ ] Dark mode works
  - [ ] Responsive on mobile
  - [ ] Consistent with other modules
  - [ ] No layout issues

- [ ] **Performance**
  - [ ] Page loads quickly (<2s)
  - [ ] Auto-refresh doesn't freeze UI
  - [ ] No memory leaks
  - [ ] Efficient data fetching

- [ ] **Security**
  - [ ] ACL permissions correct
  - [ ] Input validation on frontend and backend
  - [ ] No hardcoded credentials
  - [ ] Safe command execution (no injection)

- [ ] **Documentation**
  - [ ] README.md updated
  - [ ] Comments in complex code
  - [ ] Menu entries have descriptions
  - [ ] ACL entries have descriptions

---

## Additional Resources

### Documentation
- [LuCI API Reference](https://openwrt.github.io/luci/api/)
- [OpenWrt Developer Guide](https://openwrt.org/docs/guide-developer/start)
- [UCI Configuration](https://openwrt.org/docs/guide-user/base-system/uci)
- [ubus Documentation](https://openwrt.org/docs/techref/ubus)

### Live Demo
- **Main Demo:** https://secubox.cybermood.eu
- **System Hub:** https://secubox.cybermood.eu/system-hub
- **CrowdSec:** https://secubox.cybermood.eu/crowdsec
- **WireGuard:** https://secubox.cybermood.eu/wireguard

### Internal Documentation
- [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md) - All module specifications
- [CODE-TEMPLATES.md](code-templates.md) - Implementation templates
- [DEVELOPMENT-GUIDELINES.md](development-guidelines.md) - Complete dev guide
- [QUICK-START.md](quick-start.md) - Quick reference
- [CLAUDE.md](claude.md) - Build system reference

### Tools
- [SecuBox Tools](./secubox-tools/) - Validation, build, deployment scripts
- [GitHub Actions](./.github/workflows/) - CI/CD workflows
- [Templates](./templates/) - Module templates

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Existing Modules:** Look at working modules for reference implementations
2. **Run Validation:** `./secubox-tools/validate-modules.sh` for automated checks
3. **Check Logs:** `logread | grep -i error` on the router
4. **Review Documentation:** Read DEVELOPMENT-GUIDELINES.md for detailed explanations
5. **Contact Support:** support@cybermind.fr

---

**Document Version:** 1.0.0
**Last Updated:** 2025-12-27
**Maintainer:** CyberMind.fr
**Live Demo:** https://secubox.cybermood.eu
