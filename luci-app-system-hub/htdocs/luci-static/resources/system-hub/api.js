'use strict';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.system-hub',
	method: 'status',
	expect: {}
});

var callGetSystemInfo = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_system_info',
	expect: {}
});

var callGetHealth = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_health',
	expect: {}
});

var callListServices = rpc.declare({
	object: 'luci.system-hub',
	method: 'list_services',
	expect: { services: [] }
});

var callServiceAction = rpc.declare({
	object: 'luci.system-hub',
	method: 'service_action',
	params: ['service', 'action'],
	expect: {}
});

var callGetLogs = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_logs',
	params: ['lines', 'filter'],
	expect: { logs: [] }
});

var callBackupConfig = rpc.declare({
	object: 'luci.system-hub',
	method: 'backup_config',
	expect: {}
});

var callRestoreConfig = rpc.declare({
	object: 'luci.system-hub',
	method: 'restore_config',
	params: ['data'],
	expect: {}
});

var callReboot = rpc.declare({
	object: 'luci.system-hub',
	method: 'reboot',
	expect: {}
});

var callGetStorage = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_storage',
	expect: { storage: [] }
});

return {
	getStatus: callStatus,
	getSystemInfo: callGetSystemInfo,
	getHealth: callGetHealth,
	listServices: callListServices,
	serviceAction: callServiceAction,
	getLogs: callGetLogs,
	backupConfig: callBackupConfig,
	restoreConfig: callRestoreConfig,
	reboot: callReboot,
	getStorage: callGetStorage
};
