'use strict';
'require rpc';
'require baseclass';

/**
 * Gitea Platform API Module
 * RPCD interface for Gitea Platform
 */

var callGetStatus = rpc.declare({
	object: 'luci.gitea',
	method: 'get_status',
	expect: { result: {} }
});

var callGetStats = rpc.declare({
	object: 'luci.gitea',
	method: 'get_stats',
	expect: { result: {} }
});

var callGetConfig = rpc.declare({
	object: 'luci.gitea',
	method: 'get_config',
	expect: { result: {} }
});

var callSaveConfig = rpc.declare({
	object: 'luci.gitea',
	method: 'save_config',
	params: ['http_port', 'ssh_port', 'http_host', 'data_path', 'memory_limit', 'enabled', 'app_name', 'domain', 'protocol', 'disable_registration', 'require_signin', 'landing_page'],
	expect: { result: {} }
});

var callStart = rpc.declare({
	object: 'luci.gitea',
	method: 'start',
	expect: { result: {} }
});

var callStop = rpc.declare({
	object: 'luci.gitea',
	method: 'stop',
	expect: { result: {} }
});

var callRestart = rpc.declare({
	object: 'luci.gitea',
	method: 'restart',
	expect: { result: {} }
});

var callInstall = rpc.declare({
	object: 'luci.gitea',
	method: 'install',
	expect: { result: {} }
});

var callUninstall = rpc.declare({
	object: 'luci.gitea',
	method: 'uninstall',
	expect: { result: {} }
});

var callUpdate = rpc.declare({
	object: 'luci.gitea',
	method: 'update',
	expect: { result: {} }
});

var callGetLogs = rpc.declare({
	object: 'luci.gitea',
	method: 'get_logs',
	params: ['lines'],
	expect: { result: {} }
});

var callListRepos = rpc.declare({
	object: 'luci.gitea',
	method: 'list_repos',
	expect: { result: {} }
});

var callGetRepo = rpc.declare({
	object: 'luci.gitea',
	method: 'get_repo',
	params: ['name', 'owner'],
	expect: { result: {} }
});

var callListUsers = rpc.declare({
	object: 'luci.gitea',
	method: 'list_users',
	expect: { result: {} }
});

var callCreateAdmin = rpc.declare({
	object: 'luci.gitea',
	method: 'create_admin',
	params: ['username', 'password', 'email'],
	expect: { result: {} }
});

var callCreateBackup = rpc.declare({
	object: 'luci.gitea',
	method: 'create_backup',
	expect: { result: {} }
});

var callListBackups = rpc.declare({
	object: 'luci.gitea',
	method: 'list_backups',
	expect: { result: {} }
});

var callRestoreBackup = rpc.declare({
	object: 'luci.gitea',
	method: 'restore_backup',
	params: ['file'],
	expect: { result: {} }
});

var callGetInstallProgress = rpc.declare({
	object: 'luci.gitea',
	method: 'get_install_progress',
	expect: { result: {} }
});

return baseclass.extend({
	getStatus: function() {
		return callGetStatus();
	},

	getStats: function() {
		return callGetStats();
	},

	getConfig: function() {
		return callGetConfig();
	},

	saveConfig: function(config) {
		return callSaveConfig(
			config.http_port,
			config.ssh_port,
			config.http_host,
			config.data_path,
			config.memory_limit,
			config.enabled,
			config.app_name,
			config.domain,
			config.protocol,
			config.disable_registration,
			config.require_signin,
			config.landing_page
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

	listRepos: function() {
		return callListRepos().then(function(res) {
			return {
				repos: res.repos || [],
				repo_root: res.repo_root || '/srv/gitea/git/repositories'
			};
		});
	},

	getRepo: function(name, owner) {
		return callGetRepo(name, owner);
	},

	listUsers: function() {
		return callListUsers().then(function(res) {
			return res.users || [];
		});
	},

	createAdmin: function(username, password, email) {
		return callCreateAdmin(username, password, email);
	},

	createBackup: function() {
		return callCreateBackup();
	},

	listBackups: function() {
		return callListBackups().then(function(res) {
			return res.backups || [];
		});
	},

	restoreBackup: function(file) {
		return callRestoreBackup(file);
	},

	getInstallProgress: function() {
		return callGetInstallProgress();
	},

	getDashboardData: function() {
		var self = this;
		return Promise.all([
			self.getStatus(),
			self.getStats(),
			self.getLogs(50)
		]).then(function(results) {
			return {
				status: results[0] || {},
				stats: results[1] || {},
				logs: results[2] || []
			};
		});
	}
});
