'use strict';
'require rpc';

return L.Class.extend({
	status: rpc.declare({
		object: 'luci.jabber',
		method: 'status',
		expect: { }
	}),

	start: rpc.declare({
		object: 'luci.jabber',
		method: 'start',
		expect: { }
	}),

	stop: rpc.declare({
		object: 'luci.jabber',
		method: 'stop',
		expect: { }
	}),

	install: rpc.declare({
		object: 'luci.jabber',
		method: 'install',
		expect: { }
	}),

	uninstall: rpc.declare({
		object: 'luci.jabber',
		method: 'uninstall',
		expect: { }
	}),

	update: rpc.declare({
		object: 'luci.jabber',
		method: 'update',
		expect: { }
	}),

	logs: rpc.declare({
		object: 'luci.jabber',
		method: 'logs',
		params: ['lines'],
		expect: { }
	}),

	emancipate: rpc.declare({
		object: 'luci.jabber',
		method: 'emancipate',
		params: ['domain'],
		expect: { }
	}),

	configureHaproxy: rpc.declare({
		object: 'luci.jabber',
		method: 'configure_haproxy',
		expect: { }
	}),

	userAdd: rpc.declare({
		object: 'luci.jabber',
		method: 'user_add',
		params: ['jid', 'password'],
		expect: { }
	}),

	userDel: rpc.declare({
		object: 'luci.jabber',
		method: 'user_del',
		params: ['jid'],
		expect: { }
	}),

	userPasswd: rpc.declare({
		object: 'luci.jabber',
		method: 'user_passwd',
		params: ['jid', 'password'],
		expect: { }
	}),

	userList: rpc.declare({
		object: 'luci.jabber',
		method: 'user_list',
		expect: { }
	}),

	roomCreate: rpc.declare({
		object: 'luci.jabber',
		method: 'room_create',
		params: ['name'],
		expect: { }
	}),

	roomDelete: rpc.declare({
		object: 'luci.jabber',
		method: 'room_delete',
		params: ['name'],
		expect: { }
	}),

	roomList: rpc.declare({
		object: 'luci.jabber',
		method: 'room_list',
		expect: { }
	})
});
