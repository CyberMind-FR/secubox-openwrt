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
	'href': L.resource('secubox/dashboard.css')
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
		var container = E('div', { 'class': 'secubox-dashboard' });

		// Header with version
		var status = this.dashboardData.status || {};
		container.appendChild(this.renderHeader(status));

		// Stats Overview Cards
		container.appendChild(this.renderStatsOverview());

		// Main Content Grid
		var mainGrid = E('div', { 'class': 'secubox-main-grid' }, [
			// Left column
			E('div', { 'class': 'secubox-column-left' }, [
				this.renderSystemHealth(this.healthData),
				this.renderAlerts(this.alertsData.alerts || [])
			]),
			// Right column
			E('div', { 'class': 'secubox-column-right' }, [
				this.renderActiveModules(),
				this.renderQuickActions()
			])
		]);

		container.appendChild(mainGrid);

		// Start auto-refresh poll
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateDynamicElements();
			});
		}, 30); // Refresh every 30 seconds

		return container;
	},

	renderHeader: function(status) {
		return E('div', { 'class': 'secubox-header' }, [
			E('div', { 'class': 'secubox-header-content' }, [
				E('div', {}, [
					E('h2', {}, '🛡️ SecuBox Central Hub'),
					E('p', { 'class': 'secubox-subtitle' }, 'Security & Network Management Suite')
				]),
				E('div', { 'class': 'secubox-header-info' }, [
					E('span', { 'class': 'secubox-badge secubox-badge-version' },
						'v' + (status.version || '0.0.1-beta')),
					E('span', { 'class': 'secubox-badge' },
						'⏱️ ' + API.formatUptime(status.uptime)),
					E('span', { 'class': 'secubox-badge', 'id': 'secubox-hostname' },
						'🖥️ ' + (status.hostname || 'SecuBox'))
				])
			])
		]);
	},

	renderStatsOverview: function() {
		var modules = this.dashboardData.modules || [];
		var counts = this.dashboardData.counts || {};

		var stats = [
			{
				label: 'Total Modules',
				value: counts.total || modules.length,
				icon: '📦',
				color: '#6366f1',
				id: 'stat-total'
			},
			{
				label: 'Installed',
				value: counts.installed || 0,
				icon: '✓',
				color: '#22c55e',
				id: 'stat-installed'
			},
			{
				label: 'Running',
				value: counts.running || 0,
				icon: '▶',
				color: '#00ab44',
				id: 'stat-running'
			},
			{
				label: 'Alerts',
				value: (this.alertsData.alerts || []).length,
				icon: '⚠️',
				color: '#f59e0b',
				id: 'stat-alerts'
			}
		];

		return E('div', { 'class': 'secubox-stats-grid' },
			stats.map(function(stat) {
				return E('div', {
					'class': 'secubox-stat-card',
					'style': 'border-top: 3px solid ' + stat.color
				}, [
					E('div', { 'class': 'secubox-stat-icon' }, stat.icon),
					E('div', { 'class': 'secubox-stat-content' }, [
						E('div', {
							'class': 'secubox-stat-value',
							'id': stat.id,
							'style': 'color: ' + stat.color
						}, stat.value),
						E('div', { 'class': 'secubox-stat-label' }, stat.label)
					])
				]);
			})
		);
	},

	renderSystemHealth: function(health) {
		var cpu = health.cpu || {};
		var memory = health.memory || {};
		var disk = health.disk || {};

		return E('div', { 'class': 'secubox-card' }, [
			E('h3', { 'class': 'secubox-card-title' }, '📊 System Health'),
			E('div', { 'class': 'secubox-health-grid' }, [
				this.renderProgressBar('CPU', cpu.percent || 0, cpu.load_1min || '0.00', 'cpu'),
				this.renderProgressBar('Memory', memory.percent || 0,
					API.formatBytes((memory.used_kb || 0) * 1024) + ' / ' +
					API.formatBytes((memory.total_kb || 0) * 1024), 'memory'),
				this.renderProgressBar('Disk', disk.percent || 0,
					API.formatBytes((disk.used_kb || 0) * 1024) + ' / ' +
					API.formatBytes((disk.total_kb || 0) * 1024), 'disk')
			])
		]);
	},

	renderProgressBar: function(label, percent, details, id) {
		var color = percent < 70 ? '#22c55e' : percent < 85 ? '#f59e0b' : '#ef4444';

		return E('div', { 'class': 'secubox-progress-item' }, [
			E('div', { 'class': 'secubox-progress-header' }, [
				E('span', { 'class': 'secubox-progress-label' }, label),
				E('span', {
					'class': 'secubox-progress-value',
					'id': 'health-' + id + '-percent',
					'style': 'color: ' + color
				}, percent + '%')
			]),
			E('div', { 'class': 'secubox-progress-bar' }, [
				E('div', {
					'class': 'secubox-progress-fill',
					'id': 'health-' + id + '-bar',
					'style': 'width: ' + percent + '%; background: ' + color
				})
			]),
			E('div', {
				'class': 'secubox-progress-details',
				'id': 'health-' + id + '-details'
			}, details)
		]);
	},

	renderActiveModules: function() {
		var modules = this.dashboardData.modules || [];
		var activeModules = modules.filter(function(m) { return m.installed; });

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
			'vhost_manager': 'admin/secubox/system/vhost',
			'traffic_shaper': 'admin/secubox/network/shaper',
			'cdn_cache': 'admin/secubox/network/cdn',
			'ksm_manager': 'admin/secubox/security/ksm'
		};

		var moduleCards = activeModules.map(function(module) {
			var isRunning = module.running;
			var statusClass = isRunning ? 'running' : 'stopped';
			var dashboardPath = modulePaths[module.id] || ('admin/secubox/' + module.id);

			return E('a', {
				'href': L.url(dashboardPath),
				'class': 'secubox-module-link secubox-module-' + statusClass
			}, [
				E('div', {
					'class': 'secubox-module-mini-card',
					'style': 'border-left: 4px solid ' + (module.color || '#64748b')
				}, [
					E('div', { 'class': 'secubox-module-mini-header' }, [
						E('span', { 'class': 'secubox-module-mini-icon' }, module.icon || '📦'),
						E('span', {
							'class': 'secubox-status-dot secubox-status-' + statusClass,
							'title': isRunning ? 'Running' : 'Stopped'
						})
					]),
					E('div', { 'class': 'secubox-module-mini-body' }, [
						E('div', { 'class': 'secubox-module-mini-name' }, module.name || module.id),
						E('div', { 'class': 'secubox-module-mini-status' },
							isRunning ? '● Running' : '○ Stopped')
					])
				])
			]);
		});

		return E('div', { 'class': 'secubox-card' }, [
			E('h3', { 'class': 'secubox-card-title' }, '🎯 Active Modules (' + activeModules.length + ')'),
			E('div', { 'class': 'secubox-modules-mini-grid' },
				moduleCards.length > 0 ? moduleCards : [
					E('p', { 'class': 'secubox-empty-state' }, 'No modules installed')
				]
			)
		]);
	},

	renderQuickActions: function() {
		var self = this;
		var actions = [
			{ name: 'restart_rpcd', label: 'RPCD', icon: '🔄', color: '#6366f1' },
			{ name: 'restart_uhttpd', label: 'Web Server', icon: '🌐', color: '#00ab44' },
			{ name: 'restart_network', label: 'Network', icon: '📡', color: '#06b6d4' },
			{ name: 'restart_firewall', label: 'Firewall', icon: '🛡️', color: '#ef4444' },
			{ name: 'clear_cache', label: 'Clear Cache', icon: '🧹', color: '#f59e0b' },
			{ name: 'backup_config', label: 'Backup', icon: '💾', color: '#8b5cf6' }
		];

		var buttons = actions.map(function(action) {
			return E('button', {
				'class': 'secubox-action-btn',
				'style': 'border-color: ' + action.color,
				'click': function() {
					self.executeQuickAction(action.name, action.label);
				}
			}, [
				E('span', { 'class': 'secubox-action-icon' }, action.icon),
				E('span', { 'class': 'secubox-action-label' }, action.label)
			]);
		});

		return E('div', { 'class': 'secubox-card' }, [
			E('h3', { 'class': 'secubox-card-title' }, '⚡ Quick Actions'),
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
		if (!alerts || alerts.length === 0) {
			return E('div', { 'class': 'secubox-card' }, [
				E('h3', { 'class': 'secubox-card-title' }, '✓ System Status'),
				E('div', { 'class': 'secubox-alert secubox-alert-success' }, [
					E('span', {}, '✓ All systems operational')
				])
			]);
		}

		var alertItems = alerts.slice(0, 5).map(function(alert) {
			var severityClass = 'secubox-alert-' + (alert.severity || 'info');
			var severityIcon = alert.severity === 'error' ? '✗' :
							   alert.severity === 'warning' ? '⚠️' : 'ℹ️';
			return E('div', { 'class': 'secubox-alert ' + severityClass }, [
				E('span', { 'class': 'secubox-alert-icon' }, severityIcon),
				E('div', { 'class': 'secubox-alert-content' }, [
					E('strong', {}, alert.module || 'System'),
					E('span', {}, ': ' + alert.message)
				])
			]);
		});

		return E('div', { 'class': 'secubox-card' }, [
			E('h3', { 'class': 'secubox-card-title' },
				'⚠️ Alerts (' + alerts.length + ')'),
			E('div', { 'class': 'secubox-alerts-list' }, alertItems),
			alerts.length > 5 ? E('a', {
				'href': '#',
				'class': 'secubox-view-all',
				'click': function(ev) {
					ev.preventDefault();
					window.location.hash = '#admin/secubox/alerts';
				}
			}, 'View all alerts →') : null
		]);
	},

	updateDynamicElements: function() {
		// Update stats
		var counts = this.dashboardData.counts || {};
		var totalEl = document.getElementById('stat-total');
		var installedEl = document.getElementById('stat-installed');
		var runningEl = document.getElementById('stat-running');
		var alertsEl = document.getElementById('stat-alerts');

		if (totalEl) totalEl.textContent = counts.total || 0;
		if (installedEl) installedEl.textContent = counts.installed || 0;
		if (runningEl) runningEl.textContent = counts.running || 0;
		if (alertsEl) alertsEl.textContent = (this.alertsData.alerts || []).length;

		// Update health bars
		var health = this.healthData;
		this.updateHealthBar('cpu', health.cpu);
		this.updateHealthBar('memory', health.memory);
		this.updateHealthBar('disk', health.disk);
	},

	updateHealthBar: function(type, data) {
		if (!data) return;

		var percent = data.percent || 0;
		var color = percent < 70 ? '#22c55e' : percent < 85 ? '#f59e0b' : '#ef4444';

		var percentEl = document.getElementById('health-' + type + '-percent');
		var barEl = document.getElementById('health-' + type + '-bar');

		if (percentEl) {
			percentEl.textContent = percent + '%';
			percentEl.style.color = color;
		}
		if (barEl) {
			barEl.style.width = percent + '%';
			barEl.style.background = color;
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
