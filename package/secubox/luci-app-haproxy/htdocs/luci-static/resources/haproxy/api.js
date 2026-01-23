'use strict';
'require rpc';

var api = {
	// Status
	status: rpc.declare({
		object: 'luci.haproxy',
		method: 'status',
		expect: { }
	}),

	getStats: rpc.declare({
		object: 'luci.haproxy',
		method: 'get_stats',
		expect: { }
	}),

	// Vhosts
	listVhosts: rpc.declare({
		object: 'luci.haproxy',
		method: 'list_vhosts',
		expect: { vhosts: [] }
	}),

	getVhost: rpc.declare({
		object: 'luci.haproxy',
		method: 'get_vhost',
		params: ['id'],
		expect: { }
	}),

	createVhost: rpc.declare({
		object: 'luci.haproxy',
		method: 'create_vhost',
		params: ['domain', 'backend', 'ssl', 'ssl_redirect', 'acme', 'enabled'],
		expect: { }
	}),

	updateVhost: rpc.declare({
		object: 'luci.haproxy',
		method: 'update_vhost',
		params: ['id', 'domain', 'backend', 'ssl', 'ssl_redirect', 'acme', 'enabled'],
		expect: { }
	}),

	deleteVhost: rpc.declare({
		object: 'luci.haproxy',
		method: 'delete_vhost',
		params: ['id'],
		expect: { }
	}),

	// Backends
	listBackends: rpc.declare({
		object: 'luci.haproxy',
		method: 'list_backends',
		expect: { backends: [] }
	}),

	getBackend: rpc.declare({
		object: 'luci.haproxy',
		method: 'get_backend',
		params: ['id'],
		expect: { }
	}),

	createBackend: rpc.declare({
		object: 'luci.haproxy',
		method: 'create_backend',
		params: ['name', 'mode', 'balance', 'health_check', 'enabled'],
		expect: { }
	}),

	updateBackend: rpc.declare({
		object: 'luci.haproxy',
		method: 'update_backend',
		params: ['id', 'name', 'mode', 'balance', 'health_check', 'enabled'],
		expect: { }
	}),

	deleteBackend: rpc.declare({
		object: 'luci.haproxy',
		method: 'delete_backend',
		params: ['id'],
		expect: { }
	}),

	// Servers
	listServers: rpc.declare({
		object: 'luci.haproxy',
		method: 'list_servers',
		params: ['backend'],
		expect: { servers: [] }
	}),

	createServer: rpc.declare({
		object: 'luci.haproxy',
		method: 'create_server',
		params: ['backend', 'name', 'address', 'port', 'weight', 'check', 'enabled'],
		expect: { }
	}),

	updateServer: rpc.declare({
		object: 'luci.haproxy',
		method: 'update_server',
		params: ['id', 'backend', 'name', 'address', 'port', 'weight', 'check', 'enabled'],
		expect: { }
	}),

	deleteServer: rpc.declare({
		object: 'luci.haproxy',
		method: 'delete_server',
		params: ['id'],
		expect: { }
	}),

	// Certificates
	listCertificates: rpc.declare({
		object: 'luci.haproxy',
		method: 'list_certificates',
		expect: { certificates: [] }
	}),

	requestCertificate: rpc.declare({
		object: 'luci.haproxy',
		method: 'request_certificate',
		params: ['domain'],
		expect: { }
	}),

	importCertificate: rpc.declare({
		object: 'luci.haproxy',
		method: 'import_certificate',
		params: ['domain', 'cert', 'key'],
		expect: { }
	}),

	deleteCertificate: rpc.declare({
		object: 'luci.haproxy',
		method: 'delete_certificate',
		params: ['id'],
		expect: { }
	}),

	// ACLs
	listAcls: rpc.declare({
		object: 'luci.haproxy',
		method: 'list_acls',
		expect: { acls: [] }
	}),

	createAcl: rpc.declare({
		object: 'luci.haproxy',
		method: 'create_acl',
		params: ['name', 'type', 'pattern', 'backend', 'enabled'],
		expect: { }
	}),

	updateAcl: rpc.declare({
		object: 'luci.haproxy',
		method: 'update_acl',
		params: ['id', 'name', 'type', 'pattern', 'backend', 'enabled'],
		expect: { }
	}),

	deleteAcl: rpc.declare({
		object: 'luci.haproxy',
		method: 'delete_acl',
		params: ['id'],
		expect: { }
	}),

	// Redirects
	listRedirects: rpc.declare({
		object: 'luci.haproxy',
		method: 'list_redirects',
		expect: { redirects: [] }
	}),

	createRedirect: rpc.declare({
		object: 'luci.haproxy',
		method: 'create_redirect',
		params: ['name', 'match_host', 'target_host', 'strip_www', 'code', 'enabled'],
		expect: { }
	}),

	deleteRedirect: rpc.declare({
		object: 'luci.haproxy',
		method: 'delete_redirect',
		params: ['id'],
		expect: { }
	}),

	// Settings
	getSettings: rpc.declare({
		object: 'luci.haproxy',
		method: 'get_settings',
		expect: { }
	}),

	saveSettings: rpc.declare({
		object: 'luci.haproxy',
		method: 'save_settings',
		params: ['main', 'defaults', 'acme'],
		expect: { }
	}),

	// Service control
	install: rpc.declare({
		object: 'luci.haproxy',
		method: 'install',
		expect: { }
	}),

	start: rpc.declare({
		object: 'luci.haproxy',
		method: 'start',
		expect: { }
	}),

	stop: rpc.declare({
		object: 'luci.haproxy',
		method: 'stop',
		expect: { }
	}),

	restart: rpc.declare({
		object: 'luci.haproxy',
		method: 'restart',
		expect: { }
	}),

	reload: rpc.declare({
		object: 'luci.haproxy',
		method: 'reload',
		expect: { }
	}),

	generate: rpc.declare({
		object: 'luci.haproxy',
		method: 'generate',
		expect: { }
	}),

	validate: rpc.declare({
		object: 'luci.haproxy',
		method: 'validate',
		expect: { }
	}),

	getLogs: rpc.declare({
		object: 'luci.haproxy',
		method: 'get_logs',
		params: ['lines'],
		expect: { logs: '' }
	}),

	// Fetch all data for dashboard
	getDashboardData: function() {
		return Promise.all([
			this.status(),
			this.listVhosts(),
			this.listBackends(),
			this.listCertificates()
		]).then(function(results) {
			return {
				status: results[0],
				vhosts: results[1],
				backends: results[2],
				certificates: results[3]
			};
		});
	}
};

return api;
