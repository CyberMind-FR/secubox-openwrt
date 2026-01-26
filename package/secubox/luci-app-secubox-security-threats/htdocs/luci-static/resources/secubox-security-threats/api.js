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
 * Composite data fetcher for dashboard
 * @returns {Promise} Promise resolving to dashboard data
 */
function getDashboardData() {
	return Promise.all([
		callStatus(),
		callGetActiveThreats(),
		callGetStatsByType(),
		callGetBlockedIPs(),
		callGetSecurityStats()
	]).then(function(results) {
		return {
			status: results[0] || {},
			threats: results[1].threats || [],
			stats: results[2] || {},
			blocked: results[3].blocked || [],
			securityStats: results[4] || {}
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

	// Composite Fetchers
	getDashboardData: getDashboardData
});
