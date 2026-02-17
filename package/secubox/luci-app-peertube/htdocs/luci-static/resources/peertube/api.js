'use strict';
'require rpc';

return L.Class.extend({
	status: rpc.declare({
		object: 'luci.peertube',
		method: 'status',
		expect: { }
	}),

	start: rpc.declare({
		object: 'luci.peertube',
		method: 'start',
		expect: { }
	}),

	stop: rpc.declare({
		object: 'luci.peertube',
		method: 'stop',
		expect: { }
	}),

	install: rpc.declare({
		object: 'luci.peertube',
		method: 'install',
		expect: { }
	}),

	uninstall: rpc.declare({
		object: 'luci.peertube',
		method: 'uninstall',
		expect: { }
	}),

	update: rpc.declare({
		object: 'luci.peertube',
		method: 'update',
		expect: { }
	}),

	logs: rpc.declare({
		object: 'luci.peertube',
		method: 'logs',
		params: ['lines'],
		expect: { }
	}),

	emancipate: rpc.declare({
		object: 'luci.peertube',
		method: 'emancipate',
		params: ['domain'],
		expect: { }
	}),

	liveEnable: rpc.declare({
		object: 'luci.peertube',
		method: 'live_enable',
		expect: { }
	}),

	liveDisable: rpc.declare({
		object: 'luci.peertube',
		method: 'live_disable',
		expect: { }
	}),

	configureHaproxy: rpc.declare({
		object: 'luci.peertube',
		method: 'configure_haproxy',
		expect: { }
	}),

	importVideo: rpc.declare({
		object: 'luci.peertube',
		method: 'import_video',
		params: ['url'],
		expect: { }
	}),

	importStatus: rpc.declare({
		object: 'luci.peertube',
		method: 'import_status',
		expect: { }
	})
});
