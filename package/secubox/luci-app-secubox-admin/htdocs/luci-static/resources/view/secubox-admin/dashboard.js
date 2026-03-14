'use strict';
'require view';
'require secubox-admin/api as API';
'require secubox-admin/components as Components';
'require secubox-admin/widget-renderer as WidgetRenderer';
'require secubox-admin/data-utils as DataUtils';
'require poll';
'require ui';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme as KissTheme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var ADMIN_NAV = [
	{ id: 'dashboard', icon: '🎛️', label: 'Control Panel' },
	{ id: 'cyber-dashboard', icon: '🔮', label: 'Cyber Console' },
	{ id: 'apps', icon: '📦', label: 'Apps Manager' },
	{ id: 'updates', icon: '🔄', label: 'Updates' },
	{ id: 'catalog-sources', icon: '📚', label: 'Catalog' },
	{ id: 'health', icon: '💚', label: 'Health' },
	{ id: 'logs', icon: '📋', label: 'Logs' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderAdminNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:var(--kiss-bg);border:1px solid var(--kiss-line);border-radius:12px;flex-wrap:wrap;'
	}, ADMIN_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'admin', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:var(--kiss-purple);color:white;' : 'color:var(--kiss-muted);background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	widgetRenderer: null,

	load: function() {
		return Promise.all([
			L.resolveDefault(API.getApps(), { apps: [] }),
			L.resolveDefault(API.getModules(), { modules: {} }),
			L.resolveDefault(API.getHealth(), {}),
			L.resolveDefault(API.getAlerts(), { alerts: [] }),
			L.resolveDefault(API.checkUpdates(), { updates: [] }),
			L.resolveDefault(API.getSystemOverview(), {})
		]);
	},

	render: function(data) {
		var apps = DataUtils.normalizeApps(data[0]);
		var modules = DataUtils.normalizeModules(data[1]);
		var health = data[2];
		var alerts = DataUtils.normalizeAlerts(data[3]);
		var updateInfo = DataUtils.normalizeUpdates(data[4]);
		var sysOverview = data[5] || {};
		var stats = DataUtils.buildAppStats(apps, modules, alerts, updateInfo, API.getAppStatus);
		var healthSnapshot = DataUtils.normalizeHealth(health);

		var container = E('div', { 'class': 'cyberpunk-mode secubox-admin-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/widgets.css') }),

			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '🎛️ ADMIN CONTROL PANEL'),
				E('div', { 'class': 'cyber-header-subtitle' }, 'System Overview · Applications · Health Monitoring')
			]),

			// System Overview Infographic
			this.renderSystemOverview(sysOverview),

			// Stats grid
			E('div', { 'class': 'stats-grid' }, [
				Components.renderStatCard('📦', stats.totalApps, 'Total Apps', 'blue'),
				Components.renderStatCard('✅', stats.installedCount, 'Installed', 'green'),
				Components.renderStatCard('▶️', stats.runningCount, 'Running', 'success'),
				Components.renderStatCard('⚠️', stats.alertCount, 'Alerts', stats.alertCount > 0 ? 'warning' : 'muted'),
				Components.renderStatCard('🔄', stats.updateCount, 'Pending Updates',
					stats.updateCount > 0 ? 'warning' : 'muted')
			]),

			// System health summary
			this.renderHealthSummary(healthSnapshot),

			// Recent alerts
			this.renderAlertsSection(alerts),

			// App Widgets Section
			this.renderWidgetsSection(apps),

			// Quick actions
			this.renderQuickActions()
		]);

		// Auto-refresh every 30 seconds
		poll.add(L.bind(this.pollData, this), 30);

		// Initialize widget renderer after DOM is ready
		var self = this;
		requestAnimationFrame(function() {
			self.initializeWidgets(apps);
		});

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderAdminNav('dashboard'));
		wrapper.appendChild(container);
		return KissTheme.wrap([wrapper], 'admin/secubox/admin/dashboard');
	},

	renderSystemOverview: function(overview) {
		if (!overview || !overview.system) return E('div');

		var sys = overview.system || {};
		var net = overview.network || {};
		var svc = overview.services || {};
		var sec = overview.security || {};

		return E('div', { 'class': 'system-overview card', 'style': 'margin-bottom:20px;' }, [
			E('h3', { 'style': 'margin:0 0 16px 0;color:var(--kiss-cyan);' }, '📊 SYSTEM OVERVIEW'),
			E('div', { 'class': 'overview-grid', 'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;' }, [
				// System section
				E('div', { 'class': 'overview-section', 'style': 'background:color-mix(in srgb, var(--kiss-cyan) 5%, transparent);padding:12px;border-radius:8px;border:1px solid color-mix(in srgb, var(--kiss-cyan) 20%, transparent);' }, [
					E('h4', { 'style': 'margin:0 0 8px 0;color:var(--kiss-cyan);font-size:12px;' }, '⚡ SYSTEM'),
					E('div', { 'style': 'font-size:11px;line-height:1.8;' }, [
						E('div', {}, 'Load: ' + (sys.load || 'N/A')),
						E('div', {}, 'CPU: ' + (sys.cpu_used || 0) + '% used'),
						E('div', {}, 'Uptime: ' + (sys.uptime || 'N/A'))
					])
				]),
				// Resources section
				E('div', { 'class': 'overview-section', 'style': 'background:color-mix(in srgb, var(--kiss-cyan) 5%, transparent);padding:12px;border-radius:8px;border:1px solid color-mix(in srgb, var(--kiss-cyan) 20%, transparent);' }, [
					E('h4', { 'style': 'margin:0 0 8px 0;color:var(--kiss-cyan);font-size:12px;' }, '💾 RESOURCES'),
					E('div', { 'style': 'font-size:11px;line-height:1.8;' }, [
						E('div', {}, 'Memory: ' + (sys.mem_free || 0) + 'MB free'),
						E('div', {}, 'Disk /: ' + (sys.disk_root || 'N/A')),
						E('div', {}, 'Disk /srv: ' + (sys.disk_srv || 'N/A'))
					])
				]),
				// Services section
				E('div', { 'class': 'overview-section', 'style': 'background:color-mix(in srgb, var(--kiss-cyan) 5%, transparent);padding:12px;border-radius:8px;border:1px solid color-mix(in srgb, var(--kiss-cyan) 20%, transparent);' }, [
					E('h4', { 'style': 'margin:0 0 8px 0;color:var(--kiss-cyan);font-size:12px;' }, '🔧 SERVICES'),
					E('div', { 'style': 'font-size:11px;line-height:1.8;' }, [
						E('div', {}, 'HAProxy: ' + (svc.haproxy_backends || 0) + ' backends'),
						E('div', {}, 'VHosts: ' + (svc.haproxy_vhosts || 0)),
						E('div', {}, 'Sites: ' + (svc.metablog_sites || 0) + ' / Apps: ' + (svc.streamlit_apps || 0))
					])
				]),
				// Network section
				E('div', { 'class': 'overview-section', 'style': 'background:color-mix(in srgb, var(--kiss-cyan) 5%, transparent);padding:12px;border-radius:8px;border:1px solid color-mix(in srgb, var(--kiss-cyan) 20%, transparent);' }, [
					E('h4', { 'style': 'margin:0 0 8px 0;color:var(--kiss-cyan);font-size:12px;' }, '🌐 NETWORK'),
					E('div', { 'style': 'font-size:11px;line-height:1.8;' }, [
						E('div', {}, 'Connections: ' + (net.connections || 0)),
						E('div', {}, 'Tor: ' + (net.tor || 0)),
						E('div', {}, 'HTTPS: ' + (net.https || 0))
					])
				]),
				// Security section
				E('div', { 'class': 'overview-section', 'style': 'background:color-mix(in srgb, var(--kiss-red) 10%, transparent);padding:12px;border-radius:8px;border:1px solid color-mix(in srgb, var(--kiss-red) 30%, transparent);' }, [
					E('h4', { 'style': 'margin:0 0 8px 0;color:var(--kiss-red);font-size:12px;' }, '🛡️ SECURITY'),
					E('div', { 'style': 'font-size:11px;line-height:1.8;' }, [
						E('div', {}, 'Active Bans: ' + (sec.active_bans || 0)),
						E('div', {}, 'SSRF: ' + (sec.attacks_ssrf || 0) + ' | Bots: ' + (sec.attacks_botscan || 0)),
						E('div', {}, 'Countries: ' + (sec.top_countries || 'N/A'))
					])
				])
			])
		]);
	},

	renderHealthSummary: function(health) {
		if (!health) return E('div');

		var cpu = health.cpuUsage || 0;
		var memory = health.memoryUsage || 0;
		var disk = health.diskUsage || 0;
		var loadDisplay = health.load || '0 0 0';

		return E('div', { 'class': 'health-summary card' }, [
			E('h3', {}, 'System Health'),
			E('div', { 'class': 'health-meta' }, [
				E('span', { 'class': 'health-status ' + (health.overall.status || 'unknown') },
					(health.overall.status || 'unknown').toUpperCase()),
				E('span', { 'class': 'health-score' }, 'Score: ' + (health.overall.score || 0))
			]),
			E('div', { 'class': 'health-grid' }, [
				E('div', { 'class': 'health-item' }, [
					E('span', { 'class': 'health-label' }, 'CPU'),
					E('div', { 'class': 'progress' }, [
						E('div', {
							'class': 'progress-bar',
							'style': 'width: ' + cpu + '%'
						})
					]),
					E('span', { 'class': 'health-value' }, cpu + '%')
				]),
				E('div', { 'class': 'health-item' }, [
					E('span', { 'class': 'health-label' }, 'Memory'),
					E('div', { 'class': 'progress' }, [
						E('div', {
							'class': 'progress-bar',
							'style': 'width: ' + memory + '%'
						})
					]),
					E('span', { 'class': 'health-value' }, memory + '%')
				]),
				E('div', { 'class': 'health-item' }, [
					E('span', { 'class': 'health-label' }, 'Disk'),
					E('div', { 'class': 'progress' }, [
						E('div', {
							'class': 'progress-bar',
							'style': 'width: ' + disk + '%'
						})
					]),
					E('span', { 'class': 'health-value' }, disk + '%')
				])
			]),
			E('div', { 'class': 'health-meta health-meta--secondary' }, [
				E('span', {}, 'Load: ' + loadDisplay),
				E('span', {}, 'Uptime: ' + API.formatUptime(health.uptime || 0))
			])
		]);
	},

	renderAlertsSection: function(alerts) {
		if (!alerts || alerts.length === 0) {
			return E('div', { 'class': 'alerts-section card' }, [
				E('h3', {}, 'System Alerts'),
				E('p', { 'class': 'text-muted' }, 'No alerts')
			]);
		}

		return E('div', { 'class': 'alerts-section card' }, [
			E('h3', {}, 'System Alerts'),
			E('div', { 'class': 'alerts-list' },
				alerts.slice(0, 5).map(function(alert) {
					return Components.renderAlert(
						alert.severity || 'info',
						alert.message,
						false
					);
				})
			),
			alerts.length > 5 ? E('a', {
				'href': L.url('admin/secubox/admin/alerts'),
				'class': 'view-all-link'
			}, 'View all ' + alerts.length + ' alerts') : E('div')
		]);
	},

	renderServicesSection: function(services) {
		if (!services || services.length === 0) {
			return E('div', { 'class': 'services-section card' }, [
				E('h3', {}, '🔌 Active Services'),
				E('p', { 'class': 'text-muted' }, 'No services detected')
			]);
		}

		// Filter for external services only (accessible from network)
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

		var serviceLinks = [];
		categoryOrder.forEach(function(cat) {
			if (categories[cat] && categories[cat].length > 0) {
				categories[cat].forEach(function(svc) {
					var url = window.location.protocol + '//' + window.location.hostname + svc.url;
					serviceLinks.push(E('a', {
						'href': url,
						'target': '_blank',
						'class': 'service-link',
						'style': 'display:inline-flex;align-items:center;gap:8px;padding:10px 16px;' +
							'background:color-mix(in srgb, var(--kiss-purple) 10%, transparent);border:1px solid color-mix(in srgb, var(--kiss-purple) 30%, transparent);' +
							'border-radius:8px;text-decoration:none;color:var(--kiss-text);font-size:14px;' +
							'transition:all 0.2s;margin:4px;'
					}, [
						E('span', { 'style': 'font-size:18px;' }, svc.icon || '⚡'),
						E('span', {}, svc.name),
						E('span', { 'style': 'color:var(--kiss-muted);font-size:12px;' }, ':' + svc.port)
					]));
				});
			}
		});

		return E('div', { 'class': 'services-section card' }, [
			E('h3', {}, '🔌 Active Services'),
			E('div', { 'class': 'services-grid', 'style': 'display:flex;flex-wrap:wrap;gap:8px;' },
				serviceLinks.length > 0 ? serviceLinks :
					[E('p', { 'class': 'text-muted' }, 'No external services available')]
			)
		]);
	},

	renderQuickActions: function() {
		return E('div', { 'class': 'quick-actions card' }, [
			E('h3', {}, 'Quick Actions'),
			E('div', { 'class': 'actions-grid' }, [
				E('button', {
					'class': 'btn btn-primary',
					'click': function() {
						window.location = L.url('admin/secubox/admin/apps');
					}
				}, [
					E('span', { 'class': 'icon' }, '📦'),
					E('span', {}, 'Manage Apps')
				]),
				E('button', {
					'class': 'btn btn-primary',
					'click': function() {
						window.location = L.url('admin/secubox/admin/health');
					}
				}, [
					E('span', { 'class': 'icon' }, '💊'),
					E('span', {}, 'System Health')
				]),
				E('button', {
					'class': 'btn btn-primary',
					'click': function() {
						window.location = L.url('admin/secubox/admin/logs');
					}
				}, [
					E('span', { 'class': 'icon' }, '📋'),
					E('span', {}, 'View Logs')
				])
			])
		]);
	},

	renderWidgetsSection: function(apps) {
		// Filter apps with widgets enabled
		var widgetApps = apps.filter(function(app) {
			return app.widget && app.widget.enabled;
		});

		var widgetCount = widgetApps.length;

		return E('div', { 'class': 'widgets-section card' }, [
			E('div', { 'class': 'widgets-header' }, [
				E('h3', {}, 'App Widgets'),
				E('span', { 'class': 'widget-count' },
					widgetCount + (widgetCount === 1 ? ' widget' : ' widgets'))
			]),
			E('div', { 'id': 'dashboard-widgets-container' })
		]);
	},

	initializeWidgets: function(apps) {
		// Cleanup existing widget renderer
		if (this.widgetRenderer) {
			try {
				this.widgetRenderer.destroy();
			} catch (e) {
				console.error('Error destroying widget renderer:', e);
			}
		}

			try {
				// Create new widget renderer instance
				var options = {
					containerId: 'dashboard-widgets-container',
					apps: apps,
					defaultRefreshInterval: 30,
					gridMode: 'auto'
				};

				this.widgetRenderer = WidgetRenderer.create(options);

				// Render widgets
				if (this.widgetRenderer && this.widgetRenderer.render) {
				this.widgetRenderer.render();
			}
		} catch (e) {
			console.error('Error initializing widgets:', e);
			// Render error message in widget container
			var container = document.getElementById('dashboard-widgets-container');
			if (container) {
				container.innerHTML = '<div class="alert alert-warning">Widget system initialization failed. Please refresh the page.</div>';
			}
		}
	},

	pollData: function() {
		var self = this;
		return Promise.all([
			API.getModules(),
			API.getHealth(),
			API.getAlerts()
		]).then(function(data) {
			// Update DOM without full re-render
			// Implementation details can be added for live updates
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	addFooter: function() {
		// Cleanup widget renderer when leaving page
		if (this.widgetRenderer) {
			this.widgetRenderer.destroy();
			this.widgetRenderer = null;
		}
	}
});
