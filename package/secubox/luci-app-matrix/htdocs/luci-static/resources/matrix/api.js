'use strict';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.matrix',
	method: 'status',
	expect: { }
});

var callLogs = rpc.declare({
	object: 'luci.matrix',
	method: 'logs',
	params: ['lines'],
	expect: { }
});

var callStart = rpc.declare({
	object: 'luci.matrix',
	method: 'start',
	expect: { }
});

var callStop = rpc.declare({
	object: 'luci.matrix',
	method: 'stop',
	expect: { }
});

var callInstall = rpc.declare({
	object: 'luci.matrix',
	method: 'install',
	expect: { }
});

var callUninstall = rpc.declare({
	object: 'luci.matrix',
	method: 'uninstall',
	expect: { }
});

var callUpdate = rpc.declare({
	object: 'luci.matrix',
	method: 'update',
	expect: { }
});

var callEmancipate = rpc.declare({
	object: 'luci.matrix',
	method: 'emancipate',
	params: ['domain'],
	expect: { }
});

var callConfigureHaproxy = rpc.declare({
	object: 'luci.matrix',
	method: 'configure_haproxy',
	expect: { }
});

var callUserAdd = rpc.declare({
	object: 'luci.matrix',
	method: 'user_add',
	params: ['mxid', 'password'],
	expect: { }
});

var callUserDel = rpc.declare({
	object: 'luci.matrix',
	method: 'user_del',
	params: ['mxid'],
	expect: { }
});

var callFederationStatus = rpc.declare({
	object: 'luci.matrix',
	method: 'federation_status',
	expect: { }
});

var callIdentityStatus = rpc.declare({
	object: 'luci.matrix',
	method: 'identity_status',
	expect: { }
});

var callIdentityLink = rpc.declare({
	object: 'luci.matrix',
	method: 'identity_link',
	params: ['mxid'],
	expect: { }
});

var callIdentityUnlink = rpc.declare({
	object: 'luci.matrix',
	method: 'identity_unlink',
	expect: { }
});

var callMeshStatus = rpc.declare({
	object: 'luci.matrix',
	method: 'mesh_status',
	expect: { }
});

var callMeshPublish = rpc.declare({
	object: 'luci.matrix',
	method: 'mesh_publish',
	expect: { }
});

var callMeshUnpublish = rpc.declare({
	object: 'luci.matrix',
	method: 'mesh_unpublish',
	expect: { }
});

return L.Class.extend({
	getStatus: function() { return callStatus(); },
	getLogs: function(lines) { return callLogs(lines || 50); },
	start: function() { return callStart(); },
	stop: function() { return callStop(); },
	install: function() { return callInstall(); },
	uninstall: function() { return callUninstall(); },
	update: function() { return callUpdate(); },
	emancipate: function(domain) { return callEmancipate(domain); },
	configureHaproxy: function() { return callConfigureHaproxy(); },
	userAdd: function(mxid, password) { return callUserAdd(mxid, password); },
	userDel: function(mxid) { return callUserDel(mxid); },
	getFederationStatus: function() { return callFederationStatus(); },
	getIdentityStatus: function() { return callIdentityStatus(); },
	identityLink: function(mxid) { return callIdentityLink(mxid); },
	identityUnlink: function() { return callIdentityUnlink(); },
	getMeshStatus: function() { return callMeshStatus(); },
	meshPublish: function() { return callMeshPublish(); },
	meshUnpublish: function() { return callMeshUnpublish(); }
});
