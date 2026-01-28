'use strict';
'require view';
'require dom';
'require ui';
'require form';
'require service-registry/api as api';

// Category icons
var catIcons = {
	'proxy': '🌐', 'privacy': '🧅', 'system': '⚙️', 'app': '📱',
	'media': '🎵', 'security': '🔐', 'container': '📦', 'services': '🖥️',
	'monitoring': '📊', 'other': '🔗'
};

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
		var categories = (data[0] && data[0].categories) || [];
		var unpublished = data[1] || [];

		// Inject styles
		var style = document.createElement('style');
		style.textContent = this.getStyles();
		document.head.appendChild(style);

		var m, s, o;

		m = new form.Map('service-registry', '📤 ' + _('Publish New Service'),
			_('Create a new published service with HAProxy reverse proxy and/or Tor hidden service.'));

		s = m.section(form.NamedSection, '_new', 'service', '📋 ' + _('Service Details'));
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
		o.value('services', '🖥️ Services');
		categories.forEach(function(cat) {
			if (cat.id !== 'services') {
				var icon = catIcons[cat.id] || '🔗';
				o.value(cat.id, icon + ' ' + cat.name);
			}
		});
		o.default = 'services';

		o = s.option(form.Value, 'icon', _('Icon'),
			_('Icon name: server, music, shield, chart, git, blog, app, security, etc.'));
		o.placeholder = 'server';
		o.optional = true;

		// HAProxy section
		s = m.section(form.NamedSection, '_haproxy', 'haproxy', '🌐 ' + _('HAProxy (Clearnet)'),
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

		o = s.option(form.Flag, 'ssl', _('🔒 Enable SSL/TLS'),
			_('Request ACME certificate automatically'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'ssl_redirect', _('Force HTTPS'),
			_('Redirect HTTP to HTTPS'));
		o.default = '1';
		o.depends('ssl', '1');

		// Tor section
		s = m.section(form.NamedSection, '_tor', 'tor', '🧅 ' + _('Tor Hidden Service'),
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
				'style': 'margin-top: 20px; font-size: 1.1em; padding: 10px 25px;',
				'click': ui.createHandlerFn(self, 'handlePublish', m)
			}, '📤 ' + _('Publish Service'));

			mapEl.appendChild(E('div', { 'class': 'cbi-page-actions' }, [publishBtn]));

			// Add discoverable services section
			if (unpublished.length > 0) {
				mapEl.appendChild(E('div', { 'class': 'cbi-section', 'style': 'margin-top: 30px;' }, [
					E('h3', { 'class': 'pub-section-title' }, '🔍 ' + _('Discovered Services') + ' (' + unpublished.length + ')'),
					E('p', { 'class': 'pub-hint' }, _('Click a service to pre-fill the form above')),
					E('div', { 'class': 'pub-list' },
						unpublished.slice(0, 15).map(function(svc) {
							return self.renderDiscoveredRow(svc);
						})
					)
				]));
			}

			return mapEl;
		});
	},

	renderDiscoveredRow: function(service) {
		var self = this;
		var catIcon = catIcons[service.category] || '🔗';
		var statusIcon = service.status === 'running' ? '🟢' : service.status === 'stopped' ? '🔴' : '🟡';

		return E('div', {
			'class': 'pub-row',
			'click': function() {
				self.prefillForm(service);
			}
		}, [
			E('span', { 'class': 'pub-col-status', 'title': service.status }, statusIcon),
			E('span', { 'class': 'pub-col-icon' }, catIcon),
			E('span', { 'class': 'pub-col-name' }, [
				E('strong', {}, service.name || 'Port ' + service.local_port),
				service.local_port ? E('span', { 'class': 'pub-port' }, ':' + service.local_port) : null
			]),
			E('span', { 'class': 'pub-col-cat' }, service.category || 'other'),
			E('span', { 'class': 'pub-col-action' }, [
				E('button', {
					'class': 'pub-btn',
					'title': 'Use this service',
					'click': function(ev) {
						ev.stopPropagation();
						self.prefillForm(service);
					}
				}, '➡️')
			])
		]);
	},

	prefillForm: function(service) {
		// Use specific selectors matching the form section
		var nameInput = document.querySelector('input[id*="_new"][id*="name"]');
		var portInput = document.querySelector('input[id*="_new"][id*="local_port"]');
		var categorySelect = document.querySelector('select[id*="_new"][id*="category"]');
		var iconInput = document.querySelector('input[id*="_new"][id*="icon"]');

		// Set values and trigger change events for LuCI bindings
		if (nameInput) {
			nameInput.value = service.name || '';
			nameInput.dispatchEvent(new Event('input', { bubbles: true }));
			nameInput.dispatchEvent(new Event('change', { bubbles: true }));
		}
		if (portInput) {
			portInput.value = service.local_port || '';
			portInput.dispatchEvent(new Event('input', { bubbles: true }));
			portInput.dispatchEvent(new Event('change', { bubbles: true }));
		}
		if (categorySelect && service.category) {
			for (var i = 0; i < categorySelect.options.length; i++) {
				if (categorySelect.options[i].value === service.category) {
					categorySelect.selectedIndex = i;
					categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
					break;
				}
			}
		}
		if (iconInput && service.icon) {
			iconInput.value = service.icon;
			iconInput.dispatchEvent(new Event('input', { bubbles: true }));
		}

		// Scroll to form and focus
		var formSection = document.querySelector('.cbi-section');
		if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
		setTimeout(function() { nameInput && nameInput.focus(); }, 300);

		ui.addNotification(null, E('p', '✅ ' + _('Form pre-filled with ') + (service.name || 'Port ' + service.local_port)), 'info');
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
			ui.addNotification(null, E('p', '❌ ' + _('Service name is required')), 'error');
			return;
		}
		if (!port || port < 1 || port > 65535) {
			ui.addNotification(null, E('p', '❌ ' + _('Valid port number is required')), 'error');
			return;
		}
		if (haproxyEnabled && !domain) {
			ui.addNotification(null, E('p', '❌ ' + _('Domain is required when HAProxy is enabled')), 'error');
			return;
		}

		var steps = [];
		if (haproxyEnabled) steps.push('🌐 Creating HAProxy vhost for ' + domain);
		if (haproxyEnabled) steps.push('🔒 Requesting SSL certificate...');
		if (torEnabled) steps.push('🧅 Creating Tor hidden service...');

		ui.showModal('📤 ' + _('Publishing Service'), [
			E('p', { 'class': 'spinning' }, _('Creating service endpoints...')),
			E('ul', { 'style': 'margin-top: 15px;' }, steps.map(function(s) { return E('li', {}, s); }))
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
				ui.addNotification(null, E('p', '❌ ' + _('Failed to publish: ') + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', '❌ ' + _('Error: ') + err.message), 'error');
		});
	},

	showSuccessModal: function(result) {
		var urls = result.urls || {};

		var content = [
			E('div', { 'style': 'text-align: center; padding: 20px;' }, [
				E('div', { 'style': 'font-size: 3em; margin-bottom: 10px;' }, '✅'),
				E('h3', { 'style': 'color: #22c55e; margin: 0;' }, _('Service Published!')),
				E('p', { 'style': 'font-size: 1.2em; margin-top: 10px;' }, result.name)
			])
		];

		var urlsDiv = E('div', { 'class': 'pub-urls' });

		if (urls.local) {
			urlsDiv.appendChild(E('div', { 'class': 'pub-url-row' }, [
				E('span', { 'class': 'pub-url-icon' }, '🏠'),
				E('span', { 'class': 'pub-url-label' }, _('Local')),
				E('code', {}, urls.local)
			]));
		}
		if (urls.clearnet) {
			urlsDiv.appendChild(E('div', { 'class': 'pub-url-row' }, [
				E('span', { 'class': 'pub-url-icon' }, '🌐'),
				E('span', { 'class': 'pub-url-label' }, _('Clearnet')),
				E('a', { 'href': urls.clearnet, 'target': '_blank' }, urls.clearnet + ' ↗')
			]));
		}
		if (urls.onion) {
			urlsDiv.appendChild(E('div', { 'class': 'pub-url-row' }, [
				E('span', { 'class': 'pub-url-icon' }, '🧅'),
				E('span', { 'class': 'pub-url-label' }, _('Onion')),
				E('code', { 'style': 'font-size: 0.8em; word-break: break-all;' }, urls.onion)
			]));
		}

		content.push(urlsDiv);

		content.push(E('div', { 'class': 'right', 'style': 'margin-top: 20px;' }, [
			E('button', {
				'class': 'cbi-button',
				'click': function() {
					ui.hideModal();
					window.location.href = L.url('admin/services/service-registry/overview');
				}
			}, '📋 ' + _('Go to Overview')),
			E('button', {
				'class': 'cbi-button cbi-button-apply',
				'style': 'margin-left: 10px;',
				'click': function() {
					ui.hideModal();
					window.location.reload();
				}
			}, '➕ ' + _('Publish Another'))
		]));

		ui.showModal('✅ ' + _('Success'), content);
	},

	getStyles: function() {
		return `
			.pub-section-title { font-size: 1.1em; margin: 0 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid #0ff; color: #0ff; }
			.pub-hint { color: #888; font-size: 0.9em; margin-bottom: 15px; }

			.pub-list { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; max-height: 400px; overflow-y: auto; }
			@media (prefers-color-scheme: dark) { .pub-list { border-color: #444; } }

			.pub-row { display: flex; align-items: center; padding: 10px 12px; border-bottom: 1px solid #eee; gap: 10px; cursor: pointer; transition: background 0.15s; }
			.pub-row:last-child { border-bottom: none; }
			.pub-row:hover { background: rgba(0,255,255,0.08); }
			@media (prefers-color-scheme: dark) { .pub-row { border-bottom-color: #333; } }

			.pub-col-status { width: 24px; text-align: center; }
			.pub-col-icon { width: 24px; text-align: center; }
			.pub-col-name { flex: 1; min-width: 120px; }
			.pub-col-name strong { display: inline; }
			.pub-port { font-size: 0.85em; color: #888; margin-left: 4px; }
			.pub-col-cat { width: 80px; font-size: 0.85em; color: #666; }
			.pub-col-action { width: 36px; }

			.pub-btn { border: none; background: transparent; cursor: pointer; font-size: 1.1em; padding: 4px 8px; border-radius: 4px; transition: all 0.15s; }
			.pub-btn:hover { background: rgba(0,153,204,0.15); }

			.pub-urls { margin: 20px 0; padding: 15px; background: #f8f8f8; border-radius: 8px; }
			@media (prefers-color-scheme: dark) { .pub-urls { background: #1a1a2e; } }

			.pub-url-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #eee; }
			.pub-url-row:last-child { border-bottom: none; }
			@media (prefers-color-scheme: dark) { .pub-url-row { border-bottom-color: #333; } }

			.pub-url-icon { font-size: 1.2em; }
			.pub-url-label { font-weight: 600; min-width: 70px; }
			.pub-url-row a { color: #0099cc; text-decoration: none; }
			.pub-url-row a:hover { text-decoration: underline; }
		`;
	}
});
