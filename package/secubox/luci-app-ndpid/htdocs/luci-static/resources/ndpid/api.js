'use strict';
'require baseclass';
'require rpc';

/**
 * nDPId API
 * Package: luci-app-ndpid
 * RPCD object: luci.ndpid
 */

var callServiceStatus = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_service_status',
	expect: { }
});

var callRealtimeFlows = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_realtime_flows',
	expect: { }
});

var callInterfaceStats = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_interface_stats',
	expect: { interfaces: [] }
});

var callTopApplications = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_top_applications',
	expect: { applications: [] }
});

var callTopProtocols = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_top_protocols',
	expect: { protocols: [] }
});

var callConfig = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_config',
	expect: { }
});

var callDashboard = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_dashboard',
	expect: { }
});

var callInterfaces = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_interfaces',
	expect: { interfaces: [], available: [] }
});

var callServiceStart = rpc.declare({
	object: 'luci.ndpid',
	method: 'service_start',
	expect: { success: false }
});

var callServiceStop = rpc.declare({
	object: 'luci.ndpid',
	method: 'service_stop',
	expect: { success: false }
});

var callServiceRestart = rpc.declare({
	object: 'luci.ndpid',
	method: 'service_restart',
	expect: { success: false }
});

var callServiceEnable = rpc.declare({
	object: 'luci.ndpid',
	method: 'service_enable',
	expect: { success: false }
});

var callServiceDisable = rpc.declare({
	object: 'luci.ndpid',
	method: 'service_disable',
	expect: { success: false }
});

var callUpdateConfig = rpc.declare({
	object: 'luci.ndpid',
	method: 'update_config',
	params: ['data'],
	expect: { success: false }
});

var callClearCache = rpc.declare({
	object: 'luci.ndpid',
	method: 'clear_cache',
	expect: { success: false }
});

function formatBytes(bytes) {
	if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num) {
	if (num === null || num === undefined) return '0';
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatUptime(seconds) {
	if (!seconds || seconds === 0) return 'Not running';
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor((seconds % 86400) / 3600);
	var minutes = Math.floor((seconds % 3600) / 60);
	var parts = [];
	if (days > 0) parts.push(days + 'd');
	if (hours > 0) parts.push(hours + 'h');
	if (minutes > 0) parts.push(minutes + 'm');
	return parts.length > 0 ? parts.join(' ') : '< 1m';
}

function getStatusClass(running) {
	return running ? 'active' : 'inactive';
}

function getStatusText(running) {
	return running ? 'Running' : 'Stopped';
}

return baseclass.extend({
	// Read methods
	getServiceStatus: callServiceStatus,
	getRealtimeFlows: callRealtimeFlows,
	getInterfaceStats: callInterfaceStats,
	getTopApplications: callTopApplications,
	getTopProtocols: callTopProtocols,
	getConfig: callConfig,
	getDashboard: callDashboard,
	getInterfaces: callInterfaces,

	// Write methods
	serviceStart: callServiceStart,
	serviceStop: callServiceStop,
	serviceRestart: callServiceRestart,
	serviceEnable: callServiceEnable,
	serviceDisable: callServiceDisable,
	updateConfig: callUpdateConfig,
	clearCache: callClearCache,

	// Utility functions
	formatBytes: formatBytes,
	formatNumber: formatNumber,
	formatUptime: formatUptime,
	getStatusClass: getStatusClass,
	getStatusText: getStatusText,

	// Aggregate function for dashboard
	getAllData: function() {
		return Promise.all([
			callDashboard(),
			callInterfaceStats(),
			callTopApplications(),
			callTopProtocols()
		]).then(function(results) {
			return {
				dashboard: results[0] || {},
				interfaces: results[1] || { interfaces: [] },
				applications: results[2] || { applications: [] },
				protocols: results[3] || { protocols: [] }
			};
		});
	}
});
