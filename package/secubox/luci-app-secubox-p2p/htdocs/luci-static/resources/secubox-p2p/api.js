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

// Gitea Integration
var callGetGiteaConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_gitea_config',
	expect: {}
});

var callSetGiteaConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'set_gitea_config',
	params: ['config'],
	expect: { success: false }
});

var callCreateGiteaRepo = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'create_gitea_repo',
	params: ['name', 'description', 'private', 'init_readme'],
	expect: { success: false }
});

var callListGiteaRepos = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'list_gitea_repos',
	expect: { success: false, repos: [] }
});

var callGetGiteaCommits = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_gitea_commits',
	params: ['limit'],
	expect: { success: false, commits: [] }
});

var callPushGiteaBackup = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'push_gitea_backup',
	params: ['message', 'components'],
	expect: { success: false }
});

var callPullGiteaBackup = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'pull_gitea_backup',
	params: ['commit_sha'],
	expect: { success: false }
});

// Local Backup
var callCreateLocalBackup = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'create_local_backup',
	params: ['name', 'components'],
	expect: { success: false }
});

var callListLocalBackups = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'list_local_backups',
	expect: { success: false, backups: [] }
});

var callRestoreLocalBackup = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'restore_local_backup',
	params: ['backup_id'],
	expect: { success: false }
});

// P2P Package Feed
var callGetFeedPeers = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_feed_peers',
	expect: { success: false, peers: [] }
});

var callGetPeerPackages = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_peer_packages',
	params: ['peer_addr'],
	expect: {}
});

var callGetAllPackages = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_all_packages',
	expect: {}
});

var callFetchPackage = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'fetch_package',
	params: ['package', 'peer_addr'],
	expect: { success: false }
});

var callSyncPackageCatalog = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'sync_package_catalog',
	params: ['refresh'],
	expect: {}
});

var callGetFeedSettings = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_feed_settings',
	expect: {}
});

var callSetFeedSettings = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'set_feed_settings',
	params: ['share_feed', 'auto_sync', 'sync_interval', 'prefer_local'],
	expect: { success: false }
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
	syncWGMirror: function() { return callSyncWGMirror(); },

	// Gitea Integration
	getGiteaConfig: function() { return callGetGiteaConfig(); },
	setGiteaConfig: function(config) { return callSetGiteaConfig(config); },
	createGiteaRepo: function(name, description, isPrivate, initReadme) {
		return callCreateGiteaRepo(name, description, isPrivate, initReadme);
	},
	listGiteaRepos: function() { return callListGiteaRepos(); },
	getGiteaCommits: function(limit) { return callGetGiteaCommits(limit || 20); },
	pushGiteaBackup: function(message, components) { return callPushGiteaBackup(message, components); },
	pullGiteaBackup: function(commitSha) { return callPullGiteaBackup(commitSha); },

	// Local Backup
	createLocalBackup: function(name, components) { return callCreateLocalBackup(name, components); },
	listLocalBackups: function() { return callListLocalBackups(); },
	restoreLocalBackup: function(backupId) { return callRestoreLocalBackup(backupId); },

	// P2P Package Feed
	getFeedPeers: function() { return callGetFeedPeers(); },
	getPeerPackages: function(peerAddr) { return callGetPeerPackages(peerAddr); },
	getAllPackages: function() { return callGetAllPackages(); },
	fetchPackage: function(pkg, peerAddr) { return callFetchPackage(pkg, peerAddr || ''); },
	syncPackageCatalog: function(refresh) { return callSyncPackageCatalog(refresh || false); },
	getFeedSettings: function() { return callGetFeedSettings(); },
	setFeedSettings: function(shareFeed, autoSync, syncInterval, preferLocal) {
		return callSetFeedSettings(shareFeed, autoSync, syncInterval, preferLocal);
	}
});
