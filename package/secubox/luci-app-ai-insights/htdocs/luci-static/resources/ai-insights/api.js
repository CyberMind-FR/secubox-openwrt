'use strict';
'require baseclass';
'require rpc';

/**
 * AI Insights Aggregation API
 * Package: luci-app-ai-insights
 * RPCD object: luci.ai-insights
 * Version: 1.0.0
 */

var callStatus = rpc.declare({
	object: 'luci.ai-insights',
	method: 'status',
	expect: { }
});

var callGetAlerts = rpc.declare({
	object: 'luci.ai-insights',
	method: 'get_alerts',
	params: ['limit'],
	expect: { }
});

var callGetPosture = rpc.declare({
	object: 'luci.ai-insights',
	method: 'get_posture',
	expect: { }
});

var callGetTimeline = rpc.declare({
	object: 'luci.ai-insights',
	method: 'get_timeline',
	params: ['hours'],
	expect: { }
});

var callRunAll = rpc.declare({
	object: 'luci.ai-insights',
	method: 'run_all',
	expect: { }
});

var callAnalyze = rpc.declare({
	object: 'luci.ai-insights',
	method: 'analyze',
	expect: { }
});

var callGetCVEFeed = rpc.declare({
	object: 'luci.ai-insights',
	method: 'get_cve_feed',
	params: ['limit'],
	expect: { }
});

function getPostureColor(score) {
	if (score >= 80) return 'success';
	if (score >= 60) return 'warning';
	if (score >= 40) return 'caution';
	return 'danger';
}

function getPostureLabel(score) {
	if (score >= 80) return 'Excellent';
	if (score >= 60) return 'Good';
	if (score >= 40) return 'Fair';
	if (score >= 20) return 'Poor';
	return 'Critical';
}

function getAgentIcon(agent) {
	switch (agent) {
		case 'threat_analyst': return '\uD83D\uDEE1';
		case 'dns_guard': return '\uD83C\uDF10';
		case 'network_anomaly': return '\uD83D\uDCCA';
		case 'cve_triage': return '\u26A0';
		default: return '\u2022';
	}
}

function getAgentName(agent) {
	switch (agent) {
		case 'threat_analyst': return 'Threat Analyst';
		case 'dns_guard': return 'DNS Guard';
		case 'network_anomaly': return 'Network Anomaly';
		case 'cve_triage': return 'CVE Triage';
		default: return agent;
	}
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

return baseclass.extend({
	getStatus: callStatus,
	getAlerts: callGetAlerts,
	getPosture: callGetPosture,
	getTimeline: callGetTimeline,
	runAll: callRunAll,
	analyze: callAnalyze,
	getCVEFeed: callGetCVEFeed,

	getPostureColor: getPostureColor,
	getPostureLabel: getPostureLabel,
	getAgentIcon: getAgentIcon,
	getAgentName: getAgentName,
	formatRelativeTime: formatRelativeTime,

	getOverview: function() {
		return Promise.all([
			callStatus(),
			callGetPosture(),
			callGetAlerts(30)
		]).then(function(results) {
			return {
				status: results[0] || {},
				posture: results[1] || {},
				alerts: (results[2] || {}).alerts || []
			};
		});
	}
});
