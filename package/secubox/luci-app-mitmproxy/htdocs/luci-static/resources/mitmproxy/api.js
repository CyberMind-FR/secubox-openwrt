'use strict';
'require baseclass';
'require rpc';

var callMitmproxy = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_status'
});

var callGetConfig = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_config'
});

var callGetTransparentConfig = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_transparent_config'
});

var callGetWhitelistConfig = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_whitelist_config'
});

var callGetFilteringConfig = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_filtering_config'
});

var callGetAllConfig = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_all_config'
});

var callGetStats = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_stats'
});

var callGetRequests = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_requests',
	params: ['limit', 'category']
});

var callGetTopHosts = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_top_hosts',
	params: ['limit']
});

var callGetCaInfo = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_ca_info'
});

var callServiceStart = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'service_start'
});

var callServiceStop = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'service_stop'
});

var callServiceRestart = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'service_restart'
});

var callFirewallSetup = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'firewall_setup'
});

var callFirewallClear = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'firewall_clear'
});

var callSetConfig = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'set_config',
	params: ['key', 'value']
});

var callAddToList = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'add_to_list',
	params: ['key', 'value']
});

var callRemoveFromList = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'remove_from_list',
	params: ['key', 'value']
});

var callClearData = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'clear_data'
});

return baseclass.extend({
	getStatus: function() {
		return callMitmproxy().catch(function() {
			return { running: false, enabled: false };
		});
	},

	getConfig: function() {
		return callGetConfig().catch(function() {
			return {};
		});
	},

	getTransparentConfig: function() {
		return callGetTransparentConfig().catch(function() {
			return { enabled: false };
		});
	},

	getWhitelistConfig: function() {
		return callGetWhitelistConfig().catch(function() {
			return { enabled: true, bypass_ip: [], bypass_domain: [] };
		});
	},

	getFilteringConfig: function() {
		return callGetFilteringConfig().catch(function() {
			return { enabled: false };
		});
	},

	getAllConfig: function() {
		return callGetAllConfig().catch(function() {
			return { main: {}, transparent: {}, whitelist: {}, filtering: {} };
		});
	},

	getStats: function() {
		return callGetStats().catch(function() {
			return {
				total_requests: 0,
				unique_hosts: 0,
				flow_file_size: 0,
				cdn_requests: 0,
				media_requests: 0,
				blocked_ads: 0
			};
		});
	},

	getRequests: function(limit, category) {
		return callGetRequests(limit || 50, category || 'all').catch(function() {
			return { requests: [] };
		});
	},

	getTopHosts: function(limit) {
		return callGetTopHosts(limit || 20).catch(function() {
			return { hosts: [] };
		});
	},

	getCaInfo: function() {
		return callGetCaInfo().catch(function() {
			return { installed: false };
		});
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

	firewallSetup: function() {
		return callFirewallSetup();
	},

	firewallClear: function() {
		return callFirewallClear();
	},

	setConfig: function(key, value) {
		return callSetConfig(key, value);
	},

	addToList: function(key, value) {
		return callAddToList(key, value);
	},

	removeFromList: function(key, value) {
		return callRemoveFromList(key, value);
	},

	clearData: function() {
		return callClearData();
	},

	getAllData: function() {
		var self = this;
		return Promise.all([
			self.getStatus(),
			self.getAllConfig(),
			self.getStats(),
			self.getTopHosts(10),
			self.getCaInfo()
		]).then(function(results) {
			return {
				status: results[0],
				config: results[1].main || results[1],
				allConfig: results[1],
				stats: results[2],
				topHosts: results[3],
				caInfo: results[4]
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
