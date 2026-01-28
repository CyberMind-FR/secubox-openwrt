'use strict';
'require baseclass';
'require rpc';

// RPC method declarations
var callListServices = rpc.declare({
	object: 'luci.service-registry',
	method: 'list_services'
});

var callGetService = rpc.declare({
	object: 'luci.service-registry',
	method: 'get_service',
	params: ['service_id'],
	expect: {}
});

var callPublishService = rpc.declare({
	object: 'luci.service-registry',
	method: 'publish_service',
	params: ['name', 'local_port', 'domain', 'tor_enabled', 'category', 'icon'],
	expect: {}
});

var callUnpublishService = rpc.declare({
	object: 'luci.service-registry',
	method: 'unpublish_service',
	params: ['service_id'],
	expect: {}
});

var callUpdateService = rpc.declare({
	object: 'luci.service-registry',
	method: 'update_service',
	params: ['service_id', 'name', 'category', 'icon'],
	expect: {}
});

var callDeleteService = rpc.declare({
	object: 'luci.service-registry',
	method: 'delete_service',
	params: ['service_id'],
	expect: {}
});

var callSyncProviders = rpc.declare({
	object: 'luci.service-registry',
	method: 'sync_providers',
	expect: {}
});

var callGenerateLandingPage = rpc.declare({
	object: 'luci.service-registry',
	method: 'generate_landing_page',
	expect: {}
});

var callGetQrData = rpc.declare({
	object: 'luci.service-registry',
	method: 'get_qr_data',
	params: ['service_id', 'url_type'],
	expect: {}
});

var callListCategories = rpc.declare({
	object: 'luci.service-registry',
	method: 'list_categories'
});

var callGetCertificateStatus = rpc.declare({
	object: 'luci.service-registry',
	method: 'get_certificate_status',
	params: ['service_id'],
	expect: {}
});

var callGetLandingConfig = rpc.declare({
	object: 'luci.service-registry',
	method: 'get_landing_config',
	expect: {}
});

var callSaveLandingConfig = rpc.declare({
	object: 'luci.service-registry',
	method: 'save_landing_config',
	params: ['auto_regen'],
	expect: {}
});

var callCheckServiceHealth = rpc.declare({
	object: 'luci.service-registry',
	method: 'check_service_health',
	params: ['service_id', 'domain'],
	expect: {}
});

var callCheckAllHealth = rpc.declare({
	object: 'luci.service-registry',
	method: 'check_all_health',
	expect: {}
});

var callGetNetworkInfo = rpc.declare({
	object: 'luci.service-registry',
	method: 'get_network_info',
	expect: {}
});

// HAProxy status for provider info
var callHAProxyStatus = rpc.declare({
	object: 'luci.haproxy',
	method: 'status',
	expect: {}
});

// Tor Shield status for provider info
var callTorStatus = rpc.declare({
	object: 'luci.tor-shield',
	method: 'status',
	expect: {}
});

return baseclass.extend({
	// List all services from all providers
	listServices: function() {
		return callListServices();
	},

	// Get single service details
	getService: function(serviceId) {
		return callGetService(serviceId);
	},

	// Publish a new service
	publishService: function(name, localPort, domain, torEnabled, category, icon) {
		return callPublishService(
			name,
			parseInt(localPort) || 0,
			domain || '',
			torEnabled ? true : false,
			category || 'services',
			icon || ''
		);
	},

	// Unpublish a service
	unpublishService: function(serviceId) {
		return callUnpublishService(serviceId);
	},

	// Update service metadata
	updateService: function(serviceId, name, category, icon) {
		return callUpdateService(serviceId, name || '', category || '', icon || '');
	},

	// Delete a service
	deleteService: function(serviceId) {
		return callDeleteService(serviceId);
	},

	// Sync all providers
	syncProviders: function() {
		return callSyncProviders();
	},

	// Generate landing page
	generateLandingPage: function() {
		return callGenerateLandingPage();
	},

	// Get QR code data for a service URL
	getQrData: function(serviceId, urlType) {
		return callGetQrData(serviceId, urlType || 'local');
	},

	// List available categories
	listCategories: function() {
		return callListCategories();
	},

	// Get certificate status for a service
	getCertificateStatus: function(serviceId) {
		return callGetCertificateStatus(serviceId);
	},

	// Get landing page configuration
	getLandingConfig: function() {
		return callGetLandingConfig();
	},

	// Save landing page configuration
	saveLandingConfig: function(autoRegen) {
		return callSaveLandingConfig(autoRegen ? true : false);
	},

	// Get dashboard data (services + provider status)
	getDashboardData: function() {
		return Promise.all([
			callListServices().catch(function(e) { console.error('list_services failed:', e); return { services: [], providers: {} }; }),
			callListCategories().catch(function(e) { console.error('list_categories failed:', e); return { categories: [] }; }),
			callGetLandingConfig().catch(function(e) { console.error('get_landing_config failed:', e); return {}; }),
			callHAProxyStatus().catch(function() { return { enabled: false }; }),
			callTorStatus().catch(function() { return { enabled: false }; })
		]).then(function(results) {
			return {
				services: results[0].services || [],
				providers: results[0].providers || {},
				categories: results[1].categories || [],
				landing: results[2],
				haproxy: results[3],
				tor: results[4]
			};
		});
	},

	// Get published services only
	getPublishedServices: function() {
		return callListServices().then(function(data) {
			return (data.services || []).filter(function(s) {
				return s.published;
			});
		});
	},

	// Get unpublished (discoverable) services
	getUnpublishedServices: function() {
		return callListServices().then(function(data) {
			return (data.services || []).filter(function(s) {
				return !s.published;
			});
		});
	},

	// Quick publish with defaults
	quickPublish: function(name, port) {
		return this.publishService(name, port, '', false, 'services', '');
	},

	// Full publish with HAProxy + Tor
	fullPublish: function(name, port, domain) {
		return this.publishService(name, port, domain, true, 'services', '');
	},

	// Check health of a single service
	checkServiceHealth: function(serviceId, domain) {
		return callCheckServiceHealth(serviceId || '', domain || '');
	},

	// Check health of all published services
	checkAllHealth: function() {
		return callCheckAllHealth();
	},

	// Get network connectivity info (public IPs, port accessibility)
	getNetworkInfo: function() {
		return callGetNetworkInfo();
	},

	// Get dashboard data with health status
	getDashboardDataWithHealth: function() {
		return Promise.all([
			callListServices().catch(function(e) { console.error('list_services failed:', e); return { services: [], providers: {} }; }),
			callListCategories().catch(function(e) { console.error('list_categories failed:', e); return { categories: [] }; }),
			callGetLandingConfig().catch(function(e) { console.error('get_landing_config failed:', e); return {}; }),
			callHAProxyStatus().catch(function() { return { enabled: false }; }),
			callTorStatus().catch(function() { return { enabled: false }; }),
			callCheckAllHealth().catch(function(e) { console.error('check_all_health failed:', e); return { health: {} }; })
		]).then(function(results) {
			return {
				services: results[0].services || [],
				providers: results[0].providers || {},
				categories: results[1].categories || [],
				landing: results[2],
				haproxy: results[3],
				tor: results[4],
				health: results[5].health || {}
			};
		});
	}
});
