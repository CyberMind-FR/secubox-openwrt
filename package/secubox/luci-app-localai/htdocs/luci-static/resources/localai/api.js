'use strict';
'require baseclass';
'require rpc';

/**
 * LocalAI Dashboard API
 * Package: luci-app-localai
 * RPCD object: luci.localai
 */

// Version: 0.1.0

var callStatus = rpc.declare({
	object: 'luci.localai',
	method: 'status',
	expect: { }
});

var callModels = rpc.declare({
	object: 'luci.localai',
	method: 'models',
	expect: { models: [] }
});

var callConfig = rpc.declare({
	object: 'luci.localai',
	method: 'config',
	expect: { }
});

var callHealth = rpc.declare({
	object: 'luci.localai',
	method: 'health',
	expect: { healthy: false }
});

var callMetrics = rpc.declare({
	object: 'luci.localai',
	method: 'metrics',
	expect: { }
});

var callStart = rpc.declare({
	object: 'luci.localai',
	method: 'start',
	expect: { success: false }
});

var callStop = rpc.declare({
	object: 'luci.localai',
	method: 'stop',
	expect: { success: false }
});

var callRestart = rpc.declare({
	object: 'luci.localai',
	method: 'restart',
	expect: { success: false }
});

var callModelInstall = rpc.declare({
	object: 'luci.localai',
	method: 'model_install',
	params: ['name'],
	expect: { success: false }
});

var callModelRemove = rpc.declare({
	object: 'luci.localai',
	method: 'model_remove',
	params: ['name'],
	expect: { success: false }
});

var callChat = rpc.declare({
	object: 'luci.localai',
	method: 'chat',
	params: ['model', 'messages'],
	expect: { response: '' }
});

var callComplete = rpc.declare({
	object: 'luci.localai',
	method: 'complete',
	params: ['model', 'prompt'],
	expect: { text: '' }
});

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
	if (!seconds) return 'N/A';
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor((seconds % 86400) / 3600);
	var mins = Math.floor((seconds % 3600) / 60);

	if (days > 0) return days + 'd ' + hours + 'h';
	if (hours > 0) return hours + 'h ' + mins + 'm';
	return mins + 'm';
}

return baseclass.extend({
	getStatus: callStatus,
	getModels: callModels,
	getConfig: callConfig,
	getHealth: callHealth,
	getMetrics: callMetrics,
	start: callStart,
	stop: callStop,
	restart: callRestart,
	modelInstall: callModelInstall,
	modelRemove: callModelRemove,
	chat: callChat,
	complete: callComplete,
	formatBytes: formatBytes,
	formatUptime: formatUptime,

	// Aggregate function for dashboard
	getDashboardData: function() {
		return Promise.all([
			callStatus(),
			callModels(),
			callHealth(),
			callMetrics()
		]).then(function(results) {
			return {
				status: results[0] || {},
				models: results[1] || { models: [] },
				health: results[2] || { healthy: false },
				metrics: results[3] || {}
			};
		});
	}
});
