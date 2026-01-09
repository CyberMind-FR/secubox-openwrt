'use strict';
'require baseclass';

/**
 * SecuBox Portal Module
 * Provides unified navigation and app management
 */

return baseclass.extend({
	version: '1.0.0',

	// SecuBox app registry - paths match admin/secubox/* menu structure
	apps: {
		// Security Apps
		'crowdsec': {
			id: 'crowdsec',
			name: 'CrowdSec Dashboard',
			desc: 'Community-driven security with real-time threat detection and crowd-sourced intelligence',
			icon: '\ud83d\udee1\ufe0f',
			iconBg: 'rgba(0, 212, 170, 0.15)',
			iconColor: '#00d4aa',
			section: 'security',
			path: 'admin/secubox/security/crowdsec/overview',
			service: 'crowdsec',
			version: '0.7.0'
		},
		'client-guardian': {
			id: 'client-guardian',
			name: 'Client Guardian',
			desc: 'Monitor and manage network clients with access control and parental features',
			icon: '\ud83d\udc65',
			iconBg: 'rgba(139, 92, 246, 0.15)',
			iconColor: '#8b5cf6',
			section: 'security',
			path: 'admin/secubox/security/guardian/overview',
			service: 'client-guardian',
			version: '0.5.0'
		},
		'auth-guardian': {
			id: 'auth-guardian',
			name: 'Auth Guardian',
			desc: 'Two-factor authentication and access control for network services',
			icon: '\ud83d\udd10',
			iconBg: 'rgba(239, 68, 68, 0.15)',
			iconColor: '#ef4444',
			section: 'security',
			path: 'admin/secubox/security/auth-guardian/overview',
			service: 'auth-guardian',
			version: '0.3.0'
		},

		// Network Apps
		'bandwidth-manager': {
			id: 'bandwidth-manager',
			name: 'Bandwidth Manager',
			desc: 'Control bandwidth allocation with QoS, quotas, and traffic shaping',
			icon: '\ud83d\udcc8',
			iconBg: 'rgba(59, 130, 246, 0.15)',
			iconColor: '#3b82f6',
			section: 'network',
			path: 'admin/secubox/network/bandwidth-manager',
			service: 'bandwidth-manager',
			version: '0.5.0'
		},
		'traffic-shaper': {
			id: 'traffic-shaper',
			name: 'Traffic Shaper',
			desc: 'Advanced traffic shaping with SQM and cake-based queue management',
			icon: '\ud83c\udf0a',
			iconBg: 'rgba(20, 184, 166, 0.15)',
			iconColor: '#14b8a6',
			section: 'network',
			path: 'admin/network/sqm',
			service: null,
			version: null
		},
		'wireguard': {
			id: 'wireguard',
			name: 'WireGuard VPN',
			desc: 'Modern, fast, and secure VPN tunnel management',
			icon: '\ud83d\udd12',
			iconBg: 'rgba(239, 68, 68, 0.15)',
			iconColor: '#ef4444',
			section: 'network',
			path: 'admin/secubox/network/wireguard',
			service: 'wgserver',
			version: null
		},
		'network-modes': {
			id: 'network-modes',
			name: 'Network Modes',
			desc: 'Configure router, AP, or bridge mode with one-click setup',
			icon: '\ud83c\udf10',
			iconBg: 'rgba(102, 126, 234, 0.15)',
			iconColor: '#667eea',
			section: 'network',
			path: 'admin/secubox/network/modes',
			service: null,
			version: '0.2.0'
		},

		// Monitoring Apps
		'media-flow': {
			id: 'media-flow',
			name: 'Media Flow',
			desc: 'Monitor streaming services and media traffic in real-time',
			icon: '\ud83c\udfac',
			iconBg: 'rgba(236, 72, 153, 0.15)',
			iconColor: '#ec4899',
			section: 'monitoring',
			path: 'admin/secubox/monitoring/mediaflow/dashboard',
			service: null,
			version: '0.6.0'
		},
		'ndpid': {
			id: 'ndpid',
			name: 'nDPId Flows',
			desc: 'Deep packet inspection with application detection and flow analysis',
			icon: '\ud83d\udd0d',
			iconBg: 'rgba(6, 182, 212, 0.15)',
			iconColor: '#06b6d4',
			section: 'monitoring',
			path: 'admin/secubox/ndpid/dashboard',
			service: 'ndpid',
			version: '1.1.0'
		},
		'netifyd': {
			id: 'netifyd',
			name: 'Netifyd',
			desc: 'Network intelligence agent for traffic classification',
			icon: '\ud83d\udce1',
			iconBg: 'rgba(6, 182, 212, 0.15)',
			iconColor: '#06b6d4',
			section: 'monitoring',
			path: 'admin/secubox/netifyd/dashboard',
			service: 'netifyd',
			version: '1.2.0'
		},
		'netdata': {
			id: 'netdata',
			name: 'Netdata Dashboard',
			desc: 'Real-time system and network performance monitoring',
			icon: '\ud83d\udcca',
			iconBg: 'rgba(34, 197, 94, 0.15)',
			iconColor: '#22c55e',
			section: 'monitoring',
			path: 'admin/secubox/monitoring/netdata/dashboard',
			service: 'netdata',
			version: '0.4.0'
		},

		// System Apps
		'system-hub': {
			id: 'system-hub',
			name: 'System Hub',
			desc: 'Centralized system administration and configuration',
			icon: '\u2699\ufe0f',
			iconBg: 'rgba(249, 115, 22, 0.15)',
			iconColor: '#f97316',
			section: 'system',
			path: 'admin/secubox/system/system-hub/overview',
			service: null,
			version: '0.4.0'
		},
		'cdn-cache': {
			id: 'cdn-cache',
			name: 'CDN Cache',
			desc: 'Local content caching for faster repeated downloads',
			icon: '\ud83d\udce6',
			iconBg: 'rgba(20, 184, 166, 0.15)',
			iconColor: '#14b8a6',
			section: 'system',
			path: 'admin/secubox/system/cdn-cache',
			service: 'squid',
			version: '0.3.0'
		},
		'secubox-settings': {
			id: 'secubox-settings',
			name: 'SecuBox Settings',
			desc: 'Global SecuBox configuration and preferences',
			icon: '\ud83d\udd27',
			iconBg: 'rgba(161, 161, 170, 0.15)',
			iconColor: '#a1a1aa',
			section: 'system',
			path: 'admin/secubox/system/settings',
			service: null,
			version: null
		}
	},

	// Section definitions
	sections: {
		'dashboard': {
			id: 'dashboard',
			name: 'Dashboard',
			icon: '\ud83c\udfe0',
			order: 1
		},
		'security': {
			id: 'security',
			name: 'Security',
			icon: '\ud83d\udee1\ufe0f',
			order: 2
		},
		'network': {
			id: 'network',
			name: 'Network',
			icon: '\ud83c\udf10',
			order: 3
		},
		'monitoring': {
			id: 'monitoring',
			name: 'Monitoring',
			icon: '\ud83d\udcca',
			order: 4
		},
		'system': {
			id: 'system',
			name: 'System',
			icon: '\u2699\ufe0f',
			order: 5
		}
	},

	/**
	 * Get apps by section
	 */
	getAppsBySection: function(sectionId) {
		var self = this;
		var apps = [];
		Object.keys(this.apps).forEach(function(key) {
			if (self.apps[key].section === sectionId) {
				apps.push(self.apps[key]);
			}
		});
		return apps;
	},

	/**
	 * Get all sections
	 */
	getSections: function() {
		var self = this;
		return Object.keys(this.sections)
			.map(function(key) { return self.sections[key]; })
			.sort(function(a, b) { return a.order - b.order; });
	},

	/**
	 * Build LuCI URL
	 */
	buildUrl: function(path) {
		return L.url(path);
	},

	/**
	 * Check if service is running
	 */
	checkServiceStatus: function(serviceName) {
		if (!serviceName) {
			return Promise.resolve(null);
		}
		return L.resolveDefault(
			fs.exec('/etc/init.d/' + serviceName, ['status']),
			{ code: 1 }
		).then(function(res) {
			return res.code === 0 ? 'running' : 'stopped';
		});
	},

	/**
	 * Get all app statuses
	 */
	getAllAppStatuses: function() {
		var self = this;
		var promises = [];
		var appKeys = Object.keys(this.apps);

		appKeys.forEach(function(key) {
			var app = self.apps[key];
			if (app.service) {
				promises.push(
					self.checkServiceStatus(app.service).then(function(status) {
						return { id: key, status: status };
					})
				);
			} else {
				promises.push(Promise.resolve({ id: key, status: null }));
			}
		});

		return Promise.all(promises).then(function(results) {
			var statuses = {};
			results.forEach(function(r) {
				statuses[r.id] = r.status;
			});
			return statuses;
		});
	}
});
