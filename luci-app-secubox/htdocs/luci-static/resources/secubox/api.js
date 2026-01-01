'use strict';
'require baseclass';
'require rpc';

/**
 * SecuBox Master API
 * Package: luci-app-secubox
 * RPCD object: luci.secubox
 */

// Version: 0.7.1 - Fixed RPCD method names

var callStatus = rpc.declare({
	object: 'luci.secubox',
	method: 'getStatus',
	expect: { }
});

var callModules = rpc.declare({
	object: 'luci.secubox',
	method: 'getModules',
	expect: {}
});

var callModulesByCategory = rpc.declare({
	object: 'luci.secubox',
	method: 'modules_by_category',
	params: ['category'],
	expect: {}
});

var callModuleInfo = rpc.declare({
	object: 'luci.secubox',
	method: 'getModuleInfo',
	params: ['module'],
	expect: { }
});

var callStartModule = rpc.declare({
	object: 'luci.secubox',
	method: 'start_module',
	params: ['module']
});

var callStopModule = rpc.declare({
	object: 'luci.secubox',
	method: 'stop_module',
	params: ['module']
});

var callRestartModule = rpc.declare({
	object: 'luci.secubox',
	method: 'restart_module',
	params: ['module']
});

// NEW v0.3.1: Enable/Disable module methods
var callEnableModule = rpc.declare({
	object: 'luci.secubox',
	method: 'enable_module',
	params: ['module'],
	expect: { success: false, message: '' }
});

var callDisableModule = rpc.declare({
	object: 'luci.secubox',
	method: 'disable_module',
	params: ['module'],
	expect: { success: false, message: '' }
});

var callCheckModuleEnabled = rpc.declare({
	object: 'luci.secubox',
	method: 'check_module_enabled',
	params: ['module'],
	expect: { enabled: false }
});

var callHealth = rpc.declare({
	object: 'luci.secubox',
	method: 'getHealth',
	expect: { checks: [], overall: '' }
});

var callDiagnostics = rpc.declare({
	object: 'luci.secubox',
	method: 'diagnostics',
	expect: { }
});

var callSystemHealth = rpc.declare({
	object: 'luci.secubox',
	method: 'get_system_health',
	expect: { }
});

var callAlerts = rpc.declare({
	object: 'luci.secubox',
	method: 'get_alerts',
	expect: { alerts: [] }
});

var callQuickAction = rpc.declare({
	object: 'luci.secubox',
	method: 'quick_action',
	params: ['action'],
	expect: { }
});

var callDashboardData = rpc.declare({
	object: 'luci.secubox',
	method: 'get_dashboard_data',
	expect: { }
});

var callGetTheme = rpc.declare({
	object: 'luci.secubox',
	method: 'get_theme',
	expect: { }
});

var callSetTheme = rpc.declare({
	object: 'luci.secubox',
	method: 'set_theme',
	params: ['theme'],
	expect: { success: false, theme: '' }
});

var callDismissAlert = rpc.declare({
	object: 'luci.secubox',
	method: 'dismiss_alert',
	params: ['alert_id'],
	expect: { }
});

var callClearAlerts = rpc.declare({
	object: 'luci.secubox',
	method: 'clear_alerts',
	expect: { }
});

var callFixPermissions = rpc.declare({
	object: 'luci.secubox',
	method: 'fix_permissions',
	expect: { success: false, message: '', output: '' }
});

var callFirstRunStatus = rpc.declare({
	object: 'luci.secubox',
	method: 'first_run_status',
	expect: { }
});

var callApplyFirstRun = rpc.declare({
	object: 'luci.secubox',
	method: 'apply_first_run'
});

var callListApps = rpc.declare({
	object: 'luci.secubox',
	method: 'list_apps',
	expect: { apps: [] }
});

var callGetAppManifest = rpc.declare({
	object: 'luci.secubox',
	method: 'get_app_manifest',
	params: ['app_id']
});

var callApplyAppWizard = rpc.declare({
	object: 'luci.secubox',
	method: 'apply_app_wizard',
	params: ['app_id', 'values']
});

var callListProfiles = rpc.declare({
	object: 'luci.secubox',
	method: 'list_profiles',
	expect: { profiles: [] }
});

var callApplyProfile = rpc.declare({
	object: 'luci.secubox',
	method: 'apply_profile',
	params: ['profile_id']
});

var callRollbackProfile = rpc.declare({
	object: 'luci.secubox',
	method: 'rollback_profile'
});

// App Store methods
var callGetAppstoreApps = rpc.declare({
	object: 'luci.secubox',
	method: 'get_appstore_apps',
	expect: { }
});

var callGetAppstoreApp = rpc.declare({
	object: 'luci.secubox',
	method: 'get_appstore_app',
	params: ['app_id'],
	expect: { }
});

var callInstallAppstoreApp = rpc.declare({
	object: 'luci.secubox',
	method: 'install_appstore_app',
	params: ['app_id'],
	expect: { success: false }
});

var callRemoveAppstoreApp = rpc.declare({
	object: 'luci.secubox',
	method: 'remove_appstore_app',
	params: ['app_id'],
	expect: { success: false }
});

function formatUptime(seconds) {
	if (!seconds) return '0s';
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	if (d > 0) return d + 'd ' + h + 'h';
	if (h > 0) return h + 'h ' + m + 'm';
	return m + 'm';
}

function formatBytes(bytes) {
	if (!bytes) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

return baseclass.extend({
	getStatus: callStatus,
	getModules: callModules,
	getModulesByCategory: callModulesByCategory,
	getModuleInfo: callModuleInfo,
	// DEPRECATED: Use enable/disable instead
	startModule: callStartModule,
	stopModule: callStopModule,
	restartModule: callRestartModule,
	// NEW v0.3.1: Enable/Disable methods
	enableModule: callEnableModule,
	disableModule: callDisableModule,
	checkModuleEnabled: callCheckModuleEnabled,
	// Health & diagnostics
	getHealth: callHealth,
	getDiagnostics: callDiagnostics,
	getSystemHealth: callSystemHealth,
	getAlerts: callAlerts,
	quickAction: callQuickAction,
	getDashboardData: callDashboardData,
	getTheme: callGetTheme,
	setTheme: callSetTheme,
	dismissAlert: callDismissAlert,
	clearAlerts: callClearAlerts,
	fixPermissions: callFixPermissions,
	getFirstRunStatus: callFirstRunStatus,
	applyFirstRun: callApplyFirstRun,
	listApps: callListApps,
	getAppManifest: callGetAppManifest,
	applyAppWizard: callApplyAppWizard,
	listProfiles: callListProfiles,
	applyProfile: callApplyProfile,
	rollbackProfile: callRollbackProfile,
	// App Store
	getAppstoreApps: callGetAppstoreApps,
	getAppstoreApp: callGetAppstoreApp,
	installAppstoreApp: callInstallAppstoreApp,
	removeAppstoreApp: callRemoveAppstoreApp,
	// Utilities
	formatUptime: formatUptime,
	formatBytes: formatBytes
});
