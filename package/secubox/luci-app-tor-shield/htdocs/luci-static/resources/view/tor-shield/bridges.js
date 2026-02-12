'use strict';
'require view';
'require ui';
'require tor-shield/api as api';
'require secubox/kiss-theme';

return view.extend({
	title: _('Bridge Configuration'),

	load: function() {
		return api.getBridges();
	},

	handleToggleBridges: function(currentState) {
		var self = this;
		var newState = currentState ? '0' : '1';

		ui.showModal(_('Updating Bridge Configuration'), [
			E('p', { 'class': 'spinning' }, newState === '1' ? _('Enabling bridges...') : _('Disabling bridges...'))
		]);

		api.setBridges(newState, null).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Bridge configuration updated. Restart Tor Shield to apply changes.')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to update configuration')), 'error');
			}
		});
	},

	handleBridgeTypeChange: function(newType) {
		var self = this;

		ui.showModal(_('Updating Bridge Type'), [
			E('p', { 'class': 'spinning' }, _('Changing bridge type to %s...').format(newType))
		]);

		api.setBridges(null, newType).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Bridge type updated to %s. Restart Tor Shield to apply changes.').format(newType)), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to update bridge type')), 'error');
			}
		});
	},

	render: function(data) {
		var self = this;
		var bridgesEnabled = data.enabled;
		var bridgeType = data.type || 'obfs4';
		var bridgeLines = data.bridge_lines || [];

		var bridgeTypes = [
			{ id: 'obfs4', name: 'obfs4', desc: _('Recommended - Most effective against censorship') },
			{ id: 'snowflake', name: 'Snowflake', desc: _('Uses WebRTC - Good for restrictive networks') },
			{ id: 'meek-azure', name: 'meek-azure', desc: _('Domain fronting via Microsoft Azure') },
			{ id: 'vanilla', name: 'Vanilla', desc: _('Standard bridges - Less effective against DPI') }
		];

		var view = E('div', { 'class': 'tor-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('tor-shield/dashboard.css') }),

			// Header
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\uD83C\uDF09'),
						_('Bridge Configuration')
					]),
					E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
						E('span', { 'style': 'font-size: 14px; color: var(--tor-text-secondary);' }, _('Bridges')),
						E('button', {
							'class': 'tor-btn tor-btn-sm ' + (bridgesEnabled ? 'tor-btn-success' : ''),
							'click': L.bind(function() { this.handleToggleBridges(bridgesEnabled); }, self)
						}, bridgesEnabled ? _('Enabled') : _('Disabled'))
					])
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('p', { 'style': 'color: var(--tor-text-secondary); margin-bottom: 20px;' },
						_('Bridges help you connect to Tor in countries where Tor is blocked. They disguise your Tor traffic to look like normal internet traffic.')),

					// When to use bridges
					E('div', { 'style': 'background: rgba(125,78,159,0.1); border: 1px solid rgba(125,78,159,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;' }, [
						E('h4', { 'style': 'margin: 0 0 8px 0; color: var(--tor-accent-light);' }, _('When to use bridges?')),
						E('ul', { 'style': 'margin: 0; padding-left: 20px; color: var(--tor-text-secondary);' }, [
							E('li', {}, _('Your country blocks access to the Tor network')),
							E('li', {}, _('Your ISP blocks or throttles Tor connections')),
							E('li', {}, _('You want extra privacy by hiding that you use Tor')),
							E('li', {}, _('Normal Tor connection attempts fail repeatedly'))
						])
					])
				])
			]),

			// Bridge Type Selection
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\u2699'),
						_('Bridge Type')
					]),
					E('div', { 'class': 'tor-card-badge' }, bridgeType)
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;' },
						bridgeTypes.map(function(bt) {
							return E('div', {
								'style': 'padding: 16px; background: ' + (bridgeType === bt.id ? 'rgba(125,78,159,0.2)' : 'var(--tor-bg-secondary)') +
									'; border: 2px solid ' + (bridgeType === bt.id ? 'var(--tor-accent-purple)' : 'var(--tor-border-color)') +
									'; border-radius: 8px; cursor: pointer; transition: all 0.2s;',
								'click': L.bind(function() { this.handleBridgeTypeChange(bt.id); }, self)
							}, [
								E('div', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;' }, [
									E('span', { 'style': 'font-weight: 600;' }, bt.name),
									bridgeType === bt.id ? E('span', { 'style': 'color: var(--tor-accent-light);' }, '\u2713') : ''
								]),
								E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, bt.desc)
							]);
						})
					)
				])
			]),

			// Get Bridges
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\uD83D\uDD17'),
						_('Get Bridges')
					])
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('p', { 'style': 'color: var(--tor-text-secondary); margin-bottom: 16px;' },
						_('You can obtain bridges from the Tor Project:')),

					E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
						E('a', {
							'href': 'https://bridges.torproject.org/',
							'target': '_blank',
							'class': 'tor-btn tor-btn-primary'
						}, ['\uD83C\uDF10 ', _('Get Bridges Online')]),
						E('span', { 'style': 'color: var(--tor-text-muted); display: flex; align-items: center;' }, _('or')),
						E('div', { 'style': 'color: var(--tor-text-secondary);' }, [
							_('Email: '),
							E('code', {}, 'bridges@torproject.org'),
							E('br', {}),
							E('small', { 'style': 'color: var(--tor-text-muted);' }, _('(from Gmail or Riseup only)'))
						])
					]),

					// Current bridge lines
					bridgeLines.length > 0 ? E('div', { 'style': 'margin-top: 20px;' }, [
						E('h4', { 'style': 'margin-bottom: 8px;' }, _('Configured Bridges')),
						E('div', { 'style': 'background: var(--tor-bg-secondary); border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; max-height: 150px; overflow-y: auto;' },
							bridgeLines.map(function(line) {
								return E('div', { 'style': 'margin-bottom: 4px; word-break: break-all;' }, line);
							})
						)
					]) : ''
				])
			]),

			// Help
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\u2139'),
						_('Bridge Types Explained')
					])
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('dl', { 'style': 'margin: 0;' }, [
						E('dt', { 'style': 'font-weight: 600; color: var(--tor-accent-light); margin-top: 8px;' }, 'obfs4'),
						E('dd', { 'style': 'margin: 4px 0 12px 16px; color: var(--tor-text-secondary);' },
							_('The most commonly used pluggable transport. Transforms Tor traffic to look random, making it hard to detect.')),

						E('dt', { 'style': 'font-weight: 600; color: var(--tor-accent-light);' }, 'Snowflake'),
						E('dd', { 'style': 'margin: 4px 0 12px 16px; color: var(--tor-text-secondary);' },
							_('Uses WebRTC peer connections through volunteer browsers. Traffic looks like video calls.')),

						E('dt', { 'style': 'font-weight: 600; color: var(--tor-accent-light);' }, 'meek-azure'),
						E('dd', { 'style': 'margin: 4px 0 12px 16px; color: var(--tor-text-secondary);' },
							_('Domain fronting through Microsoft Azure. Traffic appears as HTTPS to azure.com. Slower but harder to block.')),

						E('dt', { 'style': 'font-weight: 600; color: var(--tor-accent-light);' }, 'Vanilla'),
						E('dd', { 'style': 'margin: 4px 0 0 16px; color: var(--tor-text-secondary);' },
							_('Standard bridge relays without obfuscation. Only useful when Tor IPs are blocked but protocol isn\'t inspected.'))
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

		return KissTheme.wrap(view, 'admin/secubox/security/tor-shield/bridges');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
