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

	// Utilities
	formatBytes: formatBytes,
	formatUptime: formatUptime,
	getAppStatus: getAppStatus
});
