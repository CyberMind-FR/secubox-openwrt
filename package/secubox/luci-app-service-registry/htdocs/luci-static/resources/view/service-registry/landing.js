'use strict';
'require view';
'require dom';
'require ui';
'require form';
'require fs';
'require service-registry/api as api';

return view.extend({
	title: _('Landing Page'),

	load: function() {
		return Promise.all([
			api.getLandingConfig(),
			api.getPublishedServices()
		]);
	},

	render: function(data) {
		var self = this;
		var config = data[0] || {};
		var services = data[1] || [];

		// Load CSS
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('service-registry/registry.css');
		document.head.appendChild(link);

		var m, s, o;

		m = new form.Map('service-registry', _('Landing Page Configuration'),
			_('Configure the public landing page that displays all published services with QR codes.'));

		s = m.section(form.NamedSection, 'main', 'settings', _('Settings'));

		o = s.option(form.Flag, 'landing_auto_regen', _('Auto-regenerate'),
			_('Automatically regenerate landing page when services are published or unpublished'));
		o.default = '1';

		o = s.option(form.Value, 'landing_path', _('Landing Page Path'),
			_('File path where the landing page will be generated'));
		o.default = '/www/secubox-services.html';
		o.readonly = true;

		return m.render().then(function(mapEl) {
			// Status section
			var statusSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Status')),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('File exists')),
					E('div', { 'class': 'cbi-value-field' },
						config.exists ?
							E('span', { 'style': 'color: #22c55e;' }, _('Yes')) :
							E('span', { 'style': 'color: #ef4444;' }, _('No'))
					)
				]),
				config.exists && config.modified ? E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Last modified')),
					E('div', { 'class': 'cbi-value-field' },
						new Date(config.modified * 1000).toLocaleString()
					)
				]) : null,
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Published services')),
					E('div', { 'class': 'cbi-value-field' }, String(services.length))
				])
			].filter(Boolean));

			// Actions section
			var actionsSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Actions')),
				E('div', { 'style': 'display: flex; gap: 15px; flex-wrap: wrap;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'click': ui.createHandlerFn(self, 'handleRegenerate')
					}, _('Regenerate Landing Page')),
					config.exists ? E('a', {
						'class': 'cbi-button',
						'href': '/secubox-services.html',
						'target': '_blank'
					}, _('View Landing Page')) : null,
					config.exists ? E('button', {
						'class': 'cbi-button',
						'click': ui.createHandlerFn(self, 'handlePreview')
					}, _('Preview')) : null
				].filter(Boolean))
			]);

			// Services preview
			var previewSection = null;
			if (services.length > 0) {
				previewSection = E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('Services on Landing Page')),
					E('p', { 'style': 'color: #666; margin-bottom: 15px;' },
						_('These services will be displayed on the landing page:')),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th' }, _('Name')),
							E('th', { 'class': 'th' }, _('Category')),
							E('th', { 'class': 'th' }, _('Status')),
							E('th', { 'class': 'th' }, _('Clearnet')),
							E('th', { 'class': 'th' }, _('Onion'))
						])
					].concat(services.map(function(svc) {
						var urls = svc.urls || {};
						return E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, svc.name || svc.id),
							E('td', { 'class': 'td' }, svc.category || '-'),
							E('td', { 'class': 'td' }, [
								E('span', {
									'style': 'padding: 2px 8px; border-radius: 10px; font-size: 0.85em;' +
										(svc.status === 'running' ? 'background: #dcfce7; color: #166534;' :
										'background: #fee2e2; color: #991b1b;')
								}, svc.status || 'unknown')
							]),
							E('td', { 'class': 'td' },
								urls.clearnet ?
									E('a', { 'href': urls.clearnet, 'target': '_blank' }, urls.clearnet) :
									'-'
							),
							E('td', { 'class': 'td' },
								urls.onion ?
									E('span', { 'style': 'font-size: 0.85em; word-break: break-all;' },
										urls.onion.substring(0, 30) + '...') :
									'-'
							)
						]);
					})))
				]);
			}

			// Customization info
			var customSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Customization')),
				E('p', {}, _('The landing page includes:')),
				E('ul', {}, [
					E('li', {}, _('Responsive grid layout with service cards')),
					E('li', {}, _('QR codes for clearnet and onion URLs')),
					E('li', {}, _('Copy-to-clipboard functionality')),
					E('li', {}, _('Real-time service status')),
					E('li', {}, _('Dark mode support')),
					E('li', {}, _('Share buttons for social media'))
				]),
				E('p', { 'style': 'margin-top: 15px; color: #666;' },
					_('To customize the appearance, edit the template at:') +
					' /usr/sbin/secubox-landing-gen')
			]);

			mapEl.appendChild(statusSection);
			mapEl.appendChild(actionsSection);
			if (previewSection) mapEl.appendChild(previewSection);
			mapEl.appendChild(customSection);

			return mapEl;
		});
	},

	handleRegenerate: function() {
		ui.showModal(_('Regenerating'), [
			E('p', { 'class': 'spinning' }, _('Regenerating landing page...'))
		]);

		return api.generateLandingPage().then(function(result) {
			ui.hideModal();

			if (result.success) {
				ui.addNotification(null, E('p', _('Landing page regenerated successfully')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Failed to regenerate: ') + (result.error || '')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	handlePreview: function() {
		var self = this;

		ui.showModal(_('Landing Page Preview'), [
			E('div', { 'style': 'text-align: center;' }, [
				E('iframe', {
					'src': '/secubox-services.html',
					'style': 'width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 8px;'
				})
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 15px;' }, [
				E('a', {
					'class': 'cbi-button',
					'href': '/secubox-services.html',
					'target': '_blank'
				}, _('Open in New Tab')),
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
			])
		], 'wide');
	}
});
