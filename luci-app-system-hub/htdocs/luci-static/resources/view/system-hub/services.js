'use strict';
'require view';
'require ui';
'require dom';
'require system-hub/api as API';
'require system-hub/theme as Theme';

return view.extend({
	services: [],
	currentFilter: 'all',
	searchQuery: '',

	load: function() {
		return Promise.all([
			API.listServices(),
			Theme.getTheme()
		]);
	},

	render: function(data) {
		this.services = data[0] || [];
		var theme = data[1];

		var container = E('div', { 'class': 'system-hub-services' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/services.css') }),

			// Header with stats
			this.renderHeader(),

			// Filter tabs
			this.renderFilterTabs(),

			// Search box
			this.renderSearchBox(),

			// Services grid
			E('div', { 'class': 'sh-services-grid', 'id': 'services-grid' })
		]);

		// Initial render
		this.updateServicesGrid();

		return container;
	},

	renderHeader: function() {
		var stats = this.getStats();

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '⚙️'),
					'System Services'
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					'Manage system services: start, stop, restart, enable, or disable')
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value', 'style': 'color: #22c55e;' }, stats.running),
					E('div', { 'class': 'sh-stat-label' }, 'Running')
				]),
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value', 'style': 'color: #ef4444;' }, stats.stopped),
					E('div', { 'class': 'sh-stat-label' }, 'Stopped')
				]),
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value', 'style': 'color: #6366f1;' }, stats.enabled),
					E('div', { 'class': 'sh-stat-label' }, 'Enabled')
				]),
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value' }, stats.total),
					E('div', { 'class': 'sh-stat-label' }, 'Total')
				])
			])
		]);
	},

	renderFilterTabs: function() {
		var self = this;
		var stats = this.getStats();

		return E('div', { 'class': 'sh-filter-tabs' }, [
			this.createFilterTab('all', '📋', 'All Services', stats.total),
			this.createFilterTab('running', '▶️', 'Running', stats.running),
			this.createFilterTab('stopped', '⏹️', 'Stopped', stats.stopped),
			this.createFilterTab('enabled', '✓', 'Enabled', stats.enabled),
			this.createFilterTab('disabled', '✗', 'Disabled', stats.disabled)
		]);
	},

	createFilterTab: function(filter, icon, label, count) {
		var self = this;
		var isActive = this.currentFilter === filter;

		return E('div', {
			'class': 'sh-filter-tab' + (isActive ? ' active' : ''),
			'click': function() {
				self.currentFilter = filter;
				self.updateFilterTabs();
				self.updateServicesGrid();
			}
		}, [
			E('span', { 'class': 'sh-tab-icon' }, icon),
			E('span', { 'class': 'sh-tab-label' }, label + ' (' + count + ')')
		]);
	},

	renderSearchBox: function() {
		var self = this;

		return E('div', { 'style': 'margin-bottom: 24px;' }, [
			E('input', {
				'type': 'text',
				'class': 'cbi-input-text',
				'placeholder': '🔍 Search services...',
				'style': 'width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--sh-border); background: var(--sh-bg-card); color: var(--sh-text-primary); font-size: 14px;',
				'input': function(ev) {
					self.searchQuery = ev.target.value.toLowerCase();
					self.updateServicesGrid();
				}
			})
		]);
	},

	updateFilterTabs: function() {
		var tabs = document.querySelectorAll('.sh-filter-tab');
		tabs.forEach(function(tab, index) {
			var filters = ['all', 'running', 'stopped', 'enabled', 'disabled'];
			if (filters[index] === this.currentFilter) {
				tab.classList.add('active');
			} else {
				tab.classList.remove('active');
			}
		}.bind(this));
	},

	updateServicesGrid: function() {
		var grid = document.getElementById('services-grid');
		if (!grid) return;

		var filtered = this.getFilteredServices();

		if (filtered.length === 0) {
			dom.content(grid, [
				E('div', { 'class': 'sh-empty-state' }, [
					E('div', { 'class': 'sh-empty-icon' }, '📭'),
					E('div', { 'class': 'sh-empty-text' },
						this.searchQuery ? 'No services match your search' : 'No services found')
				])
			]);
			return;
		}

		dom.content(grid, filtered.map(this.renderServiceCard, this));
	},

	getFilteredServices: function() {
		return this.services.filter(function(service) {
			// Apply filter
			var matchesFilter = true;
			switch (this.currentFilter) {
				case 'running':
					matchesFilter = service.running;
					break;
				case 'stopped':
					matchesFilter = !service.running;
					break;
				case 'enabled':
					matchesFilter = service.enabled;
					break;
				case 'disabled':
					matchesFilter = !service.enabled;
					break;
			}

			// Apply search
			var matchesSearch = !this.searchQuery ||
				service.name.toLowerCase().includes(this.searchQuery);

			return matchesFilter && matchesSearch;
		}.bind(this));
	},

	renderServiceCard: function(service) {
		var statusClass = service.running ? 'ok' : 'error';
		var statusIcon = service.running ? '▶️' : '⏹️';
		var statusText = service.running ? 'Running' : 'Stopped';
		var enabledIcon = service.enabled ? '✓' : '✗';
		var enabledText = service.enabled ? 'Enabled' : 'Disabled';

		return E('div', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('h3', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '⚙️'),
					service.name
				]),
				E('div', { 'class': 'sh-card-badge sh-status-badge sh-status-' + statusClass }, [
					statusIcon + ' ' + statusText
				])
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 16px;' }, [
					E('span', { 'style': 'font-size: 16px;' }, enabledIcon),
					E('span', { 'style': 'font-weight: 600; color: var(--sh-text-secondary);' },
						'Autostart: ' + enabledText)
				]),
				E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' },
					this.renderActionButtons(service)
				)
			])
		]);
	},

	renderActionButtons: function(service) {
		var buttons = [];

		// Start button (only if stopped)
		if (!service.running) {
			buttons.push(E('button', {
				'class': 'sh-btn sh-btn-success',
				'click': L.bind(this.performAction, this, service.name, 'start')
			}, [
				E('span', {}, '▶️'),
				E('span', {}, 'Start')
			]));
		}

		// Stop button (only if running)
		if (service.running) {
			buttons.push(E('button', {
				'class': 'sh-btn sh-btn-danger',
				'click': L.bind(this.performAction, this, service.name, 'stop')
			}, [
				E('span', {}, '⏹️'),
				E('span', {}, 'Stop')
			]));
		}

		// Restart button
		buttons.push(E('button', {
			'class': 'sh-btn sh-btn-warning',
			'click': L.bind(this.performAction, this, service.name, 'restart')
		}, [
			E('span', {}, '🔄'),
			E('span', {}, 'Restart')
		]));

		// Enable/Disable button
		if (service.enabled) {
			buttons.push(E('button', {
				'class': 'sh-btn sh-btn-secondary',
				'click': L.bind(this.performAction, this, service.name, 'disable')
			}, [
				E('span', {}, '✗'),
				E('span', {}, 'Disable')
			]));
		} else {
			buttons.push(E('button', {
				'class': 'sh-btn sh-btn-primary',
				'click': L.bind(this.performAction, this, service.name, 'enable')
			}, [
				E('span', {}, '✓'),
				E('span', {}, 'Enable')
			]));
		}

		return buttons;
	},

	getStats: function() {
		var stats = {
			total: this.services.length,
			running: 0,
			stopped: 0,
			enabled: 0,
			disabled: 0
		};

		this.services.forEach(function(service) {
			if (service.running) stats.running++;
			else stats.stopped++;
			if (service.enabled) stats.enabled++;
			else stats.disabled++;
		});

		return stats;
	},

	performAction: function(service, action) {
		ui.showModal(_('Performing Action'), [
			E('p', { 'class': 'spinning' }, _('Executing %s on service %s...').format(action, service))
		]);

		API.serviceAction(service, action).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', '✓ ' + result.message), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', '✗ ' + result.message), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Action failed: ') + err.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
