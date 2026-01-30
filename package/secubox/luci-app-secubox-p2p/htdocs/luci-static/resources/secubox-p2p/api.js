'use strict';
'require baseclass';
'require rpc';

// P2P Peer Management
var callGetPeers = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_peers',
	expect: { peers: [] }
});

var callGetSettings = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_settings',
	expect: {}
});

var callGetServices = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_services',
	expect: { services: [] }
});

var callGetSharedServices = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_shared_services',
	expect: { shared_services: [] }
});

var callDiscover = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'discover',
	params: ['timeout'],
	expect: [],
	timeout: 15000
});

var callAddPeer = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'add_peer',
	params: ['address', 'name'],
	expect: { success: false }
});

var callRemovePeer = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'remove_peer',
	params: ['peer_id'],
	expect: { success: false }
});

var callSetSettings = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'set_settings',
	params: ['settings'],
	expect: { success: false }
});

var callSyncCatalog = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'sync_catalog',
	expect: { success: false }
});

var callBroadcastCommand = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'broadcast_command',
	params: ['command'],
	expect: { success: false }
});

// DNS Federation
var callGetDNSConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_dns_config',
	expect: {}
});

var callSetDNSConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'set_dns_config',
	params: ['config'],
	expect: { success: false }
});

// WireGuard Mesh
var callGetWireGuardConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_wireguard_config',
	expect: {}
});

var callSetWireGuardConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'set_wireguard_config',
	params: ['config'],
	expect: { success: false }
});

// HAProxy
var callGetHAProxyConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_haproxy_config',
	expect: {}
});

var callSetHAProxyConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'set_haproxy_config',
	params: ['config'],
	expect: { success: false }
});

// Registry
var callGetRegistry = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_registry',
	expect: {}
});

var callRegisterURL = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'register_url',
	params: ['short_url', 'target_url'],
	expect: { success: false }
});

// Health Check
var callHealthCheck = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'health_check',
	expect: {}
});

// Deployment - Registry
var callDeployRegistry = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'deploy_registry',
	expect: { success: false, deployed_peers: 0 }
});

var callDeployRegistryEntry = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'deploy_registry_entry',
	params: ['short_url'],
	expect: { success: false, deployed_peers: 0 }
});

// Deployment - Services
var callDeployServices = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'deploy_services',
	expect: { success: false, services_deployed: 0, deployed_peers: 0 }
});

var callDeployLocalServices = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'deploy_local_services',
	expect: { success: false, deployed_peers: 0 }
});

var callDeployService = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'deploy_service',
	params: ['service_id'],
	expect: { success: false, deployed_peers: 0 }
});

var callPullMeshServices = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'pull_mesh_services',
	expect: { success: false, services_pulled: 0 }
});

var callPullService = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'pull_service',
	params: ['service_id', 'peer_id'],
	expect: { success: false }
});

// DNS Bridge
var callGetDNSBridgeConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_dns_bridge_config',
	expect: {}
});

var callSetDNSBridgeConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'set_dns_bridge_config',
	params: ['config'],
	expect: { success: false }
});

// WireGuard Mirror
var callGetWGMirrorConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_wg_mirror_config',
	expect: {}
});

var callSetWGMirrorConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'set_wg_mirror_config',
	params: ['config'],
	expect: { success: false }
});

var callSyncWGMirror = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'sync_wg_mirror',
	expect: { success: false, synced_peers: 0 }
});

return baseclass.extend({
	// Peers
	getPeers: function() { return callGetPeers(); },
	addPeer: function(address, name) { return callAddPeer(address, name); },
	removePeer: function(peer_id) { return callRemovePeer(peer_id); },
	discover: function(timeout) { return callDiscover(timeout || 5); },

	// Settings
	getSettings: function() { return callGetSettings(); },
	setSettings: function(settings) { return callSetSettings(settings); },

	// Services
	getServices: function() { return callGetServices(); },
	getSharedServices: function() { return callGetSharedServices(); },

	// Sync & Broadcast
	syncCatalog: function() { return callSyncCatalog(); },
	broadcastCommand: function(cmd) { return callBroadcastCommand(cmd); },

	// DNS Federation
	getDNSConfig: function() { return callGetDNSConfig(); },
	setDNSConfig: function(config) { return callSetDNSConfig(config); },

	// WireGuard Mesh
	getWireGuardConfig: function() { return callGetWireGuardConfig(); },
	setWireGuardConfig: function(config) { return callSetWireGuardConfig(config); },

	// HAProxy
	getHAProxyConfig: function() { return callGetHAProxyConfig(); },
	setHAProxyConfig: function(config) { return callSetHAProxyConfig(config); },

	// Registry
	getRegistry: function() { return callGetRegistry(); },
	registerURL: function(shortUrl, targetUrl) { return callRegisterURL(shortUrl, targetUrl); },

	// Health
	healthCheck: function() { return callHealthCheck(); },

	// Deployment - Registry
	deployRegistry: function() { return callDeployRegistry(); },
	deployRegistryEntry: function(shortUrl) { return callDeployRegistryEntry(shortUrl); },

	// Deployment - Services
	deployServices: function() { return callDeployServices(); },
	deployLocalServices: function() { return callDeployLocalServices(); },
	deployService: function(serviceId) { return callDeployService(serviceId); },
	pullMeshServices: function() { return callPullMeshServices(); },
	pullService: function(serviceId, peerId) { return callPullService(serviceId, peerId); },

	// DNS Bridge
	getDNSBridgeConfig: function() { return callGetDNSBridgeConfig(); },
	setDNSBridgeConfig: function(config) { return callSetDNSBridgeConfig(config); },

	// WireGuard Mirror
	getWGMirrorConfig: function() { return callGetWGMirrorConfig(); },
	setWGMirrorConfig: function(config) { return callSetWGMirrorConfig(config); },
	syncWGMirror: function() { return callSyncWGMirror(); }
});
