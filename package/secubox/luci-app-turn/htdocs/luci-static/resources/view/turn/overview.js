'use strict';
'require view';
'require rpc';
'require poll';
'require ui';
'require secubox/kiss-theme';

var callStatus = rpc.declare({ object: 'luci.turn', method: 'status', expect: {} });
var callStart = rpc.declare({ object: 'luci.turn', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.turn', method: 'stop', expect: {} });
var callEnable = rpc.declare({ object: 'luci.turn', method: 'enable', expect: {} });
var callDisable = rpc.declare({ object: 'luci.turn', method: 'disable', expect: {} });
var callSetupJitsi = rpc.declare({ object: 'luci.turn', method: 'setup_jitsi', params: ['jitsi_domain', 'turn_domain'], expect: {} });
var callSetupNextcloud = rpc.declare({ object: 'luci.turn', method: 'setup_nextcloud', params: ['turn_domain', 'use_port_443'], expect: {} });
var callSSL = rpc.declare({ object: 'luci.turn', method: 'ssl', params: ['domain'], expect: {} });
var callExpose = rpc.declare({ object: 'luci.turn', method: 'expose', params: ['domain'], expect: {} });
var callCredentials = rpc.declare({ object: 'luci.turn', method: 'credentials', params: ['username', 'ttl'], expect: {} });
var callLogs = rpc.declare({ object: 'luci.turn', method: 'logs', params: ['lines'], expect: {} });

return view.extend({
	data: {},

	load: function() {
		return callStatus().then(function(r) { this.data = r; return r; }.bind(this));
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/turn/overview' },
			{ name: 'Settings', path: 'admin/services/turn/settings' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(data) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(data.running ? 'UP' : 'DOWN', 'Server', data.running ? c.green : c.red),
			KissTheme.stat(data.udp_3478 ? 'YES' : 'NO', 'UDP 3478', data.udp_3478 ? c.green : c.yellow),
			KissTheme.stat(data.tcp_5349 ? 'YES' : 'NO', 'TCP 5349', data.tcp_5349 ? c.green : c.yellow),
			KissTheme.stat(data.port || 3478, 'Port', c.blue)
		];
	},

	renderHealth: function(data) {
		var checks = [
			{ label: 'Server', ok: data.running, value: data.running ? 'Running' : 'Stopped' },
			{ label: 'UDP 3478', ok: data.udp_3478, value: data.udp_3478 ? 'Listening' : 'Closed' },
			{ label: 'TCP 5349', ok: data.tcp_5349, value: data.tcp_5349 ? 'Listening' : 'Closed' },
			{ label: 'Realm', ok: true, value: data.realm || 'N/A' },
			{ label: 'External IP', ok: !!(data.external_ip || data.detected_ip), value: data.external_ip || data.detected_ip || 'Unknown' }
		];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, checks.map(function(c) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
				E('div', { 'style': 'width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; ' +
					(c.ok ? 'background: rgba(0,200,83,0.15); color: var(--kiss-green);' : 'background: rgba(255,23,68,0.15); color: var(--kiss-red);') },
					c.ok ? '\u2713' : '\u2717'),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-size: 13px; color: var(--kiss-text);' }, c.label),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, c.value)
				])
			]);
		}));
	},

	renderControls: function(data) {
		var self = this;
		var running = data.running;

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': ui.createHandlerFn(this, 'handleStart')
				}, 'Start'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': ui.createHandlerFn(this, 'handleStop')
				}, 'Stop'),
				E('button', {
					'class': 'kiss-btn',
					'click': ui.createHandlerFn(this, 'handleEnable')
				}, 'Enable'),
				E('button', {
					'class': 'kiss-btn',
					'click': ui.createHandlerFn(this, 'handleDisable')
				}, 'Disable')
			]),
			E('button', {
				'class': 'kiss-btn',
				'click': ui.createHandlerFn(this, 'handleShowLogs')
			}, 'View Logs')
		]);
	},

	renderJitsiSetup: function() {
		var self = this;
		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Configure TURN server for Jitsi Meet WebRTC connections'),
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('input', { 'type': 'text', 'id': 'jitsi-domain', 'placeholder': 'jitsi.secubox.in', 'style': 'flex: 1; min-width: 150px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' }),
				E('input', { 'type': 'text', 'id': 'turn-domain', 'placeholder': 'turn.secubox.in', 'style': 'flex: 1; min-width: 150px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' }),
				E('button', { 'class': 'kiss-btn kiss-btn-blue', 'click': ui.createHandlerFn(this, 'handleSetupJitsi') }, 'Setup')
			])
		]);
	},

	renderNextcloudSetup: function() {
		var self = this;
		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Configure TURN for Nextcloud Talk (uses port 443)'),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('input', { 'type': 'text', 'id': 'nc-turn-domain', 'placeholder': 'turn.secubox.in', 'style': 'flex: 1; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' }),
				E('button', { 'class': 'kiss-btn kiss-btn-blue', 'click': ui.createHandlerFn(this, 'handleSetupNextcloud') }, 'Setup')
			]),
			E('pre', { 'id': 'nextcloud-output', 'style': 'display: none; background: var(--kiss-bg); color: var(--kiss-green); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-top: 8px;' }, '')
		]);
	},

	renderCredentials: function() {
		var self = this;
		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Generate time-limited TURN credentials for WebRTC clients'),
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('input', { 'type': 'text', 'id': 'cred-user', 'placeholder': 'username', 'value': 'webrtc', 'style': 'width: 120px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' }),
				E('input', { 'type': 'number', 'id': 'cred-ttl', 'placeholder': 'TTL (s)', 'value': '86400', 'style': 'width: 120px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' }),
				E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': ui.createHandlerFn(this, 'handleCredentials') }, 'Generate')
			]),
			E('pre', { 'id': 'credentials-output', 'style': 'display: none; background: var(--kiss-bg); color: var(--kiss-cyan); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-top: 8px;' }, '')
		]);
	},

	handleStart: function() {
		return callStart().then(function() {
			ui.addNotification(null, E('p', 'TURN server started'), 'success');
			location.reload();
		});
	},

	handleStop: function() {
		return callStop().then(function() {
			ui.addNotification(null, E('p', 'TURN server stopped'), 'info');
			location.reload();
		});
	},

	handleEnable: function() {
		return callEnable().then(function() {
			ui.addNotification(null, E('p', 'TURN server enabled'), 'success');
		});
	},

	handleDisable: function() {
		return callDisable().then(function() {
			ui.addNotification(null, E('p', 'TURN server disabled'), 'info');
		});
	},

	handleSetupJitsi: function() {
		var jitsiDomain = document.getElementById('jitsi-domain').value || 'jitsi.secubox.in';
		var turnDomain = document.getElementById('turn-domain').value || 'turn.secubox.in';

		return callSetupJitsi(jitsiDomain, turnDomain).then(function(res) {
			ui.addNotification(null, E('p', 'TURN configured for Jitsi. Auth secret: ' + (res.auth_secret || 'generated')), 'success');
		});
	},

	handleSetupNextcloud: function() {
		var turnDomain = document.getElementById('nc-turn-domain').value || 'turn.secubox.in';

		return callSetupNextcloud(turnDomain, 'yes').then(function(res) {
			var output = document.getElementById('nextcloud-output');
			output.style.display = 'block';
			output.textContent = 'Nextcloud Talk Settings:\n' +
				'STUN: ' + turnDomain + ':' + (res.stun_port || 3478) + '\n' +
				'TURN: ' + turnDomain + ':' + (res.tls_port || 443) + '\n' +
				'Secret: ' + (res.auth_secret || '');
			ui.addNotification(null, E('p', 'TURN configured for Nextcloud Talk'), 'success');
		});
	},

	handleCredentials: function() {
		var username = document.getElementById('cred-user').value || 'webrtc';
		var ttl = parseInt(document.getElementById('cred-ttl').value) || 86400;

		return callCredentials(username, ttl).then(function(res) {
			var output = document.getElementById('credentials-output');
			output.style.display = 'block';
			output.textContent = JSON.stringify({
				urls: ['turn:' + res.realm + ':3478', 'turn:' + res.realm + ':3478?transport=tcp'],
				username: res.username,
				credential: res.password
			}, null, 2);
		});
	},

	handleShowLogs: function() {
		return callLogs(100).then(function(res) {
			ui.showModal('TURN Logs', [
				E('pre', { 'style': 'background: var(--kiss-bg); color: var(--kiss-green); padding: 16px; border-radius: 6px; max-height: 400px; overflow: auto; font-family: monospace; font-size: 11px;' }, res.logs || 'No logs available'),
				E('div', { 'style': 'display: flex; justify-content: flex-end; margin-top: 16px;' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Close')
				])
			]);
		});
	},

	render: function(data) {
		var self = this;
		this.data = data || {};

		poll.add(function() {
			return callStatus().then(function(r) {
				self.data = r;
				var statsEl = document.getElementById('turn-stats');
				if (statsEl) {
					statsEl.innerHTML = '';
					self.renderStats(r).forEach(function(el) { statsEl.appendChild(el); });
				}
			});
		}, 5);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'TURN Server'),
					KissTheme.badge(this.data.running ? 'RUNNING' : 'STOPPED', this.data.running ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'WebRTC relay server for NAT traversal')
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'turn-stats', 'style': 'margin: 20px 0;' }, this.renderStats(this.data)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('System Health', this.renderHealth(this.data)),
				KissTheme.card('Controls', this.renderControls(this.data))
			]),

			// Integration cards
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Jitsi Integration', this.renderJitsiSetup()),
				KissTheme.card('Nextcloud Talk', this.renderNextcloudSetup())
			]),

			// Credentials
			KissTheme.card('Generate Credentials', this.renderCredentials())
		];

		return KissTheme.wrap(content, 'admin/services/turn/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
