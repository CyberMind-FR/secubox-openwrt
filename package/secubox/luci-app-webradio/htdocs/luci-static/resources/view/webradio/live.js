'use strict';
'require view';
'require rpc';
'require ui';
'require uci';
'require form';
'require secubox/kiss-theme';

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
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callLiveStatus(),
			callListDevices(),
			uci.load('darkice')
		]);
	},

	renderStats: function(status, deviceCount, mountPoint) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.running ? 'LIVE' : 'Offline', 'Status', status.running ? c.red : c.muted),
			KissTheme.stat(deviceCount, 'Devices', c.blue),
			KissTheme.stat(mountPoint, 'Mount', c.purple)
		];
	},

	renderDeviceList: function(devices) {
		if (!devices || devices.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted);' },
				'No audio input devices detected. Connect a USB microphone or sound card.');
		}

		var rows = devices.map(function(dev) {
			return E('tr', {}, [
				E('td', { 'style': 'font-weight: 600;' }, dev.name),
				E('td', {}, dev.device),
				E('td', {}, dev.type || 'capture')
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Device Name'),
					E('th', {}, 'ALSA Device'),
					E('th', {}, 'Type')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var devices = data[1] || {};
		var deviceList = devices.devices || [];
		var mountPoint = uci.get('darkice', 'server', 'mount') || '/live';

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Live Input'),
					KissTheme.badge(status.running ? 'LIVE' : 'OFFLINE', status.running ? 'red' : 'muted')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Configure DarkIce live audio input streaming')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(status, deviceList.length, mountPoint)),

			// Control buttons
			KissTheme.card('Stream Control',
				E('div', {}, [
					E('div', { 'style': 'display: flex; gap: 12px; margin-bottom: 16px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'id': 'btn-start',
							'disabled': status.running,
							'click': ui.createHandlerFn(this, 'handleStart')
						}, 'Start Live'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'id': 'btn-stop',
							'disabled': !status.running,
							'click': ui.createHandlerFn(this, 'handleStop')
						}, 'Stop Live')
					]),
					status.running ? E('div', {
						'style': 'padding: 12px; background: rgba(251, 191, 36, 0.15); border-radius: 6px; color: var(--kiss-orange);'
					}, [
						E('strong', {}, 'Note: '),
						'Live streaming is active. Playlist streaming (ezstream) should be stopped to avoid conflicts.'
					]) : ''
				])
			),

			// Audio devices
			KissTheme.card('Audio Input Devices', this.renderDeviceList(deviceList)),

			// Configuration
			KissTheme.card('Live Input Configuration',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('input', {
								'type': 'checkbox',
								'id': 'live-enabled',
								'checked': uci.get('darkice', 'main', 'enabled') === '1'
							}),
							E('span', {}, 'Enable DarkIce live streaming service')
						])
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Input Device'),
						E('select', {
							'id': 'input-device-select',
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
						}, [E('option', { 'value': 'hw:0,0' }, 'Default (hw:0,0)')].concat(
							deviceList.map(function(dev) {
								var selected = uci.get('darkice', 'input', 'device') === dev.device;
								return E('option', {
									'value': dev.device,
									'selected': selected
								}, dev.name + ' (' + dev.device + ')');
							})
						))
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;' }, [
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Sample Rate'),
							E('select', {
								'id': 'samplerate',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							}, [
								E('option', { 'value': '22050', 'selected': uci.get('darkice', 'input', 'samplerate') === '22050' }, '22050 Hz'),
								E('option', { 'value': '44100', 'selected': uci.get('darkice', 'input', 'samplerate') === '44100' }, '44100 Hz (CD)'),
								E('option', { 'value': '48000', 'selected': uci.get('darkice', 'input', 'samplerate') === '48000' }, '48000 Hz')
							])
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Channels'),
							E('select', {
								'id': 'channels',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							}, [
								E('option', { 'value': '1', 'selected': uci.get('darkice', 'input', 'channels') === '1' }, 'Mono'),
								E('option', { 'value': '2', 'selected': uci.get('darkice', 'input', 'channels') === '2' }, 'Stereo')
							])
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Bitrate'),
							E('select', {
								'id': 'bitrate',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							}, [
								E('option', { 'value': '64', 'selected': uci.get('darkice', 'stream', 'bitrate') === '64' }, '64 kbps'),
								E('option', { 'value': '96', 'selected': uci.get('darkice', 'stream', 'bitrate') === '96' }, '96 kbps'),
								E('option', { 'value': '128', 'selected': uci.get('darkice', 'stream', 'bitrate') === '128' }, '128 kbps'),
								E('option', { 'value': '192', 'selected': uci.get('darkice', 'stream', 'bitrate') === '192' }, '192 kbps'),
								E('option', { 'value': '256', 'selected': uci.get('darkice', 'stream', 'bitrate') === '256' }, '256 kbps'),
								E('option', { 'value': '320', 'selected': uci.get('darkice', 'stream', 'bitrate') === '320' }, '320 kbps')
							])
						])
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Mount Point'),
							E('input', {
								'type': 'text',
								'id': 'mount',
								'value': uci.get('darkice', 'server', 'mount') || '/live',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							}),
							E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' },
								'Use /live-input to separate from playlist')
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Stream Name'),
							E('input', {
								'type': 'text',
								'id': 'stream-name',
								'value': uci.get('darkice', 'stream', 'name') || 'Live Stream',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						])
					]),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'margin-top: 8px; align-self: flex-start;',
						'click': ui.createHandlerFn(this, 'handleSave')
					}, 'Save Configuration')
				])
			),

			// Tips
			KissTheme.card('Tips',
				E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
					E('li', {}, 'Connect a USB microphone or USB sound card for audio input'),
					E('li', {}, 'Use ALSA mixer (alsamixer) to adjust input volume levels'),
					E('li', {}, 'Stop ezstream before going live to use the same mount point'),
					E('li', {}, 'Use different mount points for live and playlist streams')
				])
			)
		];

		return KissTheme.wrap(content, 'admin/services/webradio/live');
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
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleStop: function() {
		return callLiveStop().then(function(res) {
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Live streaming stopped'));
				document.getElementById('btn-start').disabled = false;
				document.getElementById('btn-stop').disabled = true;
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
	}
});
