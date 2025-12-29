'use strict';
'require baseclass';
'require rpc';

/**
 * Netifyd Dashboard API
 * Package: luci-app-netifyd-dashboard
 * RPCD object: luci.netifyd-dashboard
 */

// Version: 0.4.0

var callStatus = rpc.declare({
	object: 'luci.netifyd-dashboard',
	method: 'status',
	expect: { }
});

var callFlows = rpc.declare({
	object: 'luci.netifyd-dashboard',
	method: 'flows',
	expect: { flows: [] }
});

var callApplications = rpc.declare({
	object: 'luci.netifyd-dashboard',
	method: 'applications',
	expect: { applications: [] }
});

var callHosts = rpc.declare({
	object: 'luci.netifyd-dashboard',
	method: 'hosts',
	expect: { hosts: [] }
});

var callProtocols = rpc.declare({
	object: 'luci.netifyd-dashboard',
	method: 'protocols',
	expect: { protocols: [] }
});

var callStats = rpc.declare({
	object: 'luci.netifyd-dashboard',
	method: 'stats',
	expect: { }
});

var callSecuboxLogs = rpc.declare({
	object: 'luci.netifyd-dashboard',
	method: 'seccubox_logs',
	expect: { }
});

var callCollectDebug = rpc.declare({
	object: 'luci.netifyd-dashboard',
	method: 'collect_debug',
	expect: { success: false }
});

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

return baseclass.extend({
	getStatus: callStatus,
	getFlows: callFlows,
	getApplications: callApplications,
	getHosts: callHosts,
	getProtocols: callProtocols,
	getStats: callStats,
	getSecuboxLogs: callSecuboxLogs,
	collectDebugSnapshot: callCollectDebug,
	formatBytes: formatBytes,

	// Aggregate function for overview page
	getAllData: function() {
		return Promise.all([
			callStatus(),
			callStats(),
			callFlows(),
			callApplications()
		]).then(function(results) {
			return {
				status: results[0] || {},
				stats: results[1] || {},
				flows: results[2] || { flows: [] },
				applications: results[3] || { applications: [] }
			};
		});
	}
});
