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

// Catalog Sources
var callGetCatalogSources = rpc.declare({
	object: 'luci.secubox',
	method: 'get_catalog_sources',
	expect: { sources: [] }
});

var callSetCatalogSource = rpc.declare({
	object: 'luci.secubox',
	method: 'set_catalog_source',
	params: ['source'],
	expect: { success: false }
});

var callSyncCatalog = rpc.declare({
	object: 'luci.secubox',
	method: 'sync_catalog',
	params: ['source'],
	expect: { success: false }
});

// Version Management
var callCheckUpdates = rpc.declare({
	object: 'luci.secubox',
	method: 'check_updates',
	expect: { }
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

// Export API
return baseclass.extend({
	// Apps
	getApps: callGetApps,
	installApp: callInstallApp,
	removeApp: callRemoveApp,

	// Modules
	getModules: callGetModules,
	enableModule: callEnableModule,
	disableModule: callDisableModule,

	// System
	getHealth: callGetHealth,
	getAlerts: callGetAlerts,
	getLogs: callGetLogs,

	// Catalog Sources
	getCatalogSources: callGetCatalogSources,
	setCatalogSource: callSetCatalogSource,
	syncCatalog: callSyncCatalog,

	// Version Management
	checkUpdates: callCheckUpdates,
	getAppVersions: callGetAppVersions,
	getChangelog: callGetChangelog,

	// Widget Data
	getWidgetData: callGetWidgetData,

	// Utilities
	formatBytes: formatBytes,
	formatUptime: formatUptime,
	getAppStatus: getAppStatus
});
