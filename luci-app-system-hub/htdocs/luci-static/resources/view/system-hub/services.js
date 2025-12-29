'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require system-hub/api as API';
'require secubox-theme/theme as Theme';
'require system-hub/nav as HubNav';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

return view.extend({
	services: [],
	activeFilter: 'all',
	searchQuery: '',

	load: function() {
		return API.listServices();
	},

	render: function(data) {
		this.services = this.normalizeServices(data);

		var container = E('div', { 'class': 'sh-services-view' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/services.css') }),
			HubNav.renderTabs('services'),
			this.renderHeader(),
			this.renderControls(),
			E('div', { 'class': 'sh-services-grid', 'id': 'sh-services-grid' },
				this.getFilteredServices().map(this.renderServiceCard, this))
		]);

		var self = this;
		poll.add(function() {
			return API.listServices().then(function(fresh) {
				self.services = self.normalizeServices(fresh);
				self.updateStats();
				self.updateServicesGrid();
			});
		}, 30);

		return container;
	},

	normalizeServices: function(data) {
		if (!data) return [];
		if (Array.isArray(data)) return data;
		if (Array.isArray(data.services)) return data.services;
		return [];
	},

	renderHeader: function() {
		var stats = this.getStats();

		return E('section', { 'class': 'sh-services-hero' }, [
			E('div', {}, [
				E('h1', {}, _('Service Control Center')),
				E('p', {}, _('Start, stop, enable, and inspect all init.d services'))
			]),
			E('div', { 'class': 'sh-services-stats', 'id': 'sh-services-stats' }, [
				this.createStatCard('sh-stat-total', _('Total'), stats.total),
				this.createStatCard('sh-stat-running', _('Running'), stats.running, 'success'),
				this.createStatCard('sh-stat-stopped', _('Stopped'), stats.stopped, 'danger'),
				this.createStatCard('sh-stat-enabled', _('Enabled'), stats.enabled, 'info')
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
		return this.services.filter(function(service) {
			var matchesFilter = true;
			switch (this.activeFilter) {
				case 'running': matchesFilter = service.running; break;
				case 'stopped': matchesFilter = !service.running; break;
				case 'enabled': matchesFilter = service.enabled; break;
				case 'disabled': matchesFilter = !service.enabled; break;
			}
			var matchesSearch = !this.searchQuery ||
				service.name.toLowerCase().includes(this.searchQuery);
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
