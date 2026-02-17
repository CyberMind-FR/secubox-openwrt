'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require uci';

var callPlaylist = rpc.declare({
	object: 'luci.webradio',
	method: 'playlist',
	expect: {}
});

var callGeneratePlaylist = rpc.declare({
	object: 'luci.webradio',
	method: 'generate_playlist',
	params: ['shuffle'],
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
			callPlaylist(),
			uci.load('ezstream')
		]);
	},

	render: function(data) {
		var self = this;
		var playlist = data[0] || {};
		var tracks = playlist.tracks || [];

		var content = [
			E('h2', {}, 'Playlist Management'),

			// Playlist settings
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Settings'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Music Directory'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'music-dir',
							'class': 'cbi-input-text',
							'value': uci.get('ezstream', 'playlist', 'directory') || '/srv/webradio/music',
							'style': 'width: 300px;'
						}),
						E('button', {
							'class': 'btn cbi-button',
							'style': 'margin-left: 10px;',
							'click': ui.createHandlerFn(this, 'handleSaveDir')
						}, 'Save')
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Shuffle'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'shuffle',
							'checked': uci.get('ezstream', 'playlist', 'shuffle') === '1'
						}),
						E('span', { 'style': 'margin-left: 10px;' }, 'Randomize track order')
					])
				])
			]),

			// Actions
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Actions'),
				E('div', { 'style': 'display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;' }, [
					E('button', {
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, 'handleRegenerate')
					}, 'Regenerate Playlist'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, 'handleRefresh')
					}, 'Refresh List')
				]),

				// File upload
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Upload Music'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'file',
							'id': 'music-file',
							'accept': 'audio/*',
							'multiple': true
						}),
						E('button', {
							'class': 'btn cbi-button-positive',
							'style': 'margin-left: 10px;',
							'click': ui.createHandlerFn(this, 'handleUpload')
						}, 'Upload')
					]),
					E('p', { 'style': 'color: #666; font-size: 0.9em;' },
						'Supported formats: MP3, OGG, FLAC, WAV, M4A')
				])
			]),

			// Current playlist
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Current Playlist (' + playlist.total + ' tracks)'),
				E('div', { 'id': 'playlist-container' }, [
					this.renderPlaylist(tracks, playlist.total)
				])
			])
		];

		return E('div', { 'class': 'cbi-map' }, content);
	},

	renderPlaylist: function(tracks, total) {
		if (!tracks || tracks.length === 0) {
			return E('p', { 'style': 'color: #666;' },
				'No tracks in playlist. Add music files to the music directory and click "Regenerate Playlist".');
		}

		var rows = tracks.map(function(track, idx) {
			return E('div', { 'class': 'tr' }, [
				E('div', { 'class': 'td', 'style': 'width: 50px;' }, String(idx + 1)),
				E('div', { 'class': 'td' }, track.name),
				E('div', { 'class': 'td', 'style': 'width: 100px;' }, [
					E('button', {
						'class': 'btn cbi-button-remove',
						'style': 'padding: 2px 8px;',
						'data-path': track.path,
						'click': function(ev) {
							ev.target.closest('.tr').remove();
							// TODO: Add remove from playlist
						}
					}, 'Remove')
				])
			]);
		});

		var moreMsg = '';
		if (total > 50) {
			moreMsg = E('p', { 'style': 'color: #666; margin-top: 10px;' },
				'Showing first 50 of ' + total + ' tracks');
		}

		return E('div', {}, [
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr cbi-section-table-titles' }, [
					E('div', { 'class': 'th' }, '#'),
					E('div', { 'class': 'th' }, 'Track'),
					E('div', { 'class': 'th' }, 'Action')
				])
			].concat(rows)),
			moreMsg
		]);
	},

	handleRegenerate: function() {
		var shuffle = document.getElementById('shuffle').checked;

		ui.showModal('Regenerating Playlist', [
			E('p', { 'class': 'spinning' }, 'Scanning music directory...')
		]);

		return callGeneratePlaylist(shuffle).then(function(res) {
			ui.hideModal();
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Playlist regenerated: ' + res.tracks + ' tracks'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleRefresh: function() {
		window.location.reload();
	},

	handleSaveDir: function() {
		var dir = document.getElementById('music-dir').value;

		uci.set('ezstream', 'playlist', 'directory', dir);
		return uci.save().then(function() {
			ui.addNotification(null, E('p', 'Music directory saved'));
		});
	},

	handleUpload: function() {
		var fileInput = document.getElementById('music-file');
		var files = fileInput.files;

		if (files.length === 0) {
			ui.addNotification(null, E('p', 'Please select files to upload'), 'warning');
			return;
		}

		var self = this;
		var uploaded = 0;
		var failed = 0;

		ui.showModal('Uploading', [
			E('p', { 'class': 'spinning' }, 'Uploading ' + files.length + ' files...')
		]);

		var uploads = Array.from(files).map(function(file) {
			return new Promise(function(resolve) {
				var reader = new FileReader();
				reader.onload = function() {
					var base64 = reader.result.split(',')[1];
					callUpload(file.name, base64).then(function(res) {
						if (res.result === 'ok') {
							uploaded++;
						} else {
							failed++;
						}
						resolve();
					}).catch(function() {
						failed++;
						resolve();
					});
				};
				reader.readAsDataURL(file);
			});
		});

		return Promise.all(uploads).then(function() {
			ui.hideModal();
			ui.addNotification(null, E('p',
				'Upload complete: ' + uploaded + ' succeeded, ' + failed + ' failed'));
			fileInput.value = '';
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
