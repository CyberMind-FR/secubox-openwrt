'use strict';
'require view';
'require ui';
'require poll';
'require voip.api as api';
'require secubox/kiss-theme';

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

	renderStats: function(status, extensions) {
		var c = KissTheme.colors;
		var running = status.running === 'true';
		var trunkRegistered = status.trunk_registered === 'true';

		return [
			KissTheme.stat(running ? 'UP' : 'DOWN', 'Service', running ? c.green : c.red),
			KissTheme.stat(trunkRegistered ? 'OK' : 'FAIL', 'SIP Trunk', trunkRegistered ? c.green : c.orange),
			KissTheme.stat(extensions.length, 'Extensions', c.blue),
			KissTheme.stat(status.active_calls || 0, 'Active Calls', c.purple)
		];
	},

	renderActiveCalls: function(callsStr) {
		if (!callsStr || callsStr.trim() === '') {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' },
				'No active calls');
		}

		var lines = callsStr.split('\n').filter(function(l) { return l.trim(); });

		if (lines.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' },
				'No active calls');
		}

		return E('pre', {
			'style': 'background: var(--kiss-bg); padding: 12px; font-size: 11px; overflow-x: auto; border-radius: 6px; color: var(--kiss-text);'
		}, callsStr);
	},

	renderQuickDial: function(extensions) {
		var self = this;
		return E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px;' },
			extensions.map(function(ext) {
				return E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 8px 16px;',
					'data-ext': ext.ext,
					'click': function() {
						document.getElementById('to-number').value = ext.ext;
					}
				}, ext.ext + ' (' + ext.name + ')');
			})
		);
	},

	render: function(data) {
		var self = this;
		var status = data[0];
		var extData = data[1];
		var callsData = data[2];
		var running = status.running === 'true';
		var trunkRegistered = status.trunk_registered === 'true';

		if (!running) {
			var offlineContent = [
				E('div', { 'style': 'margin-bottom: 24px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Click to Call'),
					E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'VoIP click-to-call interface')
				]),
				KissTheme.card('Service Offline',
					E('div', { 'style': 'text-align: center; padding: 40px;' }, [
						E('div', { 'style': 'font-size: 3rem; margin-bottom: 16px;' }, '📞'),
						E('p', { 'style': 'color: var(--kiss-orange);' }, 'VoIP service is not running. Start it from the Overview page.')
					])
				)
			];
			return KissTheme.wrap(offlineContent, 'admin/services/voip/click-to-call');
		}

		var extensions = this.parseExtensions(extData.extensions);

		if (extensions.length === 0) {
			var noExtContent = [
				E('div', { 'style': 'margin-bottom: 24px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Click to Call'),
					E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'VoIP click-to-call interface')
				]),
				KissTheme.card('No Extensions',
					E('div', { 'style': 'text-align: center; padding: 40px;' }, [
						E('div', { 'style': 'font-size: 3rem; margin-bottom: 16px;' }, '📱'),
						E('p', { 'style': 'color: var(--kiss-orange);' }, 'No extensions configured. Add extensions first.')
					])
				)
			];
			return KissTheme.wrap(noExtContent, 'admin/services/voip/click-to-call');
		}

		var extOptions = extensions.map(function(ext) {
			return E('option', { 'value': ext.ext }, ext.ext + ' - ' + ext.name);
		});

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Click to Call'),
					KissTheme.badge(trunkRegistered ? 'TRUNK OK' : 'TRUNK FAIL', trunkRegistered ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Initiate calls from your browser')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' }, this.renderStats(status, extensions)),

			// Make a Call
			KissTheme.card('Make a Call',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Your Extension'),
						E('select', {
							'id': 'from-ext',
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
						}, extOptions)
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Number to Call'),
						E('input', {
							'type': 'tel',
							'id': 'to-number',
							'placeholder': '+33612345678 or extension number',
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px; font-size: 18px;'
						})
					]),
					E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'style': 'font-size: 16px; padding: 12px 40px;',
							'disabled': !trunkRegistered,
							'click': ui.createHandlerFn(this, 'handleCall')
						}, 'Call'),
						!trunkRegistered ? E('span', { 'style': 'color: var(--kiss-red); font-size: 12px;' }, '(SIP trunk not registered)') : ''
					])
				])
			),

			// Two-column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Quick Dial', this.renderQuickDial(extensions)),
				KissTheme.card('Active Calls', E('div', { 'id': 'active-calls' }, this.renderActiveCalls(callsData.calls)))
			])
		];

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

		return KissTheme.wrap(content, 'admin/services/voip/click-to-call');
	},

	handleCall: function() {
		var fromExt = document.getElementById('from-ext').value;
		var toNumber = document.getElementById('to-number').value.trim();

		if (!toNumber) {
			ui.addNotification(null, E('p', 'Enter a number to call'));
			return Promise.resolve();
		}

		ui.showModal('Calling...', [
			E('p', { 'class': 'spinning' }, 'Connecting ' + fromExt + ' to ' + toNumber + '...')
		]);

		return api.originateCall(fromExt, toNumber).then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', 'Call initiated. Your phone will ring first.'));
			} else {
				ui.addNotification(null, E('p', 'Call failed: ' + (res.error || 'Unknown error')));
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Call failed: ' + e.message));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
