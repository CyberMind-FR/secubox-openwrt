'use strict';
'require view';
'require ui';
'require poll';
'require voip.api as api';

return view.extend({
	load: function() {
		return Promise.all([
			api.getStatus(),
			api.listExtensions(),
			api.listCalls()
		]);
	},

	parseExtensions: function(extString) {
		if (!extString) return [];

		return extString.split(',').filter(function(e) { return e; }).map(function(entry) {
			var parts = entry.split(':');
			return {
				ext: parts[0],
				name: parts[1] || parts[0]
			};
		});
	},

	render: function(data) {
		var self = this;
		var status = data[0];
		var extData = data[1];
		var callsData = data[2];
		var running = status.running === 'true';
		var trunkRegistered = status.trunk_registered === 'true';

		if (!running) {
			return E('div', { 'class': 'cbi-map' }, [
				E('h2', {}, 'Click to Call'),
				E('p', { 'class': 'alert-message warning' },
					'VoIP service is not running. Start it from the Overview page.')
			]);
		}

		var extensions = this.parseExtensions(extData.extensions);

		if (extensions.length === 0) {
			return E('div', { 'class': 'cbi-map' }, [
				E('h2', {}, 'Click to Call'),
				E('p', { 'class': 'alert-message warning' },
					'No extensions configured. Add extensions first.')
			]);
		}

		// Extension selector
		var extOptions = extensions.map(function(ext) {
			return E('option', { 'value': ext.ext }, ext.ext + ' - ' + ext.name);
		});

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Click to Call'),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Make a Call'),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Your Extension'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'from-ext', 'class': 'cbi-input-select' }, extOptions)
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Number to Call'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'tel',
							'id': 'to-number',
							'class': 'cbi-input-text',
							'placeholder': '+33612345678 or extension number',
							'style': 'width: 300px;'
						})
					])
				]),

				E('div', { 'class': 'cbi-page-actions' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-positive',
						'style': 'font-size: 16px; padding: 10px 30px;',
						'disabled': !trunkRegistered,
						'click': ui.createHandlerFn(this, function() {
							return this.handleCall();
						})
					}, 'Call'),
					!trunkRegistered ? E('span', {
						'style': 'margin-left: 10px; color: #c00;'
					}, '(SIP trunk not registered)') : ''
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Active Calls'),
				E('div', { 'id': 'active-calls' }, this.renderActiveCalls(callsData.calls))
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Quick Dial'),
				E('p', {}, 'Click an extension to call directly:'),
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 10px;' },
					extensions.map(function(ext) {
						return E('button', {
							'class': 'btn cbi-button',
							'data-ext': ext.ext,
							'click': function() {
								document.getElementById('to-number').value = ext.ext;
							}
						}, ext.ext + ' (' + ext.name + ')');
					})
				)
			])
		]);

		// Poll for active calls
		poll.add(L.bind(function() {
			return api.listCalls().then(L.bind(function(res) {
				var container = document.getElementById('active-calls');
				if (container) {
					container.innerHTML = '';
					container.appendChild(this.renderActiveCalls(res.calls));
				}
			}, this));
		}, this), 3);

		return view;
	},

	renderActiveCalls: function(callsStr) {
		if (!callsStr || callsStr.trim() === '') {
			return E('p', { 'class': 'alert-message' }, 'No active calls');
		}

		var lines = callsStr.split('\n').filter(function(l) { return l.trim(); });

		if (lines.length === 0) {
			return E('p', { 'class': 'alert-message' }, 'No active calls');
		}

		return E('pre', {
			'style': 'background: #f5f5f5; padding: 10px; font-size: 12px; overflow-x: auto;'
		}, callsStr);
	},

	handleCall: function() {
		var fromExt = document.getElementById('from-ext').value;
		var toNumber = document.getElementById('to-number').value.trim();

		if (!toNumber) {
			ui.addNotification(null, E('p', 'Enter a number to call'), 'error');
			return Promise.resolve();
		}

		ui.showModal('Calling...', [
			E('p', { 'class': 'spinning' }, 'Connecting ' + fromExt + ' to ' + toNumber + '...')
		]);

		return api.originateCall(fromExt, toNumber).then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', 'Call initiated. Your phone will ring first.'), 'success');
			} else {
				ui.addNotification(null, E('p', 'Call failed: ' + (res.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Call failed: ' + e.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
