'use strict';
'require view';
'require dom';
'require poll';
'require uci';
'require rpc';
'require fs';
'require ui';
'require secubox-portal/portal as portal';

var callSystemBoard = rpc.declare({
	object: 'system',
	method: 'board'
});

var callSystemInfo = rpc.declare({
	object: 'system',
	method: 'info'
});

var callCrowdSecStats = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'nftables_stats'
});

return view.extend({
	currentSection: 'dashboard',
	appStatuses: {},

	load: function() {
		return Promise.all([
			callSystemBoard(),
			callSystemInfo(),
			this.loadAppStatuses(),
			callCrowdSecStats().catch(function() { return null; })
		]);
	},

	loadAppStatuses: function() {
		var self = this;
		var apps = portal.apps;
		var promises = [];

		Object.keys(apps).forEach(function(key) {
			var app = apps[key];
			if (app.service) {
				// First check if init script exists, then check status
				promises.push(
					fs.stat('/etc/init.d/' + app.service)
						.then(function(stat) {
							// Init script exists, check if enabled and running
							return fs.exec('/etc/init.d/' + app.service, ['status'])
								.then(function(res) {
									return { id: key, status: (res && res.code === 0) ? 'running' : 'stopped', installed: true };
								})
								.catch(function() {
									// status command failed, try pgrep as fallback
									return fs.exec('pgrep', [app.service])
										.then(function(res) {
											return { id: key, status: (res && res.code === 0) ? 'running' : 'stopped', installed: true };
										})
										.catch(function() {
											return { id: key, status: 'stopped', installed: true };
										});
								});
						})
						.catch(function() {
							// Init script doesn't exist - service not installed
							return { id: key, status: null, installed: false };
						})
				);
			}
		});

		return Promise.all(promises).then(function(results) {
			results.forEach(function(r) {
				// Only track installed services
				if (r.installed) {
					self.appStatuses[r.id] = r.status;
				}
			});
			return self.appStatuses;
		});
	},

	render: function(data) {
		var boardInfo = data[0] || {};
		var sysInfo = data[1] || {};
		var crowdSecStats = data[3] || {};
		var self = this;

		// Set portal app context and hide LuCI navigation
		document.body.setAttribute('data-secubox-app', 'portal');
		document.body.classList.add('secubox-portal-mode');

		// Hide LuCI sidebar immediately via JS for reliability
		var elementsToHide = [
			'#mainmenu', '.main-left', 'header.main-header',
			'nav[role="navigation"]', '#navigation', '.luci-sidebar', 'aside'
		];
		elementsToHide.forEach(function(selector) {
			var el = document.querySelector(selector);
			if (el) el.style.display = 'none';
		});

		// Make main content full width
		var mainRight = document.querySelector('.main-right') || document.querySelector('#maincontent');
		if (mainRight) {
			mainRight.style.marginLeft = '0';
			mainRight.style.width = '100%';
			mainRight.style.maxWidth = '100%';
		}

		// Inject CSS
		var cssLink = document.querySelector('link[href*="secubox-portal/portal.css"]');
		if (!cssLink) {
			var link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = L.resource('secubox-portal/portal.css');
			document.head.appendChild(link);
		}

		var container = E('div', { 'class': 'secubox-portal' }, [
			// Header
			this.renderHeader(),
			// Content
			E('div', { 'class': 'sb-portal-content' }, [
				this.renderDashboardSection(boardInfo, sysInfo, crowdSecStats),
				this.renderSecuritySection(),
				this.renderNetworkSection(),
				this.renderMonitoringSection(),
				this.renderSystemSection(),
				this.renderServicesSection()
			])
		]);

		// Set initial active section
		this.switchSection('dashboard');

		return container;
	},

	renderHeader: function() {
		var self = this;
		var sections = portal.getSections();
		// Sections that link to other pages vs tabs within portal
		var linkSections = ['portal', 'hub', 'admin'];
		var tabSections = ['security', 'network', 'monitoring', 'system', 'services'];

		return E('div', { 'class': 'sb-portal-header' }, [
			// Brand
			E('div', { 'class': 'sb-portal-brand' }, [
				E('div', { 'class': 'sb-portal-logo' }, 'S'),
				E('span', { 'class': 'sb-portal-title' }, 'SecuBox'),
				E('span', { 'class': 'sb-portal-version' }, 'v0.14.0')
			]),
			// Navigation
			E('nav', { 'class': 'sb-portal-nav' },
				sections.map(function(section) {
					// Portal, Hub, Admin are links to other pages
					if (linkSections.indexOf(section.id) !== -1) {
						return E('a', {
							'class': 'sb-portal-nav-item' + (section.id === 'portal' ? ' active' : ''),
							'href': L.url(section.path)
						}, [
							E('span', { 'class': 'sb-portal-nav-icon' }, section.icon),
							section.name
						]);
					}
					// Security, Network, Monitoring, System are tabs within portal
					return E('button', {
						'class': 'sb-portal-nav-item',
						'data-section': section.id,
						'click': function() { self.switchSection(section.id); }
					}, [
						E('span', { 'class': 'sb-portal-nav-icon' }, section.icon),
						section.name
					]);
				})
			),
			// Actions - UI Switcher
			E('div', { 'class': 'sb-portal-actions' }, [
				E('div', { 'class': 'sb-ui-switcher' }, [
					E('span', { 'class': 'sb-ui-label' }, 'Interface:'),
					E('a', {
						'class': 'sb-ui-btn active',
						'href': L.url('admin/secubox/portal'),
						'title': 'SecuBox Portal'
					}, 'SecuBox'),
					E('a', {
						'class': 'sb-ui-btn',
						'href': L.url('admin/status/overview'),
						'title': 'Standard LuCI interface'
					}, 'LuCI')
				])
			])
		]);
	},

	switchSection: function(sectionId) {
		this.currentSection = sectionId;

		// Update nav active state
		document.querySelectorAll('.sb-portal-nav-item').forEach(function(btn) {
			btn.classList.toggle('active', btn.dataset.section === sectionId);
		});

		// Update section visibility
		document.querySelectorAll('.sb-portal-section').forEach(function(section) {
			section.classList.toggle('active', section.dataset.section === sectionId);
		});
	},

	renderDashboardSection: function(boardInfo, sysInfo, crowdSecStats) {
		var self = this;
		var securityApps = portal.getAppsBySection('security');
		var networkApps = portal.getAppsBySection('network');
		var monitoringApps = portal.getAppsBySection('monitoring');

		// Count running services
		var runningCount = Object.values(this.appStatuses).filter(function(s) { return s === 'running'; }).length;
		var totalServices = Object.keys(this.appStatuses).length;

		// CrowdSec blocked IPs count
		var blockedIPv4 = (crowdSecStats.ipv4_total_count || 0);
		var blockedIPv6 = (crowdSecStats.ipv6_total_count || 0);
		var totalBlocked = blockedIPv4 + blockedIPv6;
		var crowdSecHealth = crowdSecStats.firewall_health || {};
		var crowdSecActive = crowdSecHealth.bouncer_running && crowdSecHealth.decisions_synced;

		return E('div', { 'class': 'sb-portal-section active', 'data-section': 'dashboard' }, [
			E('div', { 'class': 'sb-section-header' }, [
				E('h2', { 'class': 'sb-section-title' }, 'SecuBox Dashboard'),
				E('p', { 'class': 'sb-section-subtitle' },
					'Welcome to SecuBox - Your unified network security and management platform')
			]),

			// Quick Stats
			E('div', { 'class': 'sb-dashboard-grid' }, [
				// System Status
				E('div', { 'class': 'sb-quick-stat' }, [
					E('div', { 'class': 'sb-quick-stat-header' }, [
						E('div', { 'class': 'sb-quick-stat-icon system' }, '\ud83d\udda5\ufe0f'),
						E('span', { 'class': 'sb-quick-stat-status running' }, 'Online')
					]),
					E('div', { 'class': 'sb-quick-stat-value' }, boardInfo.hostname || 'SecuBox'),
					E('div', { 'class': 'sb-quick-stat-label' }, boardInfo.model || 'Router')
				]),

				// Services Status
				E('div', { 'class': 'sb-quick-stat' }, [
					E('div', { 'class': 'sb-quick-stat-header' }, [
						E('div', { 'class': 'sb-quick-stat-icon monitoring' }, '\u2699\ufe0f'),
						E('span', { 'class': 'sb-quick-stat-status ' + (runningCount > 0 ? 'running' : 'warning') },
							runningCount > 0 ? 'Active' : 'Idle')
					]),
					E('div', { 'class': 'sb-quick-stat-value' }, runningCount + '/' + totalServices),
					E('div', { 'class': 'sb-quick-stat-label' }, 'Services Running')
				]),

				// CrowdSec Blocked IPs
				E('div', { 'class': 'sb-quick-stat' }, [
					E('div', { 'class': 'sb-quick-stat-header' }, [
						E('div', { 'class': 'sb-quick-stat-icon security' }, '\ud83d\udeab'),
						E('span', { 'class': 'sb-quick-stat-status ' + (crowdSecActive ? 'running' : 'warning') },
							crowdSecActive ? 'Active' : 'Inactive')
					]),
					E('div', { 'class': 'sb-quick-stat-value' }, totalBlocked.toLocaleString()),
					E('div', { 'class': 'sb-quick-stat-label' }, 'IPs Blocked')
				]),

				// Network Apps
				E('div', { 'class': 'sb-quick-stat' }, [
					E('div', { 'class': 'sb-quick-stat-header' }, [
						E('div', { 'class': 'sb-quick-stat-icon network' }, '\ud83c\udf10'),
						E('span', { 'class': 'sb-quick-stat-status running' }, 'Configured')
					]),
					E('div', { 'class': 'sb-quick-stat-value' }, networkApps.length),
					E('div', { 'class': 'sb-quick-stat-label' }, 'Network Tools')
				])
			]),

			// Featured Apps
			E('h3', { 'style': 'margin: 1.5rem 0 1rem; color: var(--cyber-text-primary);' }, 'Quick Access'),
			E('div', { 'class': 'sb-app-grid' },
				this.renderFeaturedApps(['crowdsec', 'bandwidth-manager', 'media-flow', 'ndpid'])
			),

			// Recent Events placeholder
			E('div', { 'class': 'sb-events-list', 'style': 'margin-top: 1.5rem;' }, [
				E('div', { 'class': 'sb-events-header' }, [
					E('h4', { 'class': 'sb-events-title' }, 'System Overview')
				]),
				E('div', { 'class': 'sb-events-item' }, [
					E('div', { 'class': 'sb-events-icon info' }, '\u2139\ufe0f'),
					E('div', { 'class': 'sb-events-content' }, [
						E('p', { 'class': 'sb-events-message' },
							'System: ' + (boardInfo.system || 'Unknown') + ' | Kernel: ' + (boardInfo.kernel || 'Unknown')),
						E('span', { 'class': 'sb-events-meta' }, 'System Information')
					])
				]),
				E('div', { 'class': 'sb-events-item' }, [
					E('div', { 'class': 'sb-events-icon success' }, '\u2705'),
					E('div', { 'class': 'sb-events-content' }, [
						E('p', { 'class': 'sb-events-message' },
							'Uptime: ' + this.formatUptime(sysInfo.uptime || 0)),
						E('span', { 'class': 'sb-events-meta' }, 'System Status')
					])
				]),
				E('div', { 'class': 'sb-events-item' }, [
					E('div', { 'class': 'sb-events-icon info' }, '\ud83d\udcbe'),
					E('div', { 'class': 'sb-events-content' }, [
						E('p', { 'class': 'sb-events-message' },
							'Memory: ' + this.formatBytes(sysInfo.memory ? sysInfo.memory.total - sysInfo.memory.free : 0) +
							' / ' + this.formatBytes(sysInfo.memory ? sysInfo.memory.total : 0) + ' used'),
						E('span', { 'class': 'sb-events-meta' }, 'Resource Usage')
					])
				]),
				totalBlocked > 0 ? E('div', { 'class': 'sb-events-item' }, [
					E('div', { 'class': 'sb-events-icon security' }, '\ud83d\udee1\ufe0f'),
					E('div', { 'class': 'sb-events-content' }, [
						E('p', { 'class': 'sb-events-message' },
							'IPv4: ' + blockedIPv4.toLocaleString() + ' (' +
							(crowdSecStats.ipv4_capi_count || 0) + ' CAPI + ' +
							(crowdSecStats.ipv4_cscli_count || 0) + ' local) | IPv6: ' + blockedIPv6.toLocaleString()),
						E('span', { 'class': 'sb-events-meta' }, 'CrowdSec Firewall Protection')
					])
				]) : null
			].filter(Boolean))
		]);
	},

	renderFeaturedApps: function(appIds) {
		var self = this;
		return appIds.map(function(id) {
			var app = portal.apps[id];
			if (!app) return null;

			var status = self.appStatuses[id];

			return E('a', {
				'class': 'sb-app-card',
				'href': L.url(app.path)
			}, [
				E('div', { 'class': 'sb-app-card-header' }, [
					E('div', {
						'class': 'sb-app-card-icon',
						'style': 'background: ' + app.iconBg + '; color: ' + app.iconColor + ';'
					}, app.icon),
					E('div', {}, [
						E('h4', { 'class': 'sb-app-card-title' }, app.name),
						app.version ? E('span', { 'class': 'sb-app-card-version' }, 'v' + app.version) : null
					])
				]),
				E('p', { 'class': 'sb-app-card-desc' }, app.desc),
				status ? E('div', { 'class': 'sb-app-card-status' }, [
					E('span', { 'class': 'sb-app-card-status-dot ' + status }),
					E('span', { 'class': 'sb-app-card-status-text' },
						status === 'running' ? 'Service running' : 'Service stopped')
				]) : null
			]);
		}).filter(function(el) { return el !== null; });
	},

	renderSecuritySection: function() {
		var apps = portal.getAppsBySection('security');
		return this.renderAppSection('security', 'Security',
			'Protect your network with advanced security tools', apps);
	},

	renderNetworkSection: function() {
		var apps = portal.getAppsBySection('network');
		return this.renderAppSection('network', 'Network',
			'Configure and optimize your network connections', apps);
	},

	renderMonitoringSection: function() {
		var apps = portal.getAppsBySection('monitoring');
		return this.renderAppSection('monitoring', 'Monitoring',
			'Monitor traffic, applications, and system performance', apps);
	},

	renderSystemSection: function() {
		var apps = portal.getAppsBySection('system');
		return this.renderAppSection('system', 'System',
			'System administration and configuration tools', apps);
	},

	renderServicesSection: function() {
		var apps = portal.getAppsBySection('services');
		return this.renderAppSection('services', 'Services',
			'Application services and server platforms', apps);
	},

	renderAppSection: function(sectionId, title, subtitle, apps) {
		var self = this;

		return E('div', { 'class': 'sb-portal-section', 'data-section': sectionId }, [
			E('div', { 'class': 'sb-section-header' }, [
				E('h2', { 'class': 'sb-section-title' }, title),
				E('p', { 'class': 'sb-section-subtitle' }, subtitle)
			]),
			E('div', { 'class': 'sb-app-grid' },
				apps.map(function(app) {
					var status = self.appStatuses[app.id];

					return E('a', {
						'class': 'sb-app-card',
						'href': L.url(app.path)
					}, [
						E('div', { 'class': 'sb-app-card-header' }, [
							E('div', {
								'class': 'sb-app-card-icon',
								'style': 'background: ' + app.iconBg + '; color: ' + app.iconColor + ';'
							}, app.icon),
							E('div', {}, [
								E('h4', { 'class': 'sb-app-card-title' }, app.name),
								app.version ? E('span', { 'class': 'sb-app-card-version' }, 'v' + app.version) : null
							])
						]),
						E('p', { 'class': 'sb-app-card-desc' }, app.desc),
						status ? E('div', { 'class': 'sb-app-card-status' }, [
							E('span', { 'class': 'sb-app-card-status-dot ' + status }),
							E('span', { 'class': 'sb-app-card-status-text' },
								status === 'running' ? 'Service running' : 'Service stopped')
						]) : null
					]);
				})
			)
		]);
	},

	formatUptime: function(seconds) {
		if (!seconds) return 'Unknown';
		var days = Math.floor(seconds / 86400);
		var hours = Math.floor((seconds % 86400) / 3600);
		var mins = Math.floor((seconds % 3600) / 60);

		var parts = [];
		if (days > 0) parts.push(days + 'd');
		if (hours > 0) parts.push(hours + 'h');
		if (mins > 0) parts.push(mins + 'm');

		return parts.join(' ') || '< 1m';
	},

	formatBytes: function(bytes) {
		if (!bytes) return '0 B';
		var units = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = 0;
		while (bytes >= 1024 && i < units.length - 1) {
			bytes /= 1024;
			i++;
		}
		return bytes.toFixed(1) + ' ' + units[i];
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
