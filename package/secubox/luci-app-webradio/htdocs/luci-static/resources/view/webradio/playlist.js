'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require uci';
'require secubox/kiss-theme';

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
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callPlaylist(),
			uci.load('ezstream')
		]);
	},

	renderStats: function(total, directory, shuffle) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(total, 'Tracks', c.blue),
			KissTheme.stat(shuffle ? 'On' : 'Off', 'Shuffle', shuffle ? c.green : c.muted),
			KissTheme.stat('M3U', 'Format', c.purple)
		];
	},

	renderPlaylist: function(tracks, total) {
		if (!tracks || tracks.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted);' },
				'No tracks in playlist. Add music files to the music directory and click "Regenerate Playlist".');
		}

		var rows = tracks.map(function(track, idx) {
			return E('tr', {}, [
				E('td', { 'style': 'width: 50px; color: var(--kiss-muted);' }, String(idx + 1)),
				E('td', {}, track.name),
				E('td', { 'style': 'width: 100px;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'data-path': track.path,
						'click': function(ev) {
							ev.target.closest('tr').remove();
						}
					}, 'Remove')
				])
			]);
		});

		var moreMsg = '';
		if (total > 50) {
			moreMsg = E('p', { 'style': 'color: var(--kiss-muted); margin-top: 12px; font-size: 12px;' },
				'Showing first 50 of ' + total + ' tracks');
		}

		return E('div', {}, [
			E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, '#'),
						E('th', {}, 'Track'),
						E('th', {}, 'Action')
					])
				]),
				E('tbody', {}, rows)
			]),
			moreMsg
		]);
	},

	render: function(data) {
		var self = this;
		var playlist = data[0] || {};
		var tracks = playlist.tracks || [];
		var total = playlist.total || 0;
		var musicDir = uci.get('ezstream', 'playlist', 'directory') || '/srv/webradio/music';
		var shuffle = uci.get('ezstream', 'playlist', 'shuffle') === '1';

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Playlist Management'),
					KissTheme.badge(total + ' Tracks', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Manage music files and playlist for ezstream')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(total, musicDir, shuffle)),

			// Settings
			KissTheme.card('Settings',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Music Directory'),
						E('div', { 'style': 'display: flex; gap: 12px;' }, [
							E('input', {
								'type': 'text',
								'id': 'music-dir',
								'value': musicDir,
								'style': 'flex: 1; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							}),
							E('button', {
								'class': 'kiss-btn kiss-btn-blue',
								'click': ui.createHandlerFn(this, 'handleSaveDir')
							}, 'Save')
						])
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('input', {
								'type': 'checkbox',
								'id': 'shuffle',
								'checked': shuffle
							}),
							E('span', {}, 'Randomize track order')
						])
					])
				])
			),

			// Actions
			KissTheme.card('Actions',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-purple',
							'click': ui.createHandlerFn(this, 'handleRegenerate')
						}, 'Regenerate Playlist'),
						E('button', {
							'class': 'kiss-btn',
							'click': ui.createHandlerFn(this, 'handleRefresh')
						}, 'Refresh List')
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Upload Music'),
						E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
							E('input', {
								'type': 'file',
								'id': 'music-file',
								'accept': 'audio/*',
								'multiple': true,
								'style': 'color: var(--kiss-text);'
							}),
							E('button', {
								'class': 'kiss-btn kiss-btn-green',
								'click': ui.createHandlerFn(this, 'handleUpload')
							}, 'Upload')
						]),
						E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' },
							'Supported formats: MP3, OGG, FLAC, WAV, M4A')
					])
				])
			),

			// Current playlist
			KissTheme.card('Current Playlist (' + total + ' tracks)', this.renderPlaylist(tracks, total))
		];

		return KissTheme.wrap(content, 'admin/services/webradio/playlist');
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
	}
});
