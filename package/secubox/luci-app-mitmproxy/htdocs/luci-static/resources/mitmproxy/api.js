'use strict';
'require baseclass';
'require rpc';

// Status and settings
var callStatus = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'status',
	expect: {}
});

var callSettings = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'settings',
	expect: {}
});

var callSaveSettings = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'save_settings',
	params: ['mode', 'enabled', 'proxy_port', 'web_port', 'web_host', 'data_path',
		'memory_limit', 'upstream_proxy', 'reverse_target', 'ssl_insecure',
		'anticache', 'anticomp', 'transparent_enabled', 'transparent_interface',
		'redirect_http', 'redirect_https', 'filtering_enabled', 'log_requests',
		'filter_cdn', 'filter_media', 'block_ads', 'apply_now'],
	expect: {}
});

var callSetMode = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'set_mode',
	params: ['mode', 'apply_now'],
	expect: {}
});

// Service control
var callInstall = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'install',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'stop',
	expect: {}
});

var callRestart = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'restart',
	expect: {}
});

// Firewall control
var callSetupFirewall = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'setup_firewall',
	expect: {}
});

var callClearFirewall = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'clear_firewall',
	expect: {}
});

return baseclass.extend({
	getStatus: function() {
		return callStatus().catch(function() {
			return {
				running: false,
				enabled: false,
				installed: false,
				lxc_available: false,
				mode: 'regular',
				nft_active: false
			};
		});
	},

	getSettings: function() {
		return callSettings().catch(function() {
			return {
				enabled: false,
				mode: 'regular',
				proxy_port: 8888,
				web_port: 8081,
				web_host: '0.0.0.0',
				data_path: '/srv/mitmproxy',
				memory_limit: '256M',
				transparent_enabled: false,
				transparent_interface: 'br-lan',
				redirect_http: true,
				redirect_https: true,
				filtering_enabled: false,
				log_requests: true,
				filter_cdn: false,
				filter_media: false,
				block_ads: false
			};
		});
	},

	saveSettings: function(settings) {
		return callSaveSettings(
			settings.mode,
			settings.enabled,
			settings.proxy_port,
			settings.web_port,
			settings.web_host,
			settings.data_path,
			settings.memory_limit,
			settings.upstream_proxy,
			settings.reverse_target,
			settings.ssl_insecure,
			settings.anticache,
			settings.anticomp,
			settings.transparent_enabled,
			settings.transparent_interface,
			settings.redirect_http,
			settings.redirect_https,
			settings.filtering_enabled,
			settings.log_requests,
			settings.filter_cdn,
			settings.filter_media,
			settings.block_ads,
			settings.apply_now !== false
		);
	},

	setMode: function(mode, applyNow) {
		return callSetMode(mode, applyNow !== false);
	},

	install: function() {
		return callInstall();
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

	setupFirewall: function() {
		return callSetupFirewall();
	},

	clearFirewall: function() {
		return callClearFirewall();
	},

	getAllData: function() {
		var self = this;
		return Promise.all([
			self.getStatus(),
			self.getSettings()
		]).then(function(results) {
			return {
				status: results[0],
				settings: results[1]
			};
		});
	},

	formatBytes: function(bytes) {
		if (!bytes || bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	formatNumber: function(num) {
		if (!num) return '0';
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
	}
});
