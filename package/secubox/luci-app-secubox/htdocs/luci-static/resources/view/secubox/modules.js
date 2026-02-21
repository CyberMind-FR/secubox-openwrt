'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require secubox/kiss-theme';

/**
 * SecuBox Modules - KISS Edition
 * Self-contained with inline CSS, no external dependencies
 */

var callGetModules = rpc.declare({
	object: 'luci.secubox',
	method: 'getModules',
	expect: {}
});

var callEnableModule = rpc.declare({
	object: 'luci.secubox',
	method: 'enable_module',
	params: ['module'],
	expect: {}
});

var callDisableModule = rpc.declare({
	object: 'luci.secubox',
	method: 'disable_module',
	params: ['module'],
	expect: {}
});

var callInstallApp = rpc.declare({
	object: 'luci.secubox.appstore',
	method: 'install',
	params: ['app_id'],
	expect: {}
});

return view.extend({
	modulesData: [],
	currentFilter: 'all',

	load: function() {
		var self = this;
		return callGetModules().then(function(data) {
			self.modulesData = (data && data.modules) || [];
			return self.modulesData;
		}).catch(function() {
			return [];
		});
	},

	render: function() {
		var self = this;
		var modules = this.modulesData || [];
		var stats = this.getModuleStats(modules);

		poll.add(function() {
			return callGetModules().then(function(data) {
				self.modulesData = (data && data.modules) || [];
				self.updateGrid();
			});
		}, 30);

		var content = E('div', { 'class': 'sb-modules' }, [
			E('style', {}, this.getStyles()),
			this.renderHeader(stats),
			this.renderFilterTabs(),
			E('div', { 'id': 'modules-grid', 'class': 'sb-grid' },
				this.renderModuleCards(modules, this.currentFilter))
		]);

		return KissTheme.wrap(content, 'admin/secubox/modules');
	},

	renderHeader: function(stats) {
		var chips = [
			{ icon: '📦', label: 'Total', value: stats.total },
			{ icon: '💾', label: 'Installed', value: stats.installed },
			{ icon: '🟢', label: 'Active', value: stats.enabled, color: stats.enabled > 0 ? '#22c55e' : '' },
			{ icon: '⚪', label: 'Disabled', value: stats.disabled, color: stats.disabled > 0 ? '#f59e0b' : '' },
			{ icon: '📥', label: 'Available', value: stats.available }
		];

		return E('div', { 'class': 'sb-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sb-title' }, '📦 SecuBox Modules'),
				E('p', { 'class': 'sb-subtitle' }, 'Manage and monitor security modules')
			]),
			E('div', { 'class': 'sb-chips', 'id': 'header-chips' }, chips.map(function(chip) {
				return E('div', {
					'class': 'sb-chip',
					'data-chip': chip.label.toLowerCase(),
					'style': chip.color ? 'border-color:' + chip.color : ''
				}, [
					E('span', { 'class': 'sb-chip-icon' }, chip.icon),
					E('div', {}, [
						E('span', { 'class': 'sb-chip-label' }, chip.label),
						E('strong', { 'style': chip.color ? 'color:' + chip.color : '' }, String(chip.value))
					])
				]);
			}))
		]);
	},

	renderFilterTabs: function() {
		var self = this;
		var tabs = [
			{ id: 'all', label: 'All', icon: '📦' },
			{ id: 'security', label: 'Security', icon: '🛡️' },
			{ id: 'monitoring', label: 'Monitoring', icon: '📊' },
			{ id: 'network', label: 'Network', icon: '🌐' },
			{ id: 'system', label: 'System', icon: '⚙️' }
		];

		return E('div', { 'class': 'sb-filters' }, tabs.map(function(tab) {
			return E('button', {
				'class': 'sb-filter' + (self.currentFilter === tab.id ? ' active' : ''),
				'data-filter': tab.id,
				'click': function() { self.filterModules(tab.id); }
			}, [
				E('span', {}, tab.icon),
				E('span', {}, tab.label)
			]);
		}));
	},

	renderModuleCards: function(modules, filter) {
		var self = this;
		var filtered = filter === 'all' ? modules :
			modules.filter(function(m) { return m.category === filter; });

		if (filtered.length === 0) {
			return [E('div', { 'class': 'sb-empty' }, [
				E('span', {}, '📭'),
				E('h3', {}, 'No modules found'),
				E('p', {}, 'Try selecting a different category')
			])];
		}

		return filtered.map(function(mod) { return self.renderModuleCard(mod); });
	},

	renderModuleCard: function(mod) {
		var self = this;
		var status = mod.status || 'unknown';
		var isInstalled = mod.installed;
		var isEnabled = mod.enabled;
		var statusClass = isInstalled ? (isEnabled ? 'active' : 'disabled') : 'not-installed';
		var statusText = isInstalled ? (isEnabled ? '✓ Active' : '○ Disabled') : '- Not Installed';
		var version = mod.version || mod.pkg_version || '—';

		var categoryIcons = {
			'security': '🛡️', 'monitoring': '📊', 'network': '🌐', 'system': '⚙️', 'other': '📦'
		};

		return E('div', {
			'class': 'sb-card sb-card-' + statusClass,
			'data-category': mod.category || 'other',
			'style': 'border-left: 4px solid ' + (mod.color || '#64748b')
		}, [
			E('div', { 'class': 'sb-card-header' }, [
				E('span', { 'class': 'sb-card-icon' }, mod.icon || '📦'),
				E('div', { 'class': 'sb-card-info' }, [
					E('h3', {}, mod.name || mod.id),
					E('div', { 'class': 'sb-card-meta' }, [
						E('span', {}, (categoryIcons[mod.category] || '📦') + ' ' + (mod.category || 'other')),
						E('span', {}, version !== '—' ? 'v' + version : version)
					])
				]),
				E('span', { 'class': 'sb-status-dot sb-status-' + statusClass, 'title': statusText })
			]),
			E('p', { 'class': 'sb-card-desc' }, mod.description || 'No description'),
			E('div', { 'class': 'sb-card-footer' }, [
				E('span', { 'class': 'sb-card-pkg' }, mod.package || 'N/A'),
				E('span', { 'class': 'sb-card-status sb-text-' + statusClass }, statusText)
			]),
			E('div', { 'class': 'sb-card-actions' }, this.renderModuleActions(mod))
		]);
	},

	renderModuleActions: function(mod) {
		var self = this;
		var actions = [];

		if (!mod.installed) {
			actions.push(E('button', {
				'class': 'sb-btn sb-btn-primary',
				'click': function(ev) { self.installModule(mod, ev.target); }
			}, '📥 Install'));
		} else {
			if (mod.enabled) {
				actions.push(E('button', {
					'class': 'sb-btn sb-btn-danger',
					'click': function() { self.disableModule(mod); }
				}, '⏹️ Disable'));
			} else {
				actions.push(E('button', {
					'class': 'sb-btn sb-btn-success',
					'click': function() { self.enableModule(mod); }
				}, '▶️ Enable'));
			}

			var dashPath = this.getModuleDashboard(mod.id);
			if (dashPath) {
				actions.push(E('a', {
					'class': 'sb-btn sb-btn-primary',
					'href': L.url(dashPath)
				}, '📊 Dashboard'));
			}
		}

		return actions;
	},

	getModuleDashboard: function(id) {
		var paths = {
			'crowdsec': 'admin/secubox/crowdsec/overview',
			'netdata': 'admin/secubox/netdata/dashboard',
			'netifyd': 'admin/secubox/netifyd/overview',
			'wireguard': 'admin/services/wireguard',
			'network_modes': 'admin/secubox/network/modes/overview',
			'client_guardian': 'admin/secubox/client-guardian/overview',
			'system_hub': 'admin/secubox/system-hub/overview',
			'bandwidth_manager': 'admin/secubox/bandwidth-manager/overview',
			'media_flow': 'admin/secubox/mediaflow/dashboard',
			'vhost_manager': 'admin/secubox/vhosts/overview'
		};
		return paths[id] || null;
	},

	enableModule: function(mod) {
		var self = this;
		ui.showModal('Enabling Module', [E('p', { 'class': 'spinning' }, 'Enabling ' + mod.name + '...')]);

		callEnableModule(mod.id).then(function(result) {
			ui.hideModal();
			if (result && result.success !== false) {
				ui.addNotification(null, E('p', {}, mod.name + ' enabled'), 'info');
				return callGetModules().then(function(data) {
					self.modulesData = (data && data.modules) || [];
					self.updateGrid();
				});
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to enable ' + mod.name), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
		});
	},

	disableModule: function(mod) {
		var self = this;
		ui.showModal('Disabling Module', [E('p', { 'class': 'spinning' }, 'Disabling ' + mod.name + '...')]);

		callDisableModule(mod.id).then(function(result) {
			ui.hideModal();
			if (result && result.success !== false) {
				ui.addNotification(null, E('p', {}, mod.name + ' disabled'), 'info');
				return callGetModules().then(function(data) {
					self.modulesData = (data && data.modules) || [];
					self.updateGrid();
				});
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to disable ' + mod.name), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
		});
	},

	installModule: function(mod, btn) {
		var self = this;
		var origText = btn ? btn.textContent : '';
		if (btn) { btn.disabled = true; btn.textContent = 'Installing...'; }

		ui.showModal('Installing Module', [E('p', { 'class': 'spinning' }, 'Installing ' + mod.name + '...')]);

		callInstallApp(mod.id).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, mod.name + ' installed'), 'info');
				return callGetModules().then(function(data) {
					self.modulesData = (data && data.modules) || [];
					self.updateGrid();
				});
			} else {
				ui.addNotification(null, E('p', {}, 'Installation failed: ' + (result.error || 'Unknown')), 'error');
				if (btn) { btn.disabled = false; btn.textContent = origText; }
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
			if (btn) { btn.disabled = false; btn.textContent = origText; }
		});
	},

	filterModules: function(filter) {
		this.currentFilter = filter;
		document.querySelectorAll('.sb-filter').forEach(function(btn) {
			btn.classList.toggle('active', btn.dataset.filter === filter);
		});
		this.updateGrid();
	},

	updateGrid: function() {
		var grid = document.getElementById('modules-grid');
		if (grid) {
			grid.innerHTML = '';
			this.renderModuleCards(this.modulesData, this.currentFilter).forEach(function(card) {
				grid.appendChild(card);
			});
		}
		this.updateHeaderStats();
	},

	updateHeaderStats: function() {
		var stats = this.getModuleStats(this.modulesData);
		var chips = {
			'total': stats.total,
			'installed': stats.installed,
			'active': stats.enabled,
			'disabled': stats.disabled,
			'available': stats.available
		};
		Object.keys(chips).forEach(function(key) {
			var chip = document.querySelector('[data-chip="' + key + '"] strong');
			if (chip) chip.textContent = String(chips[key]);
		});
	},

	getModuleStats: function(modules) {
		var list = modules || [];
		var installed = list.filter(function(m) { return m.installed; }).length;
		var enabled = list.filter(function(m) { return m.enabled; }).length;
		return {
			total: list.length,
			installed: installed,
			enabled: enabled,
			disabled: Math.max(installed - enabled, 0),
			available: Math.max(list.length - installed, 0)
		};
	},

	getStyles: function() {
		return `
.sb-modules { max-width: 1400px; margin: 0 auto; padding: 20px; }
.sb-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.sb-title { margin: 0; font-size: 24px; font-weight: 700; }
.sb-subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
.sb-chips { display: flex; gap: 12px; flex-wrap: wrap; }
.sb-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; }
.sb-chip-icon { font-size: 18px; }
.sb-chip-label { font-size: 11px; color: #666; display: block; }
.sb-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.sb-filter { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.sb-filter:hover { background: #e5e7eb; }
.sb-filter.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.sb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.sb-card { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; }
.sb-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.sb-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.sb-card-icon { font-size: 32px; }
.sb-card-info { flex: 1; }
.sb-card-info h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; }
.sb-card-meta { display: flex; gap: 12px; font-size: 12px; color: #888; }
.sb-status-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.sb-status-active { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
.sb-status-disabled { background: #f59e0b; }
.sb-status-not-installed { background: #d1d5db; }
.sb-card-desc { font-size: 13px; color: #666; margin: 0 0 12px; line-height: 1.4; }
.sb-card-footer { display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.sb-card-pkg { font-family: monospace; }
.sb-text-active { color: #22c55e; }
.sb-text-disabled { color: #f59e0b; }
.sb-text-not-installed { color: #888; }
.sb-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.sb-btn { padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #e5e7eb; background: #f8f9fa; color: #333; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s; }
.sb-btn:hover { background: #e5e7eb; }
.sb-btn-primary { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.sb-btn-primary:hover { background: #2563eb; }
.sb-btn-success { background: #22c55e; color: #fff; border-color: #22c55e; }
.sb-btn-success:hover { background: #16a34a; }
.sb-btn-danger { background: #ef4444; color: #fff; border-color: #ef4444; }
.sb-btn-danger:hover { background: #dc2626; }
.sb-empty { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #888; }
.sb-empty span { font-size: 48px; display: block; margin-bottom: 16px; }
.sb-empty h3 { margin: 0 0 8px; font-size: 18px; color: #333; }
.sb-empty p { margin: 0; }
@media (prefers-color-scheme: dark) {
  .sb-modules { color: #e5e7eb; }
  .sb-header, .sb-card { background: #1f2937; }
  .sb-chip, .sb-filter { background: #374151; border-color: #4b5563; }
  .sb-filter.active { background: #3b82f6; border-color: #3b82f6; }
  .sb-chip-label, .sb-subtitle, .sb-card-meta, .sb-card-desc, .sb-card-footer { color: #9ca3af; }
  .sb-card-info h3 { color: #f3f4f6; }
  .sb-btn { background: #374151; border-color: #4b5563; color: #e5e7eb; }
  .sb-btn:hover { background: #4b5563; }
  .sb-card-footer { border-color: #374151; }
  .sb-empty h3 { color: #f3f4f6; }
}
`;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
