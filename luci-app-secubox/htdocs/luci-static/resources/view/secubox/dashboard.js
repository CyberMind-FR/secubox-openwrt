'use strict';
'require view';
'require ui';
'require secubox/api as API';
'require dom';

// Load CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/secubox.css')
}));

return view.extend({
	load: function() {
		return Promise.all([
			API.getDashboardData(),
			API.getSystemHealth(),
			API.getAlerts()
		]);
	},

	render: function(data) {
		var dashboard = data[0] || {};
		var health = data[1] || {};
		var alertsData = data[2] || {};

		var status = dashboard.status || {};
		var modules = dashboard.modules || [];
		var counts = dashboard.counts || {};
		var alerts = alertsData.alerts || [];

		var container = E('div', { 'class': 'cbi-map' });

		// Header
		container.appendChild(E('h2', {}, 'SecuBox Central Hub'));
		container.appendChild(E('p', {},
			'Hostname: ' + (status.hostname || 'Unknown') + ' | ' +
			'Uptime: ' + API.formatUptime(status.uptime) + ' | ' +
			'Load: ' + (status.load || '0.00')
		));

		// System Health Section
		container.appendChild(this.renderSystemHealth(health));

		// Quick Actions Section
		container.appendChild(this.renderQuickActions());

		// Alerts Section
		if (alerts.length > 0) {
			container.appendChild(this.renderAlerts(alerts));
		}

		// Modules Grid
		container.appendChild(this.renderModulesGrid(modules));

		return container;
	},

	renderSystemHealth: function(health) {
		var cpu = health.cpu || {};
		var memory = health.memory || {};
		var disk = health.disk || {};
		var network = health.network || {};

		var section = E('div', { 'class': 'secubox-health-section' }, [
			E('h3', {}, 'System Health'),
			E('div', { 'class': 'secubox-health-grid' }, [
				this.renderGauge('CPU', cpu.percent || 0, '%', cpu.load_1min),
				this.renderGauge('Memory', memory.percent || 0, '%',
					API.formatBytes(memory.used_kb * 1024) + ' / ' + API.formatBytes(memory.total_kb * 1024)),
				this.renderGauge('Disk', disk.percent || 0, '%',
					API.formatBytes(disk.used_kb * 1024) + ' / ' + API.formatBytes(disk.total_kb * 1024)),
				this.renderGauge('Network', 0, '',
					'RX: ' + API.formatBytes(network.rx_bytes) + ' | TX: ' + API.formatBytes(network.tx_bytes))
			])
		]);

		return section;
	},

	renderGauge: function(label, percent, unit, details) {
		var color = percent < 70 ? '#22c55e' : percent < 85 ? '#f59e0b' : '#ef4444';

		return E('div', { 'class': 'secubox-gauge' }, [
			E('div', { 'class': 'secubox-gauge-label' }, label),
			E('div', { 'class': 'secubox-gauge-chart' }, [
				E('svg', { 'width': '120', 'height': '120', 'viewBox': '0 0 120 120' }, [
					E('circle', {
						'cx': '60', 'cy': '60', 'r': '54',
						'fill': 'none', 'stroke': '#1e293b', 'stroke-width': '12'
					}),
					E('circle', {
						'cx': '60', 'cy': '60', 'r': '54',
						'fill': 'none', 'stroke': color, 'stroke-width': '12',
						'stroke-dasharray': (339.292 * percent / 100) + ' 339.292',
						'stroke-linecap': 'round',
						'transform': 'rotate(-90 60 60)'
					}),
					E('text', {
						'x': '60', 'y': '65', 'text-anchor': 'middle',
						'font-size': '24', 'font-weight': 'bold', 'fill': color
					}, percent + unit)
				])
			]),
			E('div', { 'class': 'secubox-gauge-details' }, details || '')
		]);
	},

	renderQuickActions: function() {
		var self = this;
		var actions = [
			{ name: 'restart_rpcd', label: 'Restart RPCD', icon: '🔄' },
			{ name: 'restart_uhttpd', label: 'Restart uHTTPd', icon: '🌐' },
			{ name: 'clear_cache', label: 'Clear Cache', icon: '🧹' },
			{ name: 'backup_config', label: 'Backup Config', icon: '💾' },
			{ name: 'restart_network', label: 'Restart Network', icon: '📡' },
			{ name: 'restart_firewall', label: 'Restart Firewall', icon: '🛡️' }
		];

		var buttons = actions.map(function(action) {
			return E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': function() {
					self.executeQuickAction(action.name, action.label);
				}
			}, action.icon + ' ' + action.label);
		});

		return E('div', { 'class': 'secubox-quick-actions' }, [
			E('h3', {}, 'Quick Actions'),
			E('div', { 'class': 'secubox-actions-grid' }, buttons)
		]);
	},

	executeQuickAction: function(action, label) {
		ui.showModal(_('Quick Action'), [
			E('p', { 'class': 'spinning' }, _('Executing: ') + label + '...')
		]);

		API.quickAction(action).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', result.message || 'Action completed'), 'info');
			} else {
				ui.addNotification(null, E('p', result.message || 'Action failed'), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	renderAlerts: function(alerts) {
		var alertItems = alerts.map(function(alert) {
			var severityClass = 'secubox-alert-' + (alert.severity || 'info');
			return E('div', { 'class': 'secubox-alert ' + severityClass }, [
				E('strong', {}, alert.module + ': '),
				E('span', {}, alert.message)
			]);
		});

		return E('div', { 'class': 'secubox-alerts-section' }, [
			E('h3', {}, 'Recent Alerts (' + alerts.length + ')'),
			E('div', { 'class': 'secubox-alerts-list' }, alertItems)
		]);
	},

	renderModulesGrid: function(modules) {
		var moduleCards = modules.map(function(module) {
			var statusClass = module.installed ? (module.running ? 'running' : 'stopped') : 'not-installed';
			var statusIcon = module.installed ? (module.running ? '✓' : '✗') : '○';
			var statusColor = module.installed ? (module.running ? '#22c55e' : '#ef4444') : '#64748b';

			return E('div', {
				'class': 'secubox-module-card',
				'data-status': statusClass
			}, [
				E('div', { 'class': 'secubox-module-header' }, [
					E('div', {
						'class': 'secubox-module-icon',
						'style': 'background-color: ' + (module.color || '#64748b')
					}, module.icon || '📦'),
					E('div', {
						'class': 'secubox-module-status',
						'style': 'color: ' + statusColor
					}, statusIcon)
				]),
				E('div', { 'class': 'secubox-module-body' }, [
					E('div', { 'class': 'secubox-module-name' }, module.name || module.id),
					E('div', { 'class': 'secubox-module-description' }, module.description || ''),
					E('div', { 'class': 'secubox-module-category' }, module.category || 'other')
				]),
				E('div', { 'class': 'secubox-module-footer' }, [
					module.installed ? E('a', {
						'href': '#',
						'class': 'cbi-button cbi-button-link',
						'click': function(ev) {
							ev.preventDefault();
							window.location.hash = '#admin/secubox/' + module.id;
						}
					}, 'Open Dashboard') : E('span', { 'class': 'secubox-not-installed' }, 'Not Installed')
				])
			]);
		});

		return E('div', { 'class': 'secubox-modules-section' }, [
			E('h3', {}, 'Installed Modules'),
			E('div', { 'class': 'secubox-modules-grid' }, moduleCards)
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
