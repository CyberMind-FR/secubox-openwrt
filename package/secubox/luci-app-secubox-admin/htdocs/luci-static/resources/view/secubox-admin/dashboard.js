'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require secubox-admin.widget-renderer as WidgetRenderer';
'require secubox-admin.data-utils as DataUtils';
'require poll';
'require ui';

return view.extend({
	widgetRenderer: null,

	load: function() {
		return Promise.all([
			L.resolveDefault(API.getApps(), { apps: [] }),
			L.resolveDefault(API.getModules(), { modules: {} }),
			L.resolveDefault(API.getHealth(), {}),
			L.resolveDefault(API.getAlerts(), { alerts: [] }),
			L.resolveDefault(API.checkUpdates(), { updates: [] })
		]);
	},

	render: function(data) {
		var apps = DataUtils.normalizeApps(data[0]);
		var modules = DataUtils.normalizeModules(data[1]);
		var health = data[2];
		var alerts = DataUtils.normalizeAlerts(data[3]);
		var updateInfo = DataUtils.normalizeUpdates(data[4]);
		var stats = DataUtils.buildAppStats(apps, modules, alerts, updateInfo, API.getAppStatus);
		var healthSnapshot = DataUtils.normalizeHealth(health);

		var container = E('div', { 'class': 'secubox-admin-dashboard' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/widgets.css') }),

			E('h2', {}, 'Admin Control Panel'),

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

		return container;
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
