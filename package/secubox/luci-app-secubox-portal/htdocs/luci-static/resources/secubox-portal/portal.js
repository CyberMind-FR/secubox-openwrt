'use strict';
'require baseclass';
'require fs';

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
		'mitmproxy': {
			id: 'mitmproxy',
			name: 'mitmproxy',
			desc: 'Interactive HTTPS proxy for traffic inspection, debugging, and security testing',
			icon: '\ud83d\udd0d',
			iconBg: 'rgba(231, 76, 60, 0.15)',
			iconColor: '#e74c3c',
			section: 'security',
			path: 'admin/secubox/security/mitmproxy/dashboard',
			service: 'mitmproxy',
			version: '8.1.1'
		},
		'threat-monitor': {
			id: 'threat-monitor',
			name: 'Threat Monitor',
			desc: 'Real-time threat detection combining netifyd DPI with CrowdSec intelligence',
			icon: '\ud83d\udc41\ufe0f',
			iconBg: 'rgba(239, 68, 68, 0.15)',
			iconColor: '#ef4444',
			section: 'security',
			path: 'admin/secubox/security/threats/dashboard',
			service: null,
			version: '1.0.0'
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
			path: 'admin/secubox/settings',
			service: null,
			version: null
		},

		// Services Apps
		'vhost-manager': {
			id: 'vhost-manager',
			name: 'VHost Manager',
			desc: 'Manage virtual hosts, SSL certificates, and reverse proxy configurations',
			icon: '\ud83c\udf10',
			iconBg: 'rgba(102, 126, 234, 0.15)',
			iconColor: '#667eea',
			section: 'services',
			path: 'admin/secubox/services/vhosts/overview',
			service: 'nginx',
			version: '0.5.0'
		},
		'magicmirror2': {
			id: 'magicmirror2',
			name: 'MagicMirror²',
			desc: 'Smart display platform with modular widgets for weather, calendar, news and more',
			icon: '\ud83e\ude9e',
			iconBg: 'rgba(155, 89, 182, 0.15)',
			iconColor: '#9b59b6',
			section: 'services',
			path: 'admin/secubox/services/magicmirror2/dashboard',
			service: 'magicmirror2',
			version: '2.29.0'
		},
		'mmpm': {
			id: 'mmpm',
			name: 'MMPM',
			desc: 'MagicMirror Package Manager - Install, update and manage modules easily',
			icon: '\ud83d\udce6',
			iconBg: 'rgba(243, 156, 18, 0.15)',
			iconColor: '#f39c12',
			section: 'services',
			path: 'admin/secubox/services/mmpm/dashboard',
			service: 'mmpm',
			version: '3.1.0'
		},
		'glances': {
			id: 'glances',
			name: 'Glances',
			desc: 'Cross-platform system monitoring tool with web interface',
			icon: '\ud83d\udcca',
			iconBg: 'rgba(16, 185, 129, 0.15)',
			iconColor: '#10b981',
			section: 'monitoring',
			path: 'admin/secubox/monitoring/glances/dashboard',
			service: 'glances',
			version: '4.2.1'
		},
		'localai': {
			id: 'localai',
			name: 'LocalAI',
			desc: 'Self-hosted, privacy-first AI/LLM with OpenAI-compatible API',
			icon: '\ud83e\udd16',
			iconBg: 'rgba(168, 85, 247, 0.15)',
			iconColor: '#a855f7',
			section: 'services',
			path: 'admin/secubox/services/localai/dashboard',
			service: 'localai',
			version: '3.10.0'
		},
		'haproxy': {
			id: 'haproxy',
			name: 'HAProxy',
			desc: 'High-performance load balancer and reverse proxy with SSL termination',
			icon: '\u2696\ufe0f',
			iconBg: 'rgba(34, 197, 94, 0.15)',
			iconColor: '#22c55e',
			section: 'services',
			path: 'admin/services/haproxy/overview',
			service: 'haproxy',
			version: '1.0.0'
		},
		'hexojs': {
			id: 'hexojs',
			name: 'Hexo CMS',
			desc: 'Fast, simple and powerful blog framework with CyberMind theme',
			icon: '\u270d\ufe0f',
			iconBg: 'rgba(59, 130, 246, 0.15)',
			iconColor: '#3b82f6',
			section: 'services',
			path: 'admin/services/hexojs/overview',
			service: 'hexojs',
			version: '1.0.0'
		},
		'picobrew': {
			id: 'picobrew',
			name: 'PicoBrew Server',
			desc: 'Self-hosted server for PicoBrew Zymatic and Pico brewing systems',
			icon: '\ud83c\udf7a',
			iconBg: 'rgba(245, 158, 11, 0.15)',
			iconColor: '#f59e0b',
			section: 'services',
			path: 'admin/services/picobrew/overview',
			service: 'picobrew',
			version: '1.0.0'
		},
		'tor-shield': {
			id: 'tor-shield',
			name: 'Tor Shield',
			desc: 'Privacy-focused Tor proxy with relay, bridge, and hidden service support',
			icon: '\ud83e\udde5',
			iconBg: 'rgba(124, 58, 237, 0.15)',
			iconColor: '#7c3aed',
			section: 'services',
			path: 'admin/services/tor-shield/overview',
			service: 'tor',
			version: '1.0.0'
		},
		'jellyfin': {
			id: 'jellyfin',
			name: 'Jellyfin',
			desc: 'Free software media system for streaming movies, TV shows, and music',
			icon: '\ud83c\udf9e\ufe0f',
			iconBg: 'rgba(139, 92, 246, 0.15)',
			iconColor: '#8b5cf6',
			section: 'services',
			path: 'admin/services/jellyfin/overview',
			service: 'jellyfin',
			version: '10.9.0'
		},
		'homeassistant': {
			id: 'homeassistant',
			name: 'Home Assistant',
			desc: 'Open-source home automation platform with local control',
			icon: '\ud83c\udfe0',
			iconBg: 'rgba(6, 182, 212, 0.15)',
			iconColor: '#06b6d4',
			section: 'services',
			path: 'admin/services/homeassistant/overview',
			service: 'homeassistant',
			version: '2024.1'
		},
		'adguardhome': {
			id: 'adguardhome',
			name: 'AdGuard Home',
			desc: 'Network-wide ads and trackers blocking DNS server',
			icon: '\ud83d\udee1\ufe0f',
			iconBg: 'rgba(34, 197, 94, 0.15)',
			iconColor: '#22c55e',
			section: 'security',
			path: 'admin/services/adguardhome/overview',
			service: 'adguardhome',
			version: '0.107'
		},
		'nextcloud': {
			id: 'nextcloud',
			name: 'Nextcloud',
			desc: 'Self-hosted productivity platform with file sync, calendar, and contacts',
			icon: '\u2601\ufe0f',
			iconBg: 'rgba(59, 130, 246, 0.15)',
			iconColor: '#3b82f6',
			section: 'services',
			path: 'admin/services/nextcloud/overview',
			service: 'nextcloud',
			version: '28.0'
		}
	},

	// Section definitions
	sections: {
		'portal': {
			id: 'portal',
			name: 'Portal',
			icon: '\ud83c\udfe0',
			path: 'admin/secubox/portal',
			order: 1
		},
		'hub': {
			id: 'hub',
			name: 'Hub',
			icon: '\ud83d\ude80',
			path: 'admin/secubox/dashboard',
			order: 2
		},
		'admin': {
			id: 'admin',
			name: 'Admin',
			icon: '\ud83c\udfdb\ufe0f',
			path: 'admin/secubox/admin/dashboard',
			order: 3
		},
		'security': {
			id: 'security',
			name: 'Security',
			icon: '\ud83d\udee1\ufe0f',
			path: 'admin/secubox/security',
			order: 4
		},
		'network': {
			id: 'network',
			name: 'Network',
			icon: '\ud83c\udf10',
			path: 'admin/secubox/network',
			order: 5
		},
		'monitoring': {
			id: 'monitoring',
			name: 'Monitoring',
			icon: '\ud83d\udcca',
			path: 'admin/secubox/monitoring',
			order: 6
		},
		'system': {
			id: 'system',
			name: 'System',
			icon: '\u2699\ufe0f',
			path: 'admin/secubox/system',
			order: 7
		},
		'services': {
			id: 'services',
			name: 'Services',
			icon: '\ud83d\udce6',
			path: 'admin/secubox/services',
			order: 8
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
	 * Get installed apps by section (filters out apps without init scripts)
	 */
	getInstalledAppsBySection: function(sectionId, installedApps) {
		var self = this;
		var apps = [];
		Object.keys(this.apps).forEach(function(key) {
			var app = self.apps[key];
			if (app.section === sectionId) {
				// Include if no service (always show) or if service is installed
				if (!app.service || installedApps[key]) {
					apps.push(app);
				}
			}
		});
		return apps;
	},

	/**
	 * Check which apps are installed (have init scripts or LuCI views)
	 */
	checkInstalledApps: function() {
		var self = this;
		var promises = [];
		var appKeys = Object.keys(this.apps);

		appKeys.forEach(function(key) {
			var app = self.apps[key];
			if (app.service) {
				// Check if init script exists
				promises.push(
					fs.stat('/etc/init.d/' + app.service)
						.then(function() { return { id: key, installed: true }; })
						.catch(function() { return { id: key, installed: false }; })
				);
			} else {
				// No service - check if LuCI view exists by path pattern
				// Apps without services are UI-only and should be shown if their menu exists
				promises.push(Promise.resolve({ id: key, installed: true }));
			}
		});

		return Promise.all(promises).then(function(results) {
			var installed = {};
			results.forEach(function(r) {
				installed[r.id] = r.installed;
			});
			return installed;
		});
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
	 * Check if service init script exists
	 */
	isServiceInstalled: function(serviceName) {
		if (!serviceName) {
			return Promise.resolve(false);
		}
		return fs.stat('/etc/init.d/' + serviceName)
			.then(function() { return true; })
			.catch(function() { return false; });
	},

	/**
	 * Check if service is running (only for installed services)
	 */
	checkServiceStatus: function(serviceName) {
		var self = this;
		if (!serviceName) {
			return Promise.resolve(null);
		}
		// First check if service is installed
		return this.isServiceInstalled(serviceName).then(function(installed) {
			if (!installed) {
				return null; // Not installed
			}
			// Try init script status command
			return fs.exec('/etc/init.d/' + serviceName, ['status'])
				.then(function(res) {
					return (res && res.code === 0) ? 'running' : 'stopped';
				})
				.catch(function() {
					// Fallback to pgrep
					return fs.exec('pgrep', [serviceName])
						.then(function(res) {
							return (res && res.code === 0) ? 'running' : 'stopped';
						})
						.catch(function() {
							return 'stopped';
						});
				});
		});
	},

	/**
	 * Get all app statuses (only for installed services)
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
						// status is null if not installed
						return { id: key, status: status, installed: status !== null };
					})
				);
			} else {
				promises.push(Promise.resolve({ id: key, status: null, installed: false }));
			}
		});

		return Promise.all(promises).then(function(results) {
			var statuses = {};
			results.forEach(function(r) {
				// Only include installed services
				if (r.installed) {
					statuses[r.id] = r.status;
				}
			});
			return statuses;
		});
	}
});
