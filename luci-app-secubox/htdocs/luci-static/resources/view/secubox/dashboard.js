'use strict';
'require view';
'require ui';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require dom';
'require poll';

// Load global theme CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/secubox-theme.css')
}));

// Initialize global theme
Theme.init({ theme: 'dark', language: 'en' });

return view.extend({
	dashboardData: null,
	healthData: null,
	alertsData: null,
	activeFilter: 'all',

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
					E('h2', {}, '🚀 SecuBox Control Center'),
					E('p', { 'class': 'secubox-subtitle' }, 'Security & Network Management Suite')
				]),
				E('div', { 'class': 'secubox-header-info' }, [
					E('span', { 'class': 'secubox-badge secubox-badge-version' },
						'v' + (status.version || '0.1.0')),
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
				this.renderCircularGauge('CPU', cpu.percent || 0,
					'Load: ' + (cpu.load_1min || '0.00'), 'cpu', '#6366f1'),
				this.renderCircularGauge('Memory', memory.percent || 0,
					API.formatBytes((memory.used_kb || 0) * 1024) + ' / ' +
					API.formatBytes((memory.total_kb || 0) * 1024), 'memory', '#22c55e'),
				this.renderCircularGauge('Disk', disk.percent || 0,
					API.formatBytes((disk.used_kb || 0) * 1024) + ' / ' +
					API.formatBytes((disk.total_kb || 0) * 1024), 'disk', '#f59e0b')
			])
		]);
	},

	renderCircularGauge: function(label, percent, details, id, baseColor) {
		var color = percent < 70 ? '#22c55e' : percent < 85 ? '#f59e0b' : '#ef4444';
		var radius = 45;
		var circumference = 2 * Math.PI * radius;
		var offset = circumference - (percent / 100) * circumference;

		return E('div', { 'class': 'secubox-gauge-container' }, [
			E('div', { 'class': 'secubox-gauge' }, [
				E('svg', { 'viewBox': '0 0 120 120', 'class': 'secubox-gauge-svg' }, [
					// Background circle
					E('circle', {
						'cx': '60',
						'cy': '60',
						'r': radius,
						'fill': 'none',
						'stroke': '#f1f5f9',
						'stroke-width': '10'
					}),
					// Progress circle
					E('circle', {
						'id': 'gauge-' + id,
						'cx': '60',
						'cy': '60',
						'r': radius,
						'fill': 'none',
						'stroke': color,
						'stroke-width': '10',
						'stroke-linecap': 'round',
						'stroke-dasharray': circumference,
						'stroke-dashoffset': offset,
						'transform': 'rotate(-90 60 60)',
						'class': 'secubox-gauge-progress'
					})
				]),
				E('div', { 'class': 'secubox-gauge-content' }, [
					E('div', {
						'class': 'secubox-gauge-percent',
						'id': 'gauge-' + id + '-percent',
						'style': 'color: ' + color
					}, Math.round(percent) + '%'),
					E('div', { 'class': 'secubox-gauge-label' }, label)
				])
			]),
			E('div', {
				'class': 'secubox-gauge-details',
				'id': 'gauge-' + id + '-details'
			}, details)
		]);
	},

	renderActiveModules: function() {
		var self = this;
		var modules = this.dashboardData.modules || [];
		var activeModules = modules.filter(function(m) { return m.installed; });

		// Apply category filter
		var filteredModules = this.activeFilter === 'all' ? activeModules :
			activeModules.filter(function(m) {
				return m.category === self.activeFilter;
			});

		// Map module IDs to their dashboard paths
		var modulePaths = {
			'crowdsec': 'admin/secubox/crowdsec/overview',
			'netdata': 'admin/secubox/netdata/dashboard',
			'netifyd': 'admin/secubox/netifyd/overview',
			'wireguard': 'admin/secubox/wireguard/overview',
			'network_modes': 'admin/secubox/network-modes/overview',
			'client_guardian': 'admin/secubox/client-guardian/overview',
			'system_hub': 'admin/secubox/system-hub/overview',
			'bandwidth_manager': 'admin/secubox/bandwidth-manager/overview',
			'auth_guardian': 'admin/secubox/auth-guardian/overview',
			'media_flow': 'admin/secubox/mediaflow/dashboard',
			'vhost_manager': 'admin/secubox/vhosts/overview',
			'traffic_shaper': 'admin/secubox/traffic-shaper/overview',
			'cdn_cache': 'admin/secubox/cdn-cache/overview',
			'ksm_manager': 'admin/secubox/ksm-manager/overview'
		};

		var moduleCards = filteredModules.map(function(module) {
			var status = module.status || 'unknown';
			var statusClass = status;
			var dashboardPath = modulePaths[module.id] || ('admin/secubox/' + module.id);

			// Status label mapping (v0.3.1)
			var statusLabels = {
				'active': '✓ Activé',
				'disabled': '○ Désactivé',
				'error': '⚠️ Erreur',
				'unknown': '? Inconnu'
			};

			var statusLabel = statusLabels[status] || '○ Désactivé';

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
							'title': statusLabel
						})
					]),
					E('div', { 'class': 'secubox-module-mini-body' }, [
						E('div', { 'class': 'secubox-module-mini-name' }, module.name || module.id),
						E('div', { 'class': 'secubox-module-mini-status' }, statusLabel)
					])
				])
			]);
		});

		// Filter tabs
		var filters = [
			{ id: 'all', label: 'All', icon: '📦' },
			{ id: 'security', label: 'Security', icon: '🛡️' },
			{ id: 'network', label: 'Network', icon: '🌐' },
			{ id: 'system', label: 'System', icon: '⚙️' },
			{ id: 'monitoring', label: 'Monitoring', icon: '📊' }
		];

		var filterTabButtons = filters.map(function(filter) {
			var isActive = self.activeFilter === filter.id;
			return E('div', {
				'class': 'secubox-filter-tab' + (isActive ? ' active' : ''),
				'click': function() {
					self.activeFilter = filter.id;
					self.updateModulesGrid();
				}
			}, [
				E('span', { 'class': 'secubox-tab-icon' }, filter.icon),
				E('span', { 'class': 'secubox-tab-label' }, filter.label)
			]);
		});

		filterTabButtons.push(
			E('div', {
				'class': 'secubox-filter-tab secubox-tab-bonus',
				'click': function() {
					window.location.href = L.url('admin/secubox/help');
				}
			}, [
				E('span', { 'class': 'secubox-tab-icon' }, '✨'),
				E('span', { 'class': 'secubox-tab-label' }, _('Bonus · Help à SecuBox'))
			])
		);

		var filterTabs = E('div', { 'class': 'secubox-filter-tabs' }, filterTabButtons);

		return E('div', { 'class': 'secubox-card' }, [
			E('h3', { 'class': 'secubox-card-title' }, '🎯 Active Modules (' + activeModules.length + ')'),
			filterTabs,
			E('div', {
				'class': 'secubox-modules-mini-grid',
				'id': 'modules-grid'
			},
				moduleCards.length > 0 ? moduleCards : [
					E('p', { 'class': 'secubox-empty-state' },
						this.activeFilter === 'all' ? 'No modules installed' :
						'No ' + this.activeFilter + ' modules installed')
				]
			)
		]);
	},

	updateModulesGrid: function() {
		var container = document.getElementById('modules-grid');
		if (!container) return;

		var modules = this.dashboardData.modules || [];
		var activeModules = modules.filter(function(m) { return m.installed; });
		var self = this;

		// Filter definitions (same as in renderActiveModules)
		var filters = [
			{ id: 'all', label: 'All', icon: '📦' },
			{ id: 'security', label: 'Security', icon: '🛡️' },
			{ id: 'network', label: 'Network', icon: '🌐' },
			{ id: 'system', label: 'System', icon: '⚙️' },
			{ id: 'monitoring', label: 'Monitoring', icon: '📊' }
		];

		// Apply category filter
		var filteredModules = this.activeFilter === 'all' ? activeModules :
			activeModules.filter(function(m) {
				return m.category === self.activeFilter;
			});

		// Map module IDs to their dashboard paths
		var modulePaths = {
			'crowdsec': 'admin/secubox/crowdsec/overview',
			'netdata': 'admin/secubox/netdata/dashboard',
			'netifyd': 'admin/secubox/netifyd/overview',
			'wireguard': 'admin/secubox/wireguard/overview',
			'network_modes': 'admin/secubox/network-modes/overview',
			'client_guardian': 'admin/secubox/client-guardian/overview',
			'system_hub': 'admin/secubox/system-hub/overview',
			'bandwidth_manager': 'admin/secubox/bandwidth-manager/overview',
			'auth_guardian': 'admin/secubox/auth-guardian/overview',
			'media_flow': 'admin/secubox/mediaflow/dashboard',
			'vhost_manager': 'admin/secubox/vhosts/overview',
			'traffic_shaper': 'admin/secubox/traffic-shaper/overview',
			'cdn_cache': 'admin/secubox/cdn-cache/overview',
			'ksm_manager': 'admin/secubox/ksm-manager/overview'
		};

		var moduleCards = filteredModules.map(function(module) {
			var status = module.status || 'unknown';
			var statusClass = status;
			var dashboardPath = modulePaths[module.id] || ('admin/secubox/' + module.id);

			// Status label mapping (v0.3.1)
			var statusLabels = {
				'active': '✓ Activé',
				'disabled': '○ Désactivé',
				'error': '⚠️ Erreur',
				'unknown': '? Inconnu'
			};

			var statusLabel = statusLabels[status] || '○ Désactivé';

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
							'title': statusLabel
						})
					]),
					E('div', { 'class': 'secubox-module-mini-body' }, [
						E('div', { 'class': 'secubox-module-mini-name' }, module.name || module.id),
						E('div', { 'class': 'secubox-module-mini-status' }, statusLabel)
					])
				])
			]);
		});

		// Update filter tab active states
		var tabs = container.parentElement.querySelectorAll('.secubox-filter-tab');
		tabs.forEach(function(tab) {
			var filterMatch = false;
			filters.forEach(function(filter) {
				if (tab.textContent.includes(filter.label) && self.activeFilter === filter.id) {
					filterMatch = true;
				}
			});
			if (filterMatch) {
				tab.classList.add('active');
			} else {
				tab.classList.remove('active');
			}
		});

		// Update content
		dom.content(container, moduleCards.length > 0 ? moduleCards : [
			E('p', { 'class': 'secubox-empty-state' },
				this.activeFilter === 'all' ? 'No modules installed' :
				'No ' + this.activeFilter + ' modules installed')
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

		// Add Fix Permissions button (v0.3.1)
		buttons.push(
			E('button', {
				'class': 'secubox-action-btn',
				'style': 'border-color: #f97316',
				'click': function() {
					self.executeFixPermissions();
				}
			}, [
				E('span', { 'class': 'secubox-action-icon' }, '🔧'),
				E('span', { 'class': 'secubox-action-label' }, 'Fix Perms')
			])
		);

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

	executeFixPermissions: function() {
		var self = this;
		ui.showModal(_('Fixing Permissions'), [
			E('p', { 'class': 'spinning' }, _('Fixing file permissions and restarting services...'))
		]);

		API.fixPermissions().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', '✓ Permissions fixed successfully'), 'info');
				// Show output in console
				if (result.output) {
					console.log('Fix Permissions Output:\n' + result.output);
				}
				// Refresh data after fixing permissions
				setTimeout(function() {
					self.refreshData().then(function() {
						self.updateDynamicElements();
					});
				}, 2000);
			} else {
				ui.addNotification(null, E('p', '✗ ' + (result.message || 'Failed to fix permissions')), 'error');
				if (result.output) {
					console.error('Fix Permissions Error:\n' + result.output);
				}
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

		var percentEl = document.getElementById('gauge-' + type + '-percent');
		var gaugeEl = document.getElementById('gauge-' + type);

		if (percentEl) {
			percentEl.textContent = Math.round(percent) + '%';
			percentEl.style.color = color;
		}
		if (gaugeEl) {
			var radius = 45;
			var circumference = 2 * Math.PI * radius;
			var offset = circumference - (percent / 100) * circumference;
			gaugeEl.setAttribute('stroke-dashoffset', offset);
			gaugeEl.setAttribute('stroke', color);
		}

		// Update details
		var detailsEl = document.getElementById('gauge-' + type + '-details');
		if (detailsEl && type === 'cpu') {
			detailsEl.textContent = 'Load: ' + (data.load_1min || '0.00');
		} else if (detailsEl && type === 'memory') {
			detailsEl.textContent = API.formatBytes((data.used_kb || 0) * 1024) + ' / ' +
									API.formatBytes((data.total_kb || 0) * 1024);
		} else if (detailsEl && type === 'disk') {
			detailsEl.textContent = API.formatBytes((data.used_kb || 0) * 1024) + ' / ' +
									API.formatBytes((data.total_kb || 0) * 1024);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
