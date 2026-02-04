'use strict';
'require rpc';
'require baseclass';

/**
 * Streamlit Platform API Module
 * RPCD interface for Streamlit Platform
 */

var callGetStatus = rpc.declare({
	object: 'luci.streamlit',
	method: 'get_status',
	expect: { result: {} }
});

var callGetConfig = rpc.declare({
	object: 'luci.streamlit',
	method: 'get_config',
	expect: { result: {} }
});

var callSaveConfig = rpc.declare({
	object: 'luci.streamlit',
	method: 'save_config',
	params: ['http_port', 'http_host', 'data_path', 'memory_limit', 'enabled', 'active_app', 'headless', 'browser_gather_usage_stats', 'theme_base', 'theme_primary_color'],
	expect: { result: {} }
});

var callStart = rpc.declare({
	object: 'luci.streamlit',
	method: 'start',
	expect: { result: {} }
});

var callStop = rpc.declare({
	object: 'luci.streamlit',
	method: 'stop',
	expect: { result: {} }
});

var callRestart = rpc.declare({
	object: 'luci.streamlit',
	method: 'restart',
	expect: { result: {} }
});

var callInstall = rpc.declare({
	object: 'luci.streamlit',
	method: 'install',
	expect: { result: {} }
});

var callUninstall = rpc.declare({
	object: 'luci.streamlit',
	method: 'uninstall',
	expect: { result: {} }
});

var callUpdate = rpc.declare({
	object: 'luci.streamlit',
	method: 'update',
	expect: { result: {} }
});

var callGetLogs = rpc.declare({
	object: 'luci.streamlit',
	method: 'get_logs',
	params: ['lines'],
	expect: { result: {} }
});

var callListApps = rpc.declare({
	object: 'luci.streamlit',
	method: 'list_apps',
	expect: { result: {} }
});

var callGetApp = rpc.declare({
	object: 'luci.streamlit',
	method: 'get_app',
	params: ['name'],
	expect: { result: {} }
});

var callAddApp = rpc.declare({
	object: 'luci.streamlit',
	method: 'add_app',
	params: ['name', 'path'],
	expect: { result: {} }
});

var callRemoveApp = rpc.declare({
	object: 'luci.streamlit',
	method: 'remove_app',
	params: ['name'],
	expect: { result: {} }
});

var callSetActiveApp = rpc.declare({
	object: 'luci.streamlit',
	method: 'set_active_app',
	params: ['name'],
	expect: { result: {} }
});

var callUploadApp = rpc.declare({
	object: 'luci.streamlit',
	method: 'upload_app',
	params: ['name', 'content'],
	expect: { result: {} }
});

var callUploadZip = rpc.declare({
	object: 'luci.streamlit',
	method: 'upload_zip',
	params: ['name', 'content', 'selected_files'],
	expect: { result: {} }
});

var callPreviewZip = rpc.declare({
	object: 'luci.streamlit',
	method: 'preview_zip',
	params: ['content'],
	expect: { result: {} }
});

var callGetInstallProgress = rpc.declare({
	object: 'luci.streamlit',
	method: 'get_install_progress',
	expect: { result: {} }
});

var callListInstances = rpc.declare({
	object: 'luci.streamlit',
	method: 'list_instances',
	expect: { result: {} }
});

var callAddInstance = rpc.declare({
	object: 'luci.streamlit',
	method: 'add_instance',
	params: ['id', 'name', 'app', 'port'],
	expect: { result: {} }
});

var callRemoveInstance = rpc.declare({
	object: 'luci.streamlit',
	method: 'remove_instance',
	params: ['id'],
	expect: { result: {} }
});

var callEnableInstance = rpc.declare({
	object: 'luci.streamlit',
	method: 'enable_instance',
	params: ['id'],
	expect: { result: {} }
});

var callDisableInstance = rpc.declare({
	object: 'luci.streamlit',
	method: 'disable_instance',
	params: ['id'],
	expect: { result: {} }
});

var callRenameApp = rpc.declare({
	object: 'luci.streamlit',
	method: 'rename_app',
	params: ['id', 'name'],
	expect: { result: {} }
});

var callRenameInstance = rpc.declare({
	object: 'luci.streamlit',
	method: 'rename_instance',
	params: ['id', 'name'],
	expect: { result: {} }
});

var callGetGiteaConfig = rpc.declare({
	object: 'luci.streamlit',
	method: 'get_gitea_config',
	expect: { result: {} }
});

var callSaveGiteaConfig = rpc.declare({
	object: 'luci.streamlit',
	method: 'save_gitea_config',
	params: ['enabled', 'url', 'user', 'token'],
	expect: { result: {} }
});

var callGiteaClone = rpc.declare({
	object: 'luci.streamlit',
	method: 'gitea_clone',
	params: ['name', 'repo'],
	expect: { result: {} }
});

var callGiteaPull = rpc.declare({
	object: 'luci.streamlit',
	method: 'gitea_pull',
	params: ['name'],
	expect: { result: {} }
});

var callGiteaListRepos = rpc.declare({
	object: 'luci.streamlit',
	method: 'gitea_list_repos',
	expect: { result: {} }
});

return baseclass.extend({
	getStatus: function() {
		return callGetStatus();
	},

	getConfig: function() {
		return callGetConfig();
	},

	saveConfig: function(config) {
		return callSaveConfig(
			config.http_port,
			config.http_host,
			config.data_path,
			config.memory_limit,
			config.enabled,
			config.active_app,
			config.headless,
			config.browser_gather_usage_stats,
			config.theme_base,
			config.theme_primary_color
		);
	},

	start: function() {
		return callStart();
	},

	stop: function() {
		return callStop();
	},

	restart: function() {
		return callRestart();
	},

	install: function() {
		return callInstall();
	},

	uninstall: function() {
		return callUninstall();
	},

	update: function() {
		return callUpdate();
	},

	getLogs: function(lines) {
		return callGetLogs(lines || 100).then(function(res) {
			return res.logs || [];
		});
	},

	listApps: function() {
		return callListApps().then(function(res) {
			return {
				apps: res.apps || [],
				active_app: res.active_app || 'hello',
				apps_path: res.apps_path || '/srv/streamlit/apps'
			};
		});
	},

	getApp: function(name) {
		return callGetApp(name);
	},

	addApp: function(name, path) {
		return callAddApp(name, path);
	},

	removeApp: function(name) {
		return callRemoveApp(name);
	},

	setActiveApp: function(name) {
		return callSetActiveApp(name);
	},

	uploadApp: function(name, content) {
		return callUploadApp(name, content);
	},

	uploadZip: function(name, content, selectedFiles) {
		return callUploadZip(name, content, selectedFiles);
	},

	previewZip: function(content) {
		return callPreviewZip(content);
	},

	getInstallProgress: function() {
		return callGetInstallProgress();
	},

	listInstances: function() {
		return callListInstances().then(function(res) {
			return res.instances || [];
		});
	},

	addInstance: function(id, name, app, port) {
		return callAddInstance(id, name, app, port);
	},

	removeInstance: function(id) {
		return callRemoveInstance(id);
	},

	enableInstance: function(id) {
		return callEnableInstance(id);
	},

	disableInstance: function(id) {
		return callDisableInstance(id);
	},

	renameApp: function(id, name) {
		return callRenameApp(id, name);
	},

	renameInstance: function(id, name) {
		return callRenameInstance(id, name);
	},

	getGiteaConfig: function() {
		return callGetGiteaConfig();
	},

	saveGiteaConfig: function(enabled, url, user, token) {
		return callSaveGiteaConfig(enabled, url, user, token);
	},

	giteaClone: function(name, repo) {
		return callGiteaClone(name, repo);
	},

	giteaPull: function(name) {
		return callGiteaPull(name);
	},

	giteaListRepos: function() {
		return callGiteaListRepos();
	},

	getDashboardData: function() {
		var self = this;
		return Promise.all([
			self.getStatus(),
			self.listApps(),
			self.getLogs(50)
		]).then(function(results) {
			return {
				status: results[0] || {},
				apps: results[1] || {},
				logs: results[2] || []
			};
		});
	}
});
