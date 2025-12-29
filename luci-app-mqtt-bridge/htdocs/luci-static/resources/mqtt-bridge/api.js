'use strict';
'require baseclass';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'status',
	expect: {}
});

var callListDevices = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'list_devices',
	expect: { devices: [] }
});

var callTriggerPairing = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'trigger_pairing',
	expect: {}
});

var callApplySettings = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'apply_settings'
});

return baseclass.extend({
	getStatus: callStatus,
	listDevices: callListDevices,
	triggerPairing: callTriggerPairing,
	applySettings: callApplySettings
});
