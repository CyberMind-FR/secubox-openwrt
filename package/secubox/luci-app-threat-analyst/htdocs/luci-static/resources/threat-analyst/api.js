'use strict';
'require baseclass';
'require rpc';

/**
 * Threat Analyst API
 * Package: luci-app-threat-analyst
 * RPCD object: luci.threat-analyst
 * Version: 0.1.0
 *
 * Generative AI-powered threat filtering for:
 * - CrowdSec autoban scenarios
 * - mitmproxy filter rules
 * - WAF rules
 */

var callStatus = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'status',
	expect: { }
});

var callGetThreats = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'get_threats',
	params: ['limit'],
	expect: { }
});

var callGetPending = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'get_pending',
	expect: { }
});

var callChat = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'chat',
	params: ['message'],
	expect: { }
});

var callGenerateRules = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'generate_rules',
	params: ['target'],
	expect: { }
});

var callApproveRule = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'approve_rule',
	params: ['id'],
	expect: { }
});

var callRejectRule = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'reject_rule',
	params: ['id'],
	expect: { }
});

var callRunCycle = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'run_cycle',
	expect: { }
});

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

function parseScenario(scenario) {
	if (!scenario) return 'Unknown';
	var parts = scenario.split('/');
	var name = parts[parts.length - 1];
	return name.split('-').map(function(word) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	}).join(' ');
}

function getSeverityClass(scenario) {
	if (!scenario) return 'medium';
	var s = scenario.toLowerCase();
	if (s.includes('malware') || s.includes('exploit') || s.includes('cve')) return 'critical';
	if (s.includes('bruteforce') || s.includes('scan')) return 'high';
	if (s.includes('crawl') || s.includes('http')) return 'low';
	return 'medium';
}

function extractCVE(scenario) {
	if (!scenario) return null;
	// Match CVE patterns: CVE-YYYY-NNNNN
	var match = scenario.match(/CVE-\d{4}-\d{4,}/i);
	return match ? match[0].toUpperCase() : null;
}

return baseclass.extend({
	getStatus: callStatus,
	getThreats: callGetThreats,
	getPending: callGetPending,
	chat: callChat,
	generateRules: callGenerateRules,
	approveRule: callApproveRule,
	rejectRule: callRejectRule,
	runCycle: callRunCycle,

	formatRelativeTime: formatRelativeTime,
	parseScenario: parseScenario,
	getSeverityClass: getSeverityClass,
	extractCVE: extractCVE,

	getOverview: function() {
		return Promise.all([
			callStatus(),
			callGetThreats(20),
			callGetPending()
		]).then(function(results) {
			return {
				status: results[0] || {},
				threats: (results[1] || {}).threats || [],
				pending: (results[2] || {}).pending || []
			};
		});
	}
});
