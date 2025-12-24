'use strict';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'status',
	expect: { }
});

var callListVHosts = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'list_vhosts',
	expect: { vhosts: [] }
});

var callGetVHost = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'get_vhost',
	params: ['domain'],
	expect: { }
});

var callAddVHost = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'add_vhost',
	params: ['domain', 'backend', 'ssl', 'auth', 'websocket'],
	expect: { }
});

var callUpdateVHost = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'update_vhost',
	params: ['domain', 'backend', 'ssl', 'auth', 'websocket'],
	expect: { }
});

var callDeleteVHost = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'delete_vhost',
	params: ['domain'],
	expect: { }
});

var callTestBackend = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'test_backend',
	params: ['backend'],
	expect: { }
});

var callRequestCert = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'request_cert',
	params: ['domain', 'email'],
	expect: { }
});

var callListCerts = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'list_certs',
	expect: { certificates: [] }
});

var callReloadNginx = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'reload_nginx',
	expect: { }
});

var callGetAccessLogs = rpc.declare({
	object: 'luci.vhost-manager',
	method: 'get_access_logs',
	params: ['domain', 'lines'],
	expect: { logs: [] }
});

return {
	getStatus: callStatus,
	listVHosts: callListVHosts,
	getVHost: callGetVHost,
	addVHost: callAddVHost,
	updateVHost: callUpdateVHost,
	deleteVHost: callDeleteVHost,
	testBackend: callTestBackend,
	requestCert: callRequestCert,
	listCerts: callListCerts,
	reloadNginx: callReloadNginx,
	getAccessLogs: callGetAccessLogs
};
