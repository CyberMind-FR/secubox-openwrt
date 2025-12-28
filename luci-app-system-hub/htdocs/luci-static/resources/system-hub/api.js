'use strict';
'require baseclass';
'require rpc';

/**
 * System Hub API
 * Package: luci-app-system-hub
 * RPCD object: luci.system-hub
 * Version: 0.3.6
 */

// Debug log to verify correct version is loaded
console.log('🔧 System Hub API v0.3.6 loaded at', new Date().toISOString());

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

var callCollectDiagnostics = rpc.declare({
	object: 'luci.system-hub',
	method: 'collect_diagnostics',
	params: ['include_logs', 'include_config', 'include_network', 'anonymize'],
	expect: {}
});

var callListDiagnostics = rpc.declare({
	object: 'luci.system-hub',
	method: 'list_diagnostics',
	expect: {}
});

var callDownloadDiagnostic = rpc.declare({
	object: 'luci.system-hub',
	method: 'download_diagnostic',
	params: ['name'],
	expect: {}
});

var callDeleteDiagnostic = rpc.declare({
	object: 'luci.system-hub',
	method: 'delete_diagnostic',
	params: ['name'],
	expect: {}
});

var callRunDiagnosticTest = rpc.declare({
	object: 'luci.system-hub',
	method: 'run_diagnostic_test',
	params: ['test'],
	expect: {}
});

var callUploadDiagnostics = rpc.declare({
	object: 'luci.system-hub',
	method: 'upload_diagnostics',
	params: ['name'],
	expect: {}
});

var callRemoteStatus = rpc.declare({
	object: 'luci.system-hub',
	method: 'remote_status',
	expect: {}
});

var callRemoteInstall = rpc.declare({
	object: 'luci.system-hub',
	method: 'remote_install',
	expect: {}
});

var callRemoteConfigure = rpc.declare({
	object: 'luci.system-hub',
	method: 'remote_configure',
	params: ['relay_server', 'relay_key', 'rustdesk_enabled'],
	expect: {}
});

var callRemoteGetCredentials = rpc.declare({
	object: 'luci.system-hub',
	method: 'remote_get_credentials',
	expect: {}
});

var callRemoteServiceAction = rpc.declare({
	object: 'luci.system-hub',
	method: 'remote_service_action',
	params: ['action'],
	expect: {}
});

var callRemoteSaveSettings = rpc.declare({
	object: 'luci.system-hub',
	method: 'remote_save_settings',
	params: ['allow_unattended', 'require_approval', 'notify_on_connect'],
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
	saveSettings: callSaveSettings,

	collectDiagnostics: function(includeLogs, includeConfig, includeNetwork, anonymize) {
		return callCollectDiagnostics({
			include_logs: includeLogs ? 1 : 0,
			include_config: includeConfig ? 1 : 0,
			include_network: includeNetwork ? 1 : 0,
			anonymize: anonymize ? 1 : 0
		});
	},

	listDiagnostics: callListDiagnostics,
	downloadDiagnostic: function(name) {
		return callDownloadDiagnostic({ name: name });
	},
	deleteDiagnostic: function(name) {
		return callDeleteDiagnostic({ name: name });
	},
	runDiagnosticTest: function(test) {
		return callRunDiagnosticTest({ test: test });
	},

	uploadDiagnostics: function(name) {
		return callUploadDiagnostics({ name: name });
	},

	formatBytes: function(bytes) {
		if (!bytes || bytes <= 0)
			return '0 B';
		var units = ['B', 'KB', 'MB', 'GB'];
		var i = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
	},

	remoteStatus: callRemoteStatus,
	remoteInstall: callRemoteInstall,
	remoteConfigure: function(data) {
		return callRemoteConfigure(data);
	},
	remoteCredentials: callRemoteGetCredentials,
	remoteServiceAction: function(action) {
		return callRemoteServiceAction({ action: action });
	},
	remoteSaveSettings: function(data) {
		return callRemoteSaveSettings(data);
	}
});
