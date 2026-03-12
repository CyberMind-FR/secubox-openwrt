'use strict';
'require view';
'require ui';
'require uci';
'require voip.api as api';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('voip'),
			api.getExtensions(),
			api.getCalls()
		]);
	},

	renderStats: function(extensions, calls) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(extensions.length, 'Extensions', c.blue),
			KissTheme.stat(calls.length, 'Active Calls', c.green),
			KissTheme.stat('Ready', 'Status', c.purple)
		];
	},

	renderCallsTable: function(calls) {
		if (!calls || calls.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' },
				'No active calls');
		}

		var self = this;
		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Channel'),
					E('th', {}, 'State'),
					E('th', {}, 'Caller'),
					E('th', {}, 'Connected'),
					E('th', {}, 'Duration'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', {},
				calls.map(function(call) {
					return E('tr', {}, [
						E('td', { 'style': 'font-family: monospace;' }, call.channel),
						E('td', {}, [KissTheme.badge(call.state, call.state === 'Up' ? 'green' : 'orange')]),
						E('td', {}, call.caller),
						E('td', {}, call.connected),
						E('td', {}, call.duration),
						E('td', {}, [
							E('button', {
								'class': 'kiss-btn kiss-btn-red',
								'style': 'padding: 4px 10px; font-size: 11px;',
								'click': ui.createHandlerFn(self, 'handleHangup', call.channel)
							}, 'Hangup')
						])
					]);
				})
			)
		]);
	},

	renderDialpad: function() {
		var digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', {
				'style': 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 280px; margin: 0 auto;'
			},
				digits.map(function(digit) {
					return E('button', {
						'class': 'kiss-btn',
						'style': 'font-size: 24px; padding: 16px; font-weight: 600;',
						'click': function() {
							var input = document.getElementById('to-number');
							input.value += digit;
						}
					}, digit);
				})
			),
			E('div', { 'style': 'display: flex; gap: 8px; justify-content: center;' }, [
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 8px 20px;',
					'click': function() {
						var input = document.getElementById('to-number');
						input.value = input.value.slice(0, -1);
					}
				}, 'Backspace'),
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 8px 20px;',
					'click': function() {
						document.getElementById('to-number').value = '';
					}
				}, 'Clear')
			])
		]);
	},

	render: function(data) {
		var self = this;
		var extensions = data[1] || [];
		var calls = data[2] || [];

		var extOptions = extensions.map(function(ext) {
			return E('option', { 'value': ext.number }, ext.number + ' - ' + ext.name);
		});

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Click to Call'),
					KissTheme.badge('DIALER', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Make calls by selecting your extension and entering the destination number')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' }, this.renderStats(extensions, calls)),

			// Two-column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				// Call form
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
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Destination Number'),
							E('input', {
								'type': 'tel',
								'id': 'to-number',
								'placeholder': '+33612345678',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 12px; border-radius: 6px; font-size: 20px; text-align: center; letter-spacing: 2px;'
							})
						]),
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'style': 'font-size: 18px; padding: 14px;',
							'click': ui.createHandlerFn(this, 'handleCall')
						}, 'Call')
					])
				),

				// Dialpad
				KissTheme.card('Dialpad', this.renderDialpad())
			]),

			// Active calls
			KissTheme.card('Active Calls', this.renderCallsTable(calls))
		];

		return KissTheme.wrap(content, 'admin/services/voip/click-to-call');
	},

	handleCall: function() {
		var fromExt = document.getElementById('from-ext').value;
		var toNumber = document.getElementById('to-number').value;

		if (!fromExt) {
			ui.addNotification(null, E('p', 'Please select your extension'));
			return;
		}

		if (!toNumber) {
			ui.addNotification(null, E('p', 'Please enter a destination number'));
			return;
		}

		ui.showModal('Calling...', [
			E('p', { 'class': 'spinning' }, 'Connecting ' + fromExt + ' to ' + toNumber + '...'),
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, 'Your phone will ring first.')
		]);

		return api.originateCall(fromExt, toNumber).then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', 'Call initiated'));
			} else {
				ui.addNotification(null, E('p', 'Call failed: ' + res.output));
			}
		});
	},

	handleHangup: function(channel) {
		return api.hangupCall(channel).then(function(res) {
			ui.addNotification(null, E('p', 'Call terminated'));
			window.location.reload();
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
