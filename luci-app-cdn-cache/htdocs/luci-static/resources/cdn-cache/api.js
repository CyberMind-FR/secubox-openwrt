'use strict';
'require baseclass';
'require rpc';

/**
 * CDN Cache API
 * Package: luci-app-cdn-cache
 * RPCD object: luci.cdn-cache
 */

var callStatus = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'status',
	expect: { }
});

var callStats = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'stats',
	expect: { }
});

var callCacheList = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'cache_list',
	params: ['path', 'limit'],
	expect: { files: [] }
});

var callTopDomains = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'top_domains',
	params: ['limit'],
	expect: { domains: [] }
});

var callBandwidthSavings = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'bandwidth_savings',
	params: ['period'],
	expect: { }
});

var callPurgeCache = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'purge_cache'
});

var callPurgeDomain = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'purge_domain',
	params: ['domain']
});

var callPreloadUrl = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'preload_url',
	params: ['url']
});

var callGetPolicies = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'policies',
	expect: { policies: [] }
});

var callAddPolicy = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'add_policy',
	params: ['name', 'domains', 'extensions', 'cache_time', 'max_size'],
	expect: { }
});

var callRemovePolicy = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'remove_policy',
	params: ['id'],
	expect: { }
});

// Specification-compliant methods (rules = policies)
var callListRules = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'list_rules',
	expect: { policies: [] }
});

var callAddRule = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'add_rule',
	params: ['name', 'domains', 'extensions', 'cache_time', 'max_size'],
	expect: { }
});

var callDeleteRule = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'delete_rule',
	params: ['id'],
	expect: { }
});

var callSetLimits = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'set_limits',
	params: ['max_size_mb', 'cache_valid'],
	expect: { }
});

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
	if (!seconds) return '0s';
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	if (d > 0) return d + 'd ' + h + 'h';
	if (h > 0) return h + 'h ' + m + 'm';
	return m + 'm';
}

function formatHitRatio(hits, misses) {
	var total = hits + misses;
	if (total === 0) return '0%';
	return ((hits / total) * 100).toFixed(1) + '%';
}

return baseclass.extend({
	getStatus: callStatus,
	getStats: callStats,
	getCacheList: callCacheList,
	getTopDomains: callTopDomains,
	getBandwidthSavings: callBandwidthSavings,
	purgeCache: callPurgeCache,
	purgeDomain: callPurgeDomain,
	preloadUrl: callPreloadUrl,
	// Policy methods
	getPolicies: callGetPolicies,
	addPolicy: callAddPolicy,
	removePolicy: callRemovePolicy,
	// Specification-compliant methods (rules = policies)
	listRules: callListRules,
	addRule: callAddRule,
	deleteRule: callDeleteRule,
	setLimits: callSetLimits,
	// Utility functions
	formatBytes: formatBytes,
	formatUptime: formatUptime,
	formatHitRatio: formatHitRatio
});
