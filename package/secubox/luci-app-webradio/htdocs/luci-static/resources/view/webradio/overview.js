'use strict';
'require view';
'require rpc';
'require poll';
'require ui';
'require secubox/kiss-theme';

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

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/webradio/overview' },
			{ name: 'Playlist', path: 'admin/services/webradio/playlist' },
			{ name: 'Schedule', path: 'admin/services/webradio/schedule' },
			{ name: 'Live', path: 'admin/services/webradio/live' },
			{ name: 'Jingles', path: 'admin/services/webradio/jingles' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var icecast = status.icecast || {};
		var ezstream = status.ezstream || {};
		var stream = status.stream || {};
		var playlist = status.playlist || {};

		return [
			KissTheme.stat(icecast.running ? 'UP' : 'DOWN', 'Icecast', icecast.running ? c.green : c.red),
			KissTheme.stat(ezstream.running ? 'UP' : 'DOWN', 'Ezstream', ezstream.running ? c.green : c.red),
			KissTheme.stat(stream.listeners || 0, 'Listeners', (stream.listeners || 0) > 0 ? c.cyan : c.muted),
			KissTheme.stat(playlist.tracks || 0, 'Tracks', c.purple)
		];
	},

	renderHealth: function(status, currentShow) {
		var icecast = status.icecast || {};
		var ezstream = status.ezstream || {};
		var stream = status.stream || {};
		var playlist = status.playlist || {};

		var checks = [
			{ label: 'Icecast Server', ok: icecast.running, value: icecast.running ? 'Running' : 'Stopped' },
			{ label: 'Ezstream Source', ok: ezstream.running, value: ezstream.running ? 'Running' : 'Stopped' },
			{ label: 'Current Show', ok: true, value: currentShow.name || 'Default' },
			{ label: 'Now Playing', ok: !!stream.current_song, value: stream.current_song || 'Nothing' },
			{ label: 'Playlist', ok: (playlist.tracks || 0) > 0, value: (playlist.tracks || 0) + ' tracks' + (playlist.shuffle ? ' (shuffle)' : '') }
		];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, checks.map(function(c) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
				E('div', { 'style': 'width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; ' +
					(c.ok ? 'background: rgba(0,200,83,0.15); color: var(--kiss-green);' : 'background: rgba(255,23,68,0.15); color: var(--kiss-red);') },
					c.ok ? '\u2713' : '\u2717'),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-size: 13px; color: var(--kiss-text);' }, c.label),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' }, c.value)
				])
			]);
		}));
	},

	renderControls: function(status) {
		var self = this;
		var icecast = status.icecast || {};
		var isRunning = icecast.running;

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleStart(); }
				}, 'Start'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() { self.handleStop(); }
				}, 'Stop'),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.handleSkip(); }
				}, 'Skip Track'),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleRegenerate(); }
				}, 'Regenerate Playlist')
			]),
			E('div', { 'style': 'margin-top: 12px;' }, [
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-bottom: 8px;' }, 'Stream URL'),
				status.url ? E('a', {
					'href': status.url,
					'target': '_blank',
					'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-cyan);'
				}, status.url) : E('span', { 'style': 'color: var(--kiss-muted);' }, 'N/A')
			])
		]);
	},

	renderPlayer: function(status) {
		return E('div', { 'style': 'text-align: center;' }, [
			E('audio', {
				'id': 'radio-player',
				'controls': true,
				'style': 'width: 100%; max-width: 400px;'
			}, [
				E('source', { 'src': status.url, 'type': 'audio/mpeg' })
			]),
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin-top: 8px;' }, 'Click play to listen to the stream')
		]);
	},

	handleStart: function() {
		ui.showModal('Starting...', [E('p', { 'class': 'spinning' }, 'Starting WebRadio...')]);
		callStart('all').then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'WebRadio started'), 'success');
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Failed: ' + e.message), 'error');
		});
	},

	handleStop: function() {
		callStop('all').then(function(res) {
			ui.addNotification(null, E('p', 'WebRadio stopped'), 'info');
		}).catch(function(e) {
			ui.addNotification(null, E('p', 'Failed: ' + e.message), 'error');
		});
	},

	handleSkip: function() {
		callSkip().then(function(res) {
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Skipping to next track...'), 'success');
			} else {
				ui.addNotification(null, E('p', 'Skip failed: ' + (res.error || 'unknown')), 'warning');
			}
		});
	},

	handleRegenerate: function() {
		ui.showModal('Regenerating...', [E('p', { 'class': 'spinning' }, 'Regenerating playlist...')]);
		callGeneratePlaylist(true).then(function(res) {
			ui.hideModal();
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Playlist regenerated: ' + res.tracks + ' tracks'), 'success');
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	updateStatus: function(status, currentShow) {
		// Update stats
		var statsEl = document.getElementById('webradio-stats');
		if (statsEl) {
			statsEl.innerHTML = '';
			this.renderStats(status).forEach(function(el) { statsEl.appendChild(el); });
		}
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var currentShow = data[1] || {};
		var c = KissTheme.colors;

		var icecast = status.icecast || {};
		var ezstream = status.ezstream || {};
		var isRunning = icecast.running && ezstream.running;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'WebRadio'),
					KissTheme.badge(isRunning ? 'ON AIR' : 'OFFLINE', isRunning ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Internet radio station powered by Icecast + Ezstream')
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats row
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'webradio-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Station Status', this.renderHealth(status, currentShow)),
				KissTheme.card('Controls', this.renderControls(status))
			]),

			// Player
			KissTheme.card('Listen Live', this.renderPlayer(status))
		];

		poll.add(function() {
			return Promise.all([callStatus(), callCurrentShow()]).then(function(res) {
				self.updateStatus(res[0], res[1]);
			});
		}, 5);

		return KissTheme.wrap(content, 'admin/services/webradio/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
