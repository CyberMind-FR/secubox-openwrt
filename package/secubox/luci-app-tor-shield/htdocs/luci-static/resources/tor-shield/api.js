'use strict';
'require baseclass';
'require rpc';

/**
 * Tor Shield API
 * Package: luci-app-tor
 * RPCD object: luci.tor-shield
 */

var callStatus = rpc.declare({
	object: 'luci.tor-shield',
	method: 'status',
	expect: { }
});

var callEnable = rpc.declare({
	object: 'luci.tor-shield',
	method: 'enable',
	params: ['preset'],
	expect: { success: false }
});

var callDisable = rpc.declare({
	object: 'luci.tor-shield',
	method: 'disable',
	expect: { success: false }
});

var callCircuits = rpc.declare({
	object: 'luci.tor-shield',
	method: 'circuits',
	expect: { circuits: [] }
});

var callNewIdentity = rpc.declare({
	object: 'luci.tor-shield',
	method: 'new_identity',
	expect: { success: false }
});

var callCheckLeaks = rpc.declare({
	object: 'luci.tor-shield',
	method: 'check_leaks',
	expect: { }
});

var callHiddenServices = rpc.declare({
	object: 'luci.tor-shield',
	method: 'hidden_services',
	expect: { services: [] }
});

var callAddHiddenService = rpc.declare({
	object: 'luci.tor-shield',
	method: 'add_hidden_service',
	params: ['name', 'local_port', 'virtual_port'],
	expect: { success: false }
});

var callRemoveHiddenService = rpc.declare({
	object: 'luci.tor-shield',
	method: 'remove_hidden_service',
	params: ['name'],
	expect: { success: false }
});

var callExitIp = rpc.declare({
	object: 'luci.tor-shield',
	method: 'exit_ip',
	expect: { }
});

var callBandwidth = rpc.declare({
	object: 'luci.tor-shield',
	method: 'bandwidth',
	expect: { }
});

var callPresets = rpc.declare({
	object: 'luci.tor-shield',
	method: 'presets',
	expect: { presets: [] }
});

var callBridges = rpc.declare({
	object: 'luci.tor-shield',
	method: 'bridges',
	expect: { }
});

var callSetBridges = rpc.declare({
	object: 'luci.tor-shield',
	method: 'set_bridges',
	params: ['enabled', 'type'],
	expect: { success: false }
});

var callSettings = rpc.declare({
	object: 'luci.tor-shield',
	method: 'settings',
	expect: { }
});

var callSaveSettings = rpc.declare({
	object: 'luci.tor-shield',
	method: 'save_settings',
	params: ['mode', 'dns_over_tor', 'kill_switch', 'socks_port', 'trans_port', 'dns_port', 'exit_nodes', 'exclude_exit_nodes', 'strict_nodes'],
	expect: { success: false }
});

// Utility functions
function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatRate(bytesPerSec) {
	if (!bytesPerSec || bytesPerSec === 0) return '0 B/s';
	var k = 1024;
	var sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
	var i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
	if (i >= sizes.length) i = sizes.length - 1;
	return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
	if (!seconds || seconds <= 0) return '0s';
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	var s = seconds % 60;

	if (d > 0) return d + 'd ' + h + 'h';
	if (h > 0) return h + 'h ' + m + 'm';
	if (m > 0) return m + 'm ' + s + 's';
	return s + 's';
}

function getCountryFlag(code) {
	if (!code || code.length !== 2) return '';
	var offset = 127397;
	var first = code.charCodeAt(0);
	var second = code.charCodeAt(1);
	return String.fromCodePoint(first + offset) + String.fromCodePoint(second + offset);
}

function getPresetIcon(icon) {
	switch (icon) {
		case 'shield': return '&#128737;';
		case 'target': return '&#127919;';
		case 'unlock': return '&#128275;';
		default: return '&#128737;';
	}
}

return baseclass.extend({
	getStatus: callStatus,
	enable: callEnable,
	disable: callDisable,
	getCircuits: callCircuits,
	newIdentity: callNewIdentity,
	checkLeaks: callCheckLeaks,
	getHiddenServices: callHiddenServices,
	addHiddenService: callAddHiddenService,
	removeHiddenService: callRemoveHiddenService,
	getExitIp: callExitIp,
	getBandwidth: callBandwidth,
	getPresets: callPresets,
	getBridges: callBridges,
	setBridges: callSetBridges,
	getSettings: callSettings,
	saveSettings: callSaveSettings,

	formatBytes: formatBytes,
	formatRate: formatRate,
	formatUptime: formatUptime,
	getCountryFlag: getCountryFlag,
	getPresetIcon: getPresetIcon,

	// Aggregate function for dashboard
	getDashboardData: function() {
		return Promise.all([
			callStatus(),
			callPresets(),
			callBandwidth()
		]).then(function(results) {
			return {
				status: results[0] || {},
				presets: (results[1] || {}).presets || [],
				bandwidth: results[2] || {}
			};
		});
	},

	// Get all data for monitoring
	getMonitoringData: function() {
		return Promise.all([
			callStatus(),
			callCircuits(),
			callBandwidth()
		]).then(function(results) {
			return {
				status: results[0] || {},
				circuits: (results[1] || {}).circuits || [],
				bandwidth: results[2] || {}
			};
		});
	}
});
