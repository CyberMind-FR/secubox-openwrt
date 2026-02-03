'use strict';
'require view';
'require ui';
'require tor-shield/api as api';

return view.extend({
	title: _('Tor Shield Settings'),

	load: function() {
		return api.getSettings();
	},

	handleSave: function(form, applyNow) {
		var self = this;

		// Gather form values
		var settings = {
			mode: form.querySelector('[name="mode"]').value,
			dns_over_tor: form.querySelector('[name="dns_over_tor"]').checked ? '1' : '0',
			kill_switch: form.querySelector('[name="kill_switch"]').checked ? '1' : '0',
			lan_proxy: form.querySelector('[name="lan_proxy"]').checked ? '1' : '0',
			socks_port: parseInt(form.querySelector('[name="socks_port"]').value) || 9050,
			trans_port: parseInt(form.querySelector('[name="trans_port"]').value) || 9040,
			dns_port: parseInt(form.querySelector('[name="dns_port"]').value) || 9053,
			exit_nodes: form.querySelector('[name="exit_nodes"]').value.trim(),
			exclude_exit_nodes: form.querySelector('[name="exclude_exit_nodes"]').value.trim(),
			strict_nodes: form.querySelector('[name="strict_nodes"]').checked ? '1' : '0'
		};

		ui.showModal(_('Saving Settings'), [
			E('p', { 'class': 'spinning' }, applyNow ? _('Saving and applying configuration...') : _('Saving configuration...'))
		]);

		api.saveSettings(
			settings.mode,
			settings.dns_over_tor,
			settings.kill_switch,
			settings.socks_port,
			settings.trans_port,
			settings.dns_port,
			settings.lan_proxy,
			settings.exit_nodes,
			settings.exclude_exit_nodes,
			settings.strict_nodes,
			applyNow
		).then(function(result) {
			ui.hideModal();
			if (result.success) {
				if (result.restarted) {
					ui.addNotification(null, E('p', _('Settings saved and applied. Firewall rules updated.')), 'info');
				} else {
					ui.addNotification(null, E('p', _('Settings saved. Restart Tor Shield to apply changes.')), 'info');
				}
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to save settings')), 'error');
			}
		});
	},

	render: function(data) {
		var self = this;

		var view = E('div', { 'class': 'tor-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('tor-shield/dashboard.css') }),

			E('form', { 'id': 'tor-settings-form' }, [
				// General Settings
				E('div', { 'class': 'tor-card' }, [
					E('div', { 'class': 'tor-card-header' }, [
						E('div', { 'class': 'tor-card-title' }, [
							E('span', { 'class': 'tor-card-title-icon' }, '\u2699'),
							_('General Settings')
						])
					]),
					E('div', { 'class': 'tor-card-body' }, [
						// Mode
						E('div', { 'style': 'margin-bottom: 20px;' }, [
							E('label', { 'style': 'display: block; font-weight: 600; margin-bottom: 8px;' }, _('Operating Mode')),
							E('select', {
								'name': 'mode',
								'class': 'cbi-input-select',
								'style': 'width: 100%; max-width: 300px;'
							}, [
								E('option', { 'value': 'transparent', 'selected': data.mode === 'transparent' }, _('Transparent Proxy')),
								E('option', { 'value': 'socks', 'selected': data.mode === 'socks' }, _('SOCKS Proxy Only'))
							]),
							E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px;' },
								_('Transparent mode routes all traffic through Tor. SOCKS mode only provides a proxy.'))
						]),

						// DNS over Tor
						E('div', { 'style': 'margin-bottom: 20px;' }, [
							E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
								E('input', {
									'type': 'checkbox',
									'name': 'dns_over_tor',
									'checked': data.dns_over_tor
								}),
								E('span', { 'style': 'font-weight: 600;' }, _('DNS over Tor'))
							]),
							E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px; margin-left: 24px;' },
								_('Route DNS queries through Tor to prevent DNS leaks. Recommended.'))
						]),

						// Kill Switch
						E('div', { 'style': 'margin-bottom: 20px;' }, [
							E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
								E('input', {
									'type': 'checkbox',
									'name': 'kill_switch',
									'checked': data.kill_switch
								}),
								E('span', { 'style': 'font-weight: 600;' }, _('Kill Switch'))
							]),
							E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px; margin-left: 24px;' },
								_('Block all non-Tor traffic if the connection drops. Prevents IP leaks.'))
						]),

						// LAN Proxy
						E('div', { 'style': 'margin-bottom: 20px;' }, [
							E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
								E('input', {
									'type': 'checkbox',
									'name': 'lan_proxy',
									'checked': data.lan_proxy
								}),
								E('span', { 'style': 'font-weight: 600;' }, _('LAN Client Proxy'))
							]),
							E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px; margin-left: 24px;' },
								_('Route LAN client traffic through Tor via PREROUTING. Used by Server Mode to anonymize outbound traffic while preserving inbound connections.'))
						])
					])
				]),

				// Port Configuration
				E('div', { 'class': 'tor-card' }, [
					E('div', { 'class': 'tor-card-header' }, [
						E('div', { 'class': 'tor-card-title' }, [
							E('span', { 'class': 'tor-card-title-icon' }, '\uD83D\uDD0C'),
							_('Port Configuration')
						])
					]),
					E('div', { 'class': 'tor-card-body' }, [
						E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;' }, [
							// SOCKS Port
							E('div', {}, [
								E('label', { 'style': 'display: block; font-weight: 600; margin-bottom: 8px;' }, _('SOCKS Port')),
								E('input', {
									'type': 'number',
									'name': 'socks_port',
									'class': 'cbi-input-text',
									'value': data.socks_port || 9050,
									'min': '1024',
									'max': '65535',
									'style': 'width: 100%;'
								}),
								E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px;' },
									_('SOCKS5 proxy port for applications'))
							]),

							// Transparent Port
							E('div', {}, [
								E('label', { 'style': 'display: block; font-weight: 600; margin-bottom: 8px;' }, _('Transparent Port')),
								E('input', {
									'type': 'number',
									'name': 'trans_port',
									'class': 'cbi-input-text',
									'value': data.trans_port || 9040,
									'min': '1024',
									'max': '65535',
									'style': 'width: 100%;'
								}),
								E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px;' },
									_('Port for transparent proxying'))
							]),

							// DNS Port
							E('div', {}, [
								E('label', { 'style': 'display: block; font-weight: 600; margin-bottom: 8px;' }, _('DNS Port')),
								E('input', {
									'type': 'number',
									'name': 'dns_port',
									'class': 'cbi-input-text',
									'value': data.dns_port || 9053,
									'min': '1024',
									'max': '65535',
									'style': 'width: 100%;'
								}),
								E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px;' },
									_('Port for DNS over Tor'))
							])
						])
					])
				]),

				// Exit Node Restrictions
				E('div', { 'class': 'tor-card' }, [
					E('div', { 'class': 'tor-card-header' }, [
						E('div', { 'class': 'tor-card-title' }, [
							E('span', { 'class': 'tor-card-title-icon' }, '\uD83C\uDF10'),
							_('Exit Node Restrictions')
						])
					]),
					E('div', { 'class': 'tor-card-body' }, [
						E('p', { 'style': 'color: var(--tor-text-secondary); margin-bottom: 16px;' },
							_('Control which countries can be used for exit nodes. Use ISO country codes (e.g., US, DE, NL) separated by commas.')),

						// Exit Nodes
						E('div', { 'style': 'margin-bottom: 20px;' }, [
							E('label', { 'style': 'display: block; font-weight: 600; margin-bottom: 8px;' }, _('Preferred Exit Countries')),
							E('input', {
								'type': 'text',
								'name': 'exit_nodes',
								'class': 'cbi-input-text',
								'value': data.exit_nodes || '',
								'placeholder': 'e.g., {US},{DE},{NL}',
								'style': 'width: 100%;'
							}),
							E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px;' },
								_('Only use exit nodes in these countries. Leave empty for any country.'))
						]),

						// Exclude Exit Nodes
						E('div', { 'style': 'margin-bottom: 20px;' }, [
							E('label', { 'style': 'display: block; font-weight: 600; margin-bottom: 8px;' }, _('Excluded Exit Countries')),
							E('input', {
								'type': 'text',
								'name': 'exclude_exit_nodes',
								'class': 'cbi-input-text',
								'value': data.exclude_exit_nodes || '',
								'placeholder': 'e.g., {RU},{CN},{IR}',
								'style': 'width: 100%;'
							}),
							E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px;' },
								_('Never use exit nodes in these countries.'))
						]),

						// Strict Nodes
						E('div', {}, [
							E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
								E('input', {
									'type': 'checkbox',
									'name': 'strict_nodes',
									'checked': data.strict_nodes
								}),
								E('span', { 'style': 'font-weight: 600;' }, _('Strict Nodes'))
							]),
							E('p', { 'style': 'font-size: 12px; color: var(--tor-text-muted); margin-top: 4px; margin-left: 24px;' },
								_('Strictly enforce exit node restrictions. May reduce anonymity or cause connection failures.'))
						])
					])
				]),

				// Actions
				E('div', { 'style': 'display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;' }, [
					E('button', {
						'type': 'button',
						'class': 'tor-btn tor-btn-primary',
						'style': 'background: linear-gradient(135deg, #059669 0%, #10b981 100%);',
						'click': function() {
							self.handleSave(document.getElementById('tor-settings-form'), true);
						}
					}, ['\u26A1 ', _('Save & Apply')]),
					E('button', {
						'type': 'button',
						'class': 'tor-btn',
						'click': function() {
							self.handleSave(document.getElementById('tor-settings-form'), false);
						}
					}, ['\uD83D\uDCBE ', _('Save Only')]),
					E('a', {
						'href': L.url('admin', 'services', 'tor-shield'),
						'class': 'tor-btn'
					}, ['\u2190 ', _('Back to Dashboard')])
				])
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleReset: null
});
