/* global rpc */
'use strict';

'require rpc';

var callStatus = rpc.declare({
	object: 'luci.zigbee2mqtt',
	method: 'status',
	expect: { }
});

var callApply = rpc.declare({
	object: 'luci.zigbee2mqtt',
	method: 'apply',
	params: ['enabled', 'serial_port', 'mqtt_host', 'mqtt_username', 'mqtt_password',
		'base_topic', 'frontend_port', 'channel', 'permit_join', 'data_path']
});

var callLogs = rpc.declare({
	object: 'luci.zigbee2mqtt',
	method: 'logs',
	params: ['tail']
});

var callControl = rpc.declare({
	object: 'luci.zigbee2mqtt',
	method: 'control',
	params: ['action']
});

var callUpdate = rpc.declare({
	object: 'luci.zigbee2mqtt',
	method: 'update'
});

var callInstall = rpc.declare({
	object: 'luci.zigbee2mqtt',
	method: 'install'
});

var callCheck = rpc.declare({
	object: 'luci.zigbee2mqtt',
	method: 'check'
});

return {
	getStatus: callStatus,
	applyConfig: callApply,
	getLogs: callLogs,
	control: callControl,
	update: callUpdate,
	install: callInstall,
	runCheck: callCheck
};
