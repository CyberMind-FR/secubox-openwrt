# SecuBox Module Code Templates

**Version:** 1.0.0
**Date:** 2025-12-27
**Purpose:** Ready-to-use code templates extracted from working SecuBox modules

---

## Table of Contents

1. [File Structure Template](#file-structure-template)
2. [API Module Template](#api-module-template)
3. [JavaScript View Template](#javascript-view-template)
4. [RPCD Backend Template](#rpcd-backend-template)
5. [Menu JSON Template](#menu-json-template)
6. [ACL JSON Template](#acl-json-template)
7. [CSS Styling Template](#css-styling-template)
8. [Complete Implementation Example](#complete-implementation-example)

---

## File Structure Template

Every SecuBox module follows this exact structure:

```
luci-app-<module-name>/
├── Makefile                                      # OpenWrt package definition
├── README.md                                     # Module documentation
├── htdocs/luci-static/resources/
│   ├── <module-name>/
│   │   ├── api.js                                # RPC API client (REQUIRED)
│   │   ├── theme.js                              # Theme helper (optional)
│   │   └── dashboard.css                         # Module-specific styles
│   └── view/<module-name>/
│       ├── overview.js                           # Main dashboard view
│       ├── settings.js                           # Settings view (if needed)
│       └── *.js                                  # Additional views
└── root/
    ├── etc/config/<module-name>                  # UCI config (optional)
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.<module-name>                # RPCD backend (REQUIRED, must be executable)
        └── share/
            ├── luci/menu.d/
            │   └── luci-app-<module-name>.json   # Menu definition
            └── rpcd/acl.d/
                └── luci-app-<module-name>.json   # ACL permissions
```

**Critical Rules:**
1. RPCD script MUST be named `luci.<module-name>` (with `luci.` prefix)
2. RPCD script MUST be executable (`chmod +x`)
3. Menu paths MUST match view file locations
4. CSS/JS files should be 644 permissions
5. All ubus objects MUST use `luci.` prefix

---

## API Module Template

**File:** `htdocs/luci-static/resources/<module-name>/api.js`

```javascript
'use strict';
'require baseclass';
'require rpc';

/**
 * [Module Name] API
 * Package: luci-app-<module-name>
 * RPCD object: luci.<module-name>
 * Version: 1.0.0
 */

// Debug log to verify correct version is loaded
console.log('🔧 [Module Name] API v1.0.0 loaded at', new Date().toISOString());

// ============================================================================
// RPC Method Declarations
// ============================================================================

// Simple method (no parameters)
var callStatus = rpc.declare({
	object: 'luci.<module-name>',  // MUST match RPCD script name
	method: 'status',
	expect: {}
});

// Method with return structure
var callGetData = rpc.declare({
	object: 'luci.<module-name>',
	method: 'get_data',
	expect: { data: [] }  // Expected return structure
});

// Method with parameters
var callPerformAction = rpc.declare({
	object: 'luci.<module-name>',
	method: 'perform_action',
	params: ['action_type', 'target'],  // Parameter names
	expect: { success: false }
});

// Method with multiple parameters
var callUpdateConfig = rpc.declare({
	object: 'luci.<module-name>',
	method: 'update_config',
	params: ['key', 'value', 'persist'],
	expect: {}
});

// ============================================================================
// Helper Functions (Optional)
// ============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format timestamp to "X ago" string
 */
function formatTimeAgo(timestamp) {
	if (!timestamp) return 'Never';
	var now = Math.floor(Date.now() / 1000);
	var diff = now - timestamp;
	if (diff < 60) return diff + 's ago';
	if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
	if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
	return Math.floor(diff / 86400) + 'd ago';
}

/**
 * Format uptime seconds to "Xd Xh Xm" string
 */
function formatUptime(seconds) {
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor((seconds % 86400) / 3600);
	var mins = Math.floor((seconds % 3600) / 60);
	return days + 'd ' + hours + 'h ' + mins + 'm';
}

// ============================================================================
// API Export
// ============================================================================

return baseclass.extend({
	// RPC methods - exposed via ubus
	getStatus: callStatus,
	getData: callGetData,
	performAction: callPerformAction,
	updateConfig: callUpdateConfig,

	// Helper functions
	formatBytes: formatBytes,
	formatTimeAgo: formatTimeAgo,
	formatUptime: formatUptime,

	// Aggregate function for overview page (combines multiple calls)
	getAllData: function() {
		return Promise.all([
			callStatus(),
			callGetData()
		]).then(function(results) {
			return {
				status: results[0] || {},
				data: results[1] || { data: [] }
			};
		});
	}
});
```

**Key Points:**
- Always use `'use strict';`
- Require `baseclass` and `rpc`
- Use `rpc.declare()` for each RPCD method
- Export from `baseclass.extend()`
- Helper functions can be included in the API module
- Aggregate functions are useful for views that need multiple data sources

---

## JavaScript View Template

**File:** `htdocs/luci-static/resources/view/<module-name>/overview.js`

```javascript
'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require <module-name>/api as API';

/**
 * [Module Name] - Overview Dashboard
 * Main view for luci-app-<module-name>
 */

return view.extend({
	// ========================================================================
	// Data Properties
	// ========================================================================

	statusData: null,
	componentData: null,

	// ========================================================================
	// Load Data
	// ========================================================================

	/**
	 * Called when view is loaded
	 * Return a Promise (can use Promise.all for parallel loading)
	 */
	load: function() {
		return Promise.all([
			API.getStatus(),
			API.getData()
		]);
	},

	// ========================================================================
	// Render View
	// ========================================================================

	/**
	 * Called after load() completes
	 * @param {Array} data - Results from load() Promise.all
	 */
	render: function(data) {
		var self = this;
		this.statusData = data[0] || {};
		this.componentData = data[1] || { data: [] };

		// Main container
		var container = E('div', { 'class': 'module-dashboard' }, [
			// Load CSS
			E('link', { 'rel': 'stylesheet', 'href': L.resource('<module-name>/dashboard.css') }),

			// Page Header
			this.renderHeader(),

			// Stats Overview Grid
			this.renderStatsOverview(),

			// Content Cards
			this.renderContent()
		]);

		// Setup auto-refresh polling (30 seconds)
		poll.add(L.bind(function() {
			return Promise.all([
				API.getStatus(),
				API.getData()
			]).then(L.bind(function(refreshData) {
				this.statusData = refreshData[0] || {};
				this.componentData = refreshData[1] || { data: [] };
				this.updateDashboard();
			}, this));
		}, this), 30);

		return container;
	},

	// ========================================================================
	// Render Components
	// ========================================================================

	/**
	 * Render page header with title and stats badges
	 */
	renderHeader: function() {
		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🚀'),
					'Module Title'
				]),
				E('p', { 'class': 'sh-page-subtitle' }, 'Module description and purpose')
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				this.renderStatBadge('Active Items', this.statusData.active || 0),
				this.renderStatBadge('Total Items', this.statusData.total || 0),
				this.renderStatBadge('Status', this.statusData.status || 'Unknown'),
				this.renderStatBadge('Version', this.statusData.version || '1.0.0')
			])
		]);
	},

	/**
	 * Render a single stat badge
	 */
	renderStatBadge: function(label, value) {
		return E('div', { 'class': 'sh-stat-badge' }, [
			E('div', { 'class': 'sh-stat-value' }, String(value)),
			E('div', { 'class': 'sh-stat-label' }, label)
		]);
	},

	/**
	 * Render stats overview grid
	 */
	renderStatsOverview: function() {
		return E('div', { 'class': 'stats-grid' }, [
			this.renderMetricCard('CPU', this.statusData.cpu),
			this.renderMetricCard('Memory', this.statusData.memory),
			this.renderMetricCard('Disk', this.statusData.disk)
		]);
	},

	/**
	 * Render a metric card with progress bar
	 */
	renderMetricCard: function(title, data) {
		if (!data) return E('div');

		var usage = data.usage || 0;
		var status = usage >= 90 ? 'critical' : (usage >= 75 ? 'warning' : 'ok');
		var color = usage >= 90 ? '#ef4444' : (usage >= 75 ? '#f59e0b' : '#22c55e');

		return E('div', { 'class': 'sh-metric-card sh-metric-' + status }, [
			E('div', { 'class': 'sh-metric-header' }, [
				E('span', { 'class': 'sh-metric-icon' }, this.getMetricIcon(title)),
				E('span', { 'class': 'sh-metric-title' }, title)
			]),
			E('div', { 'class': 'sh-metric-value' }, usage + '%'),
			E('div', { 'class': 'sh-metric-progress' }, [
				E('div', {
					'class': 'sh-metric-progress-bar',
					'style': 'width: ' + usage + '%; background: ' + color
				})
			]),
			E('div', { 'class': 'sh-metric-details' }, data.details || 'N/A')
		]);
	},

	/**
	 * Get icon for metric type
	 */
	getMetricIcon: function(type) {
		switch(type) {
			case 'CPU': return '🔥';
			case 'Memory': return '💾';
			case 'Disk': return '💿';
			default: return '📊';
		}
	},

	/**
	 * Render main content
	 */
	renderContent: function() {
		return E('div', { 'class': 'content-grid' }, [
			this.renderCard('Active Components', this.renderComponentsList()),
			this.renderCard('Quick Actions', this.renderQuickActions()),
			this.renderCard('Recent Activity', this.renderActivityLog())
		]);
	},

	/**
	 * Render a card container
	 */
	renderCard: function(title, content) {
		return E('div', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('h3', { 'class': 'sh-card-title' }, title)
			]),
			E('div', { 'class': 'sh-card-body' }, content)
		]);
	},

	/**
	 * Render components list
	 */
	renderComponentsList: function() {
		var items = this.componentData.data || [];

		if (items.length === 0) {
			return E('div', { 'class': 'sh-empty-state' }, [
				E('div', { 'class': 'sh-empty-icon' }, '📭'),
				E('div', { 'class': 'sh-empty-text' }, 'No components found')
			]);
		}

		return E('div', { 'class': 'component-list' },
			items.map(L.bind(function(item) {
				return this.renderComponentItem(item);
			}, this))
		);
	},

	/**
	 * Render a single component item
	 */
	renderComponentItem: function(item) {
		var statusClass = item.status === 'active' ? 'sh-card-success' : 'sh-card-warning';

		return E('div', { 'class': 'component-item ' + statusClass }, [
			E('div', { 'class': 'component-name' }, item.name || 'Unknown'),
			E('div', { 'class': 'component-status' }, item.status || 'unknown'),
			E('div', { 'class': 'component-actions' }, [
				E('button', {
					'class': 'sh-btn sh-btn-primary sh-btn-sm',
					'click': L.bind(this.handleAction, this, item.id, 'view')
				}, 'View'),
				E('button', {
					'class': 'sh-btn sh-btn-secondary sh-btn-sm',
					'click': L.bind(this.handleAction, this, item.id, 'configure')
				}, 'Configure')
			])
		]);
	},

	/**
	 * Render quick actions
	 */
	renderQuickActions: function() {
		return E('div', { 'class': 'quick-actions' }, [
			E('button', {
				'class': 'sh-btn sh-btn-primary',
				'click': L.bind(this.handleRefresh, this)
			}, '🔄 Refresh'),
			E('button', {
				'class': 'sh-btn sh-btn-success',
				'click': L.bind(this.handleAction, this, null, 'start_all')
			}, '▶️ Start All'),
			E('button', {
				'class': 'sh-btn sh-btn-danger',
				'click': L.bind(this.handleAction, this, null, 'stop_all')
			}, '⏹️ Stop All')
		]);
	},

	/**
	 * Render activity log
	 */
	renderActivityLog: function() {
		var activities = this.statusData.recent_activities || [];

		if (activities.length === 0) {
			return E('div', { 'class': 'sh-empty-text' }, 'No recent activity');
		}

		return E('div', { 'class': 'activity-log' },
			activities.map(function(activity) {
				return E('div', { 'class': 'activity-item' }, [
					E('span', { 'class': 'activity-time' }, activity.time || ''),
					E('span', { 'class': 'activity-text' }, activity.message || '')
				]);
			})
		);
	},

	// ========================================================================
	// Event Handlers
	// ========================================================================

	/**
	 * Handle generic action
	 */
	handleAction: function(id, action, ev) {
		var self = this;

		ui.showModal(_('Performing Action'), [
			E('p', {}, _('Please wait...'))
		]);

		API.performAction(action, id || '').then(function(result) {
			ui.hideModal();

			if (result.success) {
				ui.addNotification(null, E('p', _('Action completed successfully')), 'success');
				self.handleRefresh();
			} else {
				ui.addNotification(null, E('p', _('Action failed: %s').format(result.message || 'Unknown error')), 'error');
			}
		}).catch(function(error) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(error.message || 'Unknown error')), 'error');
		});
	},

	/**
	 * Handle refresh
	 */
	handleRefresh: function() {
		var self = this;

		return Promise.all([
			API.getStatus(),
			API.getData()
		]).then(function(data) {
			self.statusData = data[0] || {};
			self.componentData = data[1] || { data: [] };
			self.updateDashboard();
			ui.addNotification(null, E('p', _('Dashboard refreshed')), 'info');
		});
	},

	/**
	 * Update dashboard without full re-render
	 */
	updateDashboard: function() {
		// Update specific DOM elements instead of full re-render
		var statsGrid = document.querySelector('.sh-stats-grid');
		if (statsGrid) {
			dom.content(statsGrid, [
				this.renderStatBadge('Active Items', this.statusData.active || 0),
				this.renderStatBadge('Total Items', this.statusData.total || 0),
				this.renderStatBadge('Status', this.statusData.status || 'Unknown'),
				this.renderStatBadge('Version', this.statusData.version || '1.0.0')
			]);
		}

		// Update components list
		var componentsList = document.querySelector('.component-list');
		if (componentsList) {
			var items = this.componentData.data || [];
			dom.content(componentsList,
				items.map(L.bind(function(item) {
					return this.renderComponentItem(item);
				}, this))
			);
		}
	},

	// ========================================================================
	// Required LuCI Methods (can be null if not used)
	// ========================================================================

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
```

**Key Points:**
- Extend `view` with `load()` and `render()` methods
- Use `E()` helper to build DOM elements
- Use `L.bind()` for event handlers to preserve `this` context
- Use `poll.add()` for auto-refresh functionality
- Use `dom.content()` for efficient partial updates
- Use `ui.showModal()`, `ui.hideModal()`, `ui.addNotification()` for user feedback
- Always handle errors in Promise chains

---

## RPCD Backend Template

**File:** `root/usr/libexec/rpcd/luci.<module-name>`

```bash
#!/bin/sh
# [Module Name] RPCD Backend
# Package: luci-app-<module-name>
# Version: 1.0.0

# Source required libraries
. /lib/functions.sh
. /usr/share/libubox/jshn.sh

# ============================================================================
# RPC Methods
# ============================================================================

# Get status information
status() {
	json_init

	# Example: Get system info
	local hostname=$(cat /proc/sys/kernel/hostname 2>/dev/null || echo "unknown")
	local uptime=$(awk '{print int($1)}' /proc/uptime 2>/dev/null || echo 0)

	json_add_string "hostname" "$hostname"
	json_add_int "uptime" "$uptime"
	json_add_string "version" "1.0.0"
	json_add_string "status" "running"

	# Add nested object
	json_add_object "cpu"
	local cpu_load=$(awk '{print $1}' /proc/loadavg 2>/dev/null || echo "0")
	json_add_string "load" "$cpu_load"
	json_add_int "usage" "45"
	json_close_object

	# Add timestamp
	json_add_string "timestamp" "$(date '+%Y-%m-%d %H:%M:%S')"

	json_dump
}

# Get data with array
get_data() {
	json_init
	json_add_array "data"

	# Example: List files
	for file in /etc/config/*; do
		[ -f "$file" ] || continue
		local name=$(basename "$file")

		json_add_object ""
		json_add_string "name" "$name"
		json_add_string "path" "$file"
		json_add_int "size" "$(stat -c%s "$file" 2>/dev/null || echo 0)"
		json_close_object
	done

	json_close_array
	json_dump
}

# Perform action with parameters
perform_action() {
	# Read JSON input from stdin
	read -r input
	json_load "$input"

	# Extract parameters
	local action_type target
	json_get_var action_type action_type
	json_get_var target target
	json_cleanup

	# Validate parameters
	if [ -z "$action_type" ]; then
		json_init
		json_add_boolean "success" 0
		json_add_string "message" "Action type is required"
		json_dump
		return 1
	fi

	# Perform action based on type
	local result=0
	case "$action_type" in
		start)
			# Example: Start a service
			/etc/init.d/"$target" start >/dev/null 2>&1
			result=$?
			;;
		stop)
			# Example: Stop a service
			/etc/init.d/"$target" stop >/dev/null 2>&1
			result=$?
			;;
		restart)
			# Example: Restart a service
			/etc/init.d/"$target" restart >/dev/null 2>&1
			result=$?
			;;
		*)
			json_init
			json_add_boolean "success" 0
			json_add_string "message" "Invalid action: $action_type"
			json_dump
			return 1
			;;
	esac

	# Return result
	json_init
	if [ "$result" -eq 0 ]; then
		json_add_boolean "success" 1
		json_add_string "message" "Action '$action_type' completed successfully"
	else
		json_add_boolean "success" 0
		json_add_string "message" "Action '$action_type' failed"
	fi
	json_dump
}

# Update configuration
update_config() {
	read -r input
	json_load "$input"

	local key value persist
	json_get_var key key
	json_get_var value value
	json_get_var persist persist
	json_cleanup

	# Validate
	if [ -z "$key" ] || [ -z "$value" ]; then
		json_init
		json_add_boolean "success" 0
		json_add_string "message" "Key and value are required"
		json_dump
		return 1
	fi

	# Update UCI config
	uci set <module-name>.general."$key"="$value"

	if [ "$persist" = "1" ]; then
		uci commit <module-name>
	fi

	json_init
	json_add_boolean "success" 1
	json_add_string "message" "Configuration updated"
	json_dump
}

# ============================================================================
# Main Dispatcher
# ============================================================================

case "$1" in
	list)
		# List all available methods with their parameters
		cat << 'EOF'
{
	"status": {},
	"get_data": {},
	"perform_action": {
		"action_type": "string",
		"target": "string"
	},
	"update_config": {
		"key": "string",
		"value": "string",
		"persist": 1
	}
}
EOF
		;;
	call)
		# Route to the appropriate method
		case "$2" in
			status) status ;;
			get_data) get_data ;;
			perform_action) perform_action ;;
			update_config) update_config ;;
			*)
				# Unknown method
				json_init
				json_add_boolean "success" 0
				json_add_string "error" "Unknown method: $2"
				json_dump
				;;
		esac
		;;
esac
```

**Key Points:**
- Always start with `#!/bin/sh`
- Source `/lib/functions.sh` and `/usr/share/libubox/jshn.sh`
- Use `json_init`, `json_add_*`, `json_dump` for JSON output
- Read parameters from stdin using `read -r input` and `json_load`
- Always validate input parameters
- Return proper success/error status
- Implement `list` case to declare all methods and parameters
- Implement `call` case to route to method handlers

---

## Menu JSON Template

**File:** `root/usr/share/luci/menu.d/luci-app-<module-name>.json`

```json
{
	"admin/secubox/<category>/<module-name>": {
		"title": "Module Title",
		"order": 10,
		"action": {
			"type": "firstchild"
		},
		"depends": {
			"acl": ["luci-app-<module-name>"]
		}
	},
	"admin/secubox/<category>/<module-name>/overview": {
		"title": "Overview",
		"order": 1,
		"action": {
			"type": "view",
			"path": "<module-name>/overview"
		}
	},
	"admin/secubox/<category>/<module-name>/settings": {
		"title": "Settings",
		"order": 2,
		"action": {
			"type": "view",
			"path": "<module-name>/settings"
		}
	}
}
```

**Categories:**
- `security` - Security & monitoring modules (CrowdSec, Auth Guardian)
- `monitoring` - Monitoring modules (Netdata)
- `network` - Network modules (Netifyd, Network Modes, WireGuard)
- `system` - System modules (System Hub)
- `services` - Service modules (CDN Cache, VHost Manager)

**Key Points:**
- Menu paths follow `admin/secubox/<category>/<module-name>`
- First entry uses `"type": "firstchild"` to redirect to first child
- Subsequent entries use `"type": "view"` with `"path"` matching view file location
- Path MUST match: `"path": "<module-name>/overview"` → `view/<module-name>/overview.js`
- Order determines menu position (lower numbers first)
- Depends on ACL entry matching package name

---

## ACL JSON Template

**File:** `root/usr/share/rpcd/acl.d/luci-app-<module-name>.json`

```json
{
	"luci-app-<module-name>": {
		"description": "Module Title - Brief Description",
		"read": {
			"ubus": {
				"luci.<module-name>": [
					"status",
					"get_data",
					"get_config",
					"list_items"
				]
			},
			"uci": ["<module-name>"]
		},
		"write": {
			"ubus": {
				"luci.<module-name>": [
					"perform_action",
					"update_config",
					"delete_item",
					"restart_service"
				]
			},
			"uci": ["<module-name>"]
		}
	}
}
```

**Key Points:**
- ACL entry name MUST match package name
- `read` section lists methods that can be called without write permissions
- `write` section lists methods that modify state
- ubus object names MUST match RPCD script name (`luci.<module-name>`)
- UCI config access can be granted separately
- All method names MUST exactly match those defined in RPCD script

---

## CSS Styling Template

**File:** `htdocs/luci-static/resources/<module-name>/dashboard.css`

```css
/**
 * [Module Name] Dashboard Styles
 * Extends system-hub/common.css design system
 * Version: 1.0.0
 */

/* ============================================================================
   IMPORTANT: Import common.css for design system variables
   ============================================================================ */
@import url('../system-hub/common.css');

/* ============================================================================
   Module-Specific Styles
   ============================================================================ */

/* Container */
.module-dashboard {
	padding: 24px;
	background: var(--sh-bg-primary);
	min-height: 100vh;
}

/* Stats Grid */
.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 20px;
	margin: 24px 0;
}

/* Metric Card */
.sh-metric-card {
	background: var(--sh-bg-card);
	border: 1px solid var(--sh-border);
	border-radius: 16px;
	padding: 24px;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.sh-metric-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 3px;
	background: linear-gradient(90deg, var(--sh-primary), var(--sh-primary-end));
	opacity: 0;
	transition: opacity 0.3s ease;
}

.sh-metric-card:hover {
	transform: translateY(-3px);
	box-shadow: 0 12px 28px var(--sh-hover-shadow);
}

.sh-metric-card:hover::before {
	opacity: 1;
}

/* Metric status variants */
.sh-metric-ok::before {
	background: var(--sh-success);
	opacity: 1;
}

.sh-metric-warning::before {
	background: var(--sh-warning);
	opacity: 1;
}

.sh-metric-critical::before {
	background: var(--sh-danger);
	opacity: 1;
}

/* Metric Header */
.sh-metric-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
}

.sh-metric-icon {
	font-size: 28px;
	line-height: 1;
}

.sh-metric-title {
	font-size: 16px;
	font-weight: 600;
	color: var(--sh-text-secondary);
}

/* Metric Value */
.sh-metric-value {
	font-size: 40px;
	font-weight: 700;
	font-family: 'JetBrains Mono', monospace;
	color: var(--sh-text-primary);
	margin-bottom: 12px;
}

/* Metric Progress Bar */
.sh-metric-progress {
	width: 100%;
	height: 8px;
	background: var(--sh-bg-tertiary);
	border-radius: 4px;
	overflow: hidden;
	margin-bottom: 8px;
}

.sh-metric-progress-bar {
	height: 100%;
	background: var(--sh-primary);
	transition: width 0.5s ease;
	border-radius: 4px;
}

/* Metric Details */
.sh-metric-details {
	font-size: 14px;
	color: var(--sh-text-secondary);
	font-weight: 500;
}

/* Content Grid */
.content-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 24px;
	margin-top: 24px;
}

/* Component List */
.component-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.component-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	background: var(--sh-bg-secondary);
	border: 1px solid var(--sh-border);
	border-radius: 12px;
	transition: all 0.2s ease;
	position: relative;
	overflow: hidden;
}

.component-item::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 3px;
	background: var(--sh-primary);
	opacity: 0;
	transition: opacity 0.3s ease;
}

.component-item:hover {
	transform: translateX(4px);
	border-color: var(--sh-primary);
}

.component-item:hover::before {
	opacity: 1;
}

.component-name {
	font-size: 16px;
	font-weight: 600;
	color: var(--sh-text-primary);
	flex: 1;
}

.component-status {
	font-size: 14px;
	color: var(--sh-text-secondary);
	margin: 0 16px;
}

.component-actions {
	display: flex;
	gap: 8px;
}

/* Quick Actions */
.quick-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

/* Activity Log */
.activity-log {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.activity-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: var(--sh-bg-secondary);
	border-radius: 8px;
	font-size: 14px;
}

.activity-time {
	font-family: 'JetBrains Mono', monospace;
	color: var(--sh-text-secondary);
	font-size: 12px;
	min-width: 80px;
}

.activity-text {
	color: var(--sh-text-primary);
	flex: 1;
}

/* ============================================================================
   Button Variants (Small Size)
   ============================================================================ */

.sh-btn-sm {
	padding: 6px 12px;
	font-size: 12px;
}

/* ============================================================================
   Responsive Design
   ============================================================================ */

@media (max-width: 768px) {
	.module-dashboard {
		padding: 16px;
	}

	.stats-grid,
	.content-grid {
		grid-template-columns: 1fr;
	}

	.component-item {
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.component-actions {
		width: 100%;
	}

	.sh-metric-value {
		font-size: 32px;
	}
}

/* ============================================================================
   Dark Mode Enhancements
   ============================================================================ */

[data-theme="dark"] .module-dashboard {
	background: var(--sh-bg-primary);
}

[data-theme="dark"] .component-item,
[data-theme="dark"] .activity-item {
	background: var(--sh-bg-secondary);
	border-color: var(--sh-border);
}

[data-theme="dark"] .component-item:hover {
	background: var(--sh-bg-tertiary);
}
```

**Key Points:**
- Always import `system-hub/common.css` for design system variables
- Use CSS variables (`var(--sh-*)`) instead of hardcoded colors
- Support dark mode with `[data-theme="dark"]` selectors
- Use responsive grid layouts (`grid-template-columns: repeat(auto-fit, minmax(...))`)
- Add smooth transitions for better UX
- Use JetBrains Mono for numeric values
- Follow mobile-first responsive design

---

## Complete Implementation Example

Here's a complete minimal working example for a new module called "Example Dashboard":

### Directory Structure
```
luci-app-example-dashboard/
├── Makefile
├── htdocs/luci-static/resources/
│   ├── example-dashboard/
│   │   ├── api.js
│   │   └── dashboard.css
│   └── view/example-dashboard/
│       └── overview.js
└── root/
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.example-dashboard
        └── share/
            ├── luci/menu.d/
            │   └── luci-app-example-dashboard.json
            └── rpcd/acl.d/
                └── luci-app-example-dashboard.json
```

### api.js
```javascript
'use strict';
'require baseclass';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.example-dashboard',
	method: 'status',
	expect: {}
});

return baseclass.extend({
	getStatus: callStatus
});
```

### overview.js
```javascript
'use strict';
'require view';
'require example-dashboard/api as API';

return view.extend({
	load: function() {
		return API.getStatus();
	},

	render: function(data) {
		return E('div', {}, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('example-dashboard/dashboard.css') }),
			E('h2', {}, 'Example Dashboard'),
			E('p', {}, 'Status: ' + (data.status || 'Unknown'))
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
```

### luci.example-dashboard (RPCD)
```bash
#!/bin/sh
. /usr/share/libubox/jshn.sh

status() {
	json_init
	json_add_string "status" "running"
	json_add_string "version" "1.0.0"
	json_dump
}

case "$1" in
	list)
		echo '{"status":{}}'
		;;
	call)
		case "$2" in
			status) status ;;
		esac
		;;
esac
```

### menu.d/luci-app-example-dashboard.json
```json
{
	"admin/secubox/monitoring/example-dashboard": {
		"title": "Example Dashboard",
		"order": 50,
		"action": {
			"type": "firstchild"
		},
		"depends": {
			"acl": ["luci-app-example-dashboard"]
		}
	},
	"admin/secubox/monitoring/example-dashboard/overview": {
		"title": "Overview",
		"order": 1,
		"action": {
			"type": "view",
			"path": "example-dashboard/overview"
		}
	}
}
```

### acl.d/luci-app-example-dashboard.json
```json
{
	"luci-app-example-dashboard": {
		"description": "Example Dashboard",
		"read": {
			"ubus": {
				"luci.example-dashboard": ["status"]
			}
		}
	}
}
```

### dashboard.css
```css
@import url('../system-hub/common.css');

div {
	padding: 20px;
}
```

**Installation Steps:**
1. Copy files to module directory
2. Set RPCD permissions: `chmod +x root/usr/libexec/rpcd/luci.example-dashboard`
3. Validate: `./secubox-tools/validate-modules.sh`
4. Build: `./secubox-tools/local-build.sh build luci-app-example-dashboard`
5. Deploy: `scp build/x86-64/*.ipk root@router:/tmp/`
6. Install: `ssh root@router "opkg install /tmp/luci-app-example-dashboard*.ipk && /etc/init.d/rpcd restart"`

---

## Common Pitfalls and Solutions

### 1. RPCD "Object not found" Error
**Error:** `RPC call to luci.example-dashboard/status failed with error -32000: Object not found`

**Solutions:**
- Check RPCD script name matches ubus object name exactly (including `luci.` prefix)
- Verify RPCD script is executable: `chmod +x root/usr/libexec/rpcd/luci.example-dashboard`
- Restart RPCD service: `/etc/init.d/rpcd restart`
- Check RPCD logs: `logread | grep rpcd`

### 2. HTTP 404 View Not Found
**Error:** `HTTP error 404 while loading class file '/luci-static/resources/view/example-dashboard/overview.js'`

**Solutions:**
- Verify menu path matches view file location exactly
- Menu: `"path": "example-dashboard/overview"` → File: `view/example-dashboard/overview.js`
- Check file permissions: `644` for CSS/JS files
- Clear browser cache

### 3. ACL Permission Denied
**Error:** Access denied or missing permissions

**Solutions:**
- Verify ACL file exists in `root/usr/share/rpcd/acl.d/`
- Check ubus object name in ACL matches RPCD script name
- Restart RPCD: `/etc/init.d/rpcd restart`
- Check method is listed in appropriate section (read vs write)

### 4. CSS Not Loading
**Problem:** Styles not applied

**Solutions:**
- Verify CSS import path: `L.resource('example-dashboard/dashboard.css')`
- Check file permissions: `644`
- Import common.css: `@import url('../system-hub/common.css');`
- Clear browser cache
- Check browser console for 404 errors

### 5. Auto-Refresh Not Working
**Problem:** Poll not updating dashboard

**Solutions:**
- Verify poll.add() is called in render() method
- Check API calls in poll callback return Promises
- Ensure updateDashboard() method updates DOM correctly
- Use browser console to check for JavaScript errors

---

## Validation Checklist

Before deploying, always run these checks:

```bash
# 1. Fix permissions
./secubox-tools/fix-permissions.sh --local

# 2. Validate module structure
./secubox-tools/validate-modules.sh

# 3. Validate JSON syntax
find luci-app-example-dashboard -name "*.json" -exec jsonlint {} \;

# 4. Validate shell scripts
shellcheck luci-app-example-dashboard/root/usr/libexec/rpcd/*

# 5. Build locally
./secubox-tools/local-build.sh build luci-app-example-dashboard
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-12-27
**Maintainer:** CyberMind.fr
