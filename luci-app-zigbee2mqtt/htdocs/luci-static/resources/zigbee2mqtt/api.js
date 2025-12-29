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
	method: 'apply'
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

return {
	getStatus: callStatus,
	applyConfig: callApply,
	getLogs: callLogs,
	control: callControl,
	update: callUpdate
};
