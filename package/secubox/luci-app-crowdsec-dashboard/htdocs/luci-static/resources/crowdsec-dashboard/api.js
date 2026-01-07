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

var callSecuboxLogs = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'seccubox_logs',
	expect: { }
});

var callCollectDebug = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'collect_debug',
	expect: { success: false }
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
	expect: { success: false }
});

var callCollections = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'collections',
	expect: { }
});

var callInstallCollection = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'install_collection',
	params: ['collection'],
	expect: { success: false }
});

var callRemoveCollection = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'remove_collection',
	params: ['collection'],
	expect: { success: false }
});

var callUpdateHub = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'update_hub',
	expect: { success: false }
});

var callRegisterBouncer = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'register_bouncer',
	params: ['bouncer_name'],
	expect: { success: false }
});

var callDeleteBouncer = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'delete_bouncer',
	params: ['bouncer_name'],
	expect: { success: false }
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
	expect: { success: false }
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
	expect: { success: false }
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

	formatDuration: formatDuration,
	formatDate: formatDate,

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
			var decisions = results[2] || {};
			var alerts = results[3] || {};

			return {
				status: status,
				stats: (stats.error) ? {} : stats,
				decisions: (decisions.error) ? [] : (decisions.decisions || []),
				alerts: (alerts.error) ? [] : (alerts.alerts || []),
				error: stats.error || decisions.error || alerts.error || null
			};
		});
	}
});
