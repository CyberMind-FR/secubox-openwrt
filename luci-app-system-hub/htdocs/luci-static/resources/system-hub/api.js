'use strict';
'require baseclass';
'require rpc';

/**
 * System Hub API
 * Package: luci-app-system-hub
 * RPCD object: luci.system-hub
 */

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
	getSystemInfo: callGetSystemInfo,
	getHealth: callGetHealth,
	listServices: callListServices,
	serviceAction: callServiceAction,
	getLogs: callGetLogs,
	backupConfig: callBackupConfig,
	restoreConfig: callRestoreConfig,
	reboot: callReboot,
	getStorage: callGetStorage,
	formatUptime: formatUptime,
	formatBytes: formatBytes
});
