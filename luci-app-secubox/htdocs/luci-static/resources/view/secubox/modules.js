'use strict';
'require view';
'require ui';
'require dom';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require poll';

// Load global theme CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/secubox-theme.css')
}));
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/modules.css')
}));

// Initialize global theme
Theme.init({ theme: 'dark', language: 'en' });

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
		var enabled = modules.filter(function(m) { return m.enabled; }).length;
		var disabled = installed - enabled;

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
					E('span', { 'class': 'secubox-stat-value' }, enabled),
					E('span', { 'class': 'secubox-stat-label' }, 'Activés')
				]),
				E('div', { 'class': 'secubox-stat-badge secubox-stat-warning' }, [
					E('span', { 'class': 'secubox-stat-value' }, disabled),
					E('span', { 'class': 'secubox-stat-label' }, 'Désactivés')
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

		var filterButtons = tabs.map(function(tab) {
			return E('button', {
				'class': 'cyber-tab cyber-tab--pill' + (tab.id === 'all' ? ' is-active' : ''),
				'data-filter': tab.id,
				'type': 'button',
				'click': function(ev) {
					document.querySelectorAll('.secubox-filter-tabs .cyber-tab[data-filter]').forEach(function(el) {
						el.classList.remove('is-active');
					});
					ev.currentTarget.classList.add('is-active');
					self.filterModules(tab.id);
				}
			}, [
				E('span', { 'class': 'cyber-tab-icon' }, tab.icon),
				E('span', { 'class': 'cyber-tab-label' }, tab.label)
			]);
		});

		filterButtons.push(
			E('button', {
				'class': 'cyber-tab cyber-tab--ghost',
				'type': 'button',
				'click': function() {
					window.location.href = L.url('admin/secubox/help');
				}
			}, '✨ ' + _('Bonus · Help à SecuBox'))
		);

		return E('div', { 'class': 'secubox-filter-tabs cyber-tablist cyber-tablist--filters' }, filterButtons);
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
		var status = module.status || 'unknown';
		var isInstalled = module.installed;
		var statusClass = isInstalled ? status : 'not-installed';

		// Status label mapping (v0.3.1)
		var statusLabels = {
			'active': '✓ Activé',
			'disabled': '○ Désactivé',
			'error': '⚠️ Erreur',
			'unknown': '? Inconnu',
			'not-installed': '- Not Installed'
		};

		var statusLabel = isInstalled ? (statusLabels[status] || '○ Désactivé') : statusLabels['not-installed'];

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
					'title': statusLabel
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
						}, statusLabel)
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
			// Enable/Disable button (v0.3.1)
			if (module.enabled) {
				actions.push(
					E('button', {
						'class': 'secubox-btn secubox-btn-danger secubox-btn-sm',
						'click': function() {
							self.disableModule(module);
						}
					}, '⏹️ Désactiver')
				);
			} else {
				actions.push(
					E('button', {
						'class': 'secubox-btn secubox-btn-success secubox-btn-sm',
						'click': function() {
							self.enableModule(module);
						}
					}, '▶️ Activer')
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

	// Enable module (v0.3.1)
	enableModule: function(module) {
		var self = this;
		ui.showModal(_('Activation du module'), [
			E('p', {}, 'Activation de ' + module.name + '...')
		]);

		API.enableModule(module.id).then(function(result) {
			ui.hideModal();
			if (result && result.success !== false) {
				ui.addNotification(null, E('p', module.name + ' activé avec succès'), 'info');
				self.refreshData().then(function() {
					self.updateModulesGrid();
				});
			} else {
				ui.addNotification(null, E('p', 'Échec de l\'activation de ' + module.name), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Erreur: ' + err.message), 'error');
		});
	},

	// Disable module (v0.3.1)
	disableModule: function(module) {
		var self = this;
		ui.showModal(_('Désactivation du module'), [
			E('p', {}, 'Désactivation de ' + module.name + '...')
		]);

		API.disableModule(module.id).then(function(result) {
			ui.hideModal();
			if (result && result.success !== false) {
				ui.addNotification(null, E('p', module.name + ' désactivé avec succès'), 'info');
				self.refreshData().then(function() {
					self.updateModulesGrid();
				});
			} else {
				ui.addNotification(null, E('p', 'Échec de la désactivation de ' + module.name), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Erreur: ' + err.message), 'error');
		});
	},

	// DEPRECATED: Keeping for backward compatibility
	startModule: function(module) {
		return this.enableModule(module);
	},

	stopModule: function(module) {
		return this.disableModule(module);
	},

	restartModule: function(module) {
		var self = this;
		return this.disableModule(module).then(function() {
			return self.enableModule(module);
		});
	},

	filterModules: function(category) {
		var grid = document.getElementById('modules-grid');
		if (grid) {
			dom.content(grid, this.renderModuleCards(this.modulesData, category));
		}
	},

	updateModulesGrid: function() {
		var activeTab = document.querySelector('.secubox-filter-tabs .cyber-tab.is-active[data-filter]');
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
