'use strict';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.voip',
	method: 'status',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.voip',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.voip',
	method: 'stop',
	expect: {}
});

var callInstall = rpc.declare({
	object: 'luci.voip',
	method: 'install',
	expect: {}
});

var callUninstall = rpc.declare({
	object: 'luci.voip',
	method: 'uninstall',
	expect: {}
});

var callLogs = rpc.declare({
	object: 'luci.voip',
	method: 'logs',
	params: ['lines'],
	expect: {}
});

var callExtAdd = rpc.declare({
	object: 'luci.voip',
	method: 'ext_add',
	params: ['ext', 'name', 'password'],
	expect: {}
});

var callExtDel = rpc.declare({
	object: 'luci.voip',
	method: 'ext_del',
	params: ['ext'],
	expect: {}
});

var callExtList = rpc.declare({
	object: 'luci.voip',
	method: 'ext_list',
	expect: {}
});

var callOriginate = rpc.declare({
	object: 'luci.voip',
	method: 'call_originate',
	params: ['from_ext', 'to_number'],
	expect: {}
});

var callCallsList = rpc.declare({
	object: 'luci.voip',
	method: 'calls_list',
	expect: {}
});

var callTrunkStatus = rpc.declare({
	object: 'luci.voip',
	method: 'trunk_status',
	expect: {}
});

var callTrunkAddOvh = rpc.declare({
	object: 'luci.voip',
	method: 'trunk_add_ovh',
	expect: {}
});

var callConfigureHaproxy = rpc.declare({
	object: 'luci.voip',
	method: 'configure_haproxy',
	expect: {}
});

var callEmancipate = rpc.declare({
	object: 'luci.voip',
	method: 'emancipate',
	params: ['domain'],
	expect: {}
});

return {
	getStatus: function() {
		return callStatus();
	},

	start: function() {
		return callStart();
	},

	stop: function() {
		return callStop();
	},

	install: function() {
		return callInstall();
	},

	uninstall: function() {
		return callUninstall();
	},

	getLogs: function(lines) {
		return callLogs(lines || 50);
	},

	addExtension: function(ext, name, password) {
		return callExtAdd(ext, name, password || '');
	},

	deleteExtension: function(ext) {
		return callExtDel(ext);
	},

	listExtensions: function() {
		return callExtList();
	},

	originateCall: function(fromExt, toNumber) {
		return callOriginate(fromExt, toNumber);
	},

	listCalls: function() {
		return callCallsList();
	},

	getTrunkStatus: function() {
		return callTrunkStatus();
	},

	addOvhTrunk: function() {
		return callTrunkAddOvh();
	},

	configureHaproxy: function() {
		return callConfigureHaproxy();
	},

	emancipate: function(domain) {
		return callEmancipate(domain);
	}
};
