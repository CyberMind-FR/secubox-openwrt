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

var callSecurityStats = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_security_stats'
});

var callGetServices = rpc.declare({
	object: 'luci.secubox',
	method: 'get_services',
	expect: { services: [] }
});

var callDashboardData = rpc.declare({
	object: 'luci.secubox',
	method: 'get_dashboard_data',
	expect: { counts: {} }
});

var callGetProxyMode = rpc.declare({
	object: 'luci.secubox',
	method: 'get_proxy_mode'
});

var callSetProxyMode = rpc.declare({
	object: 'luci.secubox',
	method: 'set_proxy_mode',
	params: ['mode']
});

return view.extend({
	currentSection: 'dashboard',
	appStatuses: {},
	installedApps: {},

	load: function() {
		var self = this;
		return Promise.all([
			callSystemBoard(),
			callSystemInfo(),
			this.loadAppStatuses(),
			callCrowdSecStats().catch(function() { return null; }),
			portal.checkInstalledApps(),
			callGetServices().catch(function() { return []; }),
			callSecurityStats().catch(function() { return null; }),
			callDashboardData().catch(function() { return { counts: {} }; }),
			callGetProxyMode().catch(function() { return { mode: 'direct' }; })
		]).then(function(results) {
			// Store installed apps info from the last promise
			self.installedApps = results[4] || {};
			// Store dashboard counts from RPCD (reliable source)
			self.dashboardCounts = results[7] || {};
			// RPC expect unwraps the services array directly
			var svcResult = results[5] || [];
			self.detectedServices = Array.isArray(svcResult) ? svcResult : (svcResult.services || []);
			// Security stats
			self.securityStats = results[6] || {};
			// Proxy mode
			self.proxyMode = results[8] || { mode: 'direct' };
			return results;
		});
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
		var securityStats = this.securityStats || {};
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
				this.renderDashboardSection(boardInfo, sysInfo, crowdSecStats, securityStats),
				this.renderSecuritySection(),
				this.renderNetworkSection(),
				this.renderMonitoringSection(),
				this.renderSystemSection(),
				this.renderServicesAppsSection(),
				this.renderActivePortsSection()
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
		var tabSections = ['security', 'network', 'monitoring', 'system', 'services', 'active-ports'];

		return E('div', { 'class': 'sb-portal-header' }, [
			// Brand
			E('div', { 'class': 'sb-portal-brand' }, [
				E('div', { 'class': 'sb-portal-logo' }, 'S'),
				E('span', { 'class': 'sb-portal-title' }, 'SecuBox'),
				E('span', { 'class': 'sb-portal-version' }, 'v0.15.51')
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

	renderDashboardSection: function(boardInfo, sysInfo, crowdSecStats, securityStats) {
		var self = this;
		var securityApps = portal.getAppsBySection('security');
		var networkApps = portal.getAppsBySection('network');
		var monitoringApps = portal.getAppsBySection('monitoring');

		// Count running services - prefer RPCD counts (reliable), fallback to local check
		var counts = this.dashboardCounts || {};
		var runningCount = counts.running || Object.values(this.appStatuses).filter(function(s) { return s === 'running'; }).length;
		var totalServices = counts.total || Object.keys(this.appStatuses).length;

		// CrowdSec blocked IPs count
		var blockedIPv4 = (crowdSecStats.ipv4_total_count || 0);
		var blockedIPv6 = (crowdSecStats.ipv6_total_count || 0);
		var totalBlocked = blockedIPv4 + blockedIPv6;
		var crowdSecHealth = crowdSecStats.firewall_health || {};
		var crowdSecActive = crowdSecHealth.bouncer_running && crowdSecHealth.decisions_synced;

		// Security stats
		var wanDropped = securityStats.wan_dropped || 0;
		var fwRejects = securityStats.firewall_rejects || 0;
		var csBans = securityStats.crowdsec_bans || 0;
		var csAlerts = securityStats.crowdsec_alerts_24h || 0;

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

				// Firewall Blocked
				E('div', { 'class': 'sb-quick-stat' }, [
					E('div', { 'class': 'sb-quick-stat-header' }, [
						E('div', { 'class': 'sb-quick-stat-icon security' }, '\ud83d\udeab'),
						E('span', { 'class': 'sb-quick-stat-status ' + (crowdSecActive ? 'running' : 'warning') },
							crowdSecActive ? 'Protected' : 'Monitoring')
					]),
					E('div', { 'class': 'sb-quick-stat-value' }, (wanDropped + fwRejects).toLocaleString()),
					E('div', { 'class': 'sb-quick-stat-label' }, 'Packets Blocked')
				]),

				// Threat Alerts
				E('div', { 'class': 'sb-quick-stat' }, [
					E('div', { 'class': 'sb-quick-stat-header' }, [
						E('div', { 'class': 'sb-quick-stat-icon security' }, '\ud83d\udc41\ufe0f'),
						E('span', { 'class': 'sb-quick-stat-status ' + (csAlerts > 0 ? 'warning' : 'running') },
							csAlerts > 0 ? 'Alerts' : 'Clear')
					]),
					E('div', { 'class': 'sb-quick-stat-value' }, csBans + '/' + csAlerts),
					E('div', { 'class': 'sb-quick-stat-label' }, 'Bans / Alerts 24h')
				])
			]),

			// Proxy Mode Switcher
			this.renderProxyModeSwitcher(),

			// Speed Test Widget
			this.renderSpeedTestWidget(),

			// Featured Apps
			E('h3', { 'style': 'margin: 1.5rem 0 1rem; color: var(--cyber-text-primary);' }, 'Quick Access'),
			E('div', { 'class': 'sb-app-grid' },
				this.renderFeaturedApps(['crowdsec', 'threat-monitor', 'bandwidth-manager', 'media-flow'])
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
				]) : null,
				wanDropped > 0 ? E('div', { 'class': 'sb-events-item' }, [
					E('div', { 'class': 'sb-events-icon warning' }, '\ud83d\udc41\ufe0f'),
					E('div', { 'class': 'sb-events-content' }, [
						E('p', { 'class': 'sb-events-message' },
							'WAN Dropped: ' + wanDropped.toLocaleString() + ' | Firewall Rejects: ' + fwRejects),
						E('span', { 'class': 'sb-events-meta' }, [
							'Threat Monitor - ',
							E('a', { 'href': L.url('admin/secubox/security/threats/dashboard') }, 'View Details')
						])
					])
				]) : null
			].filter(Boolean))
		]);
	},

	renderFeaturedApps: function(appIds) {
		var self = this;
		// Filter to only show installed apps
		var installedAppIds = appIds.filter(function(id) {
			var app = portal.apps[id];
			if (!app) return false;
			// Include if no service (always show) or if service is installed
			return !app.service || self.installedApps[id];
		});

		if (installedAppIds.length === 0) {
			return [E('p', { 'class': 'sb-empty-text', 'style': 'grid-column: 1 / -1' },
				'No featured apps installed. Install SecuBox packages to see quick access apps here.')];
		}

		return installedAppIds.map(function(id) {
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
		var apps = portal.getInstalledAppsBySection('security', this.installedApps);
		return this.renderAppSection('security', 'Security',
			'Protect your network with advanced security tools', apps);
	},

	renderNetworkSection: function() {
		var apps = portal.getInstalledAppsBySection('network', this.installedApps);
		return this.renderAppSection('network', 'Network',
			'Configure and optimize your network connections', apps);
	},

	renderMonitoringSection: function() {
		var apps = portal.getInstalledAppsBySection('monitoring', this.installedApps);
		return this.renderAppSection('monitoring', 'Monitoring',
			'Monitor traffic, applications, and system performance', apps);
	},

	renderSystemSection: function() {
		var apps = portal.getInstalledAppsBySection('system', this.installedApps);
		return this.renderAppSection('system', 'System',
			'System administration and configuration tools', apps);
	},

	renderServicesAppsSection: function() {
		var apps = portal.getInstalledAppsBySection('services', this.installedApps);
		return this.renderAppSection('services', 'Services',
			'Application services running on your network', apps);
	},

	renderActivePortsSection: function() {
		var self = this;
		var services = this.detectedServices || [];

		// Filter for external services with URLs
		var externalServices = services.filter(function(s) {
			return s.external && s.url;
		});

		// Group by category
		var categories = {};
		externalServices.forEach(function(s) {
			var cat = s.category || 'other';
			if (!categories[cat]) categories[cat] = [];
			categories[cat].push(s);
		});

		var categoryOrder = ['app', 'monitoring', 'system', 'proxy', 'security', 'media', 'privacy', 'other'];
		var categoryLabels = {
			app: '📦 Applications',
			monitoring: '📊 Monitoring',
			system: '⚙️ System',
			proxy: '🔀 Proxy',
			security: '🛡️ Security',
			media: '🎵 Media',
			privacy: '🧅 Privacy',
			other: '⚡ Other'
		};

		var serviceCards = [];

		// Map icon names to emojis
		var iconMap = {
			'lock': '🔐', 'globe': '🌐', 'arrow': '🔀', 'shield': '🔒',
			'git': '📦', 'blog': '📝', 'security': '🛡️', 'settings': '⚙️',
			'feed': '📡', 'chart': '📊', 'stats': '📈', 'admin': '🔧',
			'app': '🎨', 'music': '🎵', 'onion': '🧅', '': '⚡'
		};

		categoryOrder.forEach(function(cat) {
			if (categories[cat] && categories[cat].length > 0) {
				categories[cat].forEach(function(svc) {
					// Always use http:// for local services (they don't have SSL certs)
					var url = 'http://' + window.location.hostname + svc.url;
					var emoji = iconMap[svc.icon] || '⚡';
					serviceCards.push(E('a', {
						'class': 'sb-app-card sb-service-card',
						'href': url,
						'target': '_blank'
					}, [
						E('div', { 'class': 'sb-app-card-header' }, [
							E('div', {
								'class': 'sb-app-card-icon',
								'style': 'background: linear-gradient(135deg, #667eea, #764ba2); font-size: 24px;'
							}, emoji),
							E('div', {}, [
								E('h4', { 'class': 'sb-app-card-title' }, svc.name),
								E('span', { 'class': 'sb-app-card-version' }, ':' + svc.port)
							])
						]),
						E('p', { 'class': 'sb-app-card-desc' }, categoryLabels[svc.category] || 'Service'),
						E('div', { 'class': 'sb-app-card-status' }, [
							E('span', { 'class': 'sb-app-card-status-dot running' }),
							E('span', { 'class': 'sb-app-card-status-text' }, 'Listening')
						])
					]));
				});
			}
		});

		if (serviceCards.length === 0) {
			return E('div', { 'class': 'sb-portal-section', 'data-section': 'active-ports' }, [
				E('div', { 'class': 'sb-section-header' }, [
					E('h2', { 'class': 'sb-section-title' }, '🔌 Active Ports'),
					E('p', { 'class': 'sb-section-subtitle' }, 'Detected services listening on network ports')
				]),
				E('div', { 'class': 'sb-section-empty' }, [
					E('div', { 'class': 'sb-empty-icon' }, '🔌'),
					E('p', { 'class': 'sb-empty-text' }, 'No external services detected'),
					E('p', { 'class': 'sb-empty-hint' }, 'Services listening on localhost only are not shown')
				])
			]);
		}

		return E('div', { 'class': 'sb-portal-section', 'data-section': 'active-ports' }, [
			E('div', { 'class': 'sb-section-header' }, [
				E('h2', { 'class': 'sb-section-title' }, '🔌 Active Ports'),
				E('p', { 'class': 'sb-section-subtitle' }, 'Detected services listening on network ports')
			]),
			E('div', { 'class': 'sb-app-grid' }, serviceCards)
		]);
	},

	renderAppSection: function(sectionId, title, subtitle, apps) {
		var self = this;

		// Show empty state if no apps installed in this section
		if (!apps || apps.length === 0) {
			return E('div', { 'class': 'sb-portal-section', 'data-section': sectionId }, [
				E('div', { 'class': 'sb-section-header' }, [
					E('h2', { 'class': 'sb-section-title' }, title),
					E('p', { 'class': 'sb-section-subtitle' }, subtitle)
				]),
				E('div', { 'class': 'sb-section-empty' }, [
					E('div', { 'class': 'sb-empty-icon' }, '\ud83d\udce6'),
					E('p', { 'class': 'sb-empty-text' }, 'No ' + title.toLowerCase() + ' apps installed'),
					E('p', { 'class': 'sb-empty-hint' }, 'Install packages from the SecuBox repository to add apps here')
				])
			]);
		}

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

	renderProxyModeSwitcher: function() {
		var self = this;
		var currentMode = (this.proxyMode && this.proxyMode.mode) || 'direct';

		var modes = [
			{ id: 'direct', name: 'Direct', icon: '🌐', desc: 'No proxy - direct internet access' },
			{ id: 'cdn', name: 'CDN Cache', icon: '⚡', desc: 'HTTP caching via local proxy (port 3128)' },
			{ id: 'tor', name: 'Tor', icon: '🧅', desc: 'Route traffic through Tor network' },
			{ id: 'mitmproxy', name: 'MITM', icon: '🔍', desc: 'Traffic inspection via mitmproxy' }
		];

		// Quick access buttons based on current mode
		var quickLinks = {
			direct: [
				{ icon: '🔧', label: 'Network', path: 'admin/network/network' },
				{ icon: '🛡️', label: 'Firewall', path: 'admin/network/firewall' },
				{ icon: '📡', label: 'DHCP/DNS', path: 'admin/network/dhcp' }
			],
			cdn: [
				{ icon: '⚡', label: 'CDN Cache', path: 'admin/services/cdn-cache' },
				{ icon: '📊', label: 'Statistics', path: 'admin/services/cdn-cache/statistics' },
				{ icon: '📄', label: 'View PAC', path: null, external: '/wpad/wpad.dat' }
			],
			tor: [
				{ icon: '🧅', label: 'Tor Shield', path: 'admin/services/tor-shield' },
				{ icon: '🔒', label: 'Hidden Services', path: 'admin/services/tor-shield/hidden' },
				{ icon: '📊', label: 'Tor Status', path: 'admin/services/tor-shield' }
			],
			mitmproxy: [
				{ icon: '🔍', label: 'mitmproxy', path: 'admin/services/mitmproxy' },
				{ icon: '🌐', label: 'Web UI', path: null, external: 'http://192.168.255.1:8080' },
				{ icon: '📜', label: 'Get CA Cert', path: null, external: 'http://mitm.it' }
			]
		};

		var currentLinks = quickLinks[currentMode] || quickLinks.direct;

		var btnStyle = 'display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid var(--cyber-border, #444); background: var(--cyber-bg-tertiary, #16213e); color: var(--cyber-text-primary, #fff); font-size: 0.8em; text-decoration: none; cursor: pointer; transition: all 0.2s;';

		return E('div', { 'class': 'sb-proxy-switcher', 'style': 'margin: 1.5rem 0; padding: 1rem; background: var(--cyber-bg-secondary, #1a1a2e); border-radius: 12px; border: 1px solid var(--cyber-border, #333);' }, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;' }, [
				E('span', { 'style': 'font-size: 1.2em;' }, '🔀'),
				E('h4', { 'style': 'margin: 0; color: var(--cyber-text-primary, #fff);' }, 'Network Proxy Mode'),
				E('span', { 'style': 'margin-left: auto; font-size: 0.8em; color: var(--cyber-text-secondary, #888);' }, 'WPAD auto-config enabled')
			]),
			E('div', { 'class': 'sb-proxy-modes', 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem;' },
				modes.map(function(mode) {
					var isActive = currentMode === mode.id;
					return E('button', {
						'class': 'sb-proxy-mode-btn' + (isActive ? ' active' : ''),
						'data-mode': mode.id,
						'style': 'display: flex; flex-direction: column; align-items: center; padding: 0.75rem; border-radius: 8px; border: 2px solid ' + (isActive ? 'var(--cyber-accent, #0ff)' : 'var(--cyber-border, #333)') + '; background: ' + (isActive ? 'rgba(0, 255, 255, 0.1)' : 'var(--cyber-bg-tertiary, #16213e)') + '; cursor: pointer; transition: all 0.2s;',
						'click': function() { self.handleProxyModeChange(mode.id); }
					}, [
						E('span', { 'style': 'font-size: 1.5em; margin-bottom: 0.25rem;' }, mode.icon),
						E('span', { 'style': 'font-weight: 600; color: ' + (isActive ? 'var(--cyber-accent, #0ff)' : 'var(--cyber-text-primary, #fff)') + ';' }, mode.name),
						E('span', { 'style': 'font-size: 0.7em; color: var(--cyber-text-secondary, #888); text-align: center; margin-top: 0.25rem;' }, mode.desc)
					]);
				})
			),
			// Quick Access Buttons
			E('div', { 'class': 'sb-proxy-quick-access', 'style': 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--cyber-border, #333);' }, [
				E('span', { 'style': 'font-size: 0.75em; color: var(--cyber-text-secondary, #888); margin-right: 0.5rem; align-self: center;' }, 'Quick Access:')
			].concat(currentLinks.map(function(link) {
				if (link.external) {
					return E('a', {
						'href': link.external,
						'target': '_blank',
						'style': btnStyle
					}, [
						E('span', {}, link.icon),
						E('span', {}, link.label)
					]);
				} else if (link.path) {
					return E('a', {
						'href': L.url(link.path),
						'style': btnStyle
					}, [
						E('span', {}, link.icon),
						E('span', {}, link.label)
					]);
				}
				return null;
			}).filter(Boolean)))
		]);
	},

	renderSpeedTestWidget: function() {
		var self = this;

		return E('div', { 'class': 'sb-speedtest-widget', 'style': 'margin: 1.5rem 0; padding: 1.25rem; background: var(--cyber-bg-secondary, #1a1a2e); border-radius: 12px; border: 1px solid var(--cyber-border, #333);' }, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;' }, [
				E('span', { 'style': 'font-size: 1.2em;' }, '🚀'),
				E('h4', { 'style': 'margin: 0; color: var(--cyber-text-primary, #fff);' }, 'Speed Test'),
				E('span', { 'style': 'margin-left: auto; font-size: 0.75em; color: var(--cyber-text-secondary, #888);' }, 'Test your connection speed')
			]),
			E('div', { 'class': 'sb-speedtest-results', 'style': 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;' }, [
				E('div', { 'class': 'sb-speedtest-metric', 'style': 'text-align: center; padding: 1rem; background: var(--cyber-bg-tertiary, #16213e); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 0.75em; color: var(--cyber-text-secondary, #888); margin-bottom: 0.25rem;' }, '⬇️ Download'),
					E('div', { 'id': 'speedtest-download', 'style': 'font-size: 1.5em; font-weight: bold; color: #10b981;' }, '-- Mbps'),
					E('div', { 'id': 'speedtest-download-progress', 'style': 'height: 4px; background: #333; border-radius: 2px; margin-top: 0.5rem; overflow: hidden;' }, [
						E('div', { 'style': 'height: 100%; width: 0%; background: linear-gradient(90deg, #10b981, #0ff); transition: width 0.3s;' })
					])
				]),
				E('div', { 'class': 'sb-speedtest-metric', 'style': 'text-align: center; padding: 1rem; background: var(--cyber-bg-tertiary, #16213e); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 0.75em; color: var(--cyber-text-secondary, #888); margin-bottom: 0.25rem;' }, '⬆️ Upload'),
					E('div', { 'id': 'speedtest-upload', 'style': 'font-size: 1.5em; font-weight: bold; color: #8b5cf6;' }, '-- Mbps'),
					E('div', { 'id': 'speedtest-upload-progress', 'style': 'height: 4px; background: #333; border-radius: 2px; margin-top: 0.5rem; overflow: hidden;' }, [
						E('div', { 'style': 'height: 100%; width: 0%; background: linear-gradient(90deg, #8b5cf6, #ec4899); transition: width 0.3s;' })
					])
				]),
				E('div', { 'class': 'sb-speedtest-metric', 'style': 'text-align: center; padding: 1rem; background: var(--cyber-bg-tertiary, #16213e); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 0.75em; color: var(--cyber-text-secondary, #888); margin-bottom: 0.25rem;' }, '📶 Ping'),
					E('div', { 'id': 'speedtest-ping', 'style': 'font-size: 1.5em; font-weight: bold; color: #f59e0b;' }, '-- ms'),
					E('div', { 'id': 'speedtest-jitter', 'style': 'font-size: 0.7em; color: var(--cyber-text-secondary, #888); margin-top: 0.25rem;' }, 'Jitter: -- ms')
				])
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 1rem;' }, [
				E('button', {
					'id': 'speedtest-btn',
					'class': 'sb-speedtest-btn',
					'style': 'flex: 1; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #0ff, #00a0a0); color: #000; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 1em;',
					'click': function(ev) { self.runSpeedTest(ev.target); }
				}, '▶️ Start Speed Test'),
				E('select', {
					'id': 'speedtest-server',
					'style': 'padding: 0.75rem; border-radius: 8px; border: 1px solid var(--cyber-border, #333); background: var(--cyber-bg-tertiary, #16213e); color: var(--cyber-text-primary, #fff);'
				}, [
					E('option', { 'value': 'cloudflare' }, 'Cloudflare'),
					E('option', { 'value': 'fast' }, 'Fast.com (Netflix)'),
					E('option', { 'value': 'local' }, 'Local (Router)')
				])
			]),
			E('div', { 'id': 'speedtest-status', 'style': 'margin-top: 0.75rem; font-size: 0.8em; color: var(--cyber-text-secondary, #888); text-align: center;' }, 'Ready to test')
		]);
	},

	runSpeedTest: function(btn) {
		var self = this;
		var server = document.getElementById('speedtest-server').value;
		var statusEl = document.getElementById('speedtest-status');
		var downloadEl = document.getElementById('speedtest-download');
		var uploadEl = document.getElementById('speedtest-upload');
		var pingEl = document.getElementById('speedtest-ping');
		var jitterEl = document.getElementById('speedtest-jitter');
		var dlProgress = document.querySelector('#speedtest-download-progress > div');
		var ulProgress = document.querySelector('#speedtest-upload-progress > div');

		// Disable button during test
		btn.disabled = true;
		btn.textContent = '⏳ Testing...';
		btn.style.opacity = '0.7';

		// Reset values
		downloadEl.textContent = '-- Mbps';
		uploadEl.textContent = '-- Mbps';
		pingEl.textContent = '-- ms';
		jitterEl.textContent = 'Jitter: -- ms';
		dlProgress.style.width = '0%';
		ulProgress.style.width = '0%';

		// Test endpoints based on server selection
		var testUrls = {
			cloudflare: {
				download: 'https://speed.cloudflare.com/__down?bytes=10000000',
				upload: 'https://speed.cloudflare.com/__up',
				ping: 'https://speed.cloudflare.com/__down?bytes=0'
			},
			fast: {
				download: 'https://api.fast.com/netflix/speedtest/v2?https=true&token=YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm&urlCount=1',
				ping: 'https://api.fast.com/netflix/speedtest/v2?https=true&token=YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm&urlCount=1'
			},
			local: {
				download: '/cgi-bin/luci/admin/status/realtime/bandwidth_status',
				ping: '/cgi-bin/luci/'
			}
		};

		var urls = testUrls[server] || testUrls.cloudflare;

		// Measure ping first
		statusEl.textContent = '📡 Measuring latency...';
		var pingStart = performance.now();
		var pings = [];

		var measurePing = function(attempts) {
			if (attempts <= 0) {
				var avgPing = pings.reduce(function(a, b) { return a + b; }, 0) / pings.length;
				var jitter = Math.max.apply(null, pings) - Math.min.apply(null, pings);
				pingEl.textContent = avgPing.toFixed(0) + ' ms';
				jitterEl.textContent = 'Jitter: ' + jitter.toFixed(0) + ' ms';
				runDownloadTest();
				return;
			}

			var start = performance.now();
			fetch(urls.ping, { method: 'HEAD', cache: 'no-store', mode: 'no-cors' })
				.then(function() {
					pings.push(performance.now() - start);
					measurePing(attempts - 1);
				})
				.catch(function() {
					pings.push(performance.now() - start);
					measurePing(attempts - 1);
				});
		};

		var runDownloadTest = function() {
			statusEl.textContent = '⬇️ Testing download speed...';

			if (server === 'fast') {
				// Fast.com requires API call first
				downloadEl.textContent = 'N/A';
				dlProgress.style.width = '100%';
				runUploadTest();
				return;
			}

			var downloadStart = performance.now();
			var receivedBytes = 0;
			var downloadSize = server === 'local' ? 100000 : 10000000; // 10MB for cloudflare

			fetch(urls.download, { cache: 'no-store' })
				.then(function(response) {
					var reader = response.body.getReader();
					var read = function() {
						return reader.read().then(function(result) {
							if (result.done) {
								var duration = (performance.now() - downloadStart) / 1000;
								var speedBps = (receivedBytes * 8) / duration;
								var speedMbps = speedBps / 1000000;
								downloadEl.textContent = speedMbps.toFixed(2) + ' Mbps';
								dlProgress.style.width = '100%';
								runUploadTest();
								return;
							}
							receivedBytes += result.value.length;
							var progress = Math.min((receivedBytes / downloadSize) * 100, 100);
							dlProgress.style.width = progress + '%';
							return read();
						});
					};
					return read();
				})
				.catch(function(err) {
					downloadEl.textContent = 'Error';
					dlProgress.style.width = '100%';
					runUploadTest();
				});
		};

		var runUploadTest = function() {
			statusEl.textContent = '⬆️ Testing upload speed...';

			if (server !== 'cloudflare') {
				uploadEl.textContent = 'N/A';
				ulProgress.style.width = '100%';
				finishTest();
				return;
			}

			var uploadSize = 2000000; // 2MB
			var uploadData = new Uint8Array(uploadSize);
			var uploadStart = performance.now();

			fetch(urls.upload, {
				method: 'POST',
				body: uploadData,
				cache: 'no-store'
			})
				.then(function() {
					var duration = (performance.now() - uploadStart) / 1000;
					var speedBps = (uploadSize * 8) / duration;
					var speedMbps = speedBps / 1000000;
					uploadEl.textContent = speedMbps.toFixed(2) + ' Mbps';
					ulProgress.style.width = '100%';
					finishTest();
				})
				.catch(function(err) {
					uploadEl.textContent = 'Error';
					ulProgress.style.width = '100%';
					finishTest();
				});
		};

		var finishTest = function() {
			statusEl.textContent = '✅ Test complete - ' + new Date().toLocaleTimeString();
			btn.disabled = false;
			btn.textContent = '▶️ Start Speed Test';
			btn.style.opacity = '1';
		};

		// Start with ping measurement (5 attempts)
		measurePing(5);
	},

	handleProxyModeChange: function(mode) {
		var self = this;
		var buttons = document.querySelectorAll('.sb-proxy-mode-btn');

		// Visual feedback - disable all buttons
		buttons.forEach(function(btn) {
			btn.disabled = true;
			btn.style.opacity = '0.6';
		});

		return callSetProxyMode(mode).then(function(result) {
			if (result && result.success) {
				// Update UI
				self.proxyMode = { mode: mode };
				buttons.forEach(function(btn) {
					var isActive = btn.dataset.mode === mode;
					btn.classList.toggle('active', isActive);
					btn.style.borderColor = isActive ? 'var(--cyber-accent, #0ff)' : 'var(--cyber-border, #333)';
					btn.style.background = isActive ? 'rgba(0, 255, 255, 0.1)' : 'var(--cyber-bg-tertiary, #16213e)';
					var nameSpan = btn.querySelector('span:nth-child(2)');
					if (nameSpan) {
						nameSpan.style.color = isActive ? 'var(--cyber-accent, #0ff)' : 'var(--cyber-text-primary, #fff)';
					}
					btn.disabled = false;
					btn.style.opacity = '1';
				});
				ui.addNotification(null, E('p', {}, 'Proxy mode changed to: ' + mode), 'info');
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to change proxy mode: ' + (result.error || 'unknown error')), 'error');
				buttons.forEach(function(btn) {
					btn.disabled = false;
					btn.style.opacity = '1';
				});
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, 'Error changing proxy mode: ' + err.message), 'error');
			buttons.forEach(function(btn) {
				btn.disabled = false;
				btn.style.opacity = '1';
			});
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
