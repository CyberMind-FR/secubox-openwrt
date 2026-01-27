'use strict';
'require baseclass';
'require rpc';

// ============================================
// Status
// ============================================

var callStatus = rpc.declare({
	object: 'luci.haproxy',
	method: 'status',
	expect: {}
});

var callGetStats = rpc.declare({
	object: 'luci.haproxy',
	method: 'get_stats',
	expect: {}
});

// ============================================
// Vhosts
// ============================================

var callListVhosts = rpc.declare({
	object: 'luci.haproxy',
	method: 'list_vhosts',
	expect: { vhosts: [] }
});

var callGetVhost = rpc.declare({
	object: 'luci.haproxy',
	method: 'get_vhost',
	params: ['id'],
	expect: {}
});

var callCreateVhost = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_vhost',
	params: ['domain', 'backend', 'ssl', 'ssl_redirect', 'acme', 'enabled'],
	expect: {}
});

var callUpdateVhost = rpc.declare({
	object: 'luci.haproxy',
	method: 'update_vhost',
	params: ['id', 'domain', 'backend', 'ssl', 'ssl_redirect', 'acme', 'enabled'],
	expect: {}
});

var callDeleteVhost = rpc.declare({
	object: 'luci.haproxy',
	method: 'delete_vhost',
	params: ['id'],
	expect: {}
});

// ============================================
// Backends
// ============================================

var callListBackends = rpc.declare({
	object: 'luci.haproxy',
	method: 'list_backends',
	expect: { backends: [] }
});

var callGetBackend = rpc.declare({
	object: 'luci.haproxy',
	method: 'get_backend',
	params: ['id'],
	expect: {}
});

var callCreateBackend = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_backend',
	params: ['name', 'mode', 'balance', 'health_check', 'health_check_uri', 'enabled'],
	expect: {}
});

var callUpdateBackend = rpc.declare({
	object: 'luci.haproxy',
	method: 'update_backend',
	params: ['id', 'name', 'mode', 'balance', 'health_check', 'health_check_uri', 'enabled'],
	expect: {}
});

var callDeleteBackend = rpc.declare({
	object: 'luci.haproxy',
	method: 'delete_backend',
	params: ['id'],
	expect: {}
});

// ============================================
// Servers
// ============================================

var callListServers = rpc.declare({
	object: 'luci.haproxy',
	method: 'list_servers',
	params: ['backend'],
	expect: { servers: [] }
});

var callCreateServer = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_server',
	params: ['backend', 'name', 'address', 'port', 'weight', 'check', 'enabled'],
	expect: {}
});

var callUpdateServer = rpc.declare({
	object: 'luci.haproxy',
	method: 'update_server',
	params: ['id', 'backend', 'name', 'address', 'port', 'weight', 'check', 'enabled', 'inline'],
	expect: {}
});

var callDeleteServer = rpc.declare({
	object: 'luci.haproxy',
	method: 'delete_server',
	params: ['id', 'inline'],
	expect: {}
});

// ============================================
// Certificates
// ============================================

var callListCertificates = rpc.declare({
	object: 'luci.haproxy',
	method: 'list_certificates',
	expect: { certificates: [] }
});

var callRequestCertificate = rpc.declare({
	object: 'luci.haproxy',
	method: 'request_certificate',
	params: ['domain'],
	expect: {}
});

var callImportCertificate = rpc.declare({
	object: 'luci.haproxy',
	method: 'import_certificate',
	params: ['domain', 'cert', 'key'],
	expect: {}
});

var callDeleteCertificate = rpc.declare({
	object: 'luci.haproxy',
	method: 'delete_certificate',
	params: ['id'],
	expect: {}
});

// ============================================
// ACLs
// ============================================

var callListAcls = rpc.declare({
	object: 'luci.haproxy',
	method: 'list_acls',
	expect: { acls: [] }
});

var callCreateAcl = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_acl',
	params: ['name', 'type', 'pattern', 'backend', 'enabled'],
	expect: {}
});

var callUpdateAcl = rpc.declare({
	object: 'luci.haproxy',
	method: 'update_acl',
	params: ['id', 'name', 'type', 'pattern', 'backend', 'enabled'],
	expect: {}
});

var callDeleteAcl = rpc.declare({
	object: 'luci.haproxy',
	method: 'delete_acl',
	params: ['id'],
	expect: {}
});

// ============================================
// Redirects
// ============================================

var callListRedirects = rpc.declare({
	object: 'luci.haproxy',
	method: 'list_redirects',
	expect: { redirects: [] }
});

var callCreateRedirect = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_redirect',
	params: ['name', 'match_host', 'target_host', 'strip_www', 'code', 'enabled'],
	expect: {}
});

var callDeleteRedirect = rpc.declare({
	object: 'luci.haproxy',
	method: 'delete_redirect',
	params: ['id'],
	expect: {}
});

// ============================================
// Settings
// ============================================

var callGetSettings = rpc.declare({
	object: 'luci.haproxy',
	method: 'get_settings',
	expect: {}
});

var callSaveSettings = rpc.declare({
	object: 'luci.haproxy',
	method: 'save_settings',
	params: ['main', 'defaults', 'acme'],
	expect: {}
});

// ============================================
// Service Control
// ============================================

var callInstall = rpc.declare({
	object: 'luci.haproxy',
	method: 'install',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.haproxy',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.haproxy',
	method: 'stop',
	expect: {}
});

var callRestart = rpc.declare({
	object: 'luci.haproxy',
	method: 'restart',
	expect: {}
});

var callReload = rpc.declare({
	object: 'luci.haproxy',
	method: 'reload',
	expect: {}
});

var callGenerate = rpc.declare({
	object: 'luci.haproxy',
	method: 'generate',
	expect: {}
});

var callValidate = rpc.declare({
	object: 'luci.haproxy',
	method: 'validate',
	expect: {}
});

var callGetLogs = rpc.declare({
	object: 'luci.haproxy',
	method: 'get_logs',
	params: ['lines'],
	expect: { logs: '' }
});

var callListExposedServices = rpc.declare({
	object: 'luci.haproxy',
	method: 'list_exposed_services',
	expect: { services: [] }
});

// ============================================
// Helper Functions
// ============================================

function getDashboardData() {
	return Promise.all([
		callStatus(),
		callListVhosts(),
		callListBackends(),
		callListCertificates()
	]).then(function(results) {
		// Handle both array and object responses from RPC
		var vhosts = Array.isArray(results[1]) ? results[1] : (results[1] && results[1].vhosts) || [];
		var backends = Array.isArray(results[2]) ? results[2] : (results[2] && results[2].backends) || [];
		var certificates = Array.isArray(results[3]) ? results[3] : (results[3] && results[3].certificates) || [];

		return {
			status: results[0],
			vhosts: vhosts,
			backends: backends,
			certificates: certificates
		};
	});
}

// ============================================
// Module Export
// ============================================

return baseclass.extend({
	// Status
	status: callStatus,
	getStats: callGetStats,

	// Vhosts
	listVhosts: callListVhosts,
	getVhost: callGetVhost,
	createVhost: callCreateVhost,
	updateVhost: callUpdateVhost,
	deleteVhost: callDeleteVhost,

	// Backends
	listBackends: callListBackends,
	getBackend: callGetBackend,
	createBackend: callCreateBackend,
	updateBackend: callUpdateBackend,
	deleteBackend: callDeleteBackend,

	// Servers
	listServers: callListServers,
	createServer: callCreateServer,
	updateServer: callUpdateServer,
	deleteServer: callDeleteServer,

	// Certificates
	listCertificates: callListCertificates,
	requestCertificate: callRequestCertificate,
	importCertificate: callImportCertificate,
	deleteCertificate: callDeleteCertificate,

	// ACLs
	listAcls: callListAcls,
	createAcl: callCreateAcl,
	updateAcl: callUpdateAcl,
	deleteAcl: callDeleteAcl,

	// Redirects
	listRedirects: callListRedirects,
	createRedirect: callCreateRedirect,
	deleteRedirect: callDeleteRedirect,

	// Settings
	getSettings: callGetSettings,
	saveSettings: callSaveSettings,

	// Service control
	install: callInstall,
	start: callStart,
	stop: callStop,
	restart: callRestart,
	reload: callReload,
	generate: callGenerate,
	validate: callValidate,
	getLogs: callGetLogs,

	// Exposed services
	listExposedServices: callListExposedServices,

	// Helpers
	getDashboardData: getDashboardData
});
