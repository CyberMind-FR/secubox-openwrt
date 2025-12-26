'use strict';
'require view';
'require ui';
'require system-hub/api as API';
'require system-hub/theme as Theme';

// Load CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('system-hub/dashboard.css')
}));

// Initialize theme
Theme.init();

return L.view.extend({
	load: function() {
		return API.listServices();
	},

	render: function(services) {
		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('System Services')),
			E('div', { 'class': 'cbi-map-descr' }, _('Manage system services: start, stop, restart, enable, or disable'))
		]);

		var section = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Service List'))
		]);

		if (services.length === 0) {
			section.appendChild(E('p', { 'style': 'text-align: center; font-style: italic; padding: 20px;' }, 
				_('No services found')));
			v.appendChild(section);
			return v;
		}

		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Service Name')),
				E('th', { 'class': 'th' }, _('Status')),
				E('th', { 'class': 'th' }, _('Autostart')),
				E('th', { 'class': 'th' }, _('Actions'))
			])
		]);

		services.forEach(L.bind(function(service) {
			var statusColor = service.running ? 'green' : 'red';
			var statusText = service.running ? '● Running' : '○ Stopped';
			var enabledText = service.enabled ? '✓ Enabled' : '✗ Disabled';

			var actionsDiv = E('div', { 'style': 'display: flex; gap: 5px;' });

			// Start button
			if (!service.running) {
				actionsDiv.appendChild(E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': L.bind(function(service_name, ev) {
						this.performAction(service_name, 'start');
					}, this, service.name)
				}, _('Start')));
			}

			// Stop button
			if (service.running) {
				actionsDiv.appendChild(E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': L.bind(function(service_name, ev) {
						this.performAction(service_name, 'stop');
					}, this, service.name)
				}, _('Stop')));
			}

			// Restart button
			actionsDiv.appendChild(E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': L.bind(function(service_name, ev) {
					this.performAction(service_name, 'restart');
				}, this, service.name)
			}, _('Restart')));

			// Enable/Disable button
			if (service.enabled) {
				actionsDiv.appendChild(E('button', {
					'class': 'cbi-button cbi-button-neutral',
					'click': L.bind(function(service_name, ev) {
						this.performAction(service_name, 'disable');
					}, this, service.name)
				}, _('Disable')));
			} else {
				actionsDiv.appendChild(E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': L.bind(function(service_name, ev) {
						this.performAction(service_name, 'enable');
					}, this, service.name)
				}, _('Enable')));
			}

			table.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, E('strong', {}, service.name)),
				E('td', { 'class': 'td' }, [
					E('span', { 'style': 'color: ' + statusColor + '; font-weight: bold;' }, statusText)
				]),
				E('td', { 'class': 'td' }, enabledText),
				E('td', { 'class': 'td' }, actionsDiv)
			]));
		}, this));

		section.appendChild(table);
		v.appendChild(section);

		return v;
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
