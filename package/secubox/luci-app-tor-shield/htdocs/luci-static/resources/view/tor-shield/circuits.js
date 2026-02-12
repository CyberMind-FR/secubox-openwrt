'use strict';
'require view';
'require poll';
'require ui';
'require tor-shield/api as api';
'require secubox/kiss-theme';

return view.extend({
	title: _('Tor Circuits'),
	pollInterval: 10,
	pollActive: true,

	load: function() {
		return api.getMonitoringData();
	},

	handleNewIdentity: function() {
		var self = this;

		ui.showModal(_('New Identity'), [
			E('p', { 'class': 'spinning' }, _('Requesting new Tor identity...'))
		]);

		api.newIdentity().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('New identity requested. Circuits will be renewed.')), 'info');
				// Refresh circuits view
				setTimeout(function() {
					self.load().then(function(data) {
						self.updateCircuits(data.circuits || []);
					});
				}, 3000);
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to request new identity')), 'error');
			}
		});
	},

	renderCircuitNode: function(type, label, flag) {
		var nodeClass = 'tor-circuit-node';
		switch (type) {
			case 'you': nodeClass += ' you'; break;
			case 'guard': nodeClass += ' guard'; break;
			case 'middle': nodeClass += ' middle'; break;
			case 'exit': nodeClass += ' exit'; break;
		}

		return E('div', { 'class': nodeClass }, [
			E('div', { 'class': 'tor-circuit-node-flag' }, flag || '\uD83D\uDCBB'),
			E('div', { 'class': 'tor-circuit-node-label' }, label)
		]);
	},

	renderCircuit: function(circuit) {
		var self = this;
		var nodes = circuit.nodes || [];

		var elements = [
			this.renderCircuitNode('you', _('YOU'), '\uD83D\uDCBB'),
			E('span', { 'class': 'tor-circuit-arrow' }, '\u2192')
		];

		nodes.forEach(function(node, idx) {
			var type = 'middle';
			if (idx === 0) type = 'guard';
			else if (idx === nodes.length - 1) type = 'exit';

			var label = node.name || node.fingerprint.substring(0, 8);
			elements.push(self.renderCircuitNode(type, label, api.getCountryFlag(node.country) || '\uD83C\uDF10'));

			if (idx < nodes.length - 1) {
				elements.push(E('span', { 'class': 'tor-circuit-arrow' }, '\u2192'));
			}
		});

		elements.push(E('span', { 'class': 'tor-circuit-arrow' }, '\u2192'));
		elements.push(this.renderCircuitNode('web', _('WEB'), '\uD83C\uDF10'));

		return E('div', { 'class': 'tor-circuit', 'data-circuit': circuit.id }, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;' }, elements),
			E('div', { 'style': 'margin-left: auto; display: flex; align-items: center; gap: 8px;' }, [
				E('span', { 'class': 'tor-card-badge' }, circuit.purpose || 'GENERAL'),
				E('span', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, '#' + circuit.id)
			])
		]);
	},

	updateCircuits: function(circuits) {
		var self = this;
		var container = document.querySelector('.tor-circuits-container');
		if (!container) return;

		if (circuits.length === 0) {
			container.innerHTML = '';
			container.appendChild(E('div', { 'class': 'tor-empty' }, [
				E('div', { 'class': 'tor-empty-icon' }, '\uD83D\uDD04'),
				E('div', { 'class': 'tor-empty-text' }, _('No active circuits')),
				E('p', {}, _('Tor is not running or not connected'))
			]));
			return;
		}

		container.innerHTML = '';
		circuits.forEach(function(circuit) {
			container.appendChild(self.renderCircuit(circuit));
		});

		// Update circuit count
		var countEl = document.querySelector('.tor-circuit-count');
		if (countEl) {
			countEl.textContent = circuits.length + ' ' + (circuits.length === 1 ? _('circuit') : _('circuits'));
		}
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return api.getMonitoringData().then(L.bind(function(data) {
				this.updateCircuits(data.circuits || []);
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var circuits = data.circuits || [];

		var view = E('div', { 'class': 'tor-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('tor-shield/dashboard.css') }),

			// Header
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\uD83D\uDDFA'),
						_('Tor Circuits')
					]),
					E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('span', { 'class': 'tor-card-badge tor-circuit-count' },
							circuits.length + ' ' + (circuits.length === 1 ? _('circuit') : _('circuits'))),
						E('button', {
							'class': 'tor-btn tor-btn-sm tor-btn-primary',
							'click': L.bind(this.handleNewIdentity, this),
							'disabled': !status.running
						}, ['\uD83D\uDD04 ', _('New Identity')])
					])
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('p', { 'style': 'color: var(--tor-text-secondary); margin-bottom: 16px;' },
						_('Each circuit routes your traffic through three relays: Guard (entry), Middle, and Exit.')),

					// Circuit legend
					E('div', { 'style': 'display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;' }, [
						E('span', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [
							E('span', { 'style': 'width: 12px; height: 12px; border-radius: 3px; background: var(--tor-onion-gradient);' }),
							E('span', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, _('You'))
						]),
						E('span', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [
							E('span', { 'style': 'width: 12px; height: 12px; border-radius: 3px; background: rgba(16,185,129,0.3);' }),
							E('span', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, _('Guard'))
						]),
						E('span', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [
							E('span', { 'style': 'width: 12px; height: 12px; border-radius: 3px; background: rgba(245,158,11,0.3);' }),
							E('span', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, _('Middle'))
						]),
						E('span', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [
							E('span', { 'style': 'width: 12px; height: 12px; border-radius: 3px; background: rgba(239,68,68,0.3);' }),
							E('span', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, _('Exit'))
						])
					]),

					// Circuits container
					E('div', { 'class': 'tor-circuits-container' },
						circuits.length > 0 ?
							circuits.map(function(c) { return self.renderCircuit(c); }) :
							E('div', { 'class': 'tor-empty' }, [
								E('div', { 'class': 'tor-empty-icon' }, '\uD83D\uDD04'),
								E('div', { 'class': 'tor-empty-text' }, _('No active circuits')),
								E('p', {}, _('Tor is not running or not connected'))
							])
					)
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

		this.startPolling();

		return KissTheme.wrap([view], 'admin/services/tor-shield/circuits');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
