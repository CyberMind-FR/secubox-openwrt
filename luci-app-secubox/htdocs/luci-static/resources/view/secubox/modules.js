'use strict';
'require view';
'require ui';
'require dom';
'require secubox/api as API';
'require secubox/theme as Theme';
'require poll';

// Load CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/secubox.css')
}));
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/modules.css')
}));

// Initialize theme
Theme.init();

return view.extend({
	modulesData: [],

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return API.getModules().then(function(data) {
			self.modulesData = data.modules || [];
			return data;
		});
	},

	render: function(data) {
		var self = this;
		var modules = this.modulesData;

		var container = E('div', { 'class': 'secubox-modules-page' });

		// Header with stats
		container.appendChild(this.renderHeader(modules));

		// Filter tabs
		container.appendChild(this.renderFilterTabs());

		// Modules grid
		container.appendChild(E('div', { 'id': 'modules-grid', 'class': 'secubox-modules-grid' },
			this.renderModuleCards(modules, 'all')
		));

		// Auto-refresh
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateModulesGrid();
			});
		}, 30);

		return container;
	},

	renderHeader: function(modules) {
		var total = modules.length;
		var installed = modules.filter(function(m) { return m.installed; }).length;
		var running = modules.filter(function(m) { return m.running; }).length;
		var stopped = installed - running;

		return E('div', { 'class': 'secubox-page-header' }, [
			E('div', {}, [
				E('h2', {}, '📦 SecuBox Modules'),
				E('p', { 'class': 'secubox-page-subtitle' },
					'Manage and monitor all SecuBox modules')
			]),
			E('div', { 'class': 'secubox-modules-stats' }, [
				E('div', { 'class': 'secubox-stat-badge' }, [
					E('span', { 'class': 'secubox-stat-value' }, total),
					E('span', { 'class': 'secubox-stat-label' }, 'Total')
				]),
				E('div', { 'class': 'secubox-stat-badge secubox-stat-success' }, [
					E('span', { 'class': 'secubox-stat-value' }, running),
					E('span', { 'class': 'secubox-stat-label' }, 'Running')
				]),
				E('div', { 'class': 'secubox-stat-badge secubox-stat-warning' }, [
					E('span', { 'class': 'secubox-stat-value' }, stopped),
					E('span', { 'class': 'secubox-stat-label' }, 'Stopped')
				]),
				E('div', { 'class': 'secubox-stat-badge secubox-stat-muted' }, [
					E('span', { 'class': 'secubox-stat-value' }, total - installed),
					E('span', { 'class': 'secubox-stat-label' }, 'Available')
				])
			])
		]);
	},

	renderFilterTabs: function() {
		var self = this;
		var tabs = [
			{ id: 'all', label: 'All Modules', icon: '📦' },
			{ id: 'security', label: 'Security', icon: '🛡️' },
			{ id: 'monitoring', label: 'Monitoring', icon: '📊' },
			{ id: 'network', label: 'Network', icon: '🌐' },
			{ id: 'system', label: 'System', icon: '⚙️' }
		];

		return E('div', { 'class': 'secubox-filter-tabs' },
			tabs.map(function(tab) {
				return E('button', {
					'class': 'secubox-filter-tab' + (tab.id === 'all' ? ' active' : ''),
					'data-filter': tab.id,
					'click': function(ev) {
						document.querySelectorAll('.secubox-filter-tab').forEach(function(el) {
							el.classList.remove('active');
						});
						ev.target.classList.add('active');
						self.filterModules(tab.id);
					}
				}, tab.icon + ' ' + tab.label);
			})
		);
	},

	renderModuleCards: function(modules, filter) {
		var self = this;

		var filtered = filter === 'all' ? modules :
			modules.filter(function(m) { return m.category === filter; });

		if (filtered.length === 0) {
			return E('div', { 'class': 'secubox-empty-state' }, [
				E('div', { 'class': 'secubox-empty-icon' }, '📭'),
				E('div', { 'class': 'secubox-empty-title' }, 'No modules found'),
				E('div', { 'class': 'secubox-empty-text' }, 'Try selecting a different category')
			]);
		}

		return filtered.map(function(module) {
			return self.renderModuleCard(module);
		});
	},

	renderModuleCard: function(module) {
		var self = this;
		var isRunning = module.running;
		var isInstalled = module.installed;
		var statusClass = isRunning ? 'running' : (isInstalled ? 'stopped' : 'not-installed');

		return E('div', {
			'class': 'secubox-module-card secubox-module-' + statusClass,
			'style': 'border-left: 4px solid ' + (module.color || '#64748b')
		}, [
			// Card Header
			E('div', { 'class': 'secubox-module-card-header' }, [
				E('div', { 'class': 'secubox-module-icon' }, module.icon || '📦'),
				E('div', { 'class': 'secubox-module-info' }, [
					E('h3', { 'class': 'secubox-module-name' }, module.name || module.id),
					E('div', { 'class': 'secubox-module-meta' }, [
						E('span', { 'class': 'secubox-module-category' },
							this.getCategoryIcon(module.category) + ' ' + (module.category || 'other')),
						E('span', { 'class': 'secubox-module-version' },
							'v' + (module.version || '0.0.9'))
					])
				]),
				E('div', {
					'class': 'secubox-status-indicator secubox-status-' + statusClass,
					'title': isRunning ? 'Running' : (isInstalled ? 'Stopped' : 'Not Installed')
				})
			]),

			// Card Body
			E('div', { 'class': 'secubox-module-card-body' }, [
				E('p', { 'class': 'secubox-module-description' },
					module.description || 'No description available'),

				E('div', { 'class': 'secubox-module-details' }, [
					E('div', { 'class': 'secubox-module-detail' }, [
						E('span', { 'class': 'secubox-detail-label' }, 'Package:'),
						E('code', { 'class': 'secubox-detail-value' }, module.package || 'N/A')
					]),
					E('div', { 'class': 'secubox-module-detail' }, [
						E('span', { 'class': 'secubox-detail-label' }, 'Status:'),
						E('span', {
							'class': 'secubox-detail-value secubox-status-text-' + statusClass
						}, isRunning ? '● Running' : (isInstalled ? '○ Stopped' : '- Not Installed'))
					])
				])
			]),

			// Card Actions
			E('div', { 'class': 'secubox-module-card-actions' },
				this.renderModuleActions(module))
		]);
	},

	renderModuleActions: function(module) {
		var self = this;
		var actions = [];

		if (!module.installed) {
			actions.push(
				E('button', {
					'class': 'secubox-btn secubox-btn-secondary secubox-btn-sm',
					'disabled': true
				}, '📥 Install')
			);
		} else {
			// Start/Stop button
			if (module.running) {
				actions.push(
					E('button', {
						'class': 'secubox-btn secubox-btn-danger secubox-btn-sm',
						'click': function() {
							self.stopModule(module);
						}
					}, '⏹️ Stop')
				);
			} else {
				actions.push(
					E('button', {
						'class': 'secubox-btn secubox-btn-success secubox-btn-sm',
						'click': function() {
							self.startModule(module);
						}
					}, '▶️ Start')
				);
			}

			// Restart button (only if running)
			if (module.running) {
				actions.push(
					E('button', {
						'class': 'secubox-btn secubox-btn-warning secubox-btn-sm',
						'click': function() {
							self.restartModule(module);
						}
					}, '🔄 Restart')
				);
			}

			// Dashboard link
			var dashboardPath = this.getModuleDashboardPath(module.id);
			if (dashboardPath) {
				actions.push(
					E('a', {
						'href': L.url(dashboardPath),
						'class': 'secubox-btn secubox-btn-primary secubox-btn-sm'
					}, '📊 Dashboard')
				);
			}
		}

		return actions;
	},

	getModuleDashboardPath: function(moduleId) {
		var paths = {
			'crowdsec': 'admin/secubox/security/crowdsec',
			'netdata': 'admin/secubox/monitoring/netdata',
			'netifyd': 'admin/secubox/security/netifyd',
			'wireguard': 'admin/secubox/network/wireguard',
			'network_modes': 'admin/secubox/network/modes',
			'client_guardian': 'admin/secubox/security/guardian',
			'system_hub': 'admin/system/system-hub/overview',
			'bandwidth_manager': 'admin/secubox/network/bandwidth',
			'auth_guardian': 'admin/secubox/security/auth',
			'media_flow': 'admin/secubox/network/media',
			'vhost_manager': 'admin/secubox/system/vhost',
			'traffic_shaper': 'admin/secubox/network/shaper',
			'cdn_cache': 'admin/secubox/network/cdn',
			'ksm_manager': 'admin/secubox/security/ksm'
		};
		return paths[moduleId] || null;
	},

	getCategoryIcon: function(category) {
		var icons = {
			'security': '🛡️',
			'monitoring': '📊',
			'network': '🌐',
			'system': '⚙️',
			'other': '📦'
		};
		return icons[category] || icons['other'];
	},

	startModule: function(module) {
		var self = this;
		ui.showModal(_('Starting Module'), [
			E('p', {}, _('Starting') + ' ' + module.name + '...')
		]);

		API.startModule(module.id).then(function(result) {
			ui.hideModal();
			if (result && result.success !== false) {
				ui.addNotification(null, E('p', module.name + ' started successfully'), 'info');
				self.refreshData().then(function() {
					self.updateModulesGrid();
				});
			} else {
				ui.addNotification(null, E('p', 'Failed to start ' + module.name), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	stopModule: function(module) {
		var self = this;
		ui.showModal(_('Stopping Module'), [
			E('p', {}, _('Stopping') + ' ' + module.name + '...')
		]);

		API.stopModule(module.id).then(function(result) {
			ui.hideModal();
			if (result && result.success !== false) {
				ui.addNotification(null, E('p', module.name + ' stopped successfully'), 'info');
				self.refreshData().then(function() {
					self.updateModulesGrid();
				});
			} else {
				ui.addNotification(null, E('p', 'Failed to stop ' + module.name), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	restartModule: function(module) {
		var self = this;
		ui.showModal(_('Restarting Module'), [
			E('p', {}, _('Restarting') + ' ' + module.name + '...')
		]);

		API.restartModule(module.id).then(function(result) {
			ui.hideModal();
			if (result && result.success !== false) {
				ui.addNotification(null, E('p', module.name + ' restarted successfully'), 'info');
				self.refreshData().then(function() {
					self.updateModulesGrid();
				});
			} else {
				ui.addNotification(null, E('p', 'Failed to restart ' + module.name), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	filterModules: function(category) {
		var grid = document.getElementById('modules-grid');
		if (grid) {
			dom.content(grid, this.renderModuleCards(this.modulesData, category));
		}
	},

	updateModulesGrid: function() {
		var activeTab = document.querySelector('.secubox-filter-tab.active');
		var filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
		this.filterModules(filter);

		// Update header stats
		var header = document.querySelector('.secubox-modules-stats');
		if (header && header.parentNode) {
			var newHeader = this.renderHeader(this.modulesData);
			header.parentNode.replaceChild(newHeader.querySelector('.secubox-modules-stats'), header);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
