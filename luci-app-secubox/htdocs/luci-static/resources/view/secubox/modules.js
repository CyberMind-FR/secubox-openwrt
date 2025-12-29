'use strict';
'require view';
'require ui';
'require dom';
'require secubox/api as API';
'require secubox/theme as Theme';
'require secubox/nav as SecuNav';
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

// Initialize global theme respecting LuCI selection
var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

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

		var container = E('div', { 'class': 'secubox-modules-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),
			SecuNav.renderTabs('modules'),
			this.renderHeader(modules),
			this.renderFilterTabs(),
			E('div', {
				'id': 'modules-grid',
				'class': 'secubox-modules-grid'
			}, this.renderModuleCards(modules, 'all'))
		]);

		// Auto-refresh
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateModulesGrid();
			});
		}, 30);

		return container;
	},

	renderHeader: function(modules) {
		var stats = this.getModuleStats(modules);

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '📦'),
					_('SecuBox Modules')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Manage and monitor all SecuBox modules'))
			]),
			E('div', { 'class': 'sh-header-meta' }, [
				this.renderHeaderChip('total', '🏷️', _('Total'), stats.total),
				this.renderHeaderChip('installed', '💾', _('Installed'), stats.installed),
				this.renderHeaderChip('active', '🟢', _('Active'), stats.enabled, stats.enabled ? 'success' : ''),
				this.renderHeaderChip('inactive', '⚪', _('Disabled'), stats.disabled, stats.disabled ? 'warn' : ''),
				this.renderHeaderChip('available', '📦', _('Available'), stats.available)
			])
		]);
	},

	renderFilterTabs: function() {
		var self = this;
		var tabs = [
			{ id: 'all', label: _('All Modules'), icon: '📦' },
			{ id: 'security', label: _('Security'), icon: '🛡️' },
			{ id: 'monitoring', label: _('Monitoring'), icon: '📊' },
			{ id: 'network', label: _('Network'), icon: '🌐' },
			{ id: 'system', label: _('System'), icon: '⚙️' }
		];

		var filterButtons = tabs.map(function(tab) {
			return E('button', {
				'class': 'sh-nav-tab secubox-module-tab' + (tab.id === 'all' ? ' active' : ''),
				'data-filter': tab.id,
				'type': 'button',
				'click': function(ev) {
					document.querySelectorAll('.secubox-filter-tabs .sh-nav-tab[data-filter]').forEach(function(el) {
						el.classList.remove('active');
					});
					ev.currentTarget.classList.add('active');
					self.filterModules(tab.id);
				}
			}, [
				E('span', { 'class': 'sh-tab-icon' }, tab.icon),
				E('span', { 'class': 'sh-tab-label' }, tab.label)
			]);
		});

		return E('div', { 'class': 'secubox-filter-tabs sh-nav-tabs secubox-nav-tabs secubox-module-tabs' }, filterButtons);
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

	resolveModuleVersion: function(module) {
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
		var versionLabel = this.resolveModuleVersion(module);

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
							versionLabel === '—' ? versionLabel : 'v' + versionLabel)
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

	getModuleStats: function(modules) {
		var list = modules || [];
		var installed = list.filter(function(m) { return m.installed; }).length;
		var enabled = list.filter(function(m) { return m.enabled; }).length;
		var disabled = Math.max(installed - enabled, 0);
		var available = Math.max(list.length - installed, 0);

		return {
			total: list.length,
			installed: installed,
			enabled: enabled,
			disabled: disabled,
			available: available
		};
	},

	renderHeaderChip: function(id, icon, label, value, tone) {
		return E('div', { 'class': 'sh-header-chip' + (tone ? ' ' + tone : '') }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', { 'id': 'secubox-modules-chip-' + id }, value.toString())
			])
		]);
	},

	updateHeaderStats: function() {
		var stats = this.getModuleStats(this.modulesData);
		this.setHeaderChipValue('total', stats.total);
		this.setHeaderChipValue('installed', stats.installed);
		this.setHeaderChipValue('active', stats.enabled, stats.enabled ? 'success' : '');
		this.setHeaderChipValue('inactive', stats.disabled, stats.disabled ? 'warn' : '');
		this.setHeaderChipValue('available', stats.available);
	},

	setHeaderChipValue: function(id, value, tone) {
		var target = document.getElementById('secubox-modules-chip-' + id);
		if (target)
			target.textContent = value.toString();

		var chip = target && target.closest('.sh-header-chip');
		if (chip) {
			chip.classList.remove('success', 'warn');
			if (tone)
				chip.classList.add(tone);
		}
	},

	updateModulesGrid: function() {
		var activeTab = document.querySelector('.secubox-filter-tabs .cyber-tab.is-active[data-filter]');
		var filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
		this.filterModules(filter);
		this.updateHeaderStats();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
