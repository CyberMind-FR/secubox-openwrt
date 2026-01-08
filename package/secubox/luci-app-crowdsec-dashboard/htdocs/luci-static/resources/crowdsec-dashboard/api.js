'use strict';
'require baseclass';
'require rpc';

/**
 * CrowdSec Dashboard API
 * Package: luci-app-crowdsec-dashboard
 * RPCD object: luci.crowdsec-dashboard
 * CrowdSec Core: 1.7.4+
 */

// Version: 0.6.0

var callStatus = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'status',
	expect: { }
});

var callDecisions = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'decisions',
	expect: { alerts: [] }
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

var callSecuboxLogs = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'seccubox_logs',
	expect: { }
});

var callCollectDebug = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'collect_debug',
	expect: { }
});

var callBan = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'ban',
	params: ['ip', 'duration', 'reason'],
	expect: { }
});

var callUnban = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'unban',
	params: ['ip'],
	expect: { }
});

// CrowdSec v1.7.4+ features
var callWAFStatus = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'waf_status',
	expect: { }
});

var callMetricsConfig = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'metrics_config',
	expect: { }
});

var callConfigureMetrics = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'configure_metrics',
	params: ['enable'],
	expect: { }
});

var callCollections = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'collections',
	expect: { collections: [] }
});

var callInstallCollection = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'install_collection',
	params: ['collection'],
	expect: { }
});

var callRemoveCollection = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'remove_collection',
	params: ['collection'],
	expect: { }
});

var callUpdateHub = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'update_hub',
	expect: { }
});

var callRegisterBouncer = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'register_bouncer',
	params: ['bouncer_name'],
	expect: { }
});

var callDeleteBouncer = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'delete_bouncer',
	params: ['bouncer_name'],
	expect: { }
});

// Firewall Bouncer Management
var callFirewallBouncerStatus = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'firewall_bouncer_status',
	expect: { }
});

var callControlFirewallBouncer = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'control_firewall_bouncer',
	params: ['action'],
	expect: { }
});

var callFirewallBouncerConfig = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'firewall_bouncer_config',
	expect: { }
});

var callUpdateFirewallBouncerConfig = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'update_firewall_bouncer_config',
	params: ['key', 'value'],
	expect: { }
});

var callNftablesStats = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'nftables_stats',
	expect: { }
});

// Wizard Methods
var callCheckWizardNeeded = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'check_wizard_needed',
	expect: { }
});

var callWizardState = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'wizard_state',
	expect: { }
});

var callRepairLapi = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'repair_lapi',
	expect: { }
});

// Console Methods
var callConsoleStatus = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'console_status',
	expect: { }
});

var callConsoleEnroll = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'console_enroll',
	params: ['key', 'name'],
	expect: { }
});

var callConsoleDisable = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'console_disable',
	expect: { }
});

var callServiceControl = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'service_control',
	params: ['action'],
	expect: { }
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

function isValidIP(ip) {
	if (!ip) return false;

	// IPv4 regex
	var ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

	// IPv6 regex (simplified)
	var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

	return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function parseScenario(scenario) {
	if (!scenario) return 'N/A';

	// Extract human-readable part from scenario name
	// e.g., "crowdsecurity/ssh-bruteforce" -> "SSH Bruteforce"
	var parts = scenario.split('/');
	var name = parts[parts.length - 1];

	// Convert dash-separated to title case
	return name.split('-').map(function(word) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	}).join(' ');
}

function getCountryFlag(countryCode) {
	if (!countryCode || countryCode === 'N/A') return '';

	// Convert country code to flag emoji
	// e.g., "US" -> "🇺🇸"
	var code = countryCode.toUpperCase();
	if (code.length !== 2) return '';

	var codePoints = [];
	for (var i = 0; i < code.length; i++) {
		codePoints.push(0x1F1E6 - 65 + code.charCodeAt(i));
	}
	return String.fromCodePoint.apply(null, codePoints);
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
		if (seconds < 2592000) return Math.floor(seconds / 86400) + 'd ago';
		return Math.floor(seconds / 2592000) + 'mo ago';
	} catch(e) {
		return dateStr;
	}
}

return baseclass.extend({
	getStatus: callStatus,
	getDecisions: function() {
		return callDecisions().then(function(result) {
			console.log('[API] getDecisions raw result:', result);
			console.log('[API] getDecisions result type:', typeof result);
			console.log('[API] getDecisions is array:', Array.isArray(result));
			return result;
		});
	},
	getAlerts: callAlerts,
	getBouncers: callBouncers,
	getMetrics: callMetrics,
	getMachines: callMachines,
	getHub: callHub,
	getStats: callStats,
	getSecuboxLogs: callSecuboxLogs,
	collectDebugSnapshot: callCollectDebug,
	addBan: callBan,
	removeBan: callUnban,

	// CrowdSec v1.7.4+ features
	getWAFStatus: callWAFStatus,
	getMetricsConfig: callMetricsConfig,
	configureMetrics: callConfigureMetrics,
	getCollections: callCollections,
	installCollection: callInstallCollection,
	removeCollection: callRemoveCollection,
	updateHub: callUpdateHub,
	registerBouncer: callRegisterBouncer,
	deleteBouncer: callDeleteBouncer,

	// Firewall Bouncer Management
	getFirewallBouncerStatus: callFirewallBouncerStatus,
	controlFirewallBouncer: callControlFirewallBouncer,
	getFirewallBouncerConfig: callFirewallBouncerConfig,
	updateFirewallBouncerConfig: callUpdateFirewallBouncerConfig,
	getNftablesStats: callNftablesStats,

	// Wizard Methods
	checkWizardNeeded: callCheckWizardNeeded,
	getWizardState: callWizardState,
	repairLapi: callRepairLapi,

	// Console Methods
	getConsoleStatus: callConsoleStatus,
	consoleEnroll: callConsoleEnroll,
	consoleDisable: callConsoleDisable,

	// Service Control
	serviceControl: callServiceControl,

	formatDuration: formatDuration,
	formatDate: formatDate,
	formatRelativeTime: formatRelativeTime,
	isValidIP: isValidIP,
	parseScenario: parseScenario,
	getCountryFlag: getCountryFlag,

	// Aliases for compatibility
	banIP: callBan,
	unbanIP: callUnban,

	getDashboardData: function() {
		return Promise.all([
			callStatus(),
			callStats(),
			callDecisions(),
			callAlerts()
		]).then(function(results) {
			// Check if any result has an error (service not running)
			var status = results[0] || {};
			var stats = results[1] || {};
			var decisionsRaw = results[2] || [];
			var alerts = results[3] || [];

			// Flatten alerts->decisions structure
			var decisions = [];
			if (Array.isArray(decisionsRaw)) {
				decisionsRaw.forEach(function(alert) {
					if (alert.decisions && Array.isArray(alert.decisions)) {
						decisions = decisions.concat(alert.decisions);
					}
				});
			}

			return {
				status: status,
				stats: (stats.error) ? {} : stats,
				decisions: decisions,
				alerts: alerts,
				error: stats.error || null
			};
		});
	}
});
