'use strict';
'require baseclass';
'require rpc';

var callScan = rpc.declare({
	object: 'luci.exposure',
	method: 'scan',
	expect: {}
});

var callTorList = rpc.declare({
	object: 'luci.exposure',
	method: 'tor_list',
	expect: {}
});

var callSslList = rpc.declare({
	object: 'luci.exposure',
	method: 'ssl_list',
	expect: {}
});

var callTorAdd = rpc.declare({
	object: 'luci.exposure',
	method: 'tor_add',
	params: ['service', 'local_port', 'onion_port'],
	expect: {}
});

var callTorRemove = rpc.declare({
	object: 'luci.exposure',
	method: 'tor_remove',
	params: ['service'],
	expect: {}
});

var callSslAdd = rpc.declare({
	object: 'luci.exposure',
	method: 'ssl_add',
	params: ['service', 'domain', 'local_port'],
	expect: {}
});

var callSslRemove = rpc.declare({
	object: 'luci.exposure',
	method: 'ssl_remove',
	params: ['service'],
	expect: {}
});

var callVhostList = rpc.declare({
	object: 'luci.exposure',
	method: 'vhost_list',
	expect: {}
});

return baseclass.extend({
	scan: function() { return callScan(); },
	torList: function() { return callTorList(); },
	sslList: function() { return callSslList(); },
	vhostList: function() { return callVhostList(); },
	torAdd: function(s, l, o) { return callTorAdd(s, l, o); },
	torRemove: function(s) { return callTorRemove(s); },
	sslAdd: function(s, d, p) { return callSslAdd(s, d, p); },
	sslRemove: function(s) { return callSslRemove(s); }
});
