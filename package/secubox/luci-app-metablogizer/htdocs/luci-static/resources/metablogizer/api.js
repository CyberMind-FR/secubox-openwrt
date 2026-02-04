'use strict';
'require rpc';
'require baseclass';

/**
 * MetaBlogizer API Module
 * RPCD interface for MetaBlogizer static site publisher
 */

var callStatus = rpc.declare({
	object: 'luci.metablogizer',
	method: 'status'
});

var callListSites = rpc.declare({
	object: 'luci.metablogizer',
	method: 'list_sites'
});

var callCreateSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'create_site',
	params: ['name', 'domain', 'gitea_repo', 'ssl', 'description']
});

var callUpdateSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'update_site',
	params: ['id', 'name', 'domain', 'gitea_repo', 'ssl', 'enabled', 'description']
});

var callDeleteSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'delete_site',
	params: ['id']
});

var callSyncSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'sync_site',
	params: ['id']
});

var callGetHostingStatus = rpc.declare({
	object: 'luci.metablogizer',
	method: 'get_hosting_status'
});

var callCheckSiteHealth = rpc.declare({
	object: 'luci.metablogizer',
	method: 'check_site_health',
	params: ['id']
});

var callGetPublishInfo = rpc.declare({
	object: 'luci.metablogizer',
	method: 'get_publish_info',
	params: ['id']
});

var callUploadFile = rpc.declare({
	object: 'luci.metablogizer',
	method: 'upload_file',
	params: ['id', 'filename', 'content']
});

var callUploadChunk = rpc.declare({
	object: 'luci.metablogizer',
	method: 'upload_chunk',
	params: ['upload_id', 'data', 'index']
});

var callUploadFinalize = rpc.declare({
	object: 'luci.metablogizer',
	method: 'upload_finalize',
	params: ['upload_id', 'site_id', 'filename']
});

var callListFiles = rpc.declare({
	object: 'luci.metablogizer',
	method: 'list_files',
	params: ['site_id']
});

var callGetSettings = rpc.declare({
	object: 'luci.metablogizer',
	method: 'get_settings'
});

var callEnableTor = rpc.declare({
	object: 'luci.metablogizer',
	method: 'enable_tor',
	params: ['id']
});

var callDisableTor = rpc.declare({
	object: 'luci.metablogizer',
	method: 'disable_tor',
	params: ['id']
});

var callGetTorStatus = rpc.declare({
	object: 'luci.metablogizer',
	method: 'get_tor_status',
	params: ['id']
});

var callRepairSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'repair_site',
	params: ['id']
});

var callDiscoverVhosts = rpc.declare({
	object: 'luci.metablogizer',
	method: 'discover_vhosts'
});

var callImportVhost = rpc.declare({
	object: 'luci.metablogizer',
	method: 'import_vhost',
	params: ['instance', 'name', 'domain']
});

var callSyncConfig = rpc.declare({
	object: 'luci.metablogizer',
	method: 'sync_config'
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

	uploadChunk: function(uploadId, data, index) {
		return callUploadChunk(uploadId, data, index);
	},

	uploadFinalize: function(uploadId, siteId, filename) {
		return callUploadFinalize(uploadId, siteId, filename);
	},

	/**
	 * Chunked upload for files > 40KB.
	 * Splits base64 into ~40KB chunks, sends each via upload_chunk,
	 * then calls upload_finalize to decode and save.
	 * @param {string} siteId - UCI site section ID (e.g., "site_myblog")
	 * @param {string} filename - Destination filename
	 * @param {string} content - Base64-encoded file content
	 * @returns {Promise} - Resolves with upload result
	 */
	chunkedUpload: function(siteId, filename, content) {
		var self = this;
		var CHUNK_SIZE = 40000; // ~40KB per chunk, well under 64KB ubus limit
		var uploadId = siteId + '_' + Date.now();
		var chunks = [];

		for (var i = 0; i < content.length; i += CHUNK_SIZE) {
			chunks.push(content.substring(i, i + CHUNK_SIZE));
		}

		var promise = Promise.resolve();
		chunks.forEach(function(chunk, idx) {
			promise = promise.then(function() {
				return self.uploadChunk(uploadId, chunk, idx);
			});
		});

		return promise.then(function() {
			return self.uploadFinalize(uploadId, siteId, filename);
		});
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
			self.listSites()
		]).then(function(results) {
			return {
				status: results[0] || {},
				sites: results[1] || [],
				hosting: {}
			};
		});
	}
});
