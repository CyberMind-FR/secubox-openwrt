'use strict';
'require baseclass';
'require rpc';

/**
 * LocalRecall Memory API
 * Package: luci-app-localrecall
 * RPCD object: luci.localrecall
 * Version: 1.0.0
 */

var callStatus = rpc.declare({
	object: 'luci.localrecall',
	method: 'status',
	expect: { }
});

var callGetMemories = rpc.declare({
	object: 'luci.localrecall',
	method: 'get_memories',
	params: ['category', 'limit'],
	expect: { }
});

var callSearch = rpc.declare({
	object: 'luci.localrecall',
	method: 'search',
	params: ['query', 'limit'],
	expect: { }
});

var callStats = rpc.declare({
	object: 'luci.localrecall',
	method: 'stats',
	expect: { }
});

var callAdd = rpc.declare({
	object: 'luci.localrecall',
	method: 'add',
	params: ['category', 'content', 'agent', 'importance'],
	expect: { }
});

var callDelete = rpc.declare({
	object: 'luci.localrecall',
	method: 'delete',
	params: ['id'],
	expect: { }
});

var callCleanup = rpc.declare({
	object: 'luci.localrecall',
	method: 'cleanup',
	expect: { }
});

var callSummarize = rpc.declare({
	object: 'luci.localrecall',
	method: 'summarize',
	params: ['category'],
	expect: { }
});

function formatRelativeTime(dateStr) {
	if (!dateStr) return 'N/A';
	try {
		var date = new Date(dateStr);
		var now = new Date();
		var seconds = Math.floor((now - date) / 1000);
		if (seconds < 60) return seconds + 's ago';
		if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
		if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
		return Math.floor(seconds / 86400) + 'd ago';
	} catch(e) {
		return dateStr;
	}
}

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getCategoryIcon(category) {
	switch (category) {
		case 'threats': return '\u26A0';
		case 'decisions': return '\u2714';
		case 'patterns': return '\uD83D\uDD0D';
		case 'configs': return '\u2699';
		case 'conversations': return '\uD83D\uDCAC';
		default: return '\u2022';
	}
}

function getImportanceColor(importance) {
	if (importance >= 8) return 'danger';
	if (importance >= 6) return 'warning';
	if (importance >= 4) return 'info';
	return '';
}

return baseclass.extend({
	getStatus: callStatus,
	getMemories: callGetMemories,
	search: callSearch,
	getStats: callStats,
	add: callAdd,
	delete: callDelete,
	cleanup: callCleanup,
	summarize: callSummarize,

	formatRelativeTime: formatRelativeTime,
	formatBytes: formatBytes,
	getCategoryIcon: getCategoryIcon,
	getImportanceColor: getImportanceColor,

	getOverview: function() {
		return Promise.all([
			callStatus(),
			callGetMemories(null, 50),
			callStats()
		]).then(function(results) {
			return {
				status: results[0] || {},
				memories: (results[1] || {}).memories || [],
				stats: (results[2] || {}).agents || {}
			};
		});
	}
});
