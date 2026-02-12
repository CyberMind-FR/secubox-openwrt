'use strict';
'require view';
'require ui';
'require poll';
'require dom';
'require vhost-manager/api as API';
'require secubox-theme/theme as Theme';
'require vhost-manager/ui as VHostUI';
'require request';
'require secubox/kiss-theme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var SERVICES = [];

return view.extend({
	vhostsData: [],
	templatesData: [],
	activeServices: {},

	load: function() {
		return Promise.all([
			API.listVHosts(),
			this.loadTemplates()
		]);
	},

	loadTemplates: function() {
		return request.get(L.resource('vhost-manager/templates.json')).then(function(response) {
			try {
				var data = JSON.parse(response.responseText || '{}');
				SERVICES = (data.templates || []).map(function(t) {
					return {
						id: t.id,
						icon: t.icon,
						name: t.name,
						domain: t.domain,
						backend: t.backend,
						port: t.port,
						category: t.category,
						description: t.description,
						app_id: t.app_id,
						enabled_by_default: t.enabled_by_default,
						requires_ssl: t.requires_ssl,
						requires_auth: t.requires_auth,
						websocket_support: t.websocket_support,
						notes: t.notes
					};
				});
				return SERVICES;
			} catch(e) {
				console.error('Failed to parse vhost templates:', e);
				return [];
			}
		}).catch(function(err) {
			console.error('Failed to load vhost templates:', err);
			return [];
		});
	},

	render: function(data) {
		this.vhostsData = data[0] || [];
		this.templatesData = data[1] || SERVICES;
		this.updateActiveServices();

		return KissTheme.wrap([
			E('div', { 'class': 'vhost-page' }, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
				VHostUI.renderTabs('internal'),
				this.renderDashboard()
			])
		], 'admin/services/vhost/internal');
	},

	renderDashboard: function() {
		// Start polling for auto-refresh
		poll.add(L.bind(this.pollData, this), 10);

		return E('div', { 'class': 'internal-services-dashboard' }, [
			this.renderHeader(),
			this.renderActiveServices(),
			this.renderServiceTemplates()
		]);
	},

	updateActiveServices: function() {
		this.activeServices = {};
		var self = this;

		this.vhostsData.forEach(function(vhost) {
			// Match VHost to template by domain
			var template = SERVICES.find(function(s) {
				return s.domain === vhost.domain;
			});

			if (template) {
				self.activeServices[template.id] = {
					vhost: vhost,
					template: template,
					enabled: vhost.enabled !== false
				};
			}
		});
	},

	renderHeader: function() {
		var activeCount = Object.keys(this.activeServices).filter(function(id) {
			return this.activeServices[id].enabled;
		}, this).length;

		var configuredCount = Object.keys(this.activeServices).length;

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🏠'),
					_('Internal Service Catalog')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Pre-built recipes for publishing popular LAN services with SSL, auth, and redirects.'))
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				this.renderStat(activeCount, _('Active'), 'success'),
				this.renderStat(configuredCount, _('Configured'), 'info'),
				this.renderStat(SERVICES.length, _('Available'), 'primary')
			])
		]);
	},

	renderStat: function(value, label, color) {
		return E('div', { 'class': 'sh-stat-badge sh-stat-' + (color || 'default') }, [
			E('div', { 'class': 'sh-stat-value' }, value.toString()),
			E('div', { 'class': 'sh-stat-label' }, label)
		]);
	},

	renderActiveServices: function() {
		var activeList = Object.keys(this.activeServices).map(function(id) {
			return this.activeServices[id];
		}, this);

		if (activeList.length === 0) {
			return E('div', { 'class': 'vhost-section' }, [
				E('h3', {}, _('Active Services')),
				E('div', { 'class': 'empty-state' }, [
					E('p', {}, _('No services configured yet. Use templates below to publish internal services.'))
				])
			]);
		}

		return E('div', { 'class': 'vhost-section' }, [
			E('h3', {}, _('Active Services')),
			E('div', {
				'class': 'vhost-card-grid',
				'id': 'active-services-grid'
			}, activeList.map(L.bind(this.renderActiveServiceCard, this)))
		]);
	},

	renderActiveServiceCard: function(service) {
		var isEnabled = service.enabled;
		var statusClass = isEnabled ? 'status-active' : 'status-disabled';
		var template = service.template;
		var vhost = service.vhost;

		return E('div', {
			'class': 'vhost-card ' + statusClass,
			'data-service-id': template.id
		}, [
			E('div', { 'class': 'vhost-card-header' }, [
				E('div', { 'class': 'vhost-card-title' }, [
					E('span', { 'class': 'service-icon' }, template.icon),
					template.name
				]),
				E('span', {
					'class': 'status-badge ' + statusClass
				}, isEnabled ? _('Active') : _('Disabled'))
			]),
			E('div', { 'class': 'vhost-card-body' }, [
				E('div', { 'class': 'service-category' }, template.category),
				E('p', { 'class': 'service-description' }, template.description),
				E('div', { 'class': 'service-info' }, [
					E('div', { 'class': 'info-row' }, [
						E('strong', {}, _('Domain: ')),
						E('code', {}, template.domain)
					]),
					E('div', { 'class': 'info-row' }, [
						E('strong', {}, _('Backend: ')),
						E('code', {}, template.backend)
					]),
					E('div', { 'class': 'info-row' }, [
						E('strong', {}, _('Port: ')),
						E('span', {}, template.port)
					])
				]),
				this.renderServiceFeatures(template)
			]),
			E('div', { 'class': 'vhost-actions' }, [
				E('button', {
					'class': 'sh-btn-secondary',
					'click': L.bind(this.handleEditService, this, vhost)
				}, _('Edit')),
				E('button', {
					'class': isEnabled ? 'sh-btn-warning' : 'sh-btn-success',
					'click': L.bind(this.handleToggleService, this, vhost)
				}, isEnabled ? _('Disable') : _('Enable')),
				E('button', {
					'class': 'sh-btn-negative',
					'click': L.bind(this.handleRemoveService, this, vhost, template)
				}, _('Remove'))
			])
		]);
	},

	renderServiceFeatures: function(template) {
		var features = [];

		if (template.requires_ssl) {
			features.push(E('span', { 'class': 'feature-badge feature-ssl' }, '🔒 SSL'));
		}
		if (template.requires_auth) {
			features.push(E('span', { 'class': 'feature-badge feature-auth' }, '🔐 Auth'));
		}
		if (template.websocket_support) {
			features.push(E('span', { 'class': 'feature-badge feature-ws' }, '⚡ WebSocket'));
		}

		if (features.length === 0) {
			return null;
		}

		return E('div', { 'class': 'service-features' }, features);
	},

	renderServiceTemplates: function() {
		var categories = {};

		// Group templates by category
		SERVICES.forEach(function(template) {
			if (!categories[template.category]) {
				categories[template.category] = [];
			}
			categories[template.category].push(template);
		});

		var sections = [];
		for (var category in categories) {
			sections.push(E('div', { 'class': 'template-category' }, [
				E('h4', { 'class': 'category-title' }, category),
				E('div', { 'class': 'vhost-card-grid' },
					categories[category].map(L.bind(this.renderTemplateCard, this))
				)
			]));
		}

		return E('div', { 'class': 'vhost-section' }, [
			E('h3', {}, _('Service Templates')),
			E('div', { 'class': 'templates-container' }, sections)
		]);
	},

	renderTemplateCard: function(template) {
		var isActive = !!this.activeServices[template.id];

		return E('div', {
			'class': 'vhost-card template-card' + (isActive ? ' template-active' : ''),
			'data-template-id': template.id
		}, [
			E('div', { 'class': 'vhost-card-title' }, [
				E('span', { 'class': 'template-icon' }, template.icon),
				template.name
			]),
			E('div', { 'class': 'vhost-card-meta' }, template.category),
			E('p', { 'class': 'vhost-card-meta' }, template.description),
			E('div', { 'class': 'template-details' }, [
				E('div', { 'class': 'detail-row' }, [
					E('strong', {}, _('Domain: ')),
					E('code', {}, template.domain)
				]),
				E('div', { 'class': 'detail-row' }, [
					E('strong', {}, _('Port: ')),
					E('span', {}, template.port)
				])
			]),
			this.renderServiceFeatures(template),
			template.notes ? E('div', { 'class': 'template-notes' }, [
				E('small', {}, '💡 ' + template.notes)
			]) : null,
			E('div', { 'class': 'vhost-actions' }, [
				isActive
					? E('button', {
						'class': 'sh-btn-warning',
						'click': L.bind(this.handleDeactivateService, this, template)
					}, _('Deactivate'))
					: E('button', {
						'class': 'sh-btn-primary',
						'click': L.bind(this.handleActivateService, this, template)
					}, _('Activate'))
			])
		]);
	},

	handleActivateService: function(template, ev) {
		ui.showModal(_('Activate Service'), [
			E('p', {}, _('This will create a VHost configuration for:')),
			E('div', { 'style': 'margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 4px;' }, [
				E('div', { 'style': 'margin: 0.5rem 0;' }, [
					E('strong', {}, template.icon + ' ' + template.name)
				]),
				E('div', { 'style': 'margin: 0.5rem 0;' }, [
					E('strong', {}, _('Domain: ')),
					E('code', {}, template.domain)
				]),
				E('div', { 'style': 'margin: 0.5rem 0;' }, [
					E('strong', {}, _('Backend: ')),
					E('code', {}, template.backend)
				]),
				E('div', { 'style': 'margin: 0.5rem 0;' }, [
					E('strong', {}, _('Features: '))
				]),
				E('div', { 'style': 'margin: 0.5rem 0; padding-left: 1rem;' }, [
					template.requires_ssl ? E('div', {}, '• SSL/TLS required') : null,
					template.requires_auth ? E('div', {}, '• Authentication required') : null,
					template.websocket_support ? E('div', {}, '• WebSocket support') : null
				].filter(function(e) { return e !== null; })),
				template.notes ? E('div', { 'style': 'margin: 1rem 0; padding: 0.5rem; background: #fff3cd; border-radius: 4px;' }, [
					E('small', {}, '💡 ' + template.notes)
				]) : null
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-action',
					'click': L.bind(function() {
						ui.hideModal();
						this.createServiceFromTemplate(template);
					}, this)
				}, _('Activate'))
			])
		], 'cbi-modal');
	},

	handleDeactivateService: function(template, ev) {
		var service = this.activeServices[template.id];
		if (!service) return;

		ui.showModal(_('Deactivate Service'), [
			E('p', {}, _('Are you sure you want to deactivate this service?')),
			E('div', { 'style': 'margin: 1rem 0;' }, [
				E('strong', {}, template.icon + ' ' + template.name)
			]),
			E('p', { 'style': 'margin: 1rem 0; color: #856404; background: #fff3cd; padding: 0.75rem; border-radius: 4px;' },
				_('This will remove the VHost configuration. The service itself will not be uninstalled.')),
			E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': L.bind(function() {
						ui.hideModal();
						this.deleteService(service.vhost['.name']);
					}, this)
				}, _('Deactivate'))
			])
		], 'cbi-modal');
	},

	createServiceFromTemplate: function(template) {
		ui.showModal(_('Creating Service...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		var vhostConfig = {
			section_id: template.id,
			domain: template.domain,
			backend: template.backend,
			enabled: template.enabled_by_default !== false,
			tls_mode: template.requires_ssl ? 'acme' : 'off',
			comment: 'Auto-created from template: ' + template.name
		};

		// Add WebSocket support if needed
		if (template.websocket_support) {
			vhostConfig.websocket_enabled = true;
		}

		return API.createVHost(vhostConfig).then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Service activated successfully')), 'info');
				this.refreshData();
			} else {
				ui.addNotification(null, E('p', _('Failed to activate service: ') + (result.error || 'Unknown error')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	deleteService: function(vhostId) {
		ui.showModal(_('Deactivating Service...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		return API.deleteVHost(vhostId).then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Service deactivated successfully')), 'info');
				this.refreshData();
			} else {
				ui.addNotification(null, E('p', _('Failed to deactivate service: ') + (result.error || 'Unknown error')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	handleEditService: function(vhost, ev) {
		window.location.href = L.url('admin', 'secubox', 'services', 'vhosts', 'vhosts');
	},

	handleToggleService: function(vhost, ev) {
		var newState = !(vhost.enabled !== false);

		return API.updateVHost(vhost['.name'], {
			enabled: newState
		}).then(L.bind(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', newState ? _('Service enabled') : _('Service disabled')), 'info');
				this.refreshData();
			} else {
				ui.addNotification(null, E('p', _('Failed to update service')), 'error');
			}
		}, this));
	},

	handleRemoveService: function(vhost, template, ev) {
		ui.showModal(_('Remove Service'), [
			E('p', {}, _('Are you sure you want to remove this service configuration?')),
			E('div', { 'style': 'margin: 1rem 0;' }, [
				E('strong', {}, template.icon + ' ' + template.name)
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': L.bind(function() {
						ui.hideModal();
						this.deleteService(vhost['.name']);
					}, this)
				}, _('Remove'))
			])
		], 'cbi-modal');
	},

	pollData: function() {
		return this.refreshData();
	},

	refreshData: function() {
		return Promise.all([
			API.listVHosts(),
			Promise.resolve(SERVICES)
		]).then(L.bind(function(data) {
			this.vhostsData = data[0] || [];
			this.templatesData = data[1] || [];
			this.updateActiveServices();
			this.updateDisplay();
		}, this));
	},

	updateDisplay: function() {
		var dashboard = document.querySelector('.internal-services-dashboard');
		if (!dashboard) return;

		// Re-render dashboard
		dom.content(dashboard, [
			this.renderHeader(),
			this.renderActiveServices(),
			this.renderServiceTemplates()
		]);
	}
});
