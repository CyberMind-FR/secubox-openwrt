'use strict';
'require baseclass';
'require rpc';

/**
 * WireGuard Dashboard API
 * Package: luci-app-wireguard-dashboard
 * RPCD object: luci.wireguard-dashboard
 */

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
	params: ['interface', 'name', 'allowed_ips', 'public_key', 'preshared_key', 'endpoint', 'persistent_keepalive']
});

var callRemovePeer = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'remove_peer',
	params: ['interface', 'public_key']
});

var callGetConfig = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'get_config',
	params: ['interface', 'peer'],
	expect: { config: '' }
});

var callGetQRCode = rpc.declare({
	object: 'luci.wireguard-dashboard',
	method: 'get_qrcode',
	params: ['interface', 'peer'],
	expect: { qrcode: '' }
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

return baseclass.extend({
	getStatus: callStatus,
	getPeers: callGetPeers,
	getInterfaces: callGetInterfaces,
	generateKeys: callGenerateKeys,
	addPeer: callAddPeer,
	removePeer: callRemovePeer,
	getConfig: callGetConfig,
	getQRCode: callGetQRCode,
	formatBytes: formatBytes,
	formatLastHandshake: formatLastHandshake
});
