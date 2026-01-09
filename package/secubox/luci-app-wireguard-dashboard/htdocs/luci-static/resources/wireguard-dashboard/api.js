'use strict';
'require baseclass';
'require rpc';

/**
 * WireGuard Dashboard API
 * Package: luci-app-wireguard-dashboard
 * RPCD object: luci.wireguard-dashboard
 */

// Version: 0.4.0

var callStatus = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'status',
	expect: { }
});

var callGetPeers = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'get_peers',
	expect: { peers: [] }
});

var callGetInterfaces = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'get_interfaces',
	expect: { interfaces: [] }
});

var callGenerateKeys = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'generate_keys',
	expect: { }
});

var callAddPeer = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'add_peer',
	params: ['interface', 'name', 'allowed_ips', 'public_key', 'preshared_key', 'endpoint', 'persistent_keepalive'],
	expect: { success: false }
});

var callRemovePeer = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'remove_peer',
	params: ['interface', 'public_key'],
	expect: { success: false }
});

var callGetConfig = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'config',
	expect: { }
});

var callGenerateConfig = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'generate_config',
	params: ['interface', 'peer', 'private_key', 'endpoint'],
	expect: { config: '' }
});

var callGenerateQR = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'generate_qr',
	params: ['interface', 'peer', 'private_key', 'endpoint'],
	expect: { qrcode: '' }
});

var callGetTraffic = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'traffic',
	expect: { }
});

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatLastHandshake(timestamp) {
	if (!timestamp) return 'Never';
	var now = Math.floor(Date.now() / 1000);
	var diff = now - timestamp;
	if (diff < 60) return diff + 's ago';
	if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
	if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
	return Math.floor(diff / 86400) + 'd ago';
}

function getPeerStatusClass(status) {
	if (status === 'active') return 'active';
	if (status === 'idle') return 'idle';
	return 'inactive';
}

function shortenKey(key, length) {
	if (!key) return 'N/A';
	length = length || 8;
	return key.substring(0, length) + '...';
}

function formatHandshake(seconds) {
	if (!seconds || seconds === 0) return 'Never';
	if (seconds < 60) return seconds + 's ago';
	if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
	if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
	return Math.floor(seconds / 86400) + 'd ago';
}

return baseclass.extend({
	getStatus: callStatus,
	getPeers: callGetPeers,
	getInterfaces: callGetInterfaces,
	getConfig: callGetConfig,
	getTraffic: callGetTraffic,
	generateKeys: callGenerateKeys,
	addPeer: callAddPeer,
	removePeer: callRemovePeer,
	generateConfig: callGenerateConfig,
	generateQR: callGenerateQR,
	formatBytes: formatBytes,
	formatLastHandshake: formatLastHandshake,
	getPeerStatusClass: getPeerStatusClass,
	shortenKey: shortenKey,
	formatHandshake: formatHandshake,

	// Aggregate function for overview page
	getAllData: function() {
		return Promise.all([
			callStatus(),
			callGetPeers(),
			callGetInterfaces(),
			callGetTraffic()
		]).then(function(results) {
			return {
				status: results[0] || {},
				peers: results[1] || { peers: [] },
				interfaces: results[2] || { interfaces: [] },
				traffic: results[3] || {}
			};
		});
	}
});
