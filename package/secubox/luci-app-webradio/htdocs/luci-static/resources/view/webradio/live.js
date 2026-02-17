'use strict';
'require view';
'require rpc';
'require ui';
'require uci';
'require form';

var callLiveStatus = rpc.declare({
	object: 'luci.webradio',
	method: 'live_status',
	expect: {}
});

var callLiveStart = rpc.declare({
	object: 'luci.webradio',
	method: 'live_start',
	expect: {}
});

var callLiveStop = rpc.declare({
	object: 'luci.webradio',
	method: 'live_stop',
	expect: {}
});

var callListDevices = rpc.declare({
	object: 'luci.webradio',
	method: 'list_audio_devices',
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callLiveStatus(),
			callListDevices(),
			uci.load('darkice')
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var devices = data[1] || {};
		var deviceList = devices.devices || [];

		var content = [
			E('h2', {}, 'Live Input'),

			// Status section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Live Stream Status'),
				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td', 'style': 'width: 150px;' }, 'DarkIce Status'),
						E('div', { 'class': 'td', 'id': 'darkice-status' },
							this.statusBadge(status.running))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Input Device'),
						E('div', { 'class': 'td', 'id': 'input-device' },
							status.device || 'Not configured')
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Mount Point'),
						E('div', { 'class': 'td' },
							uci.get('darkice', 'server', 'mount') || '/live')
					])
				]),
				E('div', { 'style': 'display: flex; gap: 10px; margin-top: 15px;' }, [
					E('button', {
						'class': 'btn cbi-button-positive',
						'id': 'btn-start',
						'disabled': status.running,
						'click': ui.createHandlerFn(this, 'handleStart')
					}, 'Start Live'),
					E('button', {
						'class': 'btn cbi-button-negative',
						'id': 'btn-stop',
						'disabled': !status.running,
						'click': ui.createHandlerFn(this, 'handleStop')
					}, 'Stop Live')
				]),
				status.running ? E('div', {
					'style': 'margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px; color: #856404;'
				}, [
					E('strong', {}, 'Note: '),
					'Live streaming is active. Playlist streaming (ezstream) should be stopped to avoid conflicts.'
				]) : ''
			]),

			// Audio devices
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Audio Input Devices'),
				deviceList.length > 0
					? this.renderDeviceList(deviceList)
					: E('p', { 'style': 'color: #666;' },
						'No audio input devices detected. Connect a USB microphone or sound card.')
			]),

			// Configuration
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Live Input Configuration'),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enable Live Input'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'live-enabled',
							'checked': uci.get('darkice', 'main', 'enabled') === '1'
						}),
						E('span', { 'style': 'margin-left: 10px;' },
							'Enable DarkIce live streaming service')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Input Device'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'input-device-select', 'class': 'cbi-input-select' },
							[E('option', { 'value': 'hw:0,0' }, 'Default (hw:0,0)')].concat(
								deviceList.map(function(dev) {
									var selected = uci.get('darkice', 'input', 'device') === dev.device;
									return E('option', {
										'value': dev.device,
										'selected': selected
									}, dev.name + ' (' + dev.device + ')');
								})
							)
						)
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Sample Rate'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'samplerate', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '22050', 'selected': uci.get('darkice', 'input', 'samplerate') === '22050' }, '22050 Hz'),
							E('option', { 'value': '44100', 'selected': uci.get('darkice', 'input', 'samplerate') === '44100' }, '44100 Hz (CD Quality)'),
							E('option', { 'value': '48000', 'selected': uci.get('darkice', 'input', 'samplerate') === '48000' }, '48000 Hz')
						])
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Channels'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'channels', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '1', 'selected': uci.get('darkice', 'input', 'channels') === '1' }, 'Mono'),
							E('option', { 'value': '2', 'selected': uci.get('darkice', 'input', 'channels') === '2' }, 'Stereo')
						])
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Bitrate (kbps)'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'bitrate', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '64', 'selected': uci.get('darkice', 'stream', 'bitrate') === '64' }, '64 kbps'),
							E('option', { 'value': '96', 'selected': uci.get('darkice', 'stream', 'bitrate') === '96' }, '96 kbps'),
							E('option', { 'value': '128', 'selected': uci.get('darkice', 'stream', 'bitrate') === '128' }, '128 kbps'),
							E('option', { 'value': '192', 'selected': uci.get('darkice', 'stream', 'bitrate') === '192' }, '192 kbps'),
							E('option', { 'value': '256', 'selected': uci.get('darkice', 'stream', 'bitrate') === '256' }, '256 kbps'),
							E('option', { 'value': '320', 'selected': uci.get('darkice', 'stream', 'bitrate') === '320' }, '320 kbps')
						])
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Mount Point'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'mount',
							'class': 'cbi-input-text',
							'value': uci.get('darkice', 'server', 'mount') || '/live',
							'style': 'width: 150px;'
						}),
						E('p', { 'style': 'color: #666; font-size: 0.9em;' },
							'Use a different mount point (e.g. /live-input) to separate from playlist stream')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Stream Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'stream-name',
							'class': 'cbi-input-text',
							'value': uci.get('darkice', 'stream', 'name') || 'Live Stream',
							'style': 'width: 250px;'
						})
					])
				]),

				E('button', {
					'class': 'btn cbi-button-action',
					'style': 'margin-top: 15px;',
					'click': ui.createHandlerFn(this, 'handleSave')
				}, 'Save Configuration')
			]),

			// Tips
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Tips'),
				E('ul', { 'style': 'color: #666;' }, [
					E('li', {}, 'Connect a USB microphone or USB sound card for audio input'),
					E('li', {}, 'Use ALSA mixer (alsamixer) to adjust input volume levels'),
					E('li', {}, 'Stop ezstream before going live to use the same mount point'),
					E('li', {}, 'Use different mount points for live and playlist streams')
				])
			])
		];

		return E('div', { 'class': 'cbi-map' }, content);
	},

	statusBadge: function(running) {
		if (running) {
			return E('span', {
				'style': 'color: #fff; background: #dc3545; padding: 2px 8px; border-radius: 3px; animation: pulse 1s infinite;'
			}, 'LIVE');
		} else {
			return E('span', {
				'style': 'color: #fff; background: #6c757d; padding: 2px 8px; border-radius: 3px;'
			}, 'Offline');
		}
	},

	renderDeviceList: function(devices) {
		var rows = devices.map(function(dev) {
			return E('div', { 'class': 'tr' }, [
				E('div', { 'class': 'td', 'style': 'font-weight: bold;' }, dev.name),
				E('div', { 'class': 'td' }, dev.device),
				E('div', { 'class': 'td' }, dev.type || 'capture')
			]);
		});

		return E('div', { 'class': 'table' }, [
			E('div', { 'class': 'tr cbi-section-table-titles' }, [
				E('div', { 'class': 'th' }, 'Device Name'),
				E('div', { 'class': 'th' }, 'ALSA Device'),
				E('div', { 'class': 'th' }, 'Type')
			])
		].concat(rows));
	},

	handleStart: function() {
		var self = this;

		ui.showModal('Starting Live Stream', [
			E('p', { 'class': 'spinning' }, 'Starting DarkIce...')
		]);

		return callLiveStart().then(function(res) {
			ui.hideModal();
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Live streaming started'));
				document.getElementById('btn-start').disabled = true;
				document.getElementById('btn-stop').disabled = false;
				var statusEl = document.getElementById('darkice-status');
				if (statusEl) {
					statusEl.innerHTML = '';
					statusEl.appendChild(self.statusBadge(true));
				}
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleStop: function() {
		var self = this;

		return callLiveStop().then(function(res) {
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Live streaming stopped'));
				document.getElementById('btn-start').disabled = false;
				document.getElementById('btn-stop').disabled = true;
				var statusEl = document.getElementById('darkice-status');
				if (statusEl) {
					statusEl.innerHTML = '';
					statusEl.appendChild(self.statusBadge(false));
				}
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleSave: function() {
		var enabled = document.getElementById('live-enabled').checked;
		var device = document.getElementById('input-device-select').value;
		var samplerate = document.getElementById('samplerate').value;
		var channels = document.getElementById('channels').value;
		var bitrate = document.getElementById('bitrate').value;
		var mount = document.getElementById('mount').value;
		var name = document.getElementById('stream-name').value;

		uci.set('darkice', 'main', 'enabled', enabled ? '1' : '0');
		uci.set('darkice', 'input', 'device', device);
		uci.set('darkice', 'input', 'samplerate', samplerate);
		uci.set('darkice', 'input', 'channels', channels);
		uci.set('darkice', 'stream', 'bitrate', bitrate);
		uci.set('darkice', 'server', 'mount', mount);
		uci.set('darkice', 'stream', 'name', name);

		return uci.save().then(function() {
			return uci.apply();
		}).then(function() {
			ui.addNotification(null, E('p', 'Configuration saved. Restart DarkIce to apply changes.'));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
