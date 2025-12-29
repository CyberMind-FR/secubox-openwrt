'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require secubox/nav as SecuNav';

// Load theme resources once
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/secubox-theme.css')
}));

var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

return view.extend({
	dashboardData: null,
	healthData: null,
	alertsData: null,
	modulesList: [],
	activeCategory: 'all',

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return Promise.all([
			API.getDashboardData(),
			API.getSystemHealth(),
			API.getAlerts(),
			API.getModules()
		]).then(function(data) {
			self.dashboardData = data[0] || {};
			self.healthData = data[1] || {};
			self.alertsData = data[2] || {};
			self.modulesList = (data[3] && data[3].modules) || [];
			return data;
		});
	},

	render: function() {
		var container = E('div', { 'class': 'secubox-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/dashboard.css') }),
			SecuNav.renderTabs('dashboard'),
			this.renderHeader(),
			this.renderStatsGrid(),
			this.renderMainLayout()
		]);

		var self = this;
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateDynamicSections();
			});
		}, 30);

		return container;
	},

	renderHeader: function() {
		var status = this.dashboardData.status || {};
		var counts = this.dashboardData.counts || {};
		var moduleStats = this.getModuleStats();
		var alertsCount = (this.alertsData.alerts || []).length;
		var healthScore = (this.healthData.overall && this.healthData.overall.score) || 0;

		var stats = [
			{ label: _('Modules'), value: counts.total || moduleStats.total || 0 },
			{ label: _('Running'), value: counts.running || moduleStats.running || 0 },
			{ label: _('Alerts'), value: alertsCount },
			{ label: _('Health'), value: healthScore + '/100' }
		];

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🚀'),
					_('SecuBox Control Center')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Security · Network · System automation'))
			]),
			E('div', { 'class': 'sh-stats-grid' }, stats.map(this.renderHeaderStat, this))
		]);
	},

	renderHeaderStat: function(stat) {
		return E('div', { 'class': 'sh-stat-badge' }, [
			E('div', { 'class': 'sh-stat-value' }, stat.value.toString()),
			E('div', { 'class': 'sh-stat-label' }, stat.label)
		]);
	},

	renderStatsGrid: function() {
		var moduleStats = this.getModuleStats();
		var counts = this.dashboardData.counts || {};
		var alertsCount = (this.alertsData.alerts || []).length;
		var healthScore = (this.healthData.overall && this.healthData.overall.score) || 0;

		var stats = [
			{ label: _('Total Modules'), value: counts.total || moduleStats.total, icon: '📦', id: 'sb-stat-total' },
			{ label: _('Installed'), value: counts.installed || moduleStats.installed, icon: '💾', id: 'sb-stat-installed' },
			{ label: _('Active Services'), value: counts.running || moduleStats.running, icon: '🟢', id: 'sb-stat-running' },
			{ label: _('System Health'), value: healthScore + '/100', icon: '❤️', id: 'sb-stat-health' },
			{ label: _('Alerts'), value: alertsCount, icon: '⚠️', id: 'sb-stat-alerts' }
		];

		return E('section', { 'class': 'sb-stats-grid' },
			stats.map(function(stat) {
				return E('div', { 'class': 'sb-stat-card' }, [
					E('div', { 'class': 'sb-stat-icon' }, stat.icon),
					E('div', { 'class': 'sb-stat-content' }, [
						E('div', { 'class': 'sb-stat-value', 'id': stat.id }, stat.value),
						E('div', { 'class': 'sb-stat-label' }, stat.label)
					])
				]);
			})
		);
	},

	renderMainLayout: function() {
		return E('div', { 'class': 'sb-main-grid' }, [
			E('div', { 'class': 'sb-grid-left' }, [
				this.renderModulesSection(),
				this.renderSystemHealthPanel()
			]),
			E('div', { 'class': 'sb-grid-right' }, [
				this.renderQuickActions(),
				this.renderAlertsTimeline()
			])
		]);
	},

	renderModulesSection: function() {
		var self = this;
		var filters = [
			{ id: 'all', label: _('All Modules') },
			{ id: 'security', label: _('Security') },
			{ id: 'network', label: _('Network') },
			{ id: 'services', label: _('Services') },
			{ id: 'system', label: _('System') }
		];

		return E('section', { 'class': 'sb-card' }, [
			E('div', { 'class': 'sb-card-header' }, [
				E('div', {}, [
					E('h2', {}, _('Module Overview')),
					E('p', { 'class': 'sb-card-subtitle' }, _('Monitor, configure, and access every SecuBox module'))
				]),
				E('div', { 'class': 'cyber-tablist cyber-tablist--pills sb-module-tabs' }, filters.map(function(filter) {
					return E('button', {
						'class': 'cyber-tab cyber-tab--pill' + (self.activeCategory === filter.id ? ' is-active' : ''),
						'type': 'button',
						'data-category': filter.id,
						'click': function() {
							self.activeCategory = filter.id;
							self.updateModuleGrid();
							self.syncModuleFilterTabs();
						}
					}, [
						E('span', { 'class': 'cyber-tab-label' }, filter.label)
					]);
				}))
			]),
			E('div', { 'class': 'sb-module-grid', 'id': 'sb-module-grid' },
				this.getFilteredModules().map(this.renderModuleCard, this))
		]);
	},

	getFilteredModules: function() {
		var modules = (this.modulesList && this.modulesList.length)
			? this.modulesList
			: (this.dashboardData.modules || []);
		if (this.activeCategory === 'all')
			return modules;
		return modules.filter(function(module) {
			return (module.category || '').toLowerCase() === this.activeCategory;
		}, this);
	},

	getModuleVersion: function(module) {
		if (!module)
			return '—';

		var candidates = [
			module.version,
			module.pkg_version,
			module.package_version,
			module.packageVersion,
			module.Version
		];

		for (var i = 0; i < candidates.length; i++) {
			var value = candidates[i];
			if (typeof value === 'number')
				return String(value);
			if (typeof value === 'string' && value.trim())
				return value.trim();
		}

		return '—';
	},

	renderModuleCard: function(module) {
		var status = module.status || 'unknown';
		var statusLabel = status === 'active' ? _('Running') :
			status === 'error' ? _('Error') :
			status === 'disabled' ? _('Disabled') : _('Unknown');

		return E('div', { 'class': 'sb-module-card sb-status-' + status }, [
			E('div', { 'class': 'sb-module-header' }, [
				E('div', { 'class': 'sb-module-icon' }, module.icon || '📦'),
				E('div', {}, [
					E('h3', {}, module.name || module.id),
					E('p', {}, module.description || '')
				]),
				E('span', { 'class': 'sb-status-pill' }, statusLabel)
			]),
				E('div', { 'class': 'sb-module-meta' }, [
					E('span', {}, _('Version: ') + this.getModuleVersion(module)),
				E('span', {}, _('Category: ') + (module.category || 'other'))
			]),
			E('div', { 'class': 'sb-module-actions' }, [
				E('button', {
					'class': 'sb-btn sb-btn-ghost',
					'type': 'button',
					'click': function() {
						window.location.href = L.url('admin/secubox/modules');
					}
				}, _('View Details')),
				E('button', {
					'class': 'sb-btn sb-btn-primary',
					'type': 'button',
					'click': function() {
						if (module.route) {
							window.location.href = L.url(module.route);
						}
					}
				}, _('Configure'))
			])
		]);
	},

	renderSystemHealthPanel: function() {
		var self = this;
		var health = this.healthData || {};
		var cpu = health.cpu || {};
		var memory = health.memory || {};
		var disk = health.disk || {};
		var network = health.network || {};

		var metrics = [
			{
				id: 'cpu',
				label: _('CPU Usage'),
				value: cpu.percent || 0,
				detail: _('Load: ') + (cpu.load_1min || '0.00'),
				icon: '🔥'
			},
			{
				id: 'memory',
				label: _('Memory'),
				value: memory.percent || 0,
				detail: API.formatBytes((memory.used_kb || 0) * 1024) + ' / ' +
					API.formatBytes((memory.total_kb || 0) * 1024),
				icon: '💾'
			},
			{
				id: 'disk',
				label: _('Storage'),
				value: disk.percent || 0,
				detail: API.formatBytes((disk.used_kb || 0) * 1024) + ' / ' +
					API.formatBytes((disk.total_kb || 0) * 1024),
				icon: '💿'
			},
			{
				id: 'network',
				label: _('Network'),
				value: network.wan_up ? 100 : 0,
				detail: network.wan_up ? _('WAN online') : _('WAN offline'),
				icon: '🌐'
			}
		];

		return E('section', { 'class': 'sb-card' }, [
			E('div', { 'class': 'sb-card-header' }, [
				E('h2', {}, _('System Health Dashboard')),
				E('p', { 'class': 'sb-card-subtitle' }, _('Real-time telemetry for CPU, RAM, Disk, Network'))
			]),
			E('div', { 'class': 'sb-health-grid' },
				metrics.map(function(metric) {
					return self.renderHealthMetric(metric);
				}))
		]);
	},

	renderHealthMetric: function(metric) {
		var percent = Math.min(100, Math.max(0, Math.round(metric.value)));
		var severity = percent < 70 ? 'ok' : percent < 90 ? 'warn' : 'danger';

		return E('div', { 'class': 'sb-health-metric' }, [
			E('div', { 'class': 'sb-health-icon' }, metric.icon),
			E('div', { 'class': 'sb-health-info' }, [
				E('div', { 'class': 'sb-health-label' }, metric.label),
				E('div', { 'class': 'sb-health-detail', 'id': 'sb-health-detail-' + metric.id }, metric.detail)
			]),
			E('div', { 'class': 'sb-health-bar' }, [
				E('div', {
					'class': 'sb-health-progress sb-' + severity,
					'id': 'sb-health-bar-' + metric.id,
					'style': 'width:' + percent + '%'
				})
			]),
			E('span', { 'class': 'sb-health-percent', 'id': 'sb-health-percent-' + metric.id }, percent + '%')
		]);
	},

	renderQuickActions: function() {
		var self = this;
		var actions = [
			{ id: 'restart_services', label: _('Restart All Services'), icon: '🔄', variant: 'orange' },
			{ id: 'update_packages', label: _('Update Packages'), icon: '⬆️', variant: 'blue' },
			{ id: 'view_logs', label: _('View System Logs'), icon: '📜', variant: 'indigo' },
			{ id: 'export_config', label: _('Export Configuration'), icon: '📦', variant: 'green' }
		];

		return E('section', { 'class': 'sb-card' }, [
			E('div', { 'class': 'sb-card-header' }, [
				E('h2', {}, _('Quick Actions')),
				E('p', { 'class': 'sb-card-subtitle' }, _('Frequently performed maintenance tasks'))
			]),
			E('div', { 'class': 'sb-actions-grid' },
				actions.map(function(action) {
					return E('button', {
						'class': 'sb-action-btn sb-' + action.variant,
						'type': 'button',
						'click': function() {
							self.runQuickAction(action.id);
						}
					}, [
						E('span', { 'class': 'sb-action-icon' }, action.icon),
						E('span', { 'class': 'sb-action-label' }, action.label)
					]);
				}))
		]);
	},

	runQuickAction: function(actionId) {
		ui.showModal(_('Executing action...'), [
			E('p', { 'class': 'spinning' }, _('Running ') + actionId + ' ...')
		]);

		return API.quickAction(actionId).then(function(result) {
			ui.hideModal();
			if (result && result.success === false) {
				ui.addNotification(null, E('p', {}, result.message || _('Action failed')), 'error');
			} else {
				ui.addNotification(null, E('p', {}, _('Action completed successfully')), 'info');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	renderAlertsTimeline: function() {
		var alerts = (this.alertsData.alerts || []).slice(0, 10);

		return E('section', { 'class': 'sb-card' }, [
			E('div', { 'class': 'sb-card-header' }, [
				E('h2', {}, _('Alert Timeline')),
				E('p', { 'class': 'sb-card-subtitle' }, _('Latest security and system events'))
			]),
			alerts.length === 0 ?
				E('div', { 'class': 'sb-empty-state' }, [
					E('div', { 'class': 'sb-empty-icon' }, '🎉'),
					E('p', {}, _('No alerts in the last 24 hours'))
				]) :
				E('div', { 'class': 'sb-alert-list', 'id': 'sb-alert-list' },
					alerts.map(this.renderAlertItem, this))
		]);
	},

	renderAlertItem: function(alert) {
		var severity = (alert.severity || 'info').toLowerCase();
		var timestamp = alert.timestamp || alert.time || '';

		return E('div', { 'class': 'sb-alert-item sb-' + severity }, [
			E('div', { 'class': 'sb-alert-time' }, timestamp),
			E('div', { 'class': 'sb-alert-details' }, [
				E('strong', {}, alert.title || alert.message || _('Alert')),
				alert.description ? E('p', {}, alert.description) : '',
				alert.source ? E('span', { 'class': 'sb-alert-meta' }, alert.source) : ''
			])
		]);
	},

	getSystemVersion: function() {
		if (this.dashboardData && this.dashboardData.status && this.dashboardData.status.version)
			return this.dashboardData.status.version;
		if (this.dashboardData && this.dashboardData.release)
			return this.dashboardData.release;
		return '0.0.0';
	},

	getSystemUptime: function() {
		if (this.dashboardData && this.dashboardData.status && this.dashboardData.status.uptime)
			return this.dashboardData.status.uptime;
		if (this.healthData && typeof this.healthData.uptime === 'number')
			return this.healthData.uptime;
		return 0;
	},

	getModuleStats: function() {
		var modules = (this.modulesList && this.modulesList.length)
			? this.modulesList
			: (this.dashboardData.modules || []);

		var installed = modules.filter(function(mod) {
			return mod.installed || mod.in_uci === 1 || mod.enabled === 1 || mod.status === 'active';
		}).length;

		var running = modules.filter(function(mod) {
			return mod.running || mod.status === 'active';
		}).length;

		return {
			list: modules,
			total: modules.length,
			installed: installed,
			running: running
		};
	},

	updateDynamicSections: function() {
		this.updateStats();
		this.updateModuleGrid();
		this.updateHealthMetrics();
		this.updateAlerts();
	},

	updateStats: function() {
		var moduleStats = this.getModuleStats();
		var counts = this.dashboardData.counts || {};
		var alertsCount = (this.alertsData.alerts || []).length;
		var healthScore = (this.healthData.overall && this.healthData.overall.score) || 0;

		var stats = {
			'sb-stat-total': counts.total || moduleStats.total,
			'sb-stat-installed': counts.installed || moduleStats.installed,
			'sb-stat-running': counts.running || moduleStats.running,
			'sb-stat-health': healthScore + '/100',
			'sb-stat-alerts': alertsCount
		};

		Object.keys(stats).forEach(function(id) {
			var node = document.getElementById(id);
			if (node) node.textContent = stats[id];
		});
	},

	updateModuleGrid: function() {
		var grid = document.getElementById('sb-module-grid');
		if (!grid) return;
		dom.content(grid, this.getFilteredModules().map(this.renderModuleCard, this));
		this.syncModuleFilterTabs();
	},

	syncModuleFilterTabs: function() {
		var tabs = document.querySelectorAll('.sb-module-tabs .cyber-tab');
		tabs.forEach(function(tab) {
			var match = tab.getAttribute('data-category') === this.activeCategory;
			tab.classList.toggle('is-active', match);
		}, this);
	},

	updateHealthMetrics: function() {
		var health = this.healthData || {};
		var cpu = health.cpu || {};
		var memory = health.memory || {};
		var disk = health.disk || {};
		var network = health.network || {};

		var map = {
			cpu: { value: cpu.percent || 0, detail: _('Load: ') + (cpu.load_1min || '0.00') },
			memory: {
				value: memory.percent || 0,
				detail: API.formatBytes((memory.used_kb || 0) * 1024) + ' / ' +
					API.formatBytes((memory.total_kb || 0) * 1024)
			},
			disk: {
				value: disk.percent || 0,
				detail: API.formatBytes((disk.used_kb || 0) * 1024) + ' / ' +
					API.formatBytes((disk.total_kb || 0) * 1024)
			},
			network: { value: network.wan_up ? 100 : 0, detail: network.wan_up ? _('WAN online') : _('WAN offline') }
		};

		Object.keys(map).forEach(function(key) {
			var percent = Math.min(100, Math.max(0, Math.round(map[key].value)));
			var severity = percent < 70 ? 'ok' : percent < 90 ? 'warn' : 'danger';

			var bar = document.getElementById('sb-health-bar-' + key);
			var pct = document.getElementById('sb-health-percent-' + key);
			var detail = document.getElementById('sb-health-detail-' + key);

			if (bar) {
				bar.style.width = percent + '%';
				bar.className = 'sb-health-progress sb-' + severity;
			}
			if (pct) pct.textContent = percent + '%';
			if (detail) detail.textContent = map[key].detail;
		});
	},

	updateAlerts: function() {
		var list = document.getElementById('sb-alert-list');
		if (!list) return;
		var alerts = (this.alertsData.alerts || []).slice(0, 10);
		dom.content(list, alerts.map(this.renderAlertItem, this));
	}
});
