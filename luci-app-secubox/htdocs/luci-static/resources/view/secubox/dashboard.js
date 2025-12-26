'use strict';
'require view';
'require ui';
'require secubox/api as API';
'require dom';
'require poll';

// Load CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/secubox.css')
}));

return view.extend({
	dashboardData: null,
	healthData: null,
	alertsData: null,

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return Promise.all([
			API.getDashboardData(),
			API.getSystemHealth(),
			API.getAlerts()
		]).then(function(data) {
			self.dashboardData = data[0] || {};
			self.healthData = data[1] || {};
			self.alertsData = data[2] || {};
			return data;
		});
	},

	render: function(data) {
		var self = this;
		var status = this.dashboardData.status || {};
		var modules = this.dashboardData.modules || [];
		var counts = this.dashboardData.counts || {};
		var alerts = this.alertsData.alerts || [];

		var container = E('div', { 'class': 'cbi-map secubox-dashboard' });

		// Header
		container.appendChild(E('h2', {}, '🛡️ SecuBox Central Hub'));
		container.appendChild(E('p', {},
			'Hostname: ' + (status.hostname || 'Unknown') + ' | ' +
			'Uptime: ' + API.formatUptime(status.uptime) + ' | ' +
			'Load: ' + (status.load || '0.00') + ' | ' +
			'Version: ' + (status.version || 'v0.0.1-beta')
		));

		// Stats Overview
		container.appendChild(this.renderStatsOverview(counts, alerts));

		// System Health Section
		container.appendChild(this.renderSystemHealth(this.healthData));

		// Quick Actions Section
		container.appendChild(this.renderQuickActions());

		// Alerts Section
		if (alerts.length > 0) {
			container.appendChild(this.renderAlerts(alerts));
		}

		// Modules Grid
		container.appendChild(this.renderModulesGrid(modules));

		// Start auto-refresh poll
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateDynamicElements();
			});
		}, 30); // Refresh every 30 seconds

		return container;
	},

	renderStatsOverview: function(counts, alerts) {
		return E('div', { 'class': 'secubox-stats-overview' }, [
			E('div', { 'class': 'secubox-stat-box' }, [
				E('div', { 'class': 'secubox-stat-icon' }, '📦'),
				E('div', { 'class': 'secubox-stat-content' }, [
					E('div', { 'class': 'secubox-stat-value', 'id': 'stat-total' }, counts.total || 0),
					E('div', { 'class': 'secubox-stat-label' }, 'Total Modules')
				])
			]),
			E('div', { 'class': 'secubox-stat-box' }, [
				E('div', { 'class': 'secubox-stat-icon' }, '✅'),
				E('div', { 'class': 'secubox-stat-content' }, [
					E('div', { 'class': 'secubox-stat-value', 'id': 'stat-installed', 'style': 'color: #22c55e' }, counts.installed || 0),
					E('div', { 'class': 'secubox-stat-label' }, 'Installed')
				])
			]),
			E('div', { 'class': 'secubox-stat-box' }, [
				E('div', { 'class': 'secubox-stat-icon' }, '▶️'),
				E('div', { 'class': 'secubox-stat-content' }, [
					E('div', { 'class': 'secubox-stat-value', 'id': 'stat-running', 'style': 'color: #00ab44' }, counts.running || 0),
					E('div', { 'class': 'secubox-stat-label' }, 'Running')
				])
			]),
			E('div', { 'class': 'secubox-stat-box' }, [
				E('div', { 'class': 'secubox-stat-icon' }, '⚠️'),
				E('div', { 'class': 'secubox-stat-content' }, [
					E('div', { 'class': 'secubox-stat-value', 'id': 'stat-alerts', 'style': 'color: #f59e0b' }, alerts.length || 0),
					E('div', { 'class': 'secubox-stat-label' }, 'Alerts')
				])
			])
		]);
	},

	renderSystemHealth: function(health) {
		var cpu = health.cpu || {};
		var memory = health.memory || {};
		var disk = health.disk || {};
		var network = health.network || {};

		var section = E('div', { 'class': 'secubox-health-section' }, [
			E('h3', {}, '📊 System Health'),
			E('div', { 'class': 'secubox-health-grid' }, [
				this.renderGauge('CPU', cpu.percent || 0, '%', 'Load: ' + (cpu.load_1min || '0.00'), 'cpu'),
				this.renderGauge('Memory', memory.percent || 0, '%',
					API.formatBytes((memory.used_kb || 0) * 1024) + ' / ' + API.formatBytes((memory.total_kb || 0) * 1024), 'memory'),
				this.renderGauge('Disk', disk.percent || 0, '%',
					API.formatBytes((disk.used_kb || 0) * 1024) + ' / ' + API.formatBytes((disk.total_kb || 0) * 1024), 'disk'),
				this.renderGauge('Network', 0, '',
					'RX: ' + API.formatBytes(network.rx_bytes || 0) + ' | TX: ' + API.formatBytes(network.tx_bytes || 0), 'network')
			])
		]);

		return section;
	},

	renderGauge: function(label, percent, unit, details, id) {
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
						'id': 'gauge-circle-' + id,
						'cx': '60', 'cy': '60', 'r': '54',
						'fill': 'none', 'stroke': color, 'stroke-width': '12',
						'stroke-dasharray': (339.292 * percent / 100) + ' 339.292',
						'stroke-linecap': 'round',
						'transform': 'rotate(-90 60 60)'
					}),
					E('text', {
						'id': 'gauge-text-' + id,
						'x': '60', 'y': '65', 'text-anchor': 'middle',
						'font-size': '24', 'font-weight': 'bold', 'fill': color
					}, Math.round(percent) + unit)
				])
			]),
			E('div', { 'class': 'secubox-gauge-details', 'id': 'gauge-details-' + id }, details || '')
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
			E('h3', {}, '⚡ Quick Actions'),
			E('div', { 'class': 'secubox-actions-grid' }, buttons)
		]);
	},

	executeQuickAction: function(action, label) {
		var self = this;
		ui.showModal(_('Quick Action'), [
			E('p', { 'class': 'spinning' }, _('Executing: ') + label + '...')
		]);

		API.quickAction(action).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', '✓ ' + (result.message || 'Action completed')), 'info');
				// Refresh data after action
				setTimeout(function() {
					self.refreshData().then(function() {
						self.updateDynamicElements();
					});
				}, 2000);
			} else {
				ui.addNotification(null, E('p', '✗ ' + (result.message || 'Action failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	renderAlerts: function(alerts) {
		var alertItems = alerts.slice(0, 5).map(function(alert) {
			var severityClass = 'secubox-alert-' + (alert.severity || 'info');
			return E('div', { 'class': 'secubox-alert ' + severityClass }, [
				E('strong', {}, (alert.module || 'System') + ': '),
				E('span', {}, alert.message || '')
			]);
		});

		return E('div', { 'class': 'secubox-alerts-section' }, [
			E('h3', {}, '⚠️ Recent Alerts (' + alerts.length + ')'),
			E('div', { 'class': 'secubox-alerts-list' }, alertItems),
			alerts.length > 5 ? E('a', {
				'href': L.url('admin/secubox/alerts'),
				'class': 'cbi-button cbi-button-link',
				'style': 'margin-top: 12px; display: inline-block;'
			}, 'View All Alerts →') : null
		]);
	},

	renderModulesGrid: function(modules) {
		// Map module IDs to their dashboard paths
		var modulePaths = {
			'crowdsec': 'admin/secubox/security/crowdsec',
			'netdata': 'admin/secubox/monitoring/netdata',
			'netifyd': 'admin/secubox/security/netifyd',
			'wireguard': 'admin/secubox/network/wireguard',
			'network_modes': 'admin/secubox/network/modes',
			'client_guardian': 'admin/secubox/security/guardian',
			'system_hub': 'admin/secubox/system/hub',
			'bandwidth_manager': 'admin/secubox/network/bandwidth',
			'auth_guardian': 'admin/secubox/security/auth',
			'media_flow': 'admin/secubox/network/media',
			'vhost_manager': 'admin/secubox/services/vhost',
			'traffic_shaper': 'admin/secubox/network/shaper',
			'cdn_cache': 'admin/secubox/services/cdn',
			'ksm_manager': 'admin/secubox/security/ksm'
		};

		var moduleCards = modules.map(function(module) {
			var statusClass = module.installed ? (module.running ? 'running' : 'stopped') : 'not-installed';
			var statusIcon = module.installed ? (module.running ? '✓' : '✗') : '○';
			var statusColor = module.installed ? (module.running ? '#22c55e' : '#ef4444') : '#64748b';
			var dashboardPath = modulePaths[module.id] || ('admin/secubox/' + module.id);

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
						'href': L.url(dashboardPath),
						'class': 'cbi-button cbi-button-link'
					}, 'Open Dashboard') : E('span', { 'class': 'secubox-not-installed' }, 'Not Installed')
				])
			]);
		});

		return E('div', { 'class': 'secubox-modules-section' }, [
			E('h3', {}, '🎯 Active Modules (' + modules.filter(function(m) { return m.installed; }).length + ')'),
			E('div', { 'class': 'secubox-modules-grid' }, moduleCards)
		]);
	},

	updateDynamicElements: function() {
		// Update stats
		var counts = this.dashboardData.counts || {};
		var alerts = this.alertsData.alerts || [];

		var totalEl = document.getElementById('stat-total');
		var installedEl = document.getElementById('stat-installed');
		var runningEl = document.getElementById('stat-running');
		var alertsEl = document.getElementById('stat-alerts');

		if (totalEl) totalEl.textContent = counts.total || 0;
		if (installedEl) installedEl.textContent = counts.installed || 0;
		if (runningEl) runningEl.textContent = counts.running || 0;
		if (alertsEl) alertsEl.textContent = alerts.length || 0;

		// Update health gauges
		var health = this.healthData;
		this.updateGauge('cpu', health.cpu);
		this.updateGauge('memory', health.memory);
		this.updateGauge('disk', health.disk);
	},

	updateGauge: function(id, data) {
		if (!data) return;

		var percent = data.percent || 0;
		var color = percent < 70 ? '#22c55e' : percent < 85 ? '#f59e0b' : '#ef4444';

		var circleEl = document.getElementById('gauge-circle-' + id);
		var textEl = document.getElementById('gauge-text-' + id);
		var detailsEl = document.getElementById('gauge-details-' + id);

		if (circleEl) {
			circleEl.setAttribute('stroke', color);
			circleEl.setAttribute('stroke-dasharray', (339.292 * percent / 100) + ' 339.292');
		}
		if (textEl) {
			textEl.setAttribute('fill', color);
			textEl.textContent = Math.round(percent) + (id === 'network' ? '' : '%');
		}
		if (detailsEl && id === 'cpu') {
			detailsEl.textContent = 'Load: ' + (data.load_1min || '0.00');
		} else if (detailsEl && id === 'memory') {
			detailsEl.textContent = API.formatBytes((data.used_kb || 0) * 1024) + ' / ' +
									API.formatBytes((data.total_kb || 0) * 1024);
		} else if (detailsEl && id === 'disk') {
			detailsEl.textContent = API.formatBytes((data.used_kb || 0) * 1024) + ' / ' +
									API.formatBytes((data.total_kb || 0) * 1024);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
