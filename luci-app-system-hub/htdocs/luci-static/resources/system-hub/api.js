'use strict';
'require baseclass';
'require rpc';

/**
 * System Hub API
 * Package: luci-app-system-hub
 * RPCD object: luci.system-hub
 * Version: 0.0.2
 */

var callStatus = rpc.declare({
	object: 'luci.system-hub',
	method: 'status',
	expect: {}
});

var callGetSystemInfo = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_system_info',
	expect: {}
});

var callGetHealth = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_health',
	expect: {}
});

var callListServices = rpc.declare({
	object: 'luci.system-hub',
	method: 'list_services',
	expect: { services: [] }
});

var callServiceAction = rpc.declare({
	object: 'luci.system-hub',
	method: 'service_action',
	params: ['service', 'action'],
	expect: {}
});

var callGetLogs = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_logs',
	params: ['lines', 'filter'],
	expect: { logs: [] }
});

var callBackupConfig = rpc.declare({
	object: 'luci.system-hub',
	method: 'backup_config',
	expect: {}
});

var callRestoreConfig = rpc.declare({
	object: 'luci.system-hub',
	method: 'restore_config',
	params: ['data'],
	expect: {}
});

var callReboot = rpc.declare({
	object: 'luci.system-hub',
	method: 'reboot',
	expect: {}
});

var callGetStorage = rpc.declare({
	object: 'luci.system-hub',
	method: 'get_storage',
	expect: { storage: [] }
});

// Helper: Format uptime seconds to human-readable string
function formatUptime(seconds) {
	if (!seconds) return '0s';
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	if (d > 0) return d + 'd ' + h + 'h';
	if (h > 0) return h + 'h ' + m + 'm';
	return m + 'm';
}

// Helper: Format bytes to human-readable size
function formatBytes(bytes) {
	if (!bytes) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// Helper: Get component icon (stub for planned feature)
function getComponentIcon(icon) {
	return icon || '📦';
}

// Helper: Get health status info based on score
function getHealthStatus(score) {
	if (score >= 90) return { status: 'excellent', label: 'Excellent', color: '#22c55e' };
	if (score >= 75) return { status: 'good', label: 'Bon', color: '#3b82f6' };
	if (score >= 50) return { status: 'warning', label: 'Attention', color: '#f59e0b' };
	return { status: 'critical', label: 'Critique', color: '#ef4444' };
}

// Stub: Get components (planned feature - returns mock data)
function stubGetComponents() {
	return Promise.resolve({
		components: [
			{
				id: 'netdata',
				name: 'Netdata',
				description: 'Real-time performance monitoring',
				status: 'installed',
				running: true,
				icon: '📊',
				color: '#00C851',
				web_port: 19999
			},
			{
				id: 'crowdsec',
				name: 'CrowdSec',
				description: 'Collaborative security engine',
				status: 'installed',
				running: true,
				icon: '🛡️',
				color: '#0091EA',
				web_port: null
			},
			{
				id: 'netifyd',
				name: 'Netifyd',
				description: 'Deep packet inspection',
				status: 'planned',
				roadmap_date: 'Q1 2026'
			}
		]
	});
}

// Stub: Manage component (planned feature)
function stubManageComponent(id, action) {
	return Promise.resolve({
		success: true,
		message: 'Component ' + id + ' ' + action + ' - Feature coming soon'
	});
}

// Stub: Get remote access config (planned feature)
function stubGetRemote() {
	return Promise.resolve({
		rustdesk_enabled: false,
		rustdesk_installed: false,
		rustdesk_id: null,
		allow_unattended: false,
		require_approval: true,
		notify_on_connect: true,
		support: {
			provider: 'CyberMind.fr',
			email: 'support@cybermind.fr',
			phone: '+33 1 23 45 67 89',
			website: 'https://cybermind.fr'
		}
	});
}

// Stub: Start remote session (planned feature)
function stubStartRemoteSession(type) {
	return Promise.resolve({
		success: false,
		error: 'Remote session feature not yet implemented'
	});
}

// Stub: Get scheduled tasks (planned feature)
function stubGetSchedules() {
	return Promise.resolve({
		schedules: []
	});
}

// Stub: Generate health report (planned feature)
function stubGenerateReport() {
	return Promise.resolve({
		success: false,
		error: 'Report generation not yet implemented'
	});
}

return baseclass.extend({
	// Main RPC methods (camelCase)
	getStatus: callStatus,
	getSystemInfo: callGetSystemInfo,
	getHealth: callGetHealth,
	listServices: callListServices,
	serviceAction: callServiceAction,
	getLogs: callGetLogs,
	backupConfig: callBackupConfig,
	restoreConfig: callRestoreConfig,
	reboot: callReboot,
	getStorage: callGetStorage,

	// RPC methods (call* prefix for view compatibility)
	callStatus: callStatus,
	callGetHealth: callGetHealth,
	callGetComponents: stubGetComponents,
	callManageComponent: stubManageComponent,
	callGetRemote: stubGetRemote,
	callStartRemoteSession: stubStartRemoteSession,
	callGetSchedules: stubGetSchedules,
	callGenerateReport: stubGenerateReport,

	// Helper functions
	formatUptime: formatUptime,
	formatBytes: formatBytes,
	getComponentIcon: getComponentIcon,
	getHealthStatus: getHealthStatus
});
