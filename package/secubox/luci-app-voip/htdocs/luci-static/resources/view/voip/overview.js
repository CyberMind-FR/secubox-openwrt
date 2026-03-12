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
			api.getExtensions(),
			api.getCalls(),
			api.getTrunkStatus()
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/voip/overview' },
			{ name: 'Extensions', path: 'admin/services/voip/extensions' },
			{ name: 'Trunks', path: 'admin/services/voip/trunks' },
			{ name: 'Recordings', path: 'admin/services/voip/recordings' },
			{ name: 'Dialer', path: 'admin/services/voip/dialer' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(status, trunk) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.running ? 'UP' : 'DOWN', 'Container', status.running ? c.green : c.red),
			KissTheme.stat(trunk.registered ? 'REG' : 'UNREG', 'SIP Trunk', trunk.registered ? c.green : c.yellow),
			KissTheme.stat(status.extensions || 0, 'Extensions', c.blue),
			KissTheme.stat(status.active_calls || 0, 'Active Calls', (status.active_calls || 0) > 0 ? c.orange : c.muted)
		];
	},

	renderControls: function(status) {
		var self = this;
		var isRunning = status.running;

		return E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'disabled': isRunning,
				'click': function() { self.handleStart(); }
			}, 'Start'),
			E('button', {
				'class': 'kiss-btn kiss-btn-red',
				'disabled': !isRunning,
				'click': function() { self.handleStop(); }
			}, 'Stop'),
			E('button', {
				'class': 'kiss-btn',
				'click': function() { self.handleRestart(); }
			}, 'Restart'),
			E('button', {
				'class': 'kiss-btn',
				'disabled': !isRunning,
				'click': function() { self.handleReload(); }
			}, 'Reload Config')
		]);
	},

	renderCalls: function(calls) {
		var self = this;
		if (!calls || calls.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No active calls');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Channel'),
				E('th', {}, 'State'),
				E('th', {}, 'Caller'),
				E('th', {}, 'Connected'),
				E('th', {}, 'Duration'),
				E('th', { 'style': 'width: 80px;' }, 'Action')
			])),
			E('tbody', {}, calls.map(function(call) {
				return E('tr', {}, [
					E('td', { 'style': 'font-family: monospace; font-size: 11px;' }, call.channel),
					E('td', {}, KissTheme.badge(call.state, call.state === 'Up' ? 'green' : 'yellow')),
					E('td', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, call.caller),
					E('td', { 'style': 'font-family: monospace;' }, call.connected),
					E('td', { 'style': 'font-family: monospace; color: var(--kiss-muted);' }, call.duration),
					E('td', {}, E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': function() { self.handleHangup(call.channel); }
					}, 'Hangup'))
				]);
			}))
		]);
	},

	renderExtensions: function(extensions) {
		if (!extensions || extensions.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No extensions configured');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Number'),
				E('th', {}, 'Name'),
				E('th', {}, 'Context'),
				E('th', {}, 'Voicemail')
			])),
			E('tbody', {}, extensions.map(function(ext) {
				return E('tr', {}, [
					E('td', { 'style': 'font-family: monospace; font-weight: 600; color: var(--kiss-cyan);' }, ext.number),
					E('td', {}, ext.name),
					E('td', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, ext.context),
					E('td', {}, KissTheme.badge(ext.voicemail ? 'Yes' : 'No', ext.voicemail ? 'green' : 'red'))
				]);
			}))
		]);
	},

	handleStart: function() {
		ui.showModal('Starting...', [E('p', { 'class': 'spinning' }, 'Starting VoIP...')]);
		api.start().then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', 'VoIP started'), 'success');
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + res.output), 'error');
			}
			location.reload();
		});
	},

	handleStop: function() {
		api.stop().then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', 'VoIP stopped'), 'success');
			}
			location.reload();
		});
	},

	handleRestart: function() {
		ui.showModal('Restarting...', [E('p', { 'class': 'spinning' }, 'Restarting VoIP...')]);
		api.restart().then(function(res) {
			ui.hideModal();
			location.reload();
		});
	},

	handleReload: function() {
		api.reload().then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', 'Configuration reloaded'), 'success');
			}
		});
	},

	handleHangup: function(channel) {
		api.hangupCall(channel).then(function(res) {
			ui.addNotification(null, E('p', 'Call terminated'), 'success');
			location.reload();
		});
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var extensions = data[1] || [];
		var calls = data[2] || [];
		var trunk = data[3] || {};
		var c = KissTheme.colors;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'VoIP PBX'),
					KissTheme.badge(status.running ? 'RUNNING' : 'STOPPED', status.running ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Asterisk-based private branch exchange')
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats row
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'voip-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status, trunk)),

			// Controls
			E('div', { 'style': 'margin-bottom: 20px;' }, this.renderControls(status)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Active Calls', E('div', { 'id': 'calls-card' }, this.renderCalls(calls))),
				KissTheme.card('Extensions', E('div', { 'id': 'extensions-card' }, this.renderExtensions(extensions)))
			])
		];

		poll.add(function() {
			return api.getStatus();
		}, 5);

		return KissTheme.wrap(content, 'admin/services/voip/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
