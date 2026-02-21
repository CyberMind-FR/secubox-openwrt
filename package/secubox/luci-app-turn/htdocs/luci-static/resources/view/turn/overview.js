'use strict';
'require view';
'require rpc';
'require poll';
'require ui';

var callStatus = rpc.declare({ object: 'luci.turn', method: 'status', expect: {} });
var callStart = rpc.declare({ object: 'luci.turn', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.turn', method: 'stop', expect: {} });
var callEnable = rpc.declare({ object: 'luci.turn', method: 'enable', expect: {} });
var callDisable = rpc.declare({ object: 'luci.turn', method: 'disable', expect: {} });
var callSetupJitsi = rpc.declare({ object: 'luci.turn', method: 'setup_jitsi', params: ['jitsi_domain', 'turn_domain'], expect: {} });
var callSSL = rpc.declare({ object: 'luci.turn', method: 'ssl', params: ['domain'], expect: {} });
var callExpose = rpc.declare({ object: 'luci.turn', method: 'expose', params: ['domain'], expect: {} });
var callCredentials = rpc.declare({ object: 'luci.turn', method: 'credentials', params: ['username', 'ttl'], expect: {} });
var callLogs = rpc.declare({ object: 'luci.turn', method: 'logs', params: ['lines'], expect: {} });

return view.extend({
	data: {},

	load: function() {
		return callStatus().then(function(r) { this.data = r; return r; }.bind(this));
	},

	render: function(data) {
		var self = this;
		this.data = data || {};

		poll.add(function() {
			return callStatus().then(function(r) {
				self.data = r;
				self.updateUI(r);
			});
		}, 5);

		return E('div', { 'class': 'cbi-map' }, [
			E('style', {}, this.getStyles()),

			E('div', { 'class': 'sb-header' }, [
				E('h2', {}, 'TURN Server'),
				E('div', { 'class': 'sb-chips' }, [
					E('span', { 'class': 'chip', 'id': 'chip-status' },
						this.data.running ? 'Running' : 'Stopped'),
					E('span', { 'class': 'chip' }, 'Realm: ' + (this.data.realm || 'N/A')),
					E('span', { 'class': 'chip' }, 'Port: ' + (this.data.port || 3478))
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Service Control'),
				E('div', { 'class': 'btn-row' }, [
					E('button', { 'class': 'sb-btn sb-btn-success', 'click': ui.createHandlerFn(this, 'handleStart') }, 'Start'),
					E('button', { 'class': 'sb-btn sb-btn-danger', 'click': ui.createHandlerFn(this, 'handleStop') }, 'Stop'),
					E('button', { 'class': 'sb-btn', 'click': ui.createHandlerFn(this, 'handleEnable') }, 'Enable Autostart'),
					E('button', { 'class': 'sb-btn', 'click': ui.createHandlerFn(this, 'handleDisable') }, 'Disable Autostart')
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Status'),
				E('div', { 'class': 'sb-grid' }, [
					this.renderCard('Server', this.data.running ? 'Running' : 'Stopped', this.data.running ? 'success' : 'danger'),
					this.renderCard('UDP 3478', this.data.udp_3478 ? 'Listening' : 'Closed', this.data.udp_3478 ? 'success' : 'warning'),
					this.renderCard('TCP 5349', this.data.tcp_5349 ? 'Listening' : 'Closed', this.data.tcp_5349 ? 'success' : 'warning'),
					this.renderCard('External IP', this.data.external_ip || this.data.detected_ip || 'Unknown', 'info')
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Jitsi Integration'),
				E('p', {}, 'Configure TURN server for Jitsi Meet WebRTC connections'),
				E('div', { 'class': 'form-row' }, [
					E('input', { 'type': 'text', 'id': 'jitsi-domain', 'placeholder': 'jitsi.secubox.in', 'class': 'sb-input' }),
					E('input', { 'type': 'text', 'id': 'turn-domain', 'placeholder': 'turn.secubox.in', 'class': 'sb-input' }),
					E('button', { 'class': 'sb-btn sb-btn-primary', 'click': ui.createHandlerFn(this, 'handleSetupJitsi') }, 'Setup for Jitsi')
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'SSL & Expose'),
				E('div', { 'class': 'form-row' }, [
					E('input', { 'type': 'text', 'id': 'ssl-domain', 'placeholder': 'turn.secubox.in', 'class': 'sb-input' }),
					E('button', { 'class': 'sb-btn', 'click': ui.createHandlerFn(this, 'handleSSL') }, 'Setup SSL'),
					E('button', { 'class': 'sb-btn sb-btn-primary', 'click': ui.createHandlerFn(this, 'handleExpose') }, 'Expose (DNS+FW)')
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Generate Credentials'),
				E('p', {}, 'Generate time-limited TURN credentials for WebRTC clients'),
				E('div', { 'class': 'form-row' }, [
					E('input', { 'type': 'text', 'id': 'cred-user', 'placeholder': 'username', 'value': 'webrtc', 'class': 'sb-input' }),
					E('input', { 'type': 'number', 'id': 'cred-ttl', 'placeholder': 'TTL (seconds)', 'value': '86400', 'class': 'sb-input' }),
					E('button', { 'class': 'sb-btn sb-btn-primary', 'click': ui.createHandlerFn(this, 'handleCredentials') }, 'Generate')
				]),
				E('pre', { 'id': 'credentials-output', 'class': 'sb-output', 'style': 'display:none;' }, '')
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Logs'),
				E('button', { 'class': 'sb-btn', 'click': ui.createHandlerFn(this, 'handleShowLogs') }, 'Show Logs'),
				E('pre', { 'id': 'logs-output', 'class': 'sb-output', 'style': 'display:none; max-height:300px; overflow:auto;' }, '')
			])
		]);
	},

	renderCard: function(title, value, status) {
		var statusClass = status === 'success' ? 'card-success' : (status === 'danger' ? 'card-danger' : (status === 'warning' ? 'card-warning' : 'card-info'));
		return E('div', { 'class': 'sb-card ' + statusClass }, [
			E('div', { 'class': 'card-title' }, title),
			E('div', { 'class': 'card-value' }, value)
		]);
	},

	updateUI: function(data) {
		var chip = document.getElementById('chip-status');
		if (chip) {
			chip.textContent = data.running ? 'Running' : 'Stopped';
			chip.className = 'chip ' + (data.running ? 'chip-success' : 'chip-danger');
		}
	},

	handleStart: function() {
		return callStart().then(function() {
			ui.addNotification(null, E('p', 'TURN server started'));
		});
	},

	handleStop: function() {
		return callStop().then(function() {
			ui.addNotification(null, E('p', 'TURN server stopped'));
		});
	},

	handleEnable: function() {
		return callEnable().then(function() {
			ui.addNotification(null, E('p', 'TURN server enabled'));
		});
	},

	handleDisable: function() {
		return callDisable().then(function() {
			ui.addNotification(null, E('p', 'TURN server disabled'));
		});
	},

	handleSetupJitsi: function() {
		var jitsiDomain = document.getElementById('jitsi-domain').value || 'jitsi.secubox.in';
		var turnDomain = document.getElementById('turn-domain').value || 'turn.secubox.in';

		return callSetupJitsi(jitsiDomain, turnDomain).then(function(res) {
			ui.addNotification(null, E('p', 'TURN configured for Jitsi. Auth secret: ' + (res.auth_secret || 'generated')));
		});
	},

	handleSSL: function() {
		var domain = document.getElementById('ssl-domain').value || 'turn.secubox.in';
		return callSSL(domain).then(function(res) {
			ui.addNotification(null, E('p', 'SSL configured for ' + domain));
		});
	},

	handleExpose: function() {
		var domain = document.getElementById('ssl-domain').value || 'turn.secubox.in';
		return callExpose(domain).then(function(res) {
			ui.addNotification(null, E('p', 'TURN exposed on ' + domain));
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
			var output = document.getElementById('logs-output');
			output.style.display = 'block';
			output.textContent = res.logs || 'No logs available';
		});
	},

	getStyles: function() {
		return [
			'.sb-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
			'.sb-chips { display:flex; gap:10px; }',
			'.chip { padding:5px 12px; border-radius:15px; font-size:0.85em; background:#444; color:#fff; }',
			'.chip-success { background:#28a745; }',
			'.chip-danger { background:#dc3545; }',
			'.sb-section { background:#1a1a2e; padding:20px; margin-bottom:15px; border-radius:8px; }',
			'.sb-section h3 { margin:0 0 15px 0; color:#4fc3f7; }',
			'.sb-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:15px; }',
			'.sb-card { padding:15px; border-radius:8px; text-align:center; }',
			'.card-success { background:#155724; border:1px solid #28a745; }',
			'.card-danger { background:#721c24; border:1px solid #dc3545; }',
			'.card-warning { background:#856404; border:1px solid #ffc107; }',
			'.card-info { background:#0c5460; border:1px solid #17a2b8; }',
			'.card-title { font-size:0.85em; color:#aaa; margin-bottom:5px; }',
			'.card-value { font-size:1.1em; font-weight:bold; }',
			'.btn-row { display:flex; gap:10px; flex-wrap:wrap; }',
			'.sb-btn { padding:8px 16px; border:none; border-radius:5px; cursor:pointer; background:#444; color:#fff; }',
			'.sb-btn:hover { background:#555; }',
			'.sb-btn-primary { background:#007bff; }',
			'.sb-btn-primary:hover { background:#0056b3; }',
			'.sb-btn-success { background:#28a745; }',
			'.sb-btn-success:hover { background:#218838; }',
			'.sb-btn-danger { background:#dc3545; }',
			'.sb-btn-danger:hover { background:#c82333; }',
			'.form-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }',
			'.sb-input { padding:8px 12px; border:1px solid #444; border-radius:5px; background:#2a2a3e; color:#fff; }',
			'.sb-output { background:#0a0a15; padding:15px; border-radius:5px; font-family:monospace; font-size:0.9em; white-space:pre-wrap; word-break:break-all; }'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
