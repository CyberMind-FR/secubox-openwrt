'use strict';
'require baseclass';
'require rpc';

/**
 * Client Guardian API
 * Package: luci-app-client-guardian
 * RPCD object: luci.client-guardian
 */

// Version: 0.4.0

var callStatus = rpc.declare({
	object: 'luci.client-guardian',
	method: 'status',
	expect: { }
});

var callClients = rpc.declare({
	object: 'luci.client-guardian',
	method: 'clients',
	expect: { clients: [] }
});

var callGetClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'get_client',
	params: ['mac'],
	expect: { }
});

var callZones = rpc.declare({
	object: 'luci.client-guardian',
	method: 'zones',
	expect: { zones: [] }
});

var callParental = rpc.declare({
	object: 'luci.client-guardian',
	method: 'parental',
	expect: { }
});

var callPortal = rpc.declare({
	object: 'luci.client-guardian',
	method: 'portal',
	expect: { }
});

var callAlerts = rpc.declare({
	object: 'luci.client-guardian',
	method: 'alerts',
	expect: { }
});

var callLogs = rpc.declare({
	object: 'luci.client-guardian',
	method: 'logs',
	params: ['limit', 'level'],
	expect: { logs: [] }
});

var callApproveClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'approve_client',
	params: ['mac', 'name', 'zone', 'notes'],
	expect: { success: false }
});

var callBanClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'ban_client',
	params: ['mac', 'reason'],
	expect: { success: false }
});

var callQuarantineClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'quarantine_client',
	params: ['mac'],
	expect: { success: false }
});

var callUpdateClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'update_client',
	params: ['section', 'name', 'zone', 'notes', 'daily_quota', 'static_ip'],
	expect: { success: false }
});

var callUpdateZone = rpc.declare({
	object: 'luci.client-guardian',
	method: 'update_zone',
	params: ['id', 'name', 'bandwidth_limit', 'content_filter'],
	expect: { success: false }
});

var callUpdatePortal = rpc.declare({
	object: 'luci.client-guardian',
	method: 'update_portal',
	params: ['title', 'subtitle', 'accent_color'],
	expect: { success: false }
});

var callSendTestAlert = rpc.declare({
	object: 'luci.client-guardian',
	method: 'send_test_alert',
	params: ['type'],
	expect: { success: false }
});

// Nodogsplash Captive Portal Methods
var callListSessions = rpc.declare({
	object: 'luci.client-guardian',
	method: 'list_sessions',
	expect: { sessions: [] }
});

var callGetPolicy = rpc.declare({
	object: 'luci.client-guardian',
	method: 'get_policy',
	expect: { }
});

var callSetPolicy = rpc.declare({
	object: 'luci.client-guardian',
	method: 'set_policy',
	params: ['policy', 'portal_enabled', 'auto_approve', 'session_timeout'],
	expect: { success: false }
});

var callAuthorizeClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'authorize_client',
	params: ['mac', 'ip'],
	expect: { success: false }
});

var callDeauthorizeClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'deauthorize_client',
	params: ['mac', 'ip'],
	expect: { success: false }
});

function formatMac(mac) {
	if (!mac) return '';
	return mac.toUpperCase().replace(/(.{2})(?=.)/g, '$1:');
}

function formatDuration(seconds) {
	if (!seconds) return 'Unlimited';
	var h = Math.floor(seconds / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	if (h > 24) return Math.floor(h / 24) + 'd';
	if (h > 0) return h + 'h ' + m + 'm';
	return m + 'm';
}

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(1024));
	i = Math.min(i, units.length - 1);
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

return baseclass.extend({
	// Core methods
	getStatus: callStatus,
	getClients: callClients,
	getClient: callGetClient,
	getZones: callZones,
	getParental: callParental,
	getPortal: callPortal,
	getAlerts: callAlerts,
	getLogs: callLogs,

	// Client management
	approveClient: callApproveClient,
	banClient: callBanClient,
	quarantineClient: callQuarantineClient,
	updateClient: callUpdateClient,

	// Configuration
	updateZone: callUpdateZone,
	updatePortal: callUpdatePortal,
	sendTestAlert: callSendTestAlert,

	// Nodogsplash Captive Portal
	listSessions: callListSessions,
	getPolicy: callGetPolicy,
	setPolicy: callSetPolicy,
	authorizeClient: callAuthorizeClient,
	deauthorizeClient: callDeauthorizeClient,

	// Utility functions
	formatMac: formatMac,
	formatDuration: formatDuration,
	formatBytes: formatBytes
});
