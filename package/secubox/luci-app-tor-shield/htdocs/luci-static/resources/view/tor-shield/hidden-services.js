'use strict';
'require view';
'require ui';
'require tor-shield/api as api';

return view.extend({
	title: _('Hidden Services'),

	load: function() {
		return api.getHiddenServices();
	},

	handleAddService: function() {
		var self = this;

		var nameInput, localPortInput, virtualPortInput;

		ui.showModal(_('Add Hidden Service'), [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px; font-weight: 500;' }, _('Service Name')),
				nameInput = E('input', {
					'type': 'text',
					'class': 'cbi-input-text',
					'placeholder': 'my-website',
					'style': 'width: 100%;'
				})
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 4px; font-weight: 500;' }, _('Local Port')),
					localPortInput = E('input', {
						'type': 'number',
						'class': 'cbi-input-text',
						'value': '80',
						'min': '1',
						'max': '65535',
						'style': 'width: 100%;'
					}),
					E('small', { 'style': 'color: var(--tor-text-muted);' }, _('Port on your router'))
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 4px; font-weight: 500;' }, _('Virtual Port')),
					virtualPortInput = E('input', {
						'type': 'number',
						'class': 'cbi-input-text',
						'value': '80',
						'min': '1',
						'max': '65535',
						'style': 'width: 100%;'
					}),
					E('small', { 'style': 'color: var(--tor-text-muted);' }, _('Port exposed on .onion'))
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() {
						var name = nameInput.value.trim();
						var localPort = parseInt(localPortInput.value) || 80;
						var virtualPort = parseInt(virtualPortInput.value) || 80;

						if (!name) {
							ui.addNotification(null, E('p', _('Service name is required')), 'error');
							return;
						}

						ui.showModal(_('Creating Service'), [
							E('p', { 'class': 'spinning' }, _('Creating hidden service...'))
						]);

						api.addHiddenService(name, localPort, virtualPort).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', _('Hidden service created. Restart Tor Shield to generate .onion address.')), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed to create service')), 'error');
							}
						});
					}
				}, _('Create'))
			])
		]);
	},

	handleRemoveService: function(name) {
		var self = this;

		ui.showModal(_('Remove Hidden Service'), [
			E('p', {}, _('Are you sure you want to remove the hidden service "%s"?').format(name)),
			E('p', { 'style': 'color: var(--tor-status-warning);' },
				_('Warning: This will permanently delete the .onion address. You cannot recover it.')),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': function() {
						ui.showModal(_('Removing Service'), [
							E('p', { 'class': 'spinning' }, _('Removing hidden service...'))
						]);

						api.removeHiddenService(name).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', _('Hidden service removed')), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed to remove service')), 'error');
							}
						});
					}
				}, _('Remove'))
			])
		]);
	},

	handleCopyAddress: function(address) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(address).then(function() {
				ui.addNotification(null, E('p', _('Address copied to clipboard')), 'info');
			});
		} else {
			// Fallback for older browsers
			var textArea = document.createElement('textarea');
			textArea.value = address;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			ui.addNotification(null, E('p', _('Address copied to clipboard')), 'info');
		}
	},

	renderService: function(service) {
		var self = this;
		var hasAddress = service.onion_address && service.onion_address.length > 0;

		return E('div', { 'class': 'tor-hidden-service' }, [
			E('div', { 'class': 'tor-hidden-service-info' }, [
				E('div', { 'class': 'tor-hidden-service-name' }, [
					E('span', { 'style': 'margin-right: 8px;' }, '\uD83E\uDDC5'),
					service.name,
					service.enabled ?
						E('span', { 'style': 'margin-left: 8px; padding: 2px 8px; background: rgba(16,185,129,0.2); color: #10b981; border-radius: 4px; font-size: 10px;' }, _('ACTIVE')) :
						E('span', { 'style': 'margin-left: 8px; padding: 2px 8px; background: rgba(107,114,128,0.2); color: #9ca3af; border-radius: 4px; font-size: 10px;' }, _('DISABLED'))
				]),
				hasAddress ?
					E('div', { 'class': 'tor-hidden-service-address' }, service.onion_address) :
					E('div', { 'class': 'tor-hidden-service-address', 'style': 'color: var(--tor-text-muted);' }, _('Address will be generated after restart')),
				E('div', { 'class': 'tor-hidden-service-port' },
					_('Port %d -> 127.0.0.1:%d').format(service.virtual_port, service.local_port))
			]),
			E('div', { 'class': 'tor-hidden-service-actions' }, [
				hasAddress ? E('button', {
					'class': 'tor-btn tor-btn-sm',
					'click': L.bind(function() { this.handleCopyAddress(service.onion_address); }, self),
					'title': _('Copy address')
				}, '\uD83D\uDCCB') : '',
				E('button', {
					'class': 'tor-btn tor-btn-sm tor-btn-danger',
					'click': L.bind(function() { this.handleRemoveService(service.name); }, self),
					'title': _('Remove service')
				}, '\uD83D\uDDD1')
			])
		]);
	},

	render: function(data) {
		var self = this;
		var services = data.services || [];

		var view = E('div', { 'class': 'tor-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('tor-shield/dashboard.css') }),

			// Header
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\uD83E\uDDC5'),
						_('Hidden Services')
					]),
					E('button', {
						'class': 'tor-btn tor-btn-primary tor-btn-sm',
						'click': L.bind(this.handleAddService, this)
					}, ['+ ', _('Add Service')])
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('p', { 'style': 'color: var(--tor-text-secondary); margin-bottom: 16px;' },
						_('Hidden services allow you to host websites and services accessible only through the Tor network via .onion addresses.')),

					services.length > 0 ?
						E('div', { 'class': 'tor-services-list' },
							services.map(function(s) { return self.renderService(s); })
						) :
						E('div', { 'class': 'tor-empty' }, [
							E('div', { 'class': 'tor-empty-icon' }, '\uD83E\uDDC5'),
							E('div', { 'class': 'tor-empty-text' }, _('No hidden services configured')),
							E('p', {}, _('Click "Add Service" to create your first .onion service'))
						])
				])
			]),

			// Help Card
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\u2139'),
						_('How Hidden Services Work')
					])
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('ul', { 'style': 'margin: 0; padding-left: 20px; color: var(--tor-text-secondary);' }, [
						E('li', {}, _('Hidden services are accessible only through Tor Browser or Tor-enabled applications')),
						E('li', {}, _('The .onion address is a public key that identifies your service')),
						E('li', {}, _('Your real IP address remains hidden from visitors')),
						E('li', {}, _('After creating a service, restart Tor Shield to generate the .onion address')),
						E('li', {}, _('Make sure the local port has a service running (e.g., web server on port 80)'))
					])
				])
			]),

			// Back link
			E('div', { 'style': 'margin-top: 16px;' }, [
				E('a', {
					'href': L.url('admin', 'services', 'tor-shield'),
					'class': 'tor-btn'
				}, ['\u2190 ', _('Back to Dashboard')])
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
