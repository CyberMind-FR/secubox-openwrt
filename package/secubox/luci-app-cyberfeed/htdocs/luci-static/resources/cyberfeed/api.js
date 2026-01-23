'use strict';
'require rpc';
'require baseclass';

/**
 * CyberFeed API Module
 * RPCD interface for CyberFeed RSS Aggregator
 */

var callGetStatus = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'get_status',
	expect: { }
});

var callGetFeeds = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'get_feeds',
	expect: { feeds: [] }
});

var callGetItems = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'get_items',
	expect: { items: [] }
});

var callAddFeed = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'add_feed',
	params: ['name', 'url', 'type', 'category'],
	expect: { }
});

var callDeleteFeed = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'delete_feed',
	params: ['name'],
	expect: { }
});

var callSyncFeeds = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'sync_feeds',
	expect: { }
});

var callGetConfig = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'get_config',
	expect: { }
});

var callSaveConfig = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'save_config',
	params: ['enabled', 'refresh_interval', 'max_items', 'cache_ttl', 'rssbridge_enabled', 'rssbridge_port'],
	expect: { }
});

var callRssBridgeStatus = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'rssbridge_status',
	expect: { }
});

var callRssBridgeInstall = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'rssbridge_install',
	expect: { }
});

var callRssBridgeControl = rpc.declare({
	object: 'luci.cyberfeed',
	method: 'rssbridge_control',
	params: ['action'],
	expect: { }
});

return baseclass.extend({
	getStatus: function() {
		return callGetStatus();
	},

	getFeeds: function() {
		return callGetFeeds().then(function(res) {
			return res.feeds || [];
		});
	},

	getItems: function() {
		return callGetItems().then(function(res) {
			return res.items || [];
		});
	},

	addFeed: function(name, url, type, category) {
		return callAddFeed(name, url, type || 'rss', category || 'custom');
	},

	deleteFeed: function(name) {
		return callDeleteFeed(name);
	},

	syncFeeds: function() {
		return callSyncFeeds();
	},

	getConfig: function() {
		return callGetConfig();
	},

	saveConfig: function(config) {
		return callSaveConfig(
			config.enabled,
			config.refresh_interval,
			config.max_items,
			config.cache_ttl,
			config.rssbridge_enabled,
			config.rssbridge_port
		);
	},

	getRssBridgeStatus: function() {
		return callRssBridgeStatus();
	},

	installRssBridge: function() {
		return callRssBridgeInstall();
	},

	controlRssBridge: function(action) {
		return callRssBridgeControl(action);
	},

	getDashboardData: function() {
		var self = this;
		return Promise.all([
			self.getStatus(),
			self.getFeeds(),
			self.getItems(),
			self.getRssBridgeStatus()
		]).then(function(results) {
			return {
				status: results[0] || {},
				feeds: results[1] || [],
				items: results[2] || [],
				rssbridge: results[3] || {}
			};
		});
	}
});
