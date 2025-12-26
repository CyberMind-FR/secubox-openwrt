'use strict';
'require baseclass';
'require rpc';

/**
 * System Hub API
 * Package: luci-app-system-hub
 * RPCD object: luci.system-hub
 * Version: 0.1.1
 */

// Debug log to verify correct version is loaded
console.log('🔧 System Hub API v0.1.1 loaded at', new Date().toISOString());

var callStatus = rpc.declare({
	object: 'luci.system-hub',
	method: 'status',
	expect: {}
});

var callGetSystemInfo = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_system_info',
	expect: {}
});

var callGetHealth = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_health',
	expect: {}
});

var callListServices = rpc.declare({
	object: 'luci.system-hub',
	method: 'list_services',
	expect: { services: [] }
});

var callServiceAction = rpc.declare({
	object: 'luci.system-hub',
	method: 'service_action',
	params: ['service', 'action'],
	expect: {}
});

var callGetLogs = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_logs',
	params: ['lines', 'filter'],
	expect: { logs: [] }
});

var callBackupConfig = rpc.declare({
	object: 'luci.system-hub',
	method: 'backup_config',
	expect: {}
});

var callRestoreConfig = rpc.declare({
	object: 'luci.system-hub',
	method: 'restore_config',
	params: ['data'],
	expect: {}
});

var callReboot = rpc.declare({
	object: 'luci.system-hub',
	method: 'reboot',
	expect: {}
});

var callGetStorage = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_storage',
	expect: { storage: [] }
});

var callGetSettings = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_settings',
	expect: {}
});

var callSaveSettings = rpc.declare({
	object: 'luci.system-hub',
	method: 'save_settings',
	params: ['auto_refresh', 'health_check', 'debug_mode', 'refresh_interval', 'log_retention', 'cpu_warning', 'cpu_critical', 'mem_warning', 'mem_critical', 'disk_warning', 'disk_critical', 'temp_warning', 'temp_critical'],
	expect: {}
});

var callGetComponents = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_components',
	expect: {}
});

var callGetComponentsByCategory = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_components_by_category',
	params: ['category'],
	expect: {}
});

return baseclass.extend({
	// RPC methods - exposed via ubus
	getStatus: callStatus,
	getSystemInfo: callGetSystemInfo,
	getHealth: callGetHealth,
	getComponents: callGetComponents,
	getComponentsByCategory: callGetComponentsByCategory,
	listServices: callListServices,
	serviceAction: callServiceAction,
	getLogs: callGetLogs,
	backupConfig: callBackupConfig,
	restoreConfig: callRestoreConfig,
	reboot: callReboot,
	getStorage: callGetStorage,
	getSettings: callGetSettings,
	saveSettings: callSaveSettings
});
