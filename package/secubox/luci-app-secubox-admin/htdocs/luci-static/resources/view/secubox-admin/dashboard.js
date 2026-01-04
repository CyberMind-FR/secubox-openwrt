'use strict';
'require view';
'require secubox-admin.api as API';
'require secubox-admin.components as Components';
'require poll';
'require ui';

return view.extend({
	load: function() {
		return Promise.all([
			API.getApps(),
			API.getModules(),
			API.getHealth(),
			API.getAlerts()
		]);
	},

	render: function(data) {
		var apps = data[0].apps || [];
		var modules = data[1].modules || {};
		var health = data[2];
		var alerts = data[3].alerts || [];

		var installedCount = 0;
		var runningCount = 0;

		apps.forEach(function(app) {
			var status = API.getAppStatus(app, modules);
			if (status.installed) installedCount++;
			if (status.running) runningCount++;
		});

		var container = E('div', { 'class': 'secubox-admin-dashboard' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('h2', {}, 'Admin Control Panel'),

			// Stats grid
			E('div', { 'class': 'stats-grid' }, [
				Components.renderStatCard('📦', apps.length, 'Total Apps', 'blue'),
				Components.renderStatCard('✅', installedCount, 'Installed', 'green'),
				Components.renderStatCard('▶️', runningCount, 'Running', 'success'),
				Components.renderStatCard('⚠️', alerts.length, 'Alerts', alerts.length > 0 ? 'warning' : 'muted')
			]),

			// System health summary
			this.renderHealthSummary(health),

			// Recent alerts
			this.renderAlertsSection(alerts),

			// Quick actions
			this.renderQuickActions()
		]);

		// Auto-refresh every 30 seconds
		poll.add(L.bind(this.pollData, this), 30);

		return container;
	},

	renderHealthSummary: function(health) {
		if (!health) return E('div');

		return E('div', { 'class': 'health-summary card' }, [
			E('h3', {}, 'System Health'),
			E('div', { 'class': 'health-grid' }, [
				E('div', { 'class': 'health-item' }, [
					E('span', { 'class': 'health-label' }, 'CPU'),
					E('div', { 'class': 'progress' }, [
						E('div', {
							'class': 'progress-bar',
							'style': 'width: ' + (health.cpu || 0) + '%'
						})
					]),
					E('span', { 'class': 'health-value' }, (health.cpu || 0) + '%')
				]),
				E('div', { 'class': 'health-item' }, [
					E('span', { 'class': 'health-label' }, 'Memory'),
					E('div', { 'class': 'progress' }, [
						E('div', {
							'class': 'progress-bar',
							'style': 'width: ' + (health.memory || 0) + '%'
						})
					]),
					E('span', { 'class': 'health-value' }, (health.memory || 0) + '%')
				]),
				E('div', { 'class': 'health-item' }, [
					E('span', { 'class': 'health-label' }, 'Disk'),
					E('div', { 'class': 'progress' }, [
						E('div', {
							'class': 'progress-bar',
							'style': 'width: ' + (health.disk || 0) + '%'
						})
					]),
					E('span', { 'class': 'health-value' }, (health.disk || 0) + '%')
				])
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
	handleReset: null
});
