'use strict';
'require baseclass';
'require rpc';

var callGetStatus = rpc.declare({
	object: 'luci.mmpm',
	method: 'get_status',
	expect: {}
});

var callGetConfig = rpc.declare({
	object: 'luci.mmpm',
	method: 'get_config',
	expect: {}
});

var callGetWebUrl = rpc.declare({
	object: 'luci.mmpm',
	method: 'get_web_url',
	expect: {}
});

var callInstallMmpm = rpc.declare({
	object: 'luci.mmpm',
	method: 'install_mmpm',
	expect: {}
});

var callUpdateMmpm = rpc.declare({
	object: 'luci.mmpm',
	method: 'update_mmpm',
	expect: {}
});

var callServiceStart = rpc.declare({
	object: 'luci.mmpm',
	method: 'service_start',
	expect: {}
});

var callServiceStop = rpc.declare({
	object: 'luci.mmpm',
	method: 'service_stop',
	expect: {}
});

var callServiceRestart = rpc.declare({
	object: 'luci.mmpm',
	method: 'service_restart',
	expect: {}
});

var callSearchModules = rpc.declare({
	object: 'luci.mmpm',
	method: 'search_modules',
	params: ['query'],
	expect: { modules: [] }
});

var callListModules = rpc.declare({
	object: 'luci.mmpm',
	method: 'list_modules',
	expect: { modules: [] }
});

var callInstallModule = rpc.declare({
	object: 'luci.mmpm',
	method: 'install_module',
	params: ['name'],
	expect: {}
});

var callRemoveModule = rpc.declare({
	object: 'luci.mmpm',
	method: 'remove_module',
	params: ['name'],
	expect: {}
});

var callUpgradeModules = rpc.declare({
	object: 'luci.mmpm',
	method: 'upgrade_modules',
	params: ['name'],
	expect: {}
});

var callSetConfig = rpc.declare({
	object: 'luci.mmpm',
	method: 'set_config',
	params: ['key', 'value'],
	expect: {}
});

return baseclass.extend({
	getStatus: function() {
		return callGetStatus();
	},

	getConfig: function() {
		return callGetConfig();
	},

	getWebUrl: function() {
		return callGetWebUrl();
	},

	installMmpm: function() {
		return callInstallMmpm();
	},

	updateMmpm: function() {
		return callUpdateMmpm();
	},

	serviceStart: function() {
		return callServiceStart();
	},

	serviceStop: function() {
		return callServiceStop();
	},

	serviceRestart: function() {
		return callServiceRestart();
	},

	searchModules: function(query) {
		return callSearchModules(query);
	},

	listModules: function() {
		return callListModules();
	},

	installModule: function(name) {
		return callInstallModule(name);
	},

	removeModule: function(name) {
		return callRemoveModule(name);
	},

	upgradeModules: function(name) {
		return callUpgradeModules(name || '');
	},

	setConfig: function(key, value) {
		return callSetConfig(key, String(value));
	}
});
