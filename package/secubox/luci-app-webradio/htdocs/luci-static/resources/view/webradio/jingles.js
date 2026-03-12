'use strict';
'require view';
'require rpc';
'require ui';
'require uci';
'require secubox/kiss-theme';

var callListJingles = rpc.declare({
	object: 'luci.webradio',
	method: 'list_jingles',
	expect: {}
});

var callPlayJingle = rpc.declare({
	object: 'luci.webradio',
	method: 'play_jingle',
	params: ['filename'],
	expect: {}
});

var callUpload = rpc.declare({
	object: 'luci.webradio',
	method: 'upload',
	params: ['filename', 'data'],
	expect: {}
});

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callListJingles(),
			uci.load('webradio')
		]);
	},

	renderStats: function(jingleCount, enabled, interval) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(jingleCount, 'Jingles', c.purple),
			KissTheme.stat(enabled ? 'On' : 'Off', 'Auto-Play', enabled ? c.green : c.muted),
			KissTheme.stat(interval + 'm', 'Interval', c.blue)
		];
	},

	renderJingleList: function(jingles) {
		if (!jingles || jingles.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted);' },
				'No jingles found. Upload audio files to use as jingles.');
		}

		var self = this;
		var rows = jingles.map(function(jingle) {
			return E('tr', {}, [
				E('td', { 'style': 'font-weight: 600;' }, jingle.name),
				E('td', { 'style': 'color: var(--kiss-muted);' }, jingle.size || '-'),
				E('td', { 'style': 'width: 180px;' }, [
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'style': 'padding: 4px 10px; font-size: 11px;',
							'click': ui.createHandlerFn(self, 'handlePlay', jingle.name)
						}, 'Play Now'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 11px;',
							'click': ui.createHandlerFn(self, 'handleDelete', jingle.path)
						}, 'Delete')
					])
				])
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Name'),
					E('th', {}, 'Size'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	render: function(data) {
		var self = this;
		var jingleData = data[0] || {};
		var jingles = jingleData.jingles || [];
		var jingleDir = jingleData.directory || '/srv/webradio/jingles';
		var enabled = uci.get('webradio', 'jingles', 'enabled') === '1';
		var interval = uci.get('webradio', 'jingles', 'interval') || '30';

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Jingle Management'),
					KissTheme.badge(jingles.length + ' Files', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Manage station jingles and identifiers')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(jingles.length, enabled, interval)),

			// Settings
			KissTheme.card('Jingle Settings',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('input', {
								'type': 'checkbox',
								'id': 'jingles-enabled',
								'checked': enabled
							}),
							E('span', {}, 'Enable automatic jingle rotation')
						])
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Jingles Directory'),
						E('input', {
							'type': 'text',
							'id': 'jingle-dir',
							'value': jingleDir,
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
						})
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;' }, [
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Interval (minutes)'),
							E('input', {
								'type': 'number',
								'id': 'jingle-interval',
								'value': interval,
								'min': '5',
								'max': '120',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'display: flex; align-items: center; gap: 10px; margin-top: 22px;' }, [
								E('input', {
									'type': 'checkbox',
									'id': 'jingle-between',
									'checked': uci.get('webradio', 'jingles', 'between_tracks') === '1'
								}),
								E('span', { 'style': 'font-size: 13px;' }, 'Play between tracks')
							])
						])
					]),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'align-self: flex-start;',
						'click': ui.createHandlerFn(this, 'handleSaveSettings')
					}, 'Save Settings')
				])
			),

			// Upload
			KissTheme.card('Upload Jingle',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
					E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
						E('input', {
							'type': 'file',
							'id': 'jingle-file',
							'accept': 'audio/*',
							'style': 'color: var(--kiss-text);'
						}),
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'click': ui.createHandlerFn(this, 'handleUpload')
						}, 'Upload')
					]),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' },
						'Supported formats: MP3, OGG, WAV. Keep jingles short (5-30 seconds).')
				])
			),

			// Jingle list
			KissTheme.card('Available Jingles (' + jingles.length + ')', this.renderJingleList(jingles))
		];

		return KissTheme.wrap(content, 'admin/services/webradio/jingles');
	},

	handleSaveSettings: function() {
		var enabled = document.getElementById('jingles-enabled').checked;
		var directory = document.getElementById('jingle-dir').value;
		var interval = document.getElementById('jingle-interval').value;
		var between = document.getElementById('jingle-between').checked;

		uci.set('webradio', 'jingles', 'jingles');
		uci.set('webradio', 'jingles', 'enabled', enabled ? '1' : '0');
		uci.set('webradio', 'jingles', 'directory', directory);
		uci.set('webradio', 'jingles', 'interval', interval);
		uci.set('webradio', 'jingles', 'between_tracks', between ? '1' : '0');

		return uci.save().then(function() {
			return uci.apply();
		}).then(function() {
			ui.addNotification(null, E('p', 'Jingle settings saved'));
		});
	},

	handleUpload: function() {
		var fileInput = document.getElementById('jingle-file');
		var file = fileInput.files[0];

		if (!file) {
			ui.addNotification(null, E('p', 'Please select a file to upload'), 'warning');
			return;
		}

		ui.showModal('Uploading', [
			E('p', { 'class': 'spinning' }, 'Uploading ' + file.name + '...')
		]);

		var reader = new FileReader();
		reader.onload = function() {
			var base64 = reader.result.split(',')[1];

			callUpload(file.name, base64).then(function(res) {
				ui.hideModal();
				if (res.result === 'ok') {
					ui.addNotification(null, E('p', 'Uploaded: ' + file.name + '. Move to jingles directory.'));
					fileInput.value = '';
				} else {
					ui.addNotification(null, E('p', 'Upload failed: ' + (res.error || 'unknown')), 'error');
				}
			}).catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', 'Upload error: ' + err), 'error');
			});
		};
		reader.readAsDataURL(file);
	},

	handlePlay: function(filename) {
		ui.showModal('Playing Jingle', [
			E('p', { 'class': 'spinning' }, 'Playing ' + filename + '...')
		]);

		return callPlayJingle(filename).then(function(res) {
			ui.hideModal();
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Jingle played: ' + filename));
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleDelete: function(path) {
		ui.addNotification(null, E('p', 'To delete, use SSH: rm "' + path + '"'), 'info');
	}
});
