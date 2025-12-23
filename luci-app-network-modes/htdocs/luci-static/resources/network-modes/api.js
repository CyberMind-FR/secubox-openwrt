'use strict';
'require baseclass';
'require rpc';

/**
 * Network Modes API
 * Package: luci-app-network-modes
 * RPCD object: luci.network-modes
 */

var callStatus = rpc.declare({
	object: 'luci.network-modes',
	method: 'status',
	expect: { }
});

var callGetCurrentMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'get_current_mode',
	expect: { mode: '' }
});

var callGetAvailableModes = rpc.declare({
	object: 'luci.network-modes',
	method: 'get_available_modes',
	expect: { modes: [] }
});

var callSetMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'set_mode',
	params: ['mode']
});

var callGetInterfaces = rpc.declare({
	object: 'luci.network-modes',
	method: 'get_interfaces',
	expect: { interfaces: [] }
});

var callValidateConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'validate_config',
	params: ['mode', 'config'],
	expect: { valid: false, errors: [] }
});

return baseclass.extend({
	getStatus: callStatus,
	getCurrentMode: callGetCurrentMode,
	getAvailableModes: callGetAvailableModes,
	setMode: callSetMode,
	getInterfaces: callGetInterfaces,
	validateConfig: callValidateConfig
});
