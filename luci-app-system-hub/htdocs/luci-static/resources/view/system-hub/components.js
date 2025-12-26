'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require system-hub.api as API';
'require system-hub.theme as Theme';

return view.extend({
	componentsData: [],
	currentFilter: 'all',

	load: function() {
		return Promise.all([
			API.getComponents(),
			Theme.getTheme()
		]);
	},

	render: function(data) {
		var components = (data[0] && data[0].modules) || [];
		var theme = data[1];

		this.componentsData = components;

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/components.css') }),

			// Header with filter tabs
			E('div', { 'class': 'sh-components-header' }, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-title-icon' }, '🧩'),
					' System Components'
				]),
				this.renderFilterTabs()
			]),

			// Components grid
			E('div', { 'class': 'sh-components-grid', 'id': 'components-grid' },
				this.renderComponentsGrid(components, this.currentFilter)
			)
		]);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			return API.getComponents().then(L.bind(function(result) {
				if (result && result.modules) {
					this.componentsData = result.modules;
					this.updateComponentsGrid();
				}
			}, this));
		}, this), 30);

		return view;
	},

	renderFilterTabs: function() {
		var self = this;
		var tabs = [
			{ id: 'all', label: 'All Components', icon: '📦' },
			{ id: 'security', label: 'Security', icon: '🛡️' },
			{ id: 'monitoring', label: 'Monitoring', icon: '📊' },
			{ id: 'network', label: 'Network', icon: '🌐' },
			{ id: 'system', label: 'System', icon: '⚙️' }
		];

		return E('div', { 'class': 'sh-filter-tabs' },
			tabs.map(function(tab) {
				return E('button', {
					'class': 'sh-filter-tab' + (self.currentFilter === tab.id ? ' active' : ''),
					'click': function(ev) {
						self.handleFilterChange(tab.id, ev.target);
					}
				}, [
					E('span', { 'class': 'sh-tab-icon' }, tab.icon),
					E('span', { 'class': 'sh-tab-label' }, tab.label)
				]);
			})
		);
	},

	handleFilterChange: function(filterId, targetElement) {
		this.currentFilter = filterId;

		// Update active tab
		var tabs = document.querySelectorAll('.sh-filter-tab');
		tabs.forEach(function(tab) {
			tab.classList.remove('active');
		});
		targetElement.closest('.sh-filter-tab').classList.add('active');

		// Update grid
		this.updateComponentsGrid();
	},

	renderComponentsGrid: function(components, filter) {
		var filtered = filter === 'all'
			? components
			: components.filter(function(c) { return c.category === filter; });

		if (filtered.length === 0) {
			return E('div', { 'class': 'sh-empty-state' }, [
				E('div', { 'class': 'sh-empty-icon' }, '📦'),
				E('div', { 'class': 'sh-empty-text' },
					filter === 'all'
						? 'No components found'
						: 'No ' + filter + ' components found')
			]);
		}

		return filtered.map(L.bind(this.renderComponentCard, this));
	},

	renderComponentCard: function(component) {
		var self = this;
		var isRunning = component.running;
		var isInstalled = component.installed;
		var statusClass = isRunning ? 'running' : (isInstalled ? 'stopped' : 'not-installed');

		return E('div', {
			'class': 'sh-component-card sh-component-' + statusClass,
			'style': 'border-left: 4px solid ' + (component.color || '#64748b')
		}, [
			E('div', { 'class': 'sh-component-card-header' }, [
				E('div', { 'class': 'sh-component-icon' }, component.icon || '📦'),
				E('div', { 'class': 'sh-component-info' }, [
					E('h3', { 'class': 'sh-component-name' }, component.name || component.id),
					E('div', { 'class': 'sh-component-meta' }, [
						E('span', { 'class': 'sh-component-version' },
							'v' + (component.version || '0.0.9')),
						E('span', { 'class': 'sh-component-category' },
							component.category || 'other')
					])
				]),
				E('div', {
					'class': 'sh-status-indicator sh-status-' + statusClass,
					'title': isRunning ? 'Running' : (isInstalled ? 'Stopped' : 'Not Installed')
				})
			]),

			E('div', { 'class': 'sh-component-card-body' }, [
				E('p', { 'class': 'sh-component-description' },
					component.description || 'System component')
			]),

			E('div', { 'class': 'sh-component-card-actions' },
				this.renderComponentActions(component)
			)
		]);
	},

	renderComponentActions: function(component) {
		var self = this;
		var actions = [];

		if (component.installed) {
			if (component.running) {
				// Stop button
				actions.push(
					E('button', {
						'class': 'sh-action-btn sh-btn-danger',
						'click': function() { self.handleComponentAction(component.id, 'stop'); }
					}, [
						E('span', {}, '⏹️'),
						' Stop'
					])
				);

				// Restart button
				actions.push(
					E('button', {
						'class': 'sh-action-btn sh-btn-warning',
						'click': function() { self.handleComponentAction(component.id, 'restart'); }
					}, [
						E('span', {}, '🔄'),
						' Restart'
					])
				);

				// Dashboard button (if has dashboard)
				if (component.package && component.package.includes('dashboard')) {
					var dashboardUrl = '/cgi-bin/luci/admin/secubox/' + component.category + '/' + component.id;
					actions.push(
						E('a', {
							'class': 'sh-action-btn sh-btn-primary',
							'href': dashboardUrl
						}, [
							E('span', {}, '📊'),
							' Dashboard'
						])
					);
				}
			} else {
				// Start button
				actions.push(
					E('button', {
						'class': 'sh-action-btn sh-btn-success',
						'click': function() { self.handleComponentAction(component.id, 'start'); }
					}, [
						E('span', {}, '▶️'),
						' Start'
					])
				);
			}
		} else {
			// Install button
			actions.push(
				E('button', {
					'class': 'sh-action-btn sh-btn-secondary',
					'disabled': 'disabled',
					'title': 'Manual installation required'
				}, [
					E('span', {}, '📥'),
					' Not Installed'
				])
			);
		}

		return actions;
	},

	handleComponentAction: function(componentId, action) {
		var self = this;

		ui.showModal(_('Component Action'), [
			E('p', {}, 'Performing ' + action + ' on ' + componentId + '...'),
			E('div', { 'class': 'spinning' })
		]);

		// Call service action via system-hub API
		API.serviceAction(componentId, action).then(function(result) {
			ui.hideModal();

			if (result && result.success) {
				ui.addNotification(null,
					E('p', {}, '✅ ' + componentId + ' ' + action + ' successful'),
					'success');

				// Refresh components
				setTimeout(function() {
					self.updateComponentsGrid();
				}, 2000);
			} else {
				ui.addNotification(null,
					E('p', {}, '❌ Failed to ' + action + ' ' + componentId),
					'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null,
				E('p', {}, '❌ Error: ' + (err.message || err)),
				'error');
		});
	},

	updateComponentsGrid: function() {
		var grid = document.getElementById('components-grid');
		if (grid) {
			dom.content(grid, this.renderComponentsGrid(this.componentsData, this.currentFilter));
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
