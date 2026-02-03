'use strict';
'require baseclass';
'require rpc';

// ==============================================================================
// RPC Method Declarations
// ==============================================================================

var callStatus = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'status',
	expect: { }
});

var callGetActiveThreats = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_active_threats',
	expect: { threats: [] }
});

var callGetThreatHistory = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_threat_history',
	params: ['hours'],
	expect: { threats: [] }
});

var callGetStatsByType = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_stats_by_type',
	expect: { }
});

var callGetStatsByHost = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_stats_by_host',
	expect: { hosts: [] }
});

var callGetBlockedIPs = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_blocked_ips',
	expect: { blocked: [] }
});

var callBlockThreat = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'block_threat',
	params: ['ip', 'duration', 'reason'],
	expect: { }
});

var callWhitelistHost = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'whitelist_host',
	params: ['ip', 'reason'],
	expect: { }
});

var callRemoveWhitelist = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'remove_whitelist',
	params: ['ip'],
	expect: { }
});

var callGetSecurityStats = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_security_stats',
	expect: { }
});

// ==============================================================================
// nDPId Integration for Device Detection
// ==============================================================================

var callNdpidStatus = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_service_status',
	expect: { }
});

var callNdpidFlows = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_detailed_flows',
	expect: { flows: [] }
});

var callNdpidTopApps = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_top_applications',
	expect: { applications: [] }
});

var callNdpidCategories = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_categories',
	expect: { categories: [] }
});

// ==============================================================================
// Utility Functions
// ==============================================================================

/**
 * Get color for severity level
 * @param {string} severity - Severity level (critical, high, medium, low)
 * @returns {string} Hex color code
 */
function getSeverityColor(severity) {
	var colors = {
		'critical': '#d32f2f',  // Red
		'high': '#ff5722',      // Deep Orange
		'medium': '#ff9800',    // Orange
		'low': '#ffc107'        // Amber
	};
	return colors[severity] || '#666';
}

/**
 * Get icon for threat category
 * @param {string} category - Threat category
 * @returns {string} Unicode emoji icon
 */
function getThreatIcon(category) {
	var icons = {
		'malware': '🦠',
		'web_attack': '⚔️',
		'anomaly': '⚠️',
		'protocol': '🚫',
		'tls_issue': '🔒',
		'other': '❓'
	};
	return icons[category] || '❓';
}

/**
 * Format risk flags for display
 * @param {Array} risks - Array of risk flag names
 * @returns {string} Formatted risk flags
 */
function formatRiskFlags(risks) {
	if (!risks || !Array.isArray(risks)) return 'N/A';

	return risks.map(function(risk) {
		// Convert MALICIOUS_JA3 to "Malicious JA3"
		return risk.toString().split('_').map(function(word) {
			return word.charAt(0) + word.slice(1).toLowerCase();
		}).join(' ');
	}).join(', ');
}

/**
 * Get human-readable category label
 * @param {string} category - Category code
 * @returns {string} Display label
 */
function getCategoryLabel(category) {
	var labels = {
		'malware': 'Malware',
		'web_attack': 'Web Attack',
		'anomaly': 'Network Anomaly',
		'protocol': 'Protocol Threat',
		'tls_issue': 'TLS/Certificate',
		'other': 'Other'
	};
	return labels[category] || 'Unknown';
}

/**
 * Format duration string (4h, 24h, etc.)
 * @param {string} duration - Duration string
 * @returns {string} Formatted duration
 */
function formatDuration(duration) {
	if (!duration) return 'N/A';
	return duration;
}

/**
 * Format timestamp to localized string
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
	if (!timestamp) return 'N/A';
	try {
		var date = new Date(timestamp);
		return date.toLocaleString();
	} catch(e) {
		return timestamp;
	}
}

/**
 * Format relative time (e.g., "5 minutes ago")
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
	if (!timestamp) return 'N/A';
	try {
		var date = new Date(timestamp);
		var now = new Date();
		var seconds = Math.floor((now - date) / 1000);

		if (seconds < 60) return seconds + 's ago';
		if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
		if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
		return Math.floor(seconds / 86400) + 'd ago';
	} catch(e) {
		return timestamp;
	}
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Byte count
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * Get badge HTML for severity
 * @param {string} severity - Severity level
 * @returns {string} HTML string
 */
function getSeverityBadge(severity) {
	var color = getSeverityColor(severity);
	var label = severity.charAt(0).toUpperCase() + severity.slice(1);
	return '<span style="display: inline-block; padding: 2px 8px; border-radius: 3px; background: ' + color + '; color: white; font-size: 0.85em; font-weight: bold;">' + label + '</span>';
}

/**
 * Device type classification based on applications/protocols
 */
var deviceTypes = {
	'streaming': { icon: '📺', zone: 'media', apps: ['Netflix', 'YouTube', 'Twitch', 'Spotify', 'AppleTV', 'Disney'] },
	'gaming': { icon: '🎮', zone: 'gaming', apps: ['Steam', 'PlayStation', 'Xbox', 'Nintendo', 'Discord'] },
	'iot': { icon: '🏠', zone: 'iot', apps: ['MQTT', 'CoAP', 'Zigbee', 'HomeKit', 'Alexa', 'GoogleHome'] },
	'work': { icon: '💼', zone: 'trusted', apps: ['Teams', 'Zoom', 'Slack', 'Office365', 'Webex'] },
	'mobile': { icon: '📱', zone: 'mobile', apps: ['WhatsApp', 'Telegram', 'Instagram', 'TikTok', 'Facebook'] },
	'security': { icon: '🔒', zone: 'secure', apps: ['VPN', 'WireGuard', 'OpenVPN', 'SSH', 'HTTPS'] },
	'unknown': { icon: '❓', zone: 'guest', apps: [] }
};

/**
 * Zone definitions with firewall suggestions
 */
var networkZones = {
	'trusted': { icon: '🏠', color: '#2ecc71', access: 'full', desc: 'Full network access' },
	'media': { icon: '📺', color: '#9b59b6', access: 'streaming', desc: 'Streaming services only' },
	'gaming': { icon: '🎮', color: '#3498db', access: 'gaming', desc: 'Gaming ports & services' },
	'iot': { icon: '🤖', color: '#e67e22', access: 'limited', desc: 'Local network only, no WAN' },
	'mobile': { icon: '📱', color: '#1abc9c', access: 'filtered', desc: 'Web access with filtering' },
	'guest': { icon: '👤', color: '#95a5a6', access: 'isolated', desc: 'Internet only, no LAN' },
	'secure': { icon: '🔐', color: '#e74c3c', access: 'vpn', desc: 'VPN/encrypted traffic only' },
	'quarantine': { icon: '⛔', color: '#c0392b', access: 'blocked', desc: 'No network access' }
};

/**
 * Classify device based on detected applications
 * @param {Array} apps - List of detected applications
 * @returns {Object} Device classification
 */
function classifyDevice(apps) {
	if (!apps || !Array.isArray(apps)) return { type: 'unknown', ...deviceTypes.unknown };

	for (var type in deviceTypes) {
		var typeApps = deviceTypes[type].apps;
		for (var i = 0; i < apps.length; i++) {
			for (var j = 0; j < typeApps.length; j++) {
				if (apps[i].toLowerCase().indexOf(typeApps[j].toLowerCase()) !== -1) {
					return { type: type, ...deviceTypes[type] };
				}
			}
		}
	}
	return { type: 'unknown', ...deviceTypes.unknown };
}

/**
 * Get suggested firewall rules for a device
 * @param {Object} device - Device info with classification
 * @returns {Array} Suggested firewall rules
 */
function getSuggestedRules(device) {
	var zone = device.zone || 'guest';
	var rules = [];

	switch (zone) {
		case 'trusted':
			rules.push({ action: 'ACCEPT', desc: 'Allow all traffic' });
			break;
		case 'media':
			rules.push({ action: 'ACCEPT', ports: '443,80,8080', proto: 'tcp', desc: 'HTTPS/HTTP streaming' });
			rules.push({ action: 'ACCEPT', ports: '1935', proto: 'tcp', desc: 'RTMP streaming' });
			rules.push({ action: 'DROP', desc: 'Block other traffic' });
			break;
		case 'gaming':
			rules.push({ action: 'ACCEPT', ports: '443,80', proto: 'tcp', desc: 'Web services' });
			rules.push({ action: 'ACCEPT', ports: '3478-3480,27000-27050', proto: 'udp', desc: 'Gaming ports' });
			rules.push({ action: 'DROP', desc: 'Block other traffic' });
			break;
		case 'iot':
			rules.push({ action: 'ACCEPT', dest: 'lan', desc: 'Local network only' });
			rules.push({ action: 'DROP', dest: 'wan', desc: 'Block internet access' });
			break;
		case 'guest':
			rules.push({ action: 'ACCEPT', dest: 'wan', ports: '443,80,53', desc: 'Web + DNS only' });
			rules.push({ action: 'DROP', dest: 'lan', desc: 'Block local network' });
			break;
		case 'quarantine':
			rules.push({ action: 'DROP', desc: 'Block all traffic' });
			break;
		default:
			rules.push({ action: 'ACCEPT', ports: '443,80,53', desc: 'Basic web access' });
	}
	return rules;
}

/**
 * Get device icon based on MAC vendor or app detection
 * @param {Object} device - Device information
 * @returns {string} Emoji icon
 */
function getDeviceIcon(device) {
	if (device.classification) return device.classification.icon;
	if (device.vendor) {
		var vendor = device.vendor.toLowerCase();
		if (vendor.indexOf('apple') !== -1) return '🍎';
		if (vendor.indexOf('samsung') !== -1) return '📱';
		if (vendor.indexOf('amazon') !== -1) return '📦';
		if (vendor.indexOf('google') !== -1) return '🔍';
		if (vendor.indexOf('microsoft') !== -1) return '🪟';
		if (vendor.indexOf('sony') !== -1 || vendor.indexOf('playstation') !== -1) return '🎮';
		if (vendor.indexOf('intel') !== -1 || vendor.indexOf('dell') !== -1 || vendor.indexOf('hp') !== -1) return '💻';
	}
	return '📟';
}

/**
 * Composite data fetcher for dashboard (with ndpid)
 * @returns {Promise} Promise resolving to dashboard data
 */
function getDashboardData() {
	return Promise.all([
		callStatus(),
		callGetActiveThreats(),
		callGetStatsByType(),
		callGetBlockedIPs(),
		callGetSecurityStats(),
		callNdpidStatus().catch(function() { return { running: false, dpi_available: false }; }),
		callNdpidFlows().catch(function() { return { flows: [] }; }),
		callNdpidTopApps().catch(function() { return { applications: [] }; })
	]).then(function(results) {
		var ndpidFlows = results[6].flows || [];
		var ndpidApps = results[7].applications || [];
		var ndpidStatus = results[5] || {};

		// Build device list from ndpid flows
		var devicesMap = {};
		var isLocalIP = function(ip) {
			return ip && (ip.indexOf('192.168.') === 0 || ip.indexOf('10.') === 0 || ip.indexOf('172.16.') === 0);
		};
		ndpidFlows.forEach(function(flow) {
			// Check both src_ip and dst_ip for local devices
			var localIP = null;
			if (isLocalIP(flow.src_ip)) {
				localIP = flow.src_ip;
			} else if (isLocalIP(flow.dst_ip)) {
				localIP = flow.dst_ip;
			}
			if (!localIP) return; // Skip if no local device involved

			if (!devicesMap[localIP]) {
				devicesMap[localIP] = {
					ip: localIP,
					mac: flow.src_mac || flow.local_mac || '',
					hostname: flow.hostname || '',
					apps: [],
					protocols: [],
					bytes_rx: 0,
					bytes_tx: 0,
					flows: 0,
					last_seen: flow.timestamp
				};
			}
			var dev = devicesMap[localIP];
			// Use 'app' field from ndpid flows (not 'application')
			var appName = flow.app || flow.application || '';
			if (appName && dev.apps.indexOf(appName) === -1) {
				dev.apps.push(appName);
			}
			// Use 'proto' field from ndpid flows (not 'protocol')
			var protoName = flow.proto || flow.protocol || '';
			if (protoName && dev.protocols.indexOf(protoName) === -1) {
				dev.protocols.push(protoName);
			}
			dev.bytes_rx += flow.bytes_rx || 0;
			dev.bytes_tx += flow.bytes_tx || 0;
			dev.flows++;
		});

		// Classify devices and suggest zones
		var devices = Object.values(devicesMap).map(function(dev) {
			dev.classification = classifyDevice(dev.apps);
			dev.suggestedZone = dev.classification.zone;
			dev.suggestedRules = getSuggestedRules(dev.classification);
			dev.icon = getDeviceIcon(dev);
			return dev;
		});

		// DPI is available if either ndpid or netifyd is running
		var dpiRunning = ndpidStatus.running || ndpidStatus.netifyd_running || ndpidStatus.dpi_available || false;
		var dpiUptime = ndpidStatus.uptime || ndpidStatus.netifyd_uptime || 0;

		return {
			status: results[0] || {},
			threats: results[1].threats || [],
			stats: results[2] || {},
			blocked: results[3].blocked || [],
			securityStats: results[4] || {},
			ndpid: {
				running: dpiRunning,
				uptime: dpiUptime,
				ndpid_running: ndpidStatus.running || false,
				netifyd_running: ndpidStatus.netifyd_running || false,
				flow_count: ndpidStatus.flow_count || 0
			},
			devices: devices,
			topApps: ndpidApps,
			zones: networkZones
		};
	});
}

// ==============================================================================
// Exports
// ==============================================================================

return baseclass.extend({
	// RPC Methods
	getStatus: callStatus,
	getActiveThreats: callGetActiveThreats,
	getThreatHistory: callGetThreatHistory,
	getStatsByType: callGetStatsByType,
	getStatsByHost: callGetStatsByHost,
	getBlockedIPs: callGetBlockedIPs,
	getSecurityStats: callGetSecurityStats,
	blockThreat: callBlockThreat,
	whitelistHost: callWhitelistHost,
	removeWhitelist: callRemoveWhitelist,

	// nDPId Methods
	getNdpidStatus: callNdpidStatus,
	getNdpidFlows: callNdpidFlows,
	getNdpidTopApps: callNdpidTopApps,
	getNdpidCategories: callNdpidCategories,

	// Utility Functions
	getSeverityColor: getSeverityColor,
	getThreatIcon: getThreatIcon,
	formatRiskFlags: formatRiskFlags,
	getCategoryLabel: getCategoryLabel,
	formatDuration: formatDuration,
	formatTimestamp: formatTimestamp,
	formatRelativeTime: formatRelativeTime,
	formatBytes: formatBytes,
	getSeverityBadge: getSeverityBadge,

	// Device Classification
	classifyDevice: classifyDevice,
	getSuggestedRules: getSuggestedRules,
	getDeviceIcon: getDeviceIcon,
	deviceTypes: deviceTypes,
	networkZones: networkZones,

	// Composite Fetchers
	getDashboardData: getDashboardData
});
