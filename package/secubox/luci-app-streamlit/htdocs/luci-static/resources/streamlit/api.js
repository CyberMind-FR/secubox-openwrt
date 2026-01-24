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

var callGetInstallProgress = rpc.declare({
	object: 'luci.streamlit',
	method: 'get_install_progress',
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

	getInstallProgress: function() {
		return callGetInstallProgress();
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
