'use strict';
'require baseclass';
'require rpc';

/**
 * Client Guardian API
 * Package: luci-app-client-guardian
 * RPCD object: luci.client-guardian
 */

var callStatus = rpc.declare({
	object: 'luci.client-guardian',
	method: 'status',
	expect: { }
});

var callGetClients = rpc.declare({
	object: 'luci.client-guardian',
	method: 'get_clients',
	expect: { clients: [] }
});

var callGetGroups = rpc.declare({
	object: 'luci.client-guardian',
	method: 'get_groups',
	expect: { groups: [] }
});

var callAuthorizeClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'authorize_client',
	params: ['mac', 'group', 'duration']
});

var callDeauthorizeClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'deauthorize_client',
	params: ['mac']
});

var callBlockClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'block_client',
	params: ['mac', 'reason']
});

var callGetCaptiveStatus = rpc.declare({
	object: 'luci.client-guardian',
	method: 'get_captive_status',
	expect: { }
});

var callGetStats = rpc.declare({
	object: 'luci.client-guardian',
	method: 'get_stats',
	expect: { }
});

function formatMac(mac) {
	if (!mac) return '';
	return mac.toUpperCase().replace(/(.{2})(?=.)/g, '$1:');
}

function formatDuration(seconds) {
	if (!seconds) return 'Unlimited';
	var h = Math.floor(seconds / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	if (h > 24) return Math.floor(h / 24) + 'd';
	if (h > 0) return h + 'h ' + m + 'm';
	return m + 'm';
}

return baseclass.extend({
	getStatus: callStatus,
	getClients: callGetClients,
	getGroups: callGetGroups,
	authorizeClient: callAuthorizeClient,
	deauthorizeClient: callDeauthorizeClient,
	blockClient: callBlockClient,
	getCaptiveStatus: callGetCaptiveStatus,
	getStats: callGetStats,
	formatMac: formatMac,
	formatDuration: formatDuration
});
