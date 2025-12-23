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
	expect: { }
});

var callGetSystemInfo = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_system_info',
	expect: { }
});

var callGetServices = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_services',
	expect: { services: [] }
});

var callRestartService = rpc.declare({
	object: 'luci.system-hub',
	method: 'restart_service',
	params: ['service']
});

var callGetHealth = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_health',
	expect: { checks: [] }
});

var callGetRemoteAccess = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_remote_access',
	expect: { }
});

var callSetRemoteAccess = rpc.declare({
	object: 'luci.system-hub',
	method: 'set_remote_access',
	params: ['enabled', 'port', 'allowed_ips']
});

var callGetLogs = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_logs',
	params: ['lines', 'filter'],
	expect: { logs: [] }
});

var callGetDiagnostics = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_diagnostics',
	expect: { }
});

function formatUptime(seconds) {
	if (!seconds) return '0s';
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
	if (h > 0) return h + 'h ' + m + 'm';
	return m + 'm';
}

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

return baseclass.extend({
	getStatus: callStatus,
	getSystemInfo: callGetSystemInfo,
	getServices: callGetServices,
	restartService: callRestartService,
	getHealth: callGetHealth,
	getRemoteAccess: callGetRemoteAccess,
	setRemoteAccess: callSetRemoteAccess,
	getLogs: callGetLogs,
	getDiagnostics: callGetDiagnostics,
	formatUptime: formatUptime,
	formatBytes: formatBytes
});
