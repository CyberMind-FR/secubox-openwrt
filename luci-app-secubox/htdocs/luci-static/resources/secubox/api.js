'use strict';
'require baseclass';
'require rpc';

/**
 * SecuBox Master API
 * Package: luci-app-secubox
 * RPCD object: luci.secubox
 */

var callStatus = rpc.declare({
	object: 'luci.secubox',
	method: 'status',
	expect: { }
});

var callModules = rpc.declare({
	object: 'luci.secubox',
	method: 'modules',
	expect: { modules: [] }
});

var callModulesByCategory = rpc.declare({
	object: 'luci.secubox',
	method: 'modules_by_category',
	params: ['category'],
	expect: { modules: [] }
});

var callModuleInfo = rpc.declare({
	object: 'luci.secubox',
	method: 'module_info',
	params: ['module'],
	expect: { }
});

var callStartModule = rpc.declare({
	object: 'luci.secubox',
	method: 'start_module',
	params: ['module']
});

var callStopModule = rpc.declare({
	object: 'luci.secubox',
	method: 'stop_module',
	params: ['module']
});

var callRestartModule = rpc.declare({
	object: 'luci.secubox',
	method: 'restart_module',
	params: ['module']
});

var callHealth = rpc.declare({
	object: 'luci.secubox',
	method: 'health',
	expect: { checks: [], overall: '' }
});

var callDiagnostics = rpc.declare({
	object: 'luci.secubox',
	method: 'diagnostics',
	expect: { }
});

function formatUptime(seconds) {
	if (!seconds) return '0s';
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	if (d > 0) return d + 'd ' + h + 'h';
	if (h > 0) return h + 'h ' + m + 'm';
	return m + 'm';
}

return baseclass.extend({
	getStatus: callStatus,
	getModules: callModules,
	getModulesByCategory: callModulesByCategory,
	getModuleInfo: callModuleInfo,
	startModule: callStartModule,
	stopModule: callStopModule,
	restartModule: callRestartModule,
	getHealth: callHealth,
	getDiagnostics: callDiagnostics,
	formatUptime: formatUptime
});
