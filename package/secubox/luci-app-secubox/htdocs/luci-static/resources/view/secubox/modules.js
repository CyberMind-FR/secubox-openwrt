'use strict';
'require view';
'require ui';
'require dom';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require secubox/nav as SecuNav';
'require secubox-theme/cascade as Cascade';
'require secubox-portal/header as SbHeader';
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
	'href': L.resource('secubox-theme/themes/cyberpunk.css')
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
	currentFilter: 'all',
	filterLayer: null,
	debugMode: true,  // FORCE DEBUG MODE ON

	debug: function() {
		if (this.debugMode && console && console.log) {
			console.log.apply(console, ['[Modules]'].concat(Array.prototype.slice.call(arguments)));
		}
	},

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return API.getModules().then(function(data) {
			self.debug('getModules raw response:', data);
			if (!data) {
				console.warn('[Modules] getModules returned empty data');
				return { modules: [] };
			}
			self.debug('Modules from API:', data.modules);
			self.modulesData = data.modules || [];
			self.debug('Stored modulesData:', self.modulesData);
			return data;
		}).catch(function(err) {
			console.error('[Modules] Error loading modules:', err);
			ui.addNotification(null, E('p', _('Failed to load modules: ') + err.message), 'error');
			return { modules: [] };
		});
	},

	render: function(data) {
		var self = this;
		var modules = (data && data.modules) || this.modulesData || [];

		console.log('[Modules] ========== RENDER START ==========');
		console.log('[Modules] render() called with data:', data);
		console.log('[Modules] data.modules:', data ? data.modules : 'NO DATA');
		console.log('[Modules] this.modulesData:', this.modulesData);
		console.log('[Modules] Final modules array:', modules);
		console.log('[Modules] Final modules.length:', modules.length);
		console.log('[Modules] ========== RENDER START ==========');

		var defaultFilter = this.currentFilter || 'all';
		var container = E('div', {
			'class': 'secubox-modules-page',
			'data-cascade-root': 'modules'
		}, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/core/variables.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),
			SecuNav.renderTabs('modules'),
			this.renderHeader(modules),
			this.renderFilterTabs(),
			E('div', {
				'id': 'modules-grid',
				'class': 'secubox-modules-grid sb-cascade-layer',
				'data-cascade-layer': 'view',
				'data-cascade-role': 'modules',
				'data-cascade-depth': '3',
				'data-cascade-filter': defaultFilter
			}, this.renderModuleCards(modules, defaultFilter))
		]);

		// Auto-refresh
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateModulesGrid();
			});
		}, 30);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
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

		this.filterLayer = Cascade.createLayer({
			id: 'secubox-module-filters',
			type: 'tabs',
			role: 'categories',
			depth: 2,
			className: 'secubox-filter-tabs sh-nav-tabs secubox-nav-tabs secubox-module-tabs',
			items: tabs.map(function(tab) {
				return {
					id: tab.id,
					label: tab.label,
					icon: tab.icon,
					state: tab.id === self.currentFilter ? 'active' : null
				};
			}),
			active: this.currentFilter,
			onSelect: function(item, ev) {
				ev.preventDefault();
				self.filterModules(item.id);
			}
		});

		return this.filterLayer;
	},

	renderModuleCards: function(modules, filter) {
		var self = this;

		console.log('[Modules] renderModuleCards called with:');
		console.log('[Modules]   modules.length:', modules.length);
		console.log('[Modules]   filter:', filter);
		console.log('[Modules]   First 3 modules:', modules.slice(0, 3));

		var filtered = filter === 'all' ? modules :
			modules.filter(function(m) { return m.category === filter; });

		console.log('[Modules]   filtered.length:', filtered.length);

		if (filtered.length === 0) {
			console.warn('[Modules] No modules match filter:', filter);
			return E('div', { 'class': 'secubox-empty-state' }, [
				E('div', { 'class': 'secubox-empty-icon' }, '📭'),
				E('div', { 'class': 'secubox-empty-title' }, 'No modules found'),
				E('div', { 'class': 'secubox-empty-text' }, 'Try selecting a different category or view all modules')
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
			'data-cascade-item': module.id || module.name,
			'data-cascade-category': module.category || 'other',
			'data-cascade-status': status,
			'data-module-installed': module.installed ? '1' : '0',
			'data-module-enabled': module.enabled ? '1' : '0',
			'data-module-access': statusClass,
			'data-cascade-depth': '4',
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
			E('div', {
				'class': 'secubox-module-card-actions sb-cascade-layer',
				'data-cascade-layer': 'actions',
				'data-cascade-role': 'module-actions',
				'data-cascade-depth': '5'
			},
				this.renderModuleActions(module))
		]);
	},

	renderModuleActions: function(module) {
		var self = this;
		var actions = [];

		if (!module.installed) {
			actions.push(
				E('button', {
					'class': 'secubox-btn secubox-btn-primary secubox-btn-sm sb-cascade-item',
					'data-cascade-action': 'install',
					'data-module-target': module.id,
					'click': function(ev) {
						self.installModule(module, ev.target);
					}
				}, [
					E('span', { 'class': 'sb-cascade-label' }, '📥 Install')
				])
			);
		} else {
			// Enable/Disable button (v0.3.1)
			if (module.enabled) {
				actions.push(
					E('button', {
						'class': 'secubox-btn secubox-btn-danger secubox-btn-sm sb-cascade-item',
						'data-cascade-action': 'disable',
						'data-module-target': module.id,
						'click': function() {
							self.disableModule(module);
						}
					}, [
						E('span', { 'class': 'sb-cascade-label' }, '⏹️ Désactiver')
					])
				);
			} else {
				actions.push(
					E('button', {
						'class': 'secubox-btn secubox-btn-success secubox-btn-sm sb-cascade-item',
						'data-cascade-action': 'enable',
						'data-module-target': module.id,
						'click': function() {
							self.enableModule(module);
						}
					}, [
						E('span', { 'class': 'sb-cascade-label' }, '▶️ Activer')
					])
				);
			}

			// Dashboard link
			var dashboardPath = this.getModuleDashboardPath(module.id);
			if (dashboardPath) {
				actions.push(
					E('a', {
						'href': L.url(dashboardPath),
						'class': 'secubox-btn secubox-btn-primary secubox-btn-sm sb-cascade-item',
						'data-cascade-action': 'navigate',
						'data-module-target': module.id
					}, [
						E('span', { 'class': 'sb-cascade-label' }, '📊 Dashboard')
					])
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
			'network_modes': 'admin/secubox/network/modes/overview',
			'client_guardian': 'admin/secubox/client-guardian/overview',
			'system_hub': 'admin/secubox/system-hub/overview',
			'bandwidth_manager': 'admin/secubox/bandwidth-manager/overview',
			'auth_guardian': 'admin/secubox/auth-guardian/overview',
			'media_flow': 'admin/secubox/mediaflow/dashboard',
			'vhost_manager': 'admin/secubox/vhosts/overview',
			'traffic_shaper': 'admin/secubox/traffic-shaper/overview',
			'cdn_cache': 'admin/secubox/cdn-cache/overview',
			'ksm_manager': 'admin/secubox/ksm-manager/overview',
			'mqtt_bridge': 'admin/secubox/network/mqtt-bridge/overview'
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

	installModule: function(module, button) {
		var self = this;
		var originalText = button ? button.textContent : '';

		if (button) {
			button.disabled = true;
			button.textContent = _('Installing...');
		}

		ui.showModal(_('Installing Module'), [
			E('p', { 'class': 'spinning' }, _('Installing ') + module.name + '...')
		]);

		return API.installAppstoreApp(module.id).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', module.name + ' ' + _('installed successfully')), 'info');
				return self.refreshData().then(function() {
					self.updateModulesGrid();
				});
			} else {
				ui.addNotification(null, E('p', _('Installation failed: ') + (result.error || result.details || _('Unknown error'))), 'error');
				if (button) {
					button.disabled = false;
					button.textContent = originalText;
				}
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Installation error: ') + err.message), 'error');
			if (button) {
				button.disabled = false;
				button.textContent = originalText;
			}
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
		this.currentFilter = category || this.currentFilter || 'all';
		var grid = document.getElementById('modules-grid');
		if (grid) {
			grid.setAttribute('data-cascade-filter', this.currentFilter);
			dom.content(grid, this.renderModuleCards(this.modulesData, this.currentFilter));
		}
		if (this.filterLayer) {
			Cascade.setActiveItem(this.filterLayer, this.currentFilter);
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
		this.filterModules(this.currentFilter || 'all');
		this.updateHeaderStats();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
