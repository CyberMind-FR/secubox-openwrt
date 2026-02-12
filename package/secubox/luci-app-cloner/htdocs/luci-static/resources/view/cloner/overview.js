'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callGetStatus = rpc.declare({
	object: 'luci.cloner',
	method: 'status',
	expect: { }
});

var callListImages = rpc.declare({
	object: 'luci.cloner',
	method: 'list_images',
	expect: { images: [] }
});

var callListTokens = rpc.declare({
	object: 'luci.cloner',
	method: 'list_tokens',
	expect: { tokens: [] }
});

var callListClones = rpc.declare({
	object: 'luci.cloner',
	method: 'list_clones',
	expect: { clones: [] }
});

var callGenerateToken = rpc.declare({
	object: 'luci.cloner',
	method: 'generate_token',
	params: ['auto_approve']
});

var callBuildImage = rpc.declare({
	object: 'luci.cloner',
	method: 'build_image',
	params: ['device_type']
});

var callListDevices = rpc.declare({
	object: 'luci.cloner',
	method: 'list_devices',
	expect: { devices: [] }
});

var callTftpStart = rpc.declare({
	object: 'luci.cloner',
	method: 'tftp_start'
});

var callTftpStop = rpc.declare({
	object: 'luci.cloner',
	method: 'tftp_stop'
});

var callDeleteToken = rpc.declare({
	object: 'luci.cloner',
	method: 'delete_token',
	params: ['token']
});

var callGetBuildProgress = rpc.declare({
	object: 'luci.cloner',
	method: 'build_progress',
	expect: { }
});

function fmtSize(bytes) {
	if (!bytes) return '-';
	var u = ['B', 'KB', 'MB', 'GB'];
	var i = 0;
	while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++; }
	return bytes.toFixed(1) + ' ' + u[i];
}

function fmtDate(iso) {
	if (!iso) return '-';
	var d = new Date(iso);
	return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5);
}

return view.extend({
	status: {},
	images: [],
	tokens: [],
	clones: [],
	devices: [],
	buildProgress: null,

	load: function() {
		return Promise.all([
			callGetStatus(),
			callListImages(),
			callListTokens(),
			callListClones(),
			callListDevices(),
			callGetBuildProgress().catch(function() { return {}; })
		]);
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		// RPC expect unwraps the arrays, so data[n] IS the array
		this.images = data[1] || [];
		this.tokens = data[2] || [];
		this.clones = data[3] || [];
		this.devices = data[4] || [];
		this.buildProgress = data[5] || {};

		var content = [
			// Header
			E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;' }, [
				E('div', {}, [
					E('h1', { 'style': 'font-size:28px;font-weight:700;margin:0;display:flex;align-items:center;gap:12px;' }, [
						'🔄 Cloning Station'
					]),
					E('p', { 'style': 'color:var(--kiss-muted);margin:6px 0 0;' }, 'Build and deploy SecuBox clone images')
				]),
				E('div', { 'style': 'display:flex;gap:8px;' }, [
					KissTheme.badge(this.status.device_type || 'unknown', 'blue'),
					KissTheme.badge(this.status.tftp_running ? 'TFTP ON' : 'TFTP OFF',
						this.status.tftp_running ? 'green' : 'red')
				])
			]),

			// Stats Grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'stats-grid', 'style': 'margin-bottom:24px;' }, [
				KissTheme.stat(this.images.length, 'Images', 'var(--kiss-blue)'),
				KissTheme.stat(this.tokens.length, 'Tokens', 'var(--kiss-purple)'),
				KissTheme.stat(this.status.clone_count || 0, 'Clones', 'var(--kiss-green)'),
				KissTheme.stat(this.status.tftp_running ? 'Active' : 'Idle', 'TFTP', this.status.tftp_running ? 'var(--kiss-green)' : 'var(--kiss-muted)')
			]),

			// Quick Actions
			KissTheme.card([
				E('span', {}, '⚡ Quick Actions')
			], E('div', { 'style': 'display:flex;gap:12px;flex-wrap:wrap;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.handleBuild(); }
				}, ['🔨 ', 'Build Image']),
				E('button', {
					'class': 'kiss-btn ' + (this.status.tftp_running ? 'kiss-btn-red' : 'kiss-btn-green'),
					'click': function() { self.handleTftp(!self.status.tftp_running); }
				}, [this.status.tftp_running ? '⏹️ Stop TFTP' : '▶️ Start TFTP']),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleNewToken(); }
				}, ['🎟️ ', 'New Token']),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleAutoToken(); }
				}, ['✅ ', 'Auto-Approve Token'])
			])),

			// Build Progress (if building)
			this.buildProgress.building ? this.renderBuildProgress() : null,

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top:16px;' }, [
				// Clone Images
				KissTheme.card([
					E('span', {}, '💾 Clone Images'),
					E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, this.images.length + ' available')
				], E('div', { 'id': 'images-container' }, this.renderImages())),

				// Tokens
				KissTheme.card([
					E('span', {}, '🎟️ Clone Tokens'),
					E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, this.tokens.length + ' active')
				], E('div', { 'id': 'tokens-container' }, this.renderTokens()))
			]),

			// TFTP Instructions (if running)
			this.status.tftp_running ? this.renderTftpInstructions() : null,

			// Cloned Devices
			KissTheme.card([
				E('span', {}, '📡 Cloned Devices'),
				E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, (this.status.clone_count || 0) + ' registered')
			], E('div', { 'id': 'clones-container' }, this.renderClones()))
		].filter(Boolean);

		poll.add(L.bind(this.refresh, this), 10);
		return KissTheme.wrap(content, 'admin/secubox/system/cloner');
	},

	renderBuildProgress: function() {
		var p = this.buildProgress;
		var pct = p.percent || 0;
		return KissTheme.card([
			E('span', {}, '🔨 Building Image...'),
			KissTheme.badge(pct + '%', 'yellow')
		], E('div', {}, [
			E('div', { 'style': 'margin-bottom:12px;color:var(--kiss-muted);font-size:13px;' }, p.status || 'Processing...'),
			E('div', { 'class': 'kiss-progress', 'style': 'height:12px;' }, [
				E('div', { 'class': 'kiss-progress-fill', 'style': 'width:' + pct + '%;' })
			]),
			p.device ? E('div', { 'style': 'margin-top:8px;font-size:12px;color:var(--kiss-muted);' }, 'Device: ' + p.device) : null
		].filter(Boolean)));
	},

	renderImages: function() {
		if (!this.images.length) {
			return E('div', { 'style': 'text-align:center;padding:30px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:32px;margin-bottom:8px;' }, '💾'),
				E('div', {}, 'No images yet'),
				E('div', { 'style': 'font-size:12px;margin-top:4px;' }, 'Click "Build Image" to create one')
			]);
		}

		return E('div', { 'style': 'display:flex;flex-direction:column;gap:8px;' },
			this.images.map(function(img) {
				return E('div', { 'style': 'display:flex;align-items:center;gap:12px;padding:12px;background:var(--kiss-bg2);border-radius:8px;border:1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'font-size:24px;' }, '📦'),
					E('div', { 'style': 'flex:1;' }, [
						E('div', { 'style': 'font-weight:600;font-size:13px;' }, img.name),
						E('div', { 'style': 'font-size:11px;color:var(--kiss-muted);display:flex;gap:12px;margin-top:4px;' }, [
							E('span', {}, img.device || 'unknown'),
							E('span', {}, fmtSize(img.size_bytes || 0)),
							E('span', {}, fmtDate(img.created))
						])
					]),
					img.tftp_ready ?
						E('span', { 'style': 'color:var(--kiss-green);font-size:12px;' }, '✓ Ready') :
						E('span', { 'style': 'color:var(--kiss-yellow);font-size:12px;' }, '⏳ Pending')
				]);
			})
		);
	},

	renderTokens: function() {
		var self = this;
		if (!this.tokens.length) {
			return E('div', { 'style': 'text-align:center;padding:30px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:32px;margin-bottom:8px;' }, '🎟️'),
				E('div', {}, 'No tokens'),
				E('div', { 'style': 'font-size:12px;margin-top:4px;' }, 'Generate a token for new devices')
			]);
		}

		return E('div', { 'style': 'display:flex;flex-direction:column;gap:6px;' },
			this.tokens.map(function(tok) {
				var isAuto = tok.auto_approve;
				var isUsed = tok.used;
				return E('div', {
					'style': 'display:flex;align-items:center;gap:10px;padding:10px;background:var(--kiss-bg2);border-radius:6px;border:1px solid var(--kiss-line);' + (isUsed ? 'opacity:0.5;' : '')
				}, [
					E('div', { 'style': 'font-family:monospace;font-size:12px;flex:1;color:var(--kiss-cyan);' }, tok.token_short || tok.token.slice(0, 12) + '...'),
					isAuto ? E('span', { 'style': 'font-size:10px;padding:2px 6px;background:rgba(0,200,83,0.2);color:var(--kiss-green);border-radius:4px;' }, 'AUTO') : null,
					isUsed ? E('span', { 'style': 'font-size:10px;color:var(--kiss-muted);' }, 'used') : null,
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding:4px 8px;font-size:11px;',
						'data-token': tok.token,
						'click': function(ev) { self.handleDeleteToken(ev); }
					}, '✕')
				].filter(Boolean));
			})
		);
	},

	renderTftpInstructions: function() {
		var ip = this.status.lan_ip || '192.168.255.1';
		var cmds = [
			'setenv serverip ' + ip,
			'setenv ipaddr 192.168.255.100',
			'dhcp',
			'tftpboot 0x6000000 secubox-clone.img',
			'mmc dev 1',
			'mmc write 0x6000000 0 ${filesize}',
			'reset'
		].join('\n');

		return E('div', { 'class': 'kiss-card kiss-panel-green', 'style': 'margin-top:16px;' }, [
			E('div', { 'class': 'kiss-card-title' }, '📟 U-Boot Flash Commands'),
			E('p', { 'style': 'color:var(--kiss-muted);font-size:13px;margin-bottom:12px;' },
				'Run these commands in U-Boot (Marvell>> prompt) on the target device:'),
			E('pre', { 'style': 'background:#000;color:#0f0;padding:16px;border-radius:8px;font-size:12px;overflow-x:auto;margin:0;' }, cmds),
			E('button', {
				'class': 'kiss-btn',
				'style': 'margin-top:12px;',
				'click': function() {
					navigator.clipboard.writeText(cmds);
					ui.addNotification(null, E('p', 'Commands copied to clipboard'), 'info');
				}
			}, ['📋 ', 'Copy Commands'])
		]);
	},

	renderClones: function() {
		if (!this.clones.length) {
			return E('div', { 'style': 'text-align:center;padding:30px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:32px;margin-bottom:8px;' }, '📡'),
				E('div', {}, 'No clones registered yet')
			]);
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Device'),
				E('th', {}, 'Token'),
				E('th', {}, 'Registered'),
				E('th', {}, 'Status')
			])),
			E('tbody', {}, this.clones.map(function(c) {
				var statusColor = c.status === 'active' ? 'var(--kiss-green)' : 'var(--kiss-yellow)';
				return E('tr', {}, [
					E('td', { 'style': 'font-family:monospace;' }, c.device_id || c.info || '-'),
					E('td', { 'style': 'font-size:11px;color:var(--kiss-muted);' }, c.token_short || '-'),
					E('td', {}, fmtDate(c.registered)),
					E('td', {}, E('span', { 'style': 'color:' + statusColor + ';' }, c.status || 'pending'))
				]);
			}))
		]);
	},

	handleBuild: function() {
		var self = this;
		callListDevices().then(function(data) {
			var devices = data.devices || [];
			var select = E('select', { 'id': 'device-select', 'style': 'width:100%;padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);font-size:14px;' });

			devices.forEach(function(dev) {
				select.appendChild(E('option', { 'value': dev.id }, dev.name + ' (' + dev.cpu + ')'));
			});

			ui.showModal('Build Clone Image', [
				E('p', { 'style': 'color:var(--kiss-muted);' }, 'Select target device type:'),
				E('div', { 'style': 'margin:15px 0;' }, select),
				E('p', { 'style': 'color:var(--kiss-yellow);font-size:12px;' }, '⚠️ Building may take several minutes via ASU API'),
				E('div', { 'class': 'right', 'style': 'margin-top:20px;' }, [
					E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
					' ',
					E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
						var deviceType = document.getElementById('device-select').value;
						ui.hideModal();
						ui.addNotification(null, E('p', '🔨 Building image for ' + deviceType + '...'), 'info');
						callBuildImage(deviceType).then(function(res) {
							ui.addNotification(null, E('p', res.message || 'Build started'), res.success ? 'info' : 'warning');
							self.refresh();
						});
					} }, '🔨 Build')
				])
			]);
		});
	},

	handleTftp: function(start) {
		var self = this;
		var fn = start ? callTftpStart : callTftpStop;
		fn().then(function(res) {
			ui.addNotification(null, E('p', res.message || (start ? 'TFTP started' : 'TFTP stopped')), 'info');
			self.refresh();
		});
	},

	handleNewToken: function() {
		var self = this;
		callGenerateToken(false).then(function(res) {
			if (res.success) {
				ui.showModal('Token Generated', [
					E('p', { 'style': 'color:var(--kiss-muted);' }, 'New clone token:'),
					E('pre', { 'style': 'background:var(--kiss-bg2);color:var(--kiss-cyan);padding:12px;border-radius:6px;word-break:break-all;font-size:12px;' }, res.token),
					E('p', { 'style': 'color:var(--kiss-yellow);font-size:12px;' }, '⚠️ Requires manual approval when used'),
					E('div', { 'class': 'right', 'style': 'margin-top:15px;' }, [
						E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'OK')
					])
				]);
				self.refresh();
			}
		});
	},

	handleAutoToken: function() {
		var self = this;
		callGenerateToken(true).then(function(res) {
			if (res.success) {
				ui.showModal('Auto-Approve Token', [
					E('p', { 'style': 'color:var(--kiss-muted);' }, 'Auto-approve token created:'),
					E('pre', { 'style': 'background:rgba(0,200,83,0.1);color:var(--kiss-green);padding:12px;border-radius:6px;word-break:break-all;font-size:12px;border:1px solid rgba(0,200,83,0.3);' }, res.token),
					E('p', { 'style': 'color:var(--kiss-green);font-size:12px;' }, '✅ Devices using this token auto-join without approval'),
					E('div', { 'class': 'right', 'style': 'margin-top:15px;' }, [
						E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'OK')
					])
				]);
				self.refresh();
			}
		});
	},

	handleDeleteToken: function(ev) {
		var token = ev.currentTarget.dataset.token;
		var self = this;
		if (confirm('Delete this token?')) {
			callDeleteToken(token).then(function() {
				self.refresh();
			});
		}
	},

	refresh: function() {
		var self = this;
		return Promise.all([
			callGetStatus(),
			callListImages(),
			callListTokens(),
			callListClones(),
			callGetBuildProgress().catch(function() { return {}; })
		]).then(function(data) {
			self.status = data[0] || {};
			self.images = data[1].images || [];
			self.tokens = data[2].tokens || [];
			self.clones = data[3].clones || [];
			self.buildProgress = data[4] || {};

			// Update stats
			var statsEl = document.getElementById('stats-grid');
			if (statsEl) {
				dom.content(statsEl, [
					KissTheme.stat(self.images.length, 'Images', 'var(--kiss-blue)'),
					KissTheme.stat(self.tokens.length, 'Tokens', 'var(--kiss-purple)'),
					KissTheme.stat(self.status.clone_count || 0, 'Clones', 'var(--kiss-green)'),
					KissTheme.stat(self.status.tftp_running ? 'Active' : 'Idle', 'TFTP', self.status.tftp_running ? 'var(--kiss-green)' : 'var(--kiss-muted)')
				]);
			}

			// Update containers
			var imagesEl = document.getElementById('images-container');
			if (imagesEl) dom.content(imagesEl, self.renderImages());

			var tokensEl = document.getElementById('tokens-container');
			if (tokensEl) dom.content(tokensEl, self.renderTokens());

			var clonesEl = document.getElementById('clones-container');
			if (clonesEl) dom.content(clonesEl, self.renderClones());
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
