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

return view.extend({
	load: function() {
		return Promise.all([
			callGetStatus(),
			callListImages(),
			callListTokens(),
			callListClones(),
			callListDevices()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var images = data[1].images || [];
		var tokens = data[2].tokens || [];
		var clones = data[3].clones || [];
		var devices = data[4].devices || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Cloning Station'),
			E('div', { 'class': 'cbi-map-descr' }, 'Build and deploy SecuBox clone images to new devices'),

			// Status Cards
			E('div', { 'style': 'display:flex;gap:20px;margin:20px 0;flex-wrap:wrap;' }, [
				E('div', { 'style': 'padding:15px;background:#3b82f622;border-radius:8px;min-width:120px;' }, [
					E('div', { 'style': 'font-size:12px;color:#888;' }, 'Device'),
					E('strong', { 'style': 'font-size:16px;color:#3b82f6;' }, status.device_type || 'unknown')
				]),
				E('div', { 'style': 'padding:15px;border-radius:8px;min-width:120px;', 'class': status.tftp_running ? 'tftp-on' : 'tftp-off' }, [
					E('div', { 'style': 'font-size:12px;color:#888;' }, 'TFTP'),
					E('strong', { 'style': 'font-size:16px;', 'id': 'tftp-status' },
						status.tftp_running ? 'Running' : 'Stopped')
				]),
				E('div', { 'style': 'padding:15px;background:#8b5cf622;border-radius:8px;min-width:120px;' }, [
					E('div', { 'style': 'font-size:12px;color:#888;' }, 'Tokens'),
					E('strong', { 'style': 'font-size:24px;color:#8b5cf6;', 'id': 'token-count' },
						String(tokens.length))
				]),
				E('div', { 'style': 'padding:15px;background:#22c55e22;border-radius:8px;min-width:120px;' }, [
					E('div', { 'style': 'font-size:12px;color:#888;' }, 'Clones'),
					E('strong', { 'style': 'font-size:24px;color:#22c55e;', 'id': 'clone-count' },
						String(status.clone_count || 0))
				])
			]),

			// Quick Actions
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Quick Actions'),
				E('div', { 'style': 'display:flex;gap:10px;flex-wrap:wrap;' }, [
					this.createActionButton('Build Image', 'cbi-button-action', L.bind(this.handleBuild, this)),
					this.createActionButton(status.tftp_running ? 'Stop TFTP' : 'Start TFTP',
						status.tftp_running ? 'cbi-button-negative' : 'cbi-button-positive',
						L.bind(this.handleTftp, this, !status.tftp_running)),
					this.createActionButton('New Token', 'cbi-button-action', L.bind(this.handleNewToken, this)),
					this.createActionButton('Auto-Approve Token', 'cbi-button-save', L.bind(this.handleAutoToken, this))
				])
			]),

			// Clone Images
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Clone Images'),
				E('table', { 'class': 'table', 'id': 'images-table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, 'Device'),
						E('th', { 'class': 'th' }, 'Name'),
						E('th', { 'class': 'th' }, 'Size'),
						E('th', { 'class': 'th' }, 'TFTP Ready'),
						E('th', { 'class': 'th' }, 'Actions')
					])
				].concat(images.length > 0 ? images.map(L.bind(this.renderImageRow, this)) :
					[E('tr', { 'class': 'tr' }, [E('td', { 'class': 'td', 'colspan': 5, 'style': 'text-align:center;' },
						'No images available. Click "Build Image" to create one.')])]
				))
			]),

			// Tokens
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Clone Tokens'),
				E('table', { 'class': 'table', 'id': 'tokens-table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, 'Token'),
						E('th', { 'class': 'th' }, 'Created'),
						E('th', { 'class': 'th' }, 'Type'),
						E('th', { 'class': 'th' }, 'Actions')
					])
				].concat(tokens.length > 0 ? tokens.map(L.bind(this.renderTokenRow, this)) :
					[E('tr', { 'class': 'tr' }, [E('td', { 'class': 'td', 'colspan': 4, 'style': 'text-align:center;' },
						'No tokens. Click "New Token" to generate one.')])]
				))
			]),

			// TFTP Instructions
			status.tftp_running ? E('div', { 'class': 'cbi-section', 'style': 'background:#22c55e11;padding:15px;border-radius:8px;border-left:4px solid #22c55e;' }, [
				E('h3', { 'style': 'margin-top:0;' }, 'U-Boot Flash Commands'),
				E('p', {}, 'Run these commands in U-Boot (Marvell>> prompt) on the target device:'),
				E('pre', { 'style': 'background:#000;color:#0f0;padding:10px;border-radius:4px;overflow-x:auto;' },
					'setenv serverip ' + status.lan_ip + '\n' +
					'setenv ipaddr 192.168.255.100\n' +
					'dhcp\n' +
					'tftpboot 0x6000000 secubox-clone.img\n' +
					'mmc dev 1\n' +
					'mmc write 0x6000000 0 ${filesize}\n' +
					'reset'
				)
			]) : null,

			// Cloned Devices
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Cloned Devices'),
				E('table', { 'class': 'table', 'id': 'clones-table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, 'Device'),
						E('th', { 'class': 'th' }, 'Status')
					])
				].concat(clones.length > 0 ? clones.map(L.bind(this.renderCloneRow, this)) :
					[E('tr', { 'class': 'tr' }, [E('td', { 'class': 'td', 'colspan': 2, 'style': 'text-align:center;' },
						'No clones yet.')])]
				))
			])
		].filter(Boolean));

		// Add dynamic styles
		var style = E('style', {}, [
			'.tftp-on { background: #22c55e22; }',
			'.tftp-on strong { color: #22c55e; }',
			'.tftp-off { background: #64748b22; }',
			'.tftp-off strong { color: #64748b; }'
		].join('\n'));
		view.insertBefore(style, view.firstChild);

		poll.add(L.bind(this.refresh, this), 10);
		return KissTheme.wrap([view], 'admin/secubox/system/cloner');
	},

	createActionButton: function(label, cls, handler) {
		var btn = E('button', { 'class': 'cbi-button ' + cls, 'style': 'padding:8px 16px;' }, label);
		btn.addEventListener('click', handler);
		return btn;
	},

	renderImageRow: function(img) {
		var deviceBadge = E('span', {
			'style': 'padding:2px 8px;border-radius:4px;font-size:12px;background:#3b82f622;color:#3b82f6;'
		}, img.device || 'unknown');

		return E('tr', { 'class': 'tr' }, [
			E('td', { 'class': 'td' }, deviceBadge),
			E('td', { 'class': 'td', 'style': 'font-family:monospace;font-size:12px;' }, img.name),
			E('td', { 'class': 'td' }, img.size),
			E('td', { 'class': 'td' }, img.tftp_ready ?
				E('span', { 'style': 'color:#22c55e;' }, 'Ready') :
				E('span', { 'style': 'color:#f59e0b;' }, 'Pending')),
			E('td', { 'class': 'td' }, '-')
		]);
	},

	renderTokenRow: function(tok) {
		var typeLabel = tok.auto_approve ? 'Auto-Approve' : 'Manual';
		var usedLabel = tok.used ? ' (used)' : '';
		var style = tok.used ? 'opacity:0.5;' : '';

		var deleteBtn = E('button', {
			'class': 'cbi-button cbi-button-negative',
			'style': 'padding:2px 8px;font-size:12px;',
			'data-token': tok.token
		}, 'Delete');
		deleteBtn.addEventListener('click', L.bind(this.handleDeleteToken, this));

		return E('tr', { 'class': 'tr', 'style': style }, [
			E('td', { 'class': 'td', 'style': 'font-family:monospace;' }, tok.token_short),
			E('td', { 'class': 'td' }, tok.created ? tok.created.split('T')[0] : '-'),
			E('td', { 'class': 'td' }, typeLabel + usedLabel),
			E('td', { 'class': 'td' }, deleteBtn)
		]);
	},

	renderCloneRow: function(clone) {
		var statusColor = clone.status === 'active' ? '#22c55e' : '#f59e0b';
		return E('tr', { 'class': 'tr' }, [
			E('td', { 'class': 'td' }, clone.info || '-'),
			E('td', { 'class': 'td' }, E('span', { 'style': 'color:' + statusColor }, clone.status))
		]);
	},

	handleBuild: function() {
		var self = this;
		callListDevices().then(function(data) {
			var devices = data.devices || [];
			var select = E('select', { 'id': 'device-select', 'class': 'cbi-input-select', 'style': 'width:100%;' });

			devices.forEach(function(dev) {
				select.appendChild(E('option', { 'value': dev.id }, dev.name + ' (' + dev.cpu + ')'));
			});

			ui.showModal('Build Clone Image', [
				E('p', {}, 'Select the target device type to build an image for:'),
				E('div', { 'style': 'margin:15px 0;' }, select),
				E('p', { 'style': 'color:#888;font-size:12px;' }, 'The image will be built via ASU API and may take several minutes.'),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
					' ',
					E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
						var deviceType = document.getElementById('device-select').value;
						ui.hideModal();
						ui.addNotification(null, E('p', 'Building image for ' + deviceType + '...'), 'info');
						callBuildImage(deviceType).then(function(res) {
							ui.addNotification(null, E('p', res.message || 'Build started'), 'info');
							self.refresh();
						});
					} }, 'Build')
				])
			]);
		});
	},

	handleTftp: function(start) {
		var fn = start ? callTftpStart : callTftpStop;
		fn().then(L.bind(function(res) {
			ui.addNotification(null, E('p', res.message || (start ? 'TFTP started' : 'TFTP stopped')), 'info');
			this.refresh();
		}, this));
	},

	handleNewToken: function() {
		callGenerateToken(false).then(L.bind(function(res) {
			if (res.success) {
				ui.showModal('Token Generated', [
					E('p', {}, 'New clone token created:'),
					E('pre', { 'style': 'background:#f1f5f9;padding:10px;border-radius:4px;word-break:break-all;' }, res.token),
					E('p', { 'style': 'color:#888;' }, 'This token requires manual approval when used.'),
					E('div', { 'class': 'right' }, [
						E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
							ui.hideModal();
						} }, 'OK')
					])
				]);
				this.refresh();
			}
		}, this));
	},

	handleAutoToken: function() {
		callGenerateToken(true).then(L.bind(function(res) {
			if (res.success) {
				ui.showModal('Auto-Approve Token Generated', [
					E('p', {}, 'New auto-approve token created:'),
					E('pre', { 'style': 'background:#22c55e22;padding:10px;border-radius:4px;word-break:break-all;' }, res.token),
					E('p', { 'style': 'color:#22c55e;' }, 'Devices using this token will auto-join the mesh without manual approval.'),
					E('div', { 'class': 'right' }, [
						E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
							ui.hideModal();
						} }, 'OK')
					])
				]);
				this.refresh();
			}
		}, this));
	},

	handleDeleteToken: function(ev) {
		var token = ev.currentTarget.dataset.token;
		if (confirm('Delete this token?')) {
			callDeleteToken(token).then(L.bind(function() {
				this.refresh();
			}, this));
		}
	},

	refresh: function() {
		return Promise.all([
			callGetStatus(),
			callListImages(),
			callListTokens(),
			callListClones()
		]).then(L.bind(function(data) {
			var status = data[0] || {};
			var tokens = data[2].tokens || [];

			// Update counts
			var tftpEl = document.getElementById('tftp-status');
			var tokenEl = document.getElementById('token-count');
			var cloneEl = document.getElementById('clone-count');

			if (tftpEl) {
				tftpEl.textContent = status.tftp_running ? 'Running' : 'Stopped';
				tftpEl.parentNode.parentNode.className = status.tftp_running ? 'tftp-on' : 'tftp-off';
			}
			if (tokenEl) tokenEl.textContent = String(tokens.length);
			if (cloneEl) cloneEl.textContent = String(status.clone_count || 0);

		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
