'use strict';
'require baseclass';
'require rpc';

/**
 * Netdata Dashboard API
 * Package: luci-app-netdata-dashboard
 * RPCD object: luci.netdata-dashboard
 */

// Version: 0.2.2

// System stats methods (from RPCD backend)
var callStats = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'stats',
	expect: { }
});

var callCPU = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'cpu',
	expect: { }
});

var callMemory = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'memory',
	expect: { }
});

var callDisk = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'disk',
	expect: { }
});

var callNetwork = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'network',
	expect: { }
});

var callProcesses = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'processes',
	expect: { }
});

var callSensors = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'sensors',
	expect: { }
});

var callSystem = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'system',
	expect: { }
});

// Netdata integration methods
var callNetdataStatus = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'netdata_status',
	expect: { }
});

var callNetdataAlarms = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'netdata_alarms',
	expect: { }
});

var callNetdataInfo = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'netdata_info',
	expect: { }
});

var callRestartNetdata = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'restart_netdata',
	expect: { success: false }
});

var callStartNetdata = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'start_netdata',
	expect: { success: false }
});

var callStopNetdata = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'stop_netdata',
	expect: { success: false }
});

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024));
	i = Math.min(i, units.length - 1);
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function formatUptime(seconds) {
	if (!seconds) return '0s';
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	var parts = [];
	if (d > 0) parts.push(d + 'd');
	if (h > 0) parts.push(h + 'h');
	if (m > 0) parts.push(m + 'm');
	return parts.join(' ') || '0m';
}

return baseclass.extend({
	// System stats
	getStats: callStats,
	getCPU: callCPU,
	getMemory: callMemory,
	getDisk: callDisk,
	getNetwork: callNetwork,
	getProcesses: callProcesses,
	getSensors: callSensors,
	getSystem: callSystem,

	// Netdata integration
	getNetdataStatus: callNetdataStatus,
	getNetdataAlarms: callNetdataAlarms,
	getNetdataInfo: callNetdataInfo,
	restartNetdata: callRestartNetdata,
	startNetdata: callStartNetdata,
	stopNetdata: callStopNetdata,

	// Utility functions
	formatBytes: formatBytes,
	formatUptime: formatUptime
});
