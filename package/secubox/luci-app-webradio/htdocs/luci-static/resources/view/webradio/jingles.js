'use strict';
'require view';
'require rpc';
'require ui';
'require uci';

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
	load: function() {
		return Promise.all([
			callListJingles(),
			uci.load('webradio')
		]);
	},

	render: function(data) {
		var self = this;
		var jingleData = data[0] || {};
		var jingles = jingleData.jingles || [];
		var jingleDir = jingleData.directory || '/srv/webradio/jingles';

		var content = [
			E('h2', {}, 'Jingle Management'),

			// Settings
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Jingle Settings'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enable Jingles'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'jingles-enabled',
							'checked': uci.get('webradio', 'jingles', 'enabled') === '1'
						}),
						E('span', { 'style': 'margin-left: 10px;' },
							'Enable automatic jingle rotation')
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Jingles Directory'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'jingle-dir',
							'class': 'cbi-input-text',
							'value': jingleDir,
							'style': 'width: 300px;'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Interval (minutes)'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'jingle-interval',
							'class': 'cbi-input-text',
							'value': uci.get('webradio', 'jingles', 'interval') || '30',
							'min': '5',
							'max': '120',
							'style': 'width: 100px;'
						}),
						E('span', { 'style': 'margin-left: 10px; color: #666;' },
							'Time between automatic jingles')
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Between Tracks'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'jingle-between',
							'checked': uci.get('webradio', 'jingles', 'between_tracks') === '1'
						}),
						E('span', { 'style': 'margin-left: 10px;' },
							'Play jingle between every N tracks')
					])
				]),
				E('button', {
					'class': 'btn cbi-button-action',
					'style': 'margin-top: 10px;',
					'click': ui.createHandlerFn(this, 'handleSaveSettings')
				}, 'Save Settings')
			]),

			// Upload
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Upload Jingle'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'File'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'file',
							'id': 'jingle-file',
							'accept': 'audio/*'
						}),
						E('button', {
							'class': 'btn cbi-button-positive',
							'style': 'margin-left: 10px;',
							'click': ui.createHandlerFn(this, 'handleUpload')
						}, 'Upload')
					])
				]),
				E('p', { 'style': 'color: #666; font-size: 0.9em;' },
					'Supported formats: MP3, OGG, WAV. Keep jingles short (5-30 seconds).')
			]),

			// Jingle list
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Available Jingles (' + jingles.length + ')'),
				this.renderJingleList(jingles)
			])
		];

		return E('div', { 'class': 'cbi-map' }, content);
	},

	renderJingleList: function(jingles) {
		if (!jingles || jingles.length === 0) {
			return E('p', { 'style': 'color: #666;' },
				'No jingles found. Upload audio files to use as jingles.');
		}

		var self = this;
		var rows = jingles.map(function(jingle) {
			return E('div', { 'class': 'tr' }, [
				E('div', { 'class': 'td', 'style': 'font-weight: bold;' }, jingle.name),
				E('div', { 'class': 'td' }, jingle.size || '-'),
				E('div', { 'class': 'td', 'style': 'width: 150px;' }, [
					E('button', {
						'class': 'btn cbi-button-action',
						'style': 'padding: 2px 8px; margin-right: 5px;',
						'click': ui.createHandlerFn(self, 'handlePlay', jingle.name)
					}, 'Play Now'),
					E('button', {
						'class': 'btn cbi-button-remove',
						'style': 'padding: 2px 8px;',
						'click': ui.createHandlerFn(self, 'handleDelete', jingle.path)
					}, 'Delete')
				])
			]);
		});

		return E('div', { 'class': 'table' }, [
			E('div', { 'class': 'tr cbi-section-table-titles' }, [
				E('div', { 'class': 'th' }, 'Name'),
				E('div', { 'class': 'th' }, 'Size'),
				E('div', { 'class': 'th' }, 'Actions')
			])
		].concat(rows));
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

		var jingleDir = document.getElementById('jingle-dir').value;

		ui.showModal('Uploading', [
			E('p', { 'class': 'spinning' }, 'Uploading ' + file.name + '...')
		]);

		var reader = new FileReader();
		reader.onload = function() {
			var base64 = reader.result.split(',')[1];

			// We'll store in jingles dir - modify the upload call
			// For now, use existing upload which goes to music dir
			// The user can move files manually, or we add jingle-specific upload

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
		// This would need a delete_jingle RPCD method
		// For now just show info
		ui.addNotification(null, E('p', 'To delete, use SSH: rm "' + path + '"'), 'info');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
