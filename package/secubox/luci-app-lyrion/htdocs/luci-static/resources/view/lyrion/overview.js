'use strict';
'require view';
'require ui';
'require rpc';
'require poll';

var callStatus = rpc.declare({ object: 'luci.lyrion', method: 'status' });
var callInstall = rpc.declare({ object: 'luci.lyrion', method: 'install' });
var callStart = rpc.declare({ object: 'luci.lyrion', method: 'start' });
var callStop = rpc.declare({ object: 'luci.lyrion', method: 'stop' });
var callRescan = rpc.declare({ object: 'luci.lyrion', method: 'rescan' });

return view.extend({
	load: function() {
		return callStatus().catch(function() { return {}; });
	},

	startPolling: function() {
		var self = this;
		poll.add(function() {
			return callStatus().then(function(s) {
				self.updateUI(s);
			});
		}, 5);
	},

	updateUI: function(s) {
		var badge = document.getElementById('status-badge');
		if (badge) {
			badge.className = 'cbi-value-field';
			badge.innerHTML = s.running
				? '<span style="color:#4caf50;font-weight:600">● Running</span>'
				: '<span style="color:#f44336;font-weight:600">● Stopped</span>';
		}

		var stats = document.getElementById('library-stats');
		if (stats && s.songs !== undefined) {
			stats.textContent = s.songs + ' songs, ' + s.albums + ' albums, ' + s.artists + ' artists';
		}

		['btn-start', 'btn-rescan'].forEach(function(id) {
			var el = document.getElementById(id);
			if (el) el.disabled = s.running;
		});
		var stopBtn = document.getElementById('btn-stop');
		if (stopBtn) stopBtn.disabled = !s.running;
	},

	handleInstall: function() {
		ui.showModal(_('Installing'), [
			E('p', { 'class': 'spinning' }, _('Installing Lyrion Music Server...'))
		]);
		callInstall().then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', _('Installation started')));
				setTimeout(function() { location.reload(); }, 3000);
			} else {
				ui.addNotification(null, E('p', r.error || _('Installation failed')), 'error');
			}
		});
	},

	handleStart: function() {
		callStart().then(function() {
			ui.addNotification(null, E('p', _('Lyrion started')));
		});
	},

	handleStop: function() {
		callStop().then(function() {
			ui.addNotification(null, E('p', _('Lyrion stopped')));
		});
	},

	handleRescan: function() {
		callRescan().then(function() {
			ui.addNotification(null, E('p', _('Library rescan started')));
		});
	},

	render: function(status) {
		var s = status || {};

		// Not installed
		if (!s.installed) {
			return E('div', { 'class': 'cbi-map' }, [
				E('h2', {}, _('Lyrion Music Server')),
				E('div', { 'class': 'cbi-section' }, [
					E('div', { 'style': 'text-align:center;padding:40px' }, [
						E('p', { 'style': 'font-size:48px;margin:0' }, '🎵'),
						E('h3', {}, _('Lyrion Music Server')),
						E('p', {}, _('Self-hosted music streaming with Squeezebox compatibility.')),
						E('button', {
							'class': 'cbi-button cbi-button-positive',
							'click': ui.createHandlerFn(this, 'handleInstall')
						}, _('Install Lyrion'))
					])
				])
			]);
		}

		// Installed
		this.startPolling();

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, [
				'🎵 ',
				_('Lyrion Music Server'),
				' ',
				E('span', { 'id': 'status-badge', 'style': 'font-size:14px' },
					s.running
						? E('span', { 'style': 'color:#4caf50;font-weight:600' }, '● Running')
						: E('span', { 'style': 'color:#f44336;font-weight:600' }, '● Stopped')
				)
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Controls')),
				E('div', { 'class': 'cbi-value' }, [
					E('button', {
						'id': 'btn-start',
						'class': 'cbi-button cbi-button-positive',
						'click': ui.createHandlerFn(this, 'handleStart'),
						'disabled': s.running,
						'style': 'margin-right:8px'
					}, _('Start')),
					E('button', {
						'id': 'btn-stop',
						'class': 'cbi-button cbi-button-negative',
						'click': ui.createHandlerFn(this, 'handleStop'),
						'disabled': !s.running,
						'style': 'margin-right:8px'
					}, _('Stop')),
					E('button', {
						'id': 'btn-rescan',
						'class': 'cbi-button',
						'click': ui.createHandlerFn(this, 'handleRescan'),
						'disabled': !s.running
					}, _('Rescan Library'))
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Web Interface')),
				E('div', { 'style': 'margin-bottom:12px' }, [
					E('a', {
						'href': 'https://lyrion.gk2.secubox.in/',
						'target': '_blank',
						'class': 'cbi-button cbi-button-action',
						'style': 'margin-right:8px'
					}, _('Open Lyrion Web UI')),
					E('span', { 'style': 'color:#888' },
						'https://lyrion.gk2.secubox.in/')
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Service Info')),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'style': 'width:150px' }, _('Port')),
						E('td', { 'class': 'td' }, String(s.port || 9000))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, _('Runtime')),
						E('td', { 'class': 'td' }, s.detected_runtime || 'auto')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, _('Media Path')),
						E('td', { 'class': 'td' }, s.media_path || '/srv/media')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, _('Library')),
						E('td', { 'class': 'td', 'id': 'library-stats' },
							(s.songs || 0) + ' songs, ' + (s.albums || 0) + ' albums, ' + (s.artists || 0) + ' artists')
					])
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
