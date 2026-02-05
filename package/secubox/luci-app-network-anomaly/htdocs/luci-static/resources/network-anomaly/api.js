'use strict';
'require baseclass';
'require rpc';

/**
 * Network Anomaly Detection API
 * Package: luci-app-network-anomaly
 * RPCD object: luci.network-anomaly
 * Version: 1.0.0
 */

var callStatus = rpc.declare({
	object: 'luci.network-anomaly',
	method: 'status',
	expect: { }
});

var callGetAlerts = rpc.declare({
	object: 'luci.network-anomaly',
	method: 'get_alerts',
	params: ['limit'],
	expect: { }
});

var callGetStats = rpc.declare({
	object: 'luci.network-anomaly',
	method: 'get_stats',
	expect: { }
});

var callRun = rpc.declare({
	object: 'luci.network-anomaly',
	method: 'run',
	expect: { }
});

var callAckAlert = rpc.declare({
	object: 'luci.network-anomaly',
	method: 'ack_alert',
	params: ['id'],
	expect: { }
});

var callClearAlerts = rpc.declare({
	object: 'luci.network-anomaly',
	method: 'clear_alerts',
	expect: { }
});

var callResetBaseline = rpc.declare({
	object: 'luci.network-anomaly',
	method: 'reset_baseline',
	expect: { }
});

var callAnalyze = rpc.declare({
	object: 'luci.network-anomaly',
	method: 'analyze',
	expect: { }
});

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatRelativeTime(dateStr) {
	if (!dateStr) return 'N/A';
	try {
		var date = new Date(dateStr);
		var now = new Date();
		var seconds = Math.floor((now - date) / 1000);
		if (seconds < 60) return seconds + 's ago';
		if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
		if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
		return Math.floor(seconds / 86400) + 'd ago';
	} catch(e) {
		return dateStr;
	}
}

function getSeverityClass(severity) {
	switch (severity) {
		case 'high': return 'danger';
		case 'medium': return 'warning';
		case 'low': return 'info';
		default: return '';
	}
}

return baseclass.extend({
	getStatus: callStatus,
	getAlerts: callGetAlerts,
	getStats: callGetStats,
	run: callRun,
	ackAlert: callAckAlert,
	clearAlerts: callClearAlerts,
	resetBaseline: callResetBaseline,
	analyze: callAnalyze,

	formatBytes: formatBytes,
	formatRelativeTime: formatRelativeTime,
	getSeverityClass: getSeverityClass,

	getOverview: function() {
		return Promise.all([
			callStatus(),
			callGetAlerts(50),
			callGetStats()
		]).then(function(results) {
			return {
				status: results[0] || {},
				alerts: (results[1] || {}).alerts || [],
				stats: results[2] || {}
			};
		});
	}
});
