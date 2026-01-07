'use strict';
'require baseclass';
'require rpc';
'require uci';

/**
 * SecuBox Netifyd API Client
 * Provides interface to netifyd RPCD backend
 */

return baseclass.extend({
	/**
	 * Get service status
	 */
	getServiceStatus: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_service_status'
		})(), {});
	},

	/**
	 * Get detailed netifyd status from CLI
	 */
	getNetifydStatus: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_netifyd_status'
		})(), {});
	},

	/**
	 * Get real-time flows from socket
	 */
	getRealtimeFlows: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_realtime_flows'
		})(), { flows: [] });
	},

	/**
	 * Get flow statistics
	 */
	getFlowStatistics: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_flow_statistics'
		})(), {});
	},

	/**
	 * Get top applications
	 */
	getTopApplications: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_top_applications'
		})(), { applications: [] });
	},

	/**
	 * Get top protocols
	 */
	getTopProtocols: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_top_protocols'
		})(), { protocols: [] });
	},

	/**
	 * Get detected devices
	 */
	getDetectedDevices: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_detected_devices'
		})(), { devices: [] });
	},

	/**
	 * Get dashboard data
	 */
	getDashboard: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_dashboard'
		})(), {});
	},

	/**
	 * Start netifyd service
	 */
	startService: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'service_start'
		})(), {});
	},

	/**
	 * Stop netifyd service
	 */
	stopService: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'service_stop'
		})(), {});
	},

	/**
	 * Restart netifyd service
	 */
	restartService: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'service_restart'
		})(), {});
	},

	/**
	 * Enable netifyd service for auto-start
	 */
	enableService: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'service_enable'
		})(), {});
	},

	/**
	 * Disable netifyd service auto-start
	 */
	disableService: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'service_disable'
		})(), {});
	},

	/**
	 * Get configuration
	 */
	getConfig: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_config'
		})(), {});
	},

	/**
	 * Update configuration
	 */
	updateConfig: function(config) {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'update_config',
			params: ['settings', 'monitoring', 'analytics', 'alerts']
		})(config.settings, config.monitoring, config.analytics, config.alerts), {});
	},

	/**
	 * Get network interfaces being monitored
	 */
	getInterfaces: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'get_interfaces'
		})(), { interfaces: [] });
	},

	/**
	 * Clear flow cache
	 */
	clearCache: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'clear_cache'
		})(), {});
	},

	/**
	 * Export flows
	 */
	exportFlows: function(format) {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'export_flows',
			params: ['format']
		})(format || 'json'), {});
	},

	/**
	 * Apply plugin configuration and restart Netifyd
	 */
	applyPluginConfig: function() {
		return L.resolveDefault(rpc.declare({
			object: 'luci.secubox-netifyd',
			method: 'apply_plugin_configuration'
		})(), {});
	},

	/**
	 * Format bytes to human-readable format
	 */
	formatBytes: function(bytes, decimals) {
		if (bytes === 0 || !bytes) return '0 Bytes';
		var k = 1024;
		var dm = decimals !== undefined ? (decimals < 0 ? 0 : decimals) : 2;
		var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	},

	/**
	 * Format duration to human-readable format
	 */
	formatDuration: function(seconds) {
		if (!seconds || seconds < 0) return '0s';

		var days = Math.floor(seconds / 86400);
		var hours = Math.floor((seconds % 86400) / 3600);
		var minutes = Math.floor((seconds % 3600) / 60);
		var secs = seconds % 60;

		var parts = [];
		if (days > 0) parts.push(days + 'd');
		if (hours > 0) parts.push(hours + 'h');
		if (minutes > 0) parts.push(minutes + 'm');
		if (secs > 0 || parts.length === 0) parts.push(secs + 's');

		return parts.join(' ');
	},

	/**
	 * Get status badge HTML
	 */
	getStatusBadge: function(status) {
		var badges = {
			'active': '<span class="badge badge-success">Active</span>',
			'stopped': '<span class="badge badge-danger">Stopped</span>',
			'not_installed': '<span class="badge badge-warning">Not Installed</span>'
		};
		return badges[status] || '<span class="badge badge-secondary">Unknown</span>';
	}
});
