'use strict';
'require view';
'require rpc';
'require poll';
'require ui';

var callBridgeStatus = rpc.declare({ object: 'luci.webradio', method: 'bridge_status', expect: {} });
var callBridgeStart = rpc.declare({ object: 'luci.webradio', method: 'bridge_start', expect: {} });
var callBridgeStop = rpc.declare({ object: 'luci.webradio', method: 'bridge_stop', expect: {} });
var callBridgeSetup = rpc.declare({ object: 'luci.webradio', method: 'bridge_setup', params: ['lyrion_server'], expect: {} });

return view.extend({
	data: {},

	load: function() {
		return callBridgeStatus().then(function(r) { this.data = r; return r; }.bind(this)).catch(function() { return {}; });
	},

	render: function(data) {
		var self = this;
		this.data = data || {};

		poll.add(function() {
			return callBridgeStatus().then(function(r) {
				self.data = r;
				self.updateUI(r);
			}).catch(function() {});
		}, 5);

		return E('div', { 'class': 'cbi-map' }, [
			E('style', {}, this.getStyles()),

			E('div', { 'class': 'sb-header' }, [
				E('h2', {}, 'Lyrion Stream Bridge'),
				E('div', { 'class': 'sb-chips' }, [
					E('span', { 'class': 'chip', 'id': 'chip-bridge' }, this.data.bridge_running ? 'Bridge Running' : 'Bridge Stopped'),
					E('span', { 'class': 'chip', 'id': 'chip-lyrion' }, this.data.lyrion_online ? 'Lyrion Online' : 'Lyrion Offline')
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Architecture'),
				E('div', { 'class': 'pipeline' }, [
					E('span', { 'class': 'pipe-node' }, 'Lyrion Server'),
					E('span', { 'class': 'pipe-arrow' }, '\u2192'),
					E('span', { 'class': 'pipe-node' }, 'Squeezelite'),
					E('span', { 'class': 'pipe-arrow' }, '\u2192'),
					E('span', { 'class': 'pipe-node' }, 'FIFO'),
					E('span', { 'class': 'pipe-arrow' }, '\u2192'),
					E('span', { 'class': 'pipe-node' }, 'FFmpeg'),
					E('span', { 'class': 'pipe-arrow' }, '\u2192'),
					E('span', { 'class': 'pipe-node' }, 'Icecast')
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Status'),
				E('div', { 'class': 'sb-grid' }, [
					this.renderCard('Lyrion', this.data.lyrion_online ? 'Online' : 'Offline', this.data.lyrion_online ? 'success' : 'danger', 'lyrion-card'),
					this.renderCard('Squeezelite', this.data.squeezelite_running ? 'Running' : 'Stopped', this.data.squeezelite_running ? 'success' : 'warning', 'squeeze-card'),
					this.renderCard('FFmpeg', this.data.ffmpeg_running ? 'Encoding' : 'Idle', this.data.ffmpeg_running ? 'success' : 'warning', 'ffmpeg-card'),
					this.renderCard('Icecast Mount', this.data.mount_active ? 'Active' : 'Inactive', this.data.mount_active ? 'success' : 'warning', 'mount-card')
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Now Playing'),
				E('div', { 'class': 'now-playing', 'id': 'now-playing' }, [
					E('span', { 'class': 'np-title' }, this.data.title || 'Nothing playing'),
					this.data.artist ? E('span', { 'class': 'np-artist' }, this.data.artist) : ''
				]),
				E('div', { 'style': 'margin-top:10px;' }, [
					E('span', {}, 'Listeners: '),
					E('strong', { 'id': 'listeners' }, String(this.data.listeners || 0))
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Quick Setup'),
				E('div', { 'class': 'form-row' }, [
					E('input', { 'type': 'text', 'id': 'lyrion-server', 'placeholder': 'Lyrion IP (e.g. 127.0.0.1)', 'value': this.data.lyrion_server || '', 'class': 'sb-input' }),
					E('button', { 'class': 'sb-btn sb-btn-primary', 'click': ui.createHandlerFn(this, 'handleSetup') }, 'Setup Pipeline')
				]),
				E('p', { 'style': 'color:#888; font-size:0.9em; margin-top:10px;' },
					'This will configure Squeezelite FIFO output, FFmpeg encoder, and Icecast mount.')
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Bridge Control'),
				E('div', { 'class': 'btn-row' }, [
					E('button', { 'class': 'sb-btn sb-btn-success', 'click': ui.createHandlerFn(this, 'handleStart') }, 'Start Bridge'),
					E('button', { 'class': 'sb-btn sb-btn-danger', 'click': ui.createHandlerFn(this, 'handleStop') }, 'Stop Bridge')
				])
			]),

			E('div', { 'class': 'sb-section' }, [
				E('h3', {}, 'Stream URL'),
				E('div', { 'class': 'stream-url' }, [
					E('a', { 'href': this.data.stream_url || '#', 'target': '_blank', 'id': 'stream-url-link' },
						this.data.stream_url || 'http://127.0.0.1:8000/lyrion')
				]),
				E('audio', { 'controls': true, 'style': 'width:100%; max-width:400px; margin-top:10px;' }, [
					E('source', { 'src': this.data.stream_url || 'http://127.0.0.1:8000/lyrion', 'type': 'audio/mpeg' })
				])
			])
		]);
	},

	renderCard: function(title, value, status, id) {
		var cls = 'sb-card card-' + status;
		return E('div', { 'class': cls, 'id': id }, [
			E('div', { 'class': 'card-title' }, title),
			E('div', { 'class': 'card-value' }, value)
		]);
	},

	updateUI: function(data) {
		var chipBridge = document.getElementById('chip-bridge');
		var chipLyrion = document.getElementById('chip-lyrion');
		if (chipBridge) chipBridge.textContent = data.bridge_running ? 'Bridge Running' : 'Bridge Stopped';
		if (chipLyrion) chipLyrion.textContent = data.lyrion_online ? 'Lyrion Online' : 'Lyrion Offline';

		var np = document.getElementById('now-playing');
		if (np) {
			np.innerHTML = '';
			np.appendChild(E('span', { 'class': 'np-title' }, data.title || 'Nothing playing'));
			if (data.artist) np.appendChild(E('span', { 'class': 'np-artist' }, data.artist));
		}

		var listeners = document.getElementById('listeners');
		if (listeners) listeners.textContent = String(data.listeners || 0);
	},

	handleSetup: function() {
		var server = document.getElementById('lyrion-server').value || '127.0.0.1';
		return callBridgeSetup(server).then(function(res) {
			ui.addNotification(null, E('p', 'Pipeline setup complete. Stream URL: ' + (res.stream_url || 'http://127.0.0.1:8000/lyrion')));
		}).catch(function(e) {
			ui.addNotification(null, E('p', 'Setup failed: ' + e.message), 'error');
		});
	},

	handleStart: function() {
		return callBridgeStart().then(function() {
			ui.addNotification(null, E('p', 'Lyrion bridge started'));
		}).catch(function(e) {
			ui.addNotification(null, E('p', 'Failed: ' + e.message), 'error');
		});
	},

	handleStop: function() {
		return callBridgeStop().then(function() {
			ui.addNotification(null, E('p', 'Lyrion bridge stopped'));
		}).catch(function(e) {
			ui.addNotification(null, E('p', 'Failed: ' + e.message), 'error');
		});
	},

	getStyles: function() {
		return [
			'.sb-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
			'.sb-chips { display:flex; gap:10px; }',
			'.chip { padding:5px 12px; border-radius:15px; font-size:0.85em; background:#444; color:#fff; }',
			'.sb-section { background:#1a1a2e; padding:20px; margin-bottom:15px; border-radius:8px; }',
			'.sb-section h3 { margin:0 0 15px 0; color:#4fc3f7; }',
			'.pipeline { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:15px; background:#0a0a15; border-radius:5px; }',
			'.pipe-node { padding:8px 15px; background:#2196f3; color:#fff; border-radius:20px; font-weight:bold; }',
			'.pipe-arrow { color:#4fc3f7; font-size:1.5em; }',
			'.sb-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:15px; }',
			'.sb-card { padding:15px; border-radius:8px; text-align:center; }',
			'.card-success { background:#155724; border:1px solid #28a745; }',
			'.card-danger { background:#721c24; border:1px solid #dc3545; }',
			'.card-warning { background:#856404; border:1px solid #ffc107; }',
			'.card-title { font-size:0.85em; color:#aaa; margin-bottom:5px; }',
			'.card-value { font-size:1.1em; font-weight:bold; }',
			'.now-playing { padding:15px; background:#0a0a15; border-radius:5px; }',
			'.np-title { display:block; font-size:1.2em; font-weight:bold; }',
			'.np-artist { display:block; color:#888; margin-top:5px; }',
			'.btn-row { display:flex; gap:10px; flex-wrap:wrap; }',
			'.sb-btn { padding:8px 16px; border:none; border-radius:5px; cursor:pointer; background:#444; color:#fff; }',
			'.sb-btn:hover { background:#555; }',
			'.sb-btn-primary { background:#007bff; }',
			'.sb-btn-success { background:#28a745; }',
			'.sb-btn-danger { background:#dc3545; }',
			'.form-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }',
			'.sb-input { padding:8px 12px; border:1px solid #444; border-radius:5px; background:#2a2a3e; color:#fff; }',
			'.stream-url { padding:15px; background:#0a0a15; border-radius:5px; }',
			'.stream-url a { color:#4fc3f7; text-decoration:none; font-family:monospace; }'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
