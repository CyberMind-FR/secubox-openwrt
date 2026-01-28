'use strict';
'require view';
'require dom';
'require ui';
'require form';
'require service-registry/api as api';

return view.extend({
	title: _('Publish Service'),

	load: function() {
		return Promise.all([
			api.listCategories(),
			api.getUnpublishedServices()
		]);
	},

	render: function(data) {
		var self = this;
		var categories = data[0].categories || [];
		var unpublished = data[1] || [];

		// Load CSS
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('service-registry/registry.css');
		document.head.appendChild(link);

		var m, s, o;

		m = new form.Map('service-registry', _('Publish New Service'),
			_('Create a new published service with HAProxy reverse proxy and/or Tor hidden service.'));

		s = m.section(form.NamedSection, '_new', 'service', _('Service Details'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'name', _('Service Name'));
		o.placeholder = 'e.g., Gitea, Nextcloud';
		o.rmempty = false;
		o.validate = function(section_id, value) {
			if (!value || value.trim() === '')
				return _('Name is required');
			if (!/^[a-zA-Z0-9\s_-]+$/.test(value))
				return _('Name can only contain letters, numbers, spaces, dashes, and underscores');
			return true;
		};

		o = s.option(form.Value, 'local_port', _('Local Port'),
			_('The port where the service is listening locally'));
		o.datatype = 'port';
		o.placeholder = '3000';
		o.rmempty = false;

		o = s.option(form.ListValue, 'category', _('Category'));
		o.value('services', _('Services'));
		categories.forEach(function(cat) {
			if (cat.id !== 'services') {
				o.value(cat.id, cat.name);
			}
		});
		o.default = 'services';

		o = s.option(form.Value, 'icon', _('Icon'),
			_('Icon name: server, music, shield, chart, git, blog, app, security, etc.'));
		o.placeholder = 'server';
		o.optional = true;

		// HAProxy section
		s = m.section(form.NamedSection, '_haproxy', 'haproxy', _('HAProxy (Clearnet)'),
			_('Configure a public domain with automatic HTTPS certificate'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable HAProxy Vhost'));
		o.default = '0';

		o = s.option(form.Value, 'domain', _('Domain'),
			_('Public domain name (must point to this server)'));
		o.placeholder = 'service.example.com';
		o.depends('enabled', '1');
		o.validate = function(section_id, value) {
			if (!value) return true;
			if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
				return _('Invalid domain format');
			return true;
		};

		o = s.option(form.Flag, 'ssl', _('Enable SSL/TLS'),
			_('Request ACME certificate automatically'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'ssl_redirect', _('Force HTTPS'),
			_('Redirect HTTP to HTTPS'));
		o.default = '1';
		o.depends('ssl', '1');

		// Tor section
		s = m.section(form.NamedSection, '_tor', 'tor', _('Tor Hidden Service'),
			_('Create a .onion address for anonymous access'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Tor Hidden Service'));
		o.default = '0';

		o = s.option(form.Value, 'virtual_port', _('Virtual Port'),
			_('The port that will be exposed on the .onion address'));
		o.datatype = 'port';
		o.default = '80';
		o.depends('enabled', '1');

		return m.render().then(function(mapEl) {
			// Add custom publish button
			var publishBtn = E('button', {
				'class': 'cbi-button cbi-button-apply',
				'style': 'margin-top: 20px;',
				'click': ui.createHandlerFn(self, 'handlePublish', m)
			}, _('Publish Service'));

			mapEl.appendChild(E('div', { 'class': 'cbi-page-actions' }, [publishBtn]));

			// Add discoverable services section
			if (unpublished.length > 0) {
				mapEl.appendChild(E('div', { 'class': 'cbi-section', 'style': 'margin-top: 30px;' }, [
					E('h3', {}, _('Discovered Services')),
					E('p', {}, _('These services are running but not yet published:')),
					E('div', { 'class': 'sr-grid' },
						unpublished.slice(0, 10).map(function(svc) {
							return self.renderDiscoveredCard(svc);
						})
					)
				]));
			}

			return mapEl;
		});
	},

	renderDiscoveredCard: function(service) {
		var self = this;
		return E('div', {
			'class': 'sr-card',
			'style': 'cursor: pointer;',
			'click': function() {
				self.prefillForm(service);
			}
		}, [
			E('div', { 'class': 'sr-card-header' }, [
				E('div', { 'class': 'sr-card-title' }, service.name || 'Port ' + service.local_port),
				E('span', { 'class': 'sr-card-status sr-status-running' }, 'running')
			]),
			E('p', { 'style': 'font-size: 0.9em; color: #666;' },
				_('Port: ') + service.local_port + ' | ' + _('Category: ') + (service.category || 'other'))
		]);
	},

	prefillForm: function(service) {
		var nameInput = document.querySelector('input[id*="name"]');
		var portInput = document.querySelector('input[id*="local_port"]');

		if (nameInput) nameInput.value = service.name || '';
		if (portInput) portInput.value = service.local_port || '';

		nameInput && nameInput.focus();
	},

	handlePublish: function(map) {
		var self = this;

		// Get form values
		var nameEl = document.querySelector('input[id*="_new"][id*="name"]');
		var portEl = document.querySelector('input[id*="_new"][id*="local_port"]');
		var categoryEl = document.querySelector('select[id*="_new"][id*="category"]');
		var iconEl = document.querySelector('input[id*="_new"][id*="icon"]');
		var haproxyEnabledEl = document.querySelector('input[id*="_haproxy"][id*="enabled"]');
		var domainEl = document.querySelector('input[id*="_haproxy"][id*="domain"]');
		var torEnabledEl = document.querySelector('input[id*="_tor"][id*="enabled"]');

		var name = nameEl ? nameEl.value.trim() : '';
		var port = portEl ? parseInt(portEl.value) : 0;
		var category = categoryEl ? categoryEl.value : 'services';
		var icon = iconEl ? iconEl.value.trim() : '';
		var haproxyEnabled = haproxyEnabledEl ? haproxyEnabledEl.checked : false;
		var domain = domainEl ? domainEl.value.trim() : '';
		var torEnabled = torEnabledEl ? torEnabledEl.checked : false;

		// Validation
		if (!name) {
			ui.addNotification(null, E('p', _('Service name is required')), 'error');
			return;
		}
		if (!port || port < 1 || port > 65535) {
			ui.addNotification(null, E('p', _('Valid port number is required')), 'error');
			return;
		}
		if (haproxyEnabled && !domain) {
			ui.addNotification(null, E('p', _('Domain is required when HAProxy is enabled')), 'error');
			return;
		}

		ui.showModal(_('Publishing Service'), [
			E('p', { 'class': 'spinning' }, _('Creating service endpoints...')),
			E('ul', {}, [
				haproxyEnabled ? E('li', {}, _('Creating HAProxy vhost for ') + domain) : null,
				haproxyEnabled ? E('li', {}, _('Requesting SSL certificate...')) : null,
				torEnabled ? E('li', {}, _('Creating Tor hidden service...')) : null
			].filter(Boolean))
		]);

		return api.publishService(
			name,
			port,
			haproxyEnabled ? domain : '',
			torEnabled,
			category,
			icon
		).then(function(result) {
			ui.hideModal();

			if (result.success) {
				self.showSuccessModal(result);
			} else {
				ui.addNotification(null, E('p', _('Failed to publish: ') + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	showSuccessModal: function(result) {
		var urls = result.urls || {};

		var content = [
			E('div', { 'style': 'text-align: center; padding: 20px;' }, [
				E('h3', { 'style': 'color: #22c55e;' }, _('Service Published!')),
				E('p', {}, result.name)
			])
		];

		var urlsDiv = E('div', { 'style': 'margin: 20px 0;' });

		if (urls.local) {
			urlsDiv.appendChild(E('div', { 'style': 'margin: 10px 0;' }, [
				E('strong', {}, _('Local: ')),
				E('code', {}, urls.local)
			]));
		}
		if (urls.clearnet) {
			urlsDiv.appendChild(E('div', { 'style': 'margin: 10px 0;' }, [
				E('strong', {}, _('Clearnet: ')),
				E('a', { 'href': urls.clearnet, 'target': '_blank' }, urls.clearnet)
			]));
		}
		if (urls.onion) {
			urlsDiv.appendChild(E('div', { 'style': 'margin: 10px 0;' }, [
				E('strong', {}, _('Onion: ')),
				E('code', { 'style': 'word-break: break-all;' }, urls.onion)
			]));
		}

		content.push(urlsDiv);

		content.push(E('div', { 'class': 'right' }, [
			E('button', {
				'class': 'cbi-button',
				'click': function() {
					ui.hideModal();
					window.location.href = L.url('admin/services/service-registry/overview');
				}
			}, _('Go to Overview')),
			E('button', {
				'class': 'cbi-button cbi-button-apply',
				'click': function() {
					ui.hideModal();
					window.location.reload();
				}
			}, _('Publish Another'))
		]));

		ui.showModal(_('Success'), content);
	}
});
