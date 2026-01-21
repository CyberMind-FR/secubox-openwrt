'use strict';
'require view';
'require secubox-admin/api as API';
'require secubox-admin/data-utils as DataUtils';
'require poll';
'require ui';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

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
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;flex-wrap:wrap;'
	}, ADMIN_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'admin', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(API.getApps(), { apps: [] }),
			L.resolveDefault(API.getModules(), { modules: {} }),
			L.resolveDefault(API.getHealth(), {}),
			L.resolveDefault(API.getAlerts(), { alerts: [] }),
			L.resolveDefault(API.getCatalogSources(), { sources: [] }),
			L.resolveDefault(API.checkUpdates(), { updates: [] })
		]);
	},

	render: function(data) {
		var apps = DataUtils.normalizeApps(data[0]);
		var modules = DataUtils.normalizeModules(data[1]);
		var health = data[2] || {};
		var alerts = DataUtils.normalizeAlerts(data[3]);
		var sources = DataUtils.normalizeSources(data[4]);
		var updates = DataUtils.normalizeUpdates(data[5]);
		var healthSnapshot = DataUtils.normalizeHealth(health);
		var stats = DataUtils.buildAppStats(apps, modules, alerts, updates, API.getAppStatus);
		var self = this;

		var container = E('div', { 'class': 'cyberpunk-mode' }, [
			// Load cyberpunk CSS
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),

			// ASCII Art Header
			E('div', { 'class': 'cyber-header cyber-scanlines' }, [
				E('pre', { 'class': 'cyber-ascii-art' },
`╔═══════════════════════════════════════════════════════════════╗
║  ███████╗███████╗ ██████╗██╗   ██╗██████╗  ██████╗ ██╗  ██╗ ║
║  ██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗██╔═══██╗╚██╗██╔╝ ║
║  ███████╗█████╗  ██║     ██║   ██║██████╔╝██║   ██║ ╚███╔╝  ║
║  ╚════██║██╔══╝  ██║     ██║   ██║██╔══██╗██║   ██║ ██╔██╗  ║
║  ███████║███████╗╚██████╗╚██████╔╝██████╔╝╚██████╔╝██╔╝ ██╗ ║
║  ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ║
╚═══════════════════════════════════════════════════════════════╝`),
				E('div', { 'class': 'cyber-header-title cyber-text-glow' }, 'ADMIN CONTROL CENTER'),
				E('div', { 'class': 'cyber-header-subtitle' }, 'System Status: ONLINE • Access Level: ROOT')
			]),

			// Dual Console Layout
			E('div', { 'class': 'cyber-dual-console' }, [
				// LEFT CONSOLE - Stats & Quick Actions
				E('div', { 'class': 'cyber-console-left' }, [
					// System Stats
					this.renderStatsPanel(stats.totalApps, stats.installedCount, stats.runningCount, stats.alertCount, updates.total_updates_available || 0),

					// System Resources
					this.renderSystemPanel(healthSnapshot),

					// Quick Actions
					this.renderQuickActionsPanel(),

					// Catalog Sources Status
					this.renderSourcesPanel(sources)
				]),

				// RIGHT CONSOLE - Main Content
				E('div', { 'class': 'cyber-console-right' }, [
					// Active Apps List
					this.renderAppsPanel(apps, modules),

					// System Alerts
					this.renderAlertsPanel(alerts)
				])
			])
		]);

		// Auto-refresh
		poll.add(L.bind(this.pollData, this), 10);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderAdminNav('cyber-dashboard'));
		wrapper.appendChild(container);
		return wrapper;
	},

	renderStatsPanel: function(totalApps, installed, running, alertCount, updateCount) {
		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '📊 SYSTEM STATS'),
				E('span', { 'class': 'cyber-panel-badge' }, 'LIVE')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'class': 'cyber-stats-grid' }, [
					E('div', { 'class': 'cyber-stat-card' }, [
						E('div', { 'class': 'cyber-stat-icon' }, '📦'),
						E('div', { 'class': 'cyber-stat-value' }, totalApps.toString()),
						E('div', { 'class': 'cyber-stat-label' }, 'Total Apps')
					]),
					E('div', { 'class': 'cyber-stat-card accent' }, [
						E('div', { 'class': 'cyber-stat-icon' }, '✅'),
						E('div', { 'class': 'cyber-stat-value' }, installed.toString()),
						E('div', { 'class': 'cyber-stat-label' }, 'Installed')
					]),
					E('div', { 'class': 'cyber-stat-card' }, [
						E('div', { 'class': 'cyber-stat-icon' }, '▶️'),
						E('div', { 'class': 'cyber-stat-value' }, running.toString()),
						E('div', { 'class': 'cyber-stat-label' }, 'Running')
					]),
					E('div', { 'class': 'cyber-stat-card ' + (alertCount > 0 ? 'warning' : '') }, [
						E('div', { 'class': 'cyber-stat-icon' }, '⚠️'),
						E('div', { 'class': 'cyber-stat-value' }, alertCount.toString()),
						E('div', { 'class': 'cyber-stat-label' }, 'Alerts')
					]),
					E('div', { 'class': 'cyber-stat-card ' + (updateCount > 0 ? 'accent' : '') }, [
						E('div', { 'class': 'cyber-stat-icon' }, '🔄'),
						E('div', { 'class': 'cyber-stat-value' }, updateCount.toString()),
						E('div', { 'class': 'cyber-stat-label' }, 'Updates')
					]),
					E('div', { 'class': 'cyber-stat-card' }, [
						E('div', { 'class': 'cyber-stat-icon' }, '🌐'),
						E('div', { 'class': 'cyber-stat-value' }, '100%'),
						E('div', { 'class': 'cyber-stat-label' }, 'Network')
					])
				])
			])
		]);
	},

	renderSystemPanel: function(health) {
		health = health || {};
		var cpu = health.cpuUsage || 0;
		var memory = health.memoryUsage || 0;
		var disk = health.diskUsage || 0;
		var memInfo = health.memory || {};
		var diskInfo = health.disk || {};
		var loadDisplay = health.load ? (health.load.toString().replace(/\s+/g, ', ')) : '0, 0, 0';
		var uptimeText = API.formatUptime ? API.formatUptime(health.uptime || 0) : (health.uptime || 0) + 's';
		var memorySummary = API.formatBytes((memInfo.usedBytes || 0)) + ' / ' + API.formatBytes((memInfo.totalBytes || 0));
		var diskSummary = API.formatBytes((diskInfo.usedBytes || 0)) + ' / ' + API.formatBytes((diskInfo.totalBytes || 0));

		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '💻 SYSTEM RESOURCES')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'class': 'cyber-system-status' }, [
					// CPU
					E('div', { 'class': 'cyber-metric' }, [
						E('div', { 'class': 'cyber-metric-header' }, [
							E('div', { 'class': 'cyber-metric-label' }, [
								E('span', {}, '⚡'),
								E('span', {}, 'CPU Load')
							]),
							E('div', { 'class': 'cyber-metric-value' }, cpu + '%')
						]),
						E('div', { 'class': 'cyber-progress-bar' }, [
							E('div', {
								'class': 'cyber-progress-fill' + (cpu > 80 ? ' danger' : cpu > 60 ? ' warning' : ''),
								'style': 'width: ' + cpu + '%'
							})
						])
					]),

					// Memory
					E('div', { 'class': 'cyber-metric' }, [
						E('div', { 'class': 'cyber-metric-header' }, [
							E('div', { 'class': 'cyber-metric-label' }, [
								E('span', {}, '🧠'),
								E('span', {}, 'Memory Usage')
							]),
							E('div', { 'class': 'cyber-metric-value' }, memory + '%')
						]),
						E('div', { 'class': 'cyber-progress-bar' }, [
							E('div', {
								'class': 'cyber-progress-fill' + (memory > 80 ? ' danger' : memory > 60 ? ' warning' : ''),
								'style': 'width: ' + memory + '%'
							})
						])
					]),

					// Disk
					E('div', { 'class': 'cyber-metric' }, [
						E('div', { 'class': 'cyber-metric-header' }, [
							E('div', { 'class': 'cyber-metric-label' }, [
								E('span', {}, '💾'),
								E('span', {}, 'Disk Usage')
							]),
							E('div', { 'class': 'cyber-metric-value' }, disk + '%')
						]),
						E('div', { 'class': 'cyber-progress-bar' }, [
							E('div', {
								'class': 'cyber-progress-fill' + (disk > 80 ? ' danger' : disk > 60 ? ' warning' : ''),
								'style': 'width: ' + disk + '%'
							})
						])
					])
				])
			]),
			E('div', { 'class': 'cyber-system-meta' }, [
				E('div', { 'class': 'cyber-system-meta-item' }, [
					E('span', { 'class': 'label' }, 'Load'),
					E('span', { 'class': 'value' }, loadDisplay)
				]),
				E('div', { 'class': 'cyber-system-meta-item' }, [
					E('span', { 'class': 'label' }, 'Uptime'),
					E('span', { 'class': 'value' }, uptimeText)
				]),
				E('div', { 'class': 'cyber-system-meta-item' }, [
					E('span', { 'class': 'label' }, 'Memory'),
					E('span', { 'class': 'value' }, memorySummary)
				]),
				E('div', { 'class': 'cyber-system-meta-item' }, [
					E('span', { 'class': 'label' }, 'Disk'),
					E('span', { 'class': 'value' }, diskSummary)
				])
			])
		]);
	},

	renderQuickActionsPanel: function() {
		var self = this;
		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '⚡ QUICK ACTIONS')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'class': 'cyber-quick-actions' }, [
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							window.location = L.url('admin/secubox/admin/apps');
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '📦'),
						E('span', { 'class': 'cyber-action-label' }, 'Manage Apps'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					]),
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							window.location = L.url('admin/secubox/admin/updates');
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '🔄'),
						E('span', { 'class': 'cyber-action-label' }, 'Check Updates'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					]),
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							window.location = L.url('admin/secubox/admin/catalog-sources');
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '🌐'),
						E('span', { 'class': 'cyber-action-label' }, 'Catalog Sources'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					]),
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							window.location = L.url('admin/secubox/admin/health');
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '💊'),
						E('span', { 'class': 'cyber-action-label' }, 'System Health'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					]),
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							window.location = L.url('admin/secubox/admin/logs');
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '📋'),
						E('span', { 'class': 'cyber-action-label' }, 'View Logs'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					]),
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							self.syncCatalogs();
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '🔃'),
						E('span', { 'class': 'cyber-action-label' }, 'Sync Catalogs'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					])
				])
			])
		]);
	},

	renderSourcesPanel: function(sources) {
		var activeSources = sources.filter(function(s) { return s.enabled; });
		var onlineSources = sources.filter(function(s) { return s.status === 'online' || s.status === 'available'; });

		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '🛰️ CATALOG SOURCES'),
				E('span', { 'class': 'cyber-panel-badge' }, onlineSources.length + '/' + sources.length)
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
					sources.length > 0 ?
						sources.map(function(source) {
							var isOnline = source.status === 'online' || source.status === 'available';
							return E('div', {
								'style': 'display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,255,65,0.05); border-left: 2px solid ' + (isOnline ? 'var(--cyber-primary)' : 'var(--cyber-text-dim)')
							}, [
								E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
									E('span', { 'class': 'cyber-status-dot ' + (isOnline ? 'online' : 'offline') }),
									E('span', { 'style': 'font-size: 12px; font-weight: bold; text-transform: uppercase;' }, source.name)
								]),
								E('span', {
									'class': 'cyber-badge ' + (isOnline ? 'success' : 'warning'),
									'style': 'font-size: 9px;'
								}, source.status || 'unknown')
							]);
						}) :
						E('div', { 'style': 'text-align: center; color: var(--cyber-text-dim); padding: 20px;' }, 'No sources configured')
				)
			])
		]);
	},

	renderAppsPanel: function(apps, modules) {
		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '🎮 ACTIVE APPLICATIONS'),
				E('span', { 'class': 'cyber-panel-badge' }, apps.length)
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'class': 'cyber-list' },
					apps.length > 0 ?
						apps.slice(0, 6).map(function(app) {
							var status = API.getAppStatus(app, modules);
							return E('div', {
								'class': 'cyber-list-item' + (status.running ? ' active' : status.installed ? '' : ' offline')
							}, [
								E('div', { 'class': 'cyber-list-icon' }, app.icon || '📦'),
								E('div', { 'class': 'cyber-list-content' }, [
									E('div', { 'class': 'cyber-list-title' }, [
										app.name,
										status.running ? E('span', { 'class': 'cyber-badge success' }, [
											E('span', { 'class': 'cyber-status-dot online' }),
											E('span', {}, 'RUNNING')
										]) : status.installed ? E('span', { 'class': 'cyber-badge info' }, 'INSTALLED') : null
									]),
									E('div', { 'class': 'cyber-list-meta' }, [
										E('div', { 'class': 'cyber-list-meta-item' }, [
											E('span', {}, '📁'),
											E('span', {}, app.category || 'unknown')
										]),
										E('div', { 'class': 'cyber-list-meta-item' }, [
											E('span', {}, '🏷️'),
											E('span', {}, app.version || 'N/A')
										])
									])
								]),
								E('div', { 'class': 'cyber-list-actions' }, [
									status.running ?
										E('button', { 'class': 'cyber-btn danger' }, '⏹ Stop') :
										status.installed ?
											E('button', { 'class': 'cyber-btn primary' }, '▶️ Start') :
											E('button', { 'class': 'cyber-btn' }, '⬇️ Install')
								])
							]);
						}) :
						E('div', { 'style': 'text-align: center; color: var(--cyber-text-dim); padding: 40px;' }, 'No applications found')
				)
			])
		]);
	},

	renderAlertsPanel: function(alerts) {
		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '⚠️ SYSTEM ALERTS'),
				E('span', { 'class': 'cyber-panel-badge' }, alerts.length)
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'class': 'cyber-list' },
					alerts.length > 0 ?
						alerts.slice(0, 3).map(function(alert) {
							var severityClass = alert.severity === 'error' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info';
							return E('div', { 'class': 'cyber-list-item' }, [
								E('div', { 'class': 'cyber-list-icon' },
									alert.severity === 'error' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'),
								E('div', { 'class': 'cyber-list-content' }, [
									E('div', { 'class': 'cyber-list-title' }, [
										alert.message,
										E('span', { 'class': 'cyber-badge ' + severityClass }, alert.severity.toUpperCase())
									])
								])
							]);
						}) :
						E('div', { 'style': 'text-align: center; color: var(--cyber-primary); padding: 40px;' }, [
							E('div', { 'style': 'font-size: 48px; margin-bottom: 10px;' }, '✅'),
							E('div', { 'style': 'font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;' }, 'ALL SYSTEMS NOMINAL')
						])
				)
			])
		]);
	},

	syncCatalogs: function() {
		ui.showModal(_('Syncing'), [
			E('p', { 'class': 'spinning' }, _('Synchronizing catalogs...'))
		]);

		API.syncCatalog(null).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Catalogs synced successfully')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Sync failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ' + err.message)), 'error');
		});
	},

	pollData: function() {
		// Auto-refresh data every 10 seconds
		return Promise.all([
			API.getHealth(),
			API.getModules(),
			API.getAlerts()
		]).then(function(data) {
			// Update UI without full reload
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
