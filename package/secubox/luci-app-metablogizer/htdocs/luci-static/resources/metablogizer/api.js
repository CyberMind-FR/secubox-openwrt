'use strict';
'require rpc';
'require baseclass';

/**
 * MetaBlogizer API Module
 * RPCD interface for MetaBlogizer static site publisher
 */

var callStatus = rpc.declare({
	object: 'luci.metablogizer',
	method: 'status',
	expect: { result: {} }
});

var callListSites = rpc.declare({
	object: 'luci.metablogizer',
	method: 'list_sites',
	expect: { sites: [] }
});

var callCreateSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'create_site',
	params: ['name', 'domain', 'gitea_repo', 'ssl', 'description'],
	expect: { result: {} }
});

var callUpdateSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'update_site',
	params: ['id', 'name', 'domain', 'gitea_repo', 'ssl', 'enabled', 'description'],
	expect: { result: {} }
});

var callDeleteSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'delete_site',
	params: ['id'],
	expect: { result: {} }
});

var callSyncSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'sync_site',
	params: ['id'],
	expect: { result: {} }
});

var callGetHostingStatus = rpc.declare({
	object: 'luci.metablogizer',
	method: 'get_hosting_status',
	expect: { result: {} }
});

var callCheckSiteHealth = rpc.declare({
	object: 'luci.metablogizer',
	method: 'check_site_health',
	params: ['id'],
	expect: { result: {} }
});

var callGetPublishInfo = rpc.declare({
	object: 'luci.metablogizer',
	method: 'get_publish_info',
	params: ['id'],
	expect: { result: {} }
});

var callUploadFile = rpc.declare({
	object: 'luci.metablogizer',
	method: 'upload_file',
	params: ['site_id', 'filename', 'content'],
	expect: { result: {} }
});

var callListFiles = rpc.declare({
	object: 'luci.metablogizer',
	method: 'list_files',
	params: ['site_id'],
	expect: { result: {} }
});

var callGetSettings = rpc.declare({
	object: 'luci.metablogizer',
	method: 'get_settings',
	expect: { result: {} }
});

var callEnableTor = rpc.declare({
	object: 'luci.metablogizer',
	method: 'enable_tor',
	params: ['id'],
	expect: { result: {} }
});

var callDisableTor = rpc.declare({
	object: 'luci.metablogizer',
	method: 'disable_tor',
	params: ['id'],
	expect: { result: {} }
});

var callGetTorStatus = rpc.declare({
	object: 'luci.metablogizer',
	method: 'get_tor_status',
	params: ['id'],
	expect: { result: {} }
});

var callRepairSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'repair_site',
	params: ['id'],
	expect: { result: {} }
});

var callDiscoverVhosts = rpc.declare({
	object: 'luci.metablogizer',
	method: 'discover_vhosts',
	expect: { result: {} }
});

var callImportVhost = rpc.declare({
	object: 'luci.metablogizer',
	method: 'import_vhost',
	params: ['instance', 'name', 'domain'],
	expect: { result: {} }
});

var callSyncConfig = rpc.declare({
	object: 'luci.metablogizer',
	method: 'sync_config',
	expect: { result: {} }
});

return baseclass.extend({
	getStatus: function() {
		return callStatus();
	},

	listSites: function() {
		return callListSites().then(function(res) {
			return res.sites || [];
		});
	},

	createSite: function(name, domain, giteaRepo, ssl, description) {
		return callCreateSite(name, domain, giteaRepo || '', ssl || '1', description || '');
	},

	updateSite: function(id, name, domain, giteaRepo, ssl, enabled, description) {
		return callUpdateSite(id, name, domain, giteaRepo || '', ssl || '1', enabled || '1', description || '');
	},

	deleteSite: function(id) {
		return callDeleteSite(id);
	},

	syncSite: function(id) {
		return callSyncSite(id);
	},

	getHostingStatus: function() {
		return callGetHostingStatus();
	},

	checkSiteHealth: function(id) {
		return callCheckSiteHealth(id);
	},

	getPublishInfo: function(id) {
		return callGetPublishInfo(id);
	},

	uploadFile: function(siteId, filename, content) {
		return callUploadFile(siteId, filename, content);
	},

	listFiles: function(siteId) {
		return callListFiles(siteId).then(function(res) {
			return res.files || [];
		});
	},

	getSettings: function() {
		return callGetSettings();
	},

	enableTor: function(id) {
		return callEnableTor(id);
	},

	disableTor: function(id) {
		return callDisableTor(id);
	},

	getTorStatus: function(id) {
		return callGetTorStatus(id);
	},

	repairSite: function(id) {
		return callRepairSite(id);
	},

	discoverVhosts: function() {
		return callDiscoverVhosts().then(function(res) {
			return res.discovered || [];
		});
	},

	importVhost: function(instance, name, domain) {
		return callImportVhost(instance, name, domain);
	},

	syncConfig: function() {
		return callSyncConfig();
	},

	getDashboardData: function() {
		var self = this;
		return Promise.all([
			self.getStatus(),
			self.listSites(),
			self.getHostingStatus().catch(function() { return {}; })
		]).then(function(results) {
			return {
				status: results[0] || {},
				sites: results[1] || [],
				hosting: results[2] || {}
			};
		});
	}
});
