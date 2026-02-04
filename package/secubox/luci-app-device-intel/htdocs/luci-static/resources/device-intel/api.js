'use strict';
'require baseclass';
'require rpc';

var callGetDevices = rpc.declare({
	object: 'luci.device-intel',
	method: 'get_devices',
	expect: {}
});

var callGetDevice = rpc.declare({
	object: 'luci.device-intel',
	method: 'get_device',
	params: ['mac'],
	expect: {}
});

var callGetSummary = rpc.declare({
	object: 'luci.device-intel',
	method: 'get_summary',
	expect: {}
});

var callGetMeshDevices = rpc.declare({
	object: 'luci.device-intel',
	method: 'get_mesh_devices',
	expect: {}
});

var callGetEmulators = rpc.declare({
	object: 'luci.device-intel',
	method: 'get_emulators',
	expect: {}
});

var callGetDeviceTypes = rpc.declare({
	object: 'luci.device-intel',
	method: 'get_device_types',
	expect: {}
});

var callClassifyDevice = rpc.declare({
	object: 'luci.device-intel',
	method: 'classify_device',
	params: ['mac'],
	expect: {}
});

var callSetDeviceMeta = rpc.declare({
	object: 'luci.device-intel',
	method: 'set_device_meta',
	params: ['mac', 'type', 'label'],
	expect: {}
});

var callRefresh = rpc.declare({
	object: 'luci.device-intel',
	method: 'refresh',
	expect: {}
});

return baseclass.extend({
	getDevices: function() { return callGetDevices(); },
	getDevice: function(mac) { return callGetDevice(mac); },
	getSummary: function() { return callGetSummary(); },
	getMeshDevices: function() { return callGetMeshDevices(); },
	getEmulators: function() { return callGetEmulators(); },
	getDeviceTypes: function() { return callGetDeviceTypes(); },
	classifyDevice: function(mac) { return callClassifyDevice(mac); },
	setDeviceMeta: function(mac, type, label) { return callSetDeviceMeta(mac, type, label); },
	refresh: function() { return callRefresh(); }
});
