'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({ object: 'luci.lyrion', method: 'status', expect: {} });
var callLibraryStats = rpc.declare({ object: 'luci.lyrion', method: 'get_library_stats', expect: {} });
var callInstall = rpc.declare({ object: 'luci.lyrion', method: 'install', expect: {} });
var callStart = rpc.declare({ object: 'luci.lyrion', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.lyrion', method: 'stop', expect: {} });
var callRestart = rpc.declare({ object: 'luci.lyrion', method: 'restart', expect: {} });
var callRescan = rpc.declare({ object: 'luci.lyrion', method: 'rescan', expect: {} });

return view.extend({
	pollActive: true,
	libraryStats: null,

	load: function() {
		return Promise.all([callStatus(), callLibraryStats()]);
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;
		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();
			return Promise.all([callStatus(), callLibraryStats()]).then(L.bind(function(results) {
				this.updateStatus(results[0]);
				this.updateLibraryStats(results[1]);
			}, this));
		}, this), 3);
	},

	updateStatus: function(status) {
		var badge = document.getElementById('lyrion-status-badge');
		if (badge) {
			badge.innerHTML = '';
			badge.appendChild(KissTheme.badge(status.running ? 'RUNNING' : 'STOPPED', status.running ? 'green' : 'red'));
		}
	},

	updateLibraryStats: function(stats) {
		if (!stats) return;
		this.libraryStats = stats;

		var statsEl = document.getElementById('lyrion-stats');
		if (statsEl) {
			statsEl.innerHTML = '';
			this.renderStats(stats).forEach(function(el) { statsEl.appendChild(el); });
		}

		var scanEl = document.getElementById('lyrion-scan');
		if (scanEl) {
			scanEl.innerHTML = '';
			scanEl.appendChild(this.renderScanStatus(stats));
		}
	},

	formatNumber: function(n) {
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
		return n.toString();
	},

	renderStats: function(stats) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(this.formatNumber(stats.songs || 0), 'Songs', c.purple),
			KissTheme.stat(this.formatNumber(stats.albums || 0), 'Albums', c.blue),
			KissTheme.stat(this.formatNumber(stats.artists || 0), 'Artists', c.green),
			KissTheme.stat(this.formatNumber(stats.genres || 0), 'Genres', c.orange)
		];
	},

	renderScanStatus: function(stats) {
		if (stats.scanning) {
			var pct = stats.scan_total > 0 ? Math.round((stats.scan_progress / stats.scan_total) * 100) : 0;
			return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
						E('span', { 'class': 'spinning', 'style': 'font-size: 14px;' }, '⏳'),
						E('span', { 'style': 'font-weight: 600;' }, 'Scanning...')
					]),
					E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' },
						(stats.scan_phase || 'Processing') + ' (' + stats.scan_progress + '/' + stats.scan_total + ')')
				]),
				E('div', { 'style': 'height: 8px; background: var(--kiss-bg); border-radius: 4px; overflow: hidden;' }, [
					E('div', { 'style': 'height: 100%; width: ' + pct + '%; background: linear-gradient(90deg, var(--kiss-purple), var(--kiss-blue)); border-radius: 4px; transition: width 0.3s;' })
				])
			]);
		} else {
			return E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', { 'style': 'display: flex; align-items: center; gap: 8px; color: var(--kiss-green);' }, [
					E('span', {}, '✓'),
					E('span', { 'style': 'font-weight: 600;' }, 'Library Ready')
				]),
				E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'DB: ' + (stats.db_size || '0'))
			]);
		}
	},

	renderControls: function(status) {
		return E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': ui.createHandlerFn(this, 'handleStart'),
				'disabled': status.running
			}, 'Start'),
			E('button', {
				'class': 'kiss-btn kiss-btn-red',
				'click': ui.createHandlerFn(this, 'handleStop'),
				'disabled': !status.running
			}, 'Stop'),
			E('button', {
				'class': 'kiss-btn',
				'click': ui.createHandlerFn(this, 'handleRestart'),
				'disabled': !status.running
			}, 'Restart'),
			E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'click': ui.createHandlerFn(this, 'handleRescan'),
				'disabled': !status.running
			}, 'Rescan Library')
		]);
	},

	renderServiceInfo: function(status) {
		var checks = [
			{ label: 'Runtime', value: status.detected_runtime || 'auto' },
			{ label: 'Port', value: status.port || '9000' },
			{ label: 'Memory', value: status.memory_limit || '256M' },
			{ label: 'Media Path', value: status.media_path || '/srv/media' }
		];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
			checks.map(function(c) {
				return E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
					E('span', { 'style': 'color: var(--kiss-muted);' }, c.label),
					E('span', { 'style': 'font-family: monospace;' }, c.value)
				]);
			})
		);
	},

	handleInstall: function() {
		var self = this;
		ui.showModal('Installing Lyrion', [
			E('p', { 'class': 'spinning' }, 'Installing Lyrion Music Server. This may take several minutes...')
		]);
		callInstall().then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', r.message || 'Installation started'));
				self.startPolling();
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown error')), 'error');
			}
		});
	},

	handleStart: function() {
		ui.showModal('Starting...', [E('p', { 'class': 'spinning' }, 'Starting Lyrion...')]);
		callStart().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', 'Lyrion started'));
		});
	},

	handleStop: function() {
		ui.showModal('Stopping...', [E('p', { 'class': 'spinning' }, 'Stopping Lyrion...')]);
		callStop().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', 'Lyrion stopped'));
		});
	},

	handleRestart: function() {
		ui.showModal('Restarting...', [E('p', { 'class': 'spinning' }, 'Restarting Lyrion...')]);
		callRestart().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', 'Lyrion restarted'));
		});
	},

	handleRescan: function() {
		callRescan().then(function(r) {
			if (r.success) ui.addNotification(null, E('p', 'Library rescan started'));
		});
	},

	render: function(data) {
		var status = data[0] || {};
		var stats = data[1] || {};
		this.libraryStats = stats;

		// Not installed view
		if (!status.installed) {
			var notInstalledContent = [
				E('div', { 'style': 'margin-bottom: 24px;' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
						E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Lyrion Music Server'),
						KissTheme.badge('NOT INSTALLED', 'red')
					]),
					E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Self-hosted music streaming with Squeezebox compatibility')
				]),

				KissTheme.card('Install', E('div', { 'style': 'text-align: center; padding: 40px;' }, [
					E('div', { 'style': 'font-size: 4rem; margin-bottom: 16px;' }, '🎵'),
					E('h3', { 'style': 'margin: 0 0 8px 0;' }, 'Lyrion Music Server'),
					E('p', { 'style': 'color: var(--kiss-muted); margin: 0 0 20px 0;' }, 'Self-hosted music streaming with Squeezebox compatibility.'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': ui.createHandlerFn(this, 'handleInstall'),
						'disabled': status.detected_runtime === 'none'
					}, 'Install Lyrion')
				]))
			];

			return KissTheme.wrap(notInstalledContent, 'admin/services/lyrion/overview');
		}

		// Installed view
		this.startPolling();

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Lyrion Music Server'),
					E('span', { 'id': 'lyrion-status-badge' }, [
						KissTheme.badge(status.running ? 'RUNNING' : 'STOPPED', status.running ? 'green' : 'red')
					])
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Self-hosted music streaming')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'lyrion-stats', 'style': 'margin: 20px 0;' }, this.renderStats(stats)),

			// Scan progress
			KissTheme.card('Library Status', E('div', { 'id': 'lyrion-scan' }, [this.renderScanStatus(stats)])),

			// Two-column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Service Info', this.renderServiceInfo(status)),
				KissTheme.card('Controls', this.renderControls(status))
			]),

			// Web UI link
			status.running && status.web_accessible ? KissTheme.card('Web Interface',
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('div', { 'style': 'font-size: 2rem;' }, '🌐'),
					E('div', { 'style': 'flex: 1;' }, [
						E('div', { 'style': 'font-weight: 600;' }, 'Lyrion Web Interface'),
						E('div', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-purple);' }, status.web_url)
					]),
					E('a', {
						'href': status.web_url,
						'target': '_blank',
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'text-decoration: none;'
					}, 'Open')
				])
			) : ''
		];

		return KissTheme.wrap(content, 'admin/services/lyrion/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
