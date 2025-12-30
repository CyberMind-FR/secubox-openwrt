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

var callRescanAdapters = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'rescan_adapters',
	expect: {}
});

var callResetAdapter = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'reset_adapter'
});

// USB Detection RPC Methods
var callGetUSBDevices = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'get_usb_devices',
	expect: { devices: [] }
});

var callDetectIoTAdapters = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'detect_iot_adapters',
	expect: { zigbee: [], zwave: [], modbus: [] }
});

var callGetSerialPorts = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'get_serial_ports',
	expect: { serial_ports: [] }
});

var callGetAdapterInfo = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'get_adapter_info',
	params: ['adapter']
});

var callTestConnection = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'test_connection',
	params: ['port']
});

var callConfigureAdapter = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'configure_adapter',
	params: ['id', 'enabled', 'type', 'title', 'vid', 'pid', 'port']
});

var callGetAdapterStatus = rpc.declare({
	object: 'luci.mqtt-bridge',
	method: 'get_adapter_status',
	expect: { adapters: [] }
});

return baseclass.extend({
	getStatus: callStatus,
	listDevices: callListDevices,
	triggerPairing: callTriggerPairing,
	applySettings: callApplySettings,
	rescanAdapters: callRescanAdapters,
	resetAdapter: callResetAdapter,
	getUSBDevices: callGetUSBDevices,
	detectIoTAdapters: callDetectIoTAdapters,
	getSerialPorts: callGetSerialPorts,
	getAdapterInfo: callGetAdapterInfo,
	testConnection: callTestConnection,
	configureAdapter: callConfigureAdapter,
	getAdapterStatus: callGetAdapterStatus
});
