'use strict';
'require baseclass';
'require rpc';

// App Management
var callGetApps = rpc.declare({
	object: 'luci.secubox',
	method: 'get_appstore_apps',
	expect: { apps: [] }
});

var callInstallApp = rpc.declare({
	object: 'luci.secubox',
	method: 'install_appstore_app',
	params: ['app_id'],
	expect: { success: false }
});

var callRemoveApp = rpc.declare({
	object: 'luci.secubox',
	method: 'remove_appstore_app',
	params: ['app_id'],
	expect: { success: false }
});

// Module Management
var callGetModules = rpc.declare({
	object: 'luci.secubox',
	method: 'getModules',
	expect: { modules: [] }
});

var callEnableModule = rpc.declare({
	object: 'luci.secubox',
	method: 'enable_module',
	params: ['module'],
	expect: { success: false }
});

var callDisableModule = rpc.declare({
	object: 'luci.secubox',
	method: 'disable_module',
	params: ['module'],
	expect: { success: false }
});

// System Health
var callGetHealth = rpc.declare({
	object: 'luci.secubox',
	method: 'get_system_health',
	expect: { }
});

var callGetAlerts = rpc.declare({
	object: 'luci.secubox',
	method: 'get_alerts',
	expect: { alerts: [] }
});

// Logs
var callGetLogs = rpc.declare({
	object: 'luci.secubox',
	method: 'getLogs',
	params: ['service', 'lines'],
	expect: { logs: '' }
});

// Catalog Sources (with optimized timeout)
var callGetCatalogSources = rpc.declare({
	object: 'luci.secubox',
	method: 'get_catalog_sources',
	expect: { sources: [] },
	timeout: 15000  // 15 seconds (optimized backend with caching)
});

var callSetCatalogSource = rpc.declare({
	object: 'luci.secubox',
	method: 'set_catalog_source',
	params: ['source'],
	expect: { success: false },
	timeout: 20000  // 20 seconds
});

var callSyncCatalog = rpc.declare({
	object: 'luci.secubox',
	method: 'sync_catalog',
	params: ['source'],
	expect: { success: false },
	timeout: 90000  // Sync can take longer (90s for slow connections)
});

// Version Management (with optimized timeout)
var callCheckUpdates = rpc.declare({
	object: 'luci.secubox',
	method: 'check_updates',
	expect: { },
	timeout: 20000  // 20 seconds (optimized with persistent cache)
});

var callGetAppVersions = rpc.declare({
	object: 'luci.secubox',
	method: 'get_app_versions',
	params: ['app_id'],
	expect: { }
});

var callGetChangelog = rpc.declare({
	object: 'luci.secubox',
	method: 'get_changelog',
	params: ['app_id', 'from_version', 'to_version'],
	expect: { }
});

// Widget Data
var callGetWidgetData = rpc.declare({
	object: 'luci.secubox',
	method: 'get_widget_data',
	params: ['app_id'],
	expect: { }
});

// Services Discovery
var callGetServices = rpc.declare({
	object: 'luci.secubox',
	method: 'get_services',
	expect: { services: [] }
});

// ===== State Management API =====

var callGetComponentState = rpc.declare({
	object: 'luci.secubox',
	method: 'get_component_state',
	params: ['component_id'],
	expect: { }
});

var callSetComponentState = rpc.declare({
	object: 'luci.secubox',
	method: 'set_component_state',
	params: ['component_id', 'new_state', 'reason'],
	expect: { success: false }
});

var callGetStateHistory = rpc.declare({
	object: 'luci.secubox',
	method: 'get_state_history',
	params: ['component_id', 'limit'],
	expect: { history: [] }
});

var callListComponents = rpc.declare({
	object: 'luci.secubox',
	method: 'list_components',
	params: ['state_filter', 'type_filter'],
	expect: { components: [] }
});

var callFreezeComponent = rpc.declare({
	object: 'luci.secubox',
	method: 'freeze_component',
	params: ['component_id', 'reason'],
	expect: { success: false }
});

var callClearErrorState = rpc.declare({
	object: 'luci.secubox',
	method: 'clear_error_state',
	params: ['component_id'],
	expect: { success: false }
});

// ===== Component Registry API =====

var callGetComponent = rpc.declare({
	object: 'luci.secubox',
	method: 'get_component',
	params: ['component_id'],
	expect: { }
});

var callGetComponentTree = rpc.declare({
	object: 'luci.secubox',
	method: 'get_component_tree',
	params: ['component_id'],
	expect: { }
});

var callUpdateComponentSettings = rpc.declare({
	object: 'luci.secubox',
	method: 'update_component_settings',
	params: ['component_id', 'settings'],
	expect: { success: false }
});

var callListComponentsByType = rpc.declare({
	object: 'luci.secubox',
	method: 'list_components',
	params: ['state_filter', 'type_filter', 'profile_filter'],
	expect: { components: [] }
});

var callValidateComponentState = rpc.declare({
	object: 'luci.secubox',
	method: 'validate_component_state',
	params: ['component_id'],
	expect: { valid: true }
});

// ===== Feed Management API =====

var callListFeeds = rpc.declare({
	object: 'luci.secubox',
	method: 'list_feeds',
	expect: { feeds: [] }
});

var callAddFeed = rpc.declare({
	object: 'luci.secubox',
	method: 'add_feed',
	params: ['name', 'url', 'feed_type', 'visibility'],
	expect: { success: false }
});

var callRemoveFeed = rpc.declare({
	object: 'luci.secubox',
	method: 'remove_feed',
	params: ['feed_id'],
	expect: { success: false }
});

var callShareFeed = rpc.declare({
	object: 'luci.secubox',
	method: 'share_feed',
	params: ['feed_id'],
	expect: { share_url: '' }
});

var callImportFeed = rpc.declare({
	object: 'luci.secubox',
	method: 'import_feed',
	params: ['share_url'],
	expect: { success: false }
});

// ===== Profile Management API =====

var callExportProfile = rpc.declare({
	object: 'luci.secubox',
	method: 'export_profile',
	params: ['name', 'include_feeds'],
	expect: { profile: {} }
});

var callImportProfile = rpc.declare({
	object: 'luci.secubox',
	method: 'import_profile',
	params: ['profile_data', 'mode'],
	expect: { success: false }
});

var callShareProfile = rpc.declare({
	object: 'luci.secubox',
	method: 'share_profile',
	params: ['profile_id'],
	expect: { share_url: '' }
});

// ===== Skill Management API =====

var callListSkills = rpc.declare({
	object: 'luci.secubox',
	method: 'list_skills',
	expect: { skills: [] }
});

var callGetSkillProviders = rpc.declare({
	object: 'luci.secubox',
	method: 'get_skill_providers',
	params: ['skill_id'],
	expect: { providers: [] }
});

var callInstallSkill = rpc.declare({
	object: 'luci.secubox',
	method: 'install_skill',
	params: ['skill_id'],
	expect: { success: false }
});

var callCheckSkills = rpc.declare({
	object: 'luci.secubox',
	method: 'check_skills',
	params: ['profile_id'],
	expect: { }
});

// ===== Feedback Management API =====

var callReportIssue = rpc.declare({
	object: 'luci.secubox',
	method: 'report_issue',
	params: ['app_id', 'issue_type', 'summary', 'description'],
	expect: { success: false, issue_id: '' }
});

var callResolveIssue = rpc.declare({
	object: 'luci.secubox',
	method: 'resolve_issue',
	params: ['issue_id', 'resolution'],
	expect: { success: false }
});

var callSearchResolutions = rpc.declare({
	object: 'luci.secubox',
	method: 'search_resolutions',
	params: ['keyword'],
	expect: { results: [] }
});

var callListIssues = rpc.declare({
	object: 'luci.secubox',
	method: 'list_issues',
	params: ['status'],
	expect: { issues: [] }
});

// Utility functions
function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds) {
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor((seconds % 86400) / 3600);
	var mins = Math.floor((seconds % 3600) / 60);
	return days + 'd ' + hours + 'h ' + mins + 'm';
}

function getAppStatus(app, modules) {
	// Determine if app is installed by checking modules
	var isInstalled = false;
	var isRunning = false;

	if (app.packages && app.packages.required) {
		for (var i = 0; i < app.packages.required.length; i++) {
			var pkg = app.packages.required[i];
			if (modules[pkg]) {
				isInstalled = true;
				isRunning = modules[pkg].running || false;
				break;
			}
		}
	}

	return {
		installed: isInstalled,
		running: isRunning,
		status: isRunning ? 'running' : (isInstalled ? 'stopped' : 'available')
	};
}

// Debug wrapper for RPC calls with retry logic
function debugRPC(name, call, options) {
	options = options || {};
	var maxRetries = options.retries || 2;
	var retryDelay = options.retryDelay || 1000;

	return function() {
		var args = Array.prototype.slice.call(arguments);
		var attemptCount = 0;
		var self = this;

		function attemptCall() {
			attemptCount++;
			console.log('[API-DEBUG] Calling:', name, 'with args:', args, '(attempt ' + attemptCount + ')');

			return call.apply(self, args).then(function(result) {
				console.log('[API-DEBUG] Success:', name, 'result:', result, '(attempt ' + attemptCount + ')');
				return result;
			}).catch(function(error) {
				console.error('[API-DEBUG] Error:', name, 'error:', error, '(attempt ' + attemptCount + '/' + (maxRetries + 1) + ')');
				console.error('[API-DEBUG] Error message:', error.message);
				console.error('[API-DEBUG] Error stack:', error.stack || 'no stack');

				// Retry on timeout errors
				if (attemptCount <= maxRetries && error.message && error.message.indexOf('timed out') !== -1) {
					console.warn('[API-DEBUG] Retrying', name, 'in', retryDelay, 'ms...');
					return new Promise(function(resolve) {
						setTimeout(function() {
							resolve(attemptCall());
						}, retryDelay);
					});
				}

				throw error;
			});
		}

		return attemptCall();
	};
}

// Export API with debug wrappers and retry logic
return baseclass.extend({
	// Apps
	getApps: debugRPC('getApps', callGetApps, { retries: 2, retryDelay: 1500 }),

	// Featured Apps
	getFeaturedApps: function() {
		var self = this;
		return this.getApps().then(function(apps) {
			if (!apps || !Array.isArray(apps)) {
				return [];
			}
			// Filter apps with featured=true and sort by priority
			return apps
				.filter(function(app) {
					return app.featured === true;
				})
				.sort(function(a, b) {
					var priorityA = a.featured_priority || 999;
					var priorityB = b.featured_priority || 999;
					return priorityA - priorityB;
				});
		}).catch(function(err) {
			console.error('[API] getFeaturedApps error:', err);
			return [];
		});
	},

	installApp: debugRPC('installApp', callInstallApp, { retries: 1 }),
	removeApp: debugRPC('removeApp', callRemoveApp, { retries: 1 }),

	// Modules
	getModules: debugRPC('getModules', callGetModules, { retries: 2, retryDelay: 1500 }),
	enableModule: debugRPC('enableModule', callEnableModule),
	disableModule: debugRPC('disableModule', callDisableModule),

	// System
	getHealth: debugRPC('getHealth', callGetHealth, { retries: 1 }),
	getAlerts: debugRPC('getAlerts', callGetAlerts, { retries: 1 }),
	getLogs: debugRPC('getLogs', callGetLogs),

	// Catalog Sources (critical - more retries)
	getCatalogSources: debugRPC('getCatalogSources', callGetCatalogSources, { retries: 3, retryDelay: 2000 }),
	setCatalogSource: debugRPC('setCatalogSource', callSetCatalogSource, { retries: 1 }),
	syncCatalog: debugRPC('syncCatalog', callSyncCatalog, { retries: 1 }),

	// Version Management (critical - more retries)
	checkUpdates: debugRPC('checkUpdates', callCheckUpdates, { retries: 3, retryDelay: 2000 }),
	getAppVersions: debugRPC('getAppVersions', callGetAppVersions, { retries: 1 }),
	getChangelog: debugRPC('getChangelog', callGetChangelog, { retries: 1 }),

	// Widget Data
	getWidgetData: debugRPC('getWidgetData', callGetWidgetData, { retries: 1 }),

	// Services Discovery
	getServices: debugRPC('getServices', callGetServices, { retries: 1 }),

	// ===== State Management =====
	getComponentState: debugRPC('getComponentState', callGetComponentState, { retries: 2 }),
	setComponentState: debugRPC('setComponentState', callSetComponentState, { retries: 1 }),
	getStateHistory: debugRPC('getStateHistory', callGetStateHistory, { retries: 1 }),
	listComponents: debugRPC('listComponents', callListComponents, { retries: 2, retryDelay: 1500 }),
	freezeComponent: debugRPC('freezeComponent', callFreezeComponent, { retries: 1 }),
	clearErrorState: debugRPC('clearErrorState', callClearErrorState, { retries: 1 }),

	// ===== Component Registry =====
	getComponent: debugRPC('getComponent', callGetComponent, { retries: 2 }),
	getComponentTree: debugRPC('getComponentTree', callGetComponentTree, { retries: 1 }),
	updateComponentSettings: debugRPC('updateComponentSettings', callUpdateComponentSettings, { retries: 1 }),
	listComponentsByType: debugRPC('listComponentsByType', callListComponentsByType, { retries: 2 }),
	validateComponentState: debugRPC('validateComponentState', callValidateComponentState, { retries: 1 }),

	// Enhanced component methods
	getComponentWithState: function(component_id) {
		var self = this;
		return Promise.all([
			this.getComponent(component_id),
			this.getComponentState(component_id)
		]).then(function(results) {
			var component = results[0];
			var state = results[1];
			return Object.assign({}, component, { state_info: state });
		}).catch(function(err) {
			console.error('[API] getComponentWithState error:', err);
			throw err;
		});
	},

	getAllComponentsWithStates: function(filters) {
		var self = this;
		filters = filters || {};

		return this.listComponents(filters.state, filters.type).then(function(components) {
			if (!components || !Array.isArray(components)) {
				return [];
			}

			// Fetch states for all components in parallel
			var statePromises = components.map(function(comp) {
				return self.getComponentState(comp.id || comp.component_id).catch(function(err) {
					console.warn('[API] Failed to get state for', comp.id, err);
					return null;
				});
			});

			return Promise.all(statePromises).then(function(states) {
				return components.map(function(comp, index) {
					return Object.assign({}, comp, { state_info: states[index] });
				});
			});
		}).catch(function(err) {
			console.error('[API] getAllComponentsWithStates error:', err);
			return [];
		});
	},

	// Bulk operations
	bulkSetComponentState: function(component_ids, new_state, reason) {
		var self = this;
		var promises = component_ids.map(function(id) {
			return self.setComponentState(id, new_state, reason).catch(function(err) {
				console.warn('[API] Failed to set state for', id, err);
				return { success: false, component_id: id, error: err };
			});
		});

		return Promise.all(promises);
	},

	// State statistics
	getStateStatistics: function() {
		var self = this;
		return this.listComponents(null, null).then(function(components) {
			if (!components || !Array.isArray(components)) {
				return { total: 0, by_state: {}, by_type: {}, by_category: {} };
			}

			var stats = {
				total: components.length,
				by_state: {},
				by_type: {},
				by_category: {}
			};

			components.forEach(function(comp) {
				// Count by state
				var state = comp.current_state || comp.state || 'unknown';
				stats.by_state[state] = (stats.by_state[state] || 0) + 1;

				// Count by type
				var type = comp.type || 'unknown';
				stats.by_type[type] = (stats.by_type[type] || 0) + 1;
			});

			return stats;
		}).catch(function(err) {
			console.error('[API] getStateStatistics error:', err);
			return { total: 0, by_state: {}, by_type: {}, by_category: {} };
		});
	},

	// ===== Feed Management =====
	listFeeds: debugRPC('listFeeds', callListFeeds, { retries: 2 }),
	addFeed: debugRPC('addFeed', callAddFeed, { retries: 1 }),
	removeFeed: debugRPC('removeFeed', callRemoveFeed, { retries: 1 }),
	shareFeed: debugRPC('shareFeed', callShareFeed, { retries: 1 }),
	importFeed: debugRPC('importFeed', callImportFeed, { retries: 1 }),

	// ===== Profile Management =====
	exportProfile: debugRPC('exportProfile', callExportProfile, { retries: 1 }),
	importProfile: debugRPC('importProfile', callImportProfile, { retries: 1 }),
	shareProfile: debugRPC('shareProfile', callShareProfile, { retries: 1 }),

	// ===== Skill Management =====
	listSkills: debugRPC('listSkills', callListSkills, { retries: 2 }),
	getSkillProviders: debugRPC('getSkillProviders', callGetSkillProviders, { retries: 1 }),
	installSkill: debugRPC('installSkill', callInstallSkill, { retries: 1 }),
	checkSkills: debugRPC('checkSkills', callCheckSkills, { retries: 1 }),

	// ===== Feedback Management =====
	reportIssue: debugRPC('reportIssue', callReportIssue, { retries: 1 }),
	resolveIssue: debugRPC('resolveIssue', callResolveIssue, { retries: 1 }),
	searchResolutions: debugRPC('searchResolutions', callSearchResolutions, { retries: 2 }),
	listIssues: debugRPC('listIssues', callListIssues, { retries: 2 }),

	// Utilities
	formatBytes: formatBytes,
	formatUptime: formatUptime,
	getAppStatus: getAppStatus
});
