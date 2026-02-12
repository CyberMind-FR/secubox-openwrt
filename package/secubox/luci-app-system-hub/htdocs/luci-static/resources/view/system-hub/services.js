'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require system-hub/api as API';
'require secubox/kiss-theme';

return view.extend({
	services: [],
	activeFilter: 'all',
	searchQuery: '',

	load: function() {
		return API.listServices();
	},

	render: function(data) {
		this.services = this.normalizeServices(data);

		var self = this;
		poll.add(function() {
			return API.listServices().then(function(fresh) {
				self.services = self.normalizeServices(fresh);
				self.updateStats();
				self.updateServicesGrid();
			});
		}, 30);

		// Inject services-specific styles
		this.injectStyles();

		var content = [
			this.renderHeader(),
			this.renderControls(),
			E('div', { 'class': 'sh-services-grid', 'id': 'sh-services-grid' },
				this.getFilteredServices().map(this.renderServiceCard, this))
		];

		return KissTheme.wrap(content, 'admin/secubox/system/system-hub/services');
	},

	injectStyles: function() {
		if (document.querySelector('#sh-services-kiss-styles')) return;
		var style = document.createElement('style');
		style.id = 'sh-services-kiss-styles';
		style.textContent = `
.sh-page-header { margin-bottom: 24px; }
.sh-page-header-lite { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.sh-page-title { font-size: 24px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 10px; }
.sh-page-title-icon { font-size: 28px; }
.sh-page-subtitle { color: var(--kiss-muted); margin: 4px 0 0; font-size: 14px; }
.sh-header-meta { display: flex; gap: 12px; flex-wrap: wrap; }
.sh-header-chip { background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 8px; padding: 8px 14px; display: flex; align-items: center; gap: 8px; }
.sh-header-chip.success { border-color: rgba(0,200,83,0.3); }
.sh-header-chip.danger { border-color: rgba(255,23,68,0.3); }
.sh-chip-icon { font-size: 16px; }
.sh-chip-text { display: flex; flex-direction: column; }
.sh-chip-label { font-size: 10px; color: var(--kiss-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.sh-chip-text strong { font-size: 16px; font-weight: 700; }
.sh-service-controls { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.sh-service-tabs { display: flex; gap: 6px; }
.cyber-tab { background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 6px; padding: 8px 14px; font-size: 12px; color: var(--kiss-muted); cursor: pointer; transition: all 0.2s; }
.cyber-tab:hover { border-color: rgba(0,200,83,0.3); color: var(--kiss-text); }
.cyber-tab.is-active { border-color: var(--kiss-green); color: var(--kiss-green); background: rgba(0,200,83,0.05); }
.sh-service-search input { background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 6px; padding: 8px 14px; color: var(--kiss-text); font-size: 13px; min-width: 220px; }
.sh-service-search input:focus { outline: none; border-color: rgba(0,200,83,0.4); }
.sh-services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.sh-service-card { background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; transition: all 0.2s; }
.sh-service-card:hover { border-color: rgba(0,200,83,0.2); }
.sh-service-card.running { border-left: 3px solid var(--kiss-green); }
.sh-service-card.stopped { border-left: 3px solid var(--kiss-red); }
.sh-service-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.sh-service-head h3 { margin: 0; font-size: 15px; font-weight: 600; }
.sh-service-tag { font-size: 10px; color: var(--kiss-muted); background: rgba(255,255,255,0.04); padding: 3px 8px; border-radius: 4px; margin-top: 4px; display: inline-block; }
.sh-service-status { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 4px; }
.sh-service-status.running { color: var(--kiss-green); background: rgba(0,200,83,0.1); }
.sh-service-status.stopped { color: var(--kiss-red); background: rgba(255,23,68,0.1); }
.sh-service-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.sh-btn { padding: 7px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid var(--kiss-line); background: var(--kiss-bg2); color: var(--kiss-text); transition: all 0.2s; }
.sh-btn:hover { border-color: rgba(0,200,83,0.3); background: rgba(0,200,83,0.05); }
.sh-btn-ghost { background: transparent; }
.sh-btn-action { background: rgba(0,200,83,0.05); border-color: rgba(0,200,83,0.2); color: var(--kiss-green); }
.sh-empty-state { text-align: center; padding: 60px 20px; color: var(--kiss-muted); }
.sh-empty-icon { font-size: 48px; margin-bottom: 12px; }
.sh-service-detail { margin-bottom: 16px; }
.sh-service-detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--kiss-line); }
`;
		document.head.appendChild(style);
	},

	normalizeServices: function(data) {
		if (!data) return [];
		if (Array.isArray(data)) return data;
		if (Array.isArray(data.services)) return data.services;
		return [];
	},

	renderHeader: function() {
		var stats = this.getStats();

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🧩'),
					_('Service Control Center')
				]),
				E('p', { 'class': 'sh-page-subtitle' }, _('Start, stop, enable, and inspect all init.d services'))
			]),
			E('div', { 'class': 'sh-header-meta', 'id': 'sh-services-stats' }, [
				this.renderHeaderChip(_('Total'), stats.total, '📦'),
				this.renderHeaderChip(_('Running'), stats.running, '🟢', stats.running > 0 ? 'success' : ''),
				this.renderHeaderChip(_('Enabled'), stats.enabled, '✅'),
				this.renderHeaderChip(_('Stopped'), stats.stopped, '⏹️', stats.stopped > 0 ? 'danger' : '')
			])
		]);
	},

	renderHeaderChip: function(label, value, icon, tone) {
		return E('div', { 'class': 'sh-header-chip' + (tone ? ' ' + tone : '') }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, value.toString())
			])
		]);
	},

	createStatCard: function(id, label, value, tone) {
		return E('div', { 'class': 'sh-service-stat ' + (tone || ''), 'id': id }, [
			E('span', { 'class': 'label' }, label),
			E('span', { 'class': 'value' }, value)
		]);
	},

	renderControls: function() {
		var self = this;
		var filters = [
			{ id: 'all', label: _('All') },
			{ id: 'running', label: _('Running') },
			{ id: 'stopped', label: _('Stopped') },
			{ id: 'enabled', label: _('Enabled') },
			{ id: 'disabled', label: _('Disabled') }
		];

		return E('div', { 'class': 'sh-service-controls' }, [
			E('div', { 'class': 'cyber-tablist cyber-tablist--pills sh-service-tabs' },
				filters.map(function(filter) {
					return E('button', {
						'class': 'cyber-tab cyber-tab--pill' + (self.activeFilter === filter.id ? ' is-active' : ''),
						'type': 'button',
						'data-filter': filter.id,
						'click': function() {
							self.activeFilter = filter.id;
							self.updateServicesGrid();
							self.refreshFilterTabs();
						}
					}, [
						E('span', { 'class': 'cyber-tab-label' }, filter.label)
					]);
				})),
			E('div', { 'class': 'sh-service-search' }, [
				E('input', {
					'type': 'text',
					'class': 'cbi-input-text',
					'placeholder': _('🔍 Search services...'),
					'input': function(ev) {
						self.searchQuery = (ev.target.value || '').toLowerCase();
						self.updateServicesGrid();
					}
				})
			])
		]);
	},

	refreshFilterTabs: function() {
		var tabs = document.querySelectorAll('.sh-service-tabs .cyber-tab');
		tabs.forEach(function(tab) {
			var match = tab.getAttribute('data-filter') === this.activeFilter;
			tab.classList.toggle('is-active', match);
		}, this);
	},

	getStats: function() {
		var total = this.services.length;
		var running = this.services.filter(function(s) { return s.running; }).length;
		var enabled = this.services.filter(function(s) { return s.enabled; }).length;
		var stopped = total - running;
		return { total: total, running: running, stopped: stopped, enabled: enabled, disabled: total - enabled };
	},

	getFilteredServices: function() {
		var ordered = this.services.slice().sort(function(a, b) {
			if (a.running !== b.running)
				return a.running ? -1 : 1;
			if (a.enabled !== b.enabled)
				return a.enabled ? -1 : 1;
			return (a.name || '').localeCompare(b.name || '');
		});

		return ordered.filter(function(service) {
			var matchesFilter = true;
			switch (this.activeFilter) {
				case 'running': matchesFilter = service.running; break;
				case 'stopped': matchesFilter = !service.running; break;
				case 'enabled': matchesFilter = service.enabled; break;
				case 'disabled': matchesFilter = !service.enabled; break;
			}
			var matchesSearch = !this.searchQuery ||
				(service.name || '').toLowerCase().includes(this.searchQuery);
			return matchesFilter && matchesSearch;
		}, this);
	},

	renderServiceCard: function(service) {
		var statusClass = service.running ? 'running' : 'stopped';
		var enabledLabel = service.enabled ? _('Enabled at boot') : _('Disabled');

		return E('div', { 'class': 'sh-service-card ' + statusClass }, [
			E('div', { 'class': 'sh-service-head' }, [
				E('div', {}, [
					E('h3', {}, service.name),
					E('span', { 'class': 'sh-service-tag' }, enabledLabel)
				]),
				E('span', {
					'class': 'sh-service-status ' + statusClass
				}, service.running ? _('Running') : _('Stopped'))
			]),
			E('div', { 'class': 'sh-service-actions' }, [
				this.renderActionButton(service, service.running ? 'stop' : 'start'),
				this.renderActionButton(service, 'restart'),
				this.renderActionButton(service, service.enabled ? 'disable' : 'enable'),
				E('button', {
					'class': 'sh-btn sh-btn-ghost',
					'type': 'button',
					'click': ui.createHandlerFn(this, 'showServiceDetails', service)
				}, _('Details'))
			])
		]);
	},

	renderActionButton: function(service, action) {
		var labels = {
			start: _('Start'),
			stop: _('Stop'),
			restart: _('Restart'),
			enable: _('Enable'),
			disable: _('Disable')
		};

		return E('button', {
			'class': 'sh-btn sh-btn-action',
			'type': 'button',
			'click': ui.createHandlerFn(this, 'handleServiceAction', service, action)
		}, labels[action] || action);
	},

	handleServiceAction: function(service, action) {
		ui.showModal(_('Service action'), [
			E('p', { 'class': 'spinning' }, _('Executing ') + action + ' ' + service.name + ' ...')
		]);

		return API.serviceAction({ service: service.name, action: action }).then(L.bind(function(result) {
			ui.hideModal();
			if (result && result.success === false) {
				ui.addNotification(null, E('p', {}, result.message || _('Action failed')), 'error');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Action completed')), 'info');
				return API.listServices().then(L.bind(function(fresh) {
					this.services = this.normalizeServices(fresh);
					this.updateStats();
					this.updateServicesGrid();
				}, this));
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	showServiceDetails: function(service) {
		var details = [
			{ label: _('Name'), value: service.name },
			{ label: _('Enabled'), value: service.enabled ? _('Yes') : _('No') },
			{ label: _('Running'), value: service.running ? _('Yes') : _('No') }
		];

		ui.showModal(_('Service Details'), [
			E('div', { 'class': 'sh-service-detail' },
				details.map(function(item) {
					return E('div', { 'class': 'sh-service-detail-row' }, [
						E('span', {}, item.label),
						E('strong', {}, item.value)
					]);
				})),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': ui.hideModal
				}, _('Close'))
			])
		]);
	},

	updateStats: function() {
		var stats = this.getStats();
		var ids = {
			'sh-stat-total': stats.total,
			'sh-stat-running': stats.running,
			'sh-stat-stopped': stats.stopped,
			'sh-stat-enabled': stats.enabled
		};

		Object.keys(ids).forEach(function(id) {
			var node = document.getElementById(id);
			if (node) {
				var value = node.querySelector('.value');
				if (value) value.textContent = ids[id];
			}
		});
	},

	updateServicesGrid: function() {
		var grid = document.getElementById('sh-services-grid');
		if (!grid) return;
		var filtered = this.getFilteredServices();
		if (!filtered.length) {
			dom.content(grid, [
				E('div', { 'class': 'sh-empty-state' }, [
					E('div', { 'class': 'sh-empty-icon' }, '📭'),
					E('p', {}, _('No services match the current filter'))
				])
			]);
			return;
		}
		dom.content(grid, filtered.map(this.renderServiceCard, this));
	}
});
