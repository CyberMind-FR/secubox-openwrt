'use strict';
'require baseclass';
'require rpc';

var callGetStatus = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'get_status',
	expect: {}
});

var callGetConfig = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'get_config',
	expect: {}
});

var callGetDisplayConfig = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'get_display_config',
	expect: {}
});

var callGetWeatherConfig = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'get_weather_config',
	expect: {}
});

var callGetModulesConfig = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'get_modules_config',
	expect: {}
});

var callGetInstalledModules = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'get_installed_modules',
	expect: { modules: [] }
});

var callGetWebUrl = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'get_web_url',
	expect: {}
});

var callServiceStart = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'service_start',
	expect: {}
});

var callServiceStop = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'service_stop',
	expect: {}
});

var callServiceRestart = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'service_restart',
	expect: {}
});

var callInstallModule = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'install_module',
	params: ['name'],
	expect: {}
});

var callRemoveModule = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'remove_module',
	params: ['name'],
	expect: {}
});

var callUpdateModules = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'update_modules',
	params: ['name'],
	expect: {}
});

var callRegenerateConfig = rpc.declare({
	object: 'luci.magicmirror2',
	method: 'regenerate_config',
	expect: {}
});

var callSetConfig = rpc.declare({
	object: 'luci.magicmirror2',
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

	getDisplayConfig: function() {
		return callGetDisplayConfig();
	},

	getWeatherConfig: function() {
		return callGetWeatherConfig();
	},

	getModulesConfig: function() {
		return callGetModulesConfig();
	},

	getInstalledModules: function() {
		return callGetInstalledModules();
	},

	getWebUrl: function() {
		return callGetWebUrl();
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

	installModule: function(name) {
		return callInstallModule(name);
	},

	removeModule: function(name) {
		return callRemoveModule(name);
	},

	updateModules: function(name) {
		return callUpdateModules(name || '');
	},

	regenerateConfig: function() {
		return callRegenerateConfig();
	},

	setConfig: function(key, value) {
		return callSetConfig(key, String(value));
	}
});
