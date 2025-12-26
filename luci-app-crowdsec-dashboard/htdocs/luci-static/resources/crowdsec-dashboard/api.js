'use strict';
'require baseclass';
'require rpc';

/**
 * CrowdSec Dashboard API
 * Package: luci-app-crowdsec-dashboard
 * RPCD object: luci.crowdsec-dashboard
 */

// Version: 0.2.2

var callStatus = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'status',
	expect: { }
});

var callDecisions = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'decisions',
	expect: { decisions: [] }
});

var callAlerts = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'alerts',
	expect: { alerts: [] }
});

var callBouncers = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'bouncers',
	expect: { bouncers: [] }
});

var callMetrics = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'metrics',
	expect: { }
});

var callMachines = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'machines',
	expect: { machines: [] }
});

var callHub = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'hub',
	expect: { }
});

var callStats = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'stats',
	expect: { }
});

var callBan = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'ban',
	params: ['ip', 'duration', 'reason'],
	expect: { success: false }
});

var callUnban = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'unban',
	params: ['ip'],
	expect: { success: false }
});

function formatDuration(seconds) {
	if (!seconds) return 'N/A';
	if (seconds < 60) return seconds + 's';
	if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
	if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
	return Math.floor(seconds / 86400) + 'd';
}

function formatDate(dateStr) {
	if (!dateStr) return 'N/A';
	try {
		var date = new Date(dateStr);
		return date.toLocaleString();
	} catch(e) {
		return dateStr;
	}
}

return baseclass.extend({
	getStatus: callStatus,
	getDecisions: callDecisions,
	getAlerts: callAlerts,
	getBouncers: callBouncers,
	getMetrics: callMetrics,
	getMachines: callMachines,
	getHub: callHub,
	getStats: callStats,
	addBan: callBan,
	removeBan: callUnban,
	formatDuration: formatDuration,
	formatDate: formatDate
});
