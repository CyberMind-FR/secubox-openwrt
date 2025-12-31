'use strict';
'require baseclass';
'require rpc';

/**
 * Netdata Dashboard API
 * Package: luci-app-netdata-dashboard
 * RPCD object: luci.netdata-dashboard
 */

// Version: 0.4.0

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

var callSecuboxLogs = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'seccubox_logs',
	expect: { }
});

var callCollectDebug = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'collect_debug',
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

function formatKB(kb) {
	if (!kb || kb === 0) return '0 KB';
	var units = ['KB', 'MB', 'GB', 'TB'];
	var i = 0;
	var size = kb;
	while (size >= 1024 && i < units.length - 1) {
		size = size / 1024;
		i++;
	}
	return size.toFixed(2) + ' ' + units[i];
}

function getStatusClass(percent) {
	if (percent >= 90) return 'critical';
	if (percent >= 75) return 'warning';
	if (percent >= 50) return 'info';
	return 'good';
}

function getTempClass(temp) {
	if (!temp) return 'good';
	if (temp >= 80) return 'critical';
	if (temp >= 70) return 'warning';
	if (temp >= 60) return 'info';
	return 'good';
}

return baseclass.extend({
	// System stats
	getStats: callStats,
	getCPU: callCPU,
	getCpu: callCPU,  // Alias for consistency
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
	getSecuboxLogs: callSecuboxLogs,
	collectDebugSnapshot: callCollectDebug,

	// Combined data fetch for dashboard
	getAllData: function() {
		return Promise.all([
			callStats(),
			callCPU(),
			callMemory(),
			callDisk(),
			callNetwork(),
			callProcesses(),
			callSystem()
		]).then(function(results) {
			return {
				stats: results[0] || {},
				cpu: results[1] || {},
				memory: results[2] || {},
				disk: results[3] || {},
				network: results[4] || {},
				processes: results[5] || {},
				system: results[6] || {}
			};
		});
	},

	// Utility functions
	formatBytes: formatBytes,
	formatKB: formatKB,
	formatUptime: formatUptime,
	getStatusClass: getStatusClass,
	getTempClass: getTempClass
});
