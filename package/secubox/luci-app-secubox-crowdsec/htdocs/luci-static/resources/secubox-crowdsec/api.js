'use strict';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'status',
	expect: { }
});

var callDecisions = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'decisions',
	expect: { decisions: [] }
});

var callAddDecision = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'add_decision',
	params: ['ip', 'duration', 'reason', 'type'],
	expect: { }
});

var callDeleteDecision = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'delete_decision',
	params: ['ip', 'decision_id'],
	expect: { }
});

var callAlerts = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'alerts',
	params: ['limit', 'since'],
	expect: { alerts: [] }
});

var callMetrics = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'metrics',
	expect: { }
});

var callStats = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'stats',
	expect: { }
});

var callCollections = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'collections',
	expect: { collections: [] }
});

var callInstallCollection = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'install_collection',
	params: ['collection'],
	expect: { }
});

var callRemoveCollection = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'remove_collection',
	params: ['collection'],
	expect: { }
});

var callUpdateHub = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'update_hub',
	expect: { }
});

var callUpgradeHub = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'upgrade_hub',
	expect: { }
});

var callBouncers = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'bouncers',
	expect: { bouncers: [] }
});

var callControlService = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'control_service',
	params: ['service', 'action'],
	expect: { }
});

var callNftablesStats = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'nftables_stats',
	expect: { }
});

var callBlockedIps = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'blocked_ips',
	expect: { ipv4: [], ipv6: [] }
});

var callConfig = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'config',
	expect: { }
});

var callSaveConfig = rpc.declare({
	object: 'luci.secubox-crowdsec',
	method: 'save_config',
	params: ['key', 'value'],
	expect: { }
});

return L.Class.extend({
	getStatus: function() {
		return callStatus();
	},

	getDecisions: function() {
		return callDecisions();
	},

	addDecision: function(ip, duration, reason, type) {
		return callAddDecision(ip, duration || '24h', reason || 'Manual ban via LuCI', type || 'ban');
	},

	deleteDecision: function(ip, decisionId) {
		return callDeleteDecision(ip, decisionId);
	},

	getAlerts: function(limit, since) {
		return callAlerts(limit || 50, since || '24h');
	},

	getMetrics: function() {
		return callMetrics();
	},

	getStats: function() {
		return callStats();
	},

	getCollections: function() {
		return callCollections();
	},

	installCollection: function(collection) {
		return callInstallCollection(collection);
	},

	removeCollection: function(collection) {
		return callRemoveCollection(collection);
	},

	updateHub: function() {
		return callUpdateHub();
	},

	upgradeHub: function() {
		return callUpgradeHub();
	},

	getBouncers: function() {
		return callBouncers();
	},

	controlService: function(service, action) {
		return callControlService(service, action);
	},

	getNftablesStats: function() {
		return callNftablesStats();
	},

	getBlockedIps: function() {
		return callBlockedIps();
	},

	getConfig: function() {
		return callConfig();
	},

	saveConfig: function(key, value) {
		return callSaveConfig(key, value);
	}
});
