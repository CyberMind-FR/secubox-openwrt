'use strict';
'require baseclass';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'status',
	expect: { }
});

var callGetActiveThreats = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_active_threats',
	expect: { threats: [] }
});

var callGetBlockedIPs = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_blocked_ips',
	expect: { blocked: [] }
});

var callGetSecurityStats = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_security_stats',
	expect: { }
});

var callBlockThreat = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'block_threat',
	params: ['ip', 'duration', 'reason'],
	expect: { }
});

var callWhitelistHost = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'whitelist_host',
	params: ['ip', 'reason'],
	expect: { }
});

var callRemoveWhitelist = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'remove_whitelist',
	params: ['ip'],
	expect: { }
});

var callGetThreatIntel = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_threat_intel',
	expect: { }
});

var callGetMeshIocs = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_mesh_iocs',
	expect: { }
});

var callGetMeshPeers = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_mesh_peers',
	expect: { }
});

var callPublishIntel = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'publish_intel',
	expect: { }
});

var callApplyIntel = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'apply_intel',
	expect: { }
});

function formatRelativeTime(timestamp) {
	if (!timestamp) return '-';
	try {
		var date = new Date(timestamp);
		var now = new Date();
		var seconds = Math.floor((now - date) / 1000);
		if (seconds < 60) return seconds + 's ago';
		if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
		if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
		return Math.floor(seconds / 86400) + 'd ago';
	} catch(e) {
		return timestamp;
	}
}

function formatNumber(n) {
	if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
	if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
	return String(n || 0);
}

function getDashboardData() {
	return Promise.all([
		callStatus(),
		callGetActiveThreats(),
		callGetBlockedIPs(),
		callGetSecurityStats(),
		callGetThreatIntel().catch(function() { return {}; }),
		callGetMeshIocs().catch(function() { return { iocs: [] }; }),
		callGetMeshPeers().catch(function() { return { peers: [] }; })
	]).then(function(results) {
		return {
			status: results[0] || {},
			threats: results[1].threats || [],
			blocked: results[2].blocked || [],
			securityStats: results[3] || {},
			threatIntel: results[4] || {},
			meshIocs: results[5].iocs || [],
			meshPeers: results[6].peers || []
		};
	});
}

return baseclass.extend({
	getStatus: callStatus,
	getActiveThreats: callGetActiveThreats,
	getBlockedIPs: callGetBlockedIPs,
	getSecurityStats: callGetSecurityStats,
	blockThreat: callBlockThreat,
	whitelistHost: callWhitelistHost,
	removeWhitelist: callRemoveWhitelist,
	getThreatIntel: callGetThreatIntel,
	getMeshIocs: callGetMeshIocs,
	getMeshPeers: callGetMeshPeers,
	publishIntel: callPublishIntel,
	applyIntel: callApplyIntel,
	formatRelativeTime: formatRelativeTime,
	formatNumber: formatNumber,
	getDashboardData: getDashboardData
});
