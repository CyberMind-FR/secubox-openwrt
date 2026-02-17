'use strict';
'require view';
'require rpc';
'require poll';
'require ui';
'require form';

var callStatus = rpc.declare({
	object: 'luci.webradio',
	method: 'status',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.webradio',
	method: 'start',
	params: ['service'],
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.webradio',
	method: 'stop',
	params: ['service'],
	expect: {}
});

var callSkip = rpc.declare({
	object: 'luci.webradio',
	method: 'skip',
	expect: {}
});

var callGeneratePlaylist = rpc.declare({
	object: 'luci.webradio',
	method: 'generate_playlist',
	params: ['shuffle'],
	expect: {}
});

var callCurrentShow = rpc.declare({
	object: 'luci.webradio',
	method: 'current_show',
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callCurrentShow()
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var currentShow = data[1] || {};

		poll.add(function() {
			return Promise.all([callStatus(), callCurrentShow()]).then(function(res) {
				self.updateStatus(res[0], res[1]);
			});
		}, 5);

		var icecast = status.icecast || {};
		var ezstream = status.ezstream || {};
		var stream = status.stream || {};
		var playlist = status.playlist || {};
		var showName = currentShow.name || 'Default';

		var content = [
			E('h2', {}, 'WebRadio'),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Status'),
				E('div', { 'class': 'table', 'id': 'status-table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Icecast Server'),
						E('div', { 'class': 'td', 'id': 'icecast-status' },
							this.statusBadge(icecast.running))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Ezstream Source'),
						E('div', { 'class': 'td', 'id': 'ezstream-status' },
							this.statusBadge(ezstream.running))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Listeners'),
						E('div', { 'class': 'td', 'id': 'listeners' },
							String(stream.listeners || 0))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Current Show'),
						E('div', { 'class': 'td', 'id': 'current-show' }, [
							E('span', { 'style': 'font-weight: bold;' }, showName),
							currentShow.playlist ? E('span', { 'style': 'color: #666; margin-left: 10px;' },
								'(' + currentShow.playlist + ')') : ''
						])
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Now Playing'),
						E('div', { 'class': 'td', 'id': 'current-song' },
							stream.current_song || 'Nothing')
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Playlist'),
						E('div', { 'class': 'td', 'id': 'playlist-info' },
							playlist.tracks + ' tracks' + (playlist.shuffle ? ' (shuffle)' : ''))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Stream URL'),
						E('div', { 'class': 'td' },
							E('a', { 'href': status.url, 'target': '_blank' }, status.url || 'N/A'))
					])
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Controls'),
				E('div', { 'style': 'display: flex; gap: 10px; flex-wrap: wrap;' }, [
					E('button', {
						'class': 'btn cbi-button-positive',
						'click': ui.createHandlerFn(this, 'handleStart')
					}, 'Start'),
					E('button', {
						'class': 'btn cbi-button-negative',
						'click': ui.createHandlerFn(this, 'handleStop')
					}, 'Stop'),
					E('button', {
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, 'handleSkip')
					}, 'Skip Track'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, 'handleRegenerate')
					}, 'Regenerate Playlist')
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Listen'),
				E('audio', {
					'id': 'radio-player',
					'controls': true,
					'style': 'width: 100%; max-width: 500px;'
				}, [
					E('source', { 'src': status.url, 'type': 'audio/mpeg' })
				]),
				E('p', { 'style': 'color: #666; font-size: 0.9em;' },
					'Click play to listen to the stream')
			])
		];

		return E('div', { 'class': 'cbi-map' }, content);
	},

	statusBadge: function(running) {
		if (running) {
			return E('span', {
				'style': 'color: #fff; background: #5cb85c; padding: 2px 8px; border-radius: 3px;'
			}, 'Running');
		} else {
			return E('span', {
				'style': 'color: #fff; background: #d9534f; padding: 2px 8px; border-radius: 3px;'
			}, 'Stopped');
		}
	},

	updateStatus: function(status, currentShow) {
		var icecast = status.icecast || {};
		var ezstream = status.ezstream || {};
		var stream = status.stream || {};
		var playlist = status.playlist || {};
		currentShow = currentShow || {};

		var icecastEl = document.getElementById('icecast-status');
		var ezstreamEl = document.getElementById('ezstream-status');
		var listenersEl = document.getElementById('listeners');
		var songEl = document.getElementById('current-song');
		var playlistEl = document.getElementById('playlist-info');
		var showEl = document.getElementById('current-show');

		if (icecastEl) {
			icecastEl.innerHTML = '';
			icecastEl.appendChild(this.statusBadge(icecast.running));
		}
		if (ezstreamEl) {
			ezstreamEl.innerHTML = '';
			ezstreamEl.appendChild(this.statusBadge(ezstream.running));
		}
		if (listenersEl) {
			listenersEl.textContent = String(stream.listeners || 0);
		}
		if (songEl) {
			songEl.textContent = stream.current_song || 'Nothing';
		}
		if (playlistEl) {
			playlistEl.textContent = playlist.tracks + ' tracks' + (playlist.shuffle ? ' (shuffle)' : '');
		}
		if (showEl) {
			var showText = currentShow.name || 'Default';
			if (currentShow.playlist) {
				showText += ' (' + currentShow.playlist + ')';
			}
			showEl.textContent = showText;
		}
	},

	handleStart: function() {
		return callStart('all').then(function(res) {
			ui.addNotification(null, E('p', 'WebRadio started'));
		}).catch(function(e) {
			ui.addNotification(null, E('p', 'Failed to start: ' + e.message), 'error');
		});
	},

	handleStop: function() {
		return callStop('all').then(function(res) {
			ui.addNotification(null, E('p', 'WebRadio stopped'));
		}).catch(function(e) {
			ui.addNotification(null, E('p', 'Failed to stop: ' + e.message), 'error');
		});
	},

	handleSkip: function() {
		return callSkip().then(function(res) {
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Skipping to next track...'));
			} else {
				ui.addNotification(null, E('p', 'Skip failed: ' + (res.error || 'unknown')), 'warning');
			}
		});
	},

	handleRegenerate: function() {
		return callGeneratePlaylist(true).then(function(res) {
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Playlist regenerated: ' + res.tracks + ' tracks'));
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
